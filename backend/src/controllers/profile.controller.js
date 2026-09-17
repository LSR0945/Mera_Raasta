import StudentProfile from '../models/StudentProfile.js';

// ═══ getProfile — User ka profile lao ═══
export const getProfile = async (req, res, next) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id });
    res.status(200).json({ success: true, data: { profile } });
  } catch (error) { next(error); }
};

// ═══ upsertProfile — Profile banao ya update karo ═══
// Onboarding se data aata hai — education, interests, skills, budget, location
export const upsertProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body, user: req.user._id };

    // Location fields ko properly map karo — frontend state, district, city bhejta hai
    if (updates.state || updates.district || updates.city) {
      updates.location = {
        state: updates.state || '',
        district: updates.district || '',
        city: updates.city || '',
        stateCode: updates.state || '',
        country: 'India',
        willingToRelocate: updates.willingToRelocate || false
      };
      // Top-level state/district/city remove karo (model mein nahi hain)
      delete updates.state;
      delete updates.district;
      delete updates.city;
    }

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

    // Location fields ko properly map karo
    if (updates.state || updates.district || updates.city) {
      updates.location = {
        state: updates.state || '',
        district: updates.district || '',
        city: updates.city || '',
        stateCode: updates.state || '',
        country: 'India',
        willingToRelocate: updates.willingToRelocate || false
      };
      delete updates.state;
      delete updates.district;
      delete updates.city;
    }

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