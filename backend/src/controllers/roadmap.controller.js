import mongoose from 'mongoose';
import Roadmap from '../models/Roadmap.js';
import Career from '../models/Career.js';
import StudentProfile from '../models/StudentProfile.js';
import { logActivity } from './activity.controller.js';

// ═══ CAREER ROADMAPS — Har career ke liye alag roadmap ═══
// Yahan har career ke liye steps define hain — ye personalize hote hain user ki profile ke according
// Example: Software Engineer ke liye 12 steps, Doctor ke liye 5 steps etc.

const CAREER_ROADMAPS = {

  // ═══ SOFTWARE ENGINEER ROADMAP ═══
  // Agar user Software Engineer banna chahta hai to ye steps follow karega
  'software-engineer': (profile) => {
    const nodes = [];
    const hasSkills = (profile.skills || []).length > 0;  // Check: user ke paas koi skills hain?
    const isUG = ['undergraduate', 'postgraduate'].includes(profile.educationLevel);  // Check: user graduate hai?
    const budget = profile.budget || 'low';  // User ka budget — free resources ya paid?

    // STEP 1: Development environment setup
    // Sabse pehle tools install karo — VS Code, Git, terminal
    nodes.push({
      title: 'Set Up Your Learning Environment',
      description: 'Install necessary tools — code editor (VS Code), terminal, and a browser with developer tools.',
      type: 'setup', category: 'learning', difficulty: 'easy', estimatedDuration: '1 day',
      resources: [
        { title: 'VS Code Download', url: 'https://code.visualstudio.com', type: 'free' },
        { title: 'Git Setup Guide', url: 'https://git-scm.com/book', type: 'free' },
      ],
      tips: 'VS Code is the most popular editor. Install useful extensions like Prettier and ESLint.',
      whyThis: 'A proper development environment is essential before writing any code.',
      order: 1,
    });

    // STEP 2: Programming basics seekho
    // Agar user ke paas pehle se skills hain to thoda advanced level
    // Agar nahi hain to beginner se start
    nodes.push({
      title: 'Learn Programming Basics',
      description: hasSkills
        ? 'You already have some skills — let\'s strengthen your fundamentals in a programming language.'
        : 'Start with a beginner-friendly language like Python or JavaScript. Learn variables, loops, functions, and basic data structures.',
      type: 'education', category: 'learning', difficulty: 'easy', estimatedDuration: '2-3 months',
      resources: budget === 'low' || budget === 'medium'
        ? [
          { title: 'freeCodeCamp (Free)', url: 'https://freecodecamp.org', type: 'free' },
          { title: 'CS50 by Harvard (Free)', url: 'https://cs50.harvard.edu', type: 'free' },
          { title: 'CodeWithHarry (YouTube)', url: 'https://youtube.com/codewithharry', type: 'youtube' },
        ]
        : [
          { title: 'Udemy — 100 Days of Code', url: 'https://udemy.com', type: 'paid' },
          { title: 'Coursera — Python for Everybody', url: 'https://coursera.org', type: 'paid' },
        ],
      tips: 'Pick ONE language and stick with it. JavaScript is great for web, Python for AI/ML.',
      whyThis: 'Programming fundamentals are the building blocks of every software career.',
      order: 2,
    });

    // STEP 3: DSA (Data Structures & Algorithms)
    // Interview ke liye sabse zaroori — ye coding interview ka filter hai
    nodes.push({
      title: 'Learn Data Structures & Algorithms',
      description: 'Master arrays, linked lists, trees, graphs, sorting, and searching. This is the core of technical interviews.',
      type: 'education', category: 'learning', difficulty: 'hard', estimatedDuration: '3-4 months',
      resources: [
        { title: 'LeetCode (Free)', url: 'https://leetcode.com', type: 'free' },
        { title: 'Striver A2Z DSA Sheet', url: 'https://takeuforward.org/strivers-a2z-dsa-course/', type: 'free' },
        { title: 'NeetCode Roadmap', url: 'https://neetcode.io', type: 'free' },
      ],
      tips: 'Solve at least 2-3 problems daily. Start with easy, then medium, then hard.',
      whyThis: 'DSA is the #1 filter in technical interviews at top companies.',
      order: 3,
    });

    // STEP 4: Tech stack choose karo
    // Frontend, Backend, ya Full Stack — user ko choose karna hai
    nodes.push({
      title: 'Choose a Tech Stack',
      description: 'Pick a specialization based on your interests:',
      type: 'education', category: 'learning', difficulty: 'medium', estimatedDuration: '2 weeks',
      resources: [
        { title: 'Frontend: React.js', url: 'https://react.dev', type: 'free' },
        { title: 'Backend: Node.js', url: 'https://nodejs.org', type: 'free' },
        { title: 'Full Stack Roadmap', url: 'https://roadmap.sh', type: 'free' },
      ],
      tips: 'Frontend (React/Vue) for UI, Backend (Node/Django) for servers, DevOps for infrastructure.',
      whyThis: 'Specializing helps you stand out and build deeper expertise.',
      order: 4,
    });

    // STEP 5: Real projects banao
    // 3-5 real projects jo solve karein actual problems
    nodes.push({
      title: 'Build 3-5 Real Projects',
      description: 'Build projects that solve real problems — not just tutorial clones. Each project teaches you more than 10 tutorials.',
      type: 'project', category: 'project', difficulty: 'medium', estimatedDuration: '2-3 months',
      resources: [
        { title: 'Project Ideas', url: 'https://github.com/practical-tutorials/project-based-learning', type: 'free' },
        { title: 'GitHub for hosting', url: 'https://github.com', type: 'free' },
      ],
      tips: 'Projects: Todo app → Weather app → E-commerce → Chat app → Portfolio website',
      whyThis: 'Projects prove your skills to employers. A strong portfolio speaks louder than certificates.',
      order: 5,
    });

    // STEP 6: Git & GitHub seekho
    // Version control — har company use karti hai
    nodes.push({
      title: 'Learn Git & GitHub',
      description: 'Version control is non-negotiable. Learn branching, commits, pull requests, and collaboration.',
      type: 'skill', category: 'learning', difficulty: 'easy', estimatedDuration: '1 week',
      resources: [
        { title: 'Git Handbook', url: 'https://guides.github.com/activities/hello-world/', type: 'free' },
        { title: 'Oh Shit, Git!?', url: 'https://ohshitgit.com', type: 'free' },
      ],
      tips: 'Push all your projects to GitHub. Your GitHub profile is your resume for tech companies.',
      whyThis: 'Every company uses Git. It\'s essential for collaboration and code management.',
      order: 6,
    });

    // STEP 7: Portfolio banao
    // Professional portfolio website — resume ki jagah
    nodes.push({
      title: 'Build Your Portfolio',
      description: 'Create a professional portfolio website showcasing your best projects, skills, and contact info.',
      type: 'project', category: 'project', difficulty: 'medium', estimatedDuration: '1-2 weeks',
      resources: [
        { title: 'GitHub Pages (Free)', url: 'https://pages.github.com', type: 'free' },
        { title: 'Netlify (Free)', url: 'https://netlify.com', type: 'free' },
      ],
      tips: 'Keep it clean, mobile-friendly, and include links to your GitHub and live projects.',
      whyThis: 'A portfolio is your first impression. Make it count.',
      order: 7,
    });

    // STEP 8: Mock interviews practice karo
    // Interview se pehle practice zaroori hai
    nodes.push({
      title: 'Practice Mock Interviews',
      description: 'Practice coding interviews with peers or on platforms. Time yourself — most interviews give 30-45 min per problem.',
      type: 'interview', category: 'interview', difficulty: 'medium', estimatedDuration: '1 month',
      resources: [
        { title: 'Pramp (Free Mock Interviews)', url: 'https://pramp.com', type: 'free' },
        { title: 'InterviewBit', url: 'https://interviewbit.com', type: 'free' },
      ],
      tips: 'Practice explaining your thought process out loud. Interviewers care about HOW you think.',
      whyThis: 'Even great coders fail interviews if they can\'t communicate their approach.',
      order: 8,
    });

    // STEP 9: Internship ke liye apply karo
    // Real experience ke liye internship zaroori hai
    nodes.push({
      title: 'Apply for Internships',
      description: 'Start applying for internships. Even a 3-month internship adds massive value to your resume.',
      type: 'application', category: 'application', difficulty: 'medium', estimatedDuration: '1-2 months',
      resources: [
        { title: 'Internshala', url: 'https://internshala.com', type: 'platform' },
        { title: 'LinkedIn Jobs', url: 'https://linkedin.com/jobs', type: 'platform' },
        { title: 'AngelList', url: 'https://angel.co', type: 'platform' },
      ],
      tips: 'Apply to 10-20 places daily. Don\'t get discouraged by rejections — they\'re normal.',
      whyThis: 'Real-world experience is the best teacher and boosts your resume hugely.',
      order: 9,
    });

    // STEP 10: Resume banao
    // ATS-friendly resume — jo robot bhi padh sake
    nodes.push({
      title: 'Build Your Resume',
      description: 'Create a professional, ATS-friendly resume. Highlight projects, skills, and any experience.',
      type: 'resume', category: 'interview', difficulty: 'easy', estimatedDuration: '2-3 days',
      resources: [
        { title: 'Jake\'s Resume Template', url: 'https://github.com/jakegut/resume', type: 'free' },
        { title: 'Resume Checklist', url: 'https://candor.co/articles/resume-tips', type: 'free' },
      ],
      tips: 'Keep it to 1 page. Use action verbs. Quantify achievements (e.g., "Reduced load time by 40%").',
      whyThis: 'Your resume is the key that opens doors to interviews.',
      order: 10,
    });

    // STEP 11: Job ke liye apply karo
    // Ab full-time jobs ke liye apply karo
    nodes.push({
      title: 'Start Job Applications',
      description: 'Apply for full-time positions. Target companies that match your skills and interests.',
      type: 'application', category: 'application', difficulty: 'hard', estimatedDuration: '2-3 months',
      resources: [
        { title: 'LinkedIn', url: 'https://linkedin.com', type: 'platform' },
        { title: 'Naukri.com', url: 'https://naukri.com', type: 'platform' },
        { title: 'Glassdoor', url: 'https://glassdoor.com', type: 'platform' },
      ],
      tips: 'Customize your resume for each job. Apply to 10+ companies daily. Follow up after 1 week.',
      whyThis: 'Consistent application is the key. Most people give up too early.',
      order: 11,
    });

    // STEP 12: Never stop learning
    // Technology badalta rehta hai — hamesha seekhte raho
    nodes.push({
      title: 'Never Stop Learning',
      description: 'Technology evolves fast. Stay updated with new tools, frameworks, and industry trends.',
      type: 'skill', category: 'learning', difficulty: 'easy', estimatedDuration: 'Ongoing',
      resources: [
        { title: 'Dev.to', url: 'https://dev.to', type: 'free' },
        { title: 'Hacker News', url: 'https://news.ycombinator.com', type: 'free' },
        { title: 'Tech YouTube Channels', url: 'https://youtube.com', type: 'youtube' },
      ],
      tips: 'Read 1-2 articles daily. Attend webinars. Join tech communities.',
      whyThis: 'The best developers never stop learning. It\'s what keeps you relevant.',
      order: 12,
    });

    return nodes;
  },

  // ═══ DATA SCIENTIST ROADMAP ═══
  // Agar user Data Scientist banna chahta hai
  'data-scientist': (profile) => {
    const budget = profile.budget || 'low';
    return [
      { title: 'Strengthen Math Foundations', description: 'Build strong basics in Linear Algebra, Calculus, and Probability — these are the backbone of Data Science.', type: 'education', category: 'learning', difficulty: 'medium', estimatedDuration: '1-2 months', resources: [{ title: 'Khan Academy (Free)', url: 'https://khanacademy.org', type: 'free' }], tips: 'Focus on matrix operations, derivatives, and Bayes theorem.', whyThis: 'Math is the language of machine learning. Without it, models are just black boxes.', order: 1 },
      { title: 'Learn Python for Data Science', description: 'Master Python with libraries: NumPy, Pandas, Matplotlib, Seaborn.', type: 'education', category: 'learning', difficulty: 'medium', estimatedDuration: '2 months', resources: budget === 'low' ? [{ title: 'Kaggle Learn (Free)', url: 'https://kaggle.com/learn', type: 'free' }] : [{ title: 'Coursera — IBM Data Science', url: 'https://coursera.org', type: 'paid' }], tips: 'Practice with real datasets on Kaggle.', whyThis: 'Python is the #1 language for data science. These libraries handle 90% of data work.', order: 2 },
      { title: 'Learn Statistics & Probability', description: 'Understand descriptive stats, hypothesis testing, distributions, A/B testing.', type: 'education', category: 'learning', difficulty: 'medium', estimatedDuration: '1 month', resources: [{ title: 'StatQuest (YouTube)', url: 'https://youtube.com/statquest', type: 'youtube' }], tips: 'StatQuest makes statistics visual and easy to understand.', whyThis: 'Statistics helps you validate your findings and avoid false conclusions.', order: 3 },
      { title: 'Learn SQL for Data', description: 'Master SQL queries, joins, subqueries, window functions for data extraction.', type: 'skill', category: 'learning', difficulty: 'easy', estimatedDuration: '2 weeks', resources: [{ title: 'SQLBolt (Free)', url: 'https://sqlbolt.com', type: 'free' }, { title: 'W3Schools SQL', url: 'https://w3schools.com/sql', type: 'free' }], tips: 'Practice writing queries daily. SQL is asked in every data science interview.', whyThis: 'SQL is how you extract data from databases — a daily tool for data scientists.', order: 4 },
      { title: 'Learn Machine Learning Basics', description: 'Understand regression, classification, clustering, decision trees, and model evaluation.', type: 'education', category: 'learning', difficulty: 'hard', estimatedDuration: '3 months', resources: [{ title: 'Andrew Ng ML Course (Free)', url: 'https://coursera.org/learn/machine-learning', type: 'free' }, { title: 'Scikit-learn Docs', url: 'https://scikit-learn.org', type: 'free' }], tips: 'Andrew Ng\'s course is the gold standard. Take notes and implement every algorithm.', whyThis: 'ML is the core of data science. These algorithms help you make predictions from data.', order: 5 },
      { title: 'Build 5 Data Projects', description: 'Work on real datasets: EDA, visualization, ML models. Publish on Kaggle and GitHub.', type: 'project', category: 'project', difficulty: 'medium', estimatedDuration: '2-3 months', resources: [{ title: 'Kaggle Datasets', url: 'https://kaggle.com/datasets', type: 'free' }], tips: 'Start with Titanic dataset, then move to more complex ones. Document your process.', whyThis: 'Projects demonstrate your ability to extract insights from real data.', order: 6 },
      { title: 'Learn Deep Learning Basics', description: 'Introduction to neural networks, CNNs, RNNs, and transformers.', type: 'education', category: 'learning', difficulty: 'hard', estimatedDuration: '2 months', resources: [{ title: 'Fast.ai (Free)', url: 'https://fast.ai', type: 'free' }, { title: 'Deep Learning Specialization', url: 'https://coursera.org', type: 'paid' }], tips: 'Start with fast.ai — it\'s practical and project-based.', whyThis: 'Deep learning powers modern AI — image recognition, NLP, and more.', order: 7 },
      { title: 'Build Portfolio & Resume', description: 'Create a data science portfolio with 5+ projects. Highlight impact and insights.', type: 'resume', category: 'interview', difficulty: 'easy', estimatedDuration: '1 week', resources: [{ title: 'GitHub Pages', url: 'https://pages.github.com', type: 'free' }], tips: 'For each project: problem → approach → results → insights. Use visualizations.', whyThis: 'A portfolio proves you can do the job, not just talk about it.', order: 8 },
      { title: 'Apply for Internships/Jobs', description: 'Apply for data analyst, data scientist, or ML engineer roles.', type: 'application', category: 'application', difficulty: 'medium', estimatedDuration: '2-3 months', resources: [{ title: 'LinkedIn', url: 'https://linkedin.com', type: 'platform' }, { title: 'Kaggle Jobs', url: 'https://kaggle.com/jobs', type: 'platform' }], tips: 'Apply to 10+ places daily. Tailor your resume for each role.', whyThis: 'Getting your first data science role is the hardest — persistence is key.', order: 9 },
    ];
  },

  // ═══ DOCTOR ROADMAP ═══
  // Agar user Doctor banna chahta hai
  'doctor': (profile) => {
    return [
      { title: 'Complete 12th Science (PCB)', description: 'Ensure strong grades in Physics, Chemistry, and Biology. NEET requires 50%+ in PCB.', type: 'education', category: 'learning', difficulty: 'hard', estimatedDuration: '1-2 years', resources: [{ title: 'NCERT Books', url: 'https://ncert.nic.in', type: 'free' }], tips: 'NCERT is the bible for NEET. Read every line.', whyThis: 'NEET is the gateway to medical colleges. Strong basics are non-negotiable.', order: 1 },
      { title: 'Crack NEET Exam', description: 'Prepare for NEET with focused study — Biology (50%), Physics (25%), Chemistry (25%).', type: 'education', category: 'learning', difficulty: 'hard', estimatedDuration: '1-2 years', resources: [{ title: 'NEET Official Website', url: 'https://ntaneet.nic.in', type: 'free' }, { title: 'Physics Wallah (Free)', url: 'https://physicswallah.com', type: 'free' }], tips: 'Solve previous year papers. Join a test series.', whyThis: 'NEET rank determines your medical college. Higher rank = better college.', order: 2 },
      { title: 'MBBS (5.5 years)', description: 'Complete MBBS from a recognized medical college. Includes 4.5 years + 1 year internship.', type: 'education', category: 'learning', difficulty: 'hard', estimatedDuration: '5.5 years', resources: [], tips: 'Focus on clinical exposure. Don\'t just memorize — understand.', whyThis: 'MBBS is the foundation. You must complete it to practice medicine.', order: 3 },
      { title: 'Choose Specialization (MD/MS)', description: 'After MBBS, choose a specialization based on your interests — Cardiology, Neurology, Surgery, etc.', type: 'education', category: 'learning', difficulty: 'hard', estimatedDuration: '3 years', resources: [], tips: 'Choose based on your passion, not just salary. You\'ll do this for decades.', whyThis: 'Specialization defines your career path and expertise.', order: 4 },
      { title: 'Build Clinical Experience', description: 'Work in hospitals, observe senior doctors, handle patients under supervision.', type: 'practice', category: 'practice', difficulty: 'medium', estimatedDuration: 'Ongoing', resources: [], tips: 'Every patient teaches you something new. Stay humble and curious.', whyThis: 'Clinical experience is what transforms a student into a doctor.', order: 5 },
    ];
  },

  // ═══ DEFAULT ROADMAP ═══
  // Agar career ka specific roadmap nahi hai to ye generic roadmap use hoga
  default: (profile) => {
    return [
      { title: 'Define Your Career Goal', description: 'Clearly define what you want to achieve. Write it down — a goal without a plan is just a wish.', type: 'profile', category: 'learning', difficulty: 'easy', estimatedDuration: '1 day', resources: [], tips: 'Be specific: "I want to become a Software Engineer at a product company" is better than "I want a good job".', whyThis: 'Clarity of purpose drives every decision you make.', order: 1 },
      { title: 'Research Your Field', description: 'Understand what skills, education, and experience are needed for your chosen career.', type: 'education', category: 'learning', difficulty: 'easy', estimatedDuration: '1 week', resources: [{ title: 'LinkedIn', url: 'https://linkedin.com', type: 'platform' }], tips: 'Talk to people already in the field. Read job descriptions to understand requirements.', whyThis: 'Research helps you plan effectively and avoid wasting time on wrong paths.', order: 2 },
      { title: 'Build Required Skills', description: 'Identify and learn the core skills needed for your career.', type: 'skill', category: 'learning', difficulty: 'medium', estimatedDuration: '3-6 months', resources: [], tips: 'Focus on 2-3 core skills rather than trying to learn everything.', whyThis: 'Skills are what employers pay for. Build them systematically.', order: 3 },
      { title: 'Gain Practical Experience', description: 'Apply what you learn through projects, internships, or volunteering.', type: 'project', category: 'project', difficulty: 'medium', estimatedDuration: '2-3 months', resources: [], tips: 'Start small. Even a personal project counts as experience.', whyThis: 'Theory without practice is useless. Real experience builds real competence.', order: 4 },
      { title: 'Build Your Network', description: 'Connect with professionals in your field through events, LinkedIn, and communities.', type: 'skill', category: 'practice', difficulty: 'easy', estimatedDuration: 'Ongoing', resources: [{ title: 'LinkedIn', url: 'https://linkedin.com', type: 'platform' }], tips: 'Don\'t just collect contacts — build genuine relationships.', whyThis: '80% of jobs are filled through networking. Your network is your net worth.', order: 5 },
      { title: 'Apply & Interview', description: 'Start applying for roles. Prepare for interviews with mock practice.', type: 'application', category: 'application', difficulty: 'medium', estimatedDuration: '2-3 months', resources: [], tips: 'Apply to 10+ places daily. Every rejection teaches you something.', whyThis: 'Persistence is the key. Most successful people faced many rejections first.', order: 6 },
    ];
  },
};

