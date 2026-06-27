import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, CheckCircle, Award, BookOpen } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [solvedCount, setSolvedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    axios.get('https://datn-java-backend.onrender.com/api/submissions/history')
      .then(res => {
        const passedProbs = new Set(res.data.filter(s => s.status === 'PASSED').map(s => s.problem.id));
        setSolvedCount(passedProbs.size);
      })
      .catch(err => console.error(err));
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tổng quan học tập</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-lg"><Activity size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Tiến độ khóa học</p>
            <p className="text-2xl font-bold text-slate-800">12%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Bài tập đã giải</p>
            <p className="text-2xl font-bold text-slate-800">{solvedCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-100 text-amber-600 rounded-lg"><Award size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Huy hiệu</p>
            <p className="text-2xl font-bold text-slate-800">1</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Tiếp tục học</h2>
        <div className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
          <div className="flex items-center gap-4">
            <BookOpen className="text-blue-500" />
            <div>
              <p className="font-semibold text-slate-800">Cơ bản C++</p>
              <p className="text-sm text-slate-500">Giáo trình</p>
            </div>
          </div>
          <button onClick={() => navigate('/docs')} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">Tiếp tục</button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
