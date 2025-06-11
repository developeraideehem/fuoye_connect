
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Static data might still be useful for exploration links if not all rooms are from user's direct context
import { Faculties as StaticFaculties } from '../config/fuoyeData'; 
import { UserRole } from '../../types';
import { SparklesIcon, BotIcon as AiIcon, UserGroupIcon, CogIcon, ArrowRightOnRectangleIcon } from '../../components/IconComponents'; 


const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    // This should ideally be handled by the main App router redirecting to /auth
    // If somehow landed here without user, navigate away.
    navigate('/auth'); 
    return null;
  }

  // User object from backend now has faculty and department as populated objects
  const userFacultyName = user.faculty?.name;
  const userFacultyIdString = user.faculty?.facultyIdString;
  const userDepartmentName = user.department?.name;
  const userDepartmentIdString = user.department?.departmentIdString;

  const isAdmin = user.role === UserRole.LECTURER || user.isClassRep;

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-100 to-sky-100 font-sans">
      <header className="bg-blue-600 text-white p-4 shadow-lg flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-2">
          <SparklesIcon className="w-8 h-8" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">FUOYE Connect Dashboard</h1>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm hidden sm:inline">Welcome, {user.fullName.split(' ')[0]}!</span>
          <button
            onClick={() => {
              logout();
              // Navigation to /auth is handled by the router listening to user state
            }}
            className="flex items-center text-sm bg-red-500 hover:bg-red-600 px-3 py-2 rounded-md transition-colors"
            title="Logout"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 sm:mr-1.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* AI Assistant Card */}
          <Link to="/ai-assistant" className="block p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out">
            <div className="flex items-center space-x-3 mb-3">
              <AiIcon className="w-10 h-10" />
              <h2 className="text-2xl font-semibold">AI Assistant</h2>
            </div>
            <p className="text-sm opacity-90">Get help with college-related questions from CollegeConnect AI.</p>
          </Link>

          {/* Department Chat Card */}
          {userDepartmentName && userDepartmentIdString && userFacultyName && (
            <Link 
              to={`/chat/${userDepartmentIdString}`} 
              state={{ roomName: `${userDepartmentName} (Dept. Chat)`, facultyName: userFacultyName, roomIdString: userDepartmentIdString }}
              className="block p-6 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out">
              <div className="flex items-center space-x-3 mb-3">
                <UserGroupIcon className="w-10 h-10" />
                <h2 className="text-xl font-semibold">{userDepartmentName}</h2>
              </div>
              <p className="text-sm opacity-90">Chat with students and lecturers in your department.</p>
              <p className="text-xs opacity-70 mt-1">Faculty of {userFacultyName}</p>
            </Link>
          )}
          
          {/* Faculty Chat Card */}
           {userFacultyName && userFacultyIdString && (
            <Link 
              to={`/chat/${userFacultyIdString}`} 
              state={{ roomName: `${userFacultyName} (Faculty Chat)`, roomIdString: userFacultyIdString }}
              className="block p-6 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out">
              <div className="flex items-center space-x-3 mb-3">
                <UserGroupIcon className="w-10 h-10" />
                <h2 className="text-xl font-semibold">{userFacultyName}</h2>
              </div>
              <p className="text-sm opacity-90">General chat for your entire faculty.</p>
            </Link>
          )}


          {/* Explore Other Chats - Using StaticFaculties for now */}
          <div className="md:col-span-2 lg:col-span-1 p-6 bg-white rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Explore Other Chats</h3>
            <p className="text-sm text-gray-600 mb-2">
              Browse other public faculty chats.
            </p>
            {StaticFaculties.filter(f => f.id !== userFacultyIdString).slice(0,3).map(faculty => (
                 <Link 
                    key={faculty.id} 
                    to={`/chat/${faculty.id}`} 
                    state={{ roomName: `${faculty.name} (Faculty Chat)`, roomIdString: faculty.id }}
                    className="block mt-2 p-3 bg-gray-100 hover:bg-gray-200 rounded-md text-sm text-gray-700 transition-colors">
                 {faculty.name}
               </Link>
            ))}
             {StaticFaculties.filter(f => f.id !== userFacultyIdString).length === 0 && (
                <p className="text-sm text-gray-500">No other faculties to display currently.</p>
            )}
          </div>


          {/* Admin Panel Link */}
          {isAdmin && (
            <Link to="/admin-panel" state={{ from: "dashboard" }} /* Placeholder for admin panel */
              className="block p-6 bg-gradient-to-r from-slate-600 to-gray-700 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 ease-in-out">
              <div className="flex items-center space-x-3 mb-3">
                <CogIcon className="w-10 h-10" />
                <h2 className="text-2xl font-semibold">Admin Panel</h2>
              </div>
              <p className="text-sm opacity-90">Manage users and system settings (Lecturers & Class Reps only).</p>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
