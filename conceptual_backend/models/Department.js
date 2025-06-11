
import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  departmentIdString: { // Original string ID like 'dept_comp_sci'
    type: String,
    required: true,
    unique: true,
  },
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty',
    required: true,
  }
}, { timestamps: true });

// Ensure unique department names within a faculty (optional, complex index)
// departmentSchema.index({ name: 1, faculty: 1 }, { unique: true });


const Department = mongoose.model('Department', departmentSchema);
export default Department;
