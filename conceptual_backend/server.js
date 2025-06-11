
// conceptual_backend/server.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' }); // Load from root .env

import authRoutes from './routes/authRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
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

// --- Database Connection ---
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined in .env file.");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected successfully.');
    await populateInitialData(); // Populate faculties and departments if needed
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1);
  });

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/chat', chatRoutes);

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

server.listen(PORT, () => {
  console.log(`FUOYE Connect backend server listening on port ${PORT}`);
  console.log(`JWT_SECRET type: ${typeof process.env.JWT_SECRET}, length: ${process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 'undefined'}`);
  if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    console.warn("WARNING: JWT_SECRET is weak or undefined. Please set a strong secret in your .env file for production.");
  }
});
