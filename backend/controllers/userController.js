import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Skill from "../models/Skill.js";
import { cloudinary } from "../config/cloudinary.js";

// Get AI recommended users for skill exchange
export const getRecommendedUsers = async (req, res) => {
  try {
    const { longitude, latitude, radius = 10 } = req.query; // radius in km
    const currentUser = req.user;

    // Build geospatial query
    let geoQuery = {};
    if (longitude && latitude) {
      geoQuery = {
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: radius * 1000, // Convert km to meters
          },
        },
      };
    }

    // Pipeline: find users near, not current user, matching wanted/offered skills (simple intersection)
    // For MVP demo, just return nearby non-current users ordered by trustScore
    const users = await User.find({
      _id: { $ne: currentUser._id },
      ...geoQuery,
    })
      .populate("skillsOffered skillsWanted")
      .sort({ trustScore: -1 })
      .limit(20);

    // More complex AI mapping formula can be implemented here (Skill intersection logic)

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user profile data
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("skillsOffered")
      .populate("skillsWanted");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user wallet information
export const getUserWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "walletCredits trustScore",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      walletCredits: user.walletCredits,
      trustScore: user.trustScore,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get upcoming sessions/bookings
export const getUpcomingSessions = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [{ requesterId: req.user._id }, { hostId: req.user._id }],
      status: "accepted",
      scheduledDate: { $gte: new Date() },
    })
      .populate("skillId", "title category")
      .populate("requesterId", "name avatar")
      .populate("hostId", "name avatar")
      .sort({ scheduledDate: 1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile (name, bio)
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        bio: updatedUser.bio,
        avatar: updatedUser.avatar,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user connections (profiles matched from Explore)
export const getUserConnections = async (req, res) => {
  try {
    // For now, return all users except the current user
    // In a real app, this would return users the current user has matched with
    const users = await User.find({
      _id: { $ne: req.user._id },
    })
      .select("-password")
      .populate("skillsOffered")
      .populate("skillsWanted")
      .sort({ trustScore: -1 })
      .limit(20);

    res.json(users);
  } catch (error) {
    console.error("Error in getUserConnections:", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// Update user location
export const updateUserLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude || latitude === 0 || longitude === 0) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: "Point",
          coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
        },
      },
      { new: true },
    ).select("-password");

    if (updatedUser) {
      res.json({
        message: "Location updated successfully",
        location: updatedUser.location,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload user avatar
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old avatar if it exists and is not the default
    if (user.avatar && !user.avatar.includes("i.pravatar.cc")) {
      try {
        const publicId = user.avatar.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(`skillswap_avatars/${publicId}`);
      } catch (error) {
        console.log("Failed to delete old avatar:", error);
      }
    }

    // Update user avatar with new Cloudinary URL
    user.avatar = req.file.path;
    await user.save();

    res.json({
      message: "Avatar uploaded successfully",
      avatar: user.avatar,
    });
  } catch (error) {
    console.error("Avatar upload error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Global user search by skill
export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === "") {
      return res.json([]);
    }

    // 1. Find matching skills
    const matchingSkills = await Skill.find({
      title: { $regex: q, $options: "i" }
    });

    const skillIds = matchingSkills.map((skill) => skill._id);

    // 2. Find users who offer or want these skills
    const users = await User.find({
      $or: [
        { skillsOffered: { $in: skillIds } },
        { skillsWanted: { $in: skillIds } }
      ]
    })
    .select("name avatar bio skillsOffered skillsWanted trustScore")
    .populate("skillsOffered", "title")
    .populate("skillsWanted", "title")
    .limit(10); // Limit results for performance

    // Filter out the current user if they are logged in
    const filteredUsers = req.user 
      ? users.filter(u => u._id.toString() !== req.user._id.toString())
      : users;

    res.json(filteredUsers);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error during search" });
  }
};
