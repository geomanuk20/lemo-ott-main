const getPhonePeClient = (merchantId, saltKey, saltIndex, env) => {
  // Clear require cache for the PhonePe SDK
  Object.keys(require.cache).forEach((key) => {
    if (key.includes('@phonepe-pg/pg-sdk-node')) {
      delete require.cache[key];
    }
  });

  const { StandardCheckoutClient } = require('./server/node_modules/@phonepe-pg/pg-sdk-node');
  return StandardCheckoutClient.getInstance(merchantId, saltKey, saltIndex, env);
};

try {
  const { Env } = require('./server/node_modules/@phonepe-pg/pg-sdk-node');

  console.log('Initializing first client with Sandbox settings...');
  const client1 = getPhonePeClient('PGTESTPAYUAT', '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399', 1, Env.SANDBOX);
  console.log('First client initialized successfully!');

  console.log('\nInitializing second client with Production settings...');
  // This would normally throw an exception if require cache clearing fails
  const client2 = getPhonePeClient('SU2602051238116901898389', '8699b458-e539-4c65-a9e5-98ccf805d0fe', 1, Env.PRODUCTION);
  console.log('Second client initialized successfully!');

  console.log('\nBoth clients initialized successfully on the same running process! Cache clearing works!');

} catch (error) {
  console.error('\nInitialization failed:', error.message);
}
