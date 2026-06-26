import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BACKEND = 'http://localhost:8080';

export default function ProblemManager() {
    const navigate = useNavigate();
    
    // States for Left Column (Course Navigation)
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    
    // Navigation selection states
    const [selectedCourseId, setSelectedCourseId] = useState(null);
    const [selectedChapterIndex, setSelectedChapterIndex] = useState(null);
    const [selectedSection, setSelectedSection] = useState(null); // { id, title, content }
    
    // Search and Accordion states
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedCourseIds, setExpandedCourseIds] = useState([]);

    // --- NEW STATES FOR FLOW ---
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'create'
    const [teacherPrompt, setTeacherPrompt] = useState('');
    const [previewProblem, setPreviewProblem] = useState(null);
    const [isSavingPreview, setIsSavingPreview] = useState(false);

    // States for Right Column (Problem Creation)
    const [creationMode, setCreationMode] = useState('auto'); // 'auto' | 'manual'
    const [isGeneratingProblem, setIsGeneratingProblem] = useState(false);
    
    // Manual Creation States
    const [manualTitle, setManualTitle] = useState('');
    const [manualDesc, setManualDesc] = useState('');
    const [manualTestCases, setManualTestCases] = useState([{ input: '', expectedOutput: '' }]);
    const [isSavingManual, setIsSavingManual] = useState(false);

    // Existing Problems State
    const [existingProblems, setExistingProblems] = useState([]);
    const [loadingProblems, setLoadingProblems] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [generatedProblem, setGeneratedProblem] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await axios.get(`${BACKEND}/api/courses`);
            setCourses(res.data);
            if (res.data.length > 0) {
                setExpandedCourseIds([res.data[0].id]);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoadingCourses(false);
        }
    };

    const toggleCourse = (cId) => {
        setExpandedCourseIds(prev => prev.includes(cId) ? prev.filter(id => id !== cId) : [...prev, cId]);
    };

    const filteredCourses = courses.map(course => {
        if (!searchTerm) return course;
        
        const matchingChapters = course.chapters?.map(chapter => {
            const matchingSections = chapter.sections?.filter(sec => 
                sec.sectionTitle.toLowerCase().includes(searchTerm.toLowerCase())
            );
            const chapterMatches = chapter.chapterTitle.toLowerCase().includes(searchTerm.toLowerCase());
            
            if (chapterMatches) {
                return chapter;
            }
            return matchingSections?.length > 0 ? { ...chapter, sections: matchingSections } : null;
        }).filter(Boolean);

        const courseMatches = course.courseName.toLowerCase().includes(searchTerm.toLowerCase());
        
        if (courseMatches || matchingChapters?.length > 0) {
            return {
                ...course,
                chapters: courseMatches ? course.chapters : matchingChapters
            };
        }
        return null;
    }).filter(Boolean);

    const fetchExistingProblems = async (sectionId) => {
        setLoadingProblems(true);
        try {
            const url = sectionId === 'GLOBAL' 
                ? `${BACKEND}/api/problems` 
                : `${BACKEND}/api/problems/section/${sectionId}`;
            const res = await axios.get(url);
            setExistingProblems(res.data);
        } catch (error) {
            console.error("Error fetching problems:", error);
            setExistingProblems([]);
        } finally {
            setLoadingProblems(false);
        }
    };

    const handleSelectGlobalBank = () => {
        setSelectedCourseId(null);
        setSelectedChapterIndex(null);
        setSelectedSection({ id: 'GLOBAL', sectionTitle: 'Ngân hàng Bài tập chung', content: '' });
        setViewMode('list');
        setPreviewProblem(null);
        fetchExistingProblems('GLOBAL');
    };

    const handleDeleteProblem = async (problemId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa bài tập này không? Thao tác này sẽ xóa vĩnh viễn bài tập và các Testcase đi kèm!")) return;
        try {
            await axios.delete(`${BACKEND}/api/problems/${problemId}`);
            fetchExistingProblems(selectedSection.id); // Tải lại danh sách
        } catch (error) {
            alert("Lỗi xóa bài tập: " + (error.response?.data?.error || error.message));
        }
    };

    const handleDeleteCourse = async (courseId, e) => {
        e.stopPropagation();
        if (!window.confirm("CẢNH BÁO TỐI CAO: Thao tác này sẽ xóa vĩnh viễn Khóa Học, tất cả Bài Tập, Testcase và cả dữ liệu Vector AI. Bạn chắc chắn muốn xóa chứ?")) return;
        try {
            await axios.delete(`${BACKEND}/api/courses/${courseId}`);
            alert("✅ Đã xóa khóa học thành công!");
            if (selectedCourseId === courseId) {
                setSelectedCourseId(null);
                setSelectedChapterIndex(null);
                setSelectedSection(null);
                setExistingProblems([]);
            }
            fetchCourses(); // Tải lại cây giáo trình
        } catch (error) {
            alert("Lỗi xóa khóa học: " + (error.response?.data?.error || error.message));
        }
    };

    const handleSelectSection = (courseId, cIndex, sectionData) => {
        setSelectedCourseId(courseId);
        setSelectedChapterIndex(cIndex);
        setSelectedSection(sectionData);
        setViewMode('list');
        setPreviewProblem(null);
        fetchExistingProblems(sectionData.id);
    };

    // --- AI GENERATION LOGIC ---
    const handleGenerateProblem = async () => {
        if (!selectedSection) return;
        setIsGeneratingProblem(true);
        try {
            const response = await axios.post(`${BACKEND}/api/problems/auto-generate`, {
                content: selectedSection.content || '',
                sectionId: selectedSection.id === 'GLOBAL' ? null : selectedSection.id,
                teacherPrompt: teacherPrompt
            });
            setPreviewProblem(response.data);
        } catch (err) {
            alert("Lỗi: " + err.message);
        } finally {
            setIsGeneratingProblem(false);
        }
    };

    const handleSavePreview = async () => {
        if (!previewProblem) return;
        setIsSavingPreview(true);
        try {
            const url = selectedSection.id === 'GLOBAL' 
                ? `${BACKEND}/api/problems` 
                : `${BACKEND}/api/problems?sectionId=${selectedSection.id}`;
            const probRes = await axios.post(url, previewProblem);
            const savedProblem = probRes.data;
            
            setGeneratedProblem(savedProblem);
            setShowModal(true);
            setPreviewProblem(null);
            setViewMode('list');
            fetchExistingProblems(selectedSection.id);
        } catch (err) {
            alert("Lỗi: " + err.message);
        } finally {
            setIsSavingPreview(false);
        }
    };

    // --- MANUAL PROBLEM CREATION LOGIC ---
    const handleAddTestCase = () => {
        setManualTestCases([...manualTestCases, { input: '', expectedOutput: '' }]);
    };

    const handleRemoveTestCase = (index) => {
        const newTc = [...manualTestCases];
        newTc.splice(index, 1);
        if (newTc.length === 0) newTc.push({ input: '', expectedOutput: '' });
        setManualTestCases(newTc);
    };

    const handleTestCaseChange = (index, field, value) => {
        const newTc = [...manualTestCases];
        newTc[index][field] = value;
        setManualTestCases(newTc);
    };

    const handleSaveManual = async () => {
        if (!manualTitle.trim() || !manualDesc.trim()) {
            alert("Vui lòng nhập Tên bài toán và Mô tả!");
            return;
        }
        
        const validTestCases = manualTestCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim());
        if (validTestCases.length === 0) {
            alert("Vui lòng nhập ít nhất 1 Test Case hợp lệ (có cả Input và Output)!");
            return;
        }

        setIsSavingManual(true);
        try {
            // 1. Create Problem with sectionId
            const url = selectedSection.id === 'GLOBAL' 
                ? `${BACKEND}/api/problems` 
                : `${BACKEND}/api/problems?sectionId=${selectedSection.id}`;
            const probRes = await axios.post(url, {
                title: manualTitle,
                description: manualDesc,
                difficulty: "Dễ" // Default
            });
            const savedProblem = probRes.data;

            // 2. Add Test Cases
            for (const tc of validTestCases) {
                await axios.post(`${BACKEND}/api/problems/${savedProblem.id}/testcases`, {
                    input: tc.input,
                    expectedOutput: tc.expectedOutput,
                    isHidden: false
                });
            }

            setGeneratedProblem(savedProblem);
            setShowModal(true);
            
            // Reset form & refresh list
            setManualTitle('');
            setManualDesc('');
            setManualTestCases([{ input: '', expectedOutput: '' }]);
            fetchExistingProblems(selectedSection.id);
            
        } catch (err) {
            alert("Lỗi: " + err.message);
        } finally {
            setIsSavingManual(false);
        }
    };

    return (
        <div className="bg-slate-50 font-sans text-slate-800 h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center shadow-sm shrink-0 gap-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">IT</div>
                <div>
                    <h1 className="text-lg font-bold text-slate-800 leading-tight">Quản lý Bài tập</h1>
                    <p className="text-[11px] text-slate-500 font-medium">Instructor Dashboard</p>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
                {/* Lệnh Trái: Chọn Tọa độ (Course -> Chapter -> Section) */}
                <aside className="w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shrink-0 shadow-[2px_0_8px_rgba(0,0,0,0.02)]">
                    <div className="p-4 bg-slate-100 border-b border-slate-200 shrink-0">
                        <h2 className="font-bold text-sm text-slate-700 uppercase tracking-wider">🗂️ Cây Giáo Trình</h2>
                        <p className="text-xs text-slate-500 mt-1 mb-3">Chọn một Mục để thêm bài tập</p>
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Tìm khóa học, chương, mục..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2">
                        <button 
                            onClick={handleSelectGlobalBank}
                            className={`w-full text-left px-4 py-3 mb-4 font-bold text-sm rounded-lg flex items-center gap-2 transition-colors ${
                                selectedSection?.id === 'GLOBAL' 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                        >
                            <span>🌐</span> Ngân hàng Bài tập chung
                        </button>

                        {loadingCourses ? (
                            <div className="text-center p-4 text-slate-400 text-sm">Đang tải...</div>
                        ) : filteredCourses.length === 0 ? (
                            <div className="text-center p-4 text-slate-400 text-sm">Không tìm thấy kết quả.</div>
                        ) : (
                            <div className="space-y-2">
                                {filteredCourses.map(course => {
                                    const isExpanded = searchTerm !== '' || expandedCourseIds.includes(course.id);
                                    return (
                                    <div key={course.id} className="border border-slate-200 rounded-lg overflow-hidden transition-all duration-200">
                                        <div 
                                            className="bg-slate-50 px-3 py-2.5 border-b border-slate-200 font-bold text-slate-700 text-sm flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => toggleCourse(course.id)}
                                        >
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                <span className="text-lg shrink-0">📘</span> 
                                                <span className="line-clamp-1 truncate" title={course.courseName}>{course.courseName}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteCourse(course.id, e)} 
                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-red-50 hover:bg-red-100 rounded" 
                                                title="Xóa toàn bộ khóa học này"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                            </button>
                                        </div>
                                        {isExpanded && (
                                        <div className="animate-in slide-in-from-top-2 duration-200">
                                            {course.chapters?.map((chapter, cIndex) => (
                                                <div key={cIndex} className="border-b border-slate-100 last:border-0">
                                                    <div className="px-3 py-1.5 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-8">
                                                        Chương {cIndex + 1}: {chapter.chapterTitle}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        {chapter.sections?.map((section, sIndex) => {
                                                            const isSelected = selectedCourseId === course.id && selectedChapterIndex === cIndex && selectedSection?.id === section.id;
                                                            return (
                                                                <button 
                                                                    key={section.id}
                                                                    onClick={() => handleSelectSection(course.id, cIndex, section)}
                                                                    className={`px-3 py-2 text-left text-sm transition-all pl-10 border-l-2 flex items-center justify-between ${
                                                                        isSelected 
                                                                        ? 'bg-blue-50 text-blue-700 border-blue-600 font-semibold' 
                                                                        : 'text-slate-600 hover:bg-slate-50 border-transparent'
                                                                    }`}
                                                                >
                                                                    <span className="line-clamp-1">{sIndex + 1}. {section.sectionTitle}</span>
                                                                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></span>}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        )}
                                    </div>
                                )})}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Lệnh Phải: Không gian Biên soạn */}
                <div className="flex-1 bg-slate-50/50 flex flex-col overflow-y-auto relative p-8">
                    {!selectedSection ? (
                        <div className="m-auto text-center max-w-md">
                            <div className="text-6xl mb-4 opacity-50">👈</div>
                            <h2 className="text-xl font-bold text-slate-700 mb-2">Chưa chọn Tọa độ</h2>
                            <p className="text-slate-500">Vui lòng chọn một Mục (Section) ở cây thư mục bên trái để bắt đầu thêm bài tập vào đó.</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl w-full mx-auto space-y-6">
                            
                            {/* Tiêu đề của Mục đang chọn */}
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">
                                    <span>Đang cấu hình bài tập cho:</span>
                                </div>
                                <h2 className="text-2xl font-extrabold text-slate-800">{selectedSection.sectionTitle}</h2>
                            </div>

                            {/* CÔNG XƯỞNG SẢN XUẤT */}
                            {viewMode === 'create' && !previewProblem && (
                            <div className="space-y-4">
                                <button onClick={() => setViewMode('list')} className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1 transition-colors">
                                    ← Quay lại danh sách bài tập
                                </button>
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">✨</span>
                                        <h3 className="text-lg font-bold text-slate-800">Biên soạn Bài Tập Mới</h3>
                                    </div>
                                    {/* Toggle Switch */}
                                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                                        <button 
                                            onClick={() => setCreationMode('auto')} 
                                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${creationMode === 'auto' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            🤖 Sinh Tự Động (AI)
                                        </button>
                                        <button 
                                            onClick={() => setCreationMode('manual')} 
                                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${creationMode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            ✍️ Nhập Thủ Công
                                        </button>
                                    </div>
                                </div>

                                {/* AUTO MODE */}
                                {creationMode === 'auto' && (
                                    <div className="bg-slate-900 rounded-xl p-8 flex flex-col items-center justify-center text-center border-4 border-slate-800 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                                        <div className="text-5xl mb-4">🧠</div>
                                        <h4 className="text-white text-lg font-bold mb-2">AI Tự Động Phân Tích Nội Dung</h4>
                                        <p className="text-slate-400 text-sm mb-4 max-w-md">Hệ thống sẽ đọc hiểu nội dung của mục <strong>"{selectedSection.sectionTitle}"</strong> và tự động rặn ra một bài toán lập trình kèm theo Testcase cực chuẩn.</p>
                                        <textarea 
                                            value={teacherPrompt}
                                            onChange={e => setTeacherPrompt(e.target.value)}
                                            placeholder="Gợi ý cho AI (VD: Tính chu vi hình tròn, Quản lý tài khoản ngân hàng...)" 
                                            rows={3}
                                            className="w-full max-w-md px-4 py-3 mb-6 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none resize-y placeholder-slate-500" 
                                        />
                                        <button 
                                            onClick={handleGenerateProblem} 
                                            disabled={isGeneratingProblem} 
                                            className={`w-full max-w-md py-4 font-bold rounded-xl text-lg flex items-center justify-center gap-2 transition-all shadow-xl ${isGeneratingProblem ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white hover:scale-[1.02]'}`}
                                        >
                                            {isGeneratingProblem ? '✨ Đang tạo bài tập. Vui lòng chờ...' : '✨ Yêu cầu AI Sinh Bài Tập Ngay'}
                                        </button>
                                    </div>
                                )}

                                {/* MANUAL MODE */}
                                {creationMode === 'manual' && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên bài toán</label>
                                                <input 
                                                    type="text" 
                                                    value={manualTitle}
                                                    onChange={e => setManualTitle(e.target.value)}
                                                    placeholder="VD: Tính tổng mảng, Đảo ngược chuỗi..." 
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Mô tả chi tiết (Markdown hỗ trợ)</label>
                                                <textarea 
                                                    value={manualDesc}
                                                    onChange={e => setManualDesc(e.target.value)}
                                                    placeholder="Mô tả đề bài, định dạng input, output, giới hạn dữ liệu..." 
                                                    rows={6}
                                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-y bg-white font-mono" 
                                                />
                                            </div>
                                            
                                            <div className="pt-4 border-t border-slate-200">
                                                <div className="flex justify-between items-center mb-4">
                                                    <label className="block text-sm font-bold text-slate-700">Test Cases (Dữ liệu chấm điểm)</label>
                                                    <button onClick={handleAddTestCase} className="text-sm font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors flex items-center gap-1">
                                                        <span>+</span> Thêm Test Case
                                                    </button>
                                                </div>
                                                
                                                <div className="space-y-4">
                                                    {manualTestCases.map((tc, idx) => (
                                                        <div key={idx} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm relative group">
                                                            <div className="flex justify-between items-center mb-3">
                                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded">Test #{idx + 1}</span>
                                                                {manualTestCases.length > 1 && (
                                                                    <button onClick={() => handleRemoveTestCase(idx)} className="text-red-500 hover:text-red-700 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">Xóa Test</button>
                                                                )}
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <span className="text-xs font-bold text-slate-600 block mb-1.5">Input (Đầu vào)</span>
                                                                    <textarea 
                                                                        value={tc.input} 
                                                                        onChange={e => handleTestCaseChange(idx, 'input', e.target.value)}
                                                                        rows={3} 
                                                                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono resize-y" 
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <span className="text-xs font-bold text-slate-600 block mb-1.5">Expected Output (Kết quả mong đợi)</span>
                                                                    <textarea 
                                                                        value={tc.expectedOutput} 
                                                                        onChange={e => handleTestCaseChange(idx, 'expectedOutput', e.target.value)}
                                                                        rows={3} 
                                                                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 font-mono resize-y" 
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <button 
                                                onClick={handleSaveManual}
                                                disabled={isSavingManual}
                                                className={`w-full mt-6 py-3.5 font-bold rounded-xl shadow-md transition-colors text-base ${isSavingManual ? 'bg-slate-400' : 'bg-slate-800 hover:bg-slate-900'} text-white flex justify-center items-center gap-2`}
                                            >
                                                {isSavingManual ? '⏳ Đang lưu vào DB...' : '💾 Lưu Bài Tập & Đóng Gói Testcase'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                </div>
                            </div>
                            )}

                            {viewMode === 'create' && previewProblem && (
                                <div className="space-y-4">
                                    <button onClick={() => setPreviewProblem(null)} className="text-slate-500 hover:text-slate-700 font-bold text-sm flex items-center gap-1 transition-colors">
                                        ← Hủy bản nháp, tạo bài khác
                                    </button>
                                    
                                    <div className="bg-white p-8 rounded-xl shadow-lg border border-blue-200 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-bl-lg">PREVIEW MODE</div>
                                        
                                        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">{previewProblem.title}</h2>
                                        <div className="prose prose-sm max-w-none mb-6 p-4 bg-slate-50 rounded-lg border border-slate-100 whitespace-pre-wrap">
                                            {previewProblem.description}
                                        </div>
                                        
                                        {previewProblem.referenceCode && (
                                            <div className="mb-6">
                                                <h4 className="text-sm font-bold text-slate-700 mb-2">Code tham khảo (C++)</h4>
                                                <pre className="bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                                                    <code>{previewProblem.referenceCode}</code>
                                                </pre>
                                            </div>
                                        )}
                                        
                                        <div className="mb-8">
                                            <h4 className="text-sm font-bold text-slate-700 mb-3">Test Cases sinh tự động ({previewProblem.testCases?.length || 0})</h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {previewProblem.testCases?.map((tc, idx) => (
                                                    <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200 text-xs font-mono">
                                                        <div className="font-bold text-slate-500 mb-1">Input:</div>
                                                        <div className="mb-2 whitespace-pre-wrap">{tc.input}</div>
                                                        <div className="font-bold text-slate-500 mb-1">Output:</div>
                                                        <div className="text-blue-600 whitespace-pre-wrap">{tc.expectedOutput}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        <button 
                                            onClick={handleSavePreview}
                                            disabled={isSavingPreview}
                                            className={`w-full py-4 font-bold rounded-xl shadow-xl transition-all text-lg flex justify-center items-center gap-2 ${isSavingPreview ? 'bg-slate-400 text-white cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white hover:scale-[1.02]'}`}
                                        >
                                            {isSavingPreview ? '⏳ Đang lưu...' : '💾 Chốt! Lưu bài tập này vào CSDL'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {viewMode === 'list' && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                {/* HEADER: Tên & Các nút hành động */}
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                    <h3 className="text-xl font-bold text-slate-800">
                                        Quản lý Bài tập
                                    </h3>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={() => { setViewMode('create'); setCreationMode('auto'); }} 
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded shadow-md transition flex items-center gap-2"
                                        >
                                            <span className="text-lg">✨</span> Sinh đề bằng AI
                                        </button>
                                        <button 
                                            onClick={() => { setViewMode('create'); setCreationMode('manual'); }} 
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded shadow-md transition flex items-center gap-2"
                                        >
                                            <span className="text-lg">+</span> Thêm thủ công
                                        </button>
                                    </div>
                                </div>
                                
                                {loadingProblems ? (
                                    <div className="text-center py-6 text-slate-500">Đang tải danh sách...</div>
                                ) : existingProblems.length === 0 ? (
                                    <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                        <span className="text-3xl mb-2 block opacity-50">📭</span>
                                        <p className="text-slate-500 font-medium">Chưa có bài tập nào được tạo cho Mục này.</p>
                                    </div>
                                ) : (
                                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                                    <th className="p-4 font-medium w-16 text-center">STT</th>
                                                    <th className="p-4 font-medium">Tên bài</th>
                                                    <th className="p-4 font-medium">Tên chương bài tập</th>
                                                    <th className="p-4 font-medium w-32 text-center">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {existingProblems.map((prob, idx) => (
                                                    <tr key={prob.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                                        <td className="p-4 text-center text-slate-500 font-medium">
                                                            #{idx + 1}
                                                        </td>
                                                        <td className="p-4 font-bold text-slate-700">
                                                            {prob.title}
                                                        </td>
                                                        <td className="p-4 text-slate-500 text-sm">
                                                            {selectedSection.sectionTitle}
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex justify-center gap-3">
                                                                <button 
                                                                    onClick={() => navigate(`/problem/${prob.id}`)} 
                                                                    className="text-blue-500 hover:text-blue-700 transition"
                                                                    title="Chỉnh sửa / Xem thử"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleDeleteProblem(prob.id)} 
                                                                    className="text-red-500 hover:text-red-700 transition"
                                                                    title="Xóa bài tập"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            )}

                        </div>
                    )}
                </div>
            </main>

            {/* SUCCESS MODAL */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm">
                    <div className="bg-white p-8 rounded-2xl w-[450px] text-center shadow-2xl transform transition-all scale-100">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">🎉</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tạo thành công!</h2>
                        <p className="text-slate-600 mb-8 leading-relaxed">
                            Đã ghim bài tập vào CSDL:<br/>
                            <strong className="text-blue-600 text-lg mt-2 inline-block">{generatedProblem?.title}</strong><br/>
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors">
                                Đóng
                            </button>
                            <button onClick={() => navigate(`/problem/${generatedProblem?.id}`)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center gap-2">
                                💻 Test thử bài này
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
