import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "secret123", {
    expiresIn: "30d",
  });
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, latitude, longitude } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data with location
    const userData = { name, email, password: hashedPassword };

    // Add phone if provided
    if (phone) userData.phone = phone;

    // Add location if coordinates are provided
    if (latitude && longitude && latitude !== 0 && longitude !== 0) {
      userData.location = {
        type: "Point",
        coordinates: [longitude, latitude], // MongoDB expects [longitude, latitude]
      };
    }

    const user = await User.create(userData);
    if (user) {
      const token = generateToken(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });
      res
        .status(201)
        .json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, token });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const authUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = generateToken(user._id);
      res.cookie("jwt", token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        sameSite: "strict",
      });
      res.json({ _id: user._id, name: user.name, email: user.email, avatar: user.avatar, token });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logoutUser = (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ message: "Logged out successfully" });
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("skillsOffered")
      .populate("skillsWanted")
      .populate({
        path: "ratings.user",
        select: "name avatar"
      });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
