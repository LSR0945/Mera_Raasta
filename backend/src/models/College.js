import mongoose from 'mongoose';

// ═══ Course Schema — Har college mein kitne courses hain ═══
// Har course ka naam, duration, fees, type hota hai
const CourseSchema = new mongoose.Schema({
  name: { type: String, required: true },        // Course ka naam, jaise "B.Tech Computer Science"
  duration: { type: String, default: '' },       // Kitna saal ka course hai, jaise "4 years"
  fees: { type: Number, default: 0 },            // Saal ki fees (INR mein)
  feesDisplay: { type: String, default: '' },    // Fees dikhane ke liye, jaise "₹1,50,000/year"
  type: { type: String, enum: ['undergraduate', 'postgraduate', 'diploma', 'certificate', 'phd'], default: 'undergraduate' },
  // Course ka type — UG, PG, Diploma, Certificate, PhD
  stream: { type: String, default: '' },         // Kaunse stream ka hai, jaise "Engineering", "Commerce"
  eligibility: { type: String, default: '' },    // Kya eligibility chahiye, jaise "12th pass with PCM"
  seats: { type: Number, default: 0 },           // Kitni seats hain
}, { _id: true });

// ═══ College Schema ═══
// Ek college ki saari details — naam, location, courses, fees
const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true, index: true },     // College ka naam
  slug: { type: String, required: true, unique: true },    // URL ke liye, jaise "iit-delhi"
  city: { type: String, required: true, index: true },     // Kaunse shehar mein hai
  state: { type: String, required: true },                  // Kaunse state mein hai
  address: { type: String, default: '' },                   // Full address
  type: { type: String, enum: ['government', 'private', 'deemed', 'autonomous'], default: 'government' },
  // Government college hai ya private
  rating: { type: Number, default: 0 },                    // Rating (0-5)
  established: { type: Number },                            // Kab bana college
  website: { type: String, default: '' },                   // College ki website
  description: { type: String, default: '' },               // College ke baare mein short description
  courses: [CourseSchema],                                   // Saare courses — array of courses
  tags: [String],                                           // Tags for search, jaise "engineering", "medical", "mba"
  isActive: { type: Boolean, default: true },               // Active hai ya nahi
}, { timestamps: true });

// City aur type pe index for fast search
CollegeSchema.index({ city: 1, type: 1 });
CollegeSchema.index({ tags: 1 });

export default mongoose.models.College || mongoose.model('College', CollegeSchema);