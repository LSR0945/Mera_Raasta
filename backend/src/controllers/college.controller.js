import College from '../models/College.js';

// ═══ getCollegesByCity — City ke colleges lao ═══
// GET /colleges?city=Delhi — Delhi ke saare colleges dikhao
export const getCollegesByCity = async (req, res, next) => {
  try {
    const { city, type, tag, search, page = 1, limit = 20 } = req.query;

    // Filter build karo
    const filter = { isActive: true };
    if (city) filter.city = new RegExp(city, 'i');  // Case-insensitive search
    if (type) filter.type = type;
    if (tag) filter.tags = { $in: [new RegExp(tag, 'i')] };

    // Agar search term hai to naam se bhi dhundho
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [colleges, total] = await Promise.all([
      College.find(filter).skip(skip).limit(parseInt(limit)).sort({ rating: -1 }),
      College.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: {
        colleges,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) { next(error); }
};

// ═══ getCollegeDetail — Single college ki detail ═══
// GET /colleges/:slug — Ek college ki poori details
export const getCollegeDetail = async (req, res, next) => {
  try {
    const college = await College.findOne({ slug: req.params.slug, isActive: true });
    if (!college) return res.status(404).json({ success: false, message: 'College not found' });
    res.status(200).json({ success: true, data: { college } });
  } catch (error) { next(error); }
};

// ═══ searchColleges — Colleges search karo ═══
// GET /colleges/search?q=IIT — naam ya city se search
export const searchColleges = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: 'Search term required' });

    const colleges = await College.find({
      isActive: true,
      $or: [
        { name: new RegExp(q, 'i') },
        { city: new RegExp(q, 'i') },
        { state: new RegExp(q, 'i') },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    }).limit(20).sort({ rating: -1 });

    res.status(200).json({ success: true, data: { colleges } });
  } catch (error) { next(error); }
};

// ═══ getAllCities — Saari cities list karo ═══
// GET /colleges/cities — Unique cities dikhao dropdown ke liye
export const getAllCities = async (req, res, next) => {
  try {
    const cities = await College.distinct('city', { isActive: true });
    res.status(200).json({ success: true, data: { cities: cities.sort() } });
  } catch (error) { next(error); }
};

// ═══ getCollegesByLocation — Location based colleges ═══
// POST /colleges/nearby — User ki city bhejo, paas ke colleges aayenge
export const getCollegesNearby = async (req, res, next) => {
  try {
    const { city, state, budget, stream } = req.body;
    const filter = { isActive: true };

    // City filter
    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');

    // Stream filter — agar user ko engineering chahiye to sirf engineering colleges
    if (stream) {
      filter['courses.stream'] = new RegExp(stream, 'i');
    }

    let colleges = await College.find(filter).sort({ rating: -1 }).limit(50);

    // Budget filter — agar user ka budget low hai to affordable colleges dikhao
    if (budget === 'low') {
      colleges = colleges.filter(c => c.courses.some(course => course.fees <= 100000));
    } else if (budget === 'medium') {
      colleges = colleges.filter(c => c.courses.some(course => course.fees <= 500000));
    }

    res.status(200).json({ success: true, data: { colleges, count: colleges.length } });
  } catch (error) { next(error); }
};