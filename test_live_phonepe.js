const mongoose = require('./server/node_modules/mongoose');
const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('./server/node_modules/@phonepe-pg/pg-sdk-node');

async function testLivePhonePe() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect('mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video');
    console.log('Connected!');

    const PaymentGateway = require('./server/models/PaymentGateway');
    const gw = await PaymentGateway.findOne({ name: 'PhonePe' });

    if (!gw) {
      console.log('Error: PhonePe gateway not found in DB!');
      return;
    }

    const merchantId = gw.settings.merchantId;
    const saltKey = gw.settings.publishableKey;
    const saltIndex = parseInt(gw.settings.secretKey || '1');

    console.log('\nInitializing PhonePe client in Env.PRODUCTION...');
    const client = StandardCheckoutClient.getInstance(merchantId, saltKey, saltIndex, Env.PRODUCTION);

    const transactionId = 'TXN_TEST_' + Date.now();
    console.log('Created transaction ID:', transactionId);

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(100) // ₹1.00 (100 paise)
      .redirectUrl('https://lemoott.com/api/payment/phonepe/callback')
      .build();

    console.log('Sending pay request to PhonePe Production API...');
    const response = await client.pay(request);

    const originalUrl = response.redirectUrl;
    console.log('\nOriginal URL from PhonePe:');
    console.log(originalUrl);

    // Force replace mercury-t2 with web.phonepe.com
    let modifiedUrl = originalUrl;
    if (originalUrl && originalUrl.includes('mercury-t2.phonepe.com')) {
      modifiedUrl = originalUrl.replace('mercury-t2.phonepe.com', 'web.phonepe.com');
    } else if (originalUrl && originalUrl.includes('mercury.phonepe.com')) {
      modifiedUrl = originalUrl.replace('mercury.phonepe.com', 'web.phonepe.com');
    }

    console.log('\nModified Redirect URL (forced to web.phonepe.com):');
    console.log(modifiedUrl);

  } catch (error) {
    console.error('\nError initiating live payment:', error.response?.data || error.message);
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed.');
  }
}

testLivePhonePe();
