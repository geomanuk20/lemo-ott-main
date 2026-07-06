const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, 'server/.env') });

const mongoUri = process.env.MONGODB_URI;
console.log('Connecting to:', mongoUri);

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB Connected!');
    
    // Retrieve schemas dynamic
    const HomeSection = mongoose.model('HomeSection', new mongoose.Schema({}, { strict: false }));
    const MenuSettings = mongoose.model('MenuSettings', new mongoose.Schema({}, { strict: false }));
    const Short = mongoose.model('Short', new mongoose.Schema({}, { strict: false }));

    const sections = await HomeSection.find().lean();
    console.log('\n--- HOME SECTIONS ---');
    console.log(JSON.stringify(sections, null, 2));

    const menu = await MenuSettings.findOne().lean();
    console.log('\n--- MENU SETTINGS ---');
    console.log(JSON.stringify(menu, null, 2));

    const shortsCount = await Short.countDocuments();
    console.log('\n--- SHORTS COUNT ---:', shortsCount);
    if (shortsCount > 0) {
      const sampleShorts = await Short.find().limit(3).lean();
      console.log('Sample Shorts:', JSON.stringify(sampleShorts, null, 2));
    }

    await mongoose.connection.close();
    console.log('\nConnection closed.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
