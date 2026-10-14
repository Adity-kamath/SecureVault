import api from './api';

export const healthService = {
  async getMyHealth() {
    const response = await api.get('/health/me');
    return response.data;
  }
};