// ═══ INTEREST TO CAREER MAPPING ═══
// User ki interests ke hisaab se best career suggest karo
// Agar user ne "Technology" select kiya hai to Software Engineer suggest hoga
const INTEREST_CAREER_MAP = {
  'Technology': 'software-engineer',
  'Science': 'data-scientist',
  'Healthcare': 'doctor',
  'Engineering': 'software-engineer',
  'Business': 'data-scientist',
  'Design': 'software-engineer',
  'Arts': 'software-engineer',
  'Law': 'doctor',
};

// ═══ getUserProfile — User ka profile fetch karo ═══
async function getUserProfile(userId) {
  try {
    const profile = await StudentProfile.findOne({ user: userId });
    return profile || {};
  } catch {
    return {};
  }
}

// ═══ getSuggestedCareer — Interests se best career suggest karo ═══
// User ki pehli interest ke hisaab se career dhundho
function getSuggestedCareer(interests) {
  for (const interest of interests) {
    if (INTEREST_CAREER_MAP[interest]) return INTEREST_CAREER_MAP[interest];
  }
  return 'default';  // Agar koi match na ho to default career
}

// ═══ generateAutoRoadmap — Automatically roadmap banao ═══
// Onboarding complete hone pe ya roadmap page pe aane pe auto-generate hota hai
async function generateAutoRoadmap(userId, profile) {
  const interests = profile.interests || [];
  const careerSlug = getSuggestedCareer(interests);  // Interest se career dhundho

  const profileData = {
    educationLevel: profile.educationLevel || '',
    skills: (profile.skills || []).map(s => s.name || s),
    interests: profile.interests || [],
    budget: profile.budget || 'low',
  };

  // Career ka data database se lao (agar hai to)
  let careerDoc = await Career.findOne({ slug: careerSlug });
  if (!careerDoc) careerDoc = await Career.findOne({ isActive: true });

  // Personalized nodes generate karo
  const nodes = generatePersonalizedNodes(careerSlug, profileData);

  // Milestones initialize karo
  const milestones = [
    { percent: 25, reached: false },
    { percent: 50, reached: false },
    { percent: 75, reached: false },
    { percent: 100, reached: false },
  ];

  // Career title nikalo
  const careerTitles = {
    'software-engineer': 'Software Engineer',
    'data-scientist': 'Data Scientist',
    'doctor': 'Doctor',
    'default': 'Your Career',
  };
  const careerTitle = careerTitles[careerSlug] || 'Your Career';

  // Purana roadmap delete karo
  await Roadmap.deleteMany({ student: userId });

  // Naya roadmap create karo
  const roadmap = await Roadmap.create({
    student: userId,
    career: careerDoc?._id || null,
    title: `Path to ${careerTitle}`,
    description: `Your personalized roadmap to become a ${careerTitle}`,
    nodes,
    milestones,
    overallProgress: 0,
    userProfile: profileData,
  });

  logActivity(userId, 'Auto-generated personalized roadmap', 'roadmap', { career: careerTitle, steps: nodes.length, interests });

  return roadmap;
}

