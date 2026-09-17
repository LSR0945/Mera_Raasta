import mongoose from 'mongoose';

// ═══ Location Schema — Bharat ka poora geography ═══
// State → District → City — teen level ka hierarchy
const LocationSchema = new mongoose.Schema({
  state: { type: String, required: true, index: true },          // State ka naam, jaise "Maharashtra"
  stateCode: { type: String, required: true },                    // Short code, jaise "MH"
  type: { type: String, enum: ['state', 'ut'], default: 'state' }, // State hai ya Union Territory
  districts: [{                                                    // Is state ke saare districts
    name: { type: String, required: true },                       // District ka naam, jaise "Mumbai"
    cities: [String],                                              // District ke andar cities/towns
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

LocationSchema.index({ state: 1 });
LocationSchema.index({ 'districts.name': 1 });

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);