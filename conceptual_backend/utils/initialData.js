
import Faculty from '../models/Faculty.js';
import Department from '../models/Department.js';
import ChatRoom from '../models/ChatRoom.js';
// Data directly from the frontend's fuoyeData.ts for consistency
// In a real app, this might be managed via an admin interface or migrations.

const FUOYE_FACULTIES_DATA = [
  {
    id: 'faculty_eng',
    name: 'Faculty of Engineering',
    departments: [
      { id: 'dept_civ_eng', name: 'Civil Engineering' },
      { id: 'dept_comp_eng', name: 'Computer Engineering' },
      { id: 'dept_elec_eng', name: 'Electrical & Electronics Engineering' },
      { id: 'dept_mech_eng', name: 'Mechanical Engineering' },
      { id: 'dept_mecha_eng', name: 'Mechatronics Engineering' },
    ],
  },
  {
    id: 'faculty_sci',
    name: 'Faculty of Science',
    departments: [
      { id: 'dept_comp_sci', name: 'Computer Science' },
      { id: 'dept_math_sci', name: 'Mathematics' },
      { id: 'dept_phy_sci', name: 'Physics' },
      { id: 'dept_chem_sci', name: 'Industrial Chemistry' },
      { id: 'dept_bio_sci', name: 'Microbiology' },
    ],
  },
  {
    id: 'faculty_soc_sci',
    name: 'Faculty of Social Sciences',
    departments: [
      { id: 'dept_econ', name: 'Economics' },
      { id: 'dept_socio', name: 'Sociology' },
      { id: 'dept_pol_sci', name: 'Political Science' },
      { id: 'dept_psy', name: 'Psychology' },
    ],
  },
  {
    id: 'faculty_arts',
    name: 'Faculty of Arts',
    departments: [
      { id: 'dept_eng_lit', name: 'English and Literary Studies' },
      { id: 'dept_history', name: 'History and International Studies' },
      { id: 'dept_linguistics', name: 'Linguistics and Languages' },
      { id: 'dept_theatre', name: 'Theatre and Media Arts' },
    ],
  },
   {
    id: 'faculty_agric',
    name: 'Faculty of Agriculture',
    departments: [
      { id: 'dept_agric_econ', name: 'Agricultural Economics and Extension' },
      { id: 'dept_animal_sci', name: 'Animal Science' },
      { id: 'dept_crop_soil', name: 'Crop Science and Horticulture' },
      { id: 'dept_fisheries', name: 'Fisheries and Aquaculture' },
    ],
  },
];


export const populateInitialData = async () => {
  try {
    const facultyCount = await Faculty.countDocuments();
    if (facultyCount > 0) {
      console.log('Faculty and Department data already seems to exist. Skipping population.');
      // Optionally, still check and create chat rooms if they don't exist
      await createChatRoomsForAll();
      return;
    }

    console.log('Populating initial Faculty and Department data...');

    for (const facultyData of FUOYE_FACULTIES_DATA) {
      let faculty = await Faculty.findOne({ facultyIdString: facultyData.id });
      if (!faculty) {
        faculty = await Faculty.create({
          name: facultyData.name,
          facultyIdString: facultyData.id,
        });
        console.log(`Created Faculty: ${faculty.name}`);
      }

      // Create chat room for this faculty
      await ChatRoom.findOneAndUpdate(
        { roomIdString: faculty.facultyIdString },
        {
          name: faculty.name,
          roomIdString: faculty.facultyIdString,
          type: 'faculty',
          referenceId: faculty._id,
          description: `General chat for ${faculty.name}.`
        },
        { upsert: true, new: true }
      );
      console.log(`Ensured ChatRoom exists for Faculty: ${faculty.name}`);


      for (const deptData of facultyData.departments) {
        let department = await Department.findOne({ departmentIdString: deptData.id });
        if (!department) {
          department = await Department.create({
            name: deptData.name,
            departmentIdString: deptData.id,
            faculty: faculty._id,
          });
          console.log(`Created Department: ${department.name} in ${faculty.name}`);
        }
        
        // Create chat room for this department
        await ChatRoom.findOneAndUpdate(
            { roomIdString: department.departmentIdString },
            {
              name: department.name,
              roomIdString: department.departmentIdString,
              type: 'department',
              referenceId: department._id, // Could also be faculty._id for context if needed
              description: `Chat for ${department.name}, ${faculty.name}.`
            },
            { upsert: true, new: true }
          );
        console.log(`Ensured ChatRoom exists for Department: ${department.name}`);
      }
    }
    console.log('Initial data population complete.');
  } catch (error) {
    console.error('Error populating initial data:', error);
  }
};


// Helper function to ensure chat rooms exist, can be called independently
const createChatRoomsForAll = async () => {
    const faculties = await Faculty.find({});
    for (const faculty of faculties) {
        await ChatRoom.findOneAndUpdate(
            { roomIdString: faculty.facultyIdString },
            {
                name: faculty.name,
                roomIdString: faculty.facultyIdString,
                type: 'faculty',
                referenceId: faculty._id,
                description: `General chat for ${faculty.name}.`
            },
            { upsert: true, new: true }
        );
    }

    const departments = await Department.find({}).populate('faculty', 'name');
    for (const department of departments) {
        await ChatRoom.findOneAndUpdate(
            { roomIdString: department.departmentIdString },
            {
                name: department.name,
                roomIdString: department.departmentIdString,
                type: 'department',
                referenceId: department._id,
                description: `Chat for ${department.name}, ${department.faculty.name}.`
            },
            { upsert: true, new: true }
        );
    }
    console.log('Chat room existence check complete.');
};
