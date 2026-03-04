import api from './axios';

export const getContracts = () => api.get('/contracts');
export const getContractById = (id) => api.get(`/contracts/${id}`);
export const createContract = (data) => api.post('/contracts', data);
export const updateContract = (id, data) => api.put(`/contracts/${id}`, data);
export const signContract = (id, data) => api.patch(`/contracts/${id}/sign`, data);
