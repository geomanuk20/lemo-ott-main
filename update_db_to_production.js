const mongoose = require('./server/node_modules/mongoose');

async function updateDb() {
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

    console.log('Original DB Settings:', gw.settings);

    // Update settings to production
    gw.settings.isSandbox = false;
    gw.markModified('settings');

    await gw.save();
    console.log('Successfully updated settings to Production Mode (isSandbox = false)!');
    
    const updatedGw = await PaymentGateway.findOne({ name: 'PhonePe' });
    console.log('Updated DB Settings:', updatedGw.settings);

  } catch (error) {
    console.error('Error updating DB:', error);
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed.');
  }
}

updateDb();
