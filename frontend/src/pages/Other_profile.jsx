import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Content from "../components/Contents";
import PostModal from "../components/PostModal";
import axios from "axios";
import { FaArrowLeft, FaEarthAmericas } from "react-icons/fa6";
import { IoIosFlag } from "react-icons/io";
import moment from "moment";
import { useTranslation } from "react-i18next";
import twitter from "../assets/images/twitter.png";

const Other_profile = () => {
  const [isBlurred, setIsBlurred] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get(`https://twitter-p984.onrender.com/profile/${id}`, { withCredentials: true });
        setUser(response.data);
      } catch (err) {
        console.error("Error fetching profile", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [id]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        if (!user?._id) return;
        const response = await axios.get(`https://twitter-p984.onrender.com/postdata/${user._id}`, { withCredentials: true });
        setPosts(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error("Error fetching posts", err);
        setPosts([]);
      }
    };
    fetchPosts();
  }, [user]);

  const handleVideoClick = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const handleDoubleTap = () => {
    console.log("Double tapped video");
  };

  if (loading) return <div className="text-center mt-10">Loading profile...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

  return (
    <div className="relative w-screen h-screen overflow-x-hidden">
      {isBlurred && <div className="fixed inset-0 bg-black/40 backdrop-blur-lg z-20" />}

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-md">
        <div className="flex items-center space-x-2 font-bold text-xl">
          <img src={twitter} alt="logo" className="w-8 h-8" />
          <span>Twiller</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="bg-gray-800 text-white px-3 py-2 rounded-md">
          ☰
        </button>
      </div>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="bg-white w-68 h-screen shadow-lg p-4 overflow-y-auto overflow-x-hidden">
            <button onClick={() => setIsSidebarOpen(false)} className="font-bold text-black mb-4">
              ✕ Close
            </button>
            <Sidebar setBlur={setIsBlurred} />
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      <div className={`flex flex-col lg:flex-row lg:px-45 transition-all duration-300 ${isBlurred ? "blur-md pointer-events-none" : ""}`}>
        <div className="hidden lg:block w-63 sticky top-0 h-screen">
          <Sidebar setBlur={setIsBlurred} />
        </div>
        <div className="flex-1 min-h-screen mt-[80px] lg:mt-0 pl-1 pr-4">
          <div className="bg-white text-black">
            <div className="bg-zinc-700 h-12 p-2 flex items-center gap-4 sticky top-0 z-1">
              <FaArrowLeft className="text-xl text-white cursor-pointer" onClick={() => navigate(-1)} />
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-white">{user?.name}</h1>
                <p className="text-sm text-gray-400">{posts?.length || 0} posts</p>
              </div>
            </div>

            <div className="h-48 bg-gray-300" />
            <div className="relative px-6">
              <div className="absolute -top-16 left-6">
                <img
                  src={user?.profilePic || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white"
                />
              </div>
              <div className="flex justify-end">
                <button className="mt-4 px-4 py-2 border border-gray-400 rounded-full hover:bg-gray-100">Follow</button>
              </div>

              <div className="mt-4">
                <h1 className="text-2xl font-bold">{user?.name}</h1>
                <p className="text-gray-500">@{user?.username}</p>
                <p>{user?.bio}</p>
                <h3 className="text-blue-700 flex items-center">
                  <IoIosFlag className="mr-2" /> {user?.loc}
                </h3>
                <h3 className="text-red-500 flex items-center">
                  <FaEarthAmericas className="mr-2" /> {user?.web}
                </h3>
                <p className="text-gray-600 flex items-center">
                  📅 Joined {moment(user?.createdAt).format("DD MMMM YYYY")}
                </p>

                <div className="flex space-x-4 mt-2">
                  <span className="font-semibold">{user?.following?.length || 0}</span>
                  <span className="text-gray-600">Following</span>
                  <span className="font-semibold">{user?.followers?.length || 0}</span>
                  <span className="text-gray-600">Followers</span>
                </div>
              </div>

              <div className="mt-6 border-b">
                <span className="font-bold border-b-2 border-black pb-2">Posts</span>
              </div>

              <div className="p-4">
                {loading ? (
                  <p className="text-center text-gray-500">{t("loadingPosts")}</p>
                ) : posts?.length > 0 ? (
                  posts.map((post) => (
                    <div key={post._id} className="border-b py-4">
                      <h2 className="font-bold">{user?.name}</h2>
                      <p className="text-sm text-gray-600">{moment(post.createdAt).fromNow()}</p>
                      <p className="mt-2">{post.tweet}</p>
                      {post.image && <img src={post.image} alt="Post" className="mt-2 rounded-lg max-w-full" />}
                      {post.audio && (
                        <audio controls className="mt-2 w-full">
                          <source src={post.audio} type="audio/mpeg" />
                        </audio>
                      )}
                      {post.video && (
                        <video
                          ref={videoRef}
                          controls
                          className="mt-2 w-full rounded-lg"
                          onClick={handleVideoClick}
                          onDoubleClick={handleDoubleTap}
                        >
                          <source src={post.video} type="video/mp4" />
                        </video>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500">{t("noPostsAvailable")}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block w-[1px] bg-gray-300 h-full"></div>
        <div className="hidden lg:block w-78 sticky top-0 h-screen">
          <Content setBlur={setIsBlurred} />
        </div>
      </div>

      <PostModal isOpen={isBlurred} onClose={() => setIsBlurred(false)} />
    </div>
  );
};

export default Other_profile;
