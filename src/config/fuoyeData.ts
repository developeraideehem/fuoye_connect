
import { Faculty, Department } from '../../types'; // Path is correct relative to src/config

// This data is now primarily for frontend static display (e.g., in AuthPage dropdowns before dynamic data loads)
// or as a fallback. The backend (conceptual_backend/utils/initialData.js) populates the database
// using this structure as a source. API calls should be preferred for fetching up-to-date data.

export const Faculties: Faculty[] = [ // This structure matches the original frontend Faculty type
  {
    id: 'faculty_eng', // This is the facultyIdString
    name: 'Faculty of Engineering',
    departments: [ // This is the original frontend Department type array
      { id: 'dept_civ_eng', name: 'Civil Engineering', facultyId: 'faculty_eng' },
      { id: 'dept_comp_eng', name: 'Computer Engineering', facultyId: 'faculty_eng' },
      { id: 'dept_elec_eng', name: 'Electrical & Electronics Engineering', facultyId: 'faculty_eng' },
      { id: 'dept_mech_eng', name: 'Mechanical Engineering', facultyId: 'faculty_eng' },
      { id: 'dept_mecha_eng', name: 'Mechatronics Engineering', facultyId: 'faculty_eng' },
    ],
  },
  {
    id: 'faculty_sci',
    name: 'Faculty of Science',
    departments: [
      { id: 'dept_comp_sci', name: 'Computer Science', facultyId: 'faculty_sci' },
      { id: 'dept_math_sci', name: 'Mathematics', facultyId: 'faculty_sci' },
      { id: 'dept_phy_sci', name: 'Physics', facultyId: 'faculty_sci' },
      { id: 'dept_chem_sci', name: 'Industrial Chemistry', facultyId: 'faculty_sci' },
      { id: 'dept_bio_sci', name: 'Microbiology', facultyId: 'faculty_sci' },
    ],
  },
  {
    id: 'faculty_soc_sci',
    name: 'Faculty of Social Sciences',
    departments: [
      { id: 'dept_econ', name: 'Economics', facultyId: 'faculty_soc_sci' },
      { id: 'dept_socio', name: 'Sociology', facultyId: 'faculty_soc_sci' },
      { id: 'dept_pol_sci', name: 'Political Science', facultyId: 'faculty_soc_sci' },
      { id: 'dept_psy', name: 'Psychology', facultyId: 'faculty_soc_sci' },
    ],
  },
  {
    id: 'faculty_arts',
    name: 'Faculty of Arts',
    departments: [
      { id: 'dept_eng_lit', name: 'English and Literary Studies', facultyId: 'faculty_arts' },
      { id: 'dept_history', name: 'History and International Studies', facultyId: 'faculty_arts' },
      { id: 'dept_linguistics', name: 'Linguistics and Languages', facultyId: 'faculty_arts' },
      { id: 'dept_theatre', name: 'Theatre and Media Arts', facultyId: 'faculty_arts' },
    ],
  },
   {
    id: 'faculty_agric',
    name: 'Faculty of Agriculture',
    departments: [
      { id: 'dept_agric_econ', name: 'Agricultural Economics and Extension', facultyId: 'faculty_agric' },
      { id: 'dept_animal_sci', name: 'Animal Science', facultyId: 'faculty_agric' },
      { id: 'dept_crop_soil', name: 'Crop Science and Horticulture', facultyId: 'faculty_agric' },
      { id: 'dept_fisheries', name: 'Fisheries and Aquaculture', facultyId: 'faculty_agric' },
    ],
  },
];

// These getters operate on the static data above.
export const getDepartmentsForFaculty = (facultyIdString: string): Department[] => {
  const faculty = Faculties.find(f => f.id === facultyIdString);
  return faculty ? faculty.departments : [];
};

export const getFacultyById = (facultyIdString: string): Faculty | undefined => {
  return Faculties.find(f => f.id === facultyIdString);
}

export const getDepartmentById = (departmentIdString: string): Department | undefined => {
  for (const faculty of Faculties) {
    const dept = faculty.departments.find(d => d.id === departmentIdString);
    if (dept) return dept;
  }
  return undefined;
}
