import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => {
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return emailRegex.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare password method
// Checking whether the password (what user sends) is equal to the password in the DB
UserSchema.methods.isPasswordCorrect = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (err) {
    throw err;
  }
};

// UserSchema.methods.generateAccesToken = function () {
//   try {
//     return jwt.sign(
//       {
//         _id: this._id,
//         email: this.email,
//         username: this.username,
//       },
//       process.env.ACCES_TOKEN_SECRET, // Corrected typo: ACCES -> ACCESS
//       { expiresIn: process.env.ACCES_TOKEN_EXPIRY } // Corrected typo: ACCES -> ACCESS
//     );
//   } catch (err) {
//     throw err;
//   }
// };


UserSchema.methods.generateAccesToken = function () {
  try {
    console.log("✅ Access token generation started");
    console.log(
      "ACCESS_TOKEN_SECRET exists:",
      !!process.env.ACCESS_TOKEN_SECRET
    );
    console.log("ACCESS_TOKEN_EXPIRY:", process.env.ACCESS_TOKEN_EXPIRY);

    return jwt.sign(
      {
        _id: this._id,
        email: this.email,
        username: this.username,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
  } catch (err) {
    console.error("❌ Error inside generateAccesToken:", err);
    throw err;
  }
};
 
UserSchema.methods.generateRefreshToken = function () {
  try {
    return jwt.sign(
      {
        _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
  } catch (err) {
    throw err;
  }
};

export const User = mongoose.model("User", UserSchema);
