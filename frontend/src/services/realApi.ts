// REAL API ONLY - NO MOCK
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export async function getRealNews(companyName: string) {
  console.log('🚀 REAL API CALL TO:', `${API_URL}/news/${companyName}`);
  
  try {
    const response = await axios.get(`${API_URL}/news/${companyName}`);
    console.log('✅ REAL API SUCCESS:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ REAL API ERROR:', error);
    throw error;
  }
}
