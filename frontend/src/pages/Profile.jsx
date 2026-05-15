import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setCredentials } from "../redux/authSlice";
import { motion } from "framer-motion";
import { Edit2, Plus, Star, Award, Shield, MapPin, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import api from "../utils/axios.js";
import apiEndpoints from "../utils/api.js";

const Profile = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState("offered"); // 'offered', 'wanted', 'reviews'
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isAddSkillModalOpen, setIsAddSkillModalOpen] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillDesc, setNewSkillDesc] = useState("");

  // Real data from API
  const [skillsOffered, setSkillsOffered] = useState([]);
  const [skillsWanted, setSkillsWanted] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [userStats, setUserStats] = useState({
    trustScore: 0,
    completedSessions: 0,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("Loading location...");
  const [updatingLocation, setUpdatingLocation] = useState(false);

  // Local state for editing profile
  const [profileData, setProfileData] = useState({
    name: userInfo?.name || "User",
    avatar: userInfo?.avatar || null,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Reverse geocoding function to get location name from coordinates
  const getLocationName = async (lat, lng) => {
    if (!lat || !lng || (lat === 0 && lng === 0)) {
      return "Location not set";
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      );
      const data = await response.json();

      if (data && data.address) {
        const { city, state, country } = data.address;
        const parts = [city, state, country].filter(Boolean);
        return parts.length > 0 ? parts.join(", ") : "Unknown location";
      }
      return "Unknown location";
    } catch (error) {
      console.error("Error getting location name:", error);
      return "Location unavailable";
    }
  };

  // Update user location
  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setUpdatingLocation(true);
    setLocationName("Detecting location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          // Update backend with new location
          await api.patch("/api/users/location", {
            latitude: lat,
            longitude: lng,
          });

          // Update local state
          const name = await getLocationName(lat, lng);
          setUserLocation({ type: "Point", coordinates: [lng, lat] });
          setLocationName(name);
          toast.success(`Location updated: ${name}`);
        } catch (error) {
          console.error("Error updating location:", error);
          toast.error("Failed to update location");
        } finally {
          setUpdatingLocation(false);
        }
      },
      (error) => {
        setLocationName("Location access denied");
        toast.error("Unable to retrieve your location");
        setUpdatingLocation(false);
      },
    );
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login to view profile");
          return;
        }

        // Fetch user profile with populated skills
        const response = await api.get(apiEndpoints.auth.profile);

        const userData = response.data;

        // Update profile data
        setProfileData({
          name: userData.name || "User",
          avatar: userData.avatar || null,
        });

        // Set skills data
        setSkillsOffered(userData.skillsOffered || []);
        setSkillsWanted(userData.skillsWanted || []);
        setReviews(userData.ratings || []);

        // Set user location
        setUserLocation(userData.location);

        // Debug: Log location data
        console.log("User location data:", userData.location);

        // Fetch location name if coordinates are available
        if (userData.location?.coordinates) {
          const [lng, lat] = userData.location.coordinates;
          console.log("Coordinates:", { lat, lng });
          if (lat !== 0 && lng !== 0) {
            const name = await getLocationName(lat, lng);
            setLocationName(name);
          } else {
            setLocationName("Location not set");
          }
        } else {
          setLocationName("Location not set");
        }

        // Set user stats
        setUserStats({
          trustScore: userData.trustScore || 0,
          completedSessions: userData.completedSessions || 0,
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile data");
      }
    };

    if (userInfo) {
      fetchProfileData();
    }
  }, [userInfo]);

  const handleAddSkill = async () => {
    if (newSkillName && newSkillName.trim()) {
      try {
        setLoading(true);

        // Create skill in database
        const response = await api.post(apiEndpoints.skills.create, {
          title: newSkillName.trim(),
          description: newSkillDesc.trim() || `User added skill: ${newSkillName.trim()}`,
          category: "General",
          type: activeTab, // 'offered' or 'wanted'
        });

        // Refresh profile data to get the updated skills
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } };
        const res = await api.get(apiEndpoints.users.profile, config);
        setProfileData({
          name: res.data.name,
          avatar: res.data.avatar,
          bio: res.data.bio || "",
        });
        setSkillsOffered(res.data.skillsOffered || []);
        setSkillsWanted(res.data.skillsWanted || []);

        toast.success(`Skill "${newSkillName.trim()}" added successfully!`, {
          icon: "✅",
        });
        
        // Close modal and reset
        setIsAddSkillModalOpen(false);
        setNewSkillName("");
        setNewSkillDesc("");
      } catch (error) {
        console.error("Error adding skill:", error);
        toast.error("Failed to add skill. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Skill name is required!");
    }
  };

  const generateAIBio = async () => {
    setIsGeneratingBio(true);
    try {
      const token = localStorage.getItem("token") || userInfo?.token;
      if (!token) throw new Error("Not authenticated");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await api.post(apiEndpoints.ai.bio, {}, config);
      setProfileData(prev => ({ ...prev, bio: res.data.bio }));
      toast.success("AI Bio generated successfully!", { icon: "✨" });
    } catch (error) {
      console.error("AI Bio error:", error);
      toast.error(error.response?.data?.message || "Failed to generate AI Bio");
    } finally {
      setIsGeneratingBio(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 pb-12">
      {/* Left Column: Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark rounded-3xl p-8 border border-white/10 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary/40 to-secondary/20 opacity-50"></div>

        <button
          onClick={() => setIsEditing(true)}
          className="absolute top-4 right-4 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors z-10"
        >
          <Edit2 className="w-5 h-5" />
        </button>

        <div className="relative z-10 mt-12 text-center">
          <div className="w-32 h-32 mx-auto rounded-3xl bg-slate-800 overflow-hidden ring-4 ring-primary mb-6 shadow-2xl shadow-primary/20 relative group">
            {profileData.avatar ? (
              <img
                src={profileData.avatar}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <span className="text-3xl font-bold">
                  {profileData.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div
              onClick={() => setIsEditing(true)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
            >
              <Edit2 className="w-6 h-6 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-black mb-2">{profileData.name}</h2>
          <p className="text-slate-200 mb-2 font-light">
            {userInfo?.email || "user@example.com"}
          </p>
          <div className="flex items-center justify-center text-slate-300 text-sm mb-6">
            <MapPin className="w-4 h-4 mr-2 text-primary" />
            {locationName}
            {locationName === "Location not set" && (
              <button
                onClick={handleUpdateLocation}
                disabled={updatingLocation}
                className="ml-2 text-xs bg-primary/20 text-primary px-2 py-1 rounded-lg hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                {updatingLocation ? "Updating..." : "Update Location"}
              </button>
            )}
          </div>

          {profileData.bio && (
            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5 text-sm text-slate-300 italic text-left relative">
              <span className="absolute top-1 left-2 text-primary opacity-30 text-4xl leading-none">"</span>
              <p className="relative z-10 pl-6 pr-2 leading-relaxed">{profileData.bio}</p>
            </div>
          )}

          <div className="flex justify-center gap-4 mb-8">
            <div className="flex flex-col items-center p-3 glass rounded-2xl w-24">
              <Shield className="w-6 h-6 text-emerald-400 mb-2" />
              <span className="text-xl font-bold">{userStats.trustScore}%</span>
              <span className="text-xs text-slate-200 uppercase">Trust</span>
            </div>
            <div className="flex flex-col items-center p-3 glass rounded-2xl w-24">
              <Award className="w-6 h-6 text-primary mb-2" />
              <span className="text-xl font-bold">
                {userStats.completedSessions}
              </span>
              <span className="text-xs text-slate-200 uppercase">Barters</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Right Column: Skills & Tabs */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="md:col-span-2 space-y-6"
      >
        {/* Tabs */}
        <div className="flex gap-4 border-b border-white/10 pb-4">
          {["offered", "wanted", "reviews"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-lg font-bold capitalize px-4 py-2 rounded-xl transition-all ${activeTab === tab ? "bg-white/10 text-white" : "text-slate-300 hover:text-slate-300"}`}
            >
              Skills {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {activeTab === "offered" &&
            skillsOffered.map((skill, i) => (
              <motion.div
                key={skill._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-3xl border border-white/5 relative group cursor-pointer hover:border-primary/50 transition-colors"
              >
                <h3 className="text-xl font-bold mb-2">{skill.title}</h3>
                {skill.description && (
                  <p className="text-slate-300 text-sm mb-3">
                    {skill.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm mt-4">
                  <span className="text-primary font-semibold bg-primary/10 px-3 py-1 rounded-full">
                    {skill.likes?.length || 0} Likes
                  </span>
                  {skill.category && (
                    <span className="text-slate-400 bg-white/10 px-3 py-1 rounded-full">
                      {skill.category}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

          {activeTab === "wanted" &&
            skillsWanted.map((skill, i) => (
              <motion.div
                key={skill._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass-dark p-6 rounded-3xl border border-white/5 border-dashed relative group cursor-pointer hover:border-secondary/50 transition-colors"
              >
                <h3 className="text-xl font-bold mb-2">{skill.title}</h3>
                {skill.description && (
                  <p className="text-slate-300 text-sm mb-3">
                    {skill.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-sm mt-4">
                  <span className="text-secondary font-semibold bg-secondary/10 px-3 py-1 rounded-full">
                    Looking for Teacher
                  </span>
                  {skill.category && (
                    <span className="text-slate-400 bg-white/10 px-3 py-1 rounded-full">
                      {skill.category}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}

          {activeTab === "reviews" && reviews.length === 0 && (
            <div className="col-span-1 sm:col-span-2 text-center py-12 text-slate-400">
              No reviews yet.
            </div>
          )}

          {activeTab === "reviews" &&
            reviews.map((review, i) => (
              <motion.div
                key={review._id || i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass p-6 rounded-3xl border border-white/5 relative group col-span-1 sm:col-span-2"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={review.user?.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                    alt={review.user?.name || "User"}
                    className="w-12 h-12 rounded-full object-cover bg-slate-800"
                  />
                  <div>
                    <h4 className="font-bold text-white">{review.user?.name || "Anonymous User"}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(review.score || 5)].map((_, idx) => (
                        <Star key={idx} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(review.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-slate-300 text-sm">"{review.review}"</p>
              </motion.div>
            ))}

          {activeTab !== "reviews" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setIsAddSkillModalOpen(true)}
              className="flex items-center justify-center p-6 border-2 border-dashed border-white/20 rounded-3xl cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all h-full min-h-[160px]"
            >
              <div className="text-center text-slate-200 group-hover:text-white transition-colors">
                <Plus className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <span className="font-semibold">Add New Skill</span>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark border border-white/10 rounded-3xl p-8 w-full max-w-md"
          >
            <h3 className="text-2xl font-bold mb-6">Edit Profile</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) =>
                    setProfileData({ ...profileData, name: e.target.value })
                  }
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm text-slate-300 block">Bio</label>
                  <button 
                    type="button"
                    onClick={generateAIBio}
                    disabled={isGeneratingBio}
                    className="text-xs bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white px-3 py-1 rounded-full flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" /> {isGeneratingBio ? "Generating..." : "Generate AI Bio"}
                  </button>
                </div>
                <textarea
                  value={profileData.bio || ""}
                  onChange={(e) =>
                    setProfileData({ ...profileData, bio: e.target.value })
                  }
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  Profile Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-primary/50 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-xs text-slate-400 mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setUploading(true);
                  try {
                    const token = localStorage.getItem("token") || userInfo?.token;
                    if (!token) {
                      toast.error("Please login again");
                      return;
                    }

                    // Update avatar if file selected
                    let newAvatar = profileData.avatar;
                    if (selectedFile) {
                      const formData = new FormData();
                      formData.append("avatar", selectedFile);
                      const uploadRes = await axios.post(
                        apiEndpoints.users.avatar,
                        formData,
                        { headers: { Authorization: `Bearer ${token}` } }
                      );
                      newAvatar = uploadRes.data.avatar;
                    }

                    // Update profile (name, bio)
                    const profileRes = await api.put(
                      apiEndpoints.users.updateProfile,
                      { name: profileData.name, bio: profileData.bio },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

                    setProfileData({
                      ...profileData,
                      name: profileRes.data.name,
                      bio: profileRes.data.bio,
                      avatar: newAvatar,
                    });

                    dispatch(setCredentials({
                      ...userInfo,
                      name: profileRes.data.name,
                      avatar: newAvatar,
                    }));

                    setSelectedFile(null);
                    setIsEditing(false);
                    toast.success("Profile updated successfully!");
                  } catch (error) {
                    console.error("Error updating profile:", error);
                    toast.error(error.response?.data?.message || "Failed to update profile");
                  } finally {
                    setUploading(false);
                  }
                }}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Save Changes"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Skill Modal */}
      {isAddSkillModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark border border-white/10 rounded-3xl p-8 w-full max-w-md"
          >
            <h3 className="text-2xl font-bold mb-6 capitalize">Add Skill {activeTab}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  Skill Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. React Development"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">
                  Skill Description (Optional)
                </label>
                <textarea
                  placeholder="Briefly describe your skill..."
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 h-24 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => {
                  setIsAddSkillModalOpen(false);
                  setNewSkillName("");
                  setNewSkillDesc("");
                }}
                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSkill}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Adding..." : "Add Skill"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
