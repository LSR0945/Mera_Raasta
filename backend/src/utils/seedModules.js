import { Project, Internship, Job, Interview } from '../models/CareerReadiness.js';
import { LmsCourse, Quiz } from '../models/LmsQuiz.js';
import { logger } from './logger.js';

const projects = [
  { title: 'Portfolio Website', slug: 'portfolio', description: 'Build a responsive portfolio.', shortDescription: 'Personal portfolio', difficulty: 'beginner', category: 'web', skills: [{ name: 'HTML', level: 'beginner' }, { name: 'CSS', level: 'beginner' }], duration: '1 week', isPublished: true, isDemo: true },
  { title: 'Todo App React', slug: 'todo-react', description: 'Build a Todo app with React.', shortDescription: 'React Todo app', difficulty: 'beginner', category: 'web', skills: [{ name: 'React', level: 'beginner' }], duration: '2 weeks', isPublished: true, isDemo: true },
  { title: 'REST API Node.js', slug: 'rest-api', description: 'Build a REST API with Node and Express.', shortDescription: 'Backend API', difficulty: 'intermediate', category: 'backend', skills: [{ name: 'Node.js', level: 'intermediate' }], duration: '2 weeks', isPublished: true, isDemo: true },
  { title: 'E-commerce Frontend', slug: 'ecommerce', description: 'Build an e-commerce UI.', shortDescription: 'E-commerce UI', difficulty: 'intermediate', category: 'web', skills: [{ name: 'React', level: 'intermediate' }], duration: '3 weeks', isPublished: true, isDemo: true },
  { title: 'Data Analysis Python', slug: 'data-analysis', description: 'Analyze datasets with Python.', shortDescription: 'Python data analysis', difficulty: 'intermediate', category: 'data', skills: [{ name: 'Python', level: 'intermediate' }], duration: '2 weeks', isPublished: true, isDemo: true },
  { title: 'ML Model', slug: 'ml-model', description: 'Build a basic ML model.', shortDescription: 'ML classification', difficulty: 'advanced', category: 'data', skills: [{ name: 'Python', level: 'advanced' }], duration: '4 weeks', isPublished: true, isDemo: true },
];

const internships = [
  { title: 'Web Dev Intern', slug: 'web-intern', company: 'TechStart', description: 'Full-stack web development.', shortDescription: 'Web dev internship', type: 'remote', duration: '3 months', stipend: { min: 5000, max: 15000 }, location: { remote: true }, requiredSkills: [{ name: 'HTML', level: 'beginner' }], requiredEducation: '12th or pursuing', openings: 5, deadline: new Date('2026-12-31'), isPaid: true, isDemo: true, isActive: true },
  { title: 'Data Science Intern', slug: 'data-intern', company: 'DataInsight', description: 'Data analysis projects.', shortDescription: 'Data science internship', type: 'remote', duration: '6 months', stipend: { min: 10000, max: 25000 }, location: { remote: true }, requiredSkills: [{ name: 'Python', level: 'intermediate' }], requiredEducation: 'B.Tech/BCA', openings: 3, deadline: new Date('2026-11-30'), isPaid: true, isDemo: true, isActive: true },
  { title: 'Marketing Intern', slug: 'marketing-intern', company: 'GrowthHub', description: 'Digital marketing campaigns.', shortDescription: 'Digital marketing', type: 'hybrid', duration: '3 months', stipend: { min: 8000, max: 12000 }, location: { city: 'Mumbai' }, requiredSkills: [{ name: 'Communication', level: 'intermediate' }], requiredEducation: '12th or graduation', openings: 4, deadline: new Date('2026-10-15'), isPaid: true, isDemo: true, isActive: true },
  { title: 'Design Intern', slug: 'design-intern', company: 'CreativeStudio', description: 'Visual content creation.', shortDescription: 'Design internship', type: 'remote', duration: '2 months', stipend: { min: 5000, max: 10000 }, location: { remote: true }, requiredSkills: [{ name: 'Photoshop', level: 'beginner' }], requiredEducation: 'Any', openings: 2, deadline: new Date('2026-11-01'), isPaid: true, isDemo: true, isActive: true },
];

