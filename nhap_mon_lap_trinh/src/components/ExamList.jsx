import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, PlayCircle, CheckCircle, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BACKEND = 'http://localhost:8080';

const ExamList = () => {
    const [exams, setExams] = useState([]);
    const [myResults, setMyResults] = useState({});
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examsRes, resultsRes] = await Promise.all([
                    axios.get(`${BACKEND}/api/exams`),
                    user ? axios.get(`${BACKEND}/api/exams/my-results`).catch(err => {
                        console.warn("Lỗi lấy điểm thi (có thể do hết hạn token):", err);
                        return { data: [] };
                    }) : Promise.resolve({ data: [] })
                ]);
                
                setExams(examsRes.data);
                
                const resultsMap = {};
                if (resultsRes.data) {
                    resultsRes.data.forEach(r => {
                        // Lấy result mới nhất
                        if (!resultsMap[r.exam.id] || new Date(r.startedAt) > new Date(resultsMap[r.exam.id].startedAt)) {
                            resultsMap[r.exam.id] = r;
                        }
                    });
                }
                setMyResults(resultsMap);
            } catch (error) {
                console.error("Error fetching exams:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    return (
        <div className="p-6 max-w-6xl mx-auto font-sans">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Khu Vực Thi Cử</h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">Danh sách các đề thi sát hạch. Khi bạn bấm "Vào Thi", hệ thống sẽ bắt đầu tính giờ. Hãy chuẩn bị kỹ lưỡng trước khi bắt đầu.</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Đang tải danh sách đề thi...</div>
            ) : exams.length === 0 ? (
                <div className="text-center py-20">
                    <FileText size={64} className="mx-auto text-slate-200 mb-4" />
                    <h3 className="text-xl font-bold text-slate-400">Chưa có đề thi nào được mở</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exams.map(exam => {
                        const result = myResults[exam.id];
                        const isFinished = result && result.finishedAt;
                        const isInProgress = result && !result.finishedAt;

                        return (
                            <div key={exam.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md border border-slate-200 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 relative">
                                {isFinished && (
                                    <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                        <CheckCircle size={14} />
                                        Điểm: {result.score}/{result.totalQuestions}
                                    </div>
                                )}
                                {isInProgress && (
                                    <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm animate-pulse">
                                        <Clock size={14} />
                                        Đang thi
                                    </div>
                                )}
                                <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-indigo-50 to-white">
                                    <h2 className="text-xl font-bold text-indigo-900 mb-2 pr-20">{exam.title}</h2>
                                    <div className="flex items-center gap-4 text-sm text-slate-600 mt-4">
                                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                                            <Clock size={16} className="text-amber-500" />
                                            <span className="font-medium">{exam.durationMinutes} phút</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                                            <FileText size={16} className="text-emerald-500" />
                                            <span className="font-medium">{exam.problems?.length || 0} bài</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-slate-50">
                                    {isFinished ? (
                                        <button 
                                            onClick={() => navigate(`/exams/${exam.id}`)}
                                            className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                                        >
                                            <RefreshCcw size={20} />
                                            Xem Lại Bài Thi
                                        </button>
                                    ) : isInProgress ? (
                                        <button 
                                            onClick={() => navigate(`/exams/${exam.id}`)}
                                            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm animate-pulse"
                                        >
                                            <PlayCircle size={20} />
                                            Tiếp Tục Thi
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => navigate(`/exams/${exam.id}`)}
                                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
                                        >
                                            <PlayCircle size={20} />
                                            Vào Thi Ngay
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ExamList;
