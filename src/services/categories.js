import api from './api';

export const getCategories = async (categoryType = null) => {
  const params = categoryType ? { category_type: categoryType } : {};
  const response = await api.get('/api/categories', { params });
  return response.data;
};

export const createCategory = async (name, categoryType) => {
  const response = await api.post('/api/categories', { name, category_type: categoryType });
  return response.data;
};

export const updateCategory = async (id, name) => {
  const response = await api.put(`/api/categories/${id}`, { name });
  return response.data;
};

export const deleteCategory = async (id) => {
  await api.delete(`/api/categories/${id}`);
};