const axios = require('axios');
(async () => {
  try {
    await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {}, {headers:{'X-VERIFY':'123', 'X-MERCHANT-ID':'123'}});
  } catch (e) { console.log('Sandbox 1:', e.response?.status); }
  
  try {
    await axios.post('https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay', {}, {headers:{'X-VERIFY':'123', 'X-MERCHANT-ID':'123'}});
  } catch (e) { console.log('Sandbox 2:', e.response?.status); }
  
  try {
    await axios.post('https://api.phonepe.com/apis/pg/v1/pay', {}, {headers:{'X-VERIFY':'123', 'X-MERCHANT-ID':'123'}});
  } catch (e) { console.log('Prod 1:', e.response?.status); }
})();
