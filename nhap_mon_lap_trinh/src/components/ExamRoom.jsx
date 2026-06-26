import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, Clock, Save, ChevronRight, XCircle, Code } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND = 'http://localhost:8080';

const StatusBadge = ({ status }) => {
    const map = {
        PASSED:  'text-green-500 bg-green-500/10 border-green-500/20',
        FAILED:  'text-red-500 bg-red-500/10 border-red-500/20',
        TLE:     'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        OLE:     'text-orange-500 bg-orange-500/10 border-orange-500/20',
        ERROR:   'text-red-500 bg-red-500/10 border-red-500/20',
        ACCEPTED: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
        WRONG_ANSWER: 'text-red-500 bg-red-500/10 border-red-500/20',
        PARTIAL: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
        COMPILE_ERROR: 'text-red-500 bg-red-500/10 border-red-500/20',
    };
    const icon = { 
        PASSED: '✓', FAILED: '✗', TLE: '⏱', OLE: '📤', ERROR: '!',
        ACCEPTED: '★', WRONG_ANSWER: '✗', PARTIAL: '⚠', COMPILE_ERROR: '!'
    };
    const cls = map[status] ?? map.ERROR;
    return (
        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-mono font-bold uppercase ${cls}`}>
            {icon[status] ?? '!'} {status}
        </span>
    );
};

export default function ExamRoom() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [exam, setExam] = useState(null);
    const [problems, setProblems] = useState([]);
    const [activeProblemId, setActiveProblemId] = useState(null);
    const [examResult, setExamResult] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
    const [isFinished, setIsFinished] = useState(false);

    // Editor state
    const [code, setCode] = useState('// Viết code của bạn ở đây...');
    const [language, setLanguage] = useState('cpp');
    const [stdin, setStdin] = useState('');
    const [runResult, setRunResult] = useState('');
    const [judgeResult, setJudgeResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeConsoleTab, setActiveConsoleTab] = useState('output');

    // Mảng lưu trạng thái câu hỏi (để hiện màu ở sidebar)
    const [problemStatus, setProblemStatus] = useState({});

    // 1. Lấy thông tin đề thi và Bắt đầu thi
    useEffect(() => {
        if (!id || !user) return;
        
        const initExam = async () => {
            try {
                // Fetch exam details
                const examRes = await axios.get(`${BACKEND}/api/exams/${id}`);
                setExam(examRes.data);
                const probList = examRes.data.problems || [];
                setProblems(probList);
                if (probList.length > 0) setActiveProblemId(probList[0].id);

                // Start exam
                const startRes = await axios.post(`${BACKEND}/api/exams/${id}/start`);
                const result = startRes.data;
                setExamResult(result);
                
                if (result.finishedAt) {
                    setIsFinished(true);
                    return;
                }

                // Tính thời gian còn lại
                const startedAt = new Date(result.startedAt).getTime();
                const totalSeconds = examRes.data.durationMinutes * 60;
                const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
                const remaining = totalSeconds - elapsedSeconds;
                
                if (remaining <= 0) {
                    finishExam();
                } else {
                    setTimeRemaining(remaining);
                }

            } catch (err) {
                console.error("Lỗi khởi tạo phòng thi:", err);
                alert("Không thể vào phòng thi. Vui lòng thử lại.");
                navigate('/exams');
            } finally {
                setLoading(false);
            }
        };

        initExam();
    }, [id, user]);

    // 2. Đồng hồ đếm ngược
    useEffect(() => {
        if (timeRemaining <= 0 || isFinished || loading) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    finishExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining, isFinished, loading]);

    // 3. Load code khi đổi câu hỏi
    useEffect(() => {
        if (!activeProblemId || isFinished) return;
        
        // Reset console
        setRunResult('');
        setJudgeResult(null);
        setActiveConsoleTab('output');
        setCode('// Đang tải code...');

        // Fetch latest submission for this exam
        axios.get(`${BACKEND}/api/submissions/latest/${activeProblemId}?examId=${id}`)
            .then(res => {
                if (res.data.code) {
                    setCode(res.data.code);
                    if (res.data.language) setLanguage(res.data.language);
                    
                    // Cập nhật trạng thái vào sidebar
                    if (res.data.status) {
                        setProblemStatus(prev => ({...prev, [activeProblemId]: res.data.status}));
                    }
                } else {
                    setCode('// Viết code của bạn ở đây...');
                }
            })
            .catch(() => setCode('// Viết code của bạn ở đây...'));
    }, [activeProblemId]);

    const finishExam = async () => {
        try {
            setIsProcessing(true);
            const res = await axios.post(`${BACKEND}/api/exams/${id}/finish`);
            setExamResult(res.data);
            setIsFinished(true);
            alert(`Hết giờ! Bạn đã làm đúng ${res.data.score}/${res.data.totalQuestions} câu.`);
        } catch (err) {
            alert("Có lỗi xảy ra khi nộp bài!");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRun = async () => {
        setIsProcessing(true);
        setActiveConsoleTab('output');
        setJudgeResult(null);
        try {
            const res = await axios.post(`${BACKEND}/api/judge/run`, { code, language, stdin });
            setRunResult(res.data);
        } catch (e) {
            setRunResult('Lỗi kết nối backend: ' + e.message);
        }
        setIsProcessing(false);
    };

    const handleSubmit = async () => {
        setIsProcessing(true);
        setActiveConsoleTab('testcases');
        setRunResult('');
        try {
            const res = await axios.post(`${BACKEND}/api/judge/submit`, { 
                problemId: activeProblemId,
                examId: id, // Truyền examId để phân tách với Kho bài tập
                code, 
                language 
            });
            setJudgeResult(res.data);
            
            // Cập nhật trạng thái sidebar
            setProblemStatus(prev => ({...prev, [activeProblemId]: res.data.finalStatus}));
            
        } catch (e) {
            alert('Lỗi chấm bài: ' + e.message);
        }
        setIsProcessing(false);
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="h-screen bg-[#0f111a] flex items-center justify-center text-white text-xl">Đang chuẩn bị phòng thi...</div>;

    const activeProblem = problems.find(p => p.id === activeProblemId);

    if (isFinished) {
        return (
            <div className="min-h-screen bg-[#0f111a] text-slate-300 flex items-center justify-center p-6">
                <div className="bg-[#1e212b] p-8 rounded-2xl max-w-md w-full text-center border border-slate-700/50 shadow-2xl">
                    <CheckCircle className="mx-auto text-emerald-500 mb-4" size={64} />
                    <h1 className="text-3xl font-bold text-white mb-2">Đã Nộp Bài Thi</h1>
                    <p className="text-slate-400 mb-6">{exam?.title}</p>
                    
                    <div className="bg-[#0f111a] rounded-xl p-6 mb-8 border border-slate-700/50">
                        <div className="text-sm text-slate-500 mb-1">Điểm số của bạn</div>
                        <div className="text-5xl font-black text-blue-400">
                            {examResult?.score} <span className="text-2xl text-slate-500">/ {examResult?.totalQuestions}</span>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => navigate('/exams')}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition"
                    >
                        Quay lại danh sách đề thi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#0f111a] text-slate-300 font-sans overflow-hidden">
            {/* Header */}
            <header className="h-14 flex-shrink-0 border-b border-slate-700/50 flex items-center justify-between px-4 bg-[#161822]">
                <div className="flex items-center gap-3">
                    <span className="font-black text-xl text-white tracking-tight">&lt;/&gt; NMLT</span>
                    <div className="h-5 w-px bg-slate-700 mx-2"></div>
                    <span className="font-medium text-blue-400">{exam?.title}</span>
                </div>
                
                <div className="flex items-center gap-6">
                    <div className={`flex items-center gap-2 font-mono text-xl font-bold ${timeRemaining < 300 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`}>
                        <Clock size={20} />
                        {formatTime(timeRemaining)}
                    </div>
                    <button 
                        onClick={() => {
                            if(window.confirm('Bạn có chắc chắn muốn nộp toàn bộ đề thi? Hệ thống sẽ kết thúc giờ làm bài của bạn.')) finishExam();
                        }}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-md flex items-center gap-2 transition"
                    >
                        Nộp Bài Thi
                    </button>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar Câu hỏi */}
                <div className="w-64 flex-shrink-0 border-r border-slate-700/50 bg-[#161822] flex flex-col">
                    <div className="p-4 border-b border-slate-700/50 font-bold text-slate-200">
                        Danh sách câu hỏi
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {problems.map((p, idx) => {
                            const status = problemStatus[p.id];
                            const isAccepted = status === 'ACCEPTED';
                            const isAttempted = status && status !== 'ACCEPTED';
                            
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setActiveProblemId(p.id)}
                                    className={`w-full text-left px-3 py-3 rounded-lg flex items-center justify-between transition ${
                                        activeProblemId === p.id 
                                        ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400' 
                                        : 'hover:bg-slate-800 text-slate-400 border border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 truncate">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                            isAccepted ? 'bg-emerald-500/20 text-emerald-500' : 
                                            isAttempted ? 'bg-red-500/20 text-red-500' : 'bg-slate-700 text-slate-300'
                                        }`}>
                                            {idx + 1}
                                        </div>
                                        <span className="truncate text-sm">{p.title}</span>
                                    </div>
                                    {isAccepted && <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />}
                                    {isAttempted && <XCircle size={16} className="text-red-500 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Giữa: Đề bài */}
                <div className="w-[400px] xl:w-[500px] flex-shrink-0 border-r border-slate-700/50 bg-[#161822] flex flex-col">
                    <div className="h-12 flex border-b border-slate-700/50 px-2">
                        <button className="px-4 text-blue-400 font-semibold border-b-2 border-blue-500 h-full flex items-center">
                            Đề bài
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none">
                        {activeProblem ? (
                            <>
                                <h1 className="text-2xl font-bold text-slate-100 mb-2">{activeProblem.title}</h1>
                                <div className="flex gap-2 mb-6">
                                    <span className="px-2.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-xs text-slate-400">
                                        Giới hạn: {activeProblem.timeLimit || 1000}ms
                                    </span>
                                </div>
                                <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                                    {activeProblem.description}
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-500 italic">Hãy chọn 1 câu hỏi bên trái.</div>
                        )}
                    </div>
                </div>

                {/* Phải: Code Editor & Console */}
                <div className="flex-1 flex flex-col min-w-0 bg-[#0f111a]">
                    <div className="h-12 border-b border-slate-700/50 flex items-center justify-between px-4 bg-[#161822]">
                        <div className="flex items-center gap-2 text-slate-400">
                            <Code size={18} />
                            <span className="font-medium text-sm">solution.cpp</span>
                        </div>
                        <select 
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-[#0f111a] border border-slate-700 rounded text-slate-300 text-sm px-2 py-1 outline-none focus:border-blue-500"
                        >
                            <option value="cpp">C++ (GCC 11)</option>
                            <option value="python">Python 3</option>
                        </select>
                    </div>

                    <div className="flex-1 relative">
                        <Editor
                            height="100%"
                            language={language}
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                padding: { top: 16 },
                                scrollBeyondLastLine: false,
                                smoothScrolling: true,
                            }}
                        />
                    </div>

                    {/* Console Panel */}
                    <div className="h-72 border-t border-slate-700/50 bg-[#161822] flex flex-col">
                        <div className="h-12 flex items-center justify-between px-4 border-b border-slate-700/50">
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setActiveConsoleTab('output')}
                                    className={`text-sm font-semibold transition ${activeConsoleTab === 'output' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Console Output
                                </button>
                                <button 
                                    onClick={() => setActiveConsoleTab('testcases')}
                                    className={`text-sm font-semibold transition ${activeConsoleTab === 'testcases' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                >
                                    Kết quả Nộp
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={handleRun}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium transition disabled:opacity-50"
                                >
                                    <Play size={14} /> Chạy thử
                                </button>
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                    className="flex items-center gap-2 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition shadow-[0_0_15px_rgba(37,99,235,0.3)] disabled:opacity-50"
                                >
                                    <CheckCircle size={14} /> Nộp câu này
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {isProcessing ? (
                                <div className="flex items-center justify-center h-full text-blue-400 font-medium">
                                    <span className="animate-pulse">Đang chấm bài...</span>
                                </div>
                            ) : activeConsoleTab === 'output' ? (
                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Testcase Tự Nhập (Stdin)</label>
                                        <textarea 
                                            value={stdin}
                                            onChange={(e) => setStdin(e.target.value)}
                                            className="w-full bg-[#0f111a] border border-slate-700 rounded p-3 text-slate-300 font-mono text-sm min-h-[60px] focus:outline-none focus:border-slate-500 transition"
                                            placeholder="Nhập dữ liệu testcase của bạn vào đây..."
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Output Trả Về</label>
                                        <pre className="w-full bg-[#0f111a] border border-slate-700 rounded p-3 text-slate-300 font-mono text-sm min-h-[60px] whitespace-pre-wrap">
                                            {runResult || <span className="text-slate-600 italic">Chưa có kết quả chạy thử</span>}
                                        </pre>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {!judgeResult ? (
                                        <div className="text-slate-500 italic flex items-center justify-center h-full">Bấm "Nộp câu này" để xem kết quả.</div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-4 border-b border-slate-700/50 pb-4">
                                                <span className="text-sm text-slate-400">Kết quả tổng:</span>
                                                <StatusBadge status={judgeResult.finalStatus} />
                                                <span className="text-sm font-medium text-slate-300">
                                                    Đúng {judgeResult.passedCases}/{judgeResult.totalCases} testcase
                                                </span>
                                            </div>

                                            {judgeResult.finalStatus === 'COMPILE_ERROR' ? (
                                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                                                    <pre className="text-red-400 font-mono text-sm whitespace-pre-wrap">{judgeResult.errorMessage}</pre>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {judgeResult.testCaseResults?.map((tc, i) => (
                                                        <div key={i} className="bg-[#0f111a] border border-slate-700 rounded-lg overflow-hidden">
                                                            <div className="flex items-center justify-between bg-slate-800/50 px-4 py-2 border-b border-slate-700">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="font-semibold text-slate-200 text-sm">Test {tc.index}</span>
                                                                    <StatusBadge status={tc.status} />
                                                                </div>
                                                                <span className="text-xs text-slate-500 font-mono">{tc.runtime}ms</span>
                                                            </div>
                                                            <div className="p-4 space-y-4">
                                                                {tc.hidden ? (
                                                                    <div className="text-slate-500 italic text-sm">Testcase này bị ẩn.</div>
                                                                ) : (
                                                                    <>
                                                                        <div className="space-y-1">
                                                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Input:</div>
                                                                            <pre className="bg-slate-900/50 border border-slate-800 rounded p-2 text-slate-300 font-mono text-xs whitespace-pre-wrap">{tc.input || ' '}</pre>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected Output:</div>
                                                                            <pre className="bg-slate-900/50 border border-slate-800 rounded p-2 text-emerald-400/80 font-mono text-xs whitespace-pre-wrap">{tc.expectedOutput || ' '}</pre>
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Output:</div>
                                                                            <pre className="bg-slate-900/50 border border-slate-800 rounded p-2 text-blue-400/80 font-mono text-xs whitespace-pre-wrap">{tc.actualOutput || ' '}</pre>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
            `}</style>
        </div>
    );
}
