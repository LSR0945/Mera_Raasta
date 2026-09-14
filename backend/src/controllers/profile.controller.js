import StudentProfile from '../models/StudentProfile.js';

export const getProfile = async (req, res) => {
  const profile = await StudentProfile.findOne({ user: req.user._id });
  res.status(200).json({ success: true, data: { profile } });
};

export const upsertProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id }, { ...req.body, user: req.user._id }, { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ success: true, message: 'Profile updated', data: { profile } });
  } catch (error) { next(error); }
};

export const completeOnboarding = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id }, { onboardingCompleted: true, ...req.body }, { new: true, upsert: true }
    );
    res.status(200).json({ success: true, message: 'Onboarding completed', data: { profile } });
  } catch (error) { next(error); }
};
