import StudentProfile from '../models/StudentProfile.js';
import Career from '../models/Career.js';

export const chat = async (req, res, next) => {
  try {
    const { message, type } = req.body;
    const profile = await StudentProfile.findOne({ user: req.user._id });
    const interests = profile?.interests?.join(', ') || 'various fields';
    const level = profile?.educationLevel || 'student';
    const response = `Based on your profile - studying ${level} with interests in ${interests}:\n\nYour goal of becoming successful is achievable! I'd recommend:\n\n1. Focus on building strong fundamentals in your area of interest\n2. Take online courses to supplement your learning\n3. Build practical projects to demonstrate your skills\n4. Network with professionals in your field\n5. Stay updated with industry trends\n\nWhat specific area would you like to explore further?`;
    res.status(200).json({ success: true, data: { response } });
  } catch (error) { next(error); }
};
