
// conceptual_backend/server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' }); // Load from root .env

import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import chatHistoryRoutes from './routes/chatHistoryRoutes.js';
import initializeSocketHandlers from './sockets/socketHandler.js';
import { populateInitialData } from './utils/initialData.js';


const app = express();
const server = http.createServer(app);

const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']; // Add your frontend URL

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Connect to MongoDB if available
if (process.env.MONGO_URI) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully');
    try {
      await populateInitialData();
    } catch (err) {
      console.log('Error populating initial data:', err);
    }
  } catch (err) {
    console.log('MongoDB connection error:', err.message);
    console.log('Using in-memory data store instead');
  }
} else {
  console.log('MONGO_URI not set - using in-memory data store');
}

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat-history', chatHistoryRoutes);

app.get('/', (req, res) => {
  res.send('FUOYE Connect Backend is running!');
});

// --- WebSocket Connection Handling ---
initializeSocketHandlers(io);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Something broke!', error: err.message });
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server terminated gracefully');
    process.exit(0);
  });
});

// Handle port conflicts
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Trying again in 5 seconds...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT);
    }, 5000);
  } else {
    console.error('Server error:', e);
  }
});

server.listen(PORT, () => {
  console.log(`FUOYE Connect backend server listening on port ${PORT}`);
  console.log(`JWT_SECRET type: ${typeof process.env.JWT_SECRET}, length: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined'}`);
  if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.warn("WARNING: JWT_SECRET is weak or undefined. Please set a strong secret in your .env file for production.");
  }
});
