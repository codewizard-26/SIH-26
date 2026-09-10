import api from '../../services/api';

export const fetchSystemHealth = async () => {
  const startTime = Date.now();
  const response = await api.get('/health');
  const latency = Date.now() - startTime;
  return {
    ...response.data.data,
    latency,
  };
};
