
import express from 'express';
import Faculty from '../models/Faculty.js';
import Department from '../models/Department.js';
import { protect } from '../middleware/authMiddleware.js'; // Optional: protect if needed

const router = express.Router();

// GET /api/data/faculties
router.get('/faculties', async (req, res) => {
  try {
    const faculties = await Faculty.find({}).sort({ name: 1 });
    res.json(faculties);
  } catch (error) {
    console.error("Error fetching faculties:", error);
    res.status(500).json({ message: 'Server error fetching faculties', error: error.message });
  }
});

// GET /api/data/departments
// Optionally filter by faculty: /api/data/departments?facultyId=<faculty_object_id>
// Or by facultyIdString: /api/data/departments?facultyIdString=<faculty_id_string>
router.get('/departments', async (req, res) => {
  try {
    let query = {};
    const { facultyId, facultyIdString } = req.query;

    if (facultyIdString) {
        const faculty = await Faculty.findOne({ facultyIdString });
        if (faculty) {
            query.faculty = faculty._id;
        } else {
            return res.json([]); // No faculty found, so no departments
        }
    } else if (facultyId) {
        query.faculty = facultyId; // Assumes facultyId is the ObjectId
    }

    const departments = await Department.find(query).populate('faculty', 'name facultyIdString').sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({ message: 'Server error fetching departments', error: error.message });
  }
});

// GET /api/data/faculty/:facultyIdString/departments
router.get('/faculty/:facultyIdString/departments', async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ facultyIdString: req.params.facultyIdString });
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    const departments = await Department.find({ faculty: faculty._id }).sort({ name: 1 });
    res.json(departments);
  } catch (error) {
    console.error("Error fetching departments for faculty:", error);
    res.status(500).json({ message: 'Server error fetching departments', error: error.message });
  }
});


export default router;
