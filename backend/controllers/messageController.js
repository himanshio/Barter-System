import Message from '../models/Message.js';
import User from '../models/User.js';

// Get all conversations for the logged-in user
export const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Find all messages where user is either sender or receiver
        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                },
                { clearedBy: { $ne: userId } }
            ]
        }).populate('senderId receiverId', 'name avatar').sort({ createdAt: -1 });

        // Group messages by conversation partner
        const conversations = {};
        messages.forEach(message => {
            const otherUserId = message.senderId._id.toString() === userId.toString() 
                ? message.receiverId._id.toString() 
                : message.senderId._id.toString();
            
            if (!conversations[otherUserId]) {
                conversations[otherUserId] = {
                    _id: otherUserId,
                    name: message.senderId._id.toString() === userId.toString() 
                        ? message.receiverId.name 
                        : message.senderId.name,
                    avatar: message.senderId._id.toString() === userId.toString() 
                        ? message.receiverId.avatar 
                        : message.senderId.avatar,
                    lastMessage: message.content,
                    lastMessageTime: message.createdAt,
                    unreadCount: 0
                };
            }
            
            // Count unread messages
            if (message.receiverId._id.toString() === userId.toString() && !message.read) {
                conversations[otherUserId].unreadCount++;
            }
        });

        // Convert to array and sort by last message time
        const conversationList = Object.values(conversations).sort((a, b) => 
            new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
        );

        res.json(conversationList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get messages between logged-in user and specific user
export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        const messages = await Message.find({
            $and: [
                {
                    $or: [
                        { senderId: currentUserId, receiverId: userId },
                        { senderId: userId, receiverId: currentUserId }
                    ]
                },
                { clearedBy: { $ne: currentUserId } }
            ]
        }).populate('senderId receiverId', 'name avatar').sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { 
                senderId: userId, 
                receiverId: currentUserId, 
                read: false 
            },
            { read: true }
        );

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Send a new message
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, content, mediaUrl, isDealOffer } = req.body;
        const senderId = req.user._id;

        const message = await Message.create({
            senderId,
            receiverId,
            content,
            mediaUrl,
            isDealOffer: isDealOffer || false
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('senderId receiverId', 'name avatar');

        // TODO: Emit via Socket.io for real-time updates
        // req.io.to(receiverId).emit('newMessage', populatedMessage);

        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Clear chat for current user
export const clearChat = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Push currentUserId to clearedBy array for all messages between these two users
        await Message.updateMany(
            {
                $or: [
                    { senderId: currentUserId, receiverId: userId },
                    { senderId: userId, receiverId: currentUserId }
                ]
            },
            { $addToSet: { clearedBy: currentUserId } }
        );

        res.json({ message: "Chat cleared successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
