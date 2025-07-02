import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// ✅ CORS MUST be set first, before any body parsing or static middleware
app.use(
  cors({
    origin: "http://localhost:5173", // must match your frontend exactly
    credentials: true,
  })
);

// ✅ Cookie parser
app.use(cookieParser());

// ✅ Body parser
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ✅ Static files
app.use(express.static("public"));

//import routes
import healthcheckRouter from "./routes/healthcheck.routes.js";
import userRouter from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middlerware.js";

// Basic route to check if the server is running
app.get("/", (req, res) => {
  res.status(200).send("Server is running!");
});

//route
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);

// Error handling middleware
app.use(errorHandler);

export { app };
