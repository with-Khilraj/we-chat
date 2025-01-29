const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyAccessToken = require("../middlewares/authMiddleware");
const RefreshToken = require("../models/refreshTokens");
const sendVerificationOTP = require('../emailConfig')

const router = express.Router();

// Generate Access and Refresh Token - For Authentication
const generateToken = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "5h",
  });
  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );

  return { accessToken, refreshToken };
};

// Generate  6 digits OTP 
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    // Generate email verification token for Email Verification only
    const otp = generateOTP();

    // Create a new user
    const newUser = new User({
      email,
      username,
      phone,
      password: hashedPassword, 
      emailverificationOTP: otp,
      OTPExprires: Date.now() + 10 * 60 * 1000, // valid for 10 minutes
      isEmailVerified: false,
    });

    await newUser.save();

    try {
      // Attempt to send verification email
      await sendVerificationOTP(email, otp);

      res.status(201).json({ 
        message: " Please check your email to verify your account",
        email: email
      });

    } catch (error) {
      console.error("Error while sending verification email:", error);

      // Even if email fails, user is created
      return res.status(201).json({
        message: "Account created but verification email failed to send",
        email: email
      });
    }   
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


// verify OTP route
router.post("/verify-otp", async (req, res) => {
  const { email, otp} = req.body;

  try {
    const user = await User.findOne({
      email,
      emailverificationOTP: otp,
      OTPExprires: { $gt: Date.now() }
    });

    if(!user) {
      return res.status(400).json({
        error: "Invalid or expired OTP"
      });
    }

    // update user verification status
    user.isEmailVerified = true;
    user.emailverificationOTP = undefined;
    user.OTPExprires = undefined;

    await user.save();

    // Generate tokens for automatic login
    const { accessToken, refreshToken } = generateToken(user);

    // save refresh token to database
    const refreshTokenEntry = new RefreshToken ({
      userId: user._id,
      token: refreshToken,
      expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // which is basically 7 days expiry
    });

    // set refresh token as an HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: true,
    });

    res.status(200).json ({
      message: "Email verified successfully",
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      }
    })
    
  } catch (error) {
    console.error("Verification OTP error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
})


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

    // if (!user) {
    //   return res.status(404).json({ error: "User not found" });
    // }

    // check if email is verified
    if(!user.isEmailVerified) {
      return res.status(401).json({
        error: "Please verify your email first"
      })
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Logic to generate Aceess or Refresh Token
    const { accessToken, refreshToken } = generateToken(user);


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

    res.status(200).json({ 
      message: "Login Successful", 
      accessToken,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      }
    });

  } catch (error) {
    console.log("Error while login:", error);
    res.status(500).json({ error: "Internal server" });
  }
});


// Resend OTP Route
router.post("/resend-otp", async (req, res) => {
  const { email} = req.body;

  try {
    const user = await User.findOne({ email, isEmailVerified: false});

    if(!user) {
      return res.status(404).json({ error: "User not found or already verified" });
    }

    const otp = generateOTP();

    // update user with new OTP
    user.emailverificationOTP = otp;
    user.OTPExprires = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
    await user.save();

    // send new OTP
    await sendVerificationOTP(email, otp);

    res.status(200).json({
      message: "New OTP sent successfully",
      email: email,
    })
  } catch (error) {
    console.error("Error while resending OTP:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// Token Refresh Route with "token rotation" strategy

// "Token rotation" ensures that stolen refresh tokens cannot be reused after rotation.
router.post("/refresh", async (req, res) => {
  const refreshToken = req.cookies.refreshToken; // Retrieve refresh token from cookies

  if (!refreshToken) {
    return res.status(401).json({ error: "Unauthorized. Refresh token not found!" });
  }

  try {
    
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the refresh token in the database
    const tokenEntry = await RefreshToken.findOne({ token: refreshToken });

    if (!tokenEntry || tokenEntry.revoked) {
      return res.status(403).json({ error: "Invalid or expired refresh token" });
    }

    if(new Date(tokenEntry.expiry) <= new Date()) {
      return res.status(403).json({ error: "Refresh token expired. Please login again."})
    }

    // Generate a new refresh token and access token
    const { accessToken, refreshToken: newRefreshToken } = generateToken({ _id: decoded.id });

    
    // Revoke the old refresh token and save the new one
    tokenEntry.revoked = true;
    await tokenEntry.save();

    // Save the new refresh token in the database
    await RefreshToken.create({
      token: newRefreshToken,
      expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });

    // // Generate a new access token
    // const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
    //   expiresIn: "20m", // Short lifespan for access token
    // });

    // Set the new refresh token as an HTTP-only secure cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
    });

    // Send the new access token
    res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error in refresh token route:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// Token Refresh Route without "token rotation" strategy
// router.post("/refresh", async (req, res) => {
//   const refreshToken = req.cookies.refreshToken; // Retrieving refresh token from cookies

//   if (!refreshToken) {
//     return res
//       .status(401)
//       .json({ error: "Unauthorized. Refresh token not found!" });
//   }

//   try {
//     // finding the refresh token in the database (RefreshTOken model)
//     const tokenEntry = await RefreshToken.findOne({ token: refreshToken });

//     if (!tokenEntry || tokenEntry.revoked || tokenEntry.expiry < new Date()) {
//       return res
//         .status(403)
//         .json({ error: "Invalid or expired refresh token" });
//     }

//     // verify the token
//     const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
//     console.log("Decoded token:::", decoded);

//     const accessToken = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, {
//       expiresIn: "20m",
//     });
//     res.status(200).json({ accessToken });
//   } catch (error) {
//     console.error("Error in refresh token route:", error);
//     return res.status(403).json({ error: "Internal server error" });
//   }
// });

// Logout Route


router.post("/logout", async (req, res) => {
  console.log("Cookkies:::::", req.cookies)
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

    res.status(200).json({ message: "Loggout successfully" });
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

// // track online status of users
// router.get('/online-status', async (req, res) => {
//   try {
//     const users = await User.find({}, "username isOnline lastActive");
//     res.json(users);
//   } catch (error) {
//     console.error("Error fetching online status:", error);
//     res.status(500).json({ error: "Internal server error"});
//   }
// })

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
