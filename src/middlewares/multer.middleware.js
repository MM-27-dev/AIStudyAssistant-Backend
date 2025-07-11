import multer from "multer";

// Configure Multer to store files in memory
const storage = multer.memoryStorage();

const fileUpload = multer({
  storage,
});

// Middleware to handle single file uploads
export const uploadSingleFile = fileUpload.single("file");

// Middleware to handle multiple file uploads (limit to 5 files)
export const uploadMultipleFiles = fileUpload.array("files", 5);

// Note: No interface/type declarations needed in JavaScript.
// You can access `req.file` or `req.files` directly in route handlers.
