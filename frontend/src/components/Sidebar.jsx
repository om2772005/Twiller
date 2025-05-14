import {
  FaHome,
  FaSearch,
  FaBell,
  FaEnvelope,
  FaBookmark,
  FaUser,
  FaEllipsisH,
  FaFeather,
  FaCrown,
} from "react-icons/fa";
import twitter from "../assets/images/twitter.png";
import React, { useState, useEffect } from "react";
import PostModal from "./PostModal";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import OTPModal from "./OTPModal"; 

const Sidebar = ({ setBlur }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isTweetOpen, setIsTweetOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [pendingLang, setPendingLang] = useState(null);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleLogout = async () => {
    try {
      await fetch("https://twitter-p984.onrender.com/logout", {
        method: "POST",
        credentials: "include",
      });
      navigate("/login");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

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

    const path = window.location.pathname;
    if (
      ["/home", "/profile", "/edit", "/explore", "/subscribe"].includes(path)
    ) {
      fetchUserData();
    }
  }, []);

  const handleLanguageChange = async (e) => {
    const lang = e.target.value;
    const token = localStorage.getItem("token");

    if (lang === "en") {
      i18n.changeLanguage(lang);
      return;
    }

    try {
      const email = user?.email;
      if (!email) return alert("Email not found!");

      await axios.post(
        "https://twitter-p984.onrender.com/send-email-otp",
        { reason: "language-change" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPendingLang(lang);
      setOtpModalOpen(true);
    } catch (err) {
      console.error("OTP send error:", err);
      alert("Failed to send OTP.");
    }
  };

  const handleOTPVerify = async (enteredOtp) => {
    try {
      const res = await axios.post("https://twitter-p984.onrender.com/verify-email-otp", {
        email: user?.email,
        otp: enteredOtp,
      });

      if (res.data.success) {
        i18n.changeLanguage(pendingLang);
        alert("Language changed successfully!");
      } else {
        alert("Invalid OTP.");
      }
    } catch (error) {
      alert("Verification failed.");
    } finally {
      setOtpModalOpen(false);
      setPendingLang(null);
    }
  };

  return (
    <div className="w-64 h-screen p-4 border-r flex flex-col justify-between">
      <nav className="space-y-4">
        <div className="text-xl font-bold flex items-center space-x-2">
          <img src={twitter} alt="Logo" className="w-8 h-8" />
          <span>Twiller</span>
        </div>
        <ul className="p-5 space-y-2">
          <Link to='/home'>
            <li className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded cursor-pointer">
              <FaHome /> <span>{t("home")}</span>
            </li>
          </Link>
          <Link to="/explore">
            <li className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded cursor-pointer">
              <FaSearch /> <span>{t("explore")}</span>
            </li>
          </Link>
          <li className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded cursor-pointer">
            <FaBell /> <span>{t("notifications")}</span>
          </li>
          <li className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded cursor-pointer">
            <FaEnvelope /> <span>{t("messages")}</span>
          </li>
          <li className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded cursor-pointer">
            <FaBookmark /> <span>{t("bookmarks")}</span>
          </li>
          <Link to="/profile">
            <li className="flex items-center space-x-2 p-2 hover:bg-gray-200 rounded cursor-pointer">
              <FaUser /> <span>{t("profile")}</span>
            </li>
          </Link>
        </ul>

        <div className="mt-auto">
          <button
            onClick={() => setBlur(true)}
            className="w-full bg-blue-500 text-white py-3 rounded-full text-lg font-semibold shadow-xl hover:scale-105 transform transition-all duration-300 ease-in-out hover:bg-red-600"
          >
            <FaFeather className="inline-block mr-2" />
            {t("tweet")}
          </button>
        </div>

        <div className="mt-3">
          <button
            onClick={() => navigate("/subscribe")}
            className="w-full bg-yellow-300 text-black py-3 rounded-full text-lg font-semibold shadow-xl transform transition-all duration-300 ease-in-out hover:bg-yellow-500 hover:text-white hover:scale-110 animate-pulse"
          >
            <FaCrown className="inline-block ml-2" /> {t("subscribe")}
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="language" className="text-sm font-semibold text-gray-700 mb-1 block">
            {t("changeLanguage")} 🌐
          </label>
          <select
            id="language"
            className="w-full p-2 rounded-md border border-gray-300 focus:outline-none"
            onChange={handleLanguageChange}
            value={i18n.language}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="hi">हिंदी</option>
            <option value="pt">Português</option>
            <option value="zh">中文</option>
            <option value="fr">Français</option>
          </select>
        </div>
          <div id="recaptcha-container"></div>
      </nav>

      <PostModal isOpen={isTweetOpen} onClose={() => setIsTweetOpen(false)} />

      <div className="relative">
        <button
          className="flex items-center space-x-3 p-2 w-full rounded-full hover:bg-gray-200"
          onClick={() => setIsOpen(!isOpen)}
        >
          <img
            className="w-12 h-12 rounded-full"
            src={user ? user.profilePic : ""}
            alt="Profile"
          />
          <div className="flex flex-col">
            <h1 className="text-lg font-bold">{user ? user.name : ""}</h1>
            <h4 className="text-xs text-gray-500">{user ? user.username : ""}</h4>
          </div>
          <FaEllipsisH className="ml-auto" />
        </button>

        {isOpen && (
          <div className="absolute bottom-16 left-0 w-56 bg-white text-black rounded-lg shadow-lg">
            <div className="p-3 space-y-2">
              <button className="block w-full text-left px-4 py-2 hover:bg-gray-300 rounded-md">
                {t("addAccount")}
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-300 rounded-md"
                onClick={handleLogout}
              >
                {t("logout")} @{user ? user.username : ""}
              </button>
            </div>
          </div>
        )}
      </div>

      {otpModalOpen && (
        <OTPModal
          email={user?.email}
          onVerify={handleOTPVerify}
          onClose={() => {
            setOtpModalOpen(false);
            setPendingLang(null);
          }}
        />
      )}
    </div>
  );
};

export default Sidebar;
