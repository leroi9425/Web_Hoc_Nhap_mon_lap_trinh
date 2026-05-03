import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';
 
const CodeEditor = () => {
    const [code, setCode] = useState('// Viết code của bạn ở đây...');
    const [language, setLanguage] = useState('cpp');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);
 
    // --- STATE MỚI CHO TÍNH NĂNG AI ---
    const [aiAdvice, setAiAdvice] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);
 
    // Hàm chạy code (giữ nguyên như cũ)
    const handleRunCode = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8080/api/judge/run', {
                code: code,
                language: language
            });
            setResult(response.data);
        } catch (error) {
            setResult("Lỗi kết nối Backend: " + error.message);
        }
        setLoading(false);
    };
 
    // --- HÀM MỚI: GỌI AI QUA SPRING BOOT BACKEND ---
    const handleAskAI = async () => {
        setAiLoading(true);
        setShowAiPanel(true); // Mở panel ngay khi bấm
        setAiAdvice(''); // Xóa kết quả cũ
 
        try {
            const response = await axios.post('http://localhost:8080/api/ai/ask-ai', {
                code: code,
                language: language,
                errorMessage: result // Truyền kết quả chạy code (có thể là lỗi) cho AI phân tích
            });
            setAiAdvice(response.data);
        } catch (error) {
            setAiAdvice("Lỗi kết nối AI: " + error.message);
        }
        setAiLoading(false);
    };
 
    return (
        // Layout chính: flex row để chia 2 cột
        <div className="min-h-screen bg-gray-950 text-gray-100 font-mono">
 
            {/* HEADER */}
            <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></div>
                    <h1 className="text-lg font-bold tracking-tight text-white">
                        Code Judge <span className="text-emerald-400">DATN</span>
                    </h1>
                    <span className="text-xs text-gray-500">— Hoàng Nguyễn</span>
                </div>
 
                {/* Nút Hỏi AI ở header */}
                <button
                    onClick={handleAskAI}
                    disabled={aiLoading || !code.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-semibold shadow-lg shadow-violet-900/40"
                >
                    {aiLoading ? (
                        <>
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                            Đang phân tích...
                        </>
                    ) : (
                        <>
                            <span>✦</span>
                            Hỏi AI
                        </>
                    )}
                </button>
            </div>
 
            {/* BODY: 2 cột */}
            <div className="flex h-[calc(100vh-65px)]">
 
                {/* CỘT TRÁI: Editor + Controls + Output */}
                <div className={`flex flex-col transition-all duration-300 ${showAiPanel ? 'w-1/2' : 'w-full'}`}>
 
                    {/* Toolbar chọn ngôn ngữ + nút chạy */}
                    <div className="flex items-center gap-3 px-4 py-3 bg-gray-900 border-b border-gray-800">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="bg-gray-800 text-gray-200 text-sm px-3 py-1.5 rounded-md border border-gray-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
                        >
                            <option value="cpp">C++</option>
                            <option value="python">Python</option>
                        </select>
 
                        <button
                            onClick={handleRunCode}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                    </svg>
                                    Đang chạy...
                                </>
                            ) : (
                                <>▶ Chạy Code</>
                            )}
                        </button>
                    </div>
 
                    {/* Monaco Editor */}
                    <div className="flex-1 min-h-0">
                        <Editor
                            height="100%"
                            language={language === 'cpp' ? 'cpp' : 'python'}
                            theme="vs-dark"
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                padding: { top: 12 },
                            }}
                        />
                    </div>
 
                    {/* Output */}
                    <div className="border-t border-gray-800 bg-gray-900">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Output</span>
                            {result && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                                    {result.includes('Error') || result.includes('Lỗi') ? '❌ Lỗi' : '✓ OK'}
                                </span>
                            )}
                        </div>
                        <pre className="px-4 py-3 text-sm text-gray-300 min-h-[80px] max-h-[160px] overflow-auto whitespace-pre-wrap">
                            {result || <span className="text-gray-600 italic">Kết quả sẽ hiển thị ở đây...</span>}
                        </pre>
                    </div>
                </div>
 
                {/* CỘT PHẢI: AI Panel — chỉ hiện khi showAiPanel = true */}
                {showAiPanel && (
                    <div className="w-1/2 border-l border-gray-800 flex flex-col bg-gray-900 animate-[fadeIn_0.2s_ease]">
 
                        {/* AI Panel Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                            <div className="flex items-center gap-2">
                                <span className="text-violet-400 text-lg">✦</span>
                                <span className="text-sm font-bold text-white">Giảng viên AI</span>
                                <span className="text-xs text-gray-500">— Thủy Lợi University</span>
                            </div>
                            {/* Nút đóng panel */}
                            <button
                                onClick={() => setShowAiPanel(false)}
                                className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
                                title="Đóng panel AI"
                            >
                                ✕
                            </button>
                        </div>
 
                        {/* AI Content */}
                        <div className="flex-1 overflow-auto px-4 py-4">
                            {aiLoading ? (
                                // Loading skeleton
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-violet-400 text-sm mb-4">
                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                        Thầy AI đang đọc code của bạn...
                                    </div>
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`h-3 bg-gray-800 rounded animate-pulse`} style={{ width: `${85 - i * 10}%` }}></div>
                                    ))}
                                </div>
                            ) : aiAdvice ? (
                                // Kết quả AI — hiển thị từng dòng để dễ đọc
                                <div className="prose prose-invert prose-sm max-w-none">
                                    {aiAdvice.split('\n').map((line, idx) => {
                                        // Highlight dòng bắt đầu bằng - hoặc * (list item)
                                        if (line.startsWith('- ') || line.startsWith('* ')) {
                                            return (
                                                <div key={idx} className="flex gap-2 mb-2">
                                                    <span className="text-violet-400 mt-0.5 shrink-0">›</span>
                                                    <span className="text-gray-300 text-sm leading-relaxed">{line.slice(2)}</span>
                                                </div>
                                            );
                                        }
                                        // Highlight dòng tiêu đề (bắt đầu bằng **)
                                        if (line.startsWith('**') && line.endsWith('**')) {
                                            return <p key={idx} className="text-white font-bold text-sm mt-4 mb-2">{line.replace(/\*\*/g, '')}</p>;
                                        }
                                        // Dòng trống
                                        if (!line.trim()) return <div key={idx} className="h-2"></div>;
                                        // Dòng thường
                                        return <p key={idx} className="text-gray-300 text-sm leading-relaxed mb-1">{line}</p>;
                                    })}
                                </div>
                            ) : null}
                        </div>
 
                        {/* Footer gợi ý */}
                        {!aiLoading && aiAdvice && (
                            <div className="border-t border-gray-800 px-4 py-3">
                                <p className="text-xs text-gray-500 italic">
                                    💡 Thầy AI không đưa đáp án trực tiếp — hãy tự suy nghĩ và thử lại nhé!
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
 
export default CodeEditor;