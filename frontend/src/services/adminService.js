import api from './api';

export const adminService = {
  async getDashboard() {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  async getOrgHealth() {
    const response = await api.get('/admin/health');
    return response.data;
  },

  async getUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  async updateUserStatus(id, isActive) {
    const response = await api.patch(`/admin/users/${id}/status`, { isActive });
    return response.data;
  },

  async updateUserRole(id, role) {
    const response = await api.patch(`/admin/users/${id}/role`, { role });
    return response.data;
  },

  async getAuditLogs(params = {}) {
    const response = await api.get('/admin/audit', { params });
    return response.data;
  },

  async downloadAuditCSV(params = {}) {
    const response = await api.get('/admin/audit', {
      params: { ...params, export: 'csv' },
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'securevault-audit-log.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
