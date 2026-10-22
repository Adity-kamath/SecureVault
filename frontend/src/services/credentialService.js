import api from './api';

export const credentialService = {
  async getCredentials() {
    const response = await api.get('/credentials');
    return response.data;
  },

  async getCredentialById(id) {
    const response = await api.get(`/credentials/${id}`);
    return response.data;
  },

  async createCredential(payload) {
    const response = await api.post('/credentials', payload);
    return response.data;
  },

  async updateCredential(id, payload) {
    const response = await api.put(`/credentials/${id}`, payload);
    return response.data;
  },

  async deleteCredential(id) {
    const response = await api.delete(`/credentials/${id}`);
    return response.data;
  },

  async revealPassword(id) {
    const response = await api.get(`/credentials/${id}/reveal`);
    return response.data;
  },

  async generatePassword(options) {
    const response = await api.post('/credentials/generate', options);
    return response.data;
  },

  async shareCredential(id, shareData) {
    const response = await api.post(`/credentials/${id}/share`, shareData);
    return response.data;
  },

  async revokeShare(id, userId) {
    const response = await api.delete(`/credentials/${id}/share/${userId}`);
    return response.data;
  },

  async getActiveColleagues() {
    const response = await api.get('/credentials/colleagues/active');
    return response.data;
  }
};
