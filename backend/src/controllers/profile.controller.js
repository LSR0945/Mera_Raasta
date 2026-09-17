import StudentProfile from '../models/StudentProfile.js';

// ═══ getProfile — User ka profile lao ═══
export const getProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) { next(error); }
};

// ═══ upsertProfile — Profile banao ya update karo ═══
// Onboarding se data aata hai — education, interests, skills, budget
export const upsertProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body, user: req.user._id };

    // Skills ka format fix karo — frontend strings bhejta hai, model objects expect karta hai
    if (updates.skills && Array.isArray(updates.skills)) {
      updates.skills = updates.skills.map(s => {
        if (typeof s === 'string') return { name: s, level: 'beginner' };  // String hai to object banao
        return s;  // Already object hai to wahi rehne do
      });
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Profile updated', data: { profile } });
  } catch (error) { next(error); }
};

// ═══ completeOnboarding — Onboarding complete karo ═══
// Onboarding ka last step — onboardingCompleted: true set karo
export const completeOnboarding = async (req, res, next) => {
  try {
    const updates = { ...req.body, onboardingCompleted: true, user: req.user._id };

    // Skills ka format fix karo
    if (updates.skills && Array.isArray(updates.skills)) {
      updates.skills = updates.skills.map(s => {
        if (typeof s === 'string') return { name: s, level: 'beginner' };
        return s;
      });
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Onboarding completed', data: { profile } });
  } catch (error) { next(error); }
};