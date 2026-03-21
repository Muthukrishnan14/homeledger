import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`)
};

export const subCategoriesAPI = {
  getAll: (categoryId) => api.get('/subcategories', { params: { categoryId } }),
  create: (data) => api.post('/subcategories', data),
  update: (id, data) => api.put(`/subcategories/${id}`, data),
  delete: (id) => api.delete(`/subcategories/${id}`)
};

export const transactionsAPI = {
  getByMonth: (month) => api.get('/transactions', { params: { month } }),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`)
};

export const activityLogsAPI = {
  getByMonth: (month) => api.get('/activity-logs', { params: { month } }),
  getRecent: (subCategoryId, hours = 4) =>
    api.get('/activity-logs/recent', { params: { subCategoryId, hours } }),
};