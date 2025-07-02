// import { asyncHandler } from "../utils/asyncHandler.js";
// import { User } from "../models/user.model.js";
// import mongoose from "mongoose";
// import { ApiError } from "../utils/apiError.js";
// import { ApiResponse } from "../utils/apiResponse.js";
// import jwt from "jsonwebtoken";

// const generateAccessAndRefreshToken = async (userId) => {
//   try {
//     const user = await User.findById(userId);
//     if (!user) {
//       throw new ApiError(404, "User Not found by ID");
//     }

//     const accessToken = user.generateAccesToken();
//     const refreshToken = user.generateRefreshToken();

//     user.refreshToken = refreshToken;
//     await user.save({ validateBeforeSave: false });

//     return { accessToken, refreshToken };
//   } catch (error) {
//     throw new ApiError(
//       500,
//       "Something went wrong while generating access and refresh tokens"
//     );
//   }
// };


// const registerUser = asyncHandler(async (req, res) => {
  

//   const { username, email, password } = req.body;
//   console.log("Body:", req.body);
//   console.log("Files:", req.files);

//   if (
//     [ username, email, password].some(
//       (field) => !field || field.trim() === ""
//     )
//   ) {
//     throw new ApiError(400, "All fields are required");
//   }

//   const existedUser = await User.findOne({
//     $or: [{ username }, { email }],
//   });

//   if (existedUser) {
//     throw new ApiError(404, "User with email or Username is already exist");
//   }

  

//   try {
//     const user = await User.create({
//       username: username.toLowerCase(),
//       email,
//       password
//     });

//     const createdUser = await User.findById(user._id).select(
//       "-password -refreshToken"
//     );
//     if (!createdUser) {
//       throw new ApiError(500, "Something went wring while regitering the user");
//     }

//     return res
//       .status(201)
//       .json(new ApiResponse(200, createdUser, "User registered successfully"));
//   } catch (error) {
//     console.error("User creation failed:", error.message);
//     console.error(error);


//     throw new ApiError(
//       500,
//       "Something went wrong while registering a user and images were deleted"
//     );
//   }
// });

// const loginUser = asyncHandler(async (req, res) => {
//   const { email, password } = req.body;
//   console.log("Request body:", req.body);

//   if (!email) {
//     throw new ApiError(400, "Email is required");
//   }

//   const user = await User.findOne( { email });
//   if (!user) {
//     throw new ApiError(404, "User not found");
//   }

//   const isPasswordValid = await user.isPasswordCorrect(password);
//   if (!isPasswordValid) {
//     throw new ApiError(401, "Invalid Credentials");
//   }

//   const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
//     user._id
//   );

//   const loggedInUser = await User.findById(user._id).select("-password");
//   if (!loggedInUser) {
//     throw new ApiError(500, "User not logged in");
//   }

//   const cookieOptions = {
//     httpOnly: true,
//     secure: process.env.NODE_ENV === "production",
//     sameSite: "Strict",
//   };

//   return res
//     .status(200)
//     .cookie("accessToken", accessToken, {
//       ...cookieOptions,
//       maxAge: 1000 * 60 * 15,
//     }) // 15 min
//     .cookie("refreshToken", refreshToken, {
//       ...cookieOptions,
//       maxAge: 1000 * 60 * 60 * 24 * 7,
//     }) // 7 days
//     .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
// });


// // const refreshAccssToken = asyncHandler(async (req, res) => {
// //   const incomingRefreshToken =
// //     req.cookies.refreshToken || req.body.refreshToken;

// //   if (!incomingRefreshToken) {
// //     throw new ApiError(401, "Refresh token is required");
// //   }

// //   try {
// //     const decodedToken = jwt.verify(
// //       incomingRefreshToken,
// //       process.env.REFRESH_TOKEN_SECRET
// //     );

// //     const user = await User.findById(decodedToken?._id);
// //     if (!user) {
// //       throw new ApiError(401, "Invalid refresh token");
// //     }

// //     if (incomingRefreshToken !== user.refreshToken) {
// //       throw new ApiError(401, "Expired or invalid refresh token");
// //     }

// //     const { accessToken, refreshToken: newRefreshToken } =
// //       await generateAccessAndRefreshToken(user._id);

// //     const cookieOptions = {
// //       httpOnly: true,
// //       secure: process.env.NODE_ENV === "production",
// //       sameSite: "Strict",
// //     };

