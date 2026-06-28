import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const InstructorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalStudents: 0,
        totalClasses: 0,
        totalAssignments: 0,
        totalSubmissions: 0
    });
    
    const [recentSubmissions, setRecentSubmissions] = useState([]);

    const token = localStorage.getItem('token');
    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchDashboardData = async () => {
        try {
            const res = await axios.get(`${BACKEND}/api/teacher/dashboard`, getAuthHeaders());
            setStats(res.data.stats);
            setRecentSubmissions(res.data.recentSubmissions);
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        }
    };

    useEffect(() => {
        // Fetch immediately on mount
        fetchDashboardData();
        
        // Polling every 10 seconds for the "Live Feed" effect
        const intervalId = setInterval(fetchDashboardData, 10000);
        return () => clearInterval(intervalId);
    }, []);

    const timeAgo = (dateString) => {
        if (!dateString) return "Vừa xong";
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / 60000);
        
        if (diffInMinutes < 1) return "Vừa xong";
        if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} giờ trước`;
        return `${Math.floor(diffInHours / 24)} ngày trước`;
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
            {/* HEADER */}
            <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">CE</div>
                    <h1 className="text-xl font-bold text-slate-800">Giảng Viên</h1>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 cursor-pointer group" onClick={logout} title="Nhấn để đăng xuất">
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">{user?.username || 'Giảng viên'}</span>
                        <div className="w-10 h-10 rounded-full border-2 border-blue-500 overflow-hidden shadow-sm group-hover:shadow-md transition-shadow">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'abc'}`} alt="Avatar" />
                        </div>
                    </div>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col p-8 lg:p-12 max-w-7xl mx-auto w-full gap-8">
                
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Chào mừng, <span className="text-blue-600">{user?.username || 'Thầy/Cô'}</span> 👋
                        </h2>
                        <p className="text-slate-500 mt-2 text-sm font-medium">Đây là tổng quan tình hình các lớp học của bạn hôm nay.</p>
                    </div>
                </div>

                {/* 1. HERO STATS (4 Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">👥</div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Sinh viên</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.totalStudents}</h3>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-2xl">📚</div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Lớp học</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.totalClasses}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-2xl">📝</div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Bài đã giao</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.totalAssignments}</h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-2xl">🚀</div>
                        <div>
                            <p className="text-sm text-slate-500 font-medium">Lượt nộp bài</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stats.totalSubmissions}</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 2. RECENT ACTIVITY (Live Feed) */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                                Hoạt động gần đây
                            </h3>
                            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Tự động cập nhật</span>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto">
                            {recentSubmissions.length === 0 ? (
                                <div className="text-center text-slate-400 py-10 italic text-sm">
                                    Chưa có sinh viên nào nộp bài.
                                </div>
                            ) : (
                                <ul className="space-y-4">
                                    {recentSubmissions.map((sub, idx) => (
                                        <li key={idx} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">
                                                {sub.studentName ? sub.studentName.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-slate-800">
                                                        <span className="font-bold">{sub.studentName}</span> vừa nộp bài <span className="font-bold text-blue-600">{sub.problemTitle}</span>
                                                    </p>
                                                    <span className="text-xs text-slate-400 font-medium whitespace-nowrap">{timeAgo(sub.submittedAt)}</span>
                                                </div>
                                                <div className="mt-2 flex items-center gap-3">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sub.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {sub.status}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full bg-white">
                                                        Điểm: {sub.score}/10
                                                    </span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                    {/* LỐI TẮT QUẢN LÝ (Gom 2 nút cũ vào đây) */}
                    <div className="flex flex-col gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">Lối tắt quản lý</h3>
                            <div className="space-y-3">
                                <button 
                                    onClick={() => navigate('/admin/classrooms')}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg">🏫</div>
                                        <span className="font-semibold text-slate-700 group-hover:text-blue-700">Lớp học của tôi</span>
                                    </div>
                                    <span className="text-slate-400 group-hover:text-blue-500">→</span>
                                </button>

                                <button 
                                    onClick={() => navigate('/admin/problems')}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-lg">💻</div>
                                        <span className="font-semibold text-slate-700 group-hover:text-indigo-700">Ngân hàng bài tập</span>
                                    </div>
                                    <span className="text-slate-400 group-hover:text-indigo-500">→</span>
                                </button>
                                
                                <button 
                                    onClick={() => navigate('/admin/docs')}
                                    className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-lg">📚</div>
                                        <span className="font-semibold text-slate-700 group-hover:text-orange-700">Quản lý Tài liệu</span>
                                    </div>
                                    <span className="text-slate-400 group-hover:text-orange-500">→</span>
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
            
            <footer className="py-6 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
                CodeEdu LMS © 2026. Instructor Dashboard.
            </footer>
        </div>
    );
};

export default InstructorDashboard;
