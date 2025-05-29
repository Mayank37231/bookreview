require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const CustomError = require('./utils/customError');
const globalErrorHandler = require('./middleware/globalErrorHandler');

// Security packages
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const morgan = require('morgan'); // For logging HTTP requests

// Connect to database
connectDB();

const app = express();

// Set security HTTP headers
app.use(helmet());

// Logging middleware (dev only)
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
    max: 100, // 100 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    message: 'Too many requests from this IP, please try again after 15 minutes!'
});
app.use('/api', limiter); // Apply to all API routes

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true })); // For form data
app.use(cookieParser()); // Parse cookies

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS attacks
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
    whitelist: ['page', 'limit', 'sort', 'fields', 'author', 'genre', 'rating'] // Whitelist common query params
}));

// Routes
app.use('/api', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reviews', reviewRoutes); // Note: Reviews are handled globally for updates/deletes

// Handle unhandled routes (404)
app.all('*', (req, res, next) => {
    next(new CustomError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g., DB connection errors)
process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION!  Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
        process.exit(1);
    });
});