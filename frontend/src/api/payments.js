import api from './axios';

export const getPayments = (params) => api.get('/payments', { params });
export const createPayment = (data) => api.post('/payments', data);
export const settleContractBalance = (contractId, data) => api.post(`/payments/settle/${contractId}`, data);
export const getPaymentStatement = (contractId) => api.get(`/payments/statement/${contractId}`);
export const sendPaymentReminder = (contractId) => api.post(`/payments/remind/${contractId}`);
