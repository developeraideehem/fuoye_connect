
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../../types'; // Path is correct
import { Faculties as StaticFaculties, getDepartmentsForFaculty as staticGetDepartmentsForFaculty } from '../config/fuoyeData'; // Static data for dropdowns
import { SparklesIcon, UserIcon as LoginIcon, UserPlusIcon } from '../../components/IconComponents'; 

// For fetching dynamic faculty/department data (if preferred over static)
// const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';


const AuthPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const { login, register, isLoading, error: authError, user, clearError } = useAuth(); // Get user and clearError
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.STUDENT);
  
  // Use static data for selections initially
  const [facultiesData, setFacultiesData] = useState(StaticFaculties);
  const [selectedFacultyIdString, setSelectedFacultyIdString] = useState<string>(StaticFaculties[0]?.id || '');
  const [departmentsForSelectedFaculty, setDepartmentsForSelectedFaculty] = useState(staticGetDepartmentsForFaculty(StaticFaculties[0]?.id || ''));
  const [selectedDepartmentIdString, setSelectedDepartmentIdString] = useState<string>(departmentsForSelectedFaculty[0]?.id || '');
  const [isClassRep, setIsClassRep] = useState(false);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch dynamic faculties and departments - uncomment if using dynamic data
  /*
  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/data/faculties`);
        const data = await res.json();
        if (res.ok) {
          setFacultiesData(data.map(f => ({id: f.facultyIdString, name: f.name, departments: []}))); // Adapt to your Faculty type
          if (data.length > 0) {
            setSelectedFacultyIdString(data[0].facultyIdString);
          }
        }
      } catch (e) { console.error("Failed to fetch faculties", e); }
    };
    fetchFaculties();
  }, []);

  useEffect(() => {
    if (!selectedFacultyIdString) {
      setDepartmentsForSelectedFaculty([]);
      setSelectedDepartmentIdString('');
      return;
    }
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/data/faculty/${selectedFacultyIdString}/departments`);
        const data = await res.json();
        if (res.ok) {
          setDepartmentsForSelectedFaculty(data.map(d => ({id: d.departmentIdString, name: d.name, facultyId: selectedFacultyIdString }))); // Adapt
          if (data.length > 0) {
            setSelectedDepartmentIdString(data[0].departmentIdString);
          } else {
            setSelectedDepartmentIdString('');
          }
        }
      } catch (e) { console.error("Failed to fetch departments", e); }
    };
    fetchDepartments();
  }, [selectedFacultyIdString]);
  */

  // This effect updates departments when selectedFacultyIdString changes using STATIC data
   useEffect(() => {
    const newDepartments = staticGetDepartmentsForFaculty(selectedFacultyIdString);
    setDepartmentsForSelectedFaculty(newDepartments);
    setSelectedDepartmentIdString(newDepartments[0]?.id || '');
  }, [selectedFacultyIdString]);


  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFacultyIdString(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoginView) {
      await login(email, password);
    } else {
      if (!fullName || !selectedFacultyIdString || !selectedDepartmentIdString || !password) {
        // Use a more user-friendly error display than alert
        // For now, keeping alert for simplicity in this refactor stage
        alert("Please fill all fields for registration, including password.");
        return;
      }
      // The User type Omit in AuthContext for register will handle _id not being present.
      await register({
        fullName,
        email,
        password, // Pass password to register function
        role,
        faculty: selectedFacultyIdString, // Pass the ID string
        department: selectedDepartmentIdString, // Pass the ID string
        isClassRep: role === UserRole.STUDENT && isClassRep,
      });
    }
    // Navigation on success is handled by useEffect in App.tsx watching the user state or here after await
    // if (user) navigate('/'); // This might be problematic if user state updates are async
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <SparklesIcon className="w-16 h-16 text-sky-400 mx-auto mb-3" />
          <h1 className="text-4xl font-bold text-white">FUOYE Connect</h1>
          <p className="text-sky-200 mt-1">Connect, Chat, Collaborate.</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg shadow-2xl rounded-xl p-6 sm:p-8">
          <div className="flex border-b border-sky-500/30 mb-6">
            <button
              onClick={() => { setIsLoginView(true); clearError(); /* Clear previous errors */ }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors duration-150 ease-in-out
                ${isLoginView ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-300 hover:text-sky-200'}`}
            >
              Login
            </button>
            <button
              onClick={() => { setIsLoginView(false); clearError(); /* Clear previous errors */ }}
              className={`flex-1 py-3 text-sm font-semibold transition-colors duration-150 ease-in-out
                ${!isLoginView ? 'text-sky-400 border-b-2 border-sky-400' : 'text-gray-300 hover:text-sky-200'}`}
            >
              Register
            </button>
          </div>

          {authError && <p className="text-red-400 bg-red-900/50 p-3 rounded-md text-sm mb-4">{authError}</p>}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLoginView && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required={!isLoginView}
                className="w-full px-4 py-3 bg-white/5 border border-sky-500/30 rounded-lg text-gray-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none placeholder-gray-400"
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-sky-500/30 rounded-lg text-gray-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none placeholder-gray-400"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/5 border border-sky-500/30 rounded-lg text-gray-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none placeholder-gray-400"
            />

            {!isLoginView && (
              <>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-3 bg-white/5 border border-sky-500/30 rounded-lg text-gray-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
                >
                  <option value={UserRole.STUDENT} className="text-black">Student</option>
                  <option value={UserRole.LECTURER} className="text-black">Lecturer</option>
                </select>
                
                <select
                  value={selectedFacultyIdString}
                  onChange={handleFacultyChange}
                  required={!isLoginView}
                  className="w-full px-4 py-3 bg-white/5 border border-sky-500/30 rounded-lg text-gray-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
                >
                  <option value="" disabled className="text-black">Select Faculty</option>
                  {facultiesData.map(f => <option key={f.id} value={f.id} className="text-black">{f.name}</option>)}
                </select>

                <select
                  value={selectedDepartmentIdString}
                  onChange={(e) => setSelectedDepartmentIdString(e.target.value)}
                  required={!isLoginView}
                  disabled={departmentsForSelectedFaculty.length === 0}
                  className="w-full px-4 py-3 bg-white/5 border border-sky-500/30 rounded-lg text-gray-100 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none"
                >
                  <option value="" disabled className="text-black">Select Department</option>
                  {departmentsForSelectedFaculty.map(d => <option key={d.id} value={d.id} className="text-black">{d.name}</option>)}
                </select>

                {role === UserRole.STUDENT && (
                  <label className="flex items-center space-x-2 text-gray-300">
                    <input
                      type="checkbox"
                      checked={isClassRep}
                      onChange={(e) => setIsClassRep(e.target.checked)}
                      className="form-checkbox h-5 w-5 text-sky-500 bg-white/10 border-sky-500/50 rounded focus:ring-sky-400"
                    />
                    <span>Are you a Class Representative?</span>
                  </label>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center py-3 px-4 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-lg transition-colors duration-150 ease-in-out disabled:bg-sky-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {isLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (isLoginView ? <LoginIcon className="w-5 h-5 mr-2" /> : <UserPlusIcon className="w-5 h-5 mr-2" />)}
              {isLoading ? 'Processing...' : (isLoginView ? 'Login' : 'Register')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
