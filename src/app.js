import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();
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

app.use((req, res, next) => {
  console.log("Origin:", req.headers.origin);
  next();
});


// ✅ Cookie parser
app.use(cookieParser());

// ✅ Security headers
app.use(helmet());

// ✅ Body parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ✅ Serve static files
app.use(express.static("public"));

// ✅ Import routes
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middlerware.js";

// ✅ Routes
app.get("/", (req, res) => {
  res.status(200).send("Server is running!");
});

app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);

// ✅ Global error handler
app.use(errorHandler);

export { app };
