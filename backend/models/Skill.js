import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true },
    image: { type: String }, // cloudinary url
    priceCredits: { type: Number, default: 0 }, // If paid/credits rather than barter
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.model('Skill', skillSchema);
