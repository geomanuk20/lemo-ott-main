const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  plan: { type: String, required: true },
  amount: { type: String, required: true },
  gateway: { type: String, required: true },
  paymentId: { type: String, required: true, unique: true },
  paymentDate: { type: String, required: true },
  status: { type: String, default: 'Completed' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  couponCode: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', TransactionSchema);
