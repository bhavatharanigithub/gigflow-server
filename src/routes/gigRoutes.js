import express from "express";
import { createGig, getOpenGigs} from "../controllers/gigController.js";
import protect from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createGig);

router.get("/", getOpenGigs);

export default router;
