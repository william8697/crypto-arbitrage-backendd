const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Trade must belong to a user']
  },
  fromCoin: {
    type: String,
    required: [true, 'Please specify the coin to trade from']
  },
  toCoin: {
    type: String,
    required: [true, 'Please specify the coin to trade to']
  },
  amount: {
    type: Number,
    required: [true, 'Please specify the trade amount']
  },
  expectedProfit: {
    type: Number,
    required: [true, 'Please specify the expected profit']
  },
  actualProfit: Number,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  exchangeRate: Number,
  fee: Number,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

tradeSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email'
  });
  next();
});

const Trade = mongoose.model('Trade', tradeSchema);

module.exports = Trade;