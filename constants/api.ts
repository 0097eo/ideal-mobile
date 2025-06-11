
const getApiUrl = () => {
  if (__DEV__) {
    const HOST_IP = '192.168.0.102';
    const PORT = '8000';
    
    return `http://${HOST_IP}:${PORT}/`;
  } else {
    // Production URL
    return 'https://production-domain.com/';
  }
};

export const API_URL = getApiUrl();