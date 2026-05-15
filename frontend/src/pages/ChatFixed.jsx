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
import { useSelector } from "react-redux";

const ENDPOINT = "http://localhost:5000";
var socket;

const Chat = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const [conversations, setConversations] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [newMessage, setNewMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch conversations/connections
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login to view messages");
          return;
        }

        const response = await api.get("/api/users/connections");
        
        const transformedConversations = response.data.map((user) => {
          const isOnline = onlineUsers.has(user._id);
          console.log(`User ${user.name} (${user._id}) isOnline:`, isOnline);
          
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
          loadMessages(transformedConversations[0]._id);
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

  // Load messages from localStorage
  const loadMessages = (userId) => {
    const chatKey = `chat_${userId}`;
    const storedMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");
    setMessages(storedMessages);
  };

  const handleContactClick = (contact) => {
    setActiveContact(contact);
    loadMessages(contact._id);
    setShowDropdown(false);
  };

  // Socket.io setup
  useEffect(() => {
    socket = io(ENDPOINT);

    if (userInfo?._id) {
      console.log("Setting up socket with user ID:", userInfo._id);
      socket.emit("setup", userInfo._id);

      socket.on("online users", (users) => {
        console.log("Received online users:", users);
        setOnlineUsers(new Set(users));
      });

      socket.on("message received", (message) => {
        console.log("Message received:", message);
        
        if (activeContact && message.recipientId === activeContact._id) {
          setMessages((prev) => [...prev, message]);
          
          const chatKey = `chat_${activeContact._id}`;
          const existingMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");
          existingMessages.push(message);
          localStorage.setItem(chatKey, JSON.stringify(existingMessages));
        }
      });
    }

    return () => {
      socket.disconnect();
    };
  }, [userInfo, activeContact]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact?._id) return;

    const msg = {
      id: Date.now(),
      sender: userInfo._id,
      recipientId: activeContact._id,
      text: newMessage,
      senderName: userInfo.name,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Add to local state
    setMessages((prev) => [...prev, msg]);
    
    // Save to localStorage
    const chatKey = `chat_${activeContact._id}`;
    const existingMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");
    existingMessages.push(msg);
    localStorage.setItem(chatKey, JSON.stringify(existingMessages));
    
    // Send via socket
    socket.emit("new message", msg);
    setNewMessage("");
    
    console.log("Message sent:", msg);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Sidebar - Contacts */}
      <div className="w-80 glass-dark rounded-3xl overflow-hidden flex flex-col border border-white/5">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold">Messages</h2>
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
                className={`p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 ${
                  activeContact?._id === contact._id
                    ? "bg-primary/10 border-l-4 border-l-primary"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                <div className="relative">
                  <img
                    src={contact.avatar || `https://i.pravatar.cc/150?u=${contact.name}`}
                    className="w-12 h-12 rounded-full object-cover shadow-lg"
                  />
                  <div
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#1a1f2e] ${
                      contact.isOnline ? "bg-emerald-500" : "bg-slate-500"
                    }`}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4
                      className={`font-bold truncate ${
                        activeContact?._id === contact._id ? "text-primary-light" : ""
                      }`}
                    >
                      {contact.name}
                    </h4>
                  </div>
                  <p className="text-sm text-slate-200 truncate w-full">
                    {contact.lastMessage || "No messages yet..."}
                  </p>
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
              src={activeContact?.avatar || `https://i.pravatar.cc/150?u=${activeContact?.name}`}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h3 className="font-bold text-lg leading-tight">
                {activeContact?.name || "Select a conversation"}
              </h3>
              <p className="text-xs font-semibold tracking-wide flex items-center gap-1">
                <Circle
                  className={`w-2 h-2 shrink-0 fill-current ${
                    activeContact?.isOnline ? "text-emerald-500" : "text-slate-400"
                  }`}
                />
                <span
                  className={
                    activeContact?.isOnline ? "text-emerald-500" : "text-slate-400"
                  }
                >
                  {activeContact?.isOnline ? "Online" : "Offline"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 z-0">
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
            messages.map((msg) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === userInfo._id ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-xl ${
                    msg.sender === userInfo._id
                      ? "bg-gradient-to-r from-primary to-indigo-600 text-white rounded-br-sm"
                      : "bg-white/10 text-white border border-white/5 rounded-bl-sm backdrop-blur-md"
                  }`}
                >
                  <div>
                    <p className="font-medium">{msg.text}</p>
                    {msg.senderName && msg.sender !== userInfo._id && (
                      <p className="text-xs text-slate-400 mt-1">
                        {msg.senderName}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-300 mt-2 flex items-center gap-1 font-medium mx-1">
                  {msg.time}{" "}
                  {msg.sender === userInfo._id && (
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
    </div>
  );
};

export default Chat;
