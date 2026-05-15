import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String },
    mediaUrl: { type: String }, // If sending an image/file
    isDealOffer: { type: Boolean, default: false }, // Special type of message
    dealStatus: { type: String, enum: ['pending', 'accepted', 'rejected', 'none'], default: 'none' },
    read: { type: Boolean, default: false },
    clearedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
