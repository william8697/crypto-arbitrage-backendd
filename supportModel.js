const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Reply must belong to a user']
  },
  message: {
    type: String,
    required: [true, 'Please provide a message']
  },
  isAdmin: Boolean,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const supportTicketSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Ticket must belong to a user']
  },
  subject: {
    type: String,
    required: [true, 'Please provide a subject']
  },
  message: {
    type: String,
    required: [true, 'Please provide a message']
  },
  status: {
    type: String,
    enum: ['open', 'responded', 'closed'],
    default: 'open'
  },
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
});

supportTicketSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

supportTicketSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user replies.user',
    select: 'firstName lastName email role'
  });
  next();
});

const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);

module.exports = SupportTicket;