// //     return res
// //       .status(200)
// //       .cookie("accessToken", accessToken, {
// //         ...cookieOptions,
// //         maxAge: 1000 * 60 * 15,
// //       })
// //       .cookie("refreshToken", newRefreshToken, {
// //         ...cookieOptions,
// //         maxAge: 1000 * 60 * 60 * 24 * 7,
// //       })
// //       .json(
// //         new ApiResponse(
// //           200,
// //           { accessToken, refreshToken: newRefreshToken },
// //           "Access token refreshed successfully"
// //         )
// //       );
// //   } catch (error) {
// //     console.error(error);
// //     throw new ApiError(500, "Something went wrong");
// //   }
// // });


// // const logoutUser = asyncHandler(async (req, res) => {
// //   await User.findByIdAndUpdate(
// //     req.user._id,
// //     { $set: { refreshToken: undefined } },
// //     { new: true }
// //   );

// //   const options = {
// //     httpOnly: true,
// //     secure: process.env.NODE_ENV === "production",
// //   };

// //   return res
// //     .status(200)
// //     .clearCookie("accessToken", options)
// //     .clearCookie("refreshToken", options)
// //     .json(new ApiResponse(200, {}, "User logged out successfully"));
// // });


// // const changeCurrentPassword = asyncHandler(async (req,res)=>{
// //    const {oldPassword, newPassword} = req.body

// //    const user = await User.findById(req.user?._id)

// //    const isPasswordvalid = await user.isPasswordCorrect(oldPassword)

// //    if(!isPasswordvalid){
// //     throw new ApiError(401, "Old password is incorrect")
// //    }
// //    user.password = newPassword;
// //    await user.save({validateBeforeSave : false})
// //    return res.status(200).json(new ApiResponse(200, {}, "Password changed succesfully"))
// // })


// // const getCurrentUser = asyncHandler(async (req,res)=>{
// //     return res.status(200).json(new ApiResponse(200, req.user, "Current user details"))
// // })


// // const updateAccountDetails = asyncHandler(async (req,res)=>{
// //     const {fullname, email} = req.body;

// //     if(!fullname){
// //       throw new ApiError(400, "Fullname is required")
// //     }

// //     if(!email){
// //       throw new ApiError(400, "email is required")
// //     }


// //     const userUpdated = await User.findByIdAndUpdate(
// //       req.user?._id,
// //       {
// //         $set : {
// //           fullname,
// //           email : email
// //         }
// //       },
// //       {new : true}
// //     ).select("-password -refreshToken")


// //     return res.status(200).json(new ApiResponse(200, userUpdated, "Account details updated successfully"));

// // })


// // const updateUserAvatar = asyncHandler(async (req,res)=>{
// //   const avatarLocalPath = req.file?.path;

// //   if(!avatarLocalPath){
// //     throw new ApiError(400,"File is required")
// //   }

// //    const avatar = await uploadOnClodianry(avatarLocalPath)

// //    if(!avatar.url){
// //     throw new ApiError(500, "Something went wrong while uploading avatar")
// //    }

// //    const userAvatarUpdate = await User.findByIdAndUpdate(req.user?._id,
// //     {
// //       $set:{
// //         avatar: avatar.url
// //       }
// //     },
// //     {
// //       new : true
// //     }
// //    ).select("-password -refreshToken")

// //    return res
// //   .status(200)
// //   .json(new ApiResponse(200, userAvatarUpdate, "Avatar updated successfully"));

// // })


// // const updateUserCoverImage = asyncHandler(async (req,res)=>{
// // const coverImageLocalPath = req.file?.path;

// //   if(!coverImageLocalPath){
// //     throw new ApiError(400,"File is required")
// //   }

// //    const coverImage = await uploadOnClodianry(coverImageLocalPath)

// //    if(!coverImage.url){
// //     throw new ApiError(500, "Something went wrong while uploading avatar")
// //    }

// //    const userCoverUpdate = await User.findByIdAndUpdate(req.user?._id,
// //     {
// //       $set:{
// //         coverImage: coverImage.url
// //       }
// //     },
// //     {
// //       new : true
// //     }
// //    ).select("-password -refreshToken")

// //    res.status(200).json(new ApiResponse(200,userCoverUpdate, "CoverImage updated successfully"))
// // })

// // const getUserchannelProfile = asyncHandler( async (req,res) => {
// //     const {username} = req.params