// ═══ generatePersonalizedNodes — Personalized roadmap banao ═══
// Career slug ke hisaab se sahi generator function dhundho aur user ki profile pass karo
function generatePersonalizedNodes(careerSlug, profile) {
  const generator = CAREER_ROADMAPS[careerSlug] || CAREER_ROADMAPS.default;
  // Agar specific career ka roadmap hai to wo use karo, warna default
  return generator(profile);
}

// ═══ getMyRoadmap — User ka roadmap lao ═══
// GET /roadmap — current logged-in user ka roadmap fetch karo
// Agar roadmap nahi hai aur onboarding complete hai to auto-generate karo
export const getMyRoadmap = async (req, res, next) => {
  try {
    // Career ka title aur icon bhi lao populate se
    let roadmap = await Roadmap.findOne({ student: req.user._id }).populate('career', 'title slug icon');

    // Agar roadmap nahi hai to check karo — kya onboarding complete hai?
    if (!roadmap) {
      const profile = await getUserProfile(req.user._id);
      // Agar profile hai aur interests hain to auto-generate roadmap
      if (profile && profile.interests && profile.interests.length > 0 && profile.onboardingCompleted) {
        roadmap = await generateAutoRoadmap(req.user._id, profile);
      }
    }

    res.status(200).json({ success: true, data: { roadmap } });
  } catch (error) {
    // Agar purana roadmap corrupt hai (wrong schema) to use delete karo
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      try {
        await Roadmap.deleteMany({ student: req.user._id });
        res.status(200).json({ success: true, data: { roadmap: null } });
      } catch { next(error); }
    } else { next(error); }
  }
};

