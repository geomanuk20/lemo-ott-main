const path = require('path');
require('./server/node_modules/dotenv').config({ path: path.join(__dirname, 'server', '.env') });
const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('./server/node_modules/@phonepe-pg/pg-sdk-node');

const getPhonePeCredentials = (gw) => {
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

  if (isSandbox && (!merchantId || merchantId === 'PGTESTPAYUAT' || merchantId === 'PGTESTPAYUAT86')) {
    merchantId = 'PGTESTPAYUAT86';
    saltKey = '96434309-7796-489d-8924-ab56988a6076';
    saltIndex = 1;
  }

  return { merchantId, saltKey, saltIndex, isSandbox };
};

async function testLocalPayment() {
  try {
    const creds = getPhonePeCredentials(null);
    console.log('Using Local Credentials:', creds);

    const env = creds.isSandbox ? Env.SANDBOX : Env.PRODUCTION;
    const client = StandardCheckoutClient.getInstance(creds.merchantId, creds.saltKey, creds.saltIndex, env);

    const transactionId = 'TXN_TEST_' + Date.now();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(100) // ₹1.00
      .redirectUrl('https://lemoott.com/api/payment/phonepe/callback')
      .build();

    console.log('\nSending payment request to PhonePe...');
    const response = await client.pay(request);
    console.log('\nSuccess! Redirect URL:', response.redirectUrl);

  } catch (error) {
    console.error('\nPayment failed:', error.response?.data || error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testLocalPayment();
