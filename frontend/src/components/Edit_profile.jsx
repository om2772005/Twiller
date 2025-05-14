import axios from "axios";
import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaCamera } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const EditProfile = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [loc, setLoc] = useState("");
  const [web, setWeb] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("https://twitter-p984.onrender.com/home", {
          headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  },
          withCredentials: true,
        });
        setUser(response.data.user);
        setName(response.data.user.name || "");
        setBio(response.data.user.bio || "");
        setLoc(response.data.user.loc || "");
        setWeb(response.data.user.web || "");
        setProfilePic(response.data.user.profilePic || "");
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    if (window.location.pathname === "/edit") fetchUserData();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!user?._id) return;
        const response = await axios.get(`https://twitter-p984.onrender.com/postdata/${user._id}`, {
          withCredentials: true,
        });

        if (!Array.isArray(response.data)) throw new Error("Invalid posts response");
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      }
    };
    fetchPosts();
  }, [user]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePic(URL.createObjectURL(file)); 
      setProfilePicFile(file);
    }
  };

  const updateUser = async () => {
    const formData = new FormData();

    if (name.trim() !== "") formData.append("name", name);
    if (bio.trim() !== "") formData.append("bio", bio);
    if (loc.trim() !== "") formData.append("loc", loc);
    if (web.trim() !== "") formData.append("web", web);
    if (profilePicFile) formData.append("image", profilePicFile);

    if ([...formData.entries()].length === 0) {
      console.log("No valid fields to update");
      return;
    }

    try {
      const response = await axios.post("https://twitter-p984.onrender.com/edit", formData, {
        
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("User updated:", response.data);
      navigate("/profile");
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 text-black flex flex-col items-center">

      <div className="bg-zinc-700 h-14 w-full p-3 flex items-center gap-4 sticky top-0 z-1 shadow-md">
        <FaArrowLeft
          className="text-xl text-white cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <div>
          <h1 className="text-lg font-bold text-white">{user ? user.name : "Loading..."}</h1>
          <p className="text-sm text-gray-400">{posts.length} {t("posts")}</p>
        </div>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 mt-6 w-11/12 max-w-md text-center">
        <h1 className="text-2xl font-semibold text-gray-700 mb-4">{t("editYourProfile")}</h1>

        <div className="relative w-32 h-32 mx-auto group">
          <img
            src={profilePic || "https://via.placeholder.com/150"}
            alt="Profile"
            className="w-32 h-32 rounded-full border-4 border-gray-300 object-cover"
          />
          <div className="absolute bottom-2 right-2 bg-gray-800 text-white p-2 rounded-full cursor-pointer transition-opacity opacity-0 group-hover:opacity-100">
            <label className="cursor-pointer">
              <FaCamera className="text-lg" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
          </div>
        </div>

        <div className="mt-6 text-left">
          <label className="block text-gray-600 font-medium mb-1">{t("name")}</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mt-4 text-left">
          <label className="block text-gray-600 font-medium mb-1">{t("bio")}</label>
          <textarea
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          ></textarea>
        </div>

        <div className="mt-4 text-left">
          <label className="block text-gray-600 font-medium mb-1">{t("location")}</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={loc}
            onChange={(e) => setLoc(e.target.value)}
          />
        </div>
        <div className="mt-4 text-left">
          <label className="block text-gray-600 font-medium mb-1">{t("website")}</label>
          <input
            type="text"
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={web}
            onChange={(e) => setWeb(e.target.value)}
          />
        </div>

        <button
          className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition"
          onClick={updateUser}
        >
          {t("saveChanges")}
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
