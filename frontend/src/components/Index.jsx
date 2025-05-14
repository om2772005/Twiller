import axios from 'axios';
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';

const Index = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
    const { t ,i18n} = useTranslation(); 

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
      } catch (error) {
        console.error("Error fetching user data:", error);
        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    const fetchPosts = async () => {
      try {
        const response = await axios.get("https://twitter-p984.onrender.com/postsindex", {
          withCredentials: true,
        });
        setPosts(response.data.posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (window.location.pathname === "/home") {
      fetchUserData();
      fetchPosts();
    }
  }, [navigate]);

  return (
    <div className="flex-1 p-3" key={i18n.language}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{t('whatsHappening')}</h2>
      </div>

      <input type="text" placeholder="Search" className="p-2 border rounded-lg w-full mb-4" />

      <div className="border p-4 rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <img src={user ? user.profilePic : ''} alt="User" className="w-10 h-10 rounded-full" />
          <input type="text" placeholder="What is happening?!" className="flex-1 p-2 border rounded-lg" />
          <button className="bg-blue-500 text-white px-4 py-2 rounded-lg">{t("post")}</button>
        </div>
        <button onClick={() => navigate('/profile')} className="w-full text-blue-500 mt-2 hover: cursor-pointer hover:text-red-700">{t("showPosts")}</button>
      </div>

      {loading ? (
        <p>Loading posts...</p>
      ) : (
        posts.map((post, index) => (
          <div key={index} className="border p-4 rounded-lg mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <img
                src={post.user?.profilePic || "https://via.placeholder.com/40"}
                alt={post.user?.username || "User"}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <span className="font-bold">{post.user?.username || "Unknown User"}</span>{" "}
                <span className="text-gray-500">· {new Date(post.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <p className="mb-2">{post.tweet}</p>

            {post.image && (
              <img src={post.image} alt="Post Image" className="rounded-lg mb-2" />
            )}

            {post.audio && (
              <audio controls className="w-full mb-2">
                <source src={post.audio} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}

            {post.video && (
              <video controls className="w-full rounded-lg">
                <source src={post.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Index;
