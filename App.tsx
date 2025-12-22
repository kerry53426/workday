import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { CalendarView } from './components/CalendarView';
import { ShiftModal } from './components/ShiftModal';
import { EmployeePortal } from './components/EmployeePortal';
import { LoginScreen } from './components/LoginScreen';
import { StatsModal } from './components/StatsModal';
import { Employee, Shift, INITIAL_EMPLOYEES, TaskCategory, DEFAULT_TASK_CATEGORIES } from './types';
import { addWeeks, subWeeks, format } from 'date-fns';
import { ChevronLeft, ChevronRight, Share2, Users, Tent, LogOut, ArrowLeftCircle, KeyRound, Settings, Calculator, Download, Upload, Database } from 'lucide-react';

// Mock data initialization
const loadInitialShifts = (): Shift[] => {
    const saved = localStorage.getItem('sm_shifts');
    if (saved) return JSON.parse(saved);
    return [];
};

const getStoredPassword = (): string => {
    return localStorage.getItem('sm_ceo_pwd') || '1234';
};

// Load task categories from storage or use default
const loadTaskCategories = (): TaskCategory[] => {
    const saved = localStorage.getItem('sm_task_categories');
    if (saved) return JSON.parse(saved);

    // Migration check for old flat structure
    const oldSaved = localStorage.getItem('sm_common_tasks');
    if (oldSaved) {
        try {
            const oldTasks = JSON.parse(oldSaved);
            if (Array.isArray(oldTasks) && typeof oldTasks[0] === 'string') {
                return [
                    ...DEFAULT_TASK_CATEGORIES,
                    { id: 'custom_migrated', name: '自訂/舊資料', tasks: oldTasks }
                ];
            }
        } catch (e) {}
    }

    return DEFAULT_TASK_CATEGORIES;
};