const jobs = [
  { title: 'Frontend Developer', slug: 'frontend-dev', company: 'TechCorp', description: 'Build web interfaces.', shortDescription: 'Frontend dev role', type: 'full-time', salary: { min: 400000, max: 800000 }, location: { city: 'Bangalore' }, requiredSkills: [{ name: 'React', level: 'intermediate' }], requiredEducation: 'B.Tech/BCA', openings: 3, isDemo: true, isActive: true },
  { title: 'Backend Developer', slug: 'backend-dev', company: 'StartupXYZ', description: 'Build APIs and services.', shortDescription: 'Backend dev role', type: 'full-time', salary: { min: 500000, max: 1000000 }, location: { remote: true }, requiredSkills: [{ name: 'Node.js', level: 'intermediate' }], requiredEducation: 'B.Tech/BCA', openings: 2, isDemo: true, isActive: true },
  { title: 'Data Analyst', slug: 'data-analyst', company: 'AnalyticsCo', description: 'Analyze business data.', shortDescription: 'Data analyst role', type: 'full-time', salary: { min: 400000, max: 700000 }, location: { city: 'Delhi' }, requiredSkills: [{ name: 'SQL', level: 'intermediate' }], requiredEducation: 'Any graduate', openings: 4, isDemo: true, isActive: true },
];

const interviews = [
  { title: 'JS Basics Quiz', slug: 'js-basics', company: 'General', description: 'JavaScript fundamentals.', shortDescription: 'JS quiz', type: 'technical', questions: [{ question: 'What is a closure?', options: ['Function scope', 'Variable', 'Loop', 'Array'], correctAnswer: 0, explanation: 'A closure is a function with access to its outer scope.' }], duration: 30, totalQuestions: 10, isPublished: true, isDemo: true },
  { title: 'React Quiz', slug: 'react-quiz', company: 'General', description: 'React concepts.', shortDescription: 'React quiz', type: 'technical', questions: [{ question: 'What is JSX?', options: ['JavaScript XML', 'Java Syntax', 'JSON', 'CSS'], correctAnswer: 0, explanation: 'JSX is a syntax extension for JavaScript.' }], duration: 30, totalQuestions: 10, isPublished: true, isDemo: true },
];

const lmsCourses = [
  { title: 'HTML & CSS Basics', slug: 'html-css', description: 'Learn web fundamentals.', shortDescription: 'Web basics', category: 'web', difficulty: 'beginner', duration: '2 weeks', skills: ['HTML', 'CSS'], lessons: [{ title: 'Introduction to HTML', content: 'Learn HTML tags.', order: 1 }], isPublished: true, isDemo: true },
  { title: 'JavaScript Essentials', slug: 'js-essentials', description: 'Master JavaScript.', shortDescription: 'JS fundamentals', category: 'web', difficulty: 'beginner', duration: '4 weeks', skills: ['JavaScript'], lessons: [{ title: 'Variables & Types', content: 'Learn JS variables.', order: 1 }], isPublished: true, isDemo: true },
  { title: 'React for Beginners', slug: 'react-beginners', description: 'Learn React from scratch.', shortDescription: 'React basics', category: 'web', difficulty: 'intermediate', duration: '6 weeks', skills: ['React'], lessons: [{ title: 'Components', content: 'React components.', order: 1 }], isPublished: true, isDemo: true },
];

const quizzes = [
  { title: 'HTML Quiz', slug: 'html-quiz', description: 'Test your HTML knowledge.', category: 'web', difficulty: 'beginner', duration: 15, questions: [{ question: 'What does HTML stand for?', options: ['HyperText Markup Language', 'High Tech Modern Language', 'Home Tool Markup Language', 'Hyperlink Text Mode Language'], correctAnswer: 0, explanation: 'HTML = HyperText Markup Language.' }], passingScore: 60, isPublished: true, isDemo: true },
  { title: 'CSS Quiz', slug: 'css-quiz', description: 'Test your CSS knowledge.', category: 'web', difficulty: 'beginner', duration: 15, questions: [{ question: 'What does CSS stand for?', options: ['Cascading Style Sheets', 'Computer Style Sheets', 'Creative Style System', 'Colorful Style Sheets'], correctAnswer: 0, explanation: 'CSS = Cascading Style Sheets.' }], passingScore: 60, isPublished: true, isDemo: true },
];

export async function seedAllModules() {
  const counts = await Promise.all([Project.countDocuments(), Internship.countDocuments(), Job.countDocuments(), Interview.countDocuments(), LmsCourse.countDocuments(), Quiz.countDocuments()]);
  if (counts[0] === 0) { await Project.insertMany(projects); logger.info(`Seeded ${projects.length} projects`); }
  if (counts[1] === 0) { await Internship.insertMany(internships); logger.info(`Seeded ${internships.length} internships`); }
  if (counts[2] === 0) { await Job.insertMany(jobs); logger.info(`Seeded ${jobs.length} jobs`); }
  if (counts[3] === 0) { await Interview.insertMany(interviews); logger.info(`Seeded ${interviews.length} interviews`); }
  if (counts[4] === 0) { await LmsCourse.insertMany(lmsCourses); logger.info(`Seeded ${lmsCourses.length} LMS courses`); }
  if (counts[5] === 0) { await Quiz.insertMany(quizzes); logger.info(`Seeded ${quizzes.length} quizzes`); }
}
