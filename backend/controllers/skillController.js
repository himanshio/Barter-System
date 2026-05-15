import Skill from '../models/Skill.js';
import User from '../models/User.js';

// Get all recent skills
export const getSkills = async (req, res) => {
    try {
        const skills = await Skill.find().populate('createdBy', 'name avatar trustScore').sort('-createdAt').limit(50);
        res.json(skills);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new skill
export const createSkill = async (req, res) => {
    try {
        const { title, description, category, priceCredits, type } = req.body;

        // Create new skill
        const skill = await Skill.create({
            title,
            description,
            category,
            priceCredits: priceCredits || 0,
            createdBy: req.user._id,
            image: req.file ? req.file.path : null // From Cloudinary
        });

        // Update user based on whether it's offered or wanted
        if (type === 'offered') {
            await User.findByIdAndUpdate(req.user._id, { $push: { skillsOffered: skill._id } });
        } else {
            await User.findByIdAndUpdate(req.user._id, { $push: { skillsWanted: skill._id } });
        }

        res.status(201).json(skill);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
