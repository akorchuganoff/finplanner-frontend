import api from './api';

export const getAggregated = async (months = 1, startDate = null, endDate = null) => {
  const params = {};
  if (startDate && endDate) {
    params.start_date = startDate;
    params.end_date = endDate;
  } else {
    params.months = months;
  }
  const response = await api.get('/api/transactions/aggregated', { params });
  return response.data;
};

export const getCashFlow = async (params = {}) => {
    const response = await api.get('/api/transactions/cash-flow', { params });
    return response.data;
};

export const getBalanceTimeline = async (groupBy, startDate = null, endDate = null) => {
    const params = { group_by: groupBy };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const response = await api.get('/api/transactions/balance-timeline', { params });
    return response.data;
};

export const getCashFlowSummary = async (params = {}) => {
    // params: { start_date, end_date, category_ids, group_by }
    const response = await api.get('/api/transactions/cash-flow/summary', { params });
    return response.data;
  };