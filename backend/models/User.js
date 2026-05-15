import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    phone: { type: String },
    googleId: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: {
      type: String,
      default:
        "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
    },
    bio: { type: String, default: "" },

    // Geospatial Data
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },

    skillsOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],
    skillsWanted: [{ type: mongoose.Schema.Types.ObjectId, ref: "Skill" }],

    // Metrics & Gamefication
    trustScore: { type: Number, default: 50 },
    walletCredits: { type: Number, default: 100 },
    completedSessions: { type: Number, default: 0 },
    ratings: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 1, max: 5 },
        review: { type: String },
      },
    ],
  },
  { timestamps: true },
);

userSchema.index({ location: "2dsphere" });

export default mongoose.model("User", userSchema);
