import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const MyAssignments = () => {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    const navigate = useNavigate();
    const [assignments, setAssignments] = useState([]);
    const [problems, setProblems] = useState({});

    useEffect(() => {
        fetchMyAssignments();
        fetchProblemsMap();
    }, []);

    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${token}` }
    });

    const fetchMyAssignments = async () => {
        try {
            const res = await axios.get(`${BACKEND}/api/classrooms/my-assignments`, getAuthHeaders());
            setAssignments(res.data);
        } catch (error) {
            console.error('Error fetching assignments:', error);
        }
    };

    const fetchProblemsMap = async () => {
        try {
            const res = await axios.get(`${BACKEND}/api/problems`, getAuthHeaders());
            const pMap = {};
            res.data.forEach(p => pMap[p.id] = p.title);
            setProblems(pMap);
        } catch (error) {
            console.error('Error fetching problems map:', error);
        }
    };

    const calculateStatus = (deadlineStr) => {
        const deadline = new Date(deadlineStr);
        const now = new Date();
        const diffTime = deadline - now;
        
        if (diffTime < 0) {
            return <span style={{ color: 'red', fontWeight: 'bold' }}>Đã Hết Hạn</span>;
        }
        
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return <span style={{ color: 'green', fontWeight: 'bold' }}>Còn {diffDays} ngày</span>;
    };

    const handleDoAssignment = (assignment) => {
        // Chuyển hướng sang trang làm bài kèm theo assignmentId
        navigate(`/problems/${assignment.problemId}?assignmentId=${assignment.id}`);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <h2>Bài Tập Của Tôi</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                    <tr style={{ background: '#f4f4f4' }}>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>ID</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Tên Bài Tập</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Hạn Nộp</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Trạng Thái</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Điểm Số</th>
                        <th style={{ border: '1px solid #ddd', padding: '12px' }}>Hành Động</th>
                    </tr>
                </thead>
                <tbody>
                    {assignments.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Chưa có bài tập nào được giao.</td></tr>
                    ) : (
                        assignments.map(a => (
                            <tr key={a.id}>
                                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>{a.id}</td>
                                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{problems[a.problemId] || 'Đang tải...'}</td>
                                <td style={{ border: '1px solid #ddd', padding: '12px' }}>{new Date(a.deadline).toLocaleString('vi-VN')}</td>
                                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>{calculateStatus(a.deadline)}</td>
                                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0056b3' }}>
                                    {a.highestScore !== undefined && a.highestScore !== null ? `${a.highestScore.toFixed(1)} đ` : 'Chưa làm'}
                                </td>
                                <td style={{ border: '1px solid #ddd', padding: '12px', textAlign: 'center' }}>
                                    <button 
                                        onClick={() => handleDoAssignment(a)}
                                        style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                        Làm Bài Ngay
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default MyAssignments;
