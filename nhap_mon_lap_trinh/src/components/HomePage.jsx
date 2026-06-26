import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, Code, Brain, Target } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-950 text-white flex flex-col items-center justify-center text-center p-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-8">
        <Sparkles size={16} />
        <span className="text-sm font-medium">Nền tảng học C/C++ thế hệ mới</span>
      </div>
      <h1 className="text-5xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-emerald-400 to-cyan-500 text-transparent bg-clip-text leading-tight">
        Làm chủ Thuật toán <br/> Bằng Thực hành
      </h1>
      <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10">
        Hệ thống đánh giá mã nguồn tự động, tài liệu trực quan và lộ trình học tập cá nhân hóa. Bắt đầu hành trình trở thành chuyên gia phần mềm ngay hôm nay.
      </p>
      <div className="flex gap-4">
        <button onClick={() => navigate('/register')} className="bg-emerald-600 hover:bg-emerald-500 px-8 py-4 rounded-lg font-bold text-lg transition flex items-center gap-2">
          Bắt đầu miễn phí <ChevronRight size={20} />
        </button>
        <button onClick={() => navigate('/problems')} className="bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-lg font-bold text-lg transition border border-slate-700">
          Xem danh sách bài tập
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto text-left">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-4">
            <Code size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Thực hành Code Trực tiếp</h3>
          <p className="text-slate-400 text-sm">Trình soạn thảo code tích hợp ngay trên trình duyệt với khả năng chấm điểm tự động tức thì.</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
          <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-4">
            <Brain size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Sinh Đề bằng AI</h3>
          <p className="text-slate-400 text-sm">Ngân hàng câu hỏi liên tục được cập nhật và mở rộng tự động nhờ sức mạnh của Trí tuệ nhân tạo.</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-4">
            <Target size={24} />
          </div>
          <h3 className="text-xl font-bold mb-2">Lộ trình Cá nhân hóa</h3>
          <p className="text-slate-400 text-sm">Theo dõi sát sao tiến độ học tập và gợi ý bài tập phù hợp nhất để nâng cao trình độ nhanh nhất.</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
