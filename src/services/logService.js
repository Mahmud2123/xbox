const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const submitWithQStash = async (data) => {
  const payload = {
    ...data,
    timestamp: data.timestamp || new Date().toISOString()
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Submit service failure:', error.message);
    return { success: false, error: error.message };
  }
};