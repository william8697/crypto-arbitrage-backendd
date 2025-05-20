const express = require('express');
const User = require('./userModel');
const Trade = require('./tradeModel');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');

const router = express.Router();

// Protect admin routes
router.use(catchAsync(async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
}));

// Get all users
router.get('/users', catchAsync(async (req, res, next) => {
  const users = await User.find();
  
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
}));

// Get user by ID
router.get('/users/:id', catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
}));

// Update user
router.patch('/users/:id', catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
}));

// Delete user
router.delete('/users/:id', catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
}));

// Get all trades
router.get('/trades', catchAsync(async (req, res, next) => {
  const trades = await Trade.find();
  
  res.status(200).json({
    status: 'success',
    results: trades.length,
    data: {
      trades
    }
  });
}));

// Get trade by ID
router.get('/trades/:id', catchAsync(async (req, res, next) => {
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

// Get platform stats
router.get('/stats', catchAsync(async (req, res, next) => {
  const usersCount = await User.countDocuments();
  const tradesCount = await Trade.countDocuments();
  const activeTrades = await Trade.countDocuments({ status: 'active' });
  const totalVolume = await Trade.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      users: usersCount,
      trades: tradesCount,
      activeTrades,
      totalVolume: totalVolume[0]?.total || 0
    }
  });
}));

module.exports = router;