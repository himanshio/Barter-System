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
  Bell,
  MessageSquare,
} from "lucide-react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../utils/axios.js";
import { useSelector, useDispatch } from "react-redux";
import { addNotification } from "../redux/notificationSlice";

const ENDPOINT = import.meta.env.VITE_API_URL;

const Chat = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [conversations, setConversations] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [newMessage, setNewMessage] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationMessages, setNotificationMessages] = useState([]);
  const fileInputRef = useRef(null);
  const socketRef = useRef(null);
  const activeContactRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Action Modals State
  const [activeModal, setActiveModal] = useState(null);
  const [offerType, setOfferType] = useState("barter");
  const [offerValue, setOfferValue] = useState("");

  // Call Modal State
  const [showCallModal, setShowCallModal] = useState(false);
  const [callType, setCallType] = useState("whatsapp"); // 'whatsapp' or 'phone'
  const [callPhoneNumber, setCallPhoneNumber] = useState("");

  const handleClearChat = () => {
    setActiveModal("clear");
    setShowDropdown(false);
  };

  const executeClearChat = async () => {
    if (!activeContact) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/api/messages/${activeContact._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages([]);
      localStorage.removeItem(`chat_${activeContact._id}`);
      toast.success("Chat history cleared");
      setActiveModal(null);
    } catch (error) {
      console.error("Error clearing chat:", error);
      toast.error("Failed to clear chat history");
      setActiveModal(null);
    }
  };

  const handleBlockUser = () => {
    if (activeContact) {
      toast.error(`${activeContact.name} has been blocked.`, { icon: "🚫" });
    }
    setActiveModal(null);
  };

  const handleReportUser = () => {
    toast.success("Report submitted successfully. Our team will review this.", { icon: "✅" });
    setActiveModal(null);
  };

  const handleSendOffer = () => {
    if (!offerValue.trim() || !activeContact?._id || !socketRef.current) return;

    const msg = {
      id: crypto.randomUUID(),
      sender: userInfo._id,
      recipientId: activeContact._id,
      text: "",
      senderName: userInfo.name,
      isOffer: true,
      offerDetails: {
        type: offerType,
        value: offerValue,
        status: "pending",
      },
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, msg]);
    socketRef.current.emit("new message", msg);
    setActiveModal(null);
    setOfferValue("");
    setShowDropdown(false);
    toast.success("Deal proposed!");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !activeContact?._id || !socketRef.current) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported in this demo");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const msg = {
        id: crypto.randomUUID(),
        sender: userInfo._id,
        recipientId: activeContact._id,
        text: "",
        senderName: userInfo.name,
        image: event.target.result,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, msg]);
      socketRef.current.emit("new message", msg);
    };
    reader.readAsDataURL(file);
  };

  // Clear notifications
  const clearNotifications = () => {
    setUnreadNotifications(0);
    setNotificationMessages([]);
    // Reset unread counts for all conversations
    setConversations((prev) =>
      prev.map((conv) => ({
        ...conv,
        unreadCount: 0,
        newUnreadCount: 0,
      })),
    );
  };

  // Calculate unread notifications (only for new messages after page load)
  const calculateUnreadNotifications = () => {
    // Don't show initial unread counts on page refresh
    // Only count notifications for new messages received
    const totalUnread = conversations.reduce((total, conv) => {
      // Only count if this is a new unread message (not from initial load)
      return total + (conv.newUnreadCount || 0);
    }, 0);
    setUnreadNotifications(totalUnread);
  };

  // Update unread notifications when conversations change
  useEffect(() => {
    calculateUnreadNotifications();
  }, [conversations]);

  // Fetch conversations/connections
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error("Please login to view messages");
          return;
        }

        const [connectionsRes, conversationsRes] = await Promise.all([
          api.get("/api/users/connections"),
          api.get("/api/messages/conversations")
        ]);

        const connections = connectionsRes.data;
        const activeConvs = conversationsRes.data;

        const activeConvsMap = new Map();
        activeConvs.forEach(conv => activeConvsMap.set(conv._id.toString(), conv));

        const allUsersMap = new Map();
        connections.forEach(user => allUsersMap.set(user._id.toString(), user));

        const mergedConversations = [];

        // 1. Add all active conversations first (they are already sorted by time from backend)
        activeConvs.forEach(conv => {
          const fullUser = allUsersMap.get(conv._id.toString());
          if (fullUser) {
            mergedConversations.push({
              _id: fullUser._id,
              name: fullUser.name,
              avatar: fullUser.avatar,
              lastMessage: conv.lastMessage,
              lastMessageTime: conv.lastMessageTime,
              unreadCount: conv.unreadCount || 0,
              newUnreadCount: 0,
              trustScore: fullUser.trustScore || 50,
              location: fullUser.location,
              skillsOffered: fullUser.skillsOffered || [],
              skillsWanted: fullUser.skillsWanted || [],
              isOnline: onlineUsers.has(fullUser._id.toString()),
              bio: fullUser.bio
            });
          } else {
            mergedConversations.push({
              _id: conv._id,
              name: conv.name,
              avatar: conv.avatar,
              lastMessage: conv.lastMessage,
              lastMessageTime: conv.lastMessageTime,
              unreadCount: conv.unreadCount || 0,
              newUnreadCount: 0,
              isOnline: onlineUsers.has(conv._id.toString()),
            });
          }
        });

        // 2. Add remaining connections
        connections.forEach(user => {
          if (!activeConvsMap.has(user._id.toString())) {
            mergedConversations.push({
              _id: user._id,
              name: user.name,
              avatar: user.avatar,
              lastMessage: "No messages yet...",
              lastMessageTime: null,
              unreadCount: 0,
              newUnreadCount: 0,
              trustScore: user.trustScore || 50,
              location: user.location,
              skillsOffered: user.skillsOffered || [],
              skillsWanted: user.skillsWanted || [],
              isOnline: onlineUsers.has(user._id.toString()),
              bio: user.bio
            });
          }
        });

        setConversations(mergedConversations);
        if (mergedConversations.length > 0) {
          const firstContact = mergedConversations[0];
          setActiveContact(firstContact);
          activeContactRef.current = firstContact; // Sync ref
          loadMessages(firstContact._id);
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

    try {
      const storedMessages = JSON.parse(localStorage.getItem(chatKey) || "[]");
      // Filter out duplicates based on ID
      const uniqueMessages = [];
      const seenIds = new Set();
      for (const msg of storedMessages) {
        if (!seenIds.has(msg.id)) {
          seenIds.add(msg.id);
          uniqueMessages.push(msg);
        }
      }
      setMessages(uniqueMessages);

      // Update local storage with cleaned messages
      localStorage.setItem(chatKey, JSON.stringify(uniqueMessages));
    } catch (e) {
      setMessages([]);
      localStorage.removeItem(chatKey);
    }
  };

  const handleContactClick = async (contact) => {
    setActiveContact(contact);
    activeContactRef.current = contact; // Sync ref
    setShowDropdown(false);

    // Clear notifications for this specific conversation
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv._id === contact._id) {
          return { ...conv, unreadCount: 0, newUnreadCount: 0 };
        }
        return conv;
      }),
    );

    // Load messages from database first
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await api.get(`/api/messages/${contact._id}`);
        const dbMessages = response.data.map((msg) => ({
          id: msg._id,
          sender: msg.senderId._id,
          recipientId: msg.receiverId._id,
          text: msg.content,
          senderName: msg.senderId.name,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(dbMessages);

        // Save to localStorage for offline access
        const chatKey = `chat_${contact._id}`;
        localStorage.setItem(chatKey, JSON.stringify(dbMessages));
        return;
      }
    } catch (error) {
      console.error("Error loading messages from database:", error);
    }

    // Fallback to localStorage
    loadMessages(contact._id);
  };

  // Generate meeting link
  const generateMeetLink = () => {
    // Create a unique meeting ID using timestamp and random string
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const meetingId = `${timestamp}-${random}`;

    // For now, create a simple meeting link. In production, you'd integrate with a real video service
    return `https://meet.google.com/lookup/${meetingId}`;
  };
  // Start video call
  const startVideoCall = () => {
    if (!activeContact) return;

    // Directly redirect to Google Meet to create a new meeting
    window.open("https://meet.google.com/new", "_blank");

    // Show toast notification with instructions
    toast.success(
      <div className="flex items-center gap-3">
        <span>📹</span>
        <div>
          <div className="font-semibold">Creating Google Meet call</div>
          <div className="text-sm opacity-90">
            Please share the meeting link with {activeContact.name}
          </div>
        </div>
      </div>,
      {
        duration: 6000,
      },
    );

    // Add call message to chat
    const callMessage = {
      id: crypto.randomUUID(),
      sender: userInfo._id,
      recipientId: activeContact._id,
      text: `📹 Started a Google Meet video call - Please share your meeting link`,
      senderName: userInfo.name,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isCallMessage: true,
    };

    setMessages((prev) => [...prev, callMessage]);

    // Send call notification via socket
    if (socketRef.current) {
      const callNotification = {
        type: "video_call",
        sender: userInfo._id,
        recipientId: activeContact._id,
        senderName: userInfo.name,
        meetLink: "https://meet.google.com/new",
        timestamp: new Date().toISOString(),
      };

      socketRef.current.emit("call notification", callNotification);
    }
  };

  // Start audio call
  const startAudioCall = () => {
    if (!activeContact) return;

    // Show call options with icons instead of popup
    setShowCallOptions(true);
  };

  // Handle WhatsApp call
  const handleWhatsAppCall = () => {
    setCallType("whatsapp");
    setCallPhoneNumber(activeContact?.phone || "");
    setShowCallModal(true);
    setShowCallOptions(false);
  };

  const executeWhatsAppCall = (phoneNumber) => {
    if (phoneNumber && phoneNumber.trim()) {
      // Clean the phone number - remove all non-digit characters except +
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, "");

      // Ensure it starts with country code
      const formattedNumber = cleanNumber.startsWith("+")
        ? cleanNumber
        : "+" + cleanNumber;

      const whatsappLink = `https://wa.me/${formattedNumber}`;

      console.log("Original number:", phoneNumber);
      console.log("Clean number:", cleanNumber);
      console.log("Formatted number:", formattedNumber);
      console.log("WhatsApp link:", whatsappLink);

      // Send call notification via socket
      if (socketRef.current) {
        const callNotification = {
          type: "audio_call",
          sender: userInfo._id,
          recipientId: activeContact._id,
          senderName: userInfo.name,
          meetLink: whatsappLink,
          timestamp: new Date().toISOString(),
        };

        socketRef.current.emit("call notification", callNotification);
      }

      // Open WhatsApp in new tab
      try {
        // Create a temporary link element to ensure it opens properly
        const link = document.createElement("a");
        link.href = whatsappLink;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success(`WhatsApp call started with ${activeContact.name}`);
      } catch (error) {
        console.error("Error opening WhatsApp:", error);
        // Fallback to window.open
        try {
          window.open(whatsappLink, "_blank");
          toast.success(`WhatsApp call started with ${activeContact.name}`);
        } catch (fallbackError) {
          console.error("Fallback also failed:", fallbackError);
          toast.error(
            "Failed to open WhatsApp. Please check your popup blocker.",
          );
        }
      }

      // Add call message to chat
      const callMessage = {
        id: crypto.randomUUID(),
        sender: userInfo._id,
        recipientId: activeContact._id,
        text: `📞 Started a WhatsApp call: ${formattedNumber}`,
        senderName: userInfo.name,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isCallMessage: true,
      };

      setMessages((prev) => [...prev, callMessage]);
      setShowCallOptions(false);
    } else {
      toast.error("Please enter a valid phone number");
    }
  };

  // Handle phone call
  const handlePhoneCall = () => {
    setCallType("phone");
    setCallPhoneNumber(activeContact?.phone || "");
    setShowCallModal(true);
    setShowCallOptions(false);
  };

  const executePhoneCall = (phoneNumber) => {
    if (phoneNumber) {
      // Send call notification via socket
      if (socketRef.current) {
        const callNotification = {
          type: "audio_call",
          sender: userInfo._id,
          recipientId: activeContact._id,
          senderName: userInfo.name,
          meetLink: `tel:${phoneNumber}`,
          timestamp: new Date().toISOString(),
        };

        socketRef.current.emit("call notification", callNotification);
      }

      // Open phone dialer
      window.location.href = `tel:${phoneNumber}`;

      // Show toast notification
      toast.success(`Phone call started with ${activeContact.name}`);

      // Add call message to chat
      const callMessage = {
        id: crypto.randomUUID(),
        sender: userInfo._id,
        recipientId: activeContact._id,
        text: `📞 Started a phone call: ${phoneNumber}`,
        senderName: userInfo.name,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isCallMessage: true,
      };

      setMessages((prev) => [...prev, callMessage]);
      setShowCallOptions(false);
    } else {
      toast.error("Please enter a valid phone number");
    }
  };

  const handleCallSubmit = () => {
    if (callType === "whatsapp") {
      executeWhatsAppCall(callPhoneNumber);
    } else {
      executePhoneCall(callPhoneNumber);
    }
    setShowCallModal(false);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Socket.io setup - only once
  useEffect(() => {
    if (!userInfo?._id) return;

    if (!socketRef.current) {
      socketRef.current = io(ENDPOINT, {
        transports: ["websocket", "polling"],
        withCredentials: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
    }

    const socket = socketRef.current;

    // Remove any existing listeners to prevent duplicates
    socket.off("connect");
    socket.off("online users");
    socket.off("message received");
    socket.off("call notification");
    socket.off("connect_error");

    // Setup user when connected
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit("setup", userInfo._id);
    });

    // Handle online users updates
    socket.on("online users", (users) => {
      console.log("Received online users:", users);
      setOnlineUsers(new Set(users));
    });

    // Handle incoming messages
    socket.on("message received", (message) => {
      console.log("Message received:", message);

      // We'll update state conditionally without putting all side effects inside setMessages
      setMessages((prev) => {
        const messageExists = prev.some((msg) => msg.id === message.id);
        if (messageExists) {
          console.log("Duplicate message detected, skipping:", message.id);
          return prev;
        }

        const currentActive = activeContactRef.current;
        if (
          currentActive &&
          (message.sender === currentActive._id ||
            message.recipientId === currentActive._id)
        ) {
          return [...prev, message];
        }

        return prev;
      });

      // Update conversations OUTSIDE the state updater and move to top
      setConversations((convPrev) => {
        const newConvs = [...convPrev];
        const index = newConvs.findIndex(c => c._id === message.sender || c._id === message.recipientId);

        if (index > -1) {
          const [conv] = newConvs.splice(index, 1);
          newConvs.unshift({
            ...conv,
            lastMessage: message.text || (message.image ? "🖼️ Image" : "New message"),
            lastMessageTime: message.time,
            unreadCount:
              conv._id === message.sender
                ? (conv.unreadCount || 0) + 1
                : conv.unreadCount,
            newUnreadCount:
              conv._id === message.sender
                ? (conv.newUnreadCount || 0) + 1
                : conv.newUnreadCount,
          });
        }
        return newConvs;
      });

      // Add to notification messages if it's a new message for current user
      if (message.sender !== userInfo._id) {
        const notification = {
          id: message.id,
          senderId: message.sender,
          senderName: message.senderName,
          message: message.text,
          time: message.time,
          conversationId: message.sender,
          read: false,
        };

        setNotificationMessages((prev) => {
          const notifExists = prev.some((n) => n.id === notification.id);
          if (notifExists) return prev;
          return [notification, ...prev].slice(0, 10);
        });

        // Also add to global notifications
        dispatch(addNotification({
          id: message.id,
          text: `New message from ${message.senderName}`,
          time: message.time,
          unread: true,
        }));
      }

      // Handle localStorage outside of state updater
      const currentActive = activeContactRef.current;
      if (
        currentActive &&
        (message.sender === currentActive._id ||
          message.recipientId === currentActive._id)
      ) {
        const chatKey = `chat_${currentActive._id}`;
        const existingMessages = JSON.parse(
          localStorage.getItem(chatKey) || "[]",
        );
        const msgExistsInStorage = existingMessages.some(
          (msg) => msg.id === message.id,
        );

        if (!msgExistsInStorage) {
          existingMessages.push(message);
          localStorage.setItem(chatKey, JSON.stringify(existingMessages));
        }
      }
    });

    // Handle connection errors
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Handle call notifications
    socket.on("call notification", (notification) => {
      console.log("Call notification received:", notification);

      // Show incoming call toast
      if (notification.recipientId === userInfo._id) {
        const isWhatsApp = notification.meetLink.includes("wa.me");
        const isPhoneCall = notification.meetLink.includes("tel:");
        const isGoogleMeetNew = notification.meetLink.includes(
          "meet.google.com/new",
        );

        let callType, actionLabel, actionHandler;

        if (isWhatsApp) {
          callType = "WhatsApp";
          actionLabel = "Open WhatsApp";
          actionHandler = () => window.open(notification.meetLink, "_blank");
        } else if (isPhoneCall) {
          callType = "phone";
          actionLabel = "Open Dialer";
          actionHandler = () => window.open(notification.meetLink, "_blank");
        } else if (isGoogleMeetNew) {
          callType = "Google Meet";
          actionLabel = "Create Meeting";
          actionHandler = () =>
            window.open("https://meet.google.com/new", "_blank");
        } else {
          callType = "video";
          actionLabel = "Join Call";
          actionHandler = () => window.open(notification.meetLink, "_blank");
        }

        toast.success(
          <div className="flex items-center gap-3">
            <span>{notification.type === "video_call" ? "📹" : "📞"}</span>
            <div>
              <div className="font-semibold">Incoming {callType} call</div>
              <div className="text-sm opacity-90">
                from {notification.senderName}
              </div>
            </div>
          </div>,
          {
            duration: 8000,
            action: {
              label: actionLabel,
              onClick: actionHandler,
            },
          },
        );

        // Add call message to chat
        let callText;
        if (isWhatsApp) {
          callText = `📞 ${notification.senderName} started a WhatsApp call`;
        } else if (isPhoneCall) {
          callText = `📞 ${notification.senderName} started a phone call`;
        } else if (isGoogleMeetNew) {
          callText = `📹 ${notification.senderName} started a Google Meet video call - Please share your meeting link`;
        } else {
          callText = `📹 ${notification.senderName} started a video call: ${notification.meetLink}`;
        }

        const callMessage = {
          id: crypto.randomUUID(),
          sender: notification.sender,
          recipientId: notification.recipientId,
          text: callText,
          senderName: notification.senderName,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isCallMessage: true,
        };

        setMessages((prev) => [...prev, callMessage]);

        // Also add to global notifications
        dispatch(addNotification({
          id: crypto.randomUUID(),
          text: `Missed call from ${notification.senderName}`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          unread: true,
        }));
      }
    });

    return () => {
      // Clean up listeners
      socket.off("connect");
      socket.off("online users");
      socket.off("message received");
      socket.off("call notification");
      socket.off("connect_error");
    };
  }, [userInfo._id]); // Only depend on userInfo._id, not the whole object

  // Cleanup socket on component unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContact?._id || !socketRef.current) return;

    const msg = {
      id: crypto.randomUUID(),
      sender: userInfo._id,
      recipientId: activeContact._id,
      text: newMessage,
      senderName: userInfo.name,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // Send via socket only - server will send it back
    socketRef.current.emit("new message", msg);
    setNewMessage("");

    console.log("Message sent:", msg);

    // Update conversation list immediately for better UX and move to top
    setConversations((prev) => {
      const newConvs = [...prev];
      const index = newConvs.findIndex(c => c._id === activeContact._id);

      if (index > -1) {
        const [conv] = newConvs.splice(index, 1);
        newConvs.unshift({
          ...conv,
          lastMessage: newMessage,
          lastMessageTime: msg.time,
        });
      }
      return newConvs;
    });
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
                className={`p-4 flex gap-4 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 ${activeContact?._id === contact._id
                    ? "bg-primary/10 border-l-4 border-l-primary"
                    : "border-l-4 border-l-transparent"
                  }`}
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
                      className={`font-bold truncate ${activeContact?._id === contact._id
                          ? "text-primary-light"
                          : ""
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

          {/* Call Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModal("offer")}
              className="p-2 border border-secondary text-secondary hover:bg-secondary hover:text-white rounded-xl transition-all font-bold text-sm flex items-center gap-2 shadow-lg shadow-secondary/20 mr-2"
            >
              <Coins className="w-4 h-4" /> Offer Deal
            </button>
            <div className="w-px h-6 bg-white/10 mx-1"></div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-12 glass-dark border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 w-80 max-h-96">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-semibold text-slate-200">
                      Notifications
                    </h3>
                  </div>

                  {notificationMessages.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No new notifications</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notificationMessages.map((notification) => (
                        <div
                          key={notification.id}
                          className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                          onClick={() => {
                            // Open the conversation
                            const conversation = conversations.find(
                              (conv) =>
                                conv._id === notification.conversationId,
                            );
                            if (conversation) {
                              handleContactClick(conversation);
                              setShowNotifications(false);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <img
                              src={`https://i.pravatar.cc/150?u=${notification.senderName}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-200 text-sm">
                                {notification.senderName}
                              </p>
                              <p className="text-slate-400 text-sm truncate">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {notification.time}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="p-3 border-t border-white/10">
                    <button
                      onClick={clearNotifications}
                      className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm text-slate-300"
                    >
                      Clear All Notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowCallOptions(!showCallOptions)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Call Options"
              >
                <Phone className="w-5 h-5 text-slate-300" />
              </button>

              {/* Call Options Dropdown */}
              {showCallOptions && (
                <div className="absolute right-0 top-12 glass-dark border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 min-w-[200px]">
                  <button
                    onClick={() => {
                      startVideoCall();
                      setShowCallOptions(false);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <Video className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-slate-200">Video Call</span>
                  </button>
                  <button
                    onClick={() => {
                      handleWhatsAppCall();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <div className="w-4 h-4 flex items-center justify-center text-green-400 font-bold text-sm">
                      W
                    </div>
                    <span className="text-sm text-slate-200">
                      WhatsApp Call
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      handlePhoneCall();
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <Phone className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-slate-200">Phone Call</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu Options */}
            <div className="relative z-50">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 text-slate-200 hover:bg-white/10 rounded-full transition-colors flex items-center"
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
            <>
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === userInfo._id ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={`max-w-[70%] px-5 py-3 rounded-2xl shadow-xl ${msg.isCallMessage
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-white"
                        : msg.sender === userInfo._id
                          ? "bg-gradient-to-r from-primary to-indigo-600 text-white rounded-br-sm"
                          : "bg-white/10 text-white border border-white/5 rounded-bl-sm backdrop-blur-md"
                      }`}
                  >
                    <div>
                      {msg.isOffer ? (
                        <div className="flex flex-col gap-3 min-w-[200px]">
                          <div className="flex items-center gap-2 border-b border-white/20 pb-2">
                            <Coins className="w-5 h-5 text-secondary" />
                            <span className="font-bold text-sm text-secondary">
                              Deal Proposed
                            </span>
                          </div>
                          <div>
                            <p className="text-xs text-white/70 mb-1">
                              {msg.offerDetails?.type === "barter"
                                ? "Barter Exchange"
                                : "Credit Payment"}
                            </p>
                            <p className="font-semibold text-lg">
                              {msg.offerDetails?.value}
                            </p>
                          </div>
                          {msg.sender !== userInfo._id &&
                            msg.offerDetails?.status === "pending" && (
                              <div className="flex gap-2 mt-2">
                                <button className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold transition-colors">
                                  Accept
                                </button>
                                <button className="flex-1 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors border border-white/5">
                                  Decline
                                </button>
                              </div>
                            )}
                        </div>
                      ) : msg.image ? (
                        <div className="flex flex-col gap-1">
                          <img
                            src={msg.image}
                            alt="Attachment"
                            className="max-w-full rounded-lg max-h-60 object-cover"
                          />
                        </div>
                      ) : (
                        <p className="font-medium">{msg.text}</p>
                      )}

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
              ))}
              <div ref={messagesEndRef} />
            </>
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
        {activeModal && activeContact && (
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
                      src={activeContact.avatar || `https://i.pravatar.cc/150?u=${activeContact.name}`}
                      className="w-24 h-24 rounded-full border-4 border-slate-900 mx-auto -mt-12 mb-4 object-cover"
                    />
                    <h3 className="text-2xl font-bold mb-1">
                      {activeContact.name}
                    </h3>
                    <p className="text-slate-300 text-sm mb-6">
                      {activeContact.bio || "Passionate about skill sharing and learning!"}
                    </p>

                    <div className="flex gap-4 justify-center">
                      <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                        <div className="text-xs text-slate-400 mb-1">
                          Trust Score
                        </div>
                        <div className="font-bold text-lg text-primary">
                          {activeContact.trustScore || 50}%
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
                      <Coins className="text-secondary w-6 h-6" /> Propose a Deal
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
                      className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all border ${offerType === "barter"
                          ? "bg-primary/20 border-primary text-primary-light"
                          : "bg-transparent border-white/10 text-slate-400 hover:bg-white/5"
                        }`}
                    >
                      Skill Barter
                    </button>
                    <button
                      onClick={() => setOfferType("credits")}
                      className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all border ${offerType === "credits"
                          ? "bg-secondary/20 border-secondary text-secondary"
                          : "bg-transparent border-white/10 text-slate-400 hover:bg-white/5"
                        }`}
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

              {/* Clear Chat Modal */}
              {activeModal === "clear" && (
                <div className="p-6 text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                    <Trash2 className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Clear Chat History</h3>
                  <p className="text-slate-300 text-sm mb-6">
                    Are you sure you want to delete all messages with {activeContact.name}? This action cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors font-medium border border-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeClearChat}
                      className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-bold shadow-lg shadow-red-500/20"
                    >
                      Clear Chat
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Input Modal */}
      {showCallModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-dark border border-white/10 rounded-3xl p-8 w-full max-w-md"
          >
            <h3 className="text-2xl font-bold mb-6">
              {callType === "whatsapp" ? "WhatsApp Call" : "Phone Call"}
            </h3>
            <p className="text-slate-300 mb-6 text-sm">
              Please enter the phone number with the country code (e.g., +1234567890).
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+1234567890"
                  value={callPhoneNumber}
                  onChange={(e) => setCallPhoneNumber(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowCallModal(false)}
                className="flex-1 py-3 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCallSubmit}
                className="flex-1 py-3 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors font-semibold flex items-center justify-center gap-2"
              >
                {callType === "whatsapp" ? <MessageSquare className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                Call
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Chat;
