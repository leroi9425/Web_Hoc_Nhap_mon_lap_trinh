import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './components/HomePage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import CourseViewer from './components/CourseViewer';
import ProblemList from './components/ProblemList';
import CodeEditor from './components/CodeEditor';
import Profile from './components/Profile';
import InstructorDashboard from './components/InstructorDashboard';
import AdminCourseManager from './components/AdminCourseManager';
import ProblemManager from './components/ProblemManager';
import CourseGenerator from './components/CourseGenerator';
import AdminExamManager from './components/AdminExamManager';
import ExamList from './components/ExamList';
import ExamRoom from './components/ExamRoom';
import TeacherClassRoom from './components/TeacherClassRoom';
import MyAssignments from './components/MyAssignments';
import AdminRoute from './components/AdminRoute';

import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-200">
          <Navbar />
          <main>
            <Routes>
              {/* User Mode */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login isRegister={true} />} />
              <Route path="/learn" element={<Dashboard />} />
              <Route path="/docs" element={<CourseList />} />
              <Route path="/docs/:id" element={<CourseViewer />} />
              <Route path="/exams" element={<ExamList />} />
              <Route path="/exams/:id" element={<ExamRoom />} />
              <Route path="/problems" element={<ProblemList />} />
              <Route path="/problems/:problemId" element={<CodeEditor />} />
              <Route path="/my-assignments" element={<MyAssignments />} />
              <Route path="/profile" element={<Profile />} />

              {/* Admin Mode */}
              <Route path="/admin/dashboard" element={<AdminRoute><InstructorDashboard /></AdminRoute>} />
              <Route path="/admin/docs" element={<AdminRoute><AdminCourseManager /></AdminRoute>} />
              <Route path="/admin/problems" element={<AdminRoute><ProblemManager /></AdminRoute>} />
              <Route path="/admin/problems/ai-generate" element={<AdminRoute><CourseGenerator /></AdminRoute>} />
              <Route path="/admin/exams" element={<AdminRoute><AdminExamManager /></AdminRoute>} />
              <Route path="/admin/classrooms" element={<AdminRoute><TeacherClassRoom /></AdminRoute>} />

              {/* Catch-All Route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
