import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use((req, res, next) => {
  console.log("Incoming request origin:", req.headers.origin);
  next();
});

const allowedOrigins = [
  "http://localhost:5173",
  "https://ai-study-assistant-frontend-umber.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

//app.options("*", cors());
app.use(cookieParser());
app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ✅ Serve static files in app
app.use(express.static("public"));


const storage = multer.memoryStorage();

const fileUpload = multer({ storage });

export const uploadSingleFile = fileUpload.single("file");

// ✅ Import routes
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import chatRoutes from "./routes/chat.routes.js"
import { errorHandler } from "./middlewares/error.middlerware.js";
import multer from "multer";

// ✅ Routes
app.get("/", (req, res) => {
  res.status(200).send("Server is running!");
});

app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/chat", chatRoutes);

// ✅ Global error handler
app.use(errorHandler);

export { app };
