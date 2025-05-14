import google from '../assets/images/google.png';
import twitterLogo from '../assets/images/twitter.png';
import i18n from '../i18n';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '../firebase';
import GoogleModal from "../components/Google";
import { Link } from 'react-router-dom';
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
      const [popupMessage, setPopupMessage] = useState("");
  const [isPopupVisible, setPopupVisible] = useState(false);


    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('https://twitter-p984.onrender.com/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Login failed.');

            localStorage.removeItem('i18nextLng');
            i18n.changeLanguage('en');
            localStorage.setItem('token', data.token);
            navigate('/home');
        } catch (error) {
            alert(error.message);
        }
    };
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
                    <h1 className="text-3xl font-bold">Login to your account!</h1>

                    <form className="mt-6 space-y-4" onSubmit={handleLogin}>
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none"
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none"
                            required
                        />
                        <h1 className="text-xs">
                            Forget password?{' '}
                            <a href="/forgetpass" className="text-blue-700">
                                click here
                            </a>
                        </h1>
                        <button className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600">
                            Login
                        </button>
                    </form>

                    <div className="flex items-center my-4">
                        <hr className="w-full border-gray-300" />
                        <span className="px-2 text-gray-500">or</span>
                        <hr className="w-full border-gray-300" />
                    </div>

                    <button
                        className="w-full flex items-center justify-center border rounded-lg py-2 hover:bg-gray-100"
                        onClick={handleGoogleSignIn}
                    >
                        <img src={google} alt="Google" className="w-5 h-5 mr-2" />
                        Log in with Google
                    </button>

                    <p className="text-gray-500 text-sm mt-4">
                        Not have an account?{' '}
                        <Link to="/sign" className="text-blue-500 font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
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

export default Login;
