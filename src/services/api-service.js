import axios from 'axios';

// Create an Axios instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api', // Use Vite env or default
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/sessions if used
});

// Interceptor to automatically attach Auth Token if you are using JWT
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token'); // Or wherever you store your token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =========================
// SOP ENDPOINTS
// =========================
export const SOP_API = {
  getSummary: () => apiClient.get('/sops/summary'),
  getAllMetadata: () => apiClient.get('/sops/metadata'),
  getMetadataById: (id) => apiClient.get(`/sops/${id}/metadata`),
  getDataById: (id) => apiClient.get(`/sops/${id}/data`),
  getPdfBase64ById: (id) => apiClient.get(`/sops/${id}/pdf-base64`),
  
  getAllSOPs: () => apiClient.get('/sops'),
  getSOPById: (id) => apiClient.get(`/sops/${id}`),
  createSOP: (data) => apiClient.post('/sops', data),
  updateSOP: (id, data) => apiClient.put(`/sops/${id}`, data),
  deleteSOP: (id) => apiClient.delete(`/sops/${id}`),
  
  // Note: For file downloads, you usually need responseType: 'blob'
  downloadPdf: (id) => apiClient.get(`/sops/${id}/pdf`, { responseType: 'blob' }),
};

// =========================
// SYSTEM ENDPOINTS
// =========================
export const SYSTEM_API = {
  getHealth: () => apiClient.get('http://localhost:3000/health'), // Root level health endpoint
};

// Add USER, AUTH, and AUDIT APIs here as you build out those routes