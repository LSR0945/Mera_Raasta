import mongoose from 'mongoose';
import Location from '../models/Location.js';
import College from '../models/College.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mera_raasta';

// ═══ GOVERNMENT APIs — 100% REAL DATA ═══
// LGD (Local Government Directory) = data.gov.in — Official Government of India
// India Post Pincode Directory = Department of Posts, Government of India

const LGD_JSON_URL = 'https://raw.githubusercontent.com/aharnish-infotech/india-state-district-json/main/India-State-District.json';
const DATA_GOV_PINCODE_URL = 'https://api.data.gov.in/resource/6176ee09-3d56-4a3b-8115-21841576b2f6';
const DATA_GOV_API_KEY = '579b464db66ec23bdd000001b7c61799988d4f2d60cfa2215355205a';

// ═══ STEP 1: Government LGD se States + Districts lao ═══
async function fetchGovtStatesDistricts() {
  console.log('Fetching States & Districts from Government LGD (data.gov.in)...');
  const res = await fetch(LGD_JSON_URL);
  if (!res.ok) throw new Error(`LGD fetch failed: ${res.status}`);
  const rawData = await res.json();

  // LGD data ko group karo by state
  const stateMap = {};
  for (const row of rawData) {
    const code = String(row.StateCode).padStart(2, '0');
    if (!stateMap[code]) {
      stateMap[code] = { state: row.StateName, stateCode: code, type: 'state', districts: [] };
    }
    // Duplicate district check
    const distName = row['DistrictName(InEnglish)'];
    if (!stateMap[code].districts.find(d => d.name === distName)) {
      stateMap[code].districts.push({ name: distName, cities: [] });
    }
  }

  // UT codes (>35) detect karo
  const utCodes = ['35', '31', '34', '04', '07', '26', '32', '38'];
  for (const code of Object.keys(stateMap)) {
    if (utCodes.includes(code)) stateMap[code].type = 'ut';
  }

  const result = Object.values(stateMap);
  console.log(`  Found ${result.length} States/UTs with ${result.reduce((a, s) => a + s.districts.length, 0)} districts`);
  return result;
}

