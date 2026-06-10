const mongoose = require('./server/node_modules/mongoose');

async function checkAdmins() {
  const uri = 'mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video';
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const User = require('./server/models/User');
    const admins = await User.find({ role: { $in: ['admin', 'sub-admin'] } });

    console.log('\n--- Active Admin Accounts in DB ---');
    admins.forEach(u => {
      console.log({
        email: u.email,
        role: u.role,
        status: u.status,
        name: u.name,
        hasPassword: !!u.password
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed.');
  }
}

checkAdmins();
