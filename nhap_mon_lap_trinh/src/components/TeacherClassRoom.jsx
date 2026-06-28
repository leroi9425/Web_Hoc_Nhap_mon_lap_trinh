import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Custom hook for debouncing
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}

const TeacherClassRoom = () => {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    
    // Data states
    const [classes, setClasses] = useState([]);
    const [problems, setProblems] = useState([]);
    const [assignmentsCount, setAssignmentsCount] = useState({});
    
    // Form states (Create Class)
    const [className, setClassName] = useState('');
    const [createClassEmails, setCreateClassEmails] = useState([]); // Changed from string to array for pills
    const [createSearchQuery, setCreateSearchQuery] = useState('');
    const [createSuggestions, setCreateSuggestions] = useState([]);
    
    // Form states (Assign Problem)
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedProblemId, setSelectedProblemId] = useState('');
    const [deadline, setDeadline] = useState('');
    
    // Manage Students Modal States
    const [manageModalClass, setManageModalClass] = useState(null);
    const [currentEmailsList, setCurrentEmailsList] = useState([]);
    const [manageSearchQuery, setManageSearchQuery] = useState('');
    const [manageSuggestions, setManageSuggestions] = useState([]);
    const [filterStudentQuery, setFilterStudentQuery] = useState('');
    
    // Modal visibility states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [assignModalClassName, setAssignModalClassName] = useState('');
    const [viewingClass, setViewingClass] = useState(null);
    const [viewingAssignments, setViewingAssignments] = useState([]);

    // Debounced search queries
    const debouncedCreateSearch = useDebounce(createSearchQuery, 300);
    const debouncedManageSearch = useDebounce(manageSearchQuery, 300);

    useEffect(() => {
        fetchClasses();
        fetchProblems();
    }, []);

    // Search effect for Create Class Modal
    useEffect(() => {
        if (debouncedCreateSearch) {
            searchUsers(debouncedCreateSearch).then(setCreateSuggestions);
        } else {
            setCreateSuggestions([]);
        }
    }, [debouncedCreateSearch]);

    // Search effect for Manage Students Modal
    useEffect(() => {
        if (debouncedManageSearch) {
            searchUsers(debouncedManageSearch).then(setManageSuggestions);
        } else {
            setManageSuggestions([]);
        }
    }, [debouncedManageSearch]);

    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    const searchUsers = async (query) => {
        try {
            const res = await axios.get(`${BACKEND}/api/users/search?q=${query}`, getAuthHeaders());
            return res.data;
        } catch (e) {
            console.error(e);
            return [];
        }
    };

    const fetchClasses = async () => {
        try {
            const res = await axios.get(`${BACKEND}/api/classrooms`, getAuthHeaders());
            setClasses(res.data);
            if (res.data.length > 0 && !selectedClassId) {
                setSelectedClassId(res.data[0].id);
            }
            
            const counts = {};
            for (let c of res.data) {
                try {
                    const assignRes = await axios.get(`${BACKEND}/api/classrooms/${c.id}/assignments`, getAuthHeaders());
                    counts[c.id] = assignRes.data.length;
                } catch (e) {
                    counts[c.id] = 0;
                }
            }
            setAssignmentsCount(counts);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const fetchProblems = async () => {
        try {
            const res = await axios.get(`${BACKEND}/api/problems`, getAuthHeaders());
            setProblems(res.data);
            if (res.data.length > 0) setSelectedProblemId(res.data[0].id);
        } catch (error) {
            console.error('Error fetching problems:', error);
        }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        const studentEmailsStr = createClassEmails.join(', ');
        try {
            await axios.post(`${BACKEND}/api/classrooms`, { name: className, studentEmails: studentEmailsStr }, getAuthHeaders());
            alert('Tạo lớp thành công!');
            closeCreateModal();
            fetchClasses();
        } catch (error) {
            alert('Lỗi khi tạo lớp');
        }
    };

    const handleAssignProblem = async (e) => {
        e.preventDefault();
        if (!selectedClassId || !selectedProblemId || !deadline) {
            alert('Vui lòng điền đủ thông tin');
            return;
        }
        try {
            await axios.post(`${BACKEND}/api/classrooms/${selectedClassId}/assignments`, {
                problemId: selectedProblemId,
                deadline: deadline
            }, getAuthHeaders());
            alert('Giao bài thành công!');
            closeAssignModal();
            fetchClasses(); 
        } catch (error) {
            alert('Lỗi khi giao bài');
        }
    };

    // Modal Handlers
    const openCreateModal = () => setIsCreateModalOpen(true);
    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setClassName('');
        setCreateClassEmails([]);
        setCreateSearchQuery('');
        setCreateSuggestions([]);
    };

    const openAssignModal = (classId, cName) => {
        setSelectedClassId(classId);
        setAssignModalClassName(cName);
        setDeadline('');
        setIsAssignModalOpen(true);
    };
    const closeAssignModal = () => setIsAssignModalOpen(false);

    const openManageModal = (c) => {
        setManageModalClass(c);
        if (c.studentEmails) {
            setCurrentEmailsList(c.studentEmails.split(',').map(e => e.trim()).filter(e => e !== ''));
        } else {
            setCurrentEmailsList([]);
        }
        setIsManageModalOpen(true);
    };
    
    const closeManageModal = () => {
        setIsManageModalOpen(false);
        setManageModalClass(null);
        setManageSearchQuery('');
        setManageSuggestions([]);
        setFilterStudentQuery('');
    };

    const [viewingStudents, setViewingStudents] = useState([]);

    const openViewModal = async (c) => {
        setViewingClass(c);
        setIsViewModalOpen(true);
        try {
            const assignRes = await axios.get(`${BACKEND}/api/classrooms/${c.id}/assignments`, getAuthHeaders());
            setViewingAssignments(assignRes.data);

            if (c.studentEmails && c.studentEmails.trim() !== '') {
                const emailsList = c.studentEmails.split(',').map(e => e.trim()).filter(e => e !== '');
                const usersRes = await axios.post(`${BACKEND}/api/users/by-emails`, emailsList, getAuthHeaders());
                setViewingStudents(usersRes.data);
            } else {
                setViewingStudents([]);
            }
        } catch (e) {
            console.error('Error fetching details for class', e);
            setViewingAssignments([]);
            setViewingStudents([]);
        }
    };
    
    const closeViewModal = () => {
        setIsViewModalOpen(false);
        setViewingClass(null);
        setViewingAssignments([]);
        setViewingStudents([]);
    };

    // Pill Handlers (Create Class)
    const addEmailToCreateClass = (email) => {
        if (!createClassEmails.includes(email)) {
            setCreateClassEmails([...createClassEmails, email]);
        }
        setCreateSearchQuery('');
        setCreateSuggestions([]);
    };
    const removeEmailFromCreateClass = (email) => {
        setCreateClassEmails(createClassEmails.filter(e => e !== email));
    };

    // Pill Handlers (Manage Students)
    const addEmailToManageClass = (email) => {
        if (!currentEmailsList.includes(email)) {
            setCurrentEmailsList([...currentEmailsList, email]);
        }
        setManageSearchQuery('');
        setManageSuggestions([]);
    };
    const removeEmailFromManageClass = (email) => {
        setCurrentEmailsList(currentEmailsList.filter(e => e !== email));
    };

    const handleSaveManageClass = async () => {
        if (window.confirm('Bạn có chắc chắn muốn cập nhật danh sách sinh viên này vào lớp không?')) {
            try {
                await axios.put(`${BACKEND}/api/classrooms/${manageModalClass.id}/students`, {
                    studentEmails: currentEmailsList.join(',')
                }, getAuthHeaders());
                alert('Cập nhật danh sách sinh viên thành công!');
                closeManageModal();
                fetchClasses();
            } catch (error) {
                console.error(error);
                alert('Lỗi khi lưu danh sách sinh viên');
            }
        }
    };

    const countStudents = (emails) => {
        if (!emails) return 0;
        return emails.split(',').filter(e => e.trim() !== '').length;
    };

    return (
        <div className="flex-1 bg-slate-50 overflow-y-auto p-8 lg:p-10 scroll-smooth h-full">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900">Quản lý Lớp học & Giao bài</h2>
                    <p className="text-slate-500 text-sm mt-1">Theo dõi tiến độ, danh sách sinh viên và giao bài tập cho từng lớp.</p>
                </div>
                <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md flex items-center gap-2 transform hover:scale-105">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    Tạo Lớp Mới
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                {classes && classes.map(c => (
                    <div 
                        key={c.id} 
                        onClick={() => openViewModal(c)}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col relative group overflow-hidden cursor-pointer hover:border-blue-300"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
                                {c.id}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors">{c.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Mã lớp: CLS-{c.id}A9</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-500 font-medium">Sĩ số</p>
                                <p className="text-lg font-bold text-slate-800">{countStudents(c.studentEmails)} <span className="text-sm font-normal text-slate-400">SV</span></p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-600 font-medium">Bài tập đang mở</p>
                                <p className="text-lg font-bold text-blue-800">{assignmentsCount[c.id] !== undefined ? assignmentsCount[c.id] : '...'} <span className="text-sm font-normal text-blue-500">Bài</span></p>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2">
                            <button onClick={(e) => { e.stopPropagation(); openManageModal(c); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-[13px] transition-colors shadow-sm flex justify-center items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                Danh sách SV
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); openAssignModal(c.id, c.name); }} className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2.5 rounded-xl text-[13px] transition-colors shadow-sm flex justify-center items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                Giao Bài
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Tạo Lớp Học Mới */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 lg:p-8 transform transition-transform scale-100 border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Tạo Lớp Học Mới</h3>
                            <button type="button" onClick={closeCreateModal} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleCreateClass} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Tên Lớp</label>
                                <input 
                                    type="text" 
                                    required
                                    value={className}
                                    onChange={e => setClassName(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm" 
                                    placeholder="Nhập mã hoặc tên lớp học..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Thêm Sinh viên
                                </label>
                                
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={createSearchQuery}
                                        onChange={e => setCreateSearchQuery(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-mono" 
                                        placeholder="Gõ email để tìm kiếm..."
                                    />
                                    {createSuggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {createSuggestions.map(u => (
                                                <li 
                                                    key={u.id} 
                                                    onClick={() => addEmailToCreateClass(u.email)}
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 font-mono border-b border-slate-50 last:border-0"
                                                >
                                                    {u.email}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Khu vực hiển thị Thẻ (Pills) sinh viên đã thêm */}
                                <div className="mt-3 flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                    {createClassEmails.map(email => (
                                        <span key={email} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium font-mono">
                                            {email}
                                            <button type="button" onClick={() => removeEmailFromCreateClass(email)} className="hover:text-red-500 transition-colors">
                                                &times;
                                            </button>
                                        </span>
                                    ))}
                                    {createClassEmails.length === 0 && (
                                        <span className="text-xs text-slate-400 italic">Chưa có sinh viên nào. Gõ để tìm kiếm và thêm.</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={closeCreateModal} className="flex-1 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">Hủy bỏ</button>
                                <button type="submit" className="flex-1 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md transition-colors">Khởi tạo Lớp</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Giao Bài Tập */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 lg:p-8 transform transition-transform scale-100 border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Giao Bài Tập</h3>
                                <p className="text-sm text-blue-600 font-medium mt-1">Lớp: {assignModalClassName}</p>
                            </div>
                            <button type="button" onClick={closeAssignModal} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleAssignProblem} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn Bài Tập từ Giáo Trình</label>
                                <select 
                                    required
                                    value={selectedProblemId} 
                                    onChange={e => setSelectedProblemId(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm cursor-pointer"
                                >
                                    <option value="" disabled>-- Chọn bài tập --</option>
                                    {problems && problems.map(p => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Hạn nộp (Deadline)</label>
                                <div className="relative">
                                    <input 
                                        type="datetime-local" 
                                        required
                                        value={deadline}
                                        onChange={e => setDeadline(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-700 font-medium" 
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={closeAssignModal} className="flex-1 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors">Hủy</button>
                                <button type="submit" className="flex-1 px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white font-bold shadow-md transition-colors flex items-center justify-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    Giao Bài Ngay
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Quản lý Sinh viên */}
            {isManageModalOpen && manageModalClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity py-10">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 lg:p-8 transform transition-transform scale-100 border border-slate-200 flex flex-col max-h-full">
                        
                        <div className="flex justify-between items-center mb-6 flex-shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Quản lý Sinh viên</h3>
                                <p className="text-sm text-blue-600 font-medium mt-1">Lớp: {manageModalClass.name}</p>
                            </div>
                            <button type="button" onClick={closeManageModal} className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full p-2 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        
                        <div className="mb-6 flex-shrink-0 relative">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Tìm và thêm sinh viên</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="text" 
                                        value={manageSearchQuery}
                                        onChange={e => setManageSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (manageSearchQuery.trim()) {
                                                    addEmailToManageClass(manageSearchQuery.trim());
                                                    setManageSearchQuery('');
                                                }
                                            }
                                        }}
                                        placeholder="Gõ email để tìm kiếm..." 
                                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm font-mono" 
                                    />
                                    {manageSuggestions.length > 0 && (
                                        <ul className="absolute z-50 w-full bg-white border border-slate-200 mt-1 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {manageSuggestions.map(u => (
                                                <li 
                                                    key={u.id} 
                                                    onClick={() => {
                                                        addEmailToManageClass(u.email);
                                                        setManageSearchQuery('');
                                                    }}
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-slate-700 font-mono border-b border-slate-50 last:border-0"
                                                >
                                                    {u.email}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => {
                                        if (manageSearchQuery.trim()) {
                                            addEmailToManageClass(manageSearchQuery.trim());
                                            setManageSearchQuery('');
                                        }
                                    }}
                                    className="px-4 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0"
                                >
                                    Thêm
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 min-h-[200px]">
                            <div className="flex justify-between items-center mb-3 sticky top-0 bg-white pb-2 border-b border-slate-100 z-10">
                                <label className="block text-sm font-semibold text-slate-700">Danh sách hiện tại</label>
                                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                                    {currentEmailsList.length} SV
                                </span>
                            </div>
                            
                            {currentEmailsList.length > 5 && (
                                <div className="mb-3 sticky top-[42px] bg-white z-10 pb-2">
                                    <input 
                                        type="text" 
                                        value={filterStudentQuery}
                                        onChange={e => setFilterStudentQuery(e.target.value)}
                                        placeholder="🔍 Tìm nhanh sinh viên trong danh sách..." 
                                        className="w-full px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all text-xs font-mono text-slate-600" 
                                    />
                                </div>
                            )}

                            <ul className="space-y-2">
                                {currentEmailsList.filter(email => email.toLowerCase().includes(filterStudentQuery.toLowerCase())).length === 0 && (
                                    <li className="text-sm text-slate-500 italic text-center py-4">
                                        {currentEmailsList.length === 0 ? 'Chưa có sinh viên nào trong lớp này' : 'Không tìm thấy sinh viên phù hợp'}
                                    </li>
                                )}
                                {currentEmailsList.filter(email => email.toLowerCase().includes(filterStudentQuery.toLowerCase())).map((email, idx) => (
                                    <li key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-100 p-3 rounded-lg hover:border-slate-200 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                {email.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-slate-800 font-mono">{email}</span>
                                        </div>
                                        <button type="button" onClick={() => removeEmailFromManageClass(email)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition-colors opacity-0 group-hover:opacity-100" title="Xóa sinh viên này">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                            <button 
                                type="button" 
                                onClick={handleSaveManageClass}
                                className="px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                            >
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Xem Chi Tiết Lớp */}
            {isViewModalOpen && viewingClass && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity p-4">
                    <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl p-6 lg:p-8 transform transition-transform scale-100 border border-slate-200 max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4 shrink-0">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-900">Chi tiết lớp: {viewingClass.name}</h3>
                                <p className="text-sm text-slate-500 mt-1 font-mono">Mã lớp: CLS-{viewingClass.id}A9</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => { closeViewModal(); openManageModal(viewingClass); }} 
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    Quản lý SV
                                </button>
                                <button 
                                    onClick={() => { closeViewModal(); openAssignModal(viewingClass.id, viewingClass.name); }} 
                                    className="bg-[#10b981] hover:bg-[#059669] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                    Giao Bài
                                </button>
                                <button type="button" onClick={closeViewModal} className="text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 rounded-full p-2.5 transition-colors ml-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8 shrink-0">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center">
                                <p className="text-sm text-slate-500 font-semibold mb-1">Tổng sĩ số</p>
                                <p className="text-3xl font-bold text-slate-800">{countStudents(viewingClass.studentEmails)}</p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 flex flex-col items-center justify-center">
                                <p className="text-sm text-blue-600 font-semibold mb-1">Bài tập đang giao</p>
                                <p className="text-3xl font-bold text-blue-800">{viewingAssignments.length}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 custom-scrollbar">
                            {/* Danh sách sinh viên */}
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                    Danh sách Sinh viên
                                </h4>
                                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 max-h-48 overflow-y-auto">
                                    <ul className="space-y-2">
                                        {(!viewingClass.studentEmails || viewingClass.studentEmails.trim() === '') && (
                                            <li className="text-sm text-slate-500 italic text-center py-2">Lớp này chưa có sinh viên nào.</li>
                                        )}
                                        {viewingClass.studentEmails && viewingClass.studentEmails.split(',').map(e => e.trim()).filter(e => e !== '').map((email, idx) => {
                                            const student = viewingStudents.find(s => s.email === email);
                                            return (
                                                <li key={idx} className="flex items-center gap-3 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold overflow-hidden border border-blue-200">
                                                        {student && student.avatar ? <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" /> : (student ? student.name.charAt(0).toUpperCase() : '?')}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">{student ? student.name : 'Thành viên mới (Chưa cập nhật)'}</span>
                                                        <span className="text-xs font-medium text-slate-500 font-mono mt-0.5">{email}</span>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>

                            {/* Danh sách bài tập */}
                            <div>
                                <h4 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                    Danh sách Bài tập
                                </h4>
                                <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4 max-h-60 overflow-y-auto">
                                    <ul className="space-y-3">
                                        {viewingAssignments.length === 0 && (
                                            <li className="text-sm text-slate-500 italic text-center py-2">Chưa có bài tập nào được giao cho lớp này.</li>
                                        )}
                                        {viewingAssignments.map((assignment) => (
                                            <li key={assignment.id} className="bg-white border border-blue-200 p-3.5 rounded-xl shadow-sm">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h5 className="font-bold text-slate-800 text-sm leading-tight">{assignment.problem?.title || 'Bài tập không xác định'}</h5>
                                                </div>
                                                <div className="flex flex-col gap-1 text-xs text-slate-600">
                                                    <p className="flex items-center gap-1.5">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                        Hạn nộp: <span className="font-semibold text-red-600">{new Date(assignment.deadline).toLocaleString('vi-VN')}</span>
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherClassRoom;
