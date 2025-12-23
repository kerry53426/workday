
import React, { useState, useEffect, useMemo } from 'react';
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
import { ChevronLeft, ChevronRight, Calculator, MessageSquareQuote, LogOut, Tent, Sparkles, Users, CloudCheck, CloudOff, RefreshCw, Bell, X, Key } from 'lucide-react';
import { loadFromPantry, saveToPantry } from './services/pantryService';

const APP_PANTRY_ID = "085e1276-c22a-4c58-9a2b-3b40d8fce6d9"; 

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<'manager' | 'employee' | null>(null);
    const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
    
    const [employees, setEmployees] = useState<Employee[]>(() => {
        const saved = localStorage.getItem('sm_employees');
        return saved ? JSON.parse(saved) : INITIAL_EMPLOYEES;
    });
    
    const [shifts, setShifts] = useState<Shift[]>(() => {
        const saved = localStorage.getItem('sm_shifts');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [feedbacks, setFeedbacks] = useState<Feedback[]>(() => {
        const saved = localStorage.getItem('sm_feedbacks');
        return saved ? JSON.parse(saved) : [];
    });

    const [notifications, setNotifications] = useState<Notification[]>(() => {
        const saved = localStorage.getItem('sm_notifications');
        return saved ? JSON.parse(saved) : [];
    });

    const [taskCategories, setTaskCategories] = useState<TaskCategory[]>(() => {
        const saved = localStorage.getItem('sm_categories');
        return saved ? JSON.parse(saved) : DEFAULT_TASK_CATEGORIES;
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [isEmployeeManagerOpen, setIsEmployeeManagerOpen] = useState(false);
    const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
    const [isCeoChangePwdOpen, setIsCeoChangePwdOpen] = useState(false);
    const [newCeoPwd, setNewCeoPwd] = useState('');
    const [modalDate, setModalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [editingShift, setEditingShift] = useState<Shift | undefined>(undefined);

    useEffect(() => {
        handleManualSync();
    }, []);

    // 震動邏輯：當有新通知且目標是目前使用者時
    useEffect(() => {
        const lastNotif = notifications[0];
        if (lastNotif && !lastNotif.isRead) {
            const isForMe = (userRole === 'manager' && lastNotif.targetEmployeeId === 'manager') || 
                           (userRole === 'employee' && lastNotif.targetEmployeeId === currentEmployeeId);
            if (isForMe && 'vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    }, [notifications.length]);

    const handleManualSync = async () => {
        setSyncStatus('syncing');
        try {
            const data = await loadFromPantry(APP_PANTRY_ID);
            if (data) {
                if (data.shifts) setShifts(data.shifts);
                if (data.employees) setEmployees(data.employees);
                if (data.feedbacks) setFeedbacks(data.feedbacks);
                if (data.notifications) setNotifications(data.notifications);
                if (data.categories) setTaskCategories(data.categories);
                setSyncStatus('synced');
            }
        } catch (e) {
            setSyncStatus('error');
        }
    };

    const persistData = async (updated: { shifts?: Shift[], employees?: Employee[], feedbacks?: Feedback[], notifications?: Notification[], categories?: TaskCategory[] }) => {
        setSyncStatus('syncing');
        const nextShifts = updated.shifts || shifts;
        const nextEmployees = updated.employees || employees;
        const nextFeedbacks = updated.feedbacks || feedbacks;
        const nextNotifications = updated.notifications || notifications;
        const nextCategories = updated.categories || taskCategories;

        const fullPayload = {
            shifts: nextShifts,
            employees: nextEmployees,
            feedbacks: nextFeedbacks,
            notifications: nextNotifications,
            categories: nextCategories,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('sm_shifts', JSON.stringify(nextShifts));
        localStorage.setItem('sm_employees', JSON.stringify(nextEmployees));
        localStorage.setItem('sm_feedbacks', JSON.stringify(nextFeedbacks));
        localStorage.setItem('sm_notifications', JSON.stringify(nextNotifications));
        localStorage.setItem('sm_categories', JSON.stringify(nextCategories));
        
        try {
            await saveToPantry(APP_PANTRY_ID, fullPayload);
            setSyncStatus('synced');
        } catch (e) {
            setSyncStatus('error');
        }
    };

    const handleSaveShift = (newShiftData: Shift | Shift[]) => {
        const updatedShiftsArray = Array.isArray(newShiftData) ? newShiftData : [newShiftData];
        let nextShifts = [...shifts];
        const newNotifs: Notification[] = [...notifications];

        updatedShiftsArray.forEach(newShift => {
            const idx = nextShifts.findIndex(s => s.id === newShift.id);
            if (idx >= 0) {
                newShift.tasks.forEach(task => {
                    const oldTask = nextShifts[idx].tasks.find(t => t.id === task.id);
                    if (task.isCompleted && !oldTask?.isCompleted && task.completedBy) {
                        const completer = employees.find(e => e.id === task.completedBy);
                        // 1. 通知夥伴本人 (如果有人幫忙)
                        if (newShift.employeeId !== task.completedBy) {
                            newNotifs.unshift({
                                id: generateUUID(), type: 'help_received', title: '夥伴支援',
                                message: `${completer?.name} 幫你完成了: ${task.description}`,
                                timestamp: Date.now(), isRead: false, targetEmployeeId: newShift.employeeId, senderId: task.completedBy
                            });
                        }
                        // 2. 通知執行長
                        newNotifs.unshift({
                            id: generateUUID(), type: 'task_completion', title: '任務完成回報',
                            message: `${completer?.name} 已完成「${newShift.role}」班次的任務：${task.description}`,
                            timestamp: Date.now(), isRead: false, targetEmployeeId: 'manager', senderId: task.completedBy
                        });
                    }
                });
                nextShifts[idx] = newShift;
            } else {
                nextShifts.push(newShift);
            }
        });

        setShifts(nextShifts);
        setNotifications(newNotifs);
        persistData({ shifts: nextShifts, notifications: newNotifs });
    };

    const handleLogin = (role: 'manager' | 'employee', employeeId?: string) => {
        setIsLoggedIn(true);
        setUserRole(role);
        setCurrentEmployeeId(employeeId || null);
    };

    const handleLogout = () => { setIsLoggedIn(false); setUserRole(null); setCurrentEmployeeId(null); };

    const currentEmployee = useMemo(() => {
        return employees.find(e => e.id === currentEmployeeId) || null;
    }, [employees, currentEmployeeId]);

    const myNotifications = useMemo(() => {
        if (userRole === 'manager') return notifications.filter(n => n.targetEmployeeId === 'manager');
        return notifications.filter(n => n.targetEmployeeId === currentEmployeeId);
    }, [notifications, userRole, currentEmployeeId]);

    if (!isLoggedIn) {
        return <LoginScreen employees={employees} ceoPasswordHash={localStorage.getItem('sm_ceo_pwd') || '1234'} employeePasswords={employees.reduce((acc, curr) => ({...acc, [curr.id]: curr.password || '1234'}), {})} onLogin={handleLogin} onResetPassword={() => { if (window.confirm("重置管理密碼為 1234？")) { localStorage.setItem('sm_ceo_pwd', '1234'); window.location.reload(); } }} />;
    }

    return (
        <Layout 
            title={userRole === 'manager' ? "管理後台" : "夥伴專區"} 
            actions={
                <div className="flex items-center gap-1 sm:gap-2">
                    <div className="flex items-center mr-2">
                        {syncStatus === 'syncing' ? <RefreshCw size={14} className="text-white animate-spin opacity-50"/> : syncStatus === 'error' ? <CloudOff size={16} className="text-red-400"/> : <CloudCheck size={16} className="text-emerald-400"/>}
                    </div>
                    <button onClick={() => setIsNotifDrawerOpen(true)} className="relative p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all">
                        <Bell size={18} />
                        {myNotifications.some(n => !n.isRead) && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#064e3b]"></span>}
                    </button>
                    {userRole === 'manager' && (
                        <>
                            <div className="flex items-center bg-white/10 rounded-xl px-1 py-1 border border-white/20">
                                <button onClick={() => setCurrentDate(subWeeks(currentDate, 1))} className="p-1 hover:text-[#fbbf24]"><ChevronLeft size={18} /></button>
                                <span className="px-1 text-[10px] sm:text-sm font-black whitespace-nowrap">{format(currentDate, 'yyyy / M月')}</span>
                                <button onClick={() => setCurrentDate(addWeeks(currentDate, 1))} className="p-1 hover:text-[#fbbf24]"><ChevronRight size={18} /></button>
                            </div>
                            <button onClick={() => setIsFeedbackModalOpen(true)} className="p-2 bg-white/10 hover:bg-[#fbbf24] hover:text-[#78350f] rounded-xl transition-all"><MessageSquareQuote size={18} /></button>
                            <button onClick={() => setIsStatsOpen(true)} className="p-2 bg-white/10 hover:bg-[#fbbf24] hover:text-[#78350f] rounded-xl transition-all"><Calculator size={18} /></button>
                            <button onClick={() => setIsCeoChangePwdOpen(true)} className="p-2 bg-white/10 hover:bg-[#fbbf24] hover:text-[#78350f] rounded-xl transition-all" title="修改管理密碼"><Key size={18} /></button>
                        </>
                    )}
                    <button onClick={handleLogout} className="p-2 bg-white/10 hover:bg-red-500 rounded-xl transition-all"><LogOut size={18} /></button>
                </div>
            }
        >
            {userRole === 'manager' ? (
                <div className="animate-in fade-in duration-500">
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-[#d97706] mb-1"><Sparkles size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Executive Dashboard</span></div>
                            <h2 className="text-2xl sm:text-3xl font-black text-[#44403c]">營地指揮中心</h2>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button onClick={() => setIsEmployeeManagerOpen(true)} className="flex-1 sm:flex-none bg-white border border-[#d6d3d1] text-[#44403c] px-4 py-3 rounded-2xl font-bold hover:bg-gray-50 flex items-center justify-center gap-2"><Users size={18}/> 夥伴管理</button>
                            <button onClick={() => { setModalDate(format(new Date(), 'yyyy-MM-dd')); setEditingShift(undefined); setIsModalOpen(true); }} className="flex-1 sm:flex-none bg-[#064e3b] text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-[#065f46] flex items-center justify-center gap-2"><Tent size={20} /> 快速排班</button>
                        </div>
                    </div>
                    <CalendarView currentDate={currentDate} shifts={shifts} employees={employees} onAddShift={(d) => {setModalDate(d); setEditingShift(undefined); setIsModalOpen(true);}} onEditShift={(s) => {setEditingShift(s); setIsModalOpen(true);}} />
                </div>
            ) : (
                currentEmployee && (
                    <EmployeePortal 
                        employee={currentEmployee} shifts={shifts} 
                        onToggleTask={(sid, tid, cid) => {
                            const shift = shifts.find(s => s.id === sid);
                            if (!shift) return;
                            const updatedTasks = shift.tasks.map(t => t.id === tid ? { ...t, isCompleted: !t.isCompleted, completedBy: cid } : t);
                            handleSaveShift({ ...shift, tasks: updatedTasks });
                        }} 
                        onLogout={handleLogout} 
                        onChangePassword={(newPwd) => {
                            const updated = employees.map(e => e.id === currentEmployeeId ? { ...e, password: newPwd } : e);
                            setEmployees(updated);
                            persistData({ employees: updated });
                            alert("密碼變更成功！下回登入請使用新密碼。");
                        }} 
                        onSendFeedback={(c) => {
                            const nf = { id: generateUUID(), employeeId: currentEmployeeId!, content: c, date: new Date().toISOString(), isRead: false };
                            const nfs = [nf, ...feedbacks];
                            setFeedbacks(nfs);
                            persistData({ feedbacks: nfs });
                        }} 
                        onViewShift={(s) => { setEditingShift(s); setIsModalOpen(true); }}
                        onUpdateAvatar={(newAvatar) => {
                            const updated = employees.map(e => e.id === currentEmployeeId ? { ...e, avatar: newAvatar } : e);
                            setEmployees(updated);
                            persistData({ employees: updated });
                        }}
                        allEmployees={employees}
                        notifications={myNotifications}
                        onMarkNotificationRead={(nid) => {
                            const next = notifications.map(n => n.id === nid ? { ...n, isRead: true } : n);
                            setNotifications(next);
                            persistData({ notifications: next });
                        }}
                    />
                )
            )}

            {/* Notification Drawer */}
            {isNotifDrawerOpen && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNotifDrawerOpen(false)}></div>
                    <div className="relative w-full max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-5 border-b flex justify-between items-center bg-[#f5f5f4]">
                            <h3 className="font-black flex items-center gap-2 text-[#064e3b]"><Bell size={18} /> 通知中心</h3>
                            <button onClick={() => setIsNotifDrawerOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {myNotifications.length === 0 ? <div className="py-20 text-center text-gray-400 italic font-bold">目前無通知</div> : 
                                myNotifications.map(notif => (
                                    <div key={notif.id} className={`p-4 rounded-xl border transition-all ${notif.isRead ? 'bg-gray-50 opacity-60' : 'bg-emerald-50 border-emerald-100 shadow-sm'}`} 
                                        onClick={() => {
                                            const next = notifications.map(n => n.id === notif.id ? { ...n, isRead: true } : n);
                                            setNotifications(next);
                                            persistData({ notifications: next });
                                        }}>
                                        <div className="flex gap-3">
                                            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 h-fit"><Bell size={18} /></div>
                                            <div className="flex-1">
                                                <div className="text-sm font-black text-gray-800">{notif.title}</div>
                                                <p className="text-xs text-gray-600 mt-1 font-bold">{notif.message}</p>
                                                <div className="text-[10px] text-gray-400 mt-2 font-black">{format(notif.timestamp, 'MM/dd HH:mm')}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* CEO Change Password Modal */}
            {isCeoChangePwdOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 border-t-8 border-[#d97706]">
                        <h3 className="font-black text-gray-800 mb-4 text-center">修改執行長密碼</h3>
                        <input type="text" value={newCeoPwd} onChange={e=>setNewCeoPwd(e.target.value)} placeholder="輸入新密碼" className="w-full p-3 border rounded-xl mb-4 font-bold text-center tracking-widest text-lg" />
                        <div className="flex gap-2">
                            <button onClick={() => {setIsCeoChangePwdOpen(false); setNewCeoPwd('');}} className="flex-1 py-2 text-gray-400 font-bold hover:bg-gray-50 rounded-xl">取消</button>
                            <button onClick={() => {
                                if(newCeoPwd.length < 4) return alert('密碼太短了，請至少輸入4位數！');
                                localStorage.setItem('sm_ceo_pwd', newCeoPwd);
                                alert("管理密碼修改成功！");
                                setIsCeoChangePwdOpen(false);
                                setNewCeoPwd('');
                            }} className="flex-1 py-2 bg-[#d97706] text-white rounded-xl font-black shadow-lg hover:bg-[#b45309]">確認修改</button>
                        </div>
                    </div>
                </div>
            )}

            <ShiftModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSaveShift} 
                onDelete={(id) => {const next = shifts.filter(s => s.id !== id); setShifts(next); persistData({shifts: next});}} 
                initialDate={modalDate} 
                employees={employees} 
                existingShift={editingShift} 
                taskCategories={taskCategories} 
                onUpdateTaskCategories={(cats) => {setTaskCategories(cats); persistData({categories: cats});}} 
                shifts={shifts} 
                currentEmployeeId={currentEmployeeId} 
                userRole={userRole}
                onUpdateEmployee={(updatedEmp) => {
                    const nextEmps = employees.map(e => e.id === updatedEmp.id ? updatedEmp : e);
                    setEmployees(nextEmps);
                    persistData({ employees: nextEmps });
                }}
            />
            <StatsModal isOpen={isStatsOpen} onClose={() => setIsStatsOpen(false)} currentDate={currentDate} shifts={shifts} employees={employees} />
            <FeedbackModal isOpen={isFeedbackModalOpen} onClose={() => setIsFeedbackModalOpen(false)} feedbacks={feedbacks} employees={employees} onMarkAsRead={(id) => {const next = feedbacks.map(f => f.id === id ? {...f, isRead: true} : f); setFeedbacks(next); persistData({feedbacks: next});}} onDeleteFeedback={(id) => {const next = feedbacks.filter(f => f.id !== id); setFeedbacks(next); persistData({feedbacks: next});}} onUpdateFeedback={(id, upd) => {const next = feedbacks.map(f => f.id === id ? {...f, ...upd} : f); setFeedbacks(next); persistData({feedbacks: next});}} />
            <EmployeeManagerModal isOpen={isEmployeeManagerOpen} onClose={() => setIsEmployeeManagerOpen(false)} employees={employees} onUpdateEmployees={(e) => {setEmployees(e); persistData({employees: e});}} />
        </Layout>
    );
};

export default App;
