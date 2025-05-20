const express = require('express');
const Trade = require('./tradeModel');
const User = require('./userModel');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');

const router = express.Router();

// Get all trades
router.get('/', catchAsync(async (req, res, next) => {
  const trades = await Trade.find();
  
  res.status(200).json({
    status: 'success',
    results: trades.length,
    data: {
      trades
    }
  });
}));

// Get user trades
router.get('/my-trades', catchAsync(async (req, res, next) => {
  const trades = await Trade.find({ user: req.user.id });
  
  res.status(200).json({
    status: 'success',
    results: trades.length,
    data: {
      trades
    }
  });
}));

// Create trade
router.post('/', catchAsync(async (req, res, next) => {
  const { fromCoin, toCoin, amount, expectedProfit } = req.body;
  
  const user = await User.findById(req.user.id);
  
  if (user.balance < amount) {
    return next(new AppError('Insufficient balance', 400));
  }

  // Process the trade (simplified for example)
  // In a real app, this would connect to exchange APIs
  const trade = await Trade.create({
    user: req.user.id,
    fromCoin,
    toCoin,
    amount,
    expectedProfit,
    status: 'completed'
  });

  // Update user balance
  user.balance -= amount;
  user.balance += amount + (amount * expectedProfit / 100);
  await user.save();

  res.status(201).json({
    status: 'success',
    data: {
      trade
    }
  });
}));

// Get trade by ID
router.get('/:id', catchAsync(async (req, res, next) => {
  const trade = await Trade.findById(req.params.id);
  
  if (!trade) {
    return next(new AppError('No trade found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      trade
    }
  });
}));

module.exports = router;