import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { Code } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Login({ isRegister = false }) {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [isTestInstructor, setIsTestInstructor] = useState(false);

    const handleGoogleSuccess = (credentialResponse) => {
        login(credentialResponse.credential, isTestInstructor);
    };

    const handleGoogleError = () => {
        alert("Có lỗi xảy ra khi kết nối với Google.");
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-950 flex items-center justify-center p-4">
            <div className="bg-slate-900 p-8 rounded-xl border border-slate-800 w-full max-w-md shadow-2xl">
                <div className="text-center mb-8">
                    <Code className="text-emerald-500 mx-auto mb-2" size={40} />
                    <h2 className="text-2xl font-bold text-white">{isRegister ? 'Đăng ký nhanh' : 'Đăng nhập vào hệ thống'}</h2>
                    <p className="text-slate-400 mt-2 text-sm">Hệ thống Học Lập Trình & Chấm Code Tự Động</p>
                </div>

                <div className="flex justify-center mt-6 mb-6 bg-white p-2 rounded-full w-max mx-auto shadow-sm">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                        size="large"
                        shape="pill"
                        text={isRegister ? "signup_with" : "signin_with"}
                    />
                </div>

                <div className="pt-2">
                    <label className="block text-sm font-medium text-slate-400 mb-3">Tùy chọn đăng nhập test</label>
                    <label className="flex items-center gap-3 text-white cursor-pointer bg-slate-800 p-3 rounded-md border border-slate-700 hover:border-slate-600 transition">
                        <input 
                            type="checkbox" 
                            checked={isTestInstructor}
                            onChange={(e) => setIsTestInstructor(e.target.checked)}
                            className="w-4 h-4 text-purple-500 focus:ring-purple-500 rounded bg-slate-900 border-slate-600" 
                        /> 
                        <span className="font-medium text-purple-400">Đăng nhập dưới tư cách Giảng Viên</span>
                    </label>
                </div>

                <div className="mt-8 text-center text-slate-400 text-sm border-t border-slate-800 pt-6">
                    {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'} {' '}
                    <span onClick={() => navigate(isRegister ? '/login' : '/register')} className="text-emerald-400 hover:underline cursor-pointer font-medium">
                        {isRegister ? 'Đăng nhập' : 'Đăng ký ngay'}
                    </span>
                </div>
            </div>
        </div>
    );
}
