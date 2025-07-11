import { Router } from "express";

import { healthcheck } from "../controllers/healthcheck.controllers.js";

const router = Router()

router.route("/").get(healthcheck);
console.log("✅ user.routes.js loaded");


export default router;