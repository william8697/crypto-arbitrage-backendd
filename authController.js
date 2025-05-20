const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('./userModel');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const Email = require('./email');

const router = express.Router();

const signToken = id => {
  return jwt.sign({ id }, '17581758Na.', {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d'
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + 90 * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// Signup
router.post('/signup', catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, country, currency } = req.body;
  
  const newUser = await User.create({
    email,
    password,
    firstName,
    lastName,
    country,
    currency
  });

  const url = `${req.protocol}://${req.get('host')}/dashboard`;
  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, 201, res);
}));

// Login
router.post('/login', catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
}));

// Wallet Login
router.post('/wallet-login', catchAsync(async (req, res, next) => {
  const { walletAddress, signature } = req.body;

  if (!walletAddress || !signature) {
    return next(new AppError('Please provide wallet address and signature!', 400));
  }

  const user = await User.findOne({ walletAddress });

  if (!user) {
    return next(new AppError('No user found with this wallet address', 401));
  }

  // Verify signature here (implementation depends on your wallet auth method)
  const isValidSignature = true; // Replace with actual verification logic

  if (!isValidSignature) {
    return next(new AppError('Invalid signature', 401));
  }

  createSendToken(user, 200, res);
}));

// Forgot Password
router.post('/forgotPassword', catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new AppError('There was an error sending the email. Try again later!'), 500);
  }
}));

// Reset Password
router.patch('/resetPassword/:token', catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
}));

module.exports = router;