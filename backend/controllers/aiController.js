import { GoogleGenAI } from "@google/genai";
import User from "../models/User.js";

export const generateBio = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Gemini API key is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const user = await User.findById(req.user._id).populate("skillsOffered").populate("skillsWanted");
    if (!user) return res.status(404).json({ message: "User not found" });

    const offeredStr = user.skillsOffered.map(s => s.title).join(", ") || "various skills";
    const wantedStr = user.skillsWanted.map(s => s.title).join(", ") || "new things";

    const prompt = `Write a short, engaging, and professional 2-3 sentence bio for a user named ${user.name} on a skill-bartering platform. They are offering to teach or provide services in: ${offeredStr}. In return, they want to learn or receive help with: ${wantedStr}. Keep it friendly and concise. Do not use quotes around the bio.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ bio: response.text });
  } catch (error) {
    console.error("AI Bio Error:", error);
    res.status(500).json({ message: "Failed to generate AI bio." });
  }
};

export const analyzeMatch = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ message: "Gemini API key is not configured on the server." });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const currentUser = await User.findById(req.user._id).populate("skillsOffered").populate("skillsWanted");
    const targetUser = await User.findById(targetUserId).populate("skillsOffered").populate("skillsWanted");

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "Users not found" });
    }

    const myOffered = currentUser.skillsOffered.map(s => s.title).join(", ") || "various skills";
    const myWanted = currentUser.skillsWanted.map(s => s.title).join(", ") || "new things";
    const theirOffered = targetUser.skillsOffered.map(s => s.title).join(", ") || "various skills";
    const theirWanted = targetUser.skillsWanted.map(s => s.title).join(", ") || "new things";

    const prompt = `Analyze a potential skill-barter match between two users on a skill exchange platform.
User 1 (${currentUser.name}) offers: ${myOffered} | wants: ${myWanted}
User 2 (${targetUser.name}) offers: ${theirOffered} | wants: ${theirWanted}

Write a short, fun 2-sentence explanation of why they are a good match and suggest a possible barter exchange they could do. Speak directly to User 1 (using "You"). Focus on how their skills complement each other.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ matchAnalysis: response.text });
  } catch (error) {
    console.error("AI Match Error:", error);
    res.status(500).json({ message: "Failed to analyze match." });
  }
};
