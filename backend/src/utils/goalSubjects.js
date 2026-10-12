// ═══ Goal → Subject rules (Government of India regulations ke basis par) ═══
// Ye rules kisi random source se nahi — sarkari regulation se aate hain:
//   Medical/Paramedical  → NMC (National Medical Commission) + NEET eligibility
//   Engineering/Arch     → AICTE + JEE/NATA eligibility (PCM)
//   Commerce/CA          → ICAI / CBSE Commerce stream core subjects
//   Defence/NDA          → UPSC NDA notification (PCM for Airforce/Navy)
//   AICTE diploma        → State Boards of Technical Education
// Ye kabhi-bahi API nahi milti — isliye rules yahan encode kiye gaye hain.
// GoI ki LIVE data API (data.gov.in AISHE) controller me iske saath merge hoti hai.

export const GOAL_SUBJECT_MAP = [
  // ── MEDICAL / PARAMEDICAL / AYUSH / NURSING / PHARMACY (NMC + NEET rules) ──
  { keywords: ['doctor', 'mbbs', 'neet', 'physician', 'surgeon', 'medical', 'dentist', 'dental', 'bds', 'nurse', 'nursing', 'gnm', 'anm', 'midwife', 'pharma', 'pharmacy', 'b.pharm', 'physio', 'bpt', 'ayurveda', 'bams', 'homeopathy', 'bhms', 'siddha', 'bsms', 'unani', 'bums', 'veterinary', 'bvsc', 'biotech', 'biotechnology', 'paramedical', 'dmlt', 'mlt', 'lab technolog', 'optometry', 'radiolog', 'dialysis', 'cardiac', 'anesthesia', 'anaesthesia', 'prosthetic', 'occupational therapy', 'speech', 'nuclear medicine', 'emergency medicine', 'medical lab', 'forensic'],
    mandatory: ['Physics', 'Chemistry', 'Biology'],
    suggested: ['Medicine (MBBS)', 'Dentistry (BDS)', 'Ayurveda (BAMS)', 'Nursing (B.Sc Nursing)', 'Pharmacy (B.Pharm)', 'Physiotherapy (BPT)', 'Optometry', 'Medical Lab Technology', 'Radiology & Imaging', 'Biotechnology', 'Forensic Science', 'Paramedical'],
    note: 'Medical/Paramedical/AYUSH (MBBS, BDS, BAMS, Nursing, Pharmacy, Lab Tech...) ke liye PCB (Physics, Chemistry, Biology) mandatory hai. NEET exam in sab admissions ke liye hota hai.' },
  // ── SOFTWARE / IT / AI / DATA / BCA (AICTE + UGC CS programmes) ──
  { keywords: ['software', 'developer', 'development', 'coding', 'programmer', 'programming', 'computer', 'data scien', 'artificial intelligence', 'machine learning', 'deep learning', 'cyber', 'hacking', 'cloud', 'aws', 'azure', 'devops', 'blockchain', 'iot', 'web dev', 'app dev', 'android', 'ios', 'full stack', 'bca', 'mca', 'b.sc cs', 'b.sc it', 'information technology', 'technology', 'big data', 'analytics', 'database', 'networking', 'game dev', 'ai engineer', 'ui dev'],
    mandatory: ['Computer Science', 'Mathematics'],
    suggested: ['Web Development', 'Mobile App Development', 'Data Science', 'Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'Cyber Security', 'Ethical Hacking', 'Cloud Computing', 'DevOps', 'Software Engineering', 'Information Technology', 'Programming', 'Database Management', 'Game Development'],
    note: 'Software/IT/BCA/MCA career ke liye Computer Science + Mathematics strong hona chahiye — coding aur logic building inhi se hoti hai.' },
  // ── ARCHITECTURE (COA — Council of Architecture, NATA rules) ──
  { keywords: ['architect', 'architecture', 'b.arch', 'baarch', 'urban', 'city planning', 'landscape'],
    mandatory: ['Physics', 'Mathematics'],
    suggested: ['Architecture & Planning', 'Interior Design', 'Urban Planning'],
    note: 'B.Arch ke liye NATA / JEE Paper-2 exam hota hai — PCM + Drawing chahiye. 5 saal ka course hai (COA norms).' },
  // ── DEFENCE / NDA / PILOT (UPSC NDA + Airforce rules) ──
  { keywords: ['defence', 'defense', 'nda', 'army', 'navy', 'air force', 'airforce', 'pilot', 'aviation', 'military', 'soldier', 'agniveer', 'agnipath', 'coast guard', 'bsf', 'crpf', 'ssc gd', 'aircraft'],
    mandatory: ['Physics', 'Mathematics'],
    suggested: ['Defence Studies', 'NDA Preparation', 'CDS Preparation', 'Aviation', 'Aeronautical Science', 'Military Science'],
    note: 'NDA ke liye PCM chahiye (12th ke baad, age 16.5-19.5 — UPSC notification). Pilot/Airforce ke liye Physics+Maths compulsory. Agniveer/GD ke liye koi specific subject nahi.' },
  // ── MERCHANT NAVY (DG Shipping rules) ──
  { keywords: ['merchant navy', 'nautical', 'marine', 'ship', 'sailor', 'deck cadet'],
    mandatory: ['Physics', 'Chemistry', 'Mathematics'],
    suggested: ['Nautical Science', 'Ship Building', 'Naval Architecture'],
    note: 'Merchant Navy (B.Sc Nautical Science) ke liye PCM + DNS/GME entrance (DG Shipping norms). Physical fitness zaroori hai.' },
  // ── CIVIL SERVICES / SSC / BANK (UPSC / SSC / IBPS — graduation level) ──
  { keywords: ['ias', 'ips', 'ifs', 'upsc', 'civil services', 'civil service', 'ssc', 'government job', 'govt job', 'railway', 'ias officer', 'collector', 'sdm', 'state pcs', 'pcs', 'magistrate', 'deputy collector', 'sbi', 'bank po', 'bank clerk', 'ibps'],
    mandatory: [],
    suggested: ['UPSC Preparation', 'SSC Preparation', 'State PSC', 'Banking Preparation', 'Railway Preparation', 'Political Science', 'History', 'English Literature', 'Economics'],
    note: 'Civil Services (IAS/IPS) aur SSC/Bank/Railway ke liye koi subject mandatory nahi — Science, Commerce ya Arts koi bhi stream. Graduation ke baad exam de sakte ho.' },
  // ── LAW (BCI — Bar Council of India rules) ──
  { keywords: ['law', 'lawyer', 'llb', 'ba llb', 'bba llb', 'advocate', 'legal', 'judge', 'judicial', 'clat', 'attorney', 'solicitor'],
    mandatory: [],
    suggested: ['Law (LLB)', 'Integrated Law (BA LLB)', 'CLAT Preparation', 'Political Science', 'English Literature', 'Constitutional Law'],
    note: 'Law ke liye koi subject mandatory nahi (BCI norms) — 12th ke baad CLAT se BA LLB (5 saal), ya graduation ke baad LLB (3 saal).' },
  // ── DESIGN / FASHION / ARTS / ACTING (NIFT/NID/FTII — entrance based) ──
  { keywords: ['design', 'designer', 'fashion', 'graphic', 'ui', 'ux', 'animation', 'vfx', 'film', 'photography', 'artist', 'fine art', 'painting', 'sculpture', 'music', 'singer', 'musician', 'dance', 'dancer', 'theatre', 'acting', 'actor', 'actress', 'direction', 'ftii', 'interior', 'jewellery', 'game design', 'product design', 'textile design', 'nift', 'nid', 'uceed'],
    mandatory: [],
    suggested: ['Graphic Design', 'Fashion Design', 'UX/UI Design', 'Animation & VFX', 'Film Making', 'Fine Arts (BFA)', 'Photography', 'Theatre', 'Drama', 'Music (Vocal/Instrumental)', 'Dance', 'Visual Arts'],
    note: 'Design/Art/Fashion/Acting ke liye koi subject mandatory nahi — portfolio aur entrance exams (NIFT, NID, UCEED, FTII) matter karte hain.' },
  // ── JOURNALISM / MEDIA (CUET / IIMC etc.) ──
  { keywords: ['journalist', 'journalism', 'media', 'anchor', 'reporter', 'mass comm', 'advertising', 'public relation', 'content writer', 'content creat', 'youtuber', 'vlogger', 'blogger', 'influencer'],
    mandatory: [],
    suggested: ['Journalism', 'Mass Communication', 'Broadcast Journalism', 'Digital Media', 'Print Media', 'Advertising', 'Public Relations', 'English Literature'],
    note: 'Journalism/Mass Comm ke liye koi subject mandatory nahi — English strong ho to accha hai. CUET se top colleges (IIMC, SIMC) me admission.' },
  // ── HOTEL MGMT (NCHMCT) ──
  { keywords: ['hotel', 'hospitality', 'tourism', 'chef', 'cook', 'air hostess', 'cabin crew', 'flight attendant', 'event management', 'catering', 'resort'],
    mandatory: [],
    suggested: ['Hotel Management', 'Hospitality & Tourism', 'Tourism Management'],
    note: 'Hotel Management ke liye koi subject mandatory nahi — 12th ke baad NCHMCT JEE entrance. Air hostess ke liye English + height/fitness criteria.' },
  // ── ACTUARIAL (IAI) ──
  { keywords: ['actuarial', 'actuary', 'risk analysis'],
    mandatory: ['Mathematics', 'Statistics', 'Economics'],
    suggested: ['Statistics', 'Economics', 'Finance', 'B.Com', 'Mathematics'],
    note: 'Actuarial Science (Insurance/Risk) ke liye Maths+Stats+Economics zaroori hai. IAI institute entrance exam hota hai.' },
  // ── COMMERCE / CA / CS / MBA (ICAI / ICSI / CBSE Commerce) ──
  { keywords: ['chartered', 'accountant', 'b.com', 'bcom', 'commerce', 'finance', 'bank', 'mba', 'bba', 'business', 'entrepreneur', 'marketing', 'stock', 'insurance', 'economics', 'cost account', 'company secretary', 'investment', 'trading', 'startup'],
    mandatory: ['Accountancy', 'Economics', 'Business Studies'],
    suggested: ['Commerce', 'Accountancy', 'Finance', 'Banking & Insurance', 'MBA', 'BBA', 'B.Com', 'Entrepreneurship', 'Business Studies'],
    note: 'Commerce/CA/CS/MBA/Banking career ke liye Accountancy, Economics, Business Studies core hain (CBSE Commerce stream). CA Foundation 12th ke baad de sakte ho.' },
  // ── ENGINEERING — saare AICTE branches (JEE = PCM) ──
  { keywords: ['engineer', 'engineering', 'btech', 'b.tech', 'mechanical', 'civil', 'electrical', 'electronics', 'ece', 'eee', 'chemical engineering', 'aerospace', 'automobile', 'biomedical engineering', 'biotech engineering', 'mining', 'metallurg', 'textile', 'food tech', 'mechatronics', 'robotics', 'petroleum', 'naval', 'instrumentation', 'power engineering', 'production engineering', 'industrial engineering', 'environmental engineering', 'iit', 'jeemain', 'jee', 'nit', 'gate'],
    mandatory: ['Physics', 'Chemistry', 'Mathematics'],
    suggested: ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Electronics & Communication', 'Computer Science Engineering', 'Chemical Engineering', 'Aerospace Engineering', 'Robotics Engineering', 'Biomedical Engineering', 'Architecture & Planning'],
    note: 'Engineering (B.Tech) — saare AICTE branches (Mechanical, Civil, ECE, Chemical, Aerospace, Robotics...) ke liye PCM mandatory hai. JEE/ state entrance PCM se hote hain. Biomedical/Biotech me Biology bhi helpful.' },
  // ── POLYTECHNIC DIPLOMA (State Boards of Technical Education) ──
  { keywords: ['diploma', 'polytechnic', 'lt grade', 'engineering diploma'],
    mandatory: ['Mathematics', 'Physics'],
    suggested: ['Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Computer Science Engineering', 'Electronics Engineering'],
    note: 'Polytechnic diploma 10th ke baad (3 saal, State Board of Technical Education) — Maths/Physics helpful. Diploma ke baad B.Tech me 2nd year lateral entry mil jati hai.' },
  // ── ITI / VOCATIONAL (NCVT / NSDC) ──
  { keywords: ['iti', 'industrial training', 'fitter', 'welder', 'electrician', 'plumber', 'mechanic', 'carpenter', 'tailor', 'beauty', 'cosmetology', 'food processing', 'printing', 'leather', 'glass', 'vocational', 'skill development', 'nsdc'],
    mandatory: [],
    suggested: ['Electrical Work', 'Plumbing', 'Welding', 'Carpentry', 'Automobile Repair', 'Beauty & Wellness', 'Food Processing', 'Printing Technology'],
    note: 'ITI/Vocational course 10th ke baad (1-2 saal, NCVT/NSDC) — koi school subject mandatory nahi, sirf hands-on skill training. NCVT/SCVT certificate milta hai.' },
  // ── AGRICULTURE / VETERINARY (ICAR + NEET for BVSc) ──
  { keywords: ['agriculture', 'farming', 'farmer', 'horticulture', 'forestry', 'forester', 'fisheries', 'dairy', 'icar', 'agriscience', 'organic farming', 'sericulture', 'floriculture', 'plant', 'animal husbandry', 'poultry'],
    mandatory: ['Physics', 'Chemistry', 'Biology'],
    suggested: ['Agriculture (B.Sc)', 'Horticulture', 'Forestry', 'Fisheries Science', 'Dairy Science', 'Agricultural Biotechnology', 'Veterinary Science', 'Plant Pathology', 'Agronomy', 'Animal Husbandry'],
    note: 'B.Sc Agriculture/Forestry/Fisheries ke liye ICAR entrance (PCB ya PCM dono chalte hain). Veterinary (BVSc) ke liye NEET compulsory hai.' },
  // ── TEACHING (NCTE — B.Ed/D.El.Ed) ──
  { keywords: ['teacher', 'teaching', 'professor', 'educator', 'b.ed', 'ctet', 'tet', 'el.ed', 'deled', 'd.el.ed', 'principal', 'lecturer'],
    mandatory: [],
    suggested: ['Teaching (B.Ed)', 'Teaching (CTET/NET)', 'Elementary Education (D.El.Ed)', 'Special Education', 'Educational Psychology', 'Educational Technology'],
    note: 'Teaching ke liye jo subject pasand hai wo apnao — B.Ed usi subject se karna hota hai (NCTE norms). 12th ke baad D.El.Ed (primary), graduation ke baad B.Ed.' },
  // ── PSYCHOLOGY / SOCIAL WORK ──
  { keywords: ['psycholog', 'counsel', 'therapy', 'mental health', 'social worker', 'ngo', 'community service', 'criminolog'],
    mandatory: [],
    suggested: ['Psychology', 'Educational Psychology', 'Guidance & Counselling', 'Social Work', 'Criminology', 'Sociology'],
    note: 'Psychology/Counselling/Social Work ke liye koi subject mandatory nahi — Arts/Science dono se B.A/B.Sc Psychology kar sakte ho.' },
  // ── SPORTS / FITNESS / YOGA ──
  { keywords: ['sports', 'athlete', 'player', 'cricket', 'gym', 'fitness', 'yoga', 'coach', 'bodybuild', 'martial art', 'karate', 'boxing', 'olympiad', 'physio fitness'],
    mandatory: [],
    suggested: ['Sports Science', 'Yoga', 'Physical Fitness', 'Sports Management', 'Coaching', 'Physical Education (B.P.Ed)'],
    note: 'Sports/Fitness/Yoga ke liye koi subject mandatory nahi — B.P.Ed/B.Sc Sports Science ke liye sports quota/tryout se admission milta hai.' },
  // ── TRANSLATION / LANGUAGES ──
  { keywords: ['translat', 'interpreter', 'linguist', 'foreign language', 'french', 'german', 'japanese', 'chinese', 'russian', 'korean', 'spanish'],
    mandatory: [],
    suggested: ['Translation Studies', 'Linguistics', 'English Literature', 'French', 'German', 'Spanish'],
    note: 'Translator/Interpreter ke liye koi subject mandatory nahi — kisi bhi language me BA/MA kar sakte ho. Embassy/UN jobs milti hain.' },
  // ── LIBRARY SCIENCE ──
  { keywords: ['librarian', 'library', 'archivist', 'archive', 'museum'],
    mandatory: [],
    suggested: ['Library Science', 'Archaeology', 'Museology'],
    note: 'Library Science (B.Lib/M.Lib) ke liye graduation ke baad admission — koi subject mandatory nahi.' },
  // ── GENERIC B.Sc ──
  { keywords: ['b.sc', 'bsc', 'bachelor of science', 'm.sc', 'msc'],
    mandatory: [],
    suggested: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Statistics', 'Biotechnology', 'Environmental Science'],
    note: 'B.Sc me PCB / PCM / CS combination chunta hai 12th ke marks ke hisaab se. B.Sc ke baad B.Ed, M.Sc, UPSC, Bank — sab open hain.' },
  // ── GENERIC B.A ──
  { keywords: ['b.a ', 'ba hons', 'bachelor of arts', 'm.a ', 'ma hons'],
    mandatory: [],
    suggested: ['History', 'Geography', 'Political Science', 'Psychology', 'English Literature', 'Sociology', 'Philosophy', 'Economics'],
    note: 'B.A me jo subject pasand ho wo choose karo (Hons bhi kar sakte ho). Arts ke baad UPSC, SSC, Teaching, Law — sab raaste khule hain.' },
];

// Dream job text match karo — pehla matching rule return karo (case-insensitive)
export function matchGoalGuide(dreamJob) {
  const q = (dreamJob || '').toLowerCase().trim();
  if (!q) return null;
  const rule = GOAL_SUBJECT_MAP.find(g => g.keywords.some(k => q.includes(k)));
  if (!rule) return null;
  return { mandatory: rule.mandatory, suggested: rule.suggested, note: rule.note };
}
