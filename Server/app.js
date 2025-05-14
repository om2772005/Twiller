const express = require('express');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const cors = require('cors');
const Razorpay = require("razorpay");
const bcrypt = require('bcrypt');
const user = require('./modules/user');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { ObjectId } = require("mongoose").Types;
const multer = require('multer');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const fileType = require('file-type');

const Post = require('./modules/Post')
const app = express();
const SECRET = process.env.JWT_SECRET;
const http = require("http");
const { Server } = require("socket.io");
const admin = require('firebase-admin');
const serviceAccount = require('../key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
const { Readable } = require('stream');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});
io.on("connection", (socket) => {
  setTimeout(() => {
    socket.emit('newNotification', {
      tweet: "Welcome to Twitter!",
      username: "Admin"
    });
  }, 5000);

  socket.on("disconnect", () => {
  });
});
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });
app.post('/sign', async (req, res) => {
  try {
    const { username, name, email, password } = req.body;


    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);


    const newuser = await user.create({
      username,
      name,
      email,
      password: hash
    });

    const token = jwt.sign({ id: newuser._id, email: newuser.email }, SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });


    return res.status(201).json({ redirectTo: "/home" });

  } catch (error) {
    console.error("Signup Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post('/check-user', async (req, res) => {
  
  const { email } = req.body;

  try {
    const users = await user.findOne({ email });

    if (users) {
       const token = jwt.sign({ id: users._id, email: users.email }, SECRET);

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });
      res.json({ exists: true, token});

      
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post('/sign-otp',async (req,res)=>{
  const { email,reason } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const otp = generateOTP();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: "your_email@gmail.com",
      to: email,
      subject: "OTP Verification",
      text: `Your OTP for ${reason || "verification"} is: ${otp}`,
    });

    res.json({ success: true, message: "OTP sent to email." });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }

})
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;


    const foundUser = await user.findOne({ email });
    if (!foundUser) {
      return res.status(401).json({ error: "User not found" });
    }


    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }


    const token = jwt.sign({ id: foundUser._id, email: foundUser.email }, SECRET);


    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });


    return res.json({ message: "Login successful", token, redirectTo: "/home" });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post('/google-login', async (req, res) => {
    const { token, email, name } = req.body;

    try {
        const decoded = await admin.auth().verifyIdToken(token);
        const users = await user.findOne({ email });

        if (users) {
            const jwtToken = jwt.sign({ id: users._id ,email: users.email},SECRET);
            return res.json({ token: jwtToken, newUser: false });
        } else {
            return res.json({ newUser: true, email, name });
        }
    } catch (err) {
        console.error(err);
        res.status(401).json({ message: 'Invalid Google token' });
    }
});
app.post('/google-register', async (req, res) => {
    const { email, fullName, username, password } = req.body;

    try {
        const existing = await user.findOne({ email });
        if (existing) return res.status(400).json({ message: 'User already exists' });

        const hashed = await bcrypt.hash(password, 10);
        const users = await user.create({
            email,
            fullName,
            username,
            password: hashed,
            fromGoogle: true
        });

        const token = jwt.sign({ id: users._id,email:users.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

const requireAuth = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];


  if (!token) {
    return res.status(401).json({ error: "Access denied. Please log in." });
  }

  try {
    const decoded = jwt.verify(token, SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};



app.get("/home",requireAuth, async (req, res) => {
  try {

    const dataUser = await user.findOne({ _id: new ObjectId(req.user.id) }).select("-password").lean();
    if (!dataUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json({ user: dataUser });

  } catch (error) {
    console.error("Home Route Error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post("/edit", upload.single("image"), async function (req, res) {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token missing" });

    const decoded = jwt.verify(token, SECRET);
    const userid = decoded.id;

    let updates = req.body;
    const uploadToCloudinary = async (buffer, folder) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(buffer);
      });
    };

    if (req.file && req.file.buffer) {
      const profileimageUrl = await uploadToCloudinary(req.file.buffer, "posts");
      updates.profilePic = profileimageUrl;
    }
    Object.keys(updates).forEach((key) => {
      if (updates[key] === "" || updates[key] === undefined) {
        delete updates[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    await user.findOneAndUpdate(
      { _id: userid },
      { $set: updates },
      { new: true }
    );

    return res.status(201).json({ redirectTo: "http://localhost:5173/profile" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      error: "Error updating user",
      details: error.message,
    });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,   
    sameSite: "None",
    path: '/', 
  });

  res.setHeader('Cache-Control', 'no-store');
  return res.json({ message: "Logout successful" });
});


app.get('/users', async function (req, res) {
  try {

    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }
    console.log(token)

    const decoded = jwt.verify(token, SECRET);
    console.log(decoded)


    if (!decoded.id) {
      return res.status(400).json({ error: "Invalid token: No user ID found" });
    }
    const users = await user.find({ _id: { $ne: new ObjectId(decoded.id) } });

    return res.json({ users });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/myfollowing", async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, SECRET);
    const User = await user.findById(decoded.id).select("following");

    if (!User) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ following: User.following });
  } catch (err) {
    console.error("Error fetching following:", err);
    res.status(500).json({ error: err.message });
  }
});
app.post("/follow/:id", async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, SECRET);
    const currentUser = await user.findById(decoded.id);
    const targetUser = await user.findById(req.params.id);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!currentUser.following.includes(targetUser._id)) {
      currentUser.following.push(targetUser._id);
      targetUser.followedBy.push(currentUser._id);
      await currentUser.save();
      await targetUser.save();
    }

    res.json({ success: true, message: "User followed" });
  } catch (err) {
    console.error("Error following user:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/unfollow/:id", async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, SECRET);
    const currentUser = await user.findById(decoded.id);
    const targetUser = await user.findById(req.params.id);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
    targetUser.followedBy = targetUser.followedBy.filter(id => id.toString() !== currentUser._id.toString());

    await currentUser.save();
    await targetUser.save();

    res.json({ success: true, message: "User unfollowed" });
  } catch (err) {
    console.error("Error unfollowing user:", err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/profile/:id", async (req, res) => {
  try {
    const User = await user.findById(req.params.id).select("-password"); 
    if (!User) {
      return res.status(404).json({ error: "User not found" });
    }
    console.log(User)
    res.json(User);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});





app.post('/post', requireAuth, upload.fields([{ name: 'image' }, { name: 'audio' },{name: 'video'}]), async (req, res) => {
  console.log("Body:", req.body);
  console.log("Files:", req.files);

  try {
    const { tweet, otp } = req.body;
    let imageUrl = null;
    let audioUrl = null;
    let videoUrl = null;

    const uploadToCloudinary = async (fileBuffer, folder) => {
      return new Promise((resolve, reject) => {
        if (!fileBuffer) return resolve(null);
        const stream = cloudinary.uploader.upload_stream(
          { folder, resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        );
        Readable.from(fileBuffer).pipe(stream);
      });
    };

    const currentUser = await user.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = moment().tz("Asia/Kolkata");
    const audioFile = req.files?.audio?.[0];

    if (audioFile) {
      if (!otp || otp !== currentUser.otp?.code || currentUser.otp.expiresAt < new Date()) {
        return res.status(401).json({ error: "Invalid or expired OTP" });
      }
      const hour = now.hour();
      if (hour < 1 || hour >= 19) {
        return res.status(403).json({ error: "Audio upload allowed only between 2 PM - 7 PM IST" });
      }
      if (audioFile.size > 100 * 1024 * 1024) {
        return res.status(413).json({ error: "Audio file exceeds 100MB limit" });
      }



      audioUrl = await uploadToCloudinary(audioFile.buffer, 'audio');
    }
    if (req.files?.image?.[0]?.buffer) {
      imageUrl = await uploadToCloudinary(req.files.image[0].buffer, 'posts');
    }
    if (req.files?.video?.[0].buffer){
      const videoFile = req.files.video[0]
      videoUrl = await uploadToCloudinary(videoFile.buffer, 'videos');
    }

    if (!tweet?.trim() && !imageUrl && !audioUrl) {
      return res.status(400).json({ error: "Post must include text, image, or audio" });
    }

    const postCountToday = await Post.countDocuments({
      user: req.user.id,
      createdAt: { $gte: now.startOf('day').toDate() }
    });

const followingCount = currentUser.following.length;
if (followingCount === 0) {
  if (!(hour === 10 && minute >= 0 && minute <= 30)) {
    return res.status(403).json({
      error: "You can only post between 10:00 AM - 10:30 AM IST if you don't follow anyone",
    });
  }
  if (postCountToday >= 1) {
    return res.status(403).json({
      error: "You can only post once a day if you don't follow anyone",
    });
  }
}
else if (followingCount <= 2) {
  if (postCountToday >= 2) {
    return res.status(403).json({
      error: "You can only post 2 times a day if you follow 1 or 2 users",
    });
  }
}

    const newPost = new Post({
      userid: req.user.id,
      tweet: tweet?.trim() || "",
      image: imageUrl,
      audio: audioUrl,
      video: videoUrl,
      createdAt: now.toDate()
    });

    await newPost.save();

    if ((tweet?.toLowerCase().includes("cricket") || tweet?.toLowerCase().includes("science")) && currentUser.notificationsEnabled) {
      io.emit("newNotification", { tweet, username: currentUser.username });
    }

    res.status(201).json({ message: "Post created successfully" });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});






app.get('/postdata/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId)
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const posts = await Post.find({ userid: userId });
    console.log({ posts })
    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.get('/postsindex', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userid', 'username profilePic') 
      .sort({ createdAt: -1 });

    const formattedPosts = posts.map(post => ({
      _id: post._id,
      tweet: post.tweet,
      image: post.image,
      audio: post.audio,
      video: post.video,
      createdAt: post.createdAt,
      user: post.userid ? {
        _id: post.userid._id,
        username: post.userid.username,
        profilePic: post.userid.profilePic,
      } : null,
    }));



    res.status(200).json({ posts: formattedPosts });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});








app.get('/postdata/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const posts = await Post.find({ userid: userId });

    res.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
});


app.get('/postsindex', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userid', 'username profilePic') 
      .sort({ createdAt: -1 });

    const formattedPosts = posts.map(post => ({
      _id: post._id,
      tweet: post.tweet,
      image: post.image,
      audio: post.audio,
      video: post.video,
      createdAt: post.createdAt,
      user: post.userid ? {
        _id: post.userid._id,
        username: post.userid.username,
        profilePic: post.userid.profilePic,
      } : null,
    }));


    res.status(200).json({ posts: formattedPosts });

  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});











app.post('/request-audio-otp', requireAuth, async (req, res) => {
  try {
    const userDoc = await user.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: "User not found" });

    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000; 

    userDoc.otp = { code: otpCode, expiresAt: new Date(otpExpiry) };
    await userDoc.save();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: '"Audio OTP" <your-email@gmail.com>',
      to: userDoc.email,
      subject: "Your Audio Upload OTP",
      text: `Your OTP is ${otpCode}. It will expire in 5 minutes.`,
    });

    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("OTP error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

app.get('/verify', async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]; 
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    const userEmail = decoded.email;

    const user = await user.findOne({ email: userEmail });
    if (user) {
      return res.status(200).json({ message: 'Token verified', redirect: '/home' });
    } else {
      return res.status(400).json({ message: 'User not found', redirect: '/sign' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Token verification failed', redirect: '/sign' });
  }
});



const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

const plans = {
  free: { amount: 0, currency: "INR" },
  bronze: { amount: 10000, currency: "INR" },
  silver: { amount: 30000, currency: "INR" },
  gold: { amount: 100000, currency: "INR" },
};
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post("/subscribe", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;
    const { planId } = req.body;
    if (!plans[planId]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const users = await user.findOne({ email });
    if (!users) return res.status(404).json({ message: "User not found" });
    if (planId === "free") {
      users.subscriptionPlan = "free";
      await users.save();

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Free Plan Activated 🎉",
        html: `<p>You have successfully activated the <b>Free Plan</b>.<br/>Enjoy your 1 tweet/month!</p>`,
      });

      return res.status(200).json({ message: "Free plan activated" });
    }
    const order = await razorpay.orders.create({
      amount: plans[planId].amount,
      currency: plans[planId].currency,
      receipt: `receipt_${Date.now()}`,
    });
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: `Invoice for ${planId} Plan`,
      html: `
        <h2>Subscription Invoice</h2>
        <p>Hi there,</p>
        <p>Here are your order details:</p>
        <ul>
          <li><strong>Plan:</strong> ${planId.charAt(0).toUpperCase() + planId.slice(1)}</li>
          <li><strong>Amount:</strong> ₹${plans[planId].amount / 100}</li>
          <li><strong>Order ID:</strong> ${order.id}</li>
        </ul>
        <p>Complete the payment to activate your plan.</p>
      `,
    });


    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});


