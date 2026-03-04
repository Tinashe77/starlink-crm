import api from './axios';

export const getPaymentPlans = (params) => api.get('/payment-plans', { params });
export const generatePaymentPlan = (data) => api.post('/payment-plans/generate', data);
export const updatePaymentPlanItem = (id, data) => api.put(`/payment-plans/${id}`, data);
