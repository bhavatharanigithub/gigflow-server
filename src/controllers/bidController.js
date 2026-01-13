import Bid from "../models/Bid.js";
import Gig from "../models/Gig.js";
import mongoose from "mongoose";

export const submitBid = async (req, res) => {
  try {
    const { gigId, message, price } = req.body;

    if (!gigId || !message || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Prevent owner from bidding on own gig
    if (gig.ownerId.toString() === req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You cannot bid on your own gig" });
    }

    // Optional safety: prevent duplicate bids by same freelancer
    const existingBid = await Bid.findOne({
      gigId,
      freelancerId: req.user._id
    });

    if (existingBid) {
      return res
        .status(400)
        .json({ message: "You have already bid on this gig" });
    }

    const bid = await Bid.create({
      gigId,
      freelancerId: req.user._id,
      message,
      price
    });

    res.status(201).json({
      message: "Bid submitted successfully",
      bid
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getBidsForGig = async (req, res) => {
  try {
    const { gigId } = req.params;

    const gig = await Gig.findById(gigId);
    if (!gig) {
      return res.status(404).json({ message: "Gig not found" });
    }

    // Only owner can see bids
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not allowed to view bids for this gig" });
    }

    const bids = await Bid.find({ gigId })
      .populate("freelancerId", "name email")
      .sort({ createdAt: -1 });

    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const hireFreelancer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bidId } = req.params;

    const bid = await Bid.findById(bidId).session(session);
    if (!bid) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Bid not found" });
    }

    const gig = await Gig.findById(bid.gigId).session(session);
    if (!gig) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Gig not found" });
    }

    // Only owner can hire
    if (gig.ownerId.toString() !== req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not authorized to hire" });
    }

    if (gig.status === "assigned") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Gig already assigned" });
    }

    // 1️⃣ Update gig status
    gig.status = "assigned";
    await gig.save({ session });

    // 2️⃣ Update chosen bid
    bid.status = "hired";
    await bid.save({ session });

    // 3️⃣ Reject other bids
    await Bid.updateMany(
      { gigId: gig._id, _id: { $ne: bid._id } },
      { $set: { status: "rejected" } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    
    // Send real-time notification to the hired freelancer
    const io = req.app.get("io");
    if (io) {
      const populatedBid = await Bid.findById(bidId)
        .populate("freelancerId", "name email")
        .populate("gigId", "title");
      
      io.to(bid.freelancerId.toString()).emit("hired", {
        message: `You have been hired for ${gig.title}!`,
        gigId: gig._id.toString(),
        gigTitle: gig.title
      });
    }
    
    const updatedBid = await Bid.findById(bidId)
      .populate("freelancerId", "name email");
    
    res.json({
      message: "Freelancer hired successfully",
      bid: updatedBid
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};