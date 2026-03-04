import api from './axios';

export const getSupportTickets = () => api.get('/support-tickets');
export const getSupportTicketOptions = () => api.get('/support-tickets/options');
export const createSupportTicket = (data) => api.post('/support-tickets', data);
export const updateSupportTicket = (id, data) => api.put(`/support-tickets/${id}`, data);
