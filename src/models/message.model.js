//user id,isuser,content,message type, file (object) - file name, original name, path(key),content

import mongoose, { Schema } from "mongoose";

const FileSchema = new Schema({
  filename: String, // Stored filename
  originalName: String, // Original filename
  path: String, // File path or storage key
  content: String, // Optional: text content (e.g., from PDF, .txt, etc.)
});

const MessageSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isUser: {
      type: Boolean,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    messageType: {
      type: String,
      enum: ["text", "file", "image", "code", "voice"], // extend as needed
      default: "text",
    },
    file: {
      type: FileSchema,
      required: false,
    },
  },
  { timestamps: true }
);

export const Message = mongoose.model("Message", MessageSchema);
