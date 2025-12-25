import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

// Add axios interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('Custom Sheets API Request:', config.method?.toUpperCase(), config.url, config.params);
    return config;
  },
  (error) => {
    console.error('Custom Sheets API Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log('Custom Sheets API Response:', response.status, response.config.url, 'Data length:', Array.isArray(response.data) ? response.data.length : 'N/A');
    return response;
  },
  (error) => {
    console.error('Custom Sheets API Response Error:', error.response?.status, error.response?.data || error.message);
    console.error('Error config:', error.config);
    return Promise.reject(error);
  }
);

// Set auth token for API requests
export const setCustomSheetsAuthToken = (token: string | null) => {
  console.log('Setting auth token for customSheetsService:', token ? 'Present' : 'Missing');
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

// Custom Sheets Management APIs
export const createCustomSheet = async (projectId: number, name: string, description: string, columns: any[]) => {
  const response = await axios.post(`${API_URL}/api/custom-sheets`, 
    { projectId, name, description, columns },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const getCustomSheets = async (projectId: number) => {
  const response = await axios.get(`${API_URL}/api/custom-sheets`, {
    params: { projectId },
    headers: getAuthHeader()
  });
  return response.data;
};

export const getCustomSheetById = async (sheetId: number) => {
  const response = await axios.get(`${API_URL}/api/custom-sheets/${sheetId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const updateCustomSheet = async (sheetId: number, name: string, description: string, columns: any[]) => {
  const response = await axios.put(`${API_URL}/api/custom-sheets/${sheetId}`, 
    { name, description, columns },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const deleteCustomSheet = async (sheetId: number) => {
  const response = await axios.delete(`${API_URL}/api/custom-sheets/${sheetId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

export const addColumnToSheet = async (sheetId: number, column: any) => {
  const response = await axios.post(`${API_URL}/api/custom-sheets/${sheetId}/columns`, 
    column,
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const removeColumnFromSheet = async (sheetId: number, columnId: number) => {
  const response = await axios.delete(`${API_URL}/api/custom-sheets/${sheetId}/columns/${columnId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Custom Sheet Entries APIs
export const getCustomSheetDraftEntry = async (sheetId: number, projectId: number) => {
  const response = await axios.get(`${API_URL}/api/custom-sheets/entries/draft`, {
    params: { sheetId, projectId },
    headers: getAuthHeader()
  });
  return response.data;
};

export const saveCustomSheetDraftEntry = async (entryId: number, data: any) => {
  const response = await axios.post(`${API_URL}/api/custom-sheets/entries/save-draft`, 
    { entryId, data },
    { headers: getAuthHeader() }
  );
  return response.data;
};

export const submitCustomSheetEntry = async (entryId: number) => {
  const response = await axios.post(`${API_URL}/api/custom-sheets/entries/submit`, 
    { entryId },
    { headers: getAuthHeader() }
  );
  return response.data;
};