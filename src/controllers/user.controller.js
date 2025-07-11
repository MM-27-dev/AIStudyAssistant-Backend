// Importing required modules and utilities
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import ms from "ms";
import { User } from "../models/user.model.js";

// Helper function to generate access and refresh tokens for a user
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new ApiError(404, "User Not found by ID");
    }

    // Generate JWT tokens using instance methods from user model
    const accessToken = user.generateAccesToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

// -------------------- REGISTER USER --------------------
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  // console.log("Register Body:", req.body);

  // Check for empty fields
  if (
    [username, email, password].some((field) => !field || field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Check if username or email already exists
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(404, "User with email or Username already exists");
  }

  try {
    // Create new user
    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password,
    });

    // Remove sensitive info before sending response
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("User creation failed:", error.message);
    throw new ApiError(500, "Something went wrong while registering a user");
  }
});

// -------------------- LOGIN USER --------------------
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  console.log("Login Body:", req.body);
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found with this email");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!loggedInUser) {
    throw new ApiError(500, "User not logged in after token generation");
  }

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction, // Use secure cookies in production
    sameSite: "None", // Required for cross-origin in production
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
    })
    .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
});

// -------------------- LOGOUT USER --------------------
const logoutUser = asyncHandler(async (req, res) => {
  // Remove refresh token from DB
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  // Clear tokens from cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// -------------------- GET CURRENT USER --------------------
const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("username email");
  return res.status(200).json(new ApiResponse(200, user));
});

// -------------------- UPDATE USER PROFILE --------------------
const updateUserProfile = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, "User not found");

  // Update only provided fields
  if (username) user.username = username;
  if (email) user.email = email;
  if (password) user.password = password;

  await user.save();

  const updatedUser = await User.findById(req.user._id).select(
    "username email"
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
});

// -------------------- REFRESH ACCESS TOKEN --------------------
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token not found");
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    // Check if refresh token matches the one in DB
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token does not match");
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "None",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: ms(process.env.ACCESS_TOKEN_EXPIRY),
      })
      .cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: ms(process.env.REFRESH_TOKEN_EXPIRY),
      })
      .json(new ApiResponse(200, null, "Access token refreshed successfully"));
  } catch (error) {
    console.error("Refresh token error:", error.message);
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

// Exporting all controller methods
export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  refreshAccessToken,
};
