import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addNotification } from "../redux/notificationSlice";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  MapPin,
  Clock,
  MessageCircle,
  X,
  Check,
  Award,
  Zap,
  Video,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../utils/axios.js";
import apiEndpoints from "../utils/api.js";

const Explore = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState({
    walletCredits: 0,
    trustScore: 0,
  });
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [locationName, setLocationName] = useState("Loading location...");

  // Tinder style swipe state
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reverse geocoding function to get location name from coordinates
  const [isAnalyzingMatch, setIsAnalyzingMatch] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState("");

  const handleAnalyzeMatch = async (targetUserId) => {
    setIsAnalyzingMatch(true);
    setMatchAnalysis("");
    try {
      const token = localStorage.getItem("token") || userInfo?.token;
      if (!token) throw new Error("Not authenticated");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const res = await api.post(apiEndpoints.ai.match, { targetUserId }, config);
      setMatchAnalysis(res.data.matchAnalysis);
    } catch (error) {
      console.error("AI Match error:", error);
      toast.error(error.response?.data?.message || "Failed to analyze match");
    } finally {
      setIsAnalyzingMatch(false);
    }
  };

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

  const handleVideoCall = (partnerName) => {
    // Direct users to 'meat.google.com/new' which automatically creates a valid, instant meeting
    const meetLink = `https://meet.google.com/new`;

    toast.success(`Opening a new Google Meet for ${partnerName}...`);

    // Open the meet link in a new tab
    window.open(meetLink, "_blank");
  };

  useEffect(() => {
    // Fetch real recommendations from API
    const fetchRecommendations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login to view recommendations");
          setLoading(false);
          return;
        }

        const response = await api.get(apiEndpoints.users.recommendations);
        setRecommendations(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        toast.error("Failed to load recommendations");
        setLoading(false);
      }
    };

    // Fetch user wallet data
    const fetchWalletData = async () => {
      try {
        const response = await api.get(apiEndpoints.users.wallet);
        setWalletData(response.data);
      } catch (error) {
        console.error("Error fetching wallet data:", error);
      }
    };

    // Fetch upcoming sessions
    const fetchUpcomingSessions = async () => {
      try {
        const response = await api.get(apiEndpoints.users.sessions);
        setUpcomingSessions(response.data);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    };

    // Fetch user profile for location
    const fetchUserProfile = async () => {
      try {
        const response = await api.get(apiEndpoints.users.profile);
        setUserProfile(response.data);

        // Get location name if coordinates are available
        if (response.data.location?.coordinates) {
          const [lng, lat] = response.data.location.coordinates;
          if (lat !== 0 && lng !== 0) {
            const name = await getLocationName(lat, lng);
            setLocationName(name);
          } else {
            setLocationName("Location not set");
          }
        } else {
          setLocationName("Location not set");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchRecommendations();
    fetchWalletData();
    fetchUpcomingSessions();
    fetchUserProfile();
  }, []);

  const handleSwipe = (direction) => {
    if (!currentProfile) return;
    
    // If the match was accepted or super matched, show a success toast
    if (direction === "right" || direction === "super") {
      toast.success(`Connected with ${currentProfile.name}!`);
    }
    
    // Reset match analysis for next user
    setMatchAnalysis("");

    if (direction === "right") {
      dispatch(addNotification({
        id: crypto.randomUUID(),
        text: `Connection request sent to ${currentProfile.name}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: true,
      }));
    } else if (direction === "super") {
      toast.success(
        `You SUPER matched ${currentProfile.name}! Priority request sent.`,
        { icon: "✨" },
      );
      dispatch(addNotification({
        id: crypto.randomUUID(),
        text: `Super match sent to ${currentProfile.name}!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: true,
      }));
    }
    
    setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
    }, 300);
  };

  const currentProfile = recommendations[currentIndex];

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  // Transform API data to match UI structure
  const transformedProfile = currentProfile
    ? {
        _id: currentProfile._id,
        name: currentProfile.name,
        avatar: currentProfile.avatar,
        trustScore: currentProfile.trustScore || 50,
        distance:
          userProfile?.location?.coordinates &&
          currentProfile?.location?.coordinates
            ? calculateDistance(
                userProfile.location.coordinates[1], // user latitude
                userProfile.location.coordinates[0], // user longitude
                currentProfile.location.coordinates[1], // profile latitude
                currentProfile.location.coordinates[0], // profile longitude
              ).toFixed(1) + " km away"
            : "Location unknown",
        bio:
          currentProfile.bio || "Passionate about skill sharing and learning!",
        offered:
          currentProfile.skillsOffered?.map((skill) => skill.title) || [],
        wanted: currentProfile.skillsWanted?.map((skill) => skill.title) || [],
        badges:
          currentProfile.trustScore > 90
            ? ["Top Mentor", "Fast Responder"]
            : currentProfile.trustScore > 80
              ? ["Top Rated"]
              : ["New Member"],
      }
    : null;

  // Debug: Log distance calculation data
  console.log("Distance calculation debug:", {
    userProfileCoords: userProfile?.location?.coordinates,
    currentProfileCoords: currentProfile?.location?.coordinates,
    calculatedDistance: transformedProfile?.distance,
  });

  try {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[calc(100vh-120px)] pb-12">
        {/* Sidebar: User Info & Wallet */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-dark rounded-3xl p-6 flex flex-col space-y-6"
        >
          <div className="text-center">
            <div className="w-24 h-24 rounded-full mx-auto bg-slate-800 overflow-hidden ring-4 ring-primary/40 mb-4">
              {userInfo?.avatar ? (
                <img
                  src={userInfo.avatar}
                  alt="me"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  <span className="text-2xl font-bold">
                    {userInfo?.name ? userInfo.name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold">{userInfo?.name || "Guest User"}</h3>
            <p className="text-slate-200 text-sm flex items-center justify-center gap-1 mt-1">
              <MapPin className="w-4 h-4" /> {locationName}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <div className="text-slate-200 text-xs uppercase tracking-wider mb-1">
                Credits
              </div>
              <div className="text-2xl font-black text-emerald-400">
                {walletData.walletCredits}
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <div className="text-slate-200 text-xs uppercase tracking-wider mb-1">
                Trust
              </div>
              <div className="text-2xl font-black text-primary">
                {walletData.trustScore}%
              </div>
            </div>
          </div>

          <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 overflow-hidden flex flex-col">
            <h4 className="font-semibold mb-3 text-slate-300">
              Upcoming Sessions
            </h4>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {upcomingSessions.length === 0 ? (
                <div className="text-center text-slate-400 py-8">
                  <p>No upcoming sessions</p>
                </div>
              ) : (
                upcomingSessions.map((session, index) => {
                  if (!session) return null;
                  
                  // Use optional chaining for absolutely everything
                  const hostId = typeof session?.hostId === 'object' && session?.hostId !== null ? session?.hostId?._id : session?.hostId;
                  const currentUserId = userInfo?._id;
                  const isHost = Boolean(hostId && currentUserId && hostId === currentUserId);
                  
                  const otherUser = isHost ? session?.requesterId : session?.hostId;
                  const otherUserName = typeof otherUser === 'object' && otherUser !== null ? otherUser?.name : "User";
                  
                  const sessionDate = session?.scheduledDate ? new Date(session.scheduledDate) : new Date();
                  const isToday = sessionDate.toDateString() === new Date().toDateString();
                  const isTomorrow = sessionDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

                  return (
                    <div
                      key={session?._id || `session-${index}`}
                      className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-primary/50 transition-colors cursor-pointer group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">
                          {session?.skillId?.title || "Skill"}
                        </span>
                        <span
                          className={`text-xs px-2 rounded-full flex items-center gap-1 ${
                            isToday
                              ? "text-yellow-500 bg-yellow-500/10"
                              : "text-slate-400"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {isToday
                            ? `Today ${sessionDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : isTomorrow
                              ? "Tomorrow"
                              : sessionDate.toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          {isHost ? "With" : "Teaching"}{" "}
                          <strong className="text-slate-300">
                            {otherUserName}
                          </strong>
                        </span>
                        {isToday && (
                          <button
                            onClick={() => handleVideoCall(otherUserName)}
                            className="flex items-center gap-1 text-primary-light hover:text-white transition-colors"
                          >
                            <Video className="w-3 h-3" /> Join
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Barter matching area */}
        <div className="lg:col-span-3 flex flex-col items-center justify-center relative bg-gradient-to-b from-transparent to-black/20 rounded-[2rem] overflow-hidden border border-white/5 py-6">
          <div
            className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-overlay"
            style={{
              backgroundImage:
                'url("https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80")',
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <div className="z-10 w-full flex flex-col items-center justify-center relative min-h-full">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-slate-200">
                  AI is finding your best matches...
                </p>
              </div>
            ) : transformedProfile ? (
              <div
                key={transformedProfile._id || currentIndex}
                className="w-full max-w-sm glass-dark rounded-[2rem] p-5 shadow-2xl relative border border-white/10"
              >
                <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-yellow-400 flex items-center gap-1 z-10">
                  <Star className="w-3 h-3 fill-yellow-400" />{" "}
                  {transformedProfile.trustScore}% Trust
                </div>

                <div className="h-48 md:h-56 w-full rounded-2xl overflow-hidden mb-4 bg-slate-800">
                  <img
                    src={transformedProfile.avatar}
                    alt={transformedProfile.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="px-2">
                  <div className="flex justify-between items-end mb-1">
                    <h2 className="text-3xl font-black">
                      {transformedProfile.name}
                    </h2>
                    <span className="text-slate-200 text-sm flex items-center gap-1 font-medium bg-white/5 px-2 py-1 rounded-lg">
                      <MapPin className="w-4 h-4 text-secondary" />{" "}
                      {transformedProfile.distance}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 italic mb-3">
                    "{transformedProfile.bio}"
                  </p>

                  <div className="flex gap-2 mb-4">
                    {transformedProfile.badges.map((badge, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold bg-secondary/20 text-secondary border border-secondary/30 px-2 py-1 rounded-md"
                      >
                        {badge === "Top Mentor" ? (
                          <Award className="w-3 h-3" />
                        ) : (
                          <Zap className="w-3 h-3" />
                        )}{" "}
                        {badge}
                      </span>
                    ))}
                  </div>

                  {!matchAnalysis ? (
                    <button
                      onClick={() => handleAnalyzeMatch(transformedProfile._id)}
                      disabled={isAnalyzingMatch}
                      className="w-full mb-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 hover:from-purple-500/40 hover:to-indigo-500/40 border border-purple-500/30 text-purple-300 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isAnalyzingMatch ? "Analyzing Compatibility..." : "Ask AI Matchmaker"}
                    </button>
                  ) : (
                    <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
                      <div className="flex items-center gap-1 mb-1 text-purple-300 text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-3 h-3" /> AI Match Analysis
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {matchAnalysis}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3 mt-3">
                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-slate-300 mb-2 font-bold">
                        They can teach
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {transformedProfile.offered.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-primary/20 text-primary-light border border-primary/30 px-3 py-1 rounded-full text-sm font-semibold"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs uppercase tracking-widest text-slate-300 mb-2 font-bold">
                        They want to learn
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {transformedProfile.wanted.map((skill, i) => (
                          <span
                            key={i}
                            className="bg-white/5 text-slate-300 border border-white/10 px-3 py-1 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                      onClick={() => handleSwipe("left")}
                      className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/50 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all hover:scale-110 shadow-lg"
                    >
                      <X className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => handleSwipe("super")}
                      className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/50 flex items-center justify-center text-blue-400 hover:bg-blue-500 hover:text-white transition-all hover:scale-110 shadow-lg"
                      title="Super Match"
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                    <button
                      onClick={() => handleSwipe("right")}
                      className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/50 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all hover:scale-110 shadow-lg"
                    >
                      <Check className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">No more matches!</h3>
                <p className="text-slate-200">
                  Expand your search radius or check back later.
                </p>
                <button className="mt-6 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors font-medium">
                  Refresh Matches
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Explore rendering error:", error);
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
        <h2 className="text-red-500 text-3xl font-bold mb-4">CRASH DETECTED</h2>
        <p className="text-slate-300 mb-4">{error.message}</p>
        <pre className="text-left bg-black/50 p-4 rounded-xl text-xs overflow-auto max-w-2xl text-red-300">
          {error.stack}
        </pre>
      </div>
    );
  }
};

export default Explore;
