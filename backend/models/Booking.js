import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },

    status: { type: String, enum: ['pending', 'accepted', 'completed', 'rejected', 'cancelled'], default: 'pending' },
    scheduledDate: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },

    exchangeType: { type: String, enum: ['barter', 'paid', 'credit'], required: true },
    priceCredits: { type: Number, default: 0 },
    barterSkillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' }, // if barter exchange

    isReviewed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);
