const mongoose = require('./server/node_modules/mongoose');

async function createAdmin() {
  const uri = 'mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video';
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const User = require('./server/models/User');
    let user = await User.findOne({ email: 'lemo@admin.com' });

    if (user) {
      console.log('User lemo@admin.com already exists. Updating password and role...');
      user.password = 'admin';
      user.role = 'admin';
      user.status = 'Active';
      await user.save();
      console.log('Successfully updated master admin account!');
    } else {
      console.log('Creating new master admin account lemo@admin.com...');
      user = new User({
        name: 'Lemo OTT Master Admin',
        email: 'lemo@admin.com',
        password: 'admin',
        role: 'admin',
        status: 'Active'
      });
      await user.save();
      console.log('Successfully created master admin account!');
    }

    const verifyUser = await User.findOne({ email: 'lemo@admin.com' });
    console.log('Verified Account state:', {
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
