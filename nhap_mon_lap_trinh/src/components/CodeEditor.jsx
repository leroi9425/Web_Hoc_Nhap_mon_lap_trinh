import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

const BACKEND = 'http://localhost:8080';

const CodeEditor = () => {
    const [code, setCode] = useState('// Viết code của bạn ở đây...');
    const [language, setLanguage] = useState('cpp');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    // AI chat state
    const [showAiPanel, setShowAiPanel] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    // chatHistory: [{role: 'user'|'model', content: string}]
    const [inputText, setInputText] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const chatBottomRef = useRef(null);

    // Tự scroll xuống cuối khi có tin nhắn mới
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, aiLoading]);

    // Chạy code
    const handleRunCode = async () => {
        setLoading(true);
        try {
            const response = await axios.post(`${BACKEND}/api/judge/run`, {
                code, language
            });
            setResult(response.data);
        } catch (error) {
            setResult("Lỗi kết nối Backend: " + error.message);
        }
        setLoading(false);
    };

    // Gọi AI lần đầu — bấm nút "Hỏi AI"
    const handleAskAI = async () => {
        setShowAiPanel(true);
        setChatHistory([]); // reset hội thoại cũ nếu có
        const firstMessage = "Em cần gợi ý để hiểu và sửa code này.";
        await sendMessage(firstMessage, []);
    };

    // Gửi tin nhắn follow-up từ ô input
    const handleSendFollowUp = async () => {
        if (!inputText.trim() || aiLoading) return;
        const userMsg = inputText.trim();
        setInputText('');
        await sendMessage(userMsg, chatHistory);
    };

    // Hàm gửi message chung — nhận history hiện tại để truyền lên backend
    const sendMessage = async (userMessage, currentHistory) => {
        const newHistory = [...currentHistory, { role: 'user', content: userMessage }];
        setChatHistory(newHistory);
        setAiLoading(true);

        try {
            const response = await axios.post(`${BACKEND}/api/ai/chat`, {
                code,
                language,
                errorMessage: result,
                history: newHistory
            });
            setChatHistory(prev => [...prev, { role: 'model', content: response.data }]);
        } catch (error) {
            setChatHistory(prev => [...prev, {
                role: 'model',
                content: "Lỗi kết nối AI: " + error.message
            }]);
        }
        setAiLoading(false);
    };

    // Reset cuộc hội thoại
    const handleResetChat = () => {
        setChatHistory([]);
        setInputText('');
    };

    // Enter gửi, Shift+Enter xuống dòng
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendFollowUp();
        }
    };

    // Render từng bubble tin nhắn
    const renderMessage = (msg, idx) => {
        const isUser = msg.role === 'user';
        return (
            <div key={idx} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold
                    ${isUser ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white'}`}>
                    {isUser ? 'SV' : '✦'}
                </div>

                {/* Bubble */}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${isUser
                        ? 'bg-emerald-900/50 text-emerald-100 rounded-tr-sm'
                        : 'bg-gray-800 text-gray-200 rounded-tl-sm'
                    }`}>
                    {msg.content.split('\n').map((line, i) => {
                        if (line.startsWith('- ') || line.startsWith('* ')) {
                            return (
                                <div key={i} className="flex gap-2 mt-1">
                                    <span className="text-violet-400 shrink-0">›</span>
                                    <span>{line.slice(2)}</span>
                                </div>
                            );
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                            return <p key={i} className="font-bold text-white mt-2 mb-1">{line.replace(/\*\*/g, '')}</p>;
                        }
                        if (!line.trim()) return <div key={i} className="h-1" />;
                        return <p key={i} className="mt-0.5">{line}</p>;
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-950 text-gray-100 font-mono flex flex-col">

            {/* HEADER */}
            <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                    <h1 className="text-base font-bold tracking-tight text-white">
                        Code Judge <span className="text-emerald-400">DATN</span>
                    </h1>
                    <span className="text-xs text-gray-500">— Hoàng Nguyễn</span>
                </div>

                <div className="flex items-center gap-2">
                    {showAiPanel && chatHistory.length > 0 && (
                        <button
                            onClick={handleResetChat}
                            className="px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500 text-xs text-gray-400 hover:text-gray-200 transition-all"
                        >
                            ↺ Reset chat
                        </button>
                    )}

                    <button
                        onClick={handleAskAI}
                        disabled={aiLoading}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-lg shadow-violet-900/40"
                    >
                        {aiLoading && chatHistory.length === 0 ? (
                            <>
                                <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                                Đang hỏi...
                            </>
                        ) : (
                            <><span>✦</span> Hỏi AI</>
                        )}
                    </button>
                </div>
            </div>

            {/* BODY */}
            <div className="flex flex-1 min-h-0">

                {/* CỘT TRÁI: Editor + Output */}
                <div className={`flex flex-col transition-all duration-300 min-h-0 ${showAiPanel ? 'w-1/2' : 'w-full'}`}>

                    {/* Toolbar */}
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-gray-800 shrink-0">
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
                            ) : <>▶ Chạy Code</>}
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
                    <div className="border-t border-gray-800 bg-gray-900 shrink-0">
                        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-800">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Output</span>
                            {result && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                                    {result.toLowerCase().includes('error') || result.includes('Lỗi') ? '❌ Lỗi' : '✓ OK'}
                                </span>
                            )}
                        </div>
                        <pre className="px-4 py-3 text-sm text-gray-300 min-h-[72px] max-h-[140px] overflow-auto whitespace-pre-wrap">
                            {result || <span className="text-gray-600 italic">Kết quả sẽ hiển thị ở đây...</span>}
                        </pre>
                    </div>
                </div>

                {/* CỘT PHẢI: AI Chat Panel */}
                {showAiPanel && (
                    <div className="w-1/2 border-l border-gray-800 flex flex-col bg-gray-900 min-h-0">

                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-violet-400">✦</span>
                                <span className="text-sm font-bold text-white">Giảng viên AI</span>
                                <span className="text-xs text-gray-500">— Thủy Lợi University</span>
                            </div>
                            <button
                                onClick={() => setShowAiPanel(false)}
                                className="text-gray-500 hover:text-gray-300 transition-colors"
                            >✕</button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
                            {chatHistory.length === 0 && !aiLoading && (
                                <div className="flex flex-col items-center justify-center h-full text-center text-gray-600 gap-2">
                                    <span className="text-3xl">✦</span>
                                    <p className="text-sm">Bấm <span className="text-violet-400 font-semibold">Hỏi AI</span> để bắt đầu</p>
                                </div>
                            )}

                            {chatHistory.map((msg, idx) => renderMessage(msg, idx))}

                            {/* Loading bubble */}
                            {aiLoading && (
                                <div className="flex gap-3 mb-4">
                                    <div className="w-7 h-7 rounded-full bg-violet-600 shrink-0 flex items-center justify-center text-xs font-bold text-white">✦</div>
                                    <div className="bg-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></span>
                                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></span>
                                        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></span>
                                    </div>
                                </div>
                            )}

                            <div ref={chatBottomRef} />
                        </div>

                        {/* Gợi ý nhanh — hiện sau khi AI đã trả lời */}
                        {chatHistory.some(m => m.role === 'model') && !aiLoading && (
                            <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-gray-800 shrink-0">
                                {['Gợi ý cụ thể hơn', 'Cho ví dụ minh họa', 'Tại sao bị lỗi?'].map(suggestion => (
                                    <button
                                        key={suggestion}
                                        onClick={() => setInputText(suggestion)}
                                        className="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:border-violet-500 hover:text-violet-300 transition-all"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input chat */}
                        <div className="px-4 py-3 border-t border-gray-800 shrink-0">
                            <div className="flex gap-2 items-end">
                                <textarea
                                    value={inputText}
                                    onChange={(e) => setInputText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Hỏi thêm... (Enter gửi, Shift+Enter xuống dòng)"
                                    rows={2}
                                    className="flex-1 bg-gray-800 text-gray-200 text-sm px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-violet-500 resize-none placeholder-gray-600 transition-colors"
                                />
                                <button
                                    onClick={handleSendFollowUp}
                                    disabled={!inputText.trim() || aiLoading}
                                    className="px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
                                >
                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                                    </svg>
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1.5 ml-1">
                                💡 Thầy AI gợi ý dần từng bước — không cho đáp án trực tiếp
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeEditor;