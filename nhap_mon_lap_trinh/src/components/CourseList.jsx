import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, FileText, ChevronRight } from 'lucide-react';
import axios from 'axios';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('https://datn-java-backend.onrender.com/api/courses');
      setCourses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <BookOpen className="text-blue-500" /> Giáo trình & Khóa học
      </h1>
      
      {loading ? (
        <div className="text-center text-slate-500 py-10 font-medium">⏳ Đang tải danh sách...</div>
      ) : courses.length === 0 ? (
        <div className="text-center text-slate-500 py-10 font-medium bg-white rounded-xl border border-slate-200 shadow-sm">
          Chưa có khóa học nào. Hãy liên hệ Giảng viên để thêm tài liệu.
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map(course => (
            <div 
              key={course.id} 
              onClick={() => navigate(`/docs/${course.id}`)} 
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-slate-100 text-slate-400">
                  <FileText size={20} />
                </div>
                <h3 className="font-semibold text-slate-800 text-lg">{course.courseName}</h3>
              </div>
              <ChevronRight className="text-slate-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseList;