// ═══ STEP 2: India Post Pincode Directory se Cities lao ═══
// Department of Posts, Government of India — 155K+ records
async function fetchGovtCities() {
  console.log('Fetching Cities from India Post Pincode Directory (data.gov.in)...');
  console.log('  Using batches of 1000 with delays to avoid rate limits...');

  const cityMap = {}; // "STATE|DISTRICT" -> Set of cities
  let offset = 0;
  const batchSize = 1000;
  let total = Infinity;
  let consecutiveErrors = 0;
  const MAX_ERRORS = 3; // 3 baar error aaya to stop

  while (offset < total && consecutiveErrors < MAX_ERRORS) {
    try {
      const url = `${DATA_GOV_PINCODE_URL}?api-key=${DATA_GOV_API_KEY}&format=json&limit=${batchSize}&offset=${offset}&fields=statename,districtname,officename`;
      const res = await fetch(url);

      // 429 Rate Limit — exponential backoff
      if (res.status === 429) {
        consecutiveErrors++;
        const waitTime = Math.min(30000, 2000 * Math.pow(2, consecutiveErrors)); // 4s, 8s, 16s
        console.log(`\n  Rate limit (429) at offset ${offset}. Waiting ${waitTime/1000}s... (Attempt ${consecutiveErrors}/${MAX_ERRORS})`);
        await new Promise(r => setTimeout(r, waitTime));
        continue; // Same offset retry
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      total = parseInt(data.total) || 155570;
      consecutiveErrors = 0; // Success — reset errors

      for (const rec of data.records || []) {
        const state = rec.statename?.trim();
        const district = rec.districtname?.trim();
        let city = rec.officename?.trim();

        // Post office suffixes hatao
        city = city.replace(/\s*(S\.O|B\.O|H\.O|G\.P\.O|\.S\.O|\.B\.O|\.H\.O|Head Post Office|Sub Post Office|Branch Post Office)\s*$/i, '').trim();

        if (state && district && city) {
          const key = `${state}|${district}`;
          if (!cityMap[key]) cityMap[key] = new Set();
          cityMap[key].add(city);
        }
      }

      offset += batchSize;
      const pct = Math.min(100, Math.round((offset / total) * 100));
      process.stdout.write(`\r  Progress: ${pct}% (${Math.min(offset, total)}/${total} records) — ${Object.keys(cityMap).length} districts found`);

      // Delay between requests — rate limit avoid karo
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      consecutiveErrors++;
      console.log(`\n  Error at offset ${offset}: ${err.message}`);
      if (consecutiveErrors < MAX_ERRORS) {
        const waitTime = 5000 * consecutiveErrors;
        console.log(`  Retrying in ${waitTime/1000}s... (${consecutiveErrors}/${MAX_ERRORS})`);
        await new Promise(r => setTimeout(r, waitTime));
      }
    }
  }

  if (consecutiveErrors >= MAX_ERRORS) {
    console.log(`\n  Stopped after ${MAX_ERRORS} consecutive errors. Proceeding with ${Object.keys(cityMap).length} districts found.`);
  }

  console.log(`\n  Found ${Object.keys(cityMap).length} state-district combinations with cities`);
  return cityMap;
}

// ═══ STEP 3: States/Districts + Cities merge karo ═══
function mergeData(states, cityMap) {
  console.log('Merging government data...');
  for (const state of states) {
    // LGD state names vs India Post state names match karo
    // LGD: "Andhra Pradesh" vs India Post: "ANDHRA PRADESH"
    const stateUpper = state.state.toUpperCase();
    for (const district of state.districts) {
      const distUpper = district.name.toUpperCase();
      // Try exact match, then partial match
      let cities = cityMap[`${stateUpper}|${distUpper}`];
      if (!cities) {
        // Partial match try karo
        for (const [key, val] of Object.entries(cityMap)) {
          const [s, d] = key.split('|');
          if (s === stateUpper && (d.includes(distUpper) || distUpper.includes(d))) {
            cities = val;
            break;
          }
        }
      }
      if (cities) {
        district.cities = [...cities].sort();
      }
    }
  }
  return states;
}

// ═══ STEP 4: MongoDB mein save karo ═══
async function saveToDB(states) {
  console.log('Saving to MongoDB...');
  let created = 0, updated = 0, skipped = 0;

  for (const state of states) {
    const existing = await Location.findOne({ stateCode: state.stateCode });
    if (existing) {
      // Update karo agar new data zyada hai
      if (state.districts.length > existing.districts.length) {
        await Location.findOneAndUpdate({ stateCode: state.stateCode }, { $set: { districts: state.districts, type: state.type } });
        updated++;
        console.log(`  Updated: ${state.state} (${state.districts.length} districts)`);
      } else {
        skipped++;
      }
    } else {
      await Location.create(state);
      created++;
      console.log(`  Created: ${state.state} (${state.stateCode}) — ${state.districts.length} districts`);
    }
  }

  console.log(`\nSave complete: Created=${created}, Updated=${updated}, Skipped=${skipped}`);
}

// ═══ MAIN SEED FUNCTION ═══
const seedGovtData = async () => {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('  GOVERNMENT DATA SEED — 100% Real Data');
    console.log('  Source: data.gov.in + India Post (GoI)');
    console.log('═══════════════════════════════════════════\n');

    // Check pehle se data hai ya nahi — agar states hain aur cities bhi hain to skip
    const existingCount = await Location.countDocuments();
    const hasCities = await Location.findOne({ 'districts.0.cities.0': { $exists: true } });
    if (existingCount >= 35 && hasCities) {
      console.log(`Location data already exists (${existingCount} states/UTs with cities). Skipping seed.`);
      return;
    }

    // Step 1: Government LGD se states + districts
    const states = await fetchGovtStatesDistricts();

    // Step 2: India Post se cities — partial data bhi save karo agar rate limit aaye
    let cityMap = {};
    try {
      cityMap = await fetchGovtCities();
    } catch (err) {
      console.log(`\n  City fetch error: ${err.message}. Saving states + districts without cities.`);
    }

    // Step 3: Merge karo
    const merged = mergeData(states, cityMap);

    // Step 4: MongoDB mein save — har haal mein save karo
    await saveToDB(merged);

    // Final count
    const totalStates = await Location.countDocuments();
    const totalDistricts = await Location.aggregate([{ $unwind: '$districts' }, { $count: 'total' }]);
    const totalCities = await Location.aggregate([
      { $unwind: '$districts' },
      { $unwind: '$districts.cities' },
      { $count: 'total' },
    ]);

    console.log('\n═══════════════════════════════════════════');
    console.log('  SEED COMPLETE — Government Data');
    console.log(`  States/UTs: ${totalStates}`);
    console.log(`  Districts: ${totalDistricts[0]?.total || 0}`);
    console.log(`  Cities: ${totalCities[0]?.total || 0}`);
    console.log('═══════════════════════════════════════════');
  } catch (err) {
    console.error('Govt Data Seed Error:', err.message);
  }
};

