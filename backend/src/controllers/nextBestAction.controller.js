import NextBestAction from '../models/NextBestAction.js';
import StudentProfile from '../models/StudentProfile.js';
import Roadmap from '../models/Roadmap.js';

// Shared logic — refresh aur get dono isi ko use karte hain
async function buildOrGetNextBestActions(userId) {
  let nba = await NextBestAction.findOne({ student: userId });
  if (nba) return nba;

  const profile = await StudentProfile.findOne({ user: userId });
  const roadmap = await Roadmap.findOne({ student: userId });
  const profileComplete = profile?.onboardingCompleted || false;
  const actions = [];
  if (!profileComplete) {
    actions.push({ type: 'profile', title: 'Complete Your Profile', description: 'Fill in missing profile fields for better recommendations.', priority: 'high', reason: 'Your profile is incomplete.', status: 'pending', dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
  } else {
    actions.push({ type: 'lesson', title: 'Explore Career Paths', description: 'Browse available careers and get recommendations.', priority: 'medium', status: 'pending' });
  }
  nba = await NextBestAction.create({
    student: userId,
    actions,
    profileCompleteness: profileComplete ? 100 : 0,
    roadmapProgress: roadmap?.overallProgress || 0,
  });
  return nba;
}

export const getNextBestActions = async (req, res, next) => {
  try {
    const nba = await buildOrGetNextBestActions(req.user._id);
    res.status(200).json({ success: true, data: { nextBestAction: nba } });
  } catch (error) { next(error); }
};

export const refreshNextBestActions = async (req, res, next) => {
  try {
    await NextBestAction.deleteMany({ student: req.user._id });
    const nba = await buildOrGetNextBestActions(req.user._id);
    res.status(200).json({ success: true, data: { nextBestAction: nba } });
  } catch (error) { next(error); }
};

export const dismissAction = async (req, res, next) => {
  try {
    const { actionIndex } = req.params;
    const nba = await NextBestAction.findOne({ student: req.user._id });
    if (nba && nba.actions[actionIndex]) { nba.actions[actionIndex].status = 'dismissed'; await nba.save(); }
    res.status(200).json({ success: true, message: 'Action dismissed' });
  } catch (error) { next(error); }
};
