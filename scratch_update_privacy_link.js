const mongoose = require('./server/node_modules/mongoose');
const MONGODB_URI = 'mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video';

const PageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

const Page = mongoose.models.Page || mongoose.model('Page', PageSchema);

async function updatePrivacyPolicyLink() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected!');

    const page = await Page.findOne({ slug: 'privacy-policy' });
    if (!page) {
      console.log('Error: Privacy Policy page not found in DB!');
      return;
    }

    console.log('Original content length:', page.content?.length);

    // Replace plain text URL with clickable HTML link
    // We check if it is not already wrapped in an anchor tag
    const plainTextUrl = 'https://lemoott.com/';
    const replacement = '<a href="https://lemoott.com/">https://lemoott.com/</a>';
    
    if (page.content && page.content.includes(plainTextUrl) && !page.content.includes(replacement)) {
      page.content = page.content.replace(new RegExp(plainTextUrl, 'g'), replacement);
      page.markModified('content');
      await page.save();
      console.log('Successfully updated the Privacy Policy URL to a clickable link!');
    } else if (page.content && page.content.includes(replacement)) {
      console.log('The link is already correctly wrapped in an anchor tag.');
    } else {
      console.log('Could not find the plain text URL https://lemoott.com/ in the page content.');
    }

    console.log('\nUpdated content snippet:');
    console.log(page.content);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

updatePrivacyPolicyLink();
