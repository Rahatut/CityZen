import axios from 'axios';

export const getAuthorityComplaints = async (authorityCompanyId, params = {}) => {
  const response = await axios.get(`/api/complaints/authority/${authorityCompanyId}`, { params });
  return response.data;
};
