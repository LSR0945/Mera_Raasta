import api from './axios';

export const educationAPI = {
  getCourses: (params) => api.get('/courses', { params }),
  getCourseBySlug: (slug) => api.get(`/courses/${slug}`),
  getColleges: (params) => api.get('/colleges', { params }),
  getCollegeBySlug: (slug) => api.get(`/colleges/${slug}`),
  getScholarships: (params) => api.get('/scholarships', { params }),
  getScholarshipBySlug: (slug) => api.get(`/scholarships/${slug}`),
  getGovernment: (params) => api.get('/government', { params }),
  getGovernmentBySlug: (slug) => api.get(`/government/${slug}`),
};
