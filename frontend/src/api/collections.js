import api from './axios';

export const getCollectionsOverview = () => api.get('/collections/overview');
export const processOverdueCollections = () => api.post('/collections/process-overdue');
export const getCollectionReceipt = (receiptNumber) => api.get(`/collections/receipt/${receiptNumber}`);
export const voidCollectionPayment = (paymentId, data) => api.post(`/collections/payments/${paymentId}/void`, data);
