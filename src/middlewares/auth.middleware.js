import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
 
   const token = req.cookies.accessToken || req.body.accessToken;
   
   if (!process.env.ACCESS_TOKEN_SECRET) {
     console.error("❌ ACCESS_TOKEN_SECRET is missing!");
   }
   if (!process.env.ACCESS_TOKEN_EXPIRY) {
     console.error("❌ ACCESS_TOKEN_EXPIRY is missing!");
   }
  

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log("Verify token", decodedToken);
    

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
