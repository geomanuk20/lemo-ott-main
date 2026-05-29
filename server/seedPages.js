const mongoose = require('mongoose');
require('dotenv').config();
const Page = require('./models/Page');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video_ott')
  .then(async () => {
  console.log('Connected to DB for seeding pages...');

  const helpCenterContent = `
    <h1>Help Center</h1>
    <p>Welcome to the LEMO OTT Help Center. We are here to assist you with any questions or technical issues you may encounter while using our platform.</p>
    
    <h3>Account & Billing</h3>
    <ul>
      <li><strong>How do I cancel my subscription?</strong> You can manage or cancel your subscription by navigating to your Profile Dashboard and selecting 'Subscription Plan'.</li>
      <li><strong>What payment methods are accepted?</strong> We accept major credit cards, PayPal, and regional payment gateways depending on your location.</li>
    </ul>

    <h3>Playback Issues</h3>
    <ul>
      <li><strong>Why is my video buffering?</strong> Ensure you have a stable internet connection. We recommend at least 5 Mbps for HD streaming and 25 Mbps for 4K Ultra HD.</li>
      <li><strong>Can I watch offline?</strong> Offline viewing is currently supported on our official mobile applications.</li>
    </ul>

    <p>If you need further assistance, please visit our <a href="/contact">Contact Us</a> page to reach our support team directly.</p>
  `;

  const devicesContent = `
    <h1>Supported Devices</h1>
    <p>LEMO OTT is designed to provide a high-fidelity cinematic experience across a wide range of devices. Ensure your device is up to date for the best streaming quality.</p>
    
    <h3>Smart TVs</h3>
    <ul>
      <li>Samsung Smart TVs (2018 models and newer)</li>
      <li>LG webOS TVs (2018 models and newer)</li>
      <li>Android TV & Google TV devices</li>
    </ul>

    <h3>Streaming Media Players</h3>
    <ul>
      <li>Apple TV (4th Generation and 4K)</li>
      <li>Roku Streaming Stick and Roku Ultra</li>
      <li>Amazon Fire TV Stick (4K Max recommended)</li>
    </ul>

    <h3>Mobile & Tablets</h3>
    <ul>
      <li>iOS Devices (iPhone and iPad) running iOS 14.0+</li>
      <li>Android Smartphones and Tablets running Android 8.0+</li>
    </ul>

    <h3>Web Browsers</h3>
    <p>We support the latest versions of Google Chrome, Mozilla Firefox, Safari, and Microsoft Edge on Windows and macOS.</p>
  `;

  await Page.findOneAndUpdate(
    { slug: 'help-center' },
    { title: 'Help Center', slug: 'help-center', content: helpCenterContent, status: 'Active' },
    { upsert: true, returnDocument: 'after' }
  );

  await Page.findOneAndUpdate(
    { slug: 'supported-devices' },
    { title: 'Supported Devices', slug: 'supported-devices', content: devicesContent, status: 'Active' },
    { upsert: true, returnDocument: 'after' }
  );

  console.log('Successfully seeded Help Center and Supported Devices pages.');
  process.exit(0);
}).catch(err => {
  console.error('Error seeding pages:', err);
  process.exit(1);
});
