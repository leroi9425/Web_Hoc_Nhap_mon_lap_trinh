import React, { useState, useEffect } from 'react';
import { User, Award, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    axios.get('https://datn-java-backend.onrender.com/api/submissions/history')
      .then(res => setSubmissions(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [user]);

  // Sinh dữ liệu heatmap giả lập (vì backend chưa có API trả về heatmap array)
  // Thực tế, ta nên đếm số lượng submission theo ngày.
  const days = Array.from({ length: 100 }).map((_, i) => {
    const val = Math.floor(Math.random() * 4);
    let color = 'bg-slate-100';
    if (val === 1) color = 'bg-emerald-200';
    if (val === 2) color = 'bg-emerald-400';
    if (val === 3) color = 'bg-emerald-600';
    return color;
  });

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
          <p className="text-slate-500 text-sm mb-6">{user.email}</p>
          
          <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition">
            Chỉnh sửa hồ sơ
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Thống kê</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Xếp hạng</span>
              <span className="font-bold text-slate-800">128</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Điểm số</span>
              <span className="font-bold text-slate-800">1,240</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm">Ngày tham gia</span>
              <span className="font-bold text-slate-800">Tháng 6/2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải: Hoạt động */}
      <div className="col-span-2 space-y-6">
        {/* Heatmap */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Hoạt động trong 100 ngày qua</h3>
          <div className="flex flex-wrap gap-1">
            {days.map((color, i) => (
              <div key={i} className={`w-3 h-3 rounded-sm ${color}`} title={`Day ${i+1}`} />
            ))}
          </div>
          <div className="flex justify-end items-center gap-2 mt-4 text-xs text-slate-500">
            <span>Ít</span>
            <div className="w-3 h-3 rounded-sm bg-slate-100" />
            <div className="w-3 h-3 rounded-sm bg-emerald-200" />
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <div className="w-3 h-3 rounded-sm bg-emerald-600" />
            <span>Nhiều</span>
          </div>
        </div>

        {/* Lịch sử nộp bài */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4">Lịch sử nộp bài gần đây</h3>
          <div className="space-y-3">
            {submissions.length === 0 ? (
              <p className="text-slate-500 text-sm">Bạn chưa nộp bài nào.</p>
            ) : (
              submissions.slice(0, 10).map((sub, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    {sub.status === 'PASSED' ? <CheckCircle className="text-emerald-500" size={18} /> : <Clock className="text-red-500" size={18} />}
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{sub.problem?.title || `Bài tập #${sub.problem?.id}`}</p>
                      <p className="text-xs text-slate-500">{new Date(sub.submittedAt).toLocaleString()}</p>
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