// ═══ College Seed Data — Top Government Colleges ═══
const seedCollegeData = async () => {
  try {
    const existingCount = await College.countDocuments();
    if (existingCount >= 40) {
      console.log(`College data already exists (${existingCount} colleges). Skipping.`);
      return;
    }

    console.log('Seeding top Indian colleges...');

    const colleges = [
      { name: 'IIT Delhi', slug: 'iit-delhi', city: 'New Delhi', state: 'Delhi', address: 'Hauz Khas, New Delhi 110016', type: 'government', rating: 4.5, established: 1961, website: 'https://www.iitd.ac.in', description: 'Premier engineering institute. Top ranked in India.', tags: ['engineering', 'iit', 'technology', 'research'], courses: [
        { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
        { name: 'M.Tech', duration: '2 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'postgraduate', stream: 'Engineering', eligibility: 'GATE', seats: 50 },
      ]},
      { name: 'IIT Bombay', slug: 'iit-bombay', city: 'Mumbai', state: 'Maharashtra', address: 'Powai, Mumbai 400076', type: 'government', rating: 4.6, established: 1958, website: 'https://www.iitb.ac.in', description: 'One of the top IITs. Strong CS and research.', tags: ['engineering', 'iit', 'technology'], courses: [
        { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      ]},
      { name: 'IIT Madras', slug: 'iit-madras', city: 'Chennai', state: 'Tamil Nadu', address: 'Adyar, Chennai 600036', type: 'government', rating: 4.7, established: 1959, website: 'https://www.iitm.ac.in', description: 'Consistently ranked #1 IIT. Strong research culture.', tags: ['engineering', 'iit', 'technology', 'research'], courses: [
        { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      ]},
      { name: 'IIT Kanpur', slug: 'iit-kanpur', city: 'Kanpur', state: 'Uttar Pradesh', address: 'Kalyanpur, Kanpur 208016', type: 'government', rating: 4.4, established: 1959, website: 'https://www.iitk.ac.in', description: 'Strong in CS and mathematics.', tags: ['engineering', 'iit', 'technology'], courses: [
        { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      ]},
      { name: 'IIT Kharagpur', slug: 'iit-kharagpur', city: 'Kharagpur', state: 'West Bengal', address: 'Kharagpur 721302', type: 'government', rating: 4.3, established: 1951, website: 'https://www.iitkgp.ac.in', description: 'First IIT. Largest campus. Diverse programs.', tags: ['engineering', 'iit', 'technology'], courses: [
        { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      ]},
      { name: 'IIT Roorkee', slug: 'iit-roorkee', city: 'Roorkee', state: 'Uttarakhand', address: 'Roorkee 247667', type: 'government', rating: 4.2, established: 1847, website: 'https://www.iitr.ac.in', description: 'One of the oldest engineering institutions.', tags: ['engineering', 'iit', 'technology'], courses: [
        { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      ]},
      { name: 'IIT Guwahati', slug: 'iit-guwahati', city: 'Guwahati', state: 'Assam', address: 'North Guwahati 781039', type: 'government', rating: 4.2, established: 1994, website: 'https://www.iitg.ac.in', description: 'Beautiful campus. Strong in biotech and design.', tags: ['engineering', 'iit', 'technology'], courses: [
        { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      ]},
      { name: 'NIT Trichy', slug: 'nit-trichy', city: 'Tiruchirappalli', state: 'Tamil Nadu', address: 'Tiruchirappalli 620015', type: 'government', rating: 4.3, established: 1964, website: 'https://www.nitt.edu', description: 'Top NIT. Strong in CS and ECE.', tags: ['engineering', 'nit', 'technology'], courses: [
        { name: 'B.Tech Computer Science', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 65 },
      ]},
      { name: 'BITS Pilani', slug: 'bits-pilani', city: 'Pilani', state: 'Rajasthan', address: 'Pilani 333031', type: 'deemed', rating: 4.2, established: 1964, website: 'https://www.bits-pilani.ac.in', description: 'Top private deemed university. Strong industry links.', tags: ['engineering', 'private', 'technology'], courses: [
        { name: 'B.E. Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'BITSAT', seats: 150 },
      ]},
      { name: 'Delhi University', slug: 'delhi-university', city: 'New Delhi', state: 'Delhi', address: 'North Campus, Delhi 110007', type: 'autonomous', rating: 4.1, established: 1922, website: 'https://www.du.ac.in', description: 'India\'s largest university. Arts, Science, Commerce.', tags: ['university', 'arts', 'science', 'commerce'], courses: [
        { name: 'B.A. (Hons) English', duration: '3 years', fees: 15000, feesDisplay: '₹15,000/year', type: 'undergraduate', stream: 'Arts', eligibility: 'CUET', seats: 200 },
        { name: 'B.Sc. (Hons) Computer Science', duration: '3 years', fees: 30000, feesDisplay: '₹30,000/year', type: 'undergraduate', stream: 'Science', eligibility: 'CUET', seats: 60 },
      ]},
      { name: 'JNU', slug: 'jnu', city: 'New Delhi', state: 'Delhi', address: 'Aruna Asaf Ali Marg, New Delhi 110067', type: 'autonomous', rating: 4.0, established: 1969, website: 'https://www.jnu.ac.in', description: 'Premier university for humanities and social sciences.', tags: ['university', 'arts', 'humanities', 'research'], courses: [
        { name: 'M.A. International Relations', duration: '2 years', fees: 12000, feesDisplay: '₹12,000/year', type: 'postgraduate', stream: 'Arts', eligibility: 'JNUEE', seats: 50 },
      ]},
      { name: 'AIIMS Delhi', slug: 'aiims-delhi', city: 'New Delhi', state: 'Delhi', address: 'Ansari Nagar, New Delhi 110029', type: 'government', rating: 4.8, established: 1956, website: 'https://www.aiims.edu', description: 'India\'s top medical institute. Best healthcare education.', tags: ['medical', 'healthcare', 'research'], courses: [
        { name: 'MBBS', duration: '5.5 years', fees: 5000, feesDisplay: '₹5,000/year', type: 'undergraduate', stream: 'Medical', eligibility: 'NEET', seats: 100 },
      ]},
      { name: 'NIMHANS', slug: 'nimhans', city: 'Bangalore', state: 'Karnataka', address: 'Hosur Road, Bangalore 560029', type: 'government', rating: 4.5, established: 1974, website: 'https://www.nimhans.ac.in', description: 'Top mental health and neurosciences institute.', tags: ['medical', 'neurosciences', 'research'], courses: [
        { name: 'MD Psychiatry', duration: '3 years', fees: 10000, feesDisplay: '₹10,000/year', type: 'postgraduate', stream: 'Medical', eligibility: 'NEET PG', seats: 20 },
      ]},
      { name: 'IIM Ahmedabad', slug: 'iima', city: 'Ahmedabad', state: 'Gujarat', address: 'Vastrapur, Ahmedabad 380015', type: 'autonomous', rating: 4.6, established: 1961, website: 'https://www.iima.ac.in', description: 'India\'s top business school.', tags: ['management', 'mba', 'business'], courses: [
        { name: 'PGP (MBA)', duration: '2 years', fees: 2500000, feesDisplay: '₹25 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT', seats: 400 },
      ]},
      { name: 'IIM Bangalore', slug: 'iimb', city: 'Bangalore', state: 'Karnataka', address: 'Bannerghatta Road, Bangalore 560076', type: 'autonomous', rating: 4.5, established: 1973, website: 'https://www.iimb.ac.in', description: 'Top business school. Strong placement records.', tags: ['management', 'mba', 'business'], courses: [
        { name: 'PGP (MBA)', duration: '2 years', fees: 2300000, feesDisplay: '₹23 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT', seats: 420 },
      ]},
      { name: 'NLU Delhi', slug: 'nlu-delhi', city: 'New Delhi', state: 'Delhi', address: 'Sector 14, Dwarka, New Delhi 110078', type: 'government', rating: 4.3, established: 2008, website: 'https://nlud.ac.in', description: 'Top law university in India.', tags: ['law', 'legal', 'university'], courses: [
        { name: 'B.A. LL.B (Hons)', duration: '5 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Law', eligibility: 'CLAT', seats: 80 },
      ]},
      { name: 'NID Ahmedabad', slug: 'nid-ahmedabad', city: 'Ahmedabad', state: 'Gujarat', address: 'Paldi, Ahmedabad 380007', type: 'government', rating: 4.4, established: 1961, website: 'https://www.nid.edu', description: 'India\'s premier design institute.', tags: ['design', 'creative', 'technology'], courses: [
        { name: 'B.Des Industrial Design', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Design', eligibility: 'NID DAT', seats: 40 },
      ]},
    ];

    let created = 0;
    for (const college of colleges) {
      const exists = await College.findOne({ slug: college.slug });
      if (!exists) {
        await College.create(college);
        created++;
        console.log(`  + ${college.name} (${college.city})`);
      }
    }
    console.log(`Colleges seeded: ${created} new, ${colleges.length - created} skipped`);
  } catch (err) {
    console.error('College Seed Error:', err.message);
  }
};

// ═══ STANDALONE RUN ═══
// Jab node seedLocations.js run karo (independently)
const runStandalone = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!\n');
    await seedGovtData();
    await seedCollegeData();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

// Export for db.js auto-seed
export { seedGovtData, seedCollegeData };

// Agar directly run kiya hai (node seedLocations.js) to standalone mode
const isDirectRun = process.argv[1] && (process.argv[1].includes('seedLocations') || process.argv[1].includes('govtDataSeed'));
if (isDirectRun) {
  runStandalone();
}