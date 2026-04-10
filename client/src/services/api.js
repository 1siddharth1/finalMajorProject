import axios from 'axios';

// Automatically use the live Render backend, even if Vercel doesn't have .env variables set
const BASE_URL = import.meta.env.VITE_API_URL || 'https://finalmajorproject-1v4q.onrender.com/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ─────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me')
};

// ─── Documents ────────────────────────────────────────────────────────────

export const documentsAPI = {
  list: (page = 1) => api.get(`/documents?page=${page}`),
  getOne: (id) => api.get(`/documents/${id}`),
  update: (id, data) => api.put(`/documents/${id}`, data),
  rename: (id, title) => api.patch(`/documents/${id}/rename`, { title }),
  delete: (id) => api.delete(`/documents/${id}`)
};

// ─── AI ───────────────────────────────────────────────────────────────────

export const aiAPI = {
  // Public: just format, no save
  format: (data) => api.post('/ai/format', data),
  // Protected: format + persist to user storage
  formatAndSave: (data) => api.post('/ai/format-and-save', data),
  status: () => api.get('/ai/status')
};

export default api;
