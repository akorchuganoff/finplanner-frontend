import api from './api';

export const getCategories = async (type = null) => {
  const params = type ? { type } : {};
  const response = await api.get('/api/categories', { params });
  return response.data;
};

export const createCategory = async (name, type) => {
  const response = await api.post('/api/categories', { name, type });
  return response.data;
};

export const updateCategory = async (id, name) => {
  const response = await api.put(`/api/categories/${id}`, { name });
  return response.data;
};

export const deleteCategory = async (id) => {
  await api.delete(`/api/categories/${id}`);
};