const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const { Server } = require('socket.io');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const sessionRoutes = require('./routes/session.routes');
const ticketRoutes = require('./routes/ticket.routes');
const merchandiseRoutes = require('./routes/merchandise.routes');
const mediaRoutes = require('./routes/media.routes');
const paymentRoutes = require('./routes/payment.routes');

// Import middlewares
const { authenticateJWT } = require('./middleware/auth.middleware');
const errorHandler = require('./middleware/error.middleware');

// Import WebRTC handlers
const { setupWebRTC } = require('./services/webrtc.service');

// Import environment variables
require('dotenv').config();

// Initialize app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Set up WebRTC socket handlers
setupWebRTC(io);

// Middleware
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateJWT, userRoutes);
app.use('/api/events', eventRoutes); // Some endpoints public, some protected
app.use('/api/sessions', sessionRoutes); // Some endpoints public, some protected
app.use('/api/tickets', authenticateJWT, ticketRoutes);
app.use('/api/merchandise', merchandiseRoutes); // Some endpoints public, some protected
app.use('/api/media', authenticateJWT, mediaRoutes);
app.use('/api/payments', authenticateJWT, paymentRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', version: '1.0.0' });
});

// Error handling middleware
app.use(errorHandler);

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../client/build')));

  // All unknown routes should serve the React app
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log('Unhandled Rejection:', err.message);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = { app, server }; // Export for testing