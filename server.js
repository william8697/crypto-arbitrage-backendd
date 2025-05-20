const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');

const app = express();

// Connect to MongoDB
const DB = 'mongodb+srv://mosesmwainaina1994:OWlondlAbn3bJuj4@cluster0.edyueep.mongodb.net/arbitrage?retryWrites=true&w=majority';

mongoose.connect(DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('DB connection successful!'));
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global Middlewares
app.use(cors({
  origin: 'https://website-xi-ten-52.vercel.app',
  credentials: true
}));
app.options('*', cors());
app.use(helmet());
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Routes
const userRouter = require('./userController');
const authRouter = require('./authController');
const tradeRouter = require('./tradeController');
const adminRouter = require('./adminController');
const supportRouter = require('./supportController');
const errorController = require('./errorController');

app.use('/api/v1/users', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/trades', tradeRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/support', supportRouter);

// Error handling
app.use(errorController);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});
