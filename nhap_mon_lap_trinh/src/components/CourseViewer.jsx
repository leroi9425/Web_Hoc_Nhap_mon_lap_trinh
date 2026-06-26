import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const CourseViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Navigation States
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('theory');
  const [sectionProblems, setSectionProblems] = useState([]);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [problemsLoading, setProblemsLoading] = useState(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Chào bạn! Nếu có khái niệm nào ở phần **Lý thuyết** làm bạn bối rối, hoặc gặp khó lúc **Thực hành**, cứ nhắn tôi nhé!' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatLogRef = useRef(null);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/courses/${id}`);
      if (!response.ok) throw new Error('Lỗi khi tải dữ liệu khóa học');
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages(prev => [...prev, { sender: 'user', text: chatInput }]);
    setChatInput("");
    
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        sender: 'ai', 
        text: "Dựa vào khái niệm ở tab lý thuyết, bạn chỉ cần đọc kỹ và thử áp dụng nhé. (Tính năng API chat đang được phát triển!)" 
      }]);
    }, 1000);
  };

  const allSections = [];
  course?.chapters?.forEach((chapter, cIndex) => {
    chapter.sections?.forEach((section, sIndex) => {
      allSections.push({
        id: section.id,
        chapterTitle: chapter.chapterTitle,
        sectionTitle: section.sectionTitle,
        content: section.content,
        cIndex, sIndex
      });
    });
  });

  const currentFlatIndex = allSections.findIndex(
    s => s.cIndex === activeChapterIndex && s.sIndex === activeSectionIndex
  );
  const activeSectionData = allSections[currentFlatIndex] || null;

  useEffect(() => {
    if (activeSectionData && activeTab === 'practice') {
      fetchSectionProblems(activeSectionData.id);
      fetchUserSubmissions();
    }
  }, [activeSectionData?.id, activeTab]);

  const fetchSectionProblems = async (sectionId) => {
    setProblemsLoading(true);
    try {
      const res = await axios.get(`http://localhost:8080/api/problems/section/${sectionId}`);
      setSectionProblems(res.data);
    } catch (err) {
      console.error("Lỗi lấy bài tập", err);
    } finally {
      setProblemsLoading(false);
    }
  };

  const fetchUserSubmissions = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`http://localhost:8080/api/submissions/history`);
      setUserSubmissions(res.data);
    } catch (err) {
      console.error("Lỗi lấy lịch sử", err);
    }
  };

  const handleNext = () => {
    if (currentFlatIndex < allSections.length - 1) {
      const next = allSections[currentFlatIndex + 1];
      setActiveChapterIndex(next.cIndex);
      setActiveSectionIndex(next.sIndex);
    }
  };
  const handlePrev = () => {
    if (currentFlatIndex > 0) {
      const prev = allSections[currentFlatIndex - 1];
      setActiveChapterIndex(prev.cIndex);
      setActiveSectionIndex(prev.sIndex);
    }
  };

  if (loading) return <div className="p-10 text-center font-medium text-slate-500">⏳ Đang tải giáo trình...</div>;
  if (error) return <div className="p-10 text-center text-red-500 font-medium">{error}</div>;
  if (!course) return <div className="p-10 text-center font-medium">Không tìm thấy khóa học</div>;

  return (
    <div className="bg-slate-50 font-sans text-slate-800 h-screen flex flex-col overflow-hidden">
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .prose-code { background-color: #f1f5f9; color: #db2777; padding: 0.125rem 0.375rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; }
        .markdown-body h1 { font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem; color: #0f172a; }
        .markdown-body h2 { font-size: 1.25rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #1e293b; }
        .markdown-body h3 { font-size: 1.1rem; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #334155; }
        .markdown-body p { margin-bottom: 1rem; line-height: 1.8; color: #334155; }
        .markdown-body ul { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 1rem; }
        .markdown-body pre { background-color: #0d1117; color: #c9d1d9; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; margin-bottom: 1rem; font-family: monospace; font-size: 0.875rem; }
      `}</style>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">IT</div>
          <h1 className="text-xl font-bold text-slate-800">CodeEdu AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm font-medium text-slate-600">
            {user ? (
              <div className="flex items-center gap-2">
                <span>{user.username}</span>
                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Sinh viên</span>
              </div>
            ) : (
              'Guest'
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-blue-500 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Student" alt="Avatar" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex w-full overflow-hidden relative">
        
        {/* Sidebar Danh mục khóa học */}
        <aside className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-hidden flex-shrink-0">
          <div 
            className="p-4 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-3 cursor-pointer transition-colors"
            onClick={() => navigate('/docs')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" /></svg>
            <h2 className="font-bold text-sm tracking-wide truncate">Quay lại</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {course.chapters?.map((chapter, cIndex) => (
              <div key={cIndex}>
                <div className="bg-slate-200/50 px-4 py-3 border-y border-slate-200">
                  <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">Chương {cIndex + 1}. {chapter.chapterTitle}</span>
                </div>
                <nav className="flex flex-col text-sm">
                  {chapter.sections?.map((section, sIndex) => {
                    const isActive = cIndex === activeChapterIndex && sIndex === activeSectionIndex;
                    return (
                      <button 
                        key={sIndex}
                        onClick={() => { setActiveChapterIndex(cIndex); setActiveSectionIndex(sIndex); setActiveTab('theory'); }}
                        className={`px-4 py-3.5 text-left transition-all border-l-4 flex items-center justify-between ${
                          isActive 
                          ? 'bg-blue-50 text-blue-700 border-blue-600 font-bold' 
                          : 'text-slate-600 hover:bg-slate-100 border-transparent font-medium'
                        }`}
                      >
                        <span className="line-clamp-2 leading-relaxed">{sIndex + 1}. {section.sectionTitle}</span>
                        {isActive && <svg className="w-5 h-5 shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>
        </aside>

        {/* Nội dung chính (Lý thuyết / Thực hành) */}
        <div className="flex-1 flex flex-col h-full bg-white relative shadow-inner">
          {activeSectionData ? (
            <>
              {/* Tab chuyển đổi Lý thuyết / Thực hành */}
              <div className="bg-slate-50 border-b border-slate-200 px-8 py-3 flex gap-4 shrink-0">
                <button 
                  onClick={() => setActiveTab('theory')}
                  className={`px-5 py-2 rounded-lg font-bold transition-colors ${activeTab === 'theory' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                  📖 Lý thuyết
                </button>
                <button 
                  onClick={() => setActiveTab('practice')}
                  className={`px-5 py-2 rounded-lg font-bold transition-colors ${activeTab === 'practice' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                  💻 Thực hành
                </button>
              </div>

              {activeTab === 'theory' ? (
                /* KHU VỰC LÝ THUYẾT */
                <div className="flex-1 overflow-y-auto bg-white scroll-smooth relative">
                  <div className="max-w-4xl mx-auto px-8 py-10 lg:px-12 flex flex-col min-h-full">
                    <div className="mb-8 pb-6 border-b-2 border-slate-100">
                      <span className="text-xs font-bold text-blue-500/80 uppercase tracking-widest block mb-2">Chương {activeChapterIndex + 1} &gt; Bài {activeSectionIndex + 1}</span>
                      <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">{activeSectionData.sectionTitle}</h1>
                    </div>
                  
                  <div className="flex-1 markdown-body">
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          return inline ? (
                            <code className="prose-code" {...props}>{children}</code>
                          ) : (
                            <code className={className} {...props}>{children}</code>
                          )
                        }
                      }}
                    >
                      {activeSectionData.content.replace(/##/g, '###')}
                    </ReactMarkdown>
                  </div>

                  <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between items-center gap-4">
                    <button onClick={handlePrev} disabled={currentFlatIndex === 0} className={`px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 ${currentFlatIndex === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                      Bài trước
                    </button>
                    
                    <button onClick={handleNext} disabled={currentFlatIndex === allSections.length - 1} className={`px-5 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2 ${currentFlatIndex === allSections.length - 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}>
                      Bài tiếp theo
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                  </div>
                  </div>
                </div>
              ) : (
                /* KHU VỰC THỰC HÀNH */
                <div className="flex-1 overflow-y-auto bg-slate-50 flex flex-col p-10">
                  <div className="max-w-4xl mx-auto w-full">
                    <div className="flex items-center gap-4 mb-8 border-b-2 border-slate-200 pb-6">
                      <span className="text-5xl">💻</span>
                      <div>
                        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight">Workspace Thực Hành</h3>
                        <p className="text-slate-500 font-medium mt-1">Bài học: {activeSectionData.sectionTitle}</p>
                      </div>
                    </div>

                    {problemsLoading ? (
                      <div className="text-center text-slate-500 py-10 font-medium">⏳ Đang tải bài tập...</div>
                    ) : sectionProblems.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {/* Tiến độ */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-4 flex items-center justify-between">
                          <span className="font-bold text-slate-700">Tiến độ bài tập:</span>
                          <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold text-sm">
                            {sectionProblems.filter(p => userSubmissions.some(s => s.problem.id === p.id && s.status === 'PASSED')).length} / {sectionProblems.length} Hoàn thành
                          </span>
                        </div>

                        {sectionProblems.map((prob, idx) => {
                          const isPassed = userSubmissions.some(s => s.problem.id === prob.id && s.status === 'PASSED');
                          return (
                            <button 
                              key={prob.id}
                              onClick={() => navigate(`/problems/${prob.id}`)}
                              className={`w-full text-left bg-white border-2 hover:bg-slate-50 py-4 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-between group ${isPassed ? 'border-emerald-500' : 'border-slate-200 hover:border-blue-400'}`}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {isPassed ? '✓' : (idx + 1)}
                                </div>
                                <div>
                                  <h4 className={`text-lg font-bold ${isPassed ? 'text-emerald-700' : 'text-slate-800'}`}>{prob.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{prob.language}</span>
                                    <span className="text-xs text-slate-400">⏱ {prob.timeLimitMs}ms</span>
                                  </div>
                                </div>
                              </div>
                              <span className="text-2xl text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">→</span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center bg-white border-2 border-dashed border-slate-300 rounded-3xl p-16">
                        <span className="text-5xl mb-4 block opacity-50">📭</span>
                        <h4 className="text-xl font-bold text-slate-700 mb-2">Chưa có bài tập nào</h4>
                        <p className="text-slate-500 mb-6 max-w-md mx-auto">Giảng viên chưa cập nhật bài tập thực hành cho phần lý thuyết này. Bạn có thể sang danh sách bài tập chung để làm các bài khác.</p>
                        <button 
                          onClick={() => navigate('/problems')}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-all"
                        >
                          Tới Danh Sách Bài Tập Chung
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <span className="text-6xl opacity-30">📚</span>
              <p className="font-medium">Hãy chọn một bài học ở menu bên trái</p>
            </div>
          )}
        </div>

        {/* Cột Chat AI Assistant (Tạm đóng theo yêu cầu) */}
        {/* 
        <div className="w-[300px] h-full bg-slate-50 flex flex-col border-l border-slate-200 flex-shrink-0 z-20">
          ... (AI Assistant code) ...
        </div> 
        */}
      </main>

    </div>
  );
};

export default CourseViewer;
