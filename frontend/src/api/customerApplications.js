import api from './axios';

export const getCustomerApplications = () => api.get('/customer-applications');
export const getCustomerApplicationById = (id) => api.get(`/customer-applications/${id}`);
export const createCustomerApplication = (data) => api.post('/customer-applications', data);
export const updateCustomerApplication = (id, data) => api.put(`/customer-applications/${id}`, data);