app.post("/payment-success", async (req, res) => {
  const { paymentId, orderId, signature } = req.body;


  const isValid = razorpay.utils.verifyPaymentSignature({
    order_id: orderId,
    payment_id: paymentId,
    signature: signature,
  });

  if (!isValid) {
    return res.status(400).json({ message: "Invalid payment signature" });
  }
  try {
    const users = await user.findOne({ email: req.user.email });
    if (!users) return res.status(404).json({ message: "User not found" });

    const { planId } = req.body;
    if (!plans[planId]) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }
    users.subscriptionPlan = planId;
    await users.save();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: users.email,
      subject: `Payment Success - ${planId} Plan`,
      html: `
        <h2>Subscription Invoice</h2>
        <p>Hi there,</p>
        <p>Thank you for your payment. You have successfully subscribed to the <b>${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan</b>.</p>
        <p>Order ID: ${orderId}</p>
        <p>Amount: ₹${plans[planId].amount / 100}</p>
      `,
    });

    res.status(200).json({ message: "Payment and subscription updated successfully" });
  } catch (err) {
    console.error("Payment success error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
const otpStore = {};

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isOTPValid(stored, input) {
  return stored?.otp === input && stored?.expiresAt > Date.now();
}

app.post("/send-email-otp", async (req, res) => {
  const { reason } = req.body;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "JWT token not provided" });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return res.status(403).json({ message: "Invalid token" });
  }

  const { email } = decoded;
  if (!email) return res.status(400).json({ message: "Email is required." });

  const otp = generateOTP();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: "your_email@gmail.com",
      to: email,
      subject: "OTP Verification",
      text: `Your OTP for ${reason || "verification"} is: ${otp}`,
    });

    res.json({ success: true, message: "OTP sent to email." });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
});
app.post("/verify-email-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];

  if (isOTPValid(record, otp)) {
    delete otpStore[email];
    return res.json({ success: true, message: "Email verified." });
  }
  res.status(400).json({ success: false, message: "Invalid or expired OTP." });
});


server.listen(5000, () => console.log('Server running on port 5000'));
