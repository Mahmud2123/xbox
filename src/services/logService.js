// src/services/logService.js
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    return '';
  }
  return import.meta.env.VITE_API_URL || '';
};

const API_BASE_URL = getApiBaseUrl();

export const logBalanceCheck = async (data) => {
  const payload = {
    ...data,
    timestamp: data.timestamp || new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/log-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Log service error:', error);
    if (import.meta.env.DEV) {
      return { success: true, message: 'Mock log (development)' };
    }
    return { success: false, error: error.message };
  }
};