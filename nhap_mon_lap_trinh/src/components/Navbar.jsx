import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Code, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Code className="text-emerald-500" size={28} />
            <span className="font-bold text-xl tracking-tight">NMLT</span>
          </div>
          
          {user ? (
            <div className="flex items-center gap-6">
              {user.role === 'STUDENT' ? (
                <>
                  <Link to="/learn" className={`hover:text-emerald-400 ${currentPath.startsWith('/learn') ? 'text-emerald-400' : 'text-slate-300'}`}>Học tập</Link>
                  <Link to="/docs" className={`hover:text-blue-400 ${currentPath.startsWith('/docs') ? 'text-blue-400' : 'text-slate-300'}`}>Tài liệu</Link>
                  <Link to="/problems" className={`hover:text-blue-400 ${currentPath.startsWith('/problem') ? 'text-blue-400' : 'text-slate-300'}`}>Bài tập</Link>
                  <Link to="/exams" className={`hover:text-blue-400 font-bold ${currentPath.startsWith('/exam') ? 'text-blue-400' : 'text-slate-300'}`}>Thi cử</Link>
                  <Link to="/my-assignments" className={`hover:text-blue-400 ${currentPath.startsWith('/my-assignments') ? 'text-blue-400' : 'text-slate-300'}`}>Lớp học</Link>
                  <div className="h-6 w-px bg-slate-700"></div>
                  <Link to="/profile" className="flex items-center gap-2 hover:text-emerald-400">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center font-bold">
                      {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/admin/dashboard" className={`hover:text-purple-400 ${currentPath.startsWith('/admin/dashboard') ? 'text-purple-400' : 'text-slate-300'}`}>Dashboard</Link>
                  <Link to="/admin/docs" className={`hover:text-purple-400 ${currentPath.startsWith('/admin/docs') ? 'text-purple-400' : 'text-slate-300'}`}>Tài liệu</Link>
                  <Link to="/admin/problems" className={`hover:text-purple-400 ${currentPath === '/admin/problems' ? 'text-purple-400' : 'text-slate-300'}`}>Bài tập</Link>
                  <Link to="/admin/classrooms" className={`hover:text-purple-400 ${currentPath === '/admin/classrooms' ? 'text-purple-400' : 'text-slate-300'}`}>Lớp học</Link>
                  <Link to="/admin/exams" className={`hover:text-purple-400 ${currentPath.startsWith('/admin/exams') ? 'text-purple-400' : 'text-slate-300'}`}>Đề thi</Link>
                  <Link to="/admin/problems/ai-generate" className={`flex items-center gap-1 hover:text-purple-400 ${currentPath.includes('ai-generate') ? 'text-purple-400' : 'text-slate-300'}`}>
                    <Sparkles size={16} /> AI Gen
                  </Link>
                </>
              )}
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400"><LogOut size={20} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-slate-300 hover:text-white">Đăng nhập</Link>
              <Link to="/register" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-md font-medium transition">Đăng ký</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
