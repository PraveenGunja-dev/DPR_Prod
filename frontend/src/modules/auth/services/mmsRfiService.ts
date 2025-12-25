import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// Add axios interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('MMS & RFI API Request:', config.method?.toUpperCase(), config.url, config.params);
    return config;
  },
  (error) => {
    console.error('MMS & RFI API Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('MMS & RFI API Response:', response.status, response.config.url, 'Data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
    return response;
  },
  (error) => {
    console.error('MMS & RFI API Response Error:', error.response?.status, error.response?.data || error.message);
    console.error('Error config:', error.config);
    return Promise.reject(error);
  }
);

// Set auth token for API requests
export const setMmsRfiAuthToken = (token: string | null) => {
  console.log('Setting auth token for mmsRfiService:', token ? 'Present' : 'Missing');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};

// Helper to get auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('Token in localStorage:', token ? 'Present' : 'Missing');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Dynamic Columns Management APIs
export const addMmsRfiDynamicColumn = async (projectId: number, columnName: string, displayName: string, dataType: string, isRequired: boolean, defaultValue: string) => {
  const response = await axios.post(`${API_URL}/api/mms-rfi/dynamic-columns`, 
    { projectId, columnName, displayName, dataType, isRequired, defaultValue },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getMmsRfiDynamicColumns = async (projectId: number) => {
  const response = await axios.get(`${API_URL}/api/mms-rfi/dynamic-columns`, {
    params: { projectId },
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateMmsRfiDynamicColumn = async (columnId: number, displayName: string, dataType: string, isRequired: boolean, defaultValue: string) => {
  const response = await axios.put(`${API_URL}/api/mms-rfi/dynamic-columns/${columnId}`, 
    { displayName, dataType, isRequired, defaultValue },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const deleteMmsRfiDynamicColumn = async (columnId: number) => {
  const response = await axios.delete(`${API_URL}/api/mms-rfi/dynamic-columns/${columnId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// MMS & RFI Entries APIs
export const getMmsRfiDraftEntry = async (projectId: number) => {
  const response = await axios.get(`${API_URL}/api/mms-rfi/entries/draft`, {
    params: { projectId },
    headers: getAuthHeader()
  });
  return response.data;
};

export const saveMmsRfiDraftEntry = async (entryId: number, data: any) => {
  const response = await axios.post(`${API_URL}/api/mms-rfi/entries/save-draft`, 
    { entryId, data },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const submitMmsRfiEntry = async (entryId: number) => {
  const response = await axios.post(`${API_URL}/api/mms-rfi/entries/submit`, 
    { entryId },
    { headers: getAuthHeader() }
  );
  return response.data;
};