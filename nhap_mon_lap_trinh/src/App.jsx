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
import AdminDashboard from './components/AdminDashboard';
import AdminCourseManager from './components/AdminCourseManager';
import ProblemManager from './components/ProblemManager';
import CourseGenerator from './components/CourseGenerator';
import AdminExamManager from './components/AdminExamManager';
import ExamList from './components/ExamList';
import ExamRoom from './components/ExamRoom';

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
              <Route path="/profile" element={<Profile />} />

              {/* Admin Mode */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/docs" element={<AdminCourseManager />} />
              <Route path="/admin/problems" element={<ProblemManager />} />
              <Route path="/admin/problems/ai-generate" element={<CourseGenerator />} />
              <Route path="/admin/exams" element={<AdminExamManager />} />

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
