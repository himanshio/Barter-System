import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, MapPin, Phone } from "lucide-react";
import { useDispatch } from "react-redux";
import { setCredentials } from "../redux/authSlice";
import api from "../utils/axios.js";
import toast from "react-hot-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    latitude: null,
    longitude: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationInput, setLocationInput] = useState(
    "Detecting your location...",
  );

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocationInput("Detecting...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // Update form data with coordinates
        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));

        // Get location name using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
          );
          const data = await response.json();

          if (data && data.address) {
            const { city, state, country } = data.address;
            const parts = [city, state, country].filter(Boolean);
            const locationName =
              parts.length > 0 ? parts.join(", ") : "Unknown location";
            setLocationInput(locationName);
            toast.success(`Location detected: ${locationName}`);
          } else {
            setLocationInput(`Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`);
            toast.success("Location detected!");
          }
        } catch (error) {
          setLocationInput(`Lat: ${lat.toFixed(2)}, Lng: ${lng.toFixed(2)}`);
          toast.success("Location detected!");
        }
      },
      () => {
        setLocationInput("Location access denied");
        toast.error("Unable to retrieve your location");
      },
    );
  };

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Auto-detect location on component mount
  useEffect(() => {
    handleAutoDetect();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/api/auth/register", formData);
      dispatch(setCredentials(res.data));
      localStorage.setItem("token", res.data.token);
      toast.success("Account successfully created!", { icon: "🎉" });
      navigate("/explore");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center relative">
      <div className="absolute inset-0 bg-secondary/10 blur-[150px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg p-8 sm:p-10 glass-dark rounded-3xl shadow-2xl border border-white/10 z-10"
      >
        <div className="text-center mb-8">
          <h2 className="text-4xl font-black mb-2 tracking-tight">
            Create Account
          </h2>
          <p className="text-slate-200 font-light">
            Join the revolution of skill trading
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within:text-secondary transition-colors" />
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Full Name"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within:text-secondary transition-colors" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Email address"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within:text-secondary transition-colors" />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Password"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="relative group">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-200 group-focus-within:text-secondary transition-colors" />
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="Phone Number"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/50 transition-all placeholder:text-slate-300"
            />
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5 mt-4">
            <MapPin className="text-secondary w-6 h-6" />
            <div
              className={`text-sm flex-1 ${locationInput.includes("Lat") ? "text-white font-medium" : "text-slate-300"}`}
            >
              {locationInput}
            </div>
            <button
              type="button"
              onClick={handleAutoDetect}
              className="text-xs bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors shrink-0"
            >
              Auto Detect
            </button>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 mt-6 rounded-2xl bg-gradient-to-r from-secondary to-purple-600 text-white font-bold text-lg hover:scale-[1.02] transition-transform shadow-lg shadow-secondary/25 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Creating Account..." : "Sign Up"}
            {!loading && (
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </form>

        <p className="text-center text-slate-200 mt-8 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-white font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Register;