// ═══ createRoadmap — Naya personalized roadmap banao ═══
// POST /roadmap — automatically user ki profile se roadmap ban jayega
// careerId optional hai — agar na de to interests se auto-detect hoga
export const createRoadmap = async (req, res, next) => {
  try {
    const { careerId } = req.body;

    // User ka profile lao
    const profile = await getUserProfile(req.user._id);
    if (!profile || !profile.onboardingCompleted) {
      return res.status(400).json({ success: false, message: 'Please complete onboarding first' });
    }

    const profileData = {
      educationLevel: profile.educationLevel || '',
      skills: (profile.skills || []).map(s => s.name || s),
      interests: profile.interests || [],
      budget: profile.budget || 'low',
    };

    // Agar careerId diya hai to use karo, warna interests se auto-detect karo
    let careerSlug;
    let careerDoc;

    if (careerId) {
      careerDoc = await Career.findById(careerId);
      careerSlug = careerDoc?.slug || 'default';
    } else {
      careerSlug = getSuggestedCareer(profile.interests || []);
      careerDoc = await Career.findOne({ slug: careerSlug });
      if (!careerDoc) careerDoc = await Career.findOne({ isActive: true });
    }

    // Personalized nodes generate karo
    const nodes = generatePersonalizedNodes(careerSlug, profileData);

    // Milestones initialize karo
    const milestones = [
      { percent: 25, reached: false },
      { percent: 50, reached: false },
      { percent: 75, reached: false },
      { percent: 100, reached: false },
    ];

    // Career title nikalo
    const careerTitles = {
      'software-engineer': 'Software Engineer',
      'data-scientist': 'Data Scientist',
      'doctor': 'Doctor',
      'default': 'Your Career',
    };
    const careerTitle = careerDoc?.title || careerTitles[careerSlug] || 'Your Career';

    // Purana roadmap delete karo
    await Roadmap.deleteMany({ student: req.user._id });

    // Naya roadmap save karo database mein
    const roadmap = await Roadmap.create({
      student: req.user._id,
      career: careerDoc?._id || null,
      title: `Path to ${careerTitle}`,
      description: `Your personalized roadmap to become a ${careerTitle}`,
      nodes,
      milestones,
      overallProgress: 0,
      userProfile: profileData,
    });

    logActivity(req.user._id, 'Created personalized roadmap', 'roadmap', { career: careerTitle, steps: nodes.length });

    res.status(201).json({ success: true, message: 'Personalized roadmap created', data: { roadmap } });
  } catch (error) { next(error); }
};

