import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, RefreshCw, FileText, CheckSquare, Square, Trash2 } from 'lucide-react';

const BACKEND = 'https://datn-java-backend.onrender.com';

const AdminExamManager = () => {
    const [exams, setExams] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [durationMinutes, setDurationMinutes] = useState(90);
    const [selectedProblemIds, setSelectedProblemIds] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [examsRes, problemsRes] = await Promise.all([
                axios.get(`${BACKEND}/api/exams`),
                axios.get(`${BACKEND}/api/problems`)
            ]);
            setExams(examsRes.data);
            setProblems(problemsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleToggleProblem = (id) => {
        setSelectedProblemIds(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            alert("Vui lòng nhập tên đề thi!");
            return;
        }
        if (selectedProblemIds.length === 0) {
            alert("Vui lòng chọn ít nhất 1 bài tập!");
            return;
        }

        setSaving(true);
        try {
            await axios.post(`${BACKEND}/api/exams`, {
                title,
                durationMinutes,
                problemIds: selectedProblemIds
            });
            alert("✅ Tạo Đề thi thành công!");
            setTitle('');
            setDurationMinutes(90);
            setSelectedProblemIds([]);
            fetchData();
        } catch (error) {
            console.error("Create exam error:", error);
            alert("❌ Lỗi khi tạo đề thi: " + (error.response?.data || error.message));
        } finally {
            setSaving(false);
        }
    };

    const filteredProblems = problems.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto font-sans h-[calc(100vh-4rem)] flex flex-col">
            <div className="mb-6 shrink-0">
                <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <FileText className="text-indigo-600" size={32} />
                    Quản lý Đề Thi (Manual Mode)
                </h1>
                <p className="text-slate-500">Tạo đề thi bằng cách chọn các bài tập từ Ngân hàng Câu hỏi.</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
                {/* Khu vực Tạo đề thi */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 bg-indigo-50 border-b border-indigo-100 shrink-0">
                        <h2 className="font-bold text-indigo-900 flex items-center gap-2">
                            <Plus size={18} />
                            Tạo Đề Thi Mới
                        </h2>
                    </div>
                    <div className="p-5 flex-1 flex flex-col min-h-0">
                        <div className="space-y-4 shrink-0 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tên Đề Thi</label>
                                <input 
                                    type="text" 
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    placeholder="VD: Đề thi Giữa kỳ C++"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian làm bài (Phút)</label>
                                <input 
                                    type="number" 
                                    value={durationMinutes}
                                    onChange={e => setDurationMinutes(e.target.value)}
                                    min="1"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        {/* Danh sách chọn bài */}
                        <div className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden min-h-0">
                            <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-bold text-slate-700">Chọn Bài Tập ({selectedProblemIds.length} đã chọn)</label>
                                </div>
                                <input 
                                    type="text"
                                    placeholder="Tìm tên bài tập..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="flex-1 overflow-y-auto bg-white p-2 space-y-1">
                                {loading ? (
                                    <div className="text-center p-4 text-slate-400 text-sm">Đang tải ngân hàng câu hỏi...</div>
                                ) : filteredProblems.length === 0 ? (
                                    <div className="text-center p-4 text-slate-400 text-sm">Không tìm thấy bài tập nào.</div>
                                ) : (
                                    filteredProblems.map(prob => {
                                        const isSelected = selectedProblemIds.includes(prob.id);
                                        return (
                                            <div 
                                                key={prob.id}
                                                onClick={() => handleToggleProblem(prob.id)}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                                                    isSelected ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-transparent hover:bg-slate-50'
                                                }`}
                                            >
                                                <div className={`shrink-0 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                    {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium truncate ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                        #{prob.id} - {prob.title}
                                                    </p>
                                                    <div className="flex gap-2 mt-0.5">
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{prob.language}</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">{prob.difficulty || 'Dễ'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateExam}
                            disabled={saving}
                            className="mt-4 shrink-0 w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {saving ? <RefreshCw className="animate-spin" size={18} /> : <Plus size={18} />}
                            {saving ? 'Đang lưu...' : 'Lưu Đề Thi'}
                        </button>
                    </div>
                </div>

                {/* Danh sách Đề Thi */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0">
                        <h2 className="font-bold text-slate-800">Danh sách Đề Thi hiện có</h2>
                        <button onClick={fetchData} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400">Đang tải...</div>
                        ) : exams.length === 0 ? (
                            <div className="p-12 text-center flex flex-col items-center">
                                <FileText size={48} className="text-slate-200 mb-3" />
                                <p className="text-slate-500 font-medium">Chưa có đề thi nào.</p>
                                <p className="text-sm text-slate-400 mt-1">Hãy tạo đề thi đầu tiên!</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Tên Đề Thi</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Thời Gian</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Số Lượng Bài</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {exams.map((exam) => (
                                        <tr key={exam.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium text-indigo-600">{exam.title}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{exam.durationMinutes} phút</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    {exam.problems?.length || 0} bài tập
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminExamManager;
