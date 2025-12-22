import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { CalendarView } from './components/CalendarView';
import { ShiftModal } from './components/ShiftModal';
import { EmployeePortal } from './components/EmployeePortal';
import { LoginScreen } from './components/LoginScreen';
import { StatsModal } from './components/StatsModal';
import { FeedbackModal } from './components/FeedbackModal';
import { EmployeeManagerModal } from './components/EmployeeManagerModal';
import { Shift, INITIAL_EMPLOYEES, Employee, TaskCategory, DEFAULT_TASK_CATEGORIES, Notification, Feedback, generateUUID } from './types';
import { addWeeks, subWeeks, format } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, Tent, LogOut, Settings, Calculator, Download, Upload, Bell, Check, Trash2, MessageSquareQuote } from 'lucide-react';

// Mock data initialization
const loadInitialShifts = (): Shift[] => {
    const saved = localStorage.getItem('sm_shifts');
    if (saved) return JSON.parse(saved);
    return [];
};

const loadNotifications = (): Notification[] => {
    const saved = localStorage.getItem('sm_notifications');
    if (saved) return JSON.parse(saved);
    return [];
};

const loadFeedbacks = (): Feedback[] => {
    const saved = localStorage.getItem('sm_feedbacks');
    if (saved) return JSON.parse(saved);
    return [];
};

const loadEmployees = (): Employee[] => {
    const saved = localStorage.getItem('sm_employees');
    if (saved) {
        // Migration: Ensure hourlyWage exists if loading old data
        const emps = JSON.parse(saved);
        return emps.map((e: any) => ({
            ...e,
            hourlyWage: e.hourlyWage || 185
        }));
    }
    return INITIAL_EMPLOYEES;
};

