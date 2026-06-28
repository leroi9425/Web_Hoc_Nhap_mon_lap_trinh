import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AdminExamManager = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]);
    const [problems, setProblems] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [saving, setSaving] = useState(false);
    
    // Form State
    const [editingExamId, setEditingExamId] = useState(null);
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

    const openModal = (mode, exam = null) => {
        setModalMode(mode);
        if (mode === 'edit' && exam) {
            setEditingExamId(exam.id);
            setTitle(exam.title);
            setDurationMinutes(exam.durationMinutes);
            setSelectedProblemIds(exam.problems?.map(p => p.id) || []);
        } else {
            setEditingExamId(null);
            setTitle('');
            setDurationMinutes(90);
            setSelectedProblemIds([]);
        }
        setSearchTerm('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleToggleProblem = (id) => {
        setSelectedProblemIds(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    const handleSaveExam = async () => {
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
            if (modalMode === 'create') {
                await axios.post(`${BACKEND}/api/exams`, {
                    title,
                    durationMinutes,
                    problemIds: selectedProblemIds
                });
                alert("✅ Tạo Đề thi thành công!");
            } else {
                await axios.put(`${BACKEND}/api/exams/${editingExamId}`, {
                    title,
                    durationMinutes,
                    problemIds: selectedProblemIds
                });
                alert("✅ Cập nhật Đề thi thành công!");
            }
            closeModal();
            fetchData();
        } catch (error) {
            console.error("Save exam error:", error);
            alert("❌ Lỗi khi lưu đề thi: " + (error.response?.data || error.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đề thi này không? Hành động này không thể hoàn tác.")) {
            return;
        }
        try {
            await axios.delete(`${BACKEND}/api/exams/${id}`);
            alert("✅ Đã xóa đề thi thành công!");
            fetchData();
        } catch (error) {
            console.error("Delete exam error:", error);
            alert("❌ Lỗi khi xóa đề thi: " + (error.response?.data || error.message));
        }
    };

    const filteredProblems = problems.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-4rem)] p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Quản lý Đề thi</h1>
                        <p className="text-slate-500 text-sm">Soạn thảo và quản lý ngân hàng đề thi của bạn</p>
                    </div>
                    <button 
                        onClick={() => openModal('create')} 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-lg flex items-center gap-2 transition"
                    >
                        + Tạo đề thi mới
                    </button>
                </div>

                {/* Bảng danh sách đề thi */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Tên đề thi</th>
                                <th className="px-6 py-4">Thời gian</th>
                                <th className="px-6 py-4">Số lượng bài</th>
                                <th className="px-6 py-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Đang tải dữ liệu...</td>
                                </tr>
                            ) : exams.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Chưa có đề thi nào. Hãy tạo mới!</td>
                                </tr>
                            ) : (
                                exams.map(exam => (
                                    <tr key={exam.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-bold text-slate-800">{exam.title}</td>
                                        <td className="px-6 py-4">{exam.durationMinutes} phút</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">
                                                {exam.problems?.length || 0} bài
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 flex justify-center gap-3">
                                            <button 
                                                onClick={() => navigate(`/exams/${exam.id}`)}
                                                className="text-slate-400 hover:text-blue-600 text-lg transition-colors" 
                                                title="Xem thử"
                                            >
                                                👁️
                                            </button>
                                            <button 
                                                onClick={() => openModal('edit', exam)}
                                                className="text-slate-400 hover:text-orange-600 text-lg transition-colors"
                                                title="Sửa"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteExam(exam.id)}
                                                className="text-slate-400 hover:text-red-600 text-lg transition-colors"
                                                title="Xóa"
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Form (Dùng chung cho Tạo & Sửa) */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl p-6">
                        <h2 className="text-xl font-bold mb-6">
                            {modalMode === 'edit' ? 'Chỉnh sửa đề thi' : 'Tạo đề thi mới'}
                        </h2>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <input 
                                type="text" 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Tên đề thi" 
                                className="col-span-2 p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 transition-colors"
                            />
                            <input 
                                type="number" 
                                value={durationMinutes}
                                onChange={e => setDurationMinutes(e.target.value)}
                                placeholder="Thời gian (Phút)" 
                                className="p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 transition-colors"
                            />
                            <input 
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Tìm tên bài tập..."
                                className="p-3 border border-slate-300 rounded-lg outline-none focus:border-blue-500 transition-colors"
                            />
                        </div>

                        {/* Khu vực chọn bài tập */}
                        <div className="border border-slate-300 rounded-lg p-2 h-64 overflow-y-auto mb-6 bg-slate-50">
                            {filteredProblems.length === 0 ? (
                                <div className="text-center p-4 text-slate-500 text-sm">Không tìm thấy bài tập nào.</div>
                            ) : (
                                filteredProblems.map(prob => {
                                    const isSelected = selectedProblemIds.includes(prob.id);
                                    return (
                                        <div 
                                            key={prob.id}
                                            onClick={() => handleToggleProblem(prob.id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors mb-1 ${
                                                isSelected ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-transparent hover:border-slate-200 shadow-sm'
                                            }`}
                                        >
                                            <input 
                                                type="checkbox" 
                                                checked={isSelected}
                                                readOnly
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-slate-700'}`}>
                                                    #{prob.id} - {prob.title}
                                                </span>
                                            </div>
                                            <span className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded">{prob.language}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={closeModal} 
                                disabled={saving}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSaveExam}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? 'Đang lưu...' : 'Lưu đề thi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExamManager;
