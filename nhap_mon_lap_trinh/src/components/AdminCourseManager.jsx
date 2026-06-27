import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, ChevronRight, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';

const AdminCourseManager = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://datn-java-backend.onrender.com/api/courses');
      setCourses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("CẢNH BÁO: Xóa khóa học sẽ xóa vĩnh viễn tất cả chương, bài học và bài tập bên trong! Bạn có chắc chắn không?")) return;
    try {
      await axios.delete(`https://datn-java-backend.onrender.com/api/courses/${id}`);
      fetchCourses();
    } catch (error) {
      alert("Lỗi khi xóa: " + error.message);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 mt-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BookOpen className="text-blue-500" /> Giáo trình & Khóa học
        </h1>
        <button 
          onClick={() => navigate('/admin/problems/ai-generate')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2"
        >
          <Plus size={18} /> Thêm Mới
        </button>
      </div>
      
      {loading ? (
        <div className="text-center text-slate-500 py-10 font-medium">⏳ Đang tải danh sách...</div>
      ) : courses.length === 0 ? (
        <div className="text-center text-slate-500 py-10 font-medium bg-white rounded-xl border border-slate-200 shadow-sm">
          Chưa có khóa học nào. Hãy bấm "Thêm Mới" để tạo giáo trình.
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map(course => (
            <div 
              key={course.id} 
              onClick={() => navigate(`/docs/${course.id}`)} 
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-full bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-lg">{course.courseName}</h3>
                  <p className="text-xs text-slate-500 mt-1">{course.chapters?.length || 0} chương bài học</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={(e) => handleDeleteCourse(course.id, e)}
                  className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
                  title="Xóa khóa học"
                >
                  <Trash2 size={18} />
                </button>
                <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCourseManager;
