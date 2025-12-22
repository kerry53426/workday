import React, { useState } from 'react';
import { Mountain, Lock, ArrowRight, Tent, HelpCircle, ChevronLeft } from 'lucide-react';
import { Employee } from '../types';

interface LoginScreenProps {
    employees: Employee[];
    ceoPasswordHash: string; // Passing the current password (simple comparison)
    employeePasswords: {[key: string]: string};
    onLogin: (role: 'manager' | 'employee', employeeId?: string) => void;
    onResetPassword: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
    employees, 
    ceoPasswordHash, 
    employeePasswords,
    onLogin, 
    onResetPassword 
}) => {
    const [activeTab, setActiveTab] = useState<'employee' | 'ceo'>('employee');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleCeoLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ceoPasswordHash) {
            onLogin('manager');
        } else {
            setError('密碼錯誤，請重新輸入');
        }
    };

    const handleEmployeeSelect = (id: string) => {
        setSelectedEmployeeId(id);
        setPassword('');
        setError('');
    };

    const handleEmployeeLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEmployeeId) return;

        // Default password is '1234' if not set
        const correctPassword = employeePasswords[selectedEmployeeId] || '1234';
        
        if (password === correctPassword) {
            onLogin('employee', selectedEmployeeId);
        } else {
            setError('密碼錯誤，預設密碼為 1234');
        }
    };

    const handleBackToSelection = () => {
        setSelectedEmployeeId(null);
        setPassword('');
        setError('');
    };

    const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f5f4] p-4 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-2/5 bg-[#064e3b] rounded-b-[3rem] z-0 shadow-xl"></div>
            
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-lg w-full border-t-8 border-[#d97706] overflow-hidden">
                {/* Header */}
                <div className="flex flex-col items-center pt-8 pb-6 px-8 bg-gradient-to-b from-white to-[#f5f5f4]">
                    <div className="w-20 h-20 bg-[#fef3c7] rounded-full flex items-center justify-center mb-4 shadow-inner border-4 border-white">
                        <Mountain size={40} className="text-[#d97706]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#064e3b] tracking-wide">愛上喜翁</h1>
                    <p className="text-[#78716c] text-sm mt-1 font-medium">營地排班與任務管理</p>
                </div>

                {/* Tabs (Only show when no specific employee is selected) */}
                {!selectedEmployeeId && (
                    <div className="flex border-b border-[#e7e5e4]">
                        <button
                            onClick={() => setActiveTab('employee')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                                activeTab === 'employee' 
                                    ? 'text-[#064e3b] border-b-2 border-[#064e3b] bg-white' 
                                    : 'text-[#a8a29e] bg-[#fafaf9] hover:bg-[#f5f5f4]'
                            }`}
                        >
                            <Tent size={18} />
                            我是夥伴
                        </button>
                        <button
                            onClick={() => setActiveTab('ceo')}
                            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
                                activeTab === 'ceo' 
                                    ? 'text-[#064e3b] border-b-2 border-[#064e3b] bg-white' 
                                    : 'text-[#a8a29e] bg-[#fafaf9] hover:bg-[#f5f5f4]'
                            }`}
                        >
                            <Lock size={18} />
                            執行長登入
                        </button>
                    </div>
                )}

                <div className="p-8 min-h-[300px]">
                    {activeTab === 'employee' ? (
                        !selectedEmployeeId ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <p className="text-center text-[#78716c] text-sm mb-4">請選擇您的大頭貼進入系統</p>
                                <div className="grid grid-cols-3 gap-4">
                                    {employees.map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => handleEmployeeSelect(emp.id)}
                                            className="flex flex-col items-center group"
                                        >
                                            <div className="w-16 h-16 rounded-full p-1 border-2 border-transparent group-hover:border-[#d97706] transition-all relative">
                                                <img 
                                                    src={emp.avatar} 
                                                    alt={emp.name} 
                                                    className="w-full h-full rounded-full object-cover shadow-sm group-hover:shadow-md transition-all" 
                                                />
                                            </div>
                                            <span className="mt-2 text-sm font-medium text-[#44403c] group-hover:text-[#d97706] transition-colors">
                                                {emp.name}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleEmployeeLogin} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center gap-3 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <button 
                                        type="button" 
                                        onClick={handleBackToSelection}
                                        className="text-gray-400 hover:text-gray-600 p-1"
                                    >
                                        <ChevronLeft size={24} />
                                    </button>
                                    <img src={selectedEmployee?.avatar} alt={selectedEmployee?.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                    <div>
                                        <p className="font-bold text-[#44403c]">{selectedEmployee?.name}</p>
                                        <p className="text-xs text-gray-500">請輸入登入密碼</p>
                                    </div>
                                </div>

                                <div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-gray-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-3 border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] transition-colors bg-[#f5f5f4] focus:bg-white"
                                            placeholder="輸入密碼"
                                            autoFocus
                                        />
                                    </div>
                                    {error && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {error}</p>}
                                </div>

                                <button
                                    type="submit"
                                    className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[#064e3b] hover:bg-[#065f46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#064e3b] transition-all transform hover:scale-[1.02]"
                                >
                                    登入系統 <ArrowRight size={16} />
                                </button>
                            </form>
                        )
                    ) : (
                        <form onSubmit={handleCeoLogin} className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300 pt-4">
                            <div>
                                <label className="block text-sm font-bold text-[#57534e] mb-2">管理密碼</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={18} className="text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-3 border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] transition-colors bg-[#f5f5f4] focus:bg-white"
                                        placeholder="輸入執行長密碼"
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-2 px-1">
                                    <p className="text-xs text-gray-400">預設密碼: 1234</p>
                                    <button 
                                        type="button" 
                                        onClick={onResetPassword}
                                        className="text-xs text-[#d97706] hover:text-[#b45309] hover:underline flex items-center gap-1"
                                    >
                                        <HelpCircle size={12} />
                                        忘記密碼？(重置)
                                    </button>
                                </div>
                                {error && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">⚠️ {error}</p>}
                            </div>

                            <button
                                type="submit"
                                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-[#064e3b] hover:bg-[#065f46] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#064e3b] transition-all transform hover:scale-[1.02]"
                            >
                                進入後台 <ArrowRight size={16} />
                            </button>
                        </form>
                    )}
                </div>

                <div className="bg-[#f5f5f4] py-3 text-center border-t border-[#e7e5e4]">
                    <p className="text-xs text-[#a8a29e]">© 愛上喜翁豪華露營 Glamping</p>
                </div>
            </div>
        </div>
    );
};