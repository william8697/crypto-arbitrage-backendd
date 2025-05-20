const express = require('express');
const SupportTicket = require('./supportModel');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');

const router = express.Router();

// Create support ticket
router.post('/', catchAsync(async (req, res, next) => {
  const { subject, message } = req.body;
  
  const ticket = await SupportTicket.create({
    user: req.user.id,
    subject,
    message,
    status: 'open'
  });

  res.status(201).json({
    status: 'success',
    data: {
      ticket
    }
  });
}));

// Get user tickets
router.get('/my-tickets', catchAsync(async (req, res, next) => {
  const tickets = await SupportTicket.find({ user: req.user.id });
  
  res.status(200).json({
    status: 'success',
    results: tickets.length,
    data: {
      tickets
    }
  });
}));

// Get ticket by ID
router.get('/:id', catchAsync(async (req, res, next) => {
  const ticket = await SupportTicket.findById(req.params.id);
  
  if (!ticket) {
    return next(new AppError('No ticket found with that ID', 404));
  }

  if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to view this ticket', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      ticket
    }
  });
}));

// Add reply to ticket
router.post('/:id/reply', catchAsync(async (req, res, next) => {
  const { message } = req.body;
  
  const ticket = await SupportTicket.findById(req.params.id);
  
  if (!ticket) {
    return next(new AppError('No ticket found with that ID', 404));
  }

  if (ticket.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('You do not have permission to reply to this ticket', 403));
  }

  ticket.replies.push({
    user: req.user.id,
    message,
    isAdmin: req.user.role === 'admin'
  });

  if (req.user.role === 'admin') {
    ticket.status = 'responded';
  }

  await ticket.save();

  res.status(200).json({
    status: 'success',
    data: {
      ticket
    }
  });
}));

module.exports = router;