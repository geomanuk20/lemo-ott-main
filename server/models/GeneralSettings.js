const mongoose = require('mongoose');

const GeneralSettingsSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Viaavi Streaming - Watch TV Shows, Movies Online' },
  siteLogo: { type: String, default: '' },
  siteFavicon: { type: String, default: '' },
  email: { type: String, default: 'info@viavilab.com' },
  description: { type: String, default: 'Viaavi Streaming is Best Script for Streaming Website & Application...' },
  siteKeywords: { type: String, default: 'Video Streaming, Streaming Website...' },
  headerCode: { type: String, default: '' },
  footerCode: { type: String, default: '' },
  copyrightText: { type: String, default: 'Copyright © 2024 www.viaviweb.com All Rights Reserved.' },
  
  defaultTimezone: { type: String, default: '(UTC+05:30) Asia/Kolkata' },
  defaultLanguage: { type: String, default: 'English' },
  siteStyling: { type: String, default: 'Style 6' },
  currencyCode: { type: String, default: 'USD - US Dollar' },
  
  tmdbApiToken: { type: String, default: 'Hidden in Demo' },
  tmdbApiLanguage: { type: String, default: 'English (United States)' },
  
  facebookUrl: { type: String, default: 'https://www.facebook.com/lemoottlive' },
  twitterUrl: { type: String, default: 'https://twitter.com/viaviwebtech/' },
  instagramUrl: { type: String, default: 'https://www.instagram.com/lemoott_live/' },
  
  googlePlayUrl: { type: String, default: 'https://play.google.com/store/apps/dev?id=71574785' },
  appleStoreUrl: { type: String, default: 'https://apps.apple.com/in/developer/vishal-pamar/id1' },
  
  gdprConsent: { type: String, default: 'Active' },
  gdprTitle: { type: String, default: 'This website is using cookies' },
  gdprText: { type: String, default: 'We use them to give you the best experience...' },
  gdprPrivacyUrl: { type: String, default: '#' }
}, { timestamps: true });

module.exports = mongoose.model('GeneralSettings', GeneralSettingsSchema);
