import api from './api';

export const getAuthorityComplaints = async (authorityCompanyId, params = {}) => {
  const response = await api.get(`/complaints/authority/${authorityCompanyId}`, { params });
  return response.data;
};