// //     if(!username?.trim()){
// //       throw new ApiError(400, 'username is required')
// //     }


// //     //collect all the channels who are subsriber to the specific user
// //    const channel = await User.aggregate([
// //   {
// //     $match: {
// //       $expr: {
// //         $eq: [{ $toLower: "$username" }, username.toLowerCase()]
// //       }
// //     }
// //   },
// //   {
// //     $lookup: {
// //       from: "subscriptions",
// //       localField: "_id",
// //       foreignField: "channel",
// //       as: "subscribers"
// //     }
// //   },
// //   {
// //     $lookup: {
// //       from: "subscriptions",
// //       localField: "_id",
// //       foreignField: "subscriber",
// //       as: "subscriberedTo"
// //     }
// //   },
// //   {
// //     $addFields: {
// //       subscriberCount: { $size: "$subscribers" },
// //       channelSubscribedToCount: { $size: "$subscriberedTo" },
// //       isSubscribed: {
// //         $cond: {
// //           if: {
// //             $in: [
// //               { $toObjectId: req.user._id.toString() },
// //               {
// //                 $map: {
// //                   input: "$subscribers",
// //                   as: "sub",
// //                   in: "$$sub.subscriber"
// //                 }
// //               }
// //             ]
// //           },
// //           then: true,
// //           else: false
// //         }
// //       }
// //     }
// //   },
// //   {
// //     $project: {
// //       fullname: 1,
// //       username: 1,
// //       avatar: 1,
// //       subscriberCount: 1,
// //       channelSubscribedToCount: 1,
// //       isSubscribed: 1,
// //       coverImage: 1,
// //       email: 1
// //     }
// //   }
// // ]);
// //     console.log('Channel', channel);

// //     if(!channel.length){
// //       throw new ApiError(404, "Channel not found")
// //     }

// //     return res.status(200).json( new ApiResponse(200, channel[0], "Channel profile fetched succesfully"))
// // })

// // const getWatchHistory = asyncHandler(async (req, res) => {
// //   const user = await User.aggregate([
// //     {
// //       $match: {
// //         _id: new mongoose.Types.ObjectId(req.user?._id)
// //       },
// //     },
// //     {
// //       $lookup: {
// //         from: "videos",
// //         localField: "watchHistory",
// //         foreignField: "_id",
// //         as: "watchHistory",
// //         pipeline: [
// //           {
// //             $lookup: {
// //               from: "users",
// //               localField: "owner",
// //               foreignField: "_id",
// //               as: "owner",
// //               pipeline: [
// //                 {
// //                   $project: {
// //                     username: 1,
// //                     fullname: 1,
// //                     avatar: 1,
// //                   },
// //                 },
// //               ],
// //             },
// //           },
// //           {
// //             $unwind: "$owner", // optional, if you want single object instead of array
// //           },
// //         ],
// //       },
// //     },
// //   ]);

// //   console.log("WatchHistory", user);

// //   if (!user.length) {
// //     throw new ApiError(404, "Watch history not found");
// //   }

// //   return res
// //     .status(200)
// //     .json(
// //       new ApiResponse(
// //         200,
// //         user[0]?.watchHistory,
// //         "Watch history fetched successfully"
// //       )
// //     );
// // });


// export { registerUser, loginUser};


import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User Not found by ID");
    }

    const accessToken = user.generateAccesToken(); // ✅ Fixed here
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error); // add this
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};



const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  console.log("Register Body:", req.body); // Log the request body for registration
  // console.log("Files:", req.files); // Only uncomment if you are handling file uploads

  if (
    [username, email, password].some((field) => !field || field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(404, "User with email or Username already exists");
  }

  try {
    const user = await User.create({
      username: username.toLowerCase(),
      email,
      password,
    });

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
    console.error(error);

    throw new ApiError(
      500,
      "Something went wrong while registering a user" // Removed "and images were deleted" as files are not handled here
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  console.log("Login Request body:", req.body); // Log the request body for login

  if (!email || !password) {
    // Check for both email and password
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
  ); // Select out refreshToken as well
  if (!loggedInUser) {
    throw new ApiError(500, "User not logged in after token generation");
  }

  const isDev = process.env.NODE_ENV !== "production";

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // true only in prod
    sameSite: process.env.NODE_ENV === "production" ? "Strict" : "Lax",
  };
  

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 15, // 15 min
    })
    .cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    })
    .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));

});

export { registerUser, loginUser };

