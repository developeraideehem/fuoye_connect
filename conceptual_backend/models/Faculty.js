
import mongoose from 'mongoose';

const facultySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  facultyIdString: { // Original string ID like 'faculty_eng' for easier reference if needed
    type: String,
    required: true,
    unique: true,
  },
  // departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }] // This is implicit via Department's faculty field
}, { timestamps: true });

const Faculty = mongoose.model('Faculty', facultySchema);
export default Faculty;
