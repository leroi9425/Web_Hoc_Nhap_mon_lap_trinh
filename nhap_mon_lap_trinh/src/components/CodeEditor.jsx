import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Play, CheckCircle, Code, Brain, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Badge trạng thái testcase
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

export default function CodeEditor() {
    const { problemId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const assignmentId = queryParams.get('assignmentId');

    // Bài tập
    const [problem, setProblem] = useState(null);
    const [probLoading, setProbLoading] = useState(true);

    // Editor
    const [code, setCode] = useState('// Viết code của bạn ở đây...');
    const [language, setLanguage] = useState('cpp');

    // Chạy thử / Submit
    const [stdin, setStdin] = useState('');
    const [runResult, setRunResult] = useState('');
    const [judgeResult, setJudgeResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
    // UI State
    const [activeLeftTab, setActiveLeftTab] = useState('description'); // description, testcases, ai
    const [activeConsoleTab, setActiveConsoleTab] = useState('output'); // output
    
    // AI Analysis
    // AI Analysis
    const [chatHistory, setChatHistory] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [hintLoading, setHintLoading] = useState(false);
    const chatBottomRef = useRef(null);

    useEffect(() => {
        if (!problemId) return;
        
        // Lấy chi tiết bài tập
        axios.get(`${BACKEND}/api/problems/${problemId}`)
            .then(res => setProblem(res.data))
            .catch(() => setProblem(null))
            .finally(() => setProbLoading(false));
            
        // Lấy code đã lưu gần nhất
        axios.get(`${BACKEND}/api/submissions/latest/${problemId}`)
            .then(res => {
                if (res.data.code) {
                    setCode(res.data.code);
                    if (res.data.language) setLanguage(res.data.language);
                }
            })
            .catch(err => console.error("Could not fetch latest submission:", err));
            
        // Lấy lịch sử chat AI
        axios.get(`${BACKEND}/api/ai/history/${problemId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => {
                if (res.data && res.data.length > 0) {
                    setChatHistory(res.data);
                }
            })
            .catch(err => console.error("Could not fetch chat history:", err));
            
    }, [problemId]);

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, aiLoading, hintLoading]);

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
        setActiveConsoleTab('output');
        setRunResult('');
        try {
            const payload = { problemId: Number(problemId), code, language };
            if (assignmentId) payload.assignmentId = Number(assignmentId);
            const res = await axios.post(`${BACKEND}/api/judge/submit`, payload);
            setJudgeResult(res.data);
        } catch (e) {
            setJudgeResult({ finalStatus: 'ERROR', compileError: e.message, results: [] });
        }
        setIsProcessing(false);
    };

    const handleGetHint = async () => {
        setHintLoading(true);
        try {
            const res = await axios.get(`${BACKEND}/api/ai/hint/${problemId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setChatHistory(prev => [...prev, { role: 'model', content: res.data }]);
        } catch (e) {
            setChatHistory(prev => [...prev, { role: 'model', content: 'Lỗi khi lấy gợi ý: ' + e.message }]);
        }
        setHintLoading(false);
    };

    const handleAskAi = async () => {
        if (!code || code.trim() === '' || code.includes('// Viết code của bạn ở đây')) {
            setChatHistory(prev => [...prev, { role: 'model', content: 'Vui lòng viết code thực tế trước khi nhờ AI phân tích lỗi nhé!' }]);
            return;
        }

        const isAccepted = judgeResult?.finalStatus === 'ACCEPTED';
        const userMsgContent = isAccepted 
            ? 'Code của tôi đã chạy đúng 100% testcase. Bạn có thể đánh giá độ phức tạp thuật toán và gợi ý cách tối ưu code này cho sạch đẹp và chạy nhanh hơn không?' 
            : 'Hãy phân tích code của tôi và gợi ý cách sửa lỗi (chỉ gợi ý, tuyệt đối không đưa code giải).';

        const userMsg = { role: 'user', content: userMsgContent };
        setChatHistory(prev => [...prev, userMsg]);
        setAiLoading(true);

        try {
            const payload = {
                problemId: Number(problemId),
                code,
                language,
                errorMessage: typeof runResult === 'string' ? runResult : (judgeResult?.compileError || ''),
                testCaseResults: judgeResult?.results || [],
                history: [...chatHistory, userMsg]
            };
            const res = await axios.post(`${BACKEND}/api/ai/chat-with-context`, payload, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setChatHistory(prev => [...prev, { role: 'model', content: res.data }]);
        } catch (e) {
            setChatHistory(prev => [...prev, { role: 'model', content: 'Lỗi: ' + e.message }]);
        }
        setAiLoading(false);
    };

    const renderMessage = (msg, idx) => {
        const isUser = msg.role === 'user';
        return (
            <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} mb-4`}>
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold shadow-sm
                    ${isUser ? 'bg-blue-600 text-white' : 'bg-purple-100 text-purple-600 border border-purple-200'}`}>
                    {isUser ? 'SV' : '✦'}
                </div>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm
                    ${isUser
                        ? 'bg-blue-50 text-blue-900 border border-blue-100 rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-gray-700 rounded-tl-sm'}`}>
                    {msg.content.split('\n').map((line, i) => {
                        if (line.startsWith('- ') || line.startsWith('* '))
                            return <div key={i} className="flex gap-2 mt-1"><span className="text-purple-400 shrink-0">›</span><span>{line.slice(2)}</span></div>;
                        if (line.startsWith('**') && line.endsWith('**'))
                            return <p key={i} className="font-bold text-gray-900 mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>;
                        if (!line.trim()) return <div key={i} className="h-1" />;
                        return <p key={i} className="mt-0.5">{line}</p>;
                    })}
                </div>
            </div>
        );
    };

    if (probLoading) return <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex justify-center items-center text-slate-400">Loading...</div>;
    if (!problem) return <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex justify-center items-center text-red-400">Không tìm thấy bài tập</div>;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-950 text-slate-300">
            {/* Pane Trái */}
            <div className="w-full md:w-5/12 flex flex-col border-r border-slate-800 bg-slate-900 h-full">
                {/* Tabs */}
                <div className="flex bg-slate-900 border-b border-slate-800">
                    <button onClick={() => setActiveLeftTab('description')} className={`px-4 py-3 text-sm font-medium border-b-2 ${activeLeftTab === 'description' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Đề bài</button>
                    <button onClick={() => setActiveLeftTab('testcases')} className={`px-4 py-3 text-sm font-medium border-b-2 ${activeLeftTab === 'testcases' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Testcase Tự Do</button>
                    <button onClick={() => setActiveLeftTab('ai')} className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-1 ${activeLeftTab === 'ai' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}><Brain size={16}/> AI Trợ giúp</button>
                </div>
                
                {/* Nội dung Pane Trái */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeLeftTab === 'description' && (
                        <div className="prose prose-sm prose-invert max-w-none text-slate-300">
                            <h2 className="text-2xl font-bold mb-2 text-white">{problem.title}</h2>
                            <div className="flex gap-2 mb-6">
                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium rounded">{problem.difficulty || 'Chưa phân loại'}</span>
                                <span className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium rounded">{problem.language}</span>
                                <span className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 text-xs font-medium rounded">⏱ {problem.timeLimitMs}ms</span>
                            </div>
                            <p className="whitespace-pre-wrap mb-4">{problem.description}</p>
                            
                            {problem.pdfUrl && (
                                <div className="w-full mt-6 border border-slate-700 rounded-lg overflow-hidden bg-slate-200 h-[70vh]">
                                    <object 
                                        data={problem.pdfUrl} 
                                        type="application/pdf" 
                                        className="w-full h-full"
                                    >
                                        <div className="p-4 text-center text-slate-800">
                                            <p>Trình duyệt của bạn không hỗ trợ xem PDF trực tiếp.</p>
                                            <a href={problem.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline font-medium">Bấm vào đây để xem hoặc tải PDF</a>
                                        </div>
                                    </object>
                                </div>
                            )}
                            
                            {problem.testCases?.filter(tc => !tc.hidden).length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-bold mb-2 text-white">Ví dụ:</h4>
                                    {problem.testCases.filter(tc => !tc.hidden).map((tc, idx) => (
                                        <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-md p-4 mb-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold mb-1">Input:</p>
                                                    <pre className="bg-slate-950 text-slate-300 p-2 rounded border border-slate-800 text-sm whitespace-pre-wrap">{tc.input}</pre>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-400 font-bold mb-1">Output:</p>
                                                    <pre className="bg-slate-950 text-slate-300 p-2 rounded border border-slate-800 text-sm whitespace-pre-wrap">{tc.expectedOutput}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {activeLeftTab === 'testcases' && (
                        <div className="h-full flex flex-col">
                            <h3 className="font-bold text-white mb-2">Nhập Testcase tự do (Stdin)</h3>
                            <textarea 
                                value={stdin}
                                onChange={e => setStdin(e.target.value)}
                                className="w-full flex-1 bg-slate-950 border border-slate-700 text-slate-300 rounded-md p-3 font-mono text-sm focus:border-blue-500 focus:outline-none resize-none"
                                placeholder="Nhập dữ liệu đầu vào..."
                            />
                        </div>
                    )}

                    {activeLeftTab === 'ai' && (
                        <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatHistory.length === 0 && (
                                    <div className="text-center text-slate-500 mt-10">
                                        <Brain size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="mb-6">Bạn chưa có lịch sử trò chuyện. AI có thể gợi ý thuật toán hoặc phân tích lỗi code cho bạn.</p>
                                        <div className="flex flex-col gap-3">
                                            <button 
                                                onClick={handleGetHint}
                                                disabled={hintLoading}
                                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full transition disabled:opacity-50"
                                            >
                                                {hintLoading ? 'Đang tải...' : 'Xem các bước làm bài'}
                                            </button>
                                            <button 
                                                onClick={handleAskAi}
                                                disabled={aiLoading}
                                                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-full transition disabled:opacity-50"
                                            >
                                                {aiLoading ? 'Đang phân tích...' : (judgeResult?.finalStatus === 'ACCEPTED' ? 'Nhờ AI đánh giá & Tối ưu code' : 'Phân tích lỗi Code (Debug)')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                {chatHistory.map((msg, idx) => renderMessage(msg, idx))}
                                {(aiLoading || hintLoading) && chatHistory.length > 0 && <div className="text-sm text-slate-500 animate-pulse flex items-center gap-2"><Brain size={16}/> Đang gõ...</div>}
                                
                                {chatHistory.length > 0 && !aiLoading && !hintLoading && (
                                    <div className="text-center mt-6 pt-4 border-t border-slate-800 flex flex-col gap-3">
                                        <button 
                                            onClick={handleGetHint}
                                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium rounded-full transition"
                                        >
                                            Xem các bước làm bài
                                        </button>
                                        <button 
                                            onClick={handleAskAi}
                                            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-purple-400 font-medium rounded-full transition"
                                        >
                                            {judgeResult?.finalStatus === 'ACCEPTED' ? 'Nhờ AI đánh giá lại code' : 'Yêu cầu phân tích lại code mới'}
                                        </button>
                                    </div>
                                )}
                                <div ref={chatBottomRef} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pane Phải */}
            <div className="w-full md:w-7/12 flex flex-col bg-[#1e1e1e] h-full relative">
                {/* Editor Toolbar */}
                <div className="h-12 bg-slate-900 flex items-center justify-between px-4 text-slate-300 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                        <Code size={16} className="text-blue-400" />
                        <span className="text-sm font-medium">solution.{language}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={language} onChange={e => setLanguage(e.target.value)} className="bg-slate-800 border border-slate-700 text-sm text-slate-300 rounded px-2 py-1 outline-none">
                            <option value="cpp">C++</option>
                            <option value="python">Python</option>
                        </select>
                    </div>
                </div>

                {/* Editor */}
                <div className="flex-1 relative">
                    <Editor
                        height="100%"
                        language={language}
                        theme="vs-dark"
                        value={code}
                        onChange={val => setCode(val)}
                        options={{ minimap: { enabled: false }, fontSize: 14, cursorBlinking: 'smooth', formatOnPaste: true }}
                    />
                </div>

                {/* Console */}
                <div className="h-2/5 bg-slate-900 border-t border-slate-800 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-800">
                        <div className="flex gap-4">
                            <button className="text-sm font-medium text-white">Console Output</button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleRun} disabled={isProcessing} className="flex items-center gap-1 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition disabled:opacity-50 font-medium">
                                <Play size={14} /> Chạy thử
                            </button>
                            <button onClick={handleSubmit} disabled={isProcessing} className="flex items-center gap-1 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-sm font-medium transition disabled:opacity-50">
                                <CheckCircle size={14} /> Nộp bài
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 font-mono text-sm bg-[#1e1e1e]">
                        {isProcessing ? (
                            <div className="text-blue-400 animate-pulse">Đang xử lý trên máy chủ...</div>
                        ) : judgeResult ? (
                            <div>
                                <div className="mb-4">
                                    <span className="text-slate-400">Kết quả tổng: </span>
                                    <StatusBadge status={judgeResult.finalStatus} />
                                </div>
                                {judgeResult.compileError ? (
                                    <div className="text-red-400 whitespace-pre-wrap">{judgeResult.compileError}</div>
                                ) : (
                                    <div className="space-y-4">
                                        {judgeResult.results?.map((res, i) => (
                                            <div key={i} className="bg-[#252525] rounded border border-[#333] overflow-hidden">
                                                <div className="flex justify-between items-center p-3 bg-[#1e1e1e] border-b border-[#333]">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-slate-300 font-bold text-sm">Test {i + 1}</span>
                                                        <StatusBadge status={res.status} />
                                                    </div>
                                                    <span className="text-slate-500 text-xs">{res.runtimeMs}ms</span>
                                                </div>
                                                <div className="p-3 space-y-3">
                                                    {res.input !== undefined && res.input !== null && (
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-500 block mb-1">INPUT:</span>
                                                            <pre className="bg-[#1e1e1e] text-slate-300 p-2 rounded text-xs whitespace-pre-wrap">{res.input}</pre>
                                                        </div>
                                                    )}
                                                    {res.expected !== undefined && res.expected !== null && (
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-500 block mb-1">EXPECTED OUTPUT:</span>
                                                            <pre className="bg-[#1e1e1e] text-emerald-400 p-2 rounded text-xs whitespace-pre-wrap">{res.expected}</pre>
                                                        </div>
                                                    )}
                                                    {res.actual !== undefined && res.actual !== null && (
                                                        <div>
                                                            <span className="text-xs font-bold text-slate-500 block mb-1">ACTUAL OUTPUT:</span>
                                                            <pre className="bg-[#1e1e1e] text-slate-300 p-2 rounded text-xs whitespace-pre-wrap">{res.actual}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : runResult ? (
                            <div className="text-slate-300 whitespace-pre-wrap">{runResult}</div>
                        ) : (
                            <div className="text-slate-500">Kết quả chạy thử sẽ hiển thị tại đây...</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}