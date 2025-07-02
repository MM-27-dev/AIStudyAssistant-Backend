import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

// ✅ CORS first
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

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
