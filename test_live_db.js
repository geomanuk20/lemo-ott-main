const mongoose = require('./server/node_modules/mongoose');
const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('./server/node_modules/@phonepe-pg/pg-sdk-node');

async function testLiveDb() {
  const uri = 'mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video';
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const PaymentGateway = require('./server/models/PaymentGateway');
    const gw = await PaymentGateway.findOne({ name: 'PhonePe' });

    if (!gw) {
      console.log('Error: PhonePe gateway not found in DB!');
      return;
    }

    // Since we are running locally, we simulate the live server by resolving credentials manually
    const merchantId = gw.settings.merchantId;
    const saltKey = gw.settings.publishableKey;
    const saltIndex = parseInt(gw.settings.secretKey || '1');
    const isSandbox = gw.settings.isSandbox; // should be false

    console.log('\nResolved settings from DB:');
    console.log({
      merchantId,
      saltKey: saltKey ? `${saltKey.substring(0, 5)}...${saltKey.substring(saltKey.length - 5)}` : null,
      saltIndex,
      isSandbox
    });

    const env = isSandbox ? Env.SANDBOX : Env.PRODUCTION;
    console.log('\nInitializing PhonePe client in Env.' + (isSandbox ? 'SANDBOX' : 'PRODUCTION') + '...');
    const client = StandardCheckoutClient.getInstance(merchantId, saltKey, saltIndex, env);

    const transactionId = 'TXN_TEST_' + Date.now();
    console.log('Created transaction ID:', transactionId);

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(100) // ₹1.00
      .redirectUrl('https://lemoott.com/api/payment/phonepe/callback')
      .build();

    console.log('Sending pay request to PhonePe...');
    const response = await client.pay(request);

    console.log('\n--- SUCCESS! ---');
    console.log('Redirect URL:', response.redirectUrl);

  } catch (error) {
    console.error('\n--- ERROR OCCURRED ---');
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed.');
  }
}

testLiveDb();
