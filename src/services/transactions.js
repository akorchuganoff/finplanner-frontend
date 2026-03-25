import api from './api';

export const getTransactions = async (params = {}) => {
  const response = await api.get('/api/transactions', { params });
  return response.data;
};

export const createTransaction = async (data) => {
  const response = await api.post('/api/transactions', data);
  return response.data;
};

export const updateTransaction = async (id, data) => {
  const response = await api.put(`/api/transactions/${id}`, data);
  return response.data;
};

export const deleteTransaction = async (id) => {
  await api.delete(`/api/transactions/${id}`);
};