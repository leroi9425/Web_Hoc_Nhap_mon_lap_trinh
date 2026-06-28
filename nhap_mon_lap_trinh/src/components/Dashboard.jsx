import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, CheckCircle, BookOpen } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [passedProbs, setPassedProbs] = useState(new Set());
  const [totalSolvedCount, setTotalSolvedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    
    // Get all courses
    axios.get(`${BACKEND}/api/courses`)
      .then(res => setCourses(res.data))
      .catch(err => console.error(err));

    // Get solved count
    axios.get(`${BACKEND}/api/submissions/history`)
      .then(res => {
        const passed = new Set(res.data.filter(s => s.status === 'ACCEPTED').map(s => s.problem.id));
        setPassedProbs(passed);
        setTotalSolvedCount(passed.size);
      })
      .catch(err => console.error(err));
  }, [user]);

  const getCourseProgress = (course) => {
    let totalProbs = 0;
    let solvedProbs = 0;
    
    if (course.chapters) {
      course.chapters.forEach(chapter => {
        if (chapter.sections) {
          chapter.sections.forEach(section => {
            if (section.problems) {
              section.problems.forEach(prob => {
                totalProbs++;
                if (passedProbs.has(prob.id)) {
                  solvedProbs++;
                }
              });
            }
          });
        }
      });
    }
    
    const percent = totalProbs > 0 ? Math.round((solvedProbs / totalProbs) * 100) : 0;
    return { totalProbs, solvedProbs, percent };
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Tổng quan học tập</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Tổng bài tập đã giải</p>
            <p className="text-2xl font-bold text-slate-800">{totalSolvedCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Các khóa học của bạn</h2>
        <div className="space-y-4">
          {courses.map(course => {
            const { totalProbs, solvedProbs, percent } = getCourseProgress(course);
            return (
              <div key={course.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50 gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg shrink-0">
                    <BookOpen className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{course.courseName}</p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-500 font-medium">
                      <Activity size={16} className="text-blue-500" />
                      <span>Tiến độ: {solvedProbs}/{totalProbs} bài ({percent}%)</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/docs/${course.id}`)} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap w-full sm:w-auto"
                >
                  Tiếp tục học
                </button>
              </div>
            );
          })}
          
          {courses.length === 0 && (
            <div className="text-center p-8 text-slate-500">
              Chưa có khóa học nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
