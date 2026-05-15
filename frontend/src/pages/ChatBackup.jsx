import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  CheckCheck,
  Coins,
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  User,
  Flag,
  ShieldBan,
  Trash2,
  X,
  Circle,
} from "lucide-react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../utils/axios.js";
import apiEndpoints from "../utils/api.js";
import { useSelector } from "react-redux";

const ENDPOINT = "https://barter-system-2ml4.onrender.com";
var socket;

const Chat = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  // Fetch conversations/connections
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login to view messages");
          return;
        }

        // Fetch connected profiles from Explore (users you've matched with)
        const response = await api.get(
          apiEndpoints.users.connections || "/api/users/connections",
        );

        // Transform connections to conversation format
        const transformedConversations = response.data.map((user) => {
          const isOnline = onlineUsers.has(user._id);
          console.log(
            `User ${user.name} (${user._id}) isOnline:`,
            isOnline,
            "Online users:",
            Array.from(onlineUsers),
          );

          return {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
            lastMessage: user.lastMessage || "No messages yet...",
            lastMessageTime: user.lastMessageTime,
            unreadCount: user.unreadCount || 0,
            trustScore: user.trustScore || 50,
            location: user.location,
            skillsOffered: user.skillsOffered || [],
            skillsWanted: user.skillsWanted || [],
            isOnline: isOnline,
          };
        });

        setConversations(transformedConversations);
        if (transformedConversations.length > 0) {
          setActiveContact(transformedConversations[0]);
          await fetchMessages(transformedConversations[0]._id);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast.error("Failed to load conversations");
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userInfo, onlineUsers]);

  // Fetch messages for specific conversation
  const fetchMessages = async (userId) => {
    try {
      // First try to load from localStorage for persistence
      const chatKey = `chat_${userId}`;
      const storedMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");

      if (storedMessages.length > 0) {
        setMessages(storedMessages);
      }

      // Also try to fetch from API (for cross-device sync)
      const response = await api.get(`/api/messages/${userId}`);
      if (response.data && response.data.length > 0) {
        setMessages(response.data);
        // Update localStorage with server data
        localStorage.setItem(chatKey, JSON.stringify(response.data));
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      // Fallback to localStorage only
      const chatKey = `chat_${userId}`;
      const storedMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");
      setMessages(storedMessages);
    }
  };

  const [newMessage, setNewMessage] = useState("");
  const handleContactClick = async (contact) => {
    setActiveContact(contact);
    await fetchMessages(contact._id);
    setShowDropdown(false);
  };
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef(null);

  // Action Modals State
  const [activeModal, setActiveModal] = useState(null); // 'profile', 'report', 'block', 'offer', null
  const [offerType, setOfferType] = useState("barter");
  const [offerValue, setOfferValue] = useState("");

  const handleClearChat = () => {
    if (
      window.confirm("Are you sure you want to clear this entire chat history?")
    ) {
      setMessages([]);
      toast.success("Chat history cleared");
      setShowDropdown(false);
    }
  };

  const handleBlockUser = () => {
    toast.error("Alex Johnson has been blocked.", { icon: "🚫" });
    setActiveModal(null);
    // In real app, redirect to another chat or dashboard
  };

  const handleReportUser = () => {
    toast.success("Report submitted successfully. Our team will review this.", {
      icon: "✅",
    });
    setActiveModal(null);
  };

  const handleVideoCall = () => {
    // Direct users to 'meat.google.com/new' which automatically creates a valid, instant meeting
    const meetLink = `https://meet.google.com/new`;

    const msg = {
      id: Date.now(),
      sender: "me",
      text: `Let's connect on a video call! Join here: ${meetLink}`,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isInvite: true,
      link: meetLink,
    };

    setMessages([...messages, msg]);
    socket.emit("new message", msg);
    toast.success("Google Meet invite sent!");

    // Open the meet link in a new tab
    window.open(meetLink, "_blank");
  };

  const handleAudioCall = () => {
    if (activeContact.phone) {
      window.open(`tel:${activeContact.phone}`, "_self");
      toast.success(`Calling ${activeContact.name}...`);
    } else {
      toast.error("No phone number available for this user");
    }
  };

  const handleSendOffer = () => {
    if (!offerValue.trim()) return;

    const msg = {
      id: Date.now(),
      sender: "me",
      text: "",
      isOffer: true,
      offerDetails: {
        type: offerType,
        value: offerValue,
        status: "pending", // pending, accepted, declined
      },
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, msg]);
    socket.emit("new message", msg);
    setActiveModal(null);
    setOfferValue("");
    toast.success("Deal proposed!");
  };

  useEffect(() => {
    socket = io(ENDPOINT);

    // Setup socket with user ID
    if (userInfo?._id) {
      console.log("Setting up socket with user ID:", userInfo._id);
      socket.emit("setup", userInfo._id);

      // Listen for online users updates
      socket.on("online users", (users) => {
        console.log("Received online users:", users);
        setOnlineUsers(new Set(users));
      });

      // Listen for user coming online
      socket.on("user online", (userId) => {
        console.log("User came online:", userId);
        setOnlineUsers((prev) => new Set([...prev, userId]));
      });

      // Listen for user going offline
      socket.on("user offline", (userId) => {
        console.log("User went offline:", userId);
        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Listen for incoming messages
      socket.on("message received", (message) => {
        console.log("Message received:", message);

        // Only add message if it's for the current active contact
        if (
          activeContact &&
          (message.recipientId === activeContact._id ||
            message.sender === activeContact._id)
        ) {
          const chatKey = `chat_${activeContact._id}`;
          const existingMessages = JSON.parse(
            localStorage.getItem(chatKey) || '[]'
          );
          existingMessages.push(message);
          localStorage.setItem(chatKey, JSON.stringify(existingMessages));
        }
      });

      // ...

      // Simplified message handling for testing
      const handleSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact?._id) return;

        const msg = {
          id: Date.now(),
          sender: userInfo._id, // Use actual user ID
          recipientId: activeContact._id,
          text: newMessage,
          senderName: userInfo.name, // Add sender name
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          if(!file) return;

          // Basic validation for images
          if(!file.type.startsWith("image/")) {
    toast.error("Only image files are supported in this demo");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const msg = {
      id: Date.now(),
      sender: "me",
      text: "",
      image: event.target.result,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, msg]);
    socket.emit("new message", msg);
  };
  reader.readAsDataURL(file);
};

return (
  <div className="h-[calc(100vh-140px)] flex gap-6">
    {/* Sidebar - Contacts */}
    <div className="w-80 glass-dark rounded-3xl overflow-hidden flex flex-col border border-white/5">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold">Messages</h2>
        <input
          type="text"
          placeholder="Search connections..."
          className="w-full mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p>No conversations yet</p>
          </div>
        ) : (
          conversations.map((contact) => (
            <div
              key={contact._id}
              onClick={() => handleContactClick(contact)}
              className={`p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 ${activeContact?._id === contact._id ? "bg-primary/10 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"}`}
            >
              <div className="relative">
                <img
                  src={
                    contact.avatar ||
                    `https://i.pravatar.cc/150?u=${contact.name}`
                  }
                  className="w-12 h-12 rounded-full object-cover shadow-lg"
                />
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1f2e] ${contact.isOnline ? "bg-emerald-500" : "bg-slate-500"
                    }`}
                ></div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h4
                    className={`font-bold truncate ${activeContact?._id === contact._id ? "text-primary-light" : ""}`}
                  >
                    {contact.name}
                  </h4>
                  <span className="text-xs text-slate-300 font-medium whitespace-nowrap">
                    {contact.lastMessageTime
                      ? new Date(contact.lastMessageTime).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )
                      : ""}
                  </span>
                </div>
                <p className="text-sm text-slate-200 truncate w-full">
                  {contact.lastMessage || "No messages yet..."}
                </p>
                {contact.unreadCount > 0 && (
                  <div className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mt-1">
                    {contact.unreadCount}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Main Chat Area */}
    <div className="flex-1 glass-dark rounded-3xl flex flex-col overflow-hidden border border-white/5 relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Chat Header */}
      <div className="p-4 px-6 border-b border-white/10 flex justify-between items-center bg-white/5 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <img
            src={
              activeContact?.avatar ||
              `https://i.pravatar.cc/150?u=${activeContact?.name}`
            }
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-bold text-lg leading-tight">
              {activeContact?.name || "Select a conversation"}
            </h3>
            <p className="text-xs font-semibold tracking-wide flex items-center gap-1">
              <Circle
                className={`w-2 h-2 shrink-0 fill-current ${activeContact?.isOnline
                  ? "text-emerald-500"
                  : "text-slate-400"
                  }`}
              />
              <span
                className={
                  activeContact?.isOnline
                    ? "text-emerald-500"
                    : "text-slate-400"
                }
              >
                {activeContact?.isOnline ? "Online" : "Offline"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveModal("offer")}
            className="p-2 border border-secondary text-secondary hover:bg-secondary hover:text-white rounded-xl transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-secondary/20"
          >
            <Coins className="w-4 h-4" /> Offer Deal
          </button>
          <div className="w-px h-6 bg-white/10 mx-2"></div>
          <button
            onClick={handleAudioCall}
            className="text-slate-200 hover:text-emerald-400 transition-colors"
          >
            <Phone className="w-5 h-5" />
          </button>
          <button
            onClick={handleVideoCall}
            className="text-slate-200 hover:text-primary transition-colors"
          >
            <Video className="w-5 h-5" />
          </button>
          <div className="relative z-50">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="text-slate-200 hover:text-white transition-colors ml-2 flex items-center"
            >
              <MoreVertical className="w-5 h-5 cursor-pointer" />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-56 bg-slate-800 border border-white/10 rounded-xl shadow-2xl py-2 z-[60] overflow-hidden"
                >
                  <button
                    onClick={() => {
                      setActiveModal("profile");
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm transition-colors text-slate-200 font-medium whitespace-nowrap"
                  >
                    <User className="w-4 h-4 text-emerald-400" /> View Profile
                  </button>
                  <button
                    onClick={handleClearChat}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm transition-colors text-slate-200 font-medium whitespace-nowrap border-t border-white/5"
                  >
                    <Trash2 className="w-4 h-4 text-orange-400" /> Clear Chat
                  </button>
                  <button
                    onClick={() => {
                      setActiveModal("report");
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-sm transition-colors text-slate-200 font-medium whitespace-nowrap border-t border-white/5"
                  >
                    <Flag className="w-4 h-4 text-yellow-400" /> Report User
                  </button>
                  <button
                    onClick={() => {
                      setActiveModal("block");
                      setShowDropdown(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 text-sm transition-colors text-red-400 font-medium whitespace-nowrap border-t border-white/5"
                  >
                    <ShieldBan className="w-4 h-4" /> Block User
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 p-6 overflow-y-auto space-y-6 z-0"
        onClick={() => setShowDropdown(false)}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50 space-y-4">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
              <User className="w-10 h-10 text-slate-300" />
            </div>
            <p>
              No messages here yet. Say hi to{" "}
              {activeContact?.name || "your contact"}!
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex flex-col ${msg.sender === "me" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-xl ${msg.sender === "me"
                  ? "bg-gradient-to-r from-primary to-indigo-600 text-white rounded-br-sm"
                  : "bg-white/10 text-white border border-white/5 rounded-bl-sm backdrop-blur-md"
                  }`}
              >
                {msg.isInvite ? (
                  <div className="flex flex-col gap-2">
                    <p>Let's connect on a video call!</p>
                    <a
                      href={msg.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-bold w-full justify-center"
                    >
                      <Video className="w-4 h-4" /> Join Google Meet
                    </a>
                  </div>
                ) : msg.isOffer ? (
                  <div className="flex flex-col gap-3 min-w-[200px]">
                    <div className="flex items-center gap-2 border-b border-white/20 pb-2">
                      <Coins className="w-5 h-5 text-secondary" />
                      <span className="font-bold text-sm text-secondary">
                        Deal Proposed
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-white/70 mb-1">
                        {msg.offerDetails.type === "barter"
                          ? "Barter Exchange"
                          : "Credit Payment"}
                      </p>
                      <p className="font-semibold text-lg">
                        {msg.offerDetails.value}
                      </p>
                    </div>
                    {msg.sender === "other" &&
                      msg.offerDetails.status === "pending" && (
                        <div className="flex gap-2 mt-2">
                          <button className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold transition-colors">
                            Accept
                          </button>
                          <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors border border-white/5">
                            Decline
                          </button>
                        </div>
                      )}
                  </div>
                ) : msg.image ? (
                  <img
                    src={msg.image}
                    alt="Attachment"
                    className="max-w-full rounded-lg max-h-60 object-cover"
                  />
                ) : (
                  msg.text
                )}
              </div>
              <div className="text-xs text-slate-300 mt-2 flex items-center gap-1 font-medium mx-1">
                {msg.time}{" "}
                {msg.sender === "me" && (
                  <CheckCheck className="w-3 h-3 text-primary" />
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 px-6 border-t border-white/10 bg-black/20 z-10">
        <form onSubmit={handleSend} className="flex items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-200 hover:text-white hover:bg-white/5 rounded-full transition-colors shrink-0"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-white/5 border border-white/10 rounded-full py-3 px-6 text-white focus:outline-none focus:border-primary/50 transition-colors placeholder:text-slate-300"
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-r from-primary to-secondary text-white rounded-full hover:scale-105 transition-transform shadow-lg shadow-primary/30 shrink-0"
          >
            <Send className="w-5 h-5 translate-x-px" />
          </button>
        </form>
      </div>
    </div>

    {/* Action Modals */}
    <AnimatePresence>
      {activeModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveModal(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
          >
            {/* Profile Modal */}
            {activeModal === "profile" && (
              <div>
                <div className="relative h-32 bg-gradient-to-r from-primary/40 to-indigo-600/40">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="absolute top-4 right-4 w-8 h-8 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="px-6 pb-6 pt-0 relative text-center">
                  <img
                    src={`https://i.pravatar.cc/150?img=${activeContact.avatar}`}
                    className="w-24 h-24 rounded-full border-4 border-slate-900 mx-auto -mt-12 mb-4 object-cover"
                  />
                  <h3 className="text-2xl font-bold mb-1">
                    {activeContact.name}
                  </h3>
                  <p className="text-emerald-400 font-medium text-sm mb-4">
                    {activeContact.role}
                  </p>
                  <p className="text-slate-300 text-sm mb-6">
                    {activeContact.bio}
                  </p>

                  <div className="flex gap-4 justify-center">
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      <div className="text-xs text-slate-400 mb-1">
                        Trust Score
                      </div>
                      <div className="font-bold text-lg text-primary">
                        {activeContact.trust}
                      </div>
                    </div>
                    <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                      <div className="text-xs text-slate-400 mb-1">
                        Location
                      </div>
                      <div className="font-bold text-lg">
                        {activeContact.distance}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Report Modal */}
            {activeModal === "report" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Flag className="text-yellow-500 w-5 h-5" /> Report User
                  </h3>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-300 text-sm mb-4">
                  Why are you reporting {activeContact.name}?
                </p>
                <div className="space-y-2 mb-6">
                  {[
                    "Spam or scams",
                    "Harassment or hate speech",
                    "Inappropriate content",
                    "Other",
                  ].map((reason) => (
                    <label
                      key={reason}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        className="text-primary focus:ring-primary accent-primary w-4 h-4"
                      />
                      <span className="text-slate-200 text-sm">{reason}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2 rounded-full hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReportUser}
                    className="px-5 py-2 rounded-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-sm transition-colors shadow-lg"
                  >
                    Submit Report
                  </button>
                </div>
              </div>
            )}

            {/* Block Modal */}
            {activeModal === "block" && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                  <ShieldBan className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Block {activeContact.name}?
                </h3>
                <p className="text-slate-300 text-sm mb-6">
                  They will not be able to message you, find your profile, or
                  see your activity. They will not be explicitly notified that
                  you blocked them.
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleBlockUser}
                    className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-lg shadow-red-500/20"
                  >
                    Yes, Block User
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Offer Deal Modal */}
            {activeModal === "offer" && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Coins className="text-secondary w-6 h-6" /> Propose a
                    Deal
                  </h3>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-slate-300 text-sm mb-6">
                  What would you like to offer {activeContact.name}?
                </p>

                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => setOfferType("barter")}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all border ${offerType === "barter" ? "bg-primary/20 border-primary text-primary-light" : "bg-transparent border-white/10 text-slate-400 hover:bg-white/5"}`}
                  >
                    Skill Barter
                  </button>
                  <button
                    onClick={() => setOfferType("credits")}
                    className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all border ${offerType === "credits" ? "bg-secondary/20 border-secondary text-secondary" : "bg-transparent border-white/10 text-slate-400 hover:bg-white/5"}`}
                  >
                    Credits
                  </button>
                </div>

                <div className="mb-6">
                  <label className="block text-xs text-slate-400 font-medium mb-2 uppercase tracking-wide">
                    {offerType === "barter"
                      ? "What skill/service will you provide?"
                      : "How many credits?"}
                  </label>
                  <input
                    type={offerType === "credits" ? "number" : "text"}
                    placeholder={
                      offerType === "barter"
                        ? "e.g., 2 hours of React tutoring"
                        : "e.g., 500"
                    }
                    value={offerValue}
                    onChange={(e) => setOfferValue(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-secondary transition-colors"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-5 py-2 rounded-full hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendOffer}
                    className="px-5 py-2 rounded-full bg-secondary hover:bg-[#e6b800] text-black font-bold text-sm transition-colors shadow-lg"
                  >
                    Send Offer
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);
};

export default Chat;
