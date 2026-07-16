const axios = require('axios');

// Configure Axios instance
const getClient = () => {
  const apiKey = process.env.FRESHSALES_API || process.env.FRESHSALES_API_KEY;
  const baseUrl = process.env.FRESHSALES_URL || process.env.FRESHSALES_DOMAIN;

  if (!baseUrl || !apiKey) {
    throw new Error('FRESHSALES_URL or FRESHSALES_API is missing in environment variables.');
  }

  // Ensure baseUrl doesn't have trailing slashes
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // The API endpoint usually appends /api to the base CRM URL
  const apiBaseUrl = cleanBaseUrl.includes('/api') ? cleanBaseUrl : `${cleanBaseUrl}/api`;

  return axios.create({
    baseURL: apiBaseUrl,
    headers: {
      'Authorization': `Token token=${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Fetch Deal details from Freshsales
 * @param {string} dealId
 */
const getDeal = async (dealId) => {
  const client = getClient();
  try {
    const response = await client.get(`/deals/${dealId}`);
    console.log(`[Freshsales API] GET /deals/${dealId} - Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`[Freshsales API] Error GET /deals/${dealId}: ${error.message}`);
    if (error.response) {
      console.error(`[Freshsales API] Response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

/**
 * Get Tradeshow Custom Module by ID
 * The lookup field on the deal returns the ID of the tradeshow child record.
 * @param {string} tradeshowId
 */
const getTradeshowById = async (tradeshowId) => {
  const client = getClient();
  
  // The Tradeshow child module internal name
  const customModuleInternalName = 'cm_tradeshow_edition'; 
  
  try {
    const endpoint = `/custom_module/${customModuleInternalName}/${tradeshowId}`;
    
    const response = await client.get(endpoint);
    console.log(`[Freshsales API] GET ${endpoint} - Status: ${response.status}`);
    
    // In Freshsales, custom module responses usually return the record under the module's name key.
    const tradeshow = response.data[customModuleInternalName];
    
    return tradeshow;
  } catch (error) {
    console.error(`[Freshsales API] Error fetching Tradeshow: ${error.message}`);
    if (error.response) {
      console.error(`[Freshsales API] Response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

/**
 * Update Deal with new data
 * @param {string} dealId 
 * @param {object} data 
 */
const updateDeal = async (dealId, data) => {
  const client = getClient();
  try {
    const response = await client.put(`/deals/${dealId}`, { deal: data });
    console.log(`[Freshsales API] PUT /deals/${dealId} - Status: ${response.status}`);
    return response.data;
  } catch (error) {
    console.error(`[Freshsales API] Error PUT /deals/${dealId}: ${error.message}`);
    if (error.response) {
      console.error(`[Freshsales API] Response: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
};

module.exports = {
  getDeal,
  getTradeshowById,
  updateDeal
};
