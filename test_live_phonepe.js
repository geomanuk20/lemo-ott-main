const mongoose = require('./server/node_modules/mongoose');
const { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo, PrefillUserLoginDetails } = require('./server/node_modules/@phonepe-pg/pg-sdk-node');
require('dotenv').config({ path: './server/.env' });

async function testLivePhonePe() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect('mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video');
    console.log('Connected!');

    const PaymentGateway = require('./server/models/PaymentGateway');
    const gw = await PaymentGateway.findOne({ name: 'PhonePe' });

    // Load from .env or fallback to DB
    const envMerchantId = process.env.PHONEPE_CLIENT_ID || process.env.PHONEPE_MERCHANT_ID;
    const envSaltKey = process.env.PHONEPE_CLIENT_SECRET || process.env.PHONEPE_SALT_KEY;
    const envSaltIndex = parseInt(process.env.PHONEPE_CLIENT_VERSION || process.env.PHONEPE_SALT_INDEX || '1');

    const useEnv = !!envMerchantId && !!envSaltKey;
    const merchantId = useEnv ? envMerchantId : gw?.settings?.merchantId;
    let saltKey = useEnv ? envSaltKey : gw?.settings?.publishableKey;
    let saltIndex = useEnv ? envSaltIndex : parseInt(gw?.settings?.secretKey || '1');

    if (isNaN(saltIndex)) saltIndex = 1;

    if (saltKey && saltKey.includes('###')) {
      const parts = saltKey.split('###');
      saltKey = parts[0];
      if (parts[1]) saltIndex = parseInt(parts[1]);
    }

    if (!merchantId || !saltKey) {
      console.log('Error: PhonePe credentials not configured!');
      return;
    }

    const isSandbox = (process.env.PHONEPE_ENV || 'SANDBOX').toUpperCase() !== 'PRODUCTION';
    const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;

    console.log(`\nInitializing PhonePe client in Env.${isSandbox ? 'SANDBOX' : 'PRODUCTION'}...`);
    console.log(`Using Merchant ID: ${merchantId}`);
    const client = StandardCheckoutClient.getInstance(merchantId, saltKey, saltIndex, env);

    const transactionId = 'TXN_TEST_' + Date.now();
    console.log('Created transaction ID:', transactionId);

    // Build the request with all parameters like the live site does
    let requestBuilder = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(100) // ₹1.00 (100 paise)
      .redirectUrl('https://lemoott.com/api/payment/phonepe/callback');

    // Add mock prefill user details
    try {
      const prefill = PrefillUserLoginDetails.builder()
        .phoneNumber('9999999999')
        .build();
      requestBuilder = requestBuilder.prefillUserLoginDetails(prefill);
      console.log('Added prefill user details.');
    } catch (e) {
      console.error('Prefill builder error:', e);
    }

    // Add mock meta info
    try {
      const meta = MetaInfo.builder()
        .udf1("subscription")
        .udf2("Test Plan")
        .udf3("test_user_123")
        .build();
      requestBuilder = requestBuilder.metaInfo(meta);
      console.log('Added meta info.');
    } catch (e) {
      console.error('MetaInfo builder error:', e);
    }

    requestBuilder = requestBuilder
      .message('Lemo OTT Subscription Test')
      .expireAfter(3600);

    const request = requestBuilder.build();

    console.log('Sending pay request to PhonePe Production API with all parameters...');
    const response = await client.pay(request);

    console.log('\nSuccess! PhonePe returned the redirect URL:');
    console.log(response.redirectUrl);

  } catch (error) {
    console.error('\nError initiating live payment:', error.response?.data || error.message);
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed.');
  }
}

testLivePhonePe();
