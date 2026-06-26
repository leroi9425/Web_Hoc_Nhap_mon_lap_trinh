import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const InstructorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">IT</div>
                    <h1 className="text-xl font-bold text-slate-800">CodeEdu Admin</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={logout} title="Nhấn để đăng xuất">
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-purple-600 transition-colors">{user?.username || 'abc'}</span>
                        <div className="w-10 h-10 rounded-full border-2 border-purple-500 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'abc'}`} alt="Avatar" />
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight">
                        Chào mừng, <span className="text-purple-600">{user?.username || 'abc'}</span>
                    </h2>
                    <p className="text-slate-500 mt-4 text-lg">Bạn muốn quản lý hệ thống nào hôm nay?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
                    
                    {/* Quản lý Bài tập Card */}
                    <div 
                        onClick={() => navigate('/admin/problems')}
                        className="bg-white p-10 rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer flex flex-col items-center text-center group transform hover:-translate-y-1"
                    >
                        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            💻
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors">Quản lý bài tập</h3>
                        <p className="text-slate-500 font-medium">Thêm, sửa, xóa các bài tập lập trình, quản lý testcase và ngân hàng câu hỏi.</p>
                    </div>

                    {/* Quản lý Tài liệu Card */}
                    <div 
                        onClick={() => navigate('/admin/courses/ai-generate')}
                        className="bg-white p-10 rounded-2xl border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer flex flex-col items-center text-center group transform hover:-translate-y-1"
                    >
                        <div className="w-24 h-24 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-5xl mb-6 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                            📚
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-3 group-hover:text-orange-600 transition-colors">Quản lý tài liệu</h3>
                        <p className="text-slate-500 font-medium">Upload PDF, tạo khóa học mới bằng AI, chỉnh sửa nội dung giáo trình lý thuyết.</p>
                    </div>

                </div>
            </main>
            
            <footer className="py-4 text-center text-slate-400 text-sm">
                CodeEdu LMS © 2026. Instructor Dashboard.
            </footer>
        </div>
    );
};

export default InstructorDashboard;
