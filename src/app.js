import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

// 🛡️ Debug origin
app.use((req, res, next) => {
  console.log("Incoming request origin:", req.headers.origin);
  next();
});

// ✅ CORS config
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

// ✅ Respond to preflight requests (MUST come before helmet!)
app.options("*", cors());

// ✅ Middleware stack
app.use(cookieParser());
app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
