import Activity from '../models/Activity.js';

export const logActivity = async (userId, action, category = 'system', details = null, metadata = null) => {
  try {
    await Activity.create({ user: userId, action, category, details, metadata });
  } catch {}
};

export const getMyActivities = async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (page - 1) * limit;
    const activities = await Activity.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Activity.countDocuments({ user: req.user._id });
    res.status(200).json({ success: true, data: { activities, total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

export const getChildActivities = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const { limit = 50, page = 1, category } = req.query;
    const skip = (page - 1) * limit;
    const filter = { user: childId };
    if (category) filter.category = category;
    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Activity.countDocuments(filter);
    res.status(200).json({ success: true, data: { activities, total, page: Number(page), pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

export const getChildStats = async (req, res, next) => {
  try {
    const { childId } = req.params;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [totalActions, todayActions, weekActions, byCategory] = await Promise.all([
      Activity.countDocuments({ user: childId }),
      Activity.countDocuments({ user: childId, createdAt: { $gte: today } }),
      Activity.countDocuments({ user: childId, createdAt: { $gte: weekAgo } }),
      Activity.aggregate([
        { $match: { user: (await import('mongoose')).default.Types.ObjectId.createFromHexString(childId) } },
        { $group: { _id: '$category', count: { $sum: 1 }, lastAction: { $max: '$createdAt' } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    const lastActivity = await Activity.findOne({ user: childId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        totalActions,
        todayActions,
        weekActions,
        byCategory,
        lastActivity: lastActivity ? { action: lastActivity.action, category: lastActivity.category, time: lastActivity.createdAt } : null,
      },
    });
  } catch (error) { next(error); }
};
