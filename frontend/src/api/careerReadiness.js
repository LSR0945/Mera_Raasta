import api from './axios';

export const projectAPI = { getAll: (params) => api.get('/projects', { params }) };
export const internshipAPI = { getAll: (params) => api.get('/internships', { params }) };
export const jobAPI = { getAll: (params) => api.get('/jobs', { params }) };
export const interviewAPI = { getAll: (params) => api.get('/interviews', { params }) };
export const quizAPI = { getAll: (params) => api.get('/quizzes', { params }), getMyAttempts: () => api.get('/quizzes/my-attempts') };
export const lmsAPI = { getAllCourses: () => api.get('/lms/courses'), getCourseBySlug: (slug) => api.get(`/lms/courses/${slug}`) };
