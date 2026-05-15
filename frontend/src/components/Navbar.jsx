import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { motion } from "framer-motion";
import { LogOut, User, Menu, Bell, Search } from "lucide-react";
import { markAllAsRead, markAsRead } from "../redux/notificationSlice";
import api from "../utils/axios.js";
import apiEndpoints from "../utils/api.js";

const Navbar = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef();
  
  // Search state
  const searchRef = useRef();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() === "") {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const token = localStorage.getItem("token") || userInfo?.token;
        if (!token) return;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await api.get(`${apiEndpoints.users.search}?q=${searchQuery}`, config);
        setSearchResults(res.data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, userInfo]);

  const { notifications } = useSelector((state) => state.notifications);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="fixed w-full z-50 top-0 left-0"
    >
      <div className="absolute inset-0 glass-dark pointer-events-none border-b border-white/10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="font-extrabold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SkillSwap
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="relative group" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-200" />
              <input
                type="text"
                placeholder="Find skills nearby..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => {
                  if (searchQuery.trim() !== "") setShowSearchResults(true);
                }}
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/50 text-white placeholder:text-slate-200 transition-all"
              />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchQuery.trim() !== "" && (
                <div className="absolute top-full mt-2 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-[100] overflow-hidden left-0 max-h-[28rem] overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-slate-400 text-sm">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Profiles
                      </div>
                      {searchResults.map((user) => (
                        <div
                          key={user._id}
                          className="px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0"
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery("");
                            navigate("/explore"); 
                          }}
                        >
                          <img
                            src={user.avatar || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white truncate">{user.name}</h4>
                            <p className="text-xs text-primary truncate">
                              {user.skillsOffered?.map(s => s.title).join(", ") || "Willing to learn"}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-sm">No profiles found for "{searchQuery}"</div>
                  )}
                </div>
              )}
            </div>

            {userInfo ? (
              <>
                <Link
                  to="/"
                  className="text-slate-300 hover:text-white transition-colors font-medium"
                >
                  Home
                </Link>
                <Link
                  to="/explore"
                  className="text-slate-300 hover:text-white transition-colors font-medium"
                >
                  Explore
                </Link>
                <Link
                  to="/chat"
                  className="text-slate-300 hover:text-white transition-colors font-medium"
                >
                  Chat
                </Link>
                <Link
                  to="/wallet"
                  className="text-slate-300 hover:text-white transition-colors font-medium"
                >
                  Wallet
                </Link>
                <div className="relative" ref={notifRef}>
                  <div
                    className="relative cursor-pointer"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="w-6 h-6 text-slate-300 hover:text-white transition-colors" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-background-dark flex items-center justify-center text-[10px] font-bold text-background-dark">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="absolute right-0 mt-4 w-80 glass-dark border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                      <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
                        <h3 className="font-bold text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span
                            onClick={handleMarkAllRead}
                            className="text-xs text-secondary hover:text-white cursor-pointer transition-colors font-semibold"
                          >
                            Mark all as read
                          </span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-400 text-sm">
                            No notifications
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-4 border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer flex gap-3 ${notif.unread ? "bg-primary/5" : ""}`}
                              onClick={() => {
                                if (notif.unread) {
                                  dispatch(markAsRead(notif.id));
                                }
                              }}
                            >
                              <div
                                className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.unread ? "bg-secondary" : "bg-transparent"}`}
                              ></div>
                              <div>
                                <p
                                  className={`text-sm leading-snug ${notif.unread ? "text-white font-medium" : "text-slate-300"}`}
                                >
                                  {notif.text}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {notif.time}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="p-3 text-center border-t border-white/10">
                        <span className="text-sm text-primary hover:text-white cursor-pointer transition-colors">
                          View All Settings
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                  <span className="text-sm font-semibold text-white">
                    {userInfo.name}
                  </span>
                  <Link to="/profile">
                    <div className="w-10 h-10 rounded-full cursor-pointer bg-slate-800 overflow-hidden ring-2 ring-primary/50 hover:ring-primary transition-all">
                      <img
                        src={
                          userInfo.avatar ||
                          "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
                        }
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-slate-200 hover:text-secondary transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-slate-300 hover:text-white font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full bg-white text-black font-semibold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            <button className="text-white p-2">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