const loadEmployeePasswords = (): {[key: string]: string} => {
    const saved = localStorage.getItem('sm_employee_pwds');
    if (saved) return JSON.parse(saved);
    // Initialize defaults if empty
    return {};
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
    const [employeePasswords, setEmployeePasswords] = useState<{[key: string]: string}>(loadEmployeePasswords());
    
    const [employees, setEmployees] = useState<Employee[]>(loadEmployees());
    const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [shifts, setShifts] = useState<Shift[]>(loadInitialShifts());
    const [taskCategories, setTaskCategories] = useState<TaskCategory[]>(loadTaskCategories()); 
    const [notifications, setNotifications] = useState<Notification[]>(loadNotifications()); 
    const [feedbacks, setFeedbacks] = useState<Feedback[]>(loadFeedbacks());

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalReadOnly, setIsModalReadOnly] = useState(false); 
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isEmployeeManagerOpen, setIsEmployeeManagerOpen] = useState(false); // New modal state
    const [isNotificationOpen, setIsNotificationOpen] = useState(false); 
    const [modalDate, setModalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [editingShift, setEditingShift] = useState<Shift | undefined>(undefined);

    // File input ref for restore
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notificationRef = useRef<HTMLDivElement>(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('sm_shifts', JSON.stringify(shifts));
    }, [shifts]);

    useEffect(() => {
        localStorage.setItem('sm_task_categories', JSON.stringify(taskCategories));
    }, [taskCategories]);

    useEffect(() => {
        localStorage.setItem('sm_notifications', JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        localStorage.setItem('sm_feedbacks', JSON.stringify(feedbacks));
    }, [feedbacks]);

    useEffect(() => {
        localStorage.setItem('sm_employee_pwds', JSON.stringify(employeePasswords));
    }, [employeePasswords]);

    useEffect(() => {
        localStorage.setItem('sm_employees', JSON.stringify(employees));
    }, [employees]);

    // Click outside to close notification dropdown
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

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
        setIsNotificationOpen(false);
        setIsFeedbackModalOpen(false);
        setIsEmployeeManagerOpen(false);
        setIsModalOpen(false);
    };

    const handleChangePassword = () => {
        const newPassword = window.prompt("請設定新的執行長密碼：");
        if (newPassword && newPassword.trim() !== "") {
            setCeoPassword(newPassword);
            localStorage.setItem('sm_ceo_pwd', newPassword);
            alert("密碼更新成功！");
        }
    };

    const handleEmployeeChangePassword = (newPassword: string) => {
        if (!currentEmployeeId) return;
        setEmployeePasswords(prev => ({
            ...prev,
            [currentEmployeeId]: newPassword
        }));
    };

    const handleSendFeedback = (content: string) => {
        if (!currentEmployeeId) return;
        const newFeedback: Feedback = {
            id: generateUUID(),
            employeeId: currentEmployeeId,
            content,
            date: new Date().toISOString(),
            isRead: false
        };
        setFeedbacks(prev => [newFeedback, ...prev]);
    };

    const handleFeedbackMarkAsRead = (id: string) => {
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, isRead: true } : f));
    };

    const handleUpdateFeedback = (id: string, updates: Partial<Feedback>) => {
        setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const handleDeleteFeedback = (id: string) => {
        if(window.confirm('確定要刪除此留言嗎？')) {
            setFeedbacks(prev => prev.filter(f => f.id !== id));
        }
    };

    const handleDeleteAllReadFeedbacks = () => {
        if (window.confirm("確定要刪除所有已讀的留言嗎？此動作無法復原。")) {
            setFeedbacks(prev => prev.filter(f => !f.isRead));
        }
    };

    const handleResetPassword = () => {
        if (window.confirm("確定要將執行長密碼重置為預設值 '1234' 嗎？")) {
            const defaultPwd = '1234';
            setCeoPassword(defaultPwd);
            localStorage.setItem('sm_ceo_pwd', defaultPwd);
            alert("密碼已重置為 1234，請使用新密碼登入。");
        }
    };

    const handleUpdateTaskCategories = (newCategories: TaskCategory[]) => {
        setTaskCategories(newCategories);
    };

    const handleUpdateEmployees = (newEmployees: Employee[]) => {
        setEmployees(newEmployees);
    };

    // --- Notification Logic ---
    const handleMarkAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const handleClearNotifications = () => {
        if (window.confirm('確定要清空所有通知嗎？')) {
            setNotifications([]);
        }
    };

    // --- Backup & Restore Logic ---
    const handleExportData = () => {
        const data = {
            shifts,
            taskCategories,
            notifications,
            feedbacks,
            employeePasswords,
            employees // Include employees in backup
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
                
                const newShifts = Array.isArray(parsedData) ? parsedData : parsedData.shifts;
                let newTaskCategories = taskCategories;
                let newNotifications = notifications;
                let newFeedbacks = feedbacks;
                let newEmployeePasswords = employeePasswords;
                let newEmployees = employees;

                if (parsedData.taskCategories) {
                    newTaskCategories = parsedData.taskCategories;
                } else if (parsedData.commonTasks && Array.isArray(parsedData.commonTasks) && typeof parsedData.commonTasks[0] === 'string') {
                     newTaskCategories = [
                        ...DEFAULT_TASK_CATEGORIES,
                        { id: 'restored_legacy', name: '還原/舊資料', tasks: parsedData.commonTasks }
                    ];
                }

                if (parsedData.notifications) newNotifications = parsedData.notifications;
                if (parsedData.feedbacks) newFeedbacks = parsedData.feedbacks;
                if (parsedData.employeePasswords) newEmployeePasswords = parsedData.employeePasswords;
                if (parsedData.employees) newEmployees = parsedData.employees;

                if (Array.isArray(newShifts)) {
                    if (window.confirm(`確定要還原備份嗎？\n這將會覆蓋目前的 ${shifts.length} 筆排班資料。`)) {
                        setShifts(newShifts);
                        setTaskCategories(newTaskCategories);
                        setNotifications(newNotifications);
                        setFeedbacks(newFeedbacks);
                        setEmployeePasswords(newEmployeePasswords);
                        setEmployees(newEmployees);
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
        event.target.value = '';
    };

    const handleAddShift = (date: string) => {
        if (userRole !== 'manager') return;
        setModalDate(date);
        setEditingShift(undefined);
        setIsModalReadOnly(false);
        setIsModalOpen(true);
    };

    const handleEditShift = (shift: Shift) => {
        if (userRole !== 'manager') return;
        setEditingShift(shift);
        setIsModalReadOnly(false);
        setIsModalOpen(true);
    };

    const handleViewShift = (shift: Shift) => {
        setEditingShift(shift);
        setIsModalReadOnly(true); // Enable Read Only
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

    const handleToggleTask = (shiftId: string, taskId: string, completerId?: string) => {
        // Find existing data first to generate notification if needed
        const shift = shifts.find(s => s.id === shiftId);
        const task = shift?.tasks.find(t => t.id === taskId);
        
        // Who is performing the action? 
        // If completerId is passed (from Modal selection), use it. 
        // Otherwise default to current user (for simple toggle).
        const actorId = currentEmployeeId;
        const actualCompleterId = completerId || currentEmployeeId;

        // Logic for Notification
        try {
            if (task && !task.isCompleted && shift) {
                const completer = employees.find(e => e.id === actualCompleterId);
                const shiftOwner = employees.find(e => e.id === shift.employeeId);

                // Notify Shift Owner if someone else completes their task
                // Logic: If the person who completed it (completerId) IS NOT the shift owner
                if (completer && shiftOwner && actualCompleterId !== shift.employeeId) {
                     const newNotif: Notification = {
                         id: generateUUID(),
                         type: 'help_received',
                         title: `夥伴協助完成了任務`,
                         message: `${completer.name} 協助完成了您的任務：${task.description}`,
                         timestamp: Date.now(),
                         isRead: false,
                         relatedShiftId: shiftId
                     };
                     setNotifications(prev => [newNotif, ...prev]);
                }
            }
        } catch (error) {
            console.error("Failed to generate notification:", error);
        }

        setShifts(prevShifts => prevShifts.map(s => {
            if (s.id !== shiftId) return s;
            return {
                ...s,
                tasks: (s.tasks || []).map(t => {
                    if (t.id !== taskId) return t;
                    const isNowCompleted = !t.isCompleted;
                    return { 
                        ...t, 
                        isCompleted: isNowCompleted,
                        // If marking as complete, record who did it. If unchecking, clear it.
                        completedBy: isNowCompleted ? actualCompleterId : undefined
                    };
                })
            };
        }));
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        setCurrentDate(curr => direction === 'next' ? addWeeks(curr, 1) : subWeeks(curr, 1));
    };

    // Derived State
    const currentEmployee = employees.find(e => e.id === currentEmployeeId);
    const unreadNotifications = notifications.filter(n => !n.isRead).length;
    const unreadFeedbacks = feedbacks.filter(f => !f.isRead).length;

    if (!isLoggedIn) {
        return (
            <LoginScreen 
                employees={employees} 
                ceoPasswordHash={ceoPassword} 
                employeePasswords={employeePasswords}
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

                    {/* New: Employee Manager Button */}
                    <button
                        onClick={() => setIsEmployeeManagerOpen(true)}
                        className="p-2 text-white hover:bg-[#ffffff20] rounded-full transition-colors mr-1"
                        title="夥伴資料管理"
                    >
                        <Users size={20} />
                    </button>

                    {/* Feedback Button */}
                    <button
                        onClick={() => setIsFeedbackModalOpen(true)}
                        className="relative p-2 text-white hover:bg-[#ffffff20] rounded-full transition-colors mr-1"
                        title="夥伴留言"
                    >
                        <MessageSquareQuote size={20} />
                        {unreadFeedbacks > 0 && (
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-[#064e3b]"></span>
                        )}
                    </button>

                    {/* Stats Button */}
                    <button
                        onClick={() => setIsStatsOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-[#0284c7] text-white rounded-md text-sm font-medium hover:bg-[#0369a1] transition-colors shadow-sm mr-2"
                        title="查看工時統計"
                    >
                        <Calculator size={16} />
                        <span className="hidden lg:inline">工時統計</span>
                    </button>

                    {/* Notification Bell */}
                    <div className="relative mr-2" ref={notificationRef}>
                        <button 
                            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                            className="relative p-2 text-white hover:bg-[#ffffff20] rounded-full transition-colors"
                        >
                            <Bell size={20} />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-[#064e3b]"></span>
                            )}
                        </button>

                        {/* Notification Dropdown */}
                        {isNotificationOpen && (
                            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50">
                                    <h4 className="font-bold text-gray-700 text-sm">通知中心 ({unreadNotifications})</h4>
                                    <div className="flex gap-2">
                                        {notifications.length > 0 && (
                                            <button 
                                                onClick={handleClearNotifications} 
                                                className="text-gray-400 hover:text-red-500 p-1"
                                                title="清空所有"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                        {unreadNotifications > 0 && (
                                            <button 
                                                onClick={handleMarkAllRead} 
                                                className="text-xs text-[#064e3b] hover:underline flex items-center gap-1"
                                            >
                                                <Check size={12} /> 全部已讀
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="py-8 text-center text-gray-400 text-sm">
                                            <Bell size={24} className="mx-auto mb-2 opacity-30" />
                                            目前沒有新通知
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100">
                                            {notifications.map(notif => (
                                                <div 
                                                    key={notif.id} 
                                                    onClick={() => handleMarkAsRead(notif.id)}
                                                    className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className={`text-sm font-bold ${!notif.isRead ? 'text-[#064e3b]' : 'text-gray-600'}`}>
                                                            {notif.title}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                                            {format(notif.timestamp, 'MM/dd HH:mm')}
                                                        </span>
                                                    </div>
                                                    <p className={`text-xs ${!notif.isRead ? 'text-gray-800 font-medium' : 'text-gray-500'} break-words`}>
                                                        {notif.message}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

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
                        employees={employees} // Pass state
                        onAddShift={handleAddShift}
                        onEditShift={handleEditShift}
                    />

                    <div className="mt-8 bg-white p-6 rounded-xl border border-[#e7e5e4] shadow-sm">
                        <h3 className="text-lg font-bold text-[#44403c] mb-4 flex items-center gap-2">
                            <Users size={20} className="text-[#d97706]" /> 營地夥伴概況
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {employees.map(emp => {
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
                        employees={employees} // Pass state
                        existingShift={editingShift}
                        taskCategories={taskCategories}
                        onUpdateTaskCategories={handleUpdateTaskCategories}
                        shifts={shifts}
                        readOnly={isModalReadOnly}
                        currentEmployeeId={currentEmployeeId}
                    />

                    <StatsModal
                        isOpen={isStatsOpen}
                        onClose={() => setIsStatsOpen(false)}
                        currentDate={currentDate}
                        shifts={shifts}
                        employees={employees} // Pass state
                    />

                    <FeedbackModal 
                        isOpen={isFeedbackModalOpen}
                        onClose={() => setIsFeedbackModalOpen(false)}
                        feedbacks={feedbacks}
                        employees={employees} // Pass state
                        onMarkAsRead={handleFeedbackMarkAsRead}
                        onDeleteFeedback={handleDeleteFeedback}
                        onDeleteAllRead={handleDeleteAllReadFeedbacks}
                        onUpdateFeedback={handleUpdateFeedback}
                    />

                    <EmployeeManagerModal
                        isOpen={isEmployeeManagerOpen}
                        onClose={() => setIsEmployeeManagerOpen(false)}
                        employees={employees}
                        onUpdateEmployees={handleUpdateEmployees}
                    />
                </>
            ) : (
                currentEmployee && (
                    <>
                    <EmployeePortal
                        employee={currentEmployee}
                        shifts={shifts}
                        onToggleTask={handleToggleTask}
                        onLogout={handleLogout}
                        onChangePassword={handleEmployeeChangePassword}
                        onSendFeedback={handleSendFeedback}
                        onViewShift={handleViewShift}
                        allEmployees={employees} // Pass all employees to resolve names
                    />
                    <ShiftModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onSave={() => {}} 
                        onDelete={() => {}} 
                        initialDate={modalDate}
                        employees={employees} // Pass state
                        existingShift={editingShift}
                        taskCategories={taskCategories}
                        onUpdateTaskCategories={() => {}} 
                        shifts={shifts}
                        readOnly={true}
                        currentEmployeeId={currentEmployeeId}
                    />
                    </>
                )
            )}
        </Layout>
    );
};

export default App;