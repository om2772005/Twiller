import { useState } from "react";
import google from "../assets/images/google.png";
import twitterLogo from "../assets/images/twitter.png";
import OTPModal from "../components/OTPMODAL";
import GoogleModal from "../components/Google";
import { auth, provider, signInWithPopup } from "../firebase"
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";

const Sign = () => {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setPopupVisible] = useState(false);

  const [googleEmail, setGoogleEmail] = useState("");
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const handleGoogleSignIn = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    setGoogleEmail(user.email);

    const checkUserRes = await fetch("https://twitter-p984.onrender.com/check-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" ,
      },
      body: JSON.stringify({ email: user.email }),
      credentials: "include",
    });

    const checkUserData = await checkUserRes.json();

    if (checkUserData.exists) {
      setPopupMessage("Login successful!");
      setPopupVisible(true);
      localStorage.setItem('token', checkUserData.token);
      navigate('/home');
    } else {
      setGoogleModalOpen(true);
    }
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    alert("Google sign-in failed");
  }
};


  const handleGoogleFormSubmit = async ({ name, username, password, email }) => {
    try {
      const res = await fetch("https://twitter-p984.onrender.com/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
        credentials: "include",
      });

      const raw = await res.text();
      const data = JSON.parse(raw);

      if (data.redirectTo) {
        setPopupMessage("Registration successful!");
        setPopupVisible(true);
        setTimeout(() => {
          window.location.href = data.redirectTo;
        }, 1500);
      } else {
        alert("Registration failed.");
      }
    } catch (error) {
      console.error("Error submitting Google data:", error);
      alert("Something went wrong.");
    } finally {
      setGoogleModalOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const otpRes = await fetch("https://twitter-p984.onrender.com/sign-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason: "sign-up" }),
      });

      const otpData = await otpRes.json();
      if (otpData.success) {
        setOtpModalOpen(true);
      } else {
        alert(otpData.message || "Failed to send OTP.");
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      alert("Failed to send OTP.");
    }
  };

  const handleVerifyOTP = async (enteredOtp) => {
    try {
      const verifyRes = await fetch("https://twitter-p984.onrender.com/verify-email-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: enteredOtp }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        alert("Invalid OTP. Please try again.");
        return;
      }

      const response = await fetch("https://twitter-p984.onrender.com/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, email, password }),
        credentials: "include",
      });

      const raw = await response.text();
      const data = JSON.parse(raw);

      if (data.redirectTo) {
        setPopupMessage("Registration successful!");
        setPopupVisible(true);
        setTimeout(() => (window.location.href = data.redirectTo), 1500);
      } else {
        alert("Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred.");
    } finally {
      setOtpModalOpen(false);
    }
  };

  return (
    <div className="flex justify-center px-8 py-12">
      <div className="flex w-[900px] overflow-hidden">
        <div className="w-1/2 flex items-center justify-center bg-blue-500">
          <img
            src="https://abs.twimg.com/sticky/illustrations/lohp_en_1302x955.png"
            alt="Twitter Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="w-1/2 flex flex-col justify-center px-10 py-8 bg-white">
          <img src={twitterLogo} alt="Twitter Logo" className="w-8 mb-4" />
          <h1 className="text-3xl font-bold">Happening now</h1>
          <h2 className="text-xl font-semibold mt-2">Join Twiller today</h2>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              required
            />
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg bg-gray-100"
              required
            />

            <button className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600">
              Sign Up
            </button>
          </form>

          <div className="flex items-center my-4">
            <hr className="w-full border-gray-300" />
            <span className="px-2 text-gray-500">or</span>
            <hr className="w-full border-gray-300" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center border rounded-lg py-2 hover:bg-gray-100"
          >
            <img src={google} alt="Google" className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>

          <p className="text-gray-500 text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-500 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>

      {isPopupVisible && (
        <div className="fixed bottom-5 right-5 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          {popupMessage}
        </div>
      )}

      {otpModalOpen && (
        <OTPModal
          email={email}
          onVerify={handleVerifyOTP}
          onClose={() => setOtpModalOpen(false)}
        />
      )}

      {googleModalOpen && (
        <GoogleModal
          email={googleEmail}
          onSubmit={handleGoogleFormSubmit}
          onClose={() => setGoogleModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Sign;
