const mongoose = require('mongoose');
const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config({ path: './server/.env' });

const debugPhonePe = async () => {
  try {
    await mongoose.connect('mongodb+srv://geomanuk20_db_user:6w2GRqYm7DMfOXiB@video.lukedio.mongodb.net/video');
    const PaymentGateway = require('./server/models/PaymentGateway');
    const gw = await PaymentGateway.findOne({ name: 'PhonePe' });
    if (!gw) {
      console.log('PhonePe gateway not found in DB');
      return;
    }
    
    console.log('Credentials from DB:', {
      merchantId: gw.merchantId,
      saltKey: gw.saltKey,
      secretKey: gw.secretKey,
      saltIndex: gw.saltIndex,
      sandbox: gw.sandbox
    });

    const merchantId = gw.merchantId;
    const saltKey = gw.saltKey || gw.secretKey;
    const saltIndex = gw.saltIndex || '1';
    const isSandbox = gw.sandbox;

    // A common UAT test credential if none is provided:
    // merchantId: 'PGTESTPAYUAT'
    // saltKey: '099eb0cd-02cf-4e2a-8aca-3e6c6aff0399'
    // saltIndex: '1'

    const hostUrl = isSandbox ? 'https://api-preprod.phonepe.com/apis/pg-sandbox' : 'https://api.phonepe.com/apis/pg';
    const transactionId = 'TXN_' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();

    const payload = {
      merchantId: merchantId,
      merchantTransactionId: transactionId,
      merchantUserId: 'debug_user_123',
      amount: 49900, // 499 INR in paise
      redirectUrl: `http://localhost:5001/api/payment/phonepe/callback`,
      redirectMode: "POST",
      callbackUrl: `http://localhost:5001/api/payment/phonepe/callback`,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
    const stringToHash = base64Payload + '/pg/v1/pay' + saltKey;
    const sha256Val = crypto.createHash('sha256').update(stringToHash).digest('hex');
    const checksum = sha256Val + '###' + saltIndex;

    console.log('Making request to:', hostUrl + '/pg/v1/pay');
    
    const response = await axios.post(`${hostUrl}/pg/v1/pay`, { request: base64Payload }, {
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId
      }
    });

    console.log('Success!', response.data);
  } catch (err) {
    console.error('PhonePe init error:', err.response?.data || err.message);
  } finally {
    mongoose.connection.close();
  }
};

debugPhonePe();
