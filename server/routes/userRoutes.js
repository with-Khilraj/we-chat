const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyAccessToken = require("../middlewares/authMiddleware");
const RefreshToken = require("../models/refreshTokens");

const router = express.Router();

// Generate Access and Refresh Token
const generateToken = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "20m",
  });
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// Refresh Token store (in memory for demo, use a database for production)
// let refreshTokens = [];

// Signup Route
router.post("/signup", async (req, res) => {
  const { email, username, phone, password } = req.body;

  if (!email || !username || !phone || !password) {
    res.status(400).json({ message: "Please enter all the fields" });
  }

  try {
    // check if email already exits
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered!" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      email,
      username,
      phone,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "User already exists" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // validate email and password
  if (!email || !password) {
    return res.status(400).json({ error: "Please fill the required field" });
  }

  try {
    // find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(404).json({ error: "Invalid password" });
    }

    // Logic to generate Aceess or Refresh Token
    const { accessToken, refreshToken } = generateToken(user);

    // refreshTokens.push(refreshToken); // save refresh token in database in real web app

    // save refresh token to database
    const refreshTokenEntry = new RefreshToken({
      userId: user._id,
      token: refreshToken,
      expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // which is basically 7 days expiry
    });

    await refreshTokenEntry.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({ message: "Login Successful", accessToken });
  } catch (error) {
    console.log("Error while login:", error);
    res.status(500).json({ error: "Internal server" });
  }
});

// Token Refresh Route
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Retrieving refresh token from cookies

  if (!refreshToken) {
    return res
      .status(401)
      .json({ error: "Unauthorized. Refresh token not found!" });
  }

  try {
    // finding the refresh token in the database
    const tokenEntry = await RefreshToken.findOne({ token: refreshToken });

    if (!tokenEntry || tokenEntry.revoked || tokenEntry.expiry < new Date()) {
      return res
        .status(403)
        .json({ error: "Invalid or expired refresh token" });
    }

    // verify the token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
      expiresIn: "20m",
    });
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error in refresh token route:", error);
    return res.status(403).json({ error: "Internal server error" });
  }
});

// Logout Route
router.post("/logout", async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(400).json({ error: "Refresh token missing" });
  }

  try {
    // mark the token as revoked
    await RefreshToken.findOneAndUpdate(
      { token: refreshToken },
      { revoked: true }
    );

    // clear the refresh token cookie
    res.clearCookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE.ENV === "production",
      sameSite: "strict",
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// // Fetch single user details via id (protected route)
// router.get("/:id", verifyAccessToken, async (req, res) => {
//   try {
//     // In the backend route (userRoutes.js), you're fetching the user by req.user.id.
//     // This implies that you expect the id to come from the verifyAccessToken middleware,
//     // not the request parameter (req.params.id).
//     // const user = await User.findById(req.user.id).select("-password"); // Exclude password

//     const user = await User.findById(req.params.id).select("-password"); // Exclude password

//     if (!user) {
//       return res.status(404).json({ error: "User not found" });
//     }
//     res.status(200).json({ user });
//   } catch (error) {
//     console.error("Error fetching user information:", error);
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

// fetch logged-in user profile
router.get("/profile", verifyAccessToken, async (req, res) => {
  // console.log("USER ID::::: ", req.user.id);
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Route to get the list of users except the logged in user
router.get("/all", verifyAccessToken, async (req, res) => {

  try {
    const loggedInUser = req.user.id;

    console.log("Logged in user ID:", loggedInUser);

    if (!loggedInUser) {
      console.log("Logged in user is undefined or null");
      return res.status(400).json({ error: "Logged in user not found" });
    }

    // Fetch all user except the logged-in user, excluding passwords
    const users = await User.find({ _id: { $ne: loggedInUser } }).select(
      "-password"
    );
    console.log("Users fetched::::", users);

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Another Protected
router.put("/update", verifyAccessToken, async (req, res) => {
  try {
    const { username, phone } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, phone },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
