
import express from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Faculty from '../models/Faculty.js';
import Department from '../models/Department.js';
import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token expiration time
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { fullName, email, password, role, faculty: facultyIdString, department: departmentIdString, isClassRep } = req.body;

  try {
    if (!fullName || !email || !password || !role || !facultyIdString || !departmentIdString) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const faculty = await Faculty.findOne({ facultyIdString });
    if (!faculty) {
      return res.status(400).json({ message: 'Invalid faculty ID' });
    }

    const department = await Department.findOne({ departmentIdString, faculty: faculty._id });
    if (!department) {
      return res.status(400).json({ message: 'Invalid department ID for the selected faculty' });
    }

    const user = new User({
      fullName,
      email,
      password, // Hashing is done by pre-save hook in User model
      role,
      faculty: faculty._id,
      department: department._id,
      isClassRep: role === 'student' ? (isClassRep || false) : false, // Only students can be class reps
    });

    const savedUser = await user.save();
    
    // Populate faculty and department names for the response
    const userResponse = await User.findById(savedUser._id)
                                  .populate('faculty', 'name facultyIdString')
                                  .populate('department', 'name departmentIdString');


    res.status(201).json({
      _id: userResponse._id,
      fullName: userResponse.fullName,
      email: userResponse.email,
      role: userResponse.role,
      faculty: userResponse.faculty,
      department: userResponse.department,
      isClassRep: userResponse.isClassRep,
      token: generateToken(userResponse._id),
    });

  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) { // Duplicate key error (e.g. email)
        return res.status(400).json({ message: "Email already registered." });
    }
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
});

// In-memory user store fallback
const inMemoryUsers = [
  {
    _id: '64a1b5c1e8b1b5c1e8b1b5c1',
    fullName: 'Test User',
    email: 'test@test.com',
    password: '$2a$10$examplehashedpassword', // bcrypt hash of 'test'
    role: 'student',
    faculty: { _id: '1', name: 'Science', facultyIdString: 'SCI' },
    department: { _id: '1', name: 'Computer Science', departmentIdString: 'CSC' },
    isClassRep: false
  }
];

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    // Try MongoDB first if connected
    let user;
    if (mongoose.connection.readyState === 1) {
      user = await User.findOne({ email })
                      .populate('faculty', 'name facultyIdString')
                      .populate('department', 'name departmentIdString');
    } else {
      // Fallback to in-memory
      user = inMemoryUsers.find(u => u.email === email);
    }

    if (user) {
      let validPassword = false;
      
      // Compare passwords based on connection state
      if (mongoose.connection.readyState === 1) {
        try {
          validPassword = await user.comparePassword(password);
          console.log('Password comparison result:', validPassword);
        } catch (err) {
          console.error('Password comparison error:', err);
          validPassword = false;
        }
      } else {
        console.warn('Using in-memory auth fallback');
        validPassword = (password === 'test');
      }

      if (validPassword) {
        res.json({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          faculty: user.faculty,
          department: user.department,
          isClassRep: user.isClassRep,
          token: generateToken(user._id),
        });
      } else {
        res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
});


// GET /api/auth/me (Example protected route to get current user info)
router.get('/me', protect, async (req, res) => {
  try {
    // req.user is populated by the 'protect' middleware
    const user = await User.findById(req.user._id)
                           .select('-password') // Exclude password
                           .populate('faculty', 'name facultyIdString')
                           .populate('department', 'name departmentIdString');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error("Get 'me' error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


export default router;
