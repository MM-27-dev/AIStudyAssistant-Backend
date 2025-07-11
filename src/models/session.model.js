//Session title,UserID, messages, session summary, session fedback

import mongoose, { Schema } from "mongoose";

const SessionSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [
      {
        type: Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    summary: {
      type: String,
      default: "",
    },
    feedback: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export const Session = mongoose.model("Session", SessionSchema);
