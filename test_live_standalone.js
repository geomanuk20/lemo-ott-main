const { StandardCheckoutClient, Env, StandardCheckoutPayRequest } = require('./server/node_modules/@phonepe-pg/pg-sdk-node');

async function testLive() {
  const merchantId = 'SU2602051238116901898389';
  const clientSecret = '8699b458-e539-4c65-a9e5-98ccf805d0fe';
  const clientVersion = 1;

  console.log('Testing PhonePe live production SDK connection...');
  console.log('Merchant ID (Client ID):', merchantId);
  console.log('Client Secret (Salt Key):', clientSecret);
  
  try {
    const client = StandardCheckoutClient.getInstance(merchantId, clientSecret, clientVersion, Env.PRODUCTION);
    
    const transactionId = 'TXN_TEST_' + Date.now();
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(100) // ₹1.00
      .redirectUrl('https://lemoott.com/api/payment/phonepe/callback')
      .build();

    console.log('Sending pay request to PhonePe Production...');
    const response = await client.pay(request);
    console.log('\n--- SUCCESS! ---');
    console.log('Redirect URL returned by PhonePe:', response.redirectUrl);
  } catch (error) {
    console.error('\n--- ERROR OCCURRED ---');
    if (error.response) {
      console.error('HTTP Status:', error.response.status);
      console.error('Response Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

testLive();