// ═══ updateNodeProgress — Step ka status update karo ═══
// PUT /roadmap/node/:nodeId — koi step start karo ya complete karo
export const updateNodeProgress = async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { status, progress } = req.body;

    // User ka roadmap dhoondo
    const roadmap = await Roadmap.findOne({ student: req.user._id });
    if (!roadmap) return res.status(404).json({ success: false, message: 'No roadmap found' });

    // Specific node dhoondo
    const node = roadmap.nodes.id(nodeId);
    if (!node) return res.status(404).json({ success: false, message: 'Node not found' });

    // Status aur progress update karo
    node.status = status || node.status;
    node.progress = progress !== undefined ? progress : node.progress;

    // Activity log mein note karo
    logActivity(req.user._id, `Updated step: ${node.title}`, 'roadmap', { step: node.title, status: node.status });

    // Overall progress calculate karo — kitne steps complete hue
    const completed = roadmap.nodes.filter(n => n.status === 'completed').length;
    roadmap.overallProgress = Math.round((completed / roadmap.nodes.length) * 100);

    // Milestones check karo — kya koi naya milestone pahuncha?
    if (roadmap.milestones) {
      roadmap.milestones.forEach(m => {
        if (!m.reached && roadmap.overallProgress >= m.percent) {
          m.reached = true;        // Milestone pahunch gaya!
          m.reachedAt = new Date();  // Kab pahuncha — time save karo
        }
      });
    }

    // Database mein save karo
    await roadmap.save();
    res.status(200).json({ success: true, message: 'Node updated', data: { roadmap } });
  } catch (error) {
    // Agar roadmap corrupt hai to delete karo
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      try {
        await Roadmap.deleteMany({ student: req.user._id });
        res.status(400).json({ success: false, message: 'Roadmap was corrupted. Please create a new one.' });
      } catch { next(error); }
    } else { next(error); }
  }
};