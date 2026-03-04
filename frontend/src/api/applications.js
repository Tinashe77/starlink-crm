import api from './axios';

export const getApplications = () => api.get('/applications');
export const getApplicationById = (id) => api.get(`/applications/${id}`);
export const createApplication = (data) => api.post('/applications', data);
export const updateApplicationStatus = (id, data) => api.patch(`/applications/${id}/status`, data);
export const deleteApplication = (id) => api.delete(`/applications/${id}`);
