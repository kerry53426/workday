
import React, { useState, useRef } from 'react';
import { Employee, COLORS, generateUUID } from '../types';
import { X, Users, Plus, Trash2, Save, UserPlus, Coins, RefreshCw, Camera, Upload, Key } from 'lucide-react';

interface EmployeeManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    onUpdateEmployees: (updated: Employee[]) => void;
}

export const EmployeeManagerModal: React.FC<EmployeeManagerModalProps> = ({ isOpen, onClose, employees, onUpdateEmployees }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Employee>>({});
    const [newEmployeeName, setNewEmployeeName] = useState('');
    const [newEmployeeWage, setNewEmployeeWage] = useState(185);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleEditClick = (emp: Employee) => {
        setEditingId(emp.id);
        setEditForm({ ...emp });
    };

    const handleSaveEdit = () => {
        if (!editingId || !editForm) return;
        onUpdateEmployees(employees.map(emp => emp.id === editingId ? { ...emp, ...editForm } as Employee : emp));
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('確定要刪除這位夥伴嗎？')) {
            onUpdateEmployees(employees.filter(e => e.id !== id));
        }
    };

    const resetPassword = (id: string) => {
        if (window.confirm('確定將此夥伴密碼重置為 1234？')) {
            onUpdateEmployees(employees.map(emp => emp.id === id ? { ...emp, password: '1234' } : emp));
            alert("已重置！");
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, empId?: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            if (empId) {
                onUpdateEmployees(employees.map(emp => emp.id === empId ? { ...emp, avatar: base64String } : emp));
                if (editingId === empId) setEditForm(prev => ({ ...prev, avatar: base64String }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleAdd = () => {
        if (!newEmployeeName.trim()) return;
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const newEmp: Employee = {
            id: generateUUID(),
            name: newEmployeeName,
            email: `${generateUUID()}@aishang.com`,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${generateUUID()}&backgroundColor=${randomColor.split('-')[1]}`,
            color: randomColor,
            hourlyWage: newEmployeeWage,
            password: '1234'
        };
        onUpdateEmployees([...employees, newEmp]);
        setNewEmployeeName('');
        setNewEmployeeWage(185);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064e3b]/80 backdrop-blur-sm">
            <div className="bg-[#fcfaf8] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl font-bold flex items-center gap-3"><Users className="text-[#d97706]" size={24} /> 夥伴成員管理</h3>
                    <button onClick={onClose} className="p-1 bg-white border rounded-full"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, editingId || undefined)} />
                    
                    <div className="bg-[#fafaf9] p-4 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-3"><UserPlus size={18} className="text-[#064e3b]" /><h4 className="font-bold text-sm">新增夥伴成員</h4></div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input type="text" placeholder="夥伴姓名" value={newEmployeeName} onChange={e=>setNewEmployeeName(e.target.value)} className="flex-1 p-2 border rounded-lg text-sm font-bold" />
                            <input type="number" placeholder="時薪" value={newEmployeeWage} onChange={e=>setNewEmployeeWage(Number(e.target.value))} className="sm:w-24 p-2 border rounded-lg text-sm font-bold" />
                            <button onClick={handleAdd} className="bg-[#064e3b] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md">確認新增</button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {employees.map(emp => (
                            <div key={emp.id} className="p-4 rounded-xl border bg-white flex flex-col sm:flex-row items-center gap-4 shadow-sm">
                                {editingId === emp.id ? (
                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-400">大頭貼</label>
                                            <button onClick={() => fileInputRef.current?.click()} className="relative group w-12 h-12">
                                                <img src={editForm.avatar || emp.avatar} className="w-12 h-12 rounded-full object-cover border" />
                                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={14} className="text-white"/></div>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-400">姓名</label>
                                            <input type="text" value={editForm.name} onChange={e=>setEditForm({...editForm, name:e.target.value})} className="p-1.5 border rounded text-sm font-bold"/>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-[10px] font-bold text-gray-400">時薪</label>
                                            <input type="number" value={editForm.hourlyWage} onChange={e=>setEditForm({...editForm, hourlyWage:Number(e.target.value)})} className="p-1.5 border rounded text-sm font-bold"/>
                                        </div>
                                        <div className="col-span-full flex justify-end gap-2">
                                            <button onClick={()=>setEditingId(null)} className="text-xs text-gray-400 font-bold">取消</button>
                                            <button onClick={handleSaveEdit} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow-md">儲存修改</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 flex-1 w-full">
                                            <div className="relative">
                                                <img src={emp.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-gray-100" />
                                                <div className="absolute -bottom-1 -right-1 bg-[#d97706] w-3 h-3 rounded-full border-2 border-white"></div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-700">{emp.name}</h4>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 rounded">時薪: ${emp.hourlyWage}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold italic">密碼: {emp.password ? '******' : '未設定'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={()=>resetPassword(emp.id)} className="p-2 text-gray-400 hover:text-blue-500" title="重置密碼"><Key size={18}/></button>
                                            <button onClick={()=>handleEditClick(emp)} className="p-2 text-gray-400 hover:text-amber-600"><RefreshCw size={18}/></button>
                                            <button onClick={()=>handleDelete(emp.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={18}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
