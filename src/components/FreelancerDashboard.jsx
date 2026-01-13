import React, { useEffect } from "react";
import socket from "../socket";
import toast from "react-hot-toast";

const FreelancerDashboard = ({ userId }) => {
  useEffect(() => {
    if (!userId) return;

    // Join the user's room for personalized notifications
    socket.emit("joinRoom", userId);

    // Listen for hire notifications
    socket.on("hired", (data) => {
        toast.success(data.message);
    });

    return () => {
      socket.off("hired");
    };
  }, [userId]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Freelancer Dashboard</h1>
      <p>Welcome! You will be notified when a client hires you.</p>
      {/* Add gig list / bids info here */}
    </div>
  );
};

export default FreelancerDashboard;
