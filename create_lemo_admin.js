const mongoose = require('./server/node_modules/mongoose');

async function createAdmin() {
  const uri = 'mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video';
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const User = require('./server/models/User');
    let user = await User.findOne({ email: 'admin@lemoott.com' });

    if (user) {
      console.log('User admin@lemoott.com already exists. Updating password, name and role...');
      user.name = 'Master Admin';
      user.password = 'admin';
      user.role = 'admin';
      user.status = 'Active';
      await user.save();
      console.log('Successfully updated master admin account!');
    } else {
      console.log('Creating new master admin account admin@lemoott.com...');
      user = new User({
        name: 'Master Admin',
        email: 'admin@lemoott.com',
        password: 'admin',
        role: 'admin',
        status: 'Active'
      });
      await user.save();
      console.log('Successfully created master admin account!');
    }

    const verifyUser = await User.findOne({ email: 'admin@lemoott.com' });
    console.log('Verified Account state:', {
      name: verifyUser.name,
      email: verifyUser.email,
      role: verifyUser.role,
      status: verifyUser.status
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('DB connection closed.');
  }
}

createAdmin();
