const path = require('path');
require('./server/node_modules/dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const getPhonePeCredentials = (gw, req) => {
  const useEnvSettings = process.env.PHONEPE_ENV !== undefined;
  const hasDbSettings = !useEnvSettings && !!gw?.settings?.merchantId;
  let isSandbox;
  if (hasDbSettings) {
    const val = gw?.settings?.isSandbox;
    isSandbox = (val !== false && val !== 'false' && val !== 0 && val !== '0' && val !== undefined);
  } else {
    isSandbox = (process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase() !== 'PRODUCTION';
  }

  let merchantId;
  let saltKey;
  let saltIndex;

  if (hasDbSettings) {
    merchantId = gw.settings.merchantId;
    saltKey = gw.settings.publishableKey;
    saltIndex = parseInt(gw.settings.secretKey || '1');
  } else {
    merchantId = process.env.PHONEPE_CLIENT_ID || process.env.PHONEPE_MERCHANT_ID;
    saltKey = process.env.PHONEPE_CLIENT_SECRET || process.env.PHONEPE_SALT_KEY;
    saltIndex = parseInt(process.env.PHONEPE_CLIENT_VERSION || process.env.PHONEPE_SALT_INDEX || '1');
  }

  if (isNaN(saltIndex)) {
    saltIndex = 1;
  }

  if (saltKey && !saltKey.includes('-')) {
    try {
      const decoded = Buffer.from(saltKey, 'base64').toString('utf8');
      if (decoded.includes('-')) {
        saltKey = decoded;
      }
    } catch (e) {
      // ignore
    }
  }

  if (saltKey && saltKey.includes('###')) {
    const parts = saltKey.split('###');
    saltKey = parts[0];
    if (parts[1]) {
      saltIndex = parseInt(parts[1]);
    }
  }

  if (isSandbox && (!merchantId || merchantId === 'PGTESTPAYUAT')) {
    merchantId = 'PGTESTPAYUAT';
    saltKey = '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399';
    saltIndex = 1;
  }

  return { merchantId, saltKey, saltIndex, isSandbox };
};

console.log('Environment Variables loaded from server/.env:');
console.log({
  PHONEPE_CLIENT_ID: process.env.PHONEPE_CLIENT_ID,
  PHONEPE_CLIENT_SECRET_LENGTH: process.env.PHONEPE_CLIENT_SECRET ? process.env.PHONEPE_CLIENT_SECRET.length : 0,
  PHONEPE_ENV: process.env.PHONEPE_ENV
});

const mockGw = null; // simulate no gateway in DB or env override active
const creds = getPhonePeCredentials(mockGw);
console.log('\nResolved Credentials by getPhonePeCredentials:');
console.log(creds);
