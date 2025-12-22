import React, { useState } from 'react';
import { Employee, COLORS, generateUUID } from '../types';
import { X, Users, Plus, Trash2, Save, UserPlus, Coins, RefreshCw } from 'lucide-react';

interface EmployeeManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    employees: Employee[];
    onUpdateEmployees: (updated: Employee[]) => void;
}

export const EmployeeManagerModal: React.FC<EmployeeManagerModalProps> = ({ isOpen, onClose, employees, onUpdateEmployees }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Employee>>({});
    const [isAdding, setIsAdding] = useState(false);
    const [newEmployeeName, setNewEmployeeName] = useState('');
    const [newEmployeeWage, setNewEmployeeWage] = useState(185);

    if (!isOpen) return null;

    const handleEditClick = (emp: Employee) => {
        setEditingId(emp.id);
        setEditForm({ ...emp });
        setIsAdding(false);
    };

    const handleSaveEdit = () => {
        if (!editingId || !editForm) return;
        const updatedEmployees = employees.map(emp => 
            emp.id === editingId ? { ...emp, ...editForm } as Employee : emp
        );
        onUpdateEmployees(updatedEmployees);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('確定要刪除這位夥伴嗎？相關的歷史排班記錄可能無法正確顯示其資訊。')) {
            onUpdateEmployees(employees.filter(e => e.id !== id));
        }
    };

    const handleAdd = () => {
        if (!newEmployeeName.trim()) return;
        const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        const seed = Math.random().toString(36).substring(7);
        const newEmp: Employee = {
            id: generateUUID(),
            name: newEmployeeName,
            email: `${generateUUID()}@aishang.com`, // Dummy email for ID
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${randomColor.split('-')[1]}`,
            color: randomColor,
            hourlyWage: newEmployeeWage
        };
        onUpdateEmployees([...employees, newEmp]);
        setNewEmployeeName('');
        setNewEmployeeWage(185);
        setIsAdding(false);
    };

    const handleChangeColor = (empId: string) => {
        const updatedEmployees = employees.map(emp => {
            if (emp.id === empId) {
                // Cycle to next color
                const currentIndex = COLORS.indexOf(emp.color);
                const nextColor = COLORS[(currentIndex + 1) % COLORS.length];
                return { ...emp, color: nextColor };
            }
            return emp;
        });
        onUpdateEmployees(updatedEmployees);
        if (editingId === empId) {
            setEditForm(prev => ({ ...prev, color: updatedEmployees.find(e => e.id === empId)?.color }));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064e3b] bg-opacity-70 backdrop-blur-sm">
            <div className="bg-[#fcfaf8] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-[#e7e5e4] flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#e7e5e4] bg-[#f5f5f4] flex-shrink-0 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#d97706] text-white rounded-lg shadow-sm">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#44403c]">夥伴資料管理</h3>
                            <p className="text-xs text-[#78716c] font-medium">新增成員、設定薪資與個人風格</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto bg-white flex-1">
                    
                    {/* Add New Section */}
                    <div className="mb-6 bg-[#fafaf9] p-4 rounded-xl border border-[#e7e5e4]">
                        <div className="flex items-center gap-2 mb-3">
                            <UserPlus size={18} className="text-[#064e3b]" />
                            <h4 className="font-bold text-[#44403c] text-sm">新增夥伴</h4>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input 
                                type="text" 
                                placeholder="夥伴姓名 / 暱稱" 
                                value={newEmployeeName}
                                onChange={(e) => setNewEmployeeName(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] text-sm"
                            />
                            <div className="flex items-center gap-2 bg-white px-3 py-2 border border-gray-300 rounded-lg sm:w-40">
                                <Coins size={16} className="text-gray-400" />
                                <input 
                                    type="number" 
                                    placeholder="時薪" 
                                    value={newEmployeeWage}
                                    onChange={(e) => setNewEmployeeWage(Number(e.target.value))}
                                    className="w-full focus:outline-none text-sm"
                                />
                            </div>
                            <button 
                                onClick={handleAdd}
                                disabled={!newEmployeeName.trim()}
                                className="bg-[#064e3b] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#065f46] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                            >
                                <Plus size={16} /> 新增
                            </button>
                        </div>
                    </div>

                    {/* Employee List */}
                    <div className="space-y-3">
                        {employees.map(emp => (
                            <div key={emp.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl border border-[#e7e5e4] hover:shadow-sm transition-shadow bg-white">
                                {editingId === emp.id ? (
                                    // Editing Mode
                                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-gray-500">姓名</label>
                                            <input 
                                                type="text" 
                                                value={editForm.name || ''} 
                                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                className="px-2 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <label className="text-xs font-bold text-gray-500">時薪 ($)</label>
                                            <input 
                                                type="number" 
                                                value={editForm.hourlyWage || 0} 
                                                onChange={(e) => setEditForm({...editForm, hourlyWage: Number(e.target.value)})}
                                                className="px-2 py-1.5 border rounded text-sm"
                                            />
                                        </div>
                                         <div className="flex items-end gap-2">
                                            <button onClick={handleSaveEdit} className="flex-1 bg-emerald-600 text-white py-1.5 rounded text-sm hover:bg-emerald-700 flex items-center justify-center gap-1">
                                                <Save size={14} /> 儲存
                                            </button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded text-sm hover:bg-gray-200">
                                                取消
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // View Mode
                                    <>
                                        <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
                                            <div className="relative group cursor-pointer" onClick={() => handleChangeColor(emp.id)} title="點擊更換主題色">
                                                <img src={emp.avatar} alt={emp.name} className="w-12 h-12 rounded-full border border-gray-200 shadow-sm" />
                                                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <RefreshCw size={16} className="text-white" />
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-[#44403c]">{emp.name}</h4>
                                                <div className={`text-[10px] px-2 py-0.5 rounded border inline-block mt-1 ${emp.color}`}>
                                                    主題預覽
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between w-full sm:w-auto gap-6">
                                            <div className="text-center">
                                                <div className="text-xs text-gray-400 mb-0.5">時薪</div>
                                                <div className="font-bold text-[#064e3b] bg-emerald-50 px-3 py-1 rounded-full text-sm">
                                                    ${emp.hourlyWage}
                                                </div>
                                            </div>
                                            
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleEditClick(emp)} 
                                                    className="p-2 text-gray-400 hover:text-[#d97706] hover:bg-amber-50 rounded-full transition-colors"
                                                    title="編輯"
                                                >
                                                    <Users size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(emp.id)} 
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="刪除"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
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
