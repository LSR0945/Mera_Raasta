import mongoose from 'mongoose';
import College from '../models/College.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mera_raasta';

// ═══ REAL INDIAN COLLEGES DATA ═══
// Major cities ke colleges with courses and fees
const colleges = [
  // ═══ DELHI ═══
  {
    name: 'Indian Institute of Technology Delhi', slug: 'iit-delhi',
    city: 'Delhi', state: 'Delhi', address: 'Hauz Khas, New Delhi 110016',
    type: 'government', rating: 4.8, established: 1961, website: 'https://home.iitd.ac.in',
    description: 'Premier engineering institute. Best for CSE, Electrical, Mechanical.',
    tags: ['engineering', 'iit', 'technology', 'research'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 85 },
      { name: 'B.Tech Electrical Engineering', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 75 },
      { name: 'B.Tech Mechanical Engineering', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      { name: 'M.Tech Computer Science', duration: '2 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'postgraduate', stream: 'Engineering', eligibility: 'GATE' },
      { name: 'MBA', duration: '2 years', fees: 800000, feesDisplay: '₹8 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT' },
    ],
  },
  {
    name: 'Delhi University', slug: 'delhi-university',
    city: 'Delhi', state: 'Delhi', address: 'North Campus, Delhi 110007',
    type: 'government', rating: 4.3, established: 1922, website: 'https://www.du.ac.in',
    description: 'One of India\'s largest universities. Arts, Science, Commerce streams.',
    tags: ['university', 'arts', 'science', 'commerce', 'undergraduate'],
    courses: [
      { name: 'B.A. (Hons) English', duration: '3 years', fees: 15000, feesDisplay: '₹15,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 500 },
      { name: 'B.Com (Hons)', duration: '3 years', fees: 12000, feesDisplay: '₹12,000/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 600 },
      { name: 'B.Sc Physics', duration: '3 years', fees: 18000, feesDisplay: '₹18,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th PCM', seats: 200 },
      { name: 'B.Sc Computer Science', duration: '3 years', fees: 20000, feesDisplay: '₹20,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th PCM', seats: 150 },
      { name: 'M.A. English', duration: '2 years', fees: 12000, feesDisplay: '₹12,000/year', type: 'postgraduate', stream: 'Arts', eligibility: 'BA degree' },
      { name: 'M.Com', duration: '2 years', fees: 10000, feesDisplay: '₹10,000/year', type: 'postgraduate', stream: 'Commerce', eligibility: 'B.Com degree' },
    ],
  },
  {
    name: 'Jamia Millia Islamia', slug: 'jamia-millia-islamia',
    city: 'Delhi', state: 'Delhi', address: 'Jamia Nagar, New Delhi 110025',
    type: 'government', rating: 4.1, established: 1920, website: 'https://www.jmi.ac.in',
    description: 'Central university. Known for Engineering, Architecture, Mass Comm.',
    tags: ['university', 'engineering', 'mass-comm', 'architecture'],
    courses: [
      { name: 'B.Tech Computer Engineering', duration: '4 years', fees: 60000, feesDisplay: '₹60,000/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 60 },
      { name: 'B.A. Mass Communication', duration: '3 years', fees: 30000, feesDisplay: '₹30,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 40 },
      { name: 'B.Arch', duration: '5 years', fees: 80000, feesDisplay: '₹80,000/year', type: 'undergraduate', stream: 'Architecture', eligibility: 'NATA', seats: 30 },
      { name: 'MCA', duration: '3 years', fees: 50000, feesDisplay: '₹50,000/year', type: 'postgraduate', stream: 'Computer Applications', eligibility: 'BCA/B.Sc CS' },
    ],
  },
  // ═══ MUMBAI ═══
  {
    name: 'Indian Institute of Technology Bombay', slug: 'iit-bombay',
    city: 'Mumbai', state: 'Maharashtra', address: 'Powai, Mumbai 400076',
    type: 'government', rating: 4.9, established: 1958, website: 'https://www.iitb.ac.in',
    description: 'Top IIT. Best for CSE, EE, ME. Great placements.',
    tags: ['engineering', 'iit', 'technology', 'research'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 90 },
      { name: 'B.Tech Electrical Engineering', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      { name: 'B.Tech Mechanical Engineering', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 85 },
      { name: 'M.Tech Data Science', duration: '2 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'postgraduate', stream: 'Engineering', eligibility: 'GATE' },
      { name: 'MBA', duration: '2 years', fees: 1000000, feesDisplay: '₹10 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT' },
    ],
  },
  {
    name: 'University of Mumbai', slug: 'university-of-mumbai',
    city: 'Mumbai', state: 'Maharashtra', address: 'Fort, Mumbai 400001',
    type: 'government', rating: 4.0, established: 1857, website: 'https://mu.ac.in',
    description: 'One of oldest universities. Arts, Science, Commerce.',
    tags: ['university', 'arts', 'science', 'commerce'],
    courses: [
      { name: 'B.Com', duration: '3 years', fees: 8000, feesDisplay: '₹8,000/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 1000 },
      { name: 'B.Sc Information Technology', duration: '3 years', fees: 25000, feesDisplay: '₹25,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 200 },
      { name: 'B.A. Psychology', duration: '3 years', fees: 10000, feesDisplay: '₹10,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 100 },
      { name: 'M.Sc Computer Science', duration: '2 years', fees: 20000, feesDisplay: '₹20,000/year', type: 'postgraduate', stream: 'Science', eligibility: 'B.Sc CS' },
    ],
  },
  {
    name: 'Symbiosis International University', slug: 'symbiosis-mumbai',
    city: 'Mumbai', state: 'Maharashtra', address: 'Viman Nagar, Pune 411014',
    type: 'private', rating: 4.2, established: 2002, website: 'https://www.siu.edu.in',
    description: 'Top private university. MBA, Law, Design, Media.',
    tags: ['private', 'mba', 'law', 'design', 'media'],
    courses: [
      { name: 'MBA', duration: '2 years', fees: 2000000, feesDisplay: '₹20 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT/SNAP', seats: 180 },
      { name: 'BBA', duration: '3 years', fees: 350000, feesDisplay: '₹3.5 Lakh/year', type: 'undergraduate', stream: 'Management', eligibility: '12th pass', seats: 120 },
      { name: 'B.Design Interior Design', duration: '4 years', fees: 300000, feesDisplay: '₹3 Lakh/year', type: 'undergraduate', stream: 'Design', eligibility: 'SEED', seats: 40 },
      { name: 'LLB', duration: '3 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Law', eligibility: 'CLAT', seats: 60 },
    ],
  },
  // ═══ BANGALORE ═══
  {
    name: 'Indian Institute of Science Bangalore', slug: 'iisc-bangalore',
    city: 'Bangalore', state: 'Karnataka', address: 'CV Raman Road, Bangalore 560012',
    type: 'government', rating: 4.8, established: 1909, website: 'https://iisc.ac.in',
    description: 'Top research institute. Best for Science, Engineering research.',
    tags: ['research', 'science', 'engineering', 'phd'],
    courses: [
      { name: 'B.S. Research', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Science', eligibility: 'KVPY/JEE', seats: 120 },
      { name: 'M.Tech Computer Science', duration: '2 years', fees: 100000, feesDisplay: '₹1 Lakh/year', type: 'postgraduate', stream: 'Engineering', eligibility: 'GATE' },
      { name: 'Ph.D. Science', duration: '5 years', fees: 50000, feesDisplay: '₹50,000/year', type: 'phd', stream: 'Science', eligibility: 'NET/GATE' },
    ],
  },
  {
    name: 'Bangalore University', slug: 'bangalore-university',
    city: 'Bangalore', state: 'Karnataka', address: 'Jnanabharathi, Bangalore 560056',
    type: 'government', rating: 3.8, established: 1886, website: 'https://bangaloreuniversity.ac.in',
    description: 'State university. Arts, Science, Commerce, Engineering.',
    tags: ['university', 'arts', 'science', 'commerce'],
    courses: [
      { name: 'B.Com', duration: '3 years', fees: 10000, feesDisplay: '₹10,000/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 500 },
      { name: 'B.Sc Computer Science', duration: '3 years', fees: 30000, feesDisplay: '₹30,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 100 },
      { name: 'B.A. History', duration: '3 years', fees: 8000, feesDisplay: '₹8,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 80 },
    ],
  },
  {
    name: 'Christ University', slug: 'christ-university-bangalore',
    city: 'Bangalore', state: 'Karnataka', address: 'Hosur Road, Bangalore 560029',
    type: 'private', rating: 4.3, established: 1969, website: 'https://christuniversity.in',
    description: 'Top private university. BBA, MBA, Commerce, Psychology.',
    tags: ['private', 'mba', 'bba', 'commerce', 'psychology'],
    courses: [
      { name: 'BBA', duration: '3 years', fees: 250000, feesDisplay: '₹2.5 Lakh/year', type: 'undergraduate', stream: 'Management', eligibility: '12th pass', seats: 200 },
      { name: 'B.Com (Hons)', duration: '3 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 300 },
      { name: 'B.A. Psychology', duration: '3 years', fees: 120000, feesDisplay: '₹1.2 Lakh/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 100 },
      { name: 'MBA', duration: '2 years', fees: 500000, feesDisplay: '₹5 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT/XAT' },
    ],
  },
  // ═══ PUNE ═══
  {
    name: 'Savitribai Phule Pune University', slug: 'pune-university',
    city: 'Pune', state: 'Maharashtra', address: 'Ganeshkhind, Pune 411007',
    type: 'government', rating: 4.1, established: 1949, website: 'https://www.unipune.ac.in',
    description: 'Major state university. Engineering, Science, Arts.',
    tags: ['university', 'engineering', 'science', 'arts'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 80000, feesDisplay: '₹80,000/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 100 },
      { name: 'B.Sc Chemistry', duration: '3 years', fees: 15000, feesDisplay: '₹15,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 100 },
      { name: 'MCA', duration: '3 years', fees: 60000, feesDisplay: '₹60,000/year', type: 'postgraduate', stream: 'Computer Applications', eligibility: 'BCA' },
    ],
  },
  // ═══ CHENNAI ═══
  {
    name: 'Indian Institute of Technology Madras', slug: 'iit-madras',
    city: 'Chennai', state: 'Tamil Nadu', address: 'Adyar, Chennai 600036',
    type: 'government', rating: 4.9, established: 1959, website: 'https://www.iitm.ac.in',
    description: 'Consistently #1 IIT. Best for CSE, EE, Mechanical, Research.',
    tags: ['engineering', 'iit', 'technology', 'research'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 85 },
      { name: 'B.Tech Electrical Engineering', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 75 },
      { name: 'M.Tech Data Science', duration: '2 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'postgraduate', stream: 'Engineering', eligibility: 'GATE' },
      { name: 'MBA', duration: '2 years', fees: 800000, feesDisplay: '₹8 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT' },
    ],
  },
  {
    name: 'University of Madras', slug: 'university-of-madras',
    city: 'Chennai', state: 'Tamil Nadu', address: 'Chepauk, Chennai 600005',
    type: 'government', rating: 3.9, established: 1857, website: 'https://www.unom.ac.in',
    description: 'Oldest university in South India. Arts, Science, Commerce.',
    tags: ['university', 'arts', 'science', 'commerce'],
    courses: [
      { name: 'B.Com', duration: '3 years', fees: 6000, feesDisplay: '₹6,000/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 500 },
      { name: 'B.Sc Mathematics', duration: '3 years', fees: 8000, feesDisplay: '₹8,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 100 },
      { name: 'M.A. Tamil', duration: '2 years', fees: 5000, feesDisplay: '₹5,000/year', type: 'postgraduate', stream: 'Arts', eligibility: 'BA Tamil' },
    ],
  },
  // ═══ HYDERABAD ═══
  {
    name: 'Indian Institute of Technology Hyderabad', slug: 'iit-hyderabad',
    city: 'Hyderabad', state: 'Telangana', address: 'Kandi, Sangareddy 502285',
    type: 'government', rating: 4.6, established: 2008, website: 'https://iith.ac.in',
    description: 'New age IIT. AI, Data Science, Design programs.',
    tags: ['engineering', 'iit', 'ai', 'data-science'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 60 },
      { name: 'B.Tech Artificial Intelligence', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 40 },
      { name: 'M.Tech Data Science', duration: '2 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'postgraduate', stream: 'Engineering', eligibility: 'GATE' },
    ],
  },
  {
    name: 'University of Hyderabad', slug: 'university-of-hyderabad',
    city: 'Hyderabad', state: 'Telangana', address: 'Gachibowli, Hyderabad 500046',
    type: 'government', rating: 4.2, established: 1974, website: 'https://uohyd.ac.in',
    description: 'Central university. Sciences, Humanities, Management.',
    tags: ['university', 'science', 'arts', 'management'],
    courses: [
      { name: 'M.Sc Computer Science', duration: '2 years', fees: 30000, feesDisplay: '₹30,000/year', type: 'postgraduate', stream: 'Science', eligibility: 'B.Sc CS' },
      { name: 'MBA', duration: '2 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT' },
      { name: 'M.A. English', duration: '2 years', fees: 15000, feesDisplay: '₹15,000/year', type: 'postgraduate', stream: 'Arts', eligibility: 'BA English' },
    ],
  },
  // ═══ KOLKATA ═══
  {
    name: 'Indian Institute of Technology Kharagpur', slug: 'iit-kharagpur',
    city: 'Kharagpur', state: 'West Bengal', address: 'Kharagpur, Paschim Medinipur 721302',
    type: 'government', rating: 4.6, established: 1951, website: 'https://iitkgp.ac.in',
    description: 'First IIT. Largest campus. Strong alumni network.',
    tags: ['engineering', 'iit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      { name: 'B.Tech Mechanical Engineering', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 90 },
      { name: 'MBA (VGSOM)', duration: '2 years', fees: 600000, feesDisplay: '₹6 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT' },
    ],
  },
  {
    name: 'Presidency University', slug: 'presidency-university-kolkata',
    city: 'Kolkata', state: 'West Bengal', address: '86/1 College Street, Kolkata 700073',
    type: 'government', rating: 4.0, established: 1817, website: 'https://www.presiuniv.ac.in',
    description: 'Historic university. Arts, Science.',
    tags: ['university', 'arts', 'science'],
    courses: [
      { name: 'B.Sc Physics', duration: '3 years', fees: 8000, feesDisplay: '₹8,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 60 },
      { name: 'B.A. History', duration: '3 years', fees: 6000, feesDisplay: '₹6,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 80 },
    ],
  },
  // ═══ JAIPUR ═══
  {
    name: 'Malaviya National Institute of Technology Jaipur', slug: 'mnit-jaipur',
    city: 'Jaipur', state: 'Rajasthan', address: 'JLN Marg, Jaipur 302017',
    type: 'government', rating: 4.2, established: 1963, website: 'https://www.mnit.ac.in',
    description: 'Premier NIT. Engineering, Architecture, Planning.',
    tags: ['engineering', 'nit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 70 },
      { name: 'B.Tech Civil Engineering', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 65 },
      { name: 'B.Arch', duration: '5 years', fees: 120000, feesDisplay: '₹1.2 Lakh/year', type: 'undergraduate', stream: 'Architecture', eligibility: 'NATA', seats: 30 },
      { name: 'M.Tech Structural Engineering', duration: '2 years', fees: 120000, feesDisplay: '₹1.2 Lakh/year', type: 'postgraduate', stream: 'Engineering', eligibility: 'GATE' },
    ],
  },
  {
    name: 'University of Rajasthan', slug: 'university-of-rajasthan',
    city: 'Jaipur', state: 'Rajasthan', address: 'JLN Marg, Jaipur 302004',
    type: 'government', rating: 3.7, established: 1947, website: 'https://www.uniraj.edu.in',
    description: 'Oldest university in Rajasthan. Arts, Science, Commerce.',
    tags: ['university', 'arts', 'science', 'commerce'],
    courses: [
      { name: 'B.Com', duration: '3 years', fees: 5000, feesDisplay: '₹5,000/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 400 },
      { name: 'B.Sc Mathematics', duration: '3 years', fees: 6000, feesDisplay: '₹6,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 100 },
      { name: 'B.A. Political Science', duration: '3 years', fees: 4000, feesDisplay: '₹4,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 80 },
    ],
  },
  // ═══ LUCKNOW ═══
  {
    name: 'Indian Institute of Technology Kanpur', slug: 'iit-kanpur',
    city: 'Kanpur', state: 'Uttar Pradesh', address: 'Kalyanpur, Kanpur 208016',
    type: 'government', rating: 4.7, established: 1959, website: 'https://www.iitk.ac.in',
    description: 'Top IIT. CS, AI, Mathematics strong. Research focus.',
    tags: ['engineering', 'iit', 'technology', 'research'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      { name: 'B.Tech Electrical Engineering', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 70 },
      { name: 'M.Tech AI', duration: '2 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'postgraduate', stream: 'Engineering', eligibility: 'GATE' },
    ],
  },
  {
    name: 'University of Lucknow', slug: 'university-of-lucknow',
    city: 'Lucknow', state: 'Uttar Pradesh', address: 'Chowk, Lucknow 226007',
    type: 'government', rating: 3.6, established: 1867, website: 'https://www.lkouniv.ac.in',
    description: 'Historic university. Arts, Science, Commerce, Law.',
    tags: ['university', 'arts', 'science', 'commerce', 'law'],
    courses: [
      { name: 'B.Com', duration: '3 years', fees: 5000, feesDisplay: '₹5,000/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 300 },
      { name: 'LLB', duration: '3 years', fees: 8000, feesDisplay: '₹8,000/year', type: 'undergraduate', stream: 'Law', eligibility: '12th pass', seats: 100 },
      { name: 'B.Sc Biology', duration: '3 years', fees: 6000, feesDisplay: '₹6,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 80 },
    ],
  },
  // ═══ AHMEDABAD ═══
  {
    name: 'Indian Institute of Management Ahmedabad', slug: 'iima',
    city: 'Ahmedabad', state: 'Gujarat', address: 'Vastrapur, Ahmedabad 380015',
    type: 'government', rating: 4.9, established: 1961, website: 'https://www.iima.ac.in',
    description: 'India\'s #1 MBA college. Premier management institute.',
    tags: ['mba', 'management', 'business'],
    courses: [
      { name: 'MBA (PGP)', duration: '2 years', fees: 2500000, feesDisplay: '₹25 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT', seats: 400 },
      { name: 'PGPX (Executive MBA)', duration: '1 year', fees: 3000000, feesDisplay: '₹30 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'GMAT/GRE', seats: 140 },
      { name: 'Ph.D Management', duration: '5 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'phd', stream: 'Management', eligibility: 'CAT/GMAT' },
    ],
  },
  {
    name: 'Gujarat University', slug: 'gujarat-university',
    city: 'Ahmedabad', state: 'Gujarat', address: 'Navrangpura, Ahmedabad 380009',
    type: 'government', rating: 3.5, established: 1949, website: 'https://www.gujaratuniversity.ac.in',
    description: 'State university. Commerce, Science, Arts.',
    tags: ['university', 'commerce', 'science', 'arts'],
    courses: [
      { name: 'B.Com', duration: '3 years', fees: 4000, feesDisplay: '₹4,000/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 500 },
      { name: 'B.Sc IT', duration: '3 years', fees: 20000, feesDisplay: '₹20,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 100 },
    ],
  },
  // ═══ PATNA ═══
  {
    name: 'Indian Institute of Technology Patna', slug: 'iit-patna',
    city: 'Patna', state: 'Bihar', address: 'Patna, Bihar 801106',
    type: 'government', rating: 4.1, established: 2008, website: 'https://www.iitp.ac.in',
    description: 'New IIT. Growing fast. CSE, ECE strong.',
    tags: ['engineering', 'iit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 50 },
      { name: 'B.Tech Electronics', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 45 },
    ],
  },
  {
    name: 'Patna University', slug: 'patna-university',
    city: 'Patna', state: 'Bihar', address: 'Ashok Rajpath, Patna 800005',
    type: 'government', rating: 3.3, established: 1917, website: 'https://patnauniversity.ac.in',
    description: 'Oldest university in Bihar. Arts, Science, Commerce.',
    tags: ['university', 'arts', 'science', 'commerce'],
    courses: [
      { name: 'B.Com', duration: '3 years', fees: 3000, feesDisplay: '₹3,000/year', type: 'undergraduate', stream: 'Commerce', eligibility: '12th pass', seats: 200 },
      { name: 'B.Sc Physics', duration: '3 years', fees: 4000, feesDisplay: '₹4,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 60 },
      { name: 'B.A. History', duration: '3 years', fees: 3000, feesDisplay: '₹3,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 80 },
    ],
  },
  // ═══ BHOPAL ═══
  {
    name: 'Indian Institute of Technology Bhopal', slug: 'iit-bhopal',
    city: 'Bhopal', state: 'Madhya Pradesh', address: 'Bhopal, MP 462007',
    type: 'government', rating: 4.2, established: 2016, website: 'https://www.iitbhopal.ac.in',
    description: 'Newest IIT. Growing programs in CS, AI.',
    tags: ['engineering', 'iit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 55 },
      { name: 'B.Tech Data Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 35 },
    ],
  },
  // ═══ CHANDIGARH ═══
  {
    name: 'Panjab University', slug: 'panjab-university',
    city: 'Chandigarh', state: 'Chandigarh', address: 'Sector 14, Chandigarh 160014',
    type: 'government', rating: 4.0, established: 1882, website: 'https://puchd.ac.in',
    description: 'Premier university. Science, Engineering, Law.',
    tags: ['university', 'science', 'engineering', 'law'],
    courses: [
      { name: 'B.Sc Computer Science', duration: '3 years', fees: 20000, feesDisplay: '₹20,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 100 },
      { name: 'LLB', duration: '3 years', fees: 15000, feesDisplay: '₹15,000/year', type: 'undergraduate', stream: 'Law', eligibility: '12th pass', seats: 60 },
      { name: 'M.Sc Physics', duration: '2 years', fees: 15000, feesDisplay: '₹15,000/year', type: 'postgraduate', stream: 'Science', eligibility: 'B.Sc Physics' },
    ],
  },
  // ═══ INDORE ═══
  {
    name: 'Indian Institute of Technology Indore', slug: 'iit-indore',
    city: 'Indore', state: 'Madhya Pradesh', address: 'Simrol, Indore 453552',
    type: 'government', rating: 4.1, established: 2009, website: 'https://www.iiti.ac.in',
    description: 'Growing IIT. CSE, Metallurgy programs.',
    tags: ['engineering', 'iit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 50 },
      { name: 'B.Tech Electrical Engineering', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 40 },
    ],
  },
  // ═══ NAGPUR ═══
  {
    name: 'Visvesvaraya National Institute of Technology Nagpur', slug: 'vnit-nagpur',
    city: 'Nagpur', state: 'Maharashtra', address: 'South Ambazari Road, Nagpur 440010',
    type: 'government', rating: 4.0, established: 1960, website: 'https://www.vnit.ac.in',
    description: 'Top NIT. Engineering, Architecture.',
    tags: ['engineering', 'nit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 60 },
      { name: 'B.Arch', duration: '5 years', fees: 120000, feesDisplay: '₹1.2 Lakh/year', type: 'undergraduate', stream: 'Architecture', eligibility: 'NATA', seats: 25 },
    ],
  },
  // ═══ NASHIK ═══
  {
    name: 'KTHM College of Engineering Nashik', slug: 'kthm-nashik',
    city: 'Nashik', state: 'Maharashtra', address: 'Nashik Road, Nashik 422101',
    type: 'private', rating: 3.5, established: 1983, website: 'https://kthm.ac.in',
    description: 'Regional engineering college. Affordale fees.',
    tags: ['engineering', 'private'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 90000, feesDisplay: '₹90,000/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main/MHT-CET', seats: 60 },
      { name: 'B.Tech Mechanical Engineering', duration: '4 years', fees: 90000, feesDisplay: '₹90,000/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main/MHT-CET', seats: 60 },
    ],
  },
  // ═══ SURAT ═══
  {
    name: 'Sardar Vallabhbhai National Institute of Technology Surat', slug: 'svnit-surat',
    city: 'Surat', state: 'Gujarat', address: 'Athwa, Surat 395007',
    type: 'government', rating: 4.0, established: 1961, website: 'https://www.svnit.ac.in',
    description: 'Top NIT in Gujarat. Civil, Chemical strong.',
    tags: ['engineering', 'nit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Engineering', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 65 },
      { name: 'B.Tech Civil Engineering', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 65 },
    ],
  },
  // ═══ COIMBATORE ═══
  {
    name: 'PSG College of Technology', slug: 'psg-coimbatore',
    city: 'Coimbatore', state: 'Tamil Nadu', address: 'Avinashi Road, Coimbatore 641004',
    type: 'private', rating: 4.2, established: 1951, website: 'https://www.psgtech.edu',
    description: 'Top private engineering college in Tamil Nadu.',
    tags: ['engineering', 'private', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 180000, feesDisplay: '₹1.8 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main/TNEA', seats: 120 },
      { name: 'B.Tech Electronics', duration: '4 years', fees: 180000, feesDisplay: '₹1.8 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main/TNEA', seats: 60 },
    ],
  },
  // ═══ MYSURU ═══
  {
    name: 'University of Mysore', slug: 'university-of-mysore',
    city: 'Mysuru', state: 'Karnataka', address: 'Manasagangothri, Mysuru 570006',
    type: 'government', rating: 3.7, established: 1916, website: 'https://uni-mysore.ac.in',
    description: 'Historic university. Arts, Science.',
    tags: ['university', 'arts', 'science'],
    courses: [
      { name: 'B.Sc Computer Science', duration: '3 years', fees: 12000, feesDisplay: '₹12,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 80 },
      { name: 'B.A. English', duration: '3 years', fees: 8000, feesDisplay: '₹8,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 60 },
    ],
  },
  // ═══ VARANASI ═══
  {
    name: 'Banaras Hindu University', slug: 'bhu-varanasi',
    city: 'Varanasi', state: 'Uttar Pradesh', address: 'Varanasi, UP 221005',
    type: 'government', rating: 4.2, established: 1916, website: 'https://www.bhu.ac.in',
    description: 'Premier central university. IIT BHU is part of it.',
    tags: ['university', 'engineering', 'science', 'arts'],
    courses: [
      { name: 'B.Tech Computer Science (IIT BHU)', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 70 },
      { name: 'B.Sc Chemistry', duration: '3 years', fees: 8000, feesDisplay: '₹8,000/year', type: 'undergraduate', stream: 'Science', eligibility: '12th pass', seats: 60 },
      { name: 'B.A. Sanskrit', duration: '3 years', fees: 3000, feesDisplay: '₹3,000/year', type: 'undergraduate', stream: 'Arts', eligibility: '12th pass', seats: 40 },
    ],
  },
  // ═══ RAIPUR ═══
  {
    name: 'National Institute of Technology Raipur', slug: 'nit-raipur',
    city: 'Raipur', state: 'Chhattisgarh', address: 'G.E. Road, Raipur 492010',
    type: 'government', rating: 3.8, established: 1956, website: 'https://www.nitrr.ac.in',
    description: 'NIT in Chhattisgarh. Affordable government education.',
    tags: ['engineering', 'nit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 130000, feesDisplay: '₹1.3 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 60 },
      { name: 'B.Tech Mining Engineering', duration: '4 years', fees: 130000, feesDisplay: '₹1.3 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 40 },
    ],
  },
  // ═══ RANCHI ═══
  {
    name: 'Birla Institute of Technology Mesra', slug: 'bit-mesra',
    city: 'Ranchi', state: 'Jharkhand', address: 'Mesra, Ranchi 835215',
    type: 'private', rating: 3.8, established: 1955, website: 'https://www.bitmesra.ac.in',
    description: 'Deemed university. Engineering, Pharmacy, Architecture.',
    tags: ['engineering', 'private', 'pharmacy'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 180000, feesDisplay: '₹1.8 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 60 },
      { name: 'B.Pharm', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Pharmacy', eligibility: '12th PCM/PCB', seats: 40 },
    ],
  },
  // ═══ SHIMLA ═══
  {
    name: 'Indian Institute of Technology Mandi', slug: 'iit-mandi',
    city: 'Mandi', state: 'Himachal Pradesh', address: 'Kamand, Mandi 175075',
    type: 'government', rating: 4.0, established: 2009, website: 'https://www.iitmandi.ac.in',
    description: 'Scenic IIT in Himalayas. Small but growing.',
    tags: ['engineering', 'iit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 40 },
      { name: 'B.Tech Electrical Engineering', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 35 },
    ],
  },
  // ═══ DEHRADUN ═══
  {
    name: 'Indian Institute of Technology Roorkee', slug: 'iit-roorkee',
    city: 'Roorkee', state: 'Uttarakhand', address: 'Roorkee, Uttarakhand 247667',
    type: 'government', rating: 4.5, established: 1847, website: 'https://www.iitr.ac.in',
    description: 'Oldest IIT (originally Thomason College). Civil, Architecture strong.',
    tags: ['engineering', 'iit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      { name: 'B.Tech Civil Engineering', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 80 },
      { name: 'B.Arch', duration: '5 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Architecture', eligibility: 'NATA', seats: 35 },
    ],
  },
  // ═══ GUWAHATI ═══
  {
    name: 'Indian Institute of Technology Guwahati', slug: 'iit-guwahati',
    city: 'Guwahati', state: 'Assam', address: 'North Guwahati, Assam 781039',
    type: 'government', rating: 4.5, established: 1994, website: 'https://www.iitg.ac.in',
    description: 'Beautiful campus on Brahmaputra. Growing IIT.',
    tags: ['engineering', 'iit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 60 },
      { name: 'B.Tech Electronics', duration: '4 years', fees: 220000, feesDisplay: '₹2.2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Advanced', seats: 55 },
    ],
  },
  // ═══ PRIVATE COLLEGES — AFFORDABLE ═══
  {
    name: 'Lovely Professional University', slug: 'lpu-jalandhar',
    city: 'Jalandhar', state: 'Punjab', address: 'Phagwara, Jalandhar 144411',
    type: 'private', rating: 3.5, established: 2005, website: 'https://www.lpu.in',
    description: 'Large private university. Many programs. Scholarships available.',
    tags: ['private', 'engineering', 'management', 'arts'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 160000, feesDisplay: '₹1.6 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: '12th pass + LPUNEST', seats: 500 },
      { name: 'BBA', duration: '3 years', fees: 80000, feesDisplay: '₹80,000/year', type: 'undergraduate', stream: 'Management', eligibility: '12th pass', seats: 300 },
      { name: 'BCA', duration: '3 years', fees: 80000, feesDisplay: '₹80,000/year', type: 'undergraduate', stream: 'Computer Applications', eligibility: '12th pass', seats: 200 },
      { name: 'MBA', duration: '2 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: '12th pass + LPUNEST', seats: 200 },
    ],
  },
  {
    name: 'Amity University', slug: 'amity-noida',
    city: 'Noida', state: 'Uttar Pradesh', address: 'Sector 125, Noida 201313',
    type: 'private', rating: 3.6, established: 2005, website: 'https://www.amity.edu',
    description: 'Large private university. Engineering, Management, Law.',
    tags: ['private', 'engineering', 'management', 'law'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 200000, feesDisplay: '₹2 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 300 },
      { name: 'BBA', duration: '3 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Management', eligibility: '12th pass', seats: 200 },
      { name: 'MBA', duration: '2 years', fees: 400000, feesDisplay: '₹4 Lakh/year', type: 'postgraduate', stream: 'Management', eligibility: 'CAT/MAT', seats: 180 },
    ],
  },
  {
    name: 'Sharda University', slug: 'sharda-noida',
    city: 'Noida', state: 'Uttar Pradesh', address: 'Plot 32-34, Knowledge Park, Greater Noida 201306',
    type: 'private', rating: 3.4, established: 2009, website: 'https://www.sharda.ac.in',
    description: 'Multidisciplinary university. Many international tie-ups.',
    tags: ['private', 'engineering', 'management', 'medical'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 150000, feesDisplay: '₹1.5 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 200 },
      { name: 'MBBS', duration: '5.5 years', fees: 1200000, feesDisplay: '₹12 Lakh/year', type: 'undergraduate', stream: 'Medical', eligibility: 'NEET', seats: 150 },
    ],
  },
  // ═══ KERALA ═══
  {
    name: 'National Institute of Technology Calicut', slug: 'nit-calicut',
    city: 'Calicut', state: 'Kerala', address: 'NIT Campus, Calicut 673601',
    type: 'government', rating: 4.1, established: 1961, website: 'https://www.nitc.ac.in',
    description: 'Top NIT in South India. CS, ECE strong.',
    tags: ['engineering', 'nit', 'technology'],
    courses: [
      { name: 'B.Tech Computer Science', duration: '4 years', fees: 140000, feesDisplay: '₹1.4 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 65 },
      { name: 'B.Tech Electronics', duration: '4 years', fees: 140000, feesDisplay: '₹1.4 Lakh/year', type: 'undergraduate', stream: 'Engineering', eligibility: 'JEE Main', seats: 60 },
    ],
  },
];

// ═══ SEED FUNCTION ═══
const seedColleges = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected!\n');

    let created = 0;
    let skipped = 0;

    for (const college of colleges) {
      const exists = await College.findOne({ slug: college.slug });
      if (exists) {
        skipped++;
        continue;
      }
      await College.create(college);
      created++;
      console.log(`  + ${college.name} (${college.city})`);
    }

    console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
    const total = await College.countDocuments();
    console.log(`Total colleges in DB: ${total}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seedColleges();