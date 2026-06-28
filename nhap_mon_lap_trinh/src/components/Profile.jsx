import React, { useState, useEffect } from 'react';
import { User, Award, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const Profile = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const token = localStorage.getItem('token');
    axios.get(`${BACKEND}/api/submissions/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => setSubmissions(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

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

  if (loading) return <div className="text-center py-20 text-slate-500">⏳ Đang tải...</div>;
  if (!user) return <div className="text-center py-20 text-slate-500">Vui lòng đăng nhập để xem thông tin cá nhân.</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Cột trái: Thông tin cá nhân */}
      <div className="col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">{user.username}</h2>
          <p className="text-slate-500 text-sm">{user.email}</p>
        </div>
      </div>

      {/* Cột phải: Hoạt động */}
      <div className="col-span-2 space-y-6">

        {/* Lịch sử nộp bài */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Lịch sử nộp bài gần đây</h3>
          <div className="space-y-3">
            {submissions.length === 0 ? (
              <p className="text-slate-500 text-sm">Bạn chưa nộp bài nào.</p>
            ) : (
              [...submissions]
                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                .slice(0, 10)
                .map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    {sub.status === 'PASSED' ? <CheckCircle className="text-emerald-500" size={18} /> : <Clock className="text-red-500" size={18} />}
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{sub.problem?.title || `Bài tập #${sub.problem?.id}`}</p>
                      <p className="text-xs text-slate-500">{timeAgo(sub.submittedAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-md uppercase">{sub.language}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
