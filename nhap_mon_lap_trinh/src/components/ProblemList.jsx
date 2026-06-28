import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ProblemList = () => {
  const [problems, setProblems] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [probsRes, statusRes] = await Promise.all([
          axios.get(`${BACKEND}/api/problems`),
          user ? axios.get(`${BACKEND}/api/submissions/my-status`) : Promise.resolve({ data: {} })
        ]);
        setProblems(probsRes.data);
        setUserSubmissions(statusRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const getStatusIcon = (problemId) => {
    const status = userSubmissions[problemId];
    if (status === 'ACCEPTED') {
        return <CheckCircle className="text-emerald-500 mx-auto" size={20} title="Đã giải đúng" />;
    } else if (status) {
        // Any other status means attempted but failed
        return <XCircle className="text-red-500 mx-auto" size={20} title="Đã làm sai" />;
    }
    return <div className="w-5 h-5 rounded-full border-2 border-slate-300 mx-auto" title="Chưa làm"></div>;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Kho bài tập</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input type="text" placeholder="Tìm bài tập..." className="pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 w-64" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md text-slate-600 hover:bg-slate-50">
            <Filter size={18} /> Lọc
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-500 py-10 font-medium">⏳ Đang tải bài tập...</div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-medium w-16 text-center">Trạng thái</th>
                <th className="p-4 text-left font-semibold text-slate-500">Tên bài</th>
                <th className="p-4 text-left font-semibold text-slate-500">Phân loại</th>
                <th className="p-4 text-left font-semibold text-slate-500 hidden md:table-cell">Ngôn ngữ</th>
              </tr>
            </thead>
            <tbody>
              {problems.map(prob => {
                return (
                  <tr key={prob.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="p-4 text-center">
                      {getStatusIcon(prob.id)}
                    </td>
                    <td className="p-4 font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => navigate(`/problems/${prob.id}`)}>
                      {prob.title}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center">
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {prob.categoryName || 'Tự do'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-md uppercase font-bold">{prob.language}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ProblemList;
