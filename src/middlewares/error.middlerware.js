// import mongoose from "mongoose";

// import { ApiError } from "../utils/apiError.js";

// const errorHandler = (err,req,res,next)=>{
//  let error =err

//  if(!(error instanceof ApiError)){
//     const statusCode = error.statusCode || error instanceof mongoose.Error ? 400 : 500

//     const message = error.message || "Something is went wrong"
//     error = new ApiError(statusCode,message,error?.errors || [],err.stack)
//  }

//  const response = {
//     ...error,
//     message : error.message,
//     ...ApiError(process.env.NODE_ENV === "development" ? {
//         stack : error.stack
//     }:{})
//  }

//  return res.status(error.statusCode).json(response)
// }

// export {errorHandler}

import mongoose from "mongoose";
import { ApiError } from "../utils/apiError.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  // If the error is not an instance of ApiError, create a new ApiError
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || (error instanceof mongoose.Error ? 400 : 500);
    const message = error.message || "Something went wrong"; // Corrected "is went wrong" to "went wrong"
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  // Construct the response object
  const response = {
    statusCode: error.statusCode, // Include statusCode explicitly
    message: error.message,
    success: false, // ApiError should typically indicate a failure
    errors: error.errors, // Include specific errors array if available
  };

  // Conditionally add stack trace in development mode
  if (process.env.NODE_ENV === "development") {
    response.stack = error.stack;
  }

  // Return the response with the appropriate status code
  return res.status(error.statusCode).json(response);
};

export { errorHandler };