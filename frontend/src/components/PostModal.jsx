import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaImage, FaChartBar, FaSmile, FaCalendarAlt, FaGlobeAmericas, FaTimes, FaMicrophone, FaStop, FaVideo } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const MAX_CHAR = 280;

const PostModal = ({ isOpen, onClose }) => {
  const [tweet, setTweet] = useState("");
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null); 
  const [videoPreview, setVideoPreview] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const {t} = useTranslation();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("https://twitter-p984.onrender.com/home", {headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  },
          withCredentials: true,
        });
        setUser(response.data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    if (["/home", "/profile", "/explore","/subscribe"].includes(window.location.pathname)) {
      fetchUserData();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => (document.body.style.overflow = "auto");
  }, [isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => { 
    const file = e.target.files[0];
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleStartRecording = async () => {
    try {
 const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const options = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? { mimeType: "audio/webm;codecs=opus" }
      : {};      
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioFile = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(audioFile);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleOtpRequest = async () => {
    try {
      await axios.post("https://twitter-p984.onrender.com/request-audio-otp", {}, { withCredentials: true });
      setOtpSent(true);
      alert("OTP sent to your email!");
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP");
    }
  };

  const handlePost = async () => {
    if (!tweet.trim() && !image && !video && !audioBlob) return;

    if (audioBlob && !otpSent) {
      alert("Please request an OTP before posting an audio!");
      return;
    }

    const formData = new FormData();
    formData.append("tweet", tweet);
    if (image) {
      formData.append("image", image);
    }
    if (video) { 
      formData.append("video", video);
    }
    if (audioBlob) {
      formData.append("audio", audioBlob);
    }
    if (otp) {
      formData.append("otp", otp);
    }

    setIsPosting(true);

    try {
      const response = await axios.post("https://twitter-p984.onrender.com/post", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      console.log("Post successful:", response.data);
      onClose();
      setTweet("");
      setImage(null);
      setVideo(null); 
      setImagePreview(null);
      setVideoPreview(null); 
      setAudioBlob(null);
      setOtp(""); 
      setOtpSent(false);
    } catch (error) {
      console.error("Error posting tweet:", error);
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="fixed inset-0 backdrop-blur-lg bg-black/40 z-30"></div>
      <div className="relative bg-white z-50 text-black w-[550px] p-4 rounded-xl shadow-lg border border-gray-700">
        <button className="absolute top-2 left-2 text-gray-500 hover:text-black" onClick={onClose}>
          <FaTimes size={18} />
        </button>
        <span className="absolute top-2 right-4 text-blue-700 text-sm cursor-pointer">{t("drafts")}</span>
        <div className="flex space-x-3 mt-4">
          <img src={user ? user.profilePic : ''} alt="Profile" className="w-10 h-10 rounded-full" />
          <div className="w-full">
            <textarea
              className="w-full bg-transparent text-lg text-gray-900 border-none focus:ring-0 focus:outline-none resize-none overflow-hidden"
              rows="1"
              maxLength={MAX_CHAR}
              value={tweet}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHAR) setTweet(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
              }}
              placeholder={t("whatsHappening")}
            ></textarea>
            <button className="flex items-center space-x-2 text-blue-700 text-sm mt-1 hover:underline">
              <FaGlobeAmericas /> <span>{t("everyoneCanReply")}</span>
            </button>
          </div>
        </div>
        {imagePreview && (
          <div className="mt-2">
            <img src={imagePreview} alt="Preview" className="w-full rounded-lg" />
          </div>
        )}
        {videoPreview && (
          <div className="mt-2">
            <video controls src={videoPreview} className="w-full rounded-lg" />
          </div>
        )}
        {audioBlob && (
          <div className="mt-2">
            <audio controls src={URL.createObjectURL(audioBlob)} />
          </div>
        )}
        {audioBlob && !otpSent && (
          <button
            className="mt-2 text-blue-600 text-sm hover:underline"
            onClick={handleOtpRequest}
          >
            {t("requestOtpAudio")}
          </button>
        )}
        {audioBlob && otpSent && (
          <input
            className="mt-2 w-full border px-2 py-1 rounded"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
        )}
        <div className="border-b border-gray-700 my-3"></div>
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 text-blue-700">
            <label>
              <FaImage size={18} className="cursor-pointer" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <label>
              <FaVideo size={18} className="cursor-pointer" />
              <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} /> {/* Video file input */}
            </label>
            <FaChartBar size={18} className="cursor-pointer" />
            <FaSmile size={18} className="cursor-pointer" />
            <FaCalendarAlt size={18} className="cursor-pointer" />
            {isRecording ? (
              <FaStop size={18} className="cursor-pointer text-red-600" onClick={handleStopRecording} />
            ) : (
              <FaMicrophone size={18} className="cursor-pointer" onClick={handleStartRecording} />
            )}
          </div>
          <button className="px-4 py-2 rounded-full bg-blue-500 text-white font-bold" onClick={handlePost}>
            {isPosting ? t("posting") : t("post")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostModal;