const App: React.FC = () => {
    // State
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<'manager' | 'employee' | null>(null);
    const [ceoPassword, setCeoPassword] = useState(getStoredPassword());
    
    const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>(loadInitialShifts());
    const [taskCategories, setTaskCategories] = useState<TaskCategory[]>(loadTaskCategories()); // New State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [modalDate, setModalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [editingShift, setEditingShift] = useState<Shift | undefined>(undefined);

    // File input ref for restore
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('sm_shifts', JSON.stringify(shifts));
    }, [shifts]);

    useEffect(() => {
        localStorage.setItem('sm_task_categories', JSON.stringify(taskCategories));
    }, [taskCategories]);

    // Handlers
    const handleLogin = (role: 'manager' | 'employee', employeeId?: string) => {
        setIsLoggedIn(true);
        setUserRole(role);
        if (role === 'employee' && employeeId) {
            setCurrentEmployeeId(employeeId);
        } else {
            setCurrentEmployeeId(null);
        }
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setUserRole(null);
        setCurrentEmployeeId(null);
        setIsStatsOpen(false);
    };

    const handleChangePassword = () => {
        const newPassword = window.prompt("請設定新的執行長密碼：");
        if (newPassword && newPassword.trim() !== "") {
            setCeoPassword(newPassword);
            localStorage.setItem('sm_ceo_pwd', newPassword);
            alert("密碼更新成功！");
        }
    };

    const handleResetPassword = () => {
        if (window.confirm("確定要將密碼重置為預設值 '1234' 嗎？")) {
            const defaultPwd = '1234';
            setCeoPassword(defaultPwd);
            localStorage.setItem('sm_ceo_pwd', defaultPwd);
            alert("密碼已重置為 1234，請使用新密碼登入。");
        }
    };

    const handleUpdateTaskCategories = (newCategories: TaskCategory[]) => {
        setTaskCategories(newCategories);
    };

    // --- Backup & Restore Logic ---
    const handleExportData = () => {
        const data = {
            shifts,
            taskCategories // Updated from commonTasks
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `愛上喜翁_排班備份_${format(new Date(), 'yyyyMMdd')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsedData = JSON.parse(content);
                
                // Backward compatibility check or simple array check
                const newShifts = Array.isArray(parsedData) ? parsedData : parsedData.shifts;
                // Handle new vs old backup structure
                let newTaskCategories = taskCategories;
                if (parsedData.taskCategories) {
                    newTaskCategories = parsedData.taskCategories;
                } else if (parsedData.commonTasks && Array.isArray(parsedData.commonTasks) && typeof parsedData.commonTasks[0] === 'string') {
                    // Migrate old backup
                     newTaskCategories = [
                        ...DEFAULT_TASK_CATEGORIES,
                        { id: 'restored_legacy', name: '還原/舊資料', tasks: parsedData.commonTasks }
                    ];
                }

                if (Array.isArray(newShifts)) {
                    if (window.confirm(`確定要還原備份嗎？\n這將會覆蓋目前的 ${shifts.length} 筆排班資料。`)) {
                        setShifts(newShifts);
                        setTaskCategories(newTaskCategories);
                        alert("資料還原成功！");
                    }
                } else {
                    alert("檔案格式錯誤，請確認這是正確的備份檔案。");
                }
            } catch (error) {
                console.error("Import error:", error);
                alert("讀取檔案失敗，請重試。");
            }
        };
        reader.readAsText(file);
        // Reset input so same file can be selected again if needed
        event.target.value = '';
    };

    const handleAddShift = (date: string) => {
        if (userRole !== 'manager') return;
        setModalDate(date);
        setEditingShift(undefined);
        setIsModalOpen(true);
    };

    const handleEditShift = (shift: Shift) => {
        if (userRole !== 'manager') return;
        setEditingShift(shift);
        setIsModalOpen(true);
    };

    const handleSaveShift = (shiftData: Shift | Shift[]) => {
        setShifts(prevShifts => {
            const dataArray = Array.isArray(shiftData) ? shiftData : [shiftData];
            let newShifts = [...prevShifts];

            dataArray.forEach(newItem => {
                const index = newShifts.findIndex(s => s.id === newItem.id);
                if (index >= 0) {
                    newShifts[index] = newItem; // Update
                } else {
                    newShifts.push(newItem); // Create
                }
            });
            return newShifts;
        });
    };

    const handleDeleteShift = (id: string) => {
        setShifts(shifts.filter(s => s.id !== id));
    };

    const handleToggleTask = (shiftId: string, taskId: string) => {
        setShifts(shifts.map(shift => {
            if (shift.id !== shiftId) return shift;
            return {
                ...shift,
                tasks: shift.tasks.map(task => 
                    task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
                )
            };
        }));
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentDate(curr => direction === 'next' ? addWeeks(curr, 1) : subWeeks(curr, 1));
    };

    // Derived State
    const currentEmployee = INITIAL_EMPLOYEES.find(e => e.id === currentEmployeeId);

    if (!isLoggedIn) {
        return (
            <LoginScreen 
                employees={INITIAL_EMPLOYEES} 
                ceoPasswordHash={ceoPassword} 
                onLogin={handleLogin}
                onResetPassword={handleResetPassword}
            />
        );
    }

    // Render Actions based on View
    const renderHeaderActions = () => {
        if (userRole === 'manager') {
            return (
                <div className="flex items-center gap-2">
                    <div className="bg-[#064e3b] bg-opacity-20 border border-[#064e3b]/30 rounded-lg flex p-1 mr-2 text-white">
                        <button onClick={() => navigateWeek('prev')} className="p-1 hover:bg-[#064e3b]/40 rounded">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="px-3 py-1 text-sm font-medium min-w-[120px] text-center">
                            {format(currentDate, 'yyyy年 M月')}
                        </span>
                        <button onClick={() => navigateWeek('next')} className="p-1 hover:bg-[#064e3b]/40 rounded">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Data Management Group */}
                    <div className="hidden md:flex items-center gap-1 bg-amber-500/20 rounded-lg p-1 border border-amber-500/30 mr-2">
                         <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept=".json"
                            className="hidden" 
                        />
                        <button
                            onClick={handleExportData}
                            className="flex items-center gap-1 px-2 py-1.5 text-amber-100 hover:text-white hover:bg-amber-600/50 rounded transition-colors text-xs font-medium"
                            title="備份資料 (下載)"
                        >
                            <Download size={14} />
                            備份
                        </button>
                        <div className="w-px h-3 bg-amber-500/30 mx-0.5"></div>
                        <button
                            onClick={handleImportClick}
                            className="flex items-center gap-1 px-2 py-1.5 text-amber-100 hover:text-white hover:bg-amber-600/50 rounded transition-colors text-xs font-medium"
                            title="還原資料 (上傳)"
                        >
                            <Upload size={14} />
                            還原
                        </button>
                    </div>

                    {/* Stats Button */}
                    <button
                        onClick={() => setIsStatsOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-[#0284c7] text-white rounded-md text-sm font-medium hover:bg-[#0369a1] transition-colors shadow-sm mr-2"
                        title="查看工時統計"
                    >
                        <Calculator size={16} />
                        <span className="hidden lg:inline">工時統計</span>
                    </button>

                    <div className="flex items-center gap-1 bg-[#ffffff10] rounded-lg p-1 border border-[#ffffff20]">
                        <button 
                            onClick={handleChangePassword}
                            className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white px-3 py-1.5 rounded hover:bg-[#ffffff20] transition-colors"
                            title="更改密碼"
                        >
                            <Settings size={16} />
                        </button>
                        
                        <div className="w-px h-4 bg-white/20 mx-1"></div>

                        <button 
                            onClick={handleLogout}
                            className="flex items-center gap-2 text-sm font-medium text-[#fca5a5] hover:text-red-300 px-3 py-1.5 rounded hover:bg-[#ffffff20] transition-colors"
                            title="登出系統"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            );
        } else {
            return null; // Employee actions are inside the portal
        }
    };

    return (
        <Layout 
            title={userRole === 'manager' ? "營運總覽" : "夥伴專區"}
            actions={renderHeaderActions()}
        >
            {userRole === 'manager' ? (
                <>
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-[#44403c]">營地排班表</h2>
                            <p className="text-[#78716c]">管理營地運作，分配夥伴任務與職責。</p>
                        </div>
                        <div className="flex gap-2">
                            {/* Mobile Data Buttons */}
                            <div className="flex md:hidden items-center gap-1 bg-amber-100 rounded-lg p-1 border border-amber-200">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".json"
                                    className="hidden" 
                                />
                                <button
                                    onClick={handleExportData}
                                    className="p-2 text-amber-700 hover:bg-amber-200 rounded"
                                    title="備份資料"
                                >
                                    <Download size={18} />
                                </button>
                                <button
                                    onClick={handleImportClick}
                                    className="p-2 text-amber-700 hover:bg-amber-200 rounded"
                                    title="還原資料"
                                >
                                    <Upload size={18} />
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => handleAddShift(format(new Date(), 'yyyy-MM-dd'))}
                                className="bg-[#064e3b] hover:bg-[#065f46] text-white px-5 py-2.5 rounded-lg font-medium shadow-md transition-all flex items-center gap-2"
                            >
                                <Tent size={18} />
                                <span className="hidden sm:inline">新增排班</span>
                                <span className="sm:hidden">排班</span>
                            </button>
                        </div>
                    </div>

                    <CalendarView 
                        currentDate={currentDate}
                        shifts={shifts}
                        employees={INITIAL_EMPLOYEES}
                        onAddShift={handleAddShift}
                        onEditShift={handleEditShift}
                    />

                    <div className="mt-8 bg-white p-6 rounded-xl border border-[#e7e5e4] shadow-sm">
                        <h3 className="text-lg font-bold text-[#44403c] mb-4 flex items-center gap-2">
                            <Users size={20} className="text-[#d97706]" /> 營地夥伴概況
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {INITIAL_EMPLOYEES.map(emp => {
                                const shiftCount = shifts.filter(s => s.employeeId === emp.id).length;
                                return (
                                    <div key={emp.id} className="flex flex-col items-center p-4 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] hover:border-[#d97706] transition-colors">
                                        <img src={emp.avatar} alt={emp.name} className="w-14 h-14 rounded-full mb-3 shadow-sm" />
                                        <div className="text-center">
                                            <div className="font-bold text-[#44403c]">{emp.name}</div>
                                            <div className="text-xs text-[#78716c] mt-1 bg-[#e7e5e4] px-2 py-0.5 rounded-full">{shiftCount} 個排班</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <ShiftModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={handleSaveShift}
                        onDelete={handleDeleteShift}
                        initialDate={modalDate}
                        employees={INITIAL_EMPLOYEES}
                        existingShift={editingShift}
                        taskCategories={taskCategories}
                        onUpdateTaskCategories={handleUpdateTaskCategories}
                        shifts={shifts} // Passed for conflict detection
                    />

                    <StatsModal
                        isOpen={isStatsOpen}
                        onClose={() => setIsStatsOpen(false)}
                        currentDate={currentDate}
                        shifts={shifts}
                        employees={INITIAL_EMPLOYEES}
                    />
                </>
            ) : (
                currentEmployee && (
                    <EmployeePortal
                        employee={currentEmployee}
                        shifts={shifts}
                        onToggleTask={handleToggleTask}
                        onLogout={handleLogout}
                    />
                )
            )}
        </Layout>
    );
};

export default App;