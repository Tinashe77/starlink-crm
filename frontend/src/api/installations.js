import api from './axios';

export const getInstallations = () => api.get('/installations');
export const getInstallationById = (id) => api.get(`/installations/${id}`);
export const getInstallationOptions = () => api.get('/installations/options');
export const createInstallation = (data) => api.post('/installations', data);
export const updateInstallation = (id, data) => api.put(`/installations/${id}`, data);
