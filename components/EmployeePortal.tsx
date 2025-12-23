import React, { useState, useRef } from 'react';
import { Shift, Employee, Task } from '../types';
import { format, isSameDay, parseISO, addDays, startOfToday } from 'date-fns';
import { CheckCircle2, Circle, Clock, Tent, ListTodo, LogOut, StickyNote, Calendar as CalendarIcon, KeyRound, MessageSquarePlus, Send, Settings, X, ChevronRight, Coffee, Users, HelpingHand } from 'lucide-react';

interface EmployeePortalProps {
    employee: Employee;
    shifts: Shift[];
    onToggleTask: (shiftId: string, taskId: string, completerId?: string) => void;
    onLogout: () => void;
    onChangePassword: (newPassword: string) => void;
    onSendFeedback: (content: string) => void;
    onViewShift: (shift: Shift) => void; 
    allEmployees?: Employee[]; // New prop to resolve names
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ 
    employee, 
    shifts, 
    onToggleTask, 
    onLogout,
    onChangePassword,
    onSendFeedback,
    onViewShift,
    allEmployees = []
}) => {
    const today = startOfToday();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [feedbackContent, setFeedbackContent] = useState('');
    const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);
    
    // Refs for scrolling to specific dates
    const shiftRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    
    // 1. Prepare My Shifts
    const myShifts = [...shifts]
        .filter(s => s.employeeId === employee.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const myUpcomingShifts = myShifts.filter(s => new Date(s.date) >= new Date(today.setHours(0,0,0,0)));

    // 2. Prepare Team Shifts (Others working TODAY)
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const teamShiftsToday = shifts.filter(s => 
        s.date === todayStr && 
        s.employeeId !== employee.id
    );

    // Group shifts by Month for cleaner list view
    const groupedShifts: { [key: string]: Shift[] } = {};
    myUpcomingShifts.forEach(shift => {
        const monthKey = format(parseISO(shift.date), 'yyyy年 M月');
        if (!groupedShifts[monthKey]) groupedShifts[monthKey] = [];
        groupedShifts[monthKey].push(shift);
    });

    // Generate next 14 days for the "Mini Calendar Strip"
    const next14Days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

    const handleTaskClick = (e: React.MouseEvent, shiftId: string, task: Task) => {
        e.stopPropagation(); 
        // Pass current employee ID as the completer
        onToggleTask(shiftId, task.id, employee.id);
    };

    const handleSubmitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.trim().length < 4) {
            alert("密碼長度至少需 4 碼");
            return;
        }
        onChangePassword(newPassword);
        setIsPasswordModalOpen(false);
        setNewPassword('');
        alert("密碼修改成功！下次請使用新密碼登入。");
    };

    const handleSubmitFeedback = () => {
        if (!feedbackContent.trim()) return;
        setIsFeedbackSubmitting(true);
        // Simulate network delay for better feel
        setTimeout(() => {
            onSendFeedback(feedbackContent);
            setFeedbackContent('');
            setIsFeedbackSubmitting(false);
            alert("訊息已傳送給執行長，謝謝您的回饋！");
        }, 500);
    };

    const scrollToDate = (dateStr: string) => {
        const element = shiftRefs.current[dateStr];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-[#d97706]/30');
            setTimeout(() => {
                element.classList.remove('ring-4', 'ring-[#d97706]/30');
            }, 1500);
        }
    };

    const getEmployeeName = (id: string) => allEmployees.find(e => e.id === id)?.name || '未知夥伴';
    const getEmployeeAvatar = (id: string) => allEmployees.find(e => e.id === id)?.avatar;

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 safe-area-bottom">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-md border-l-8 border-[#d97706] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                    <img 
                        src={employee.avatar} 
                        alt={employee.name} 
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-[#fffbeb] shadow-lg"
                    />
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-[#44403c]">早安，{employee.name}</h2>
                        <p className="text-xs text-[#78716c] mt-0.5">準備好迎接美好的一天了嗎？</p>
                    </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                    <button 
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs text-[#57534e] hover:text-[#d97706] transition-colors bg-gray-50 px-3 py-2 rounded-full border border-gray-200"
                    >
                        <KeyRound size={14} /> <span className="hidden sm:inline">修改密碼</span>
                    </button>
                    <button 
                        onClick={onLogout}
                        className="flex items-center justify-center gap-1 text-[#a8a29e] hover:text-red-500 transition-colors p-2 sm:p-1"
                        title="登出"
                    >
                        <LogOut size={18} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">登出</span>
                    </button>
                </div>
            </div>

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-[#44403c]">修改登入密碼</h3>
                            <button onClick={() => setIsPasswordModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmitPassword}>
                            <input
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="請輸入新密碼 (至少4碼)"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-[#064e3b] focus:border-transparent text-base"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-3 sm:py-2 text-gray-600 bg-gray-100 rounded-lg">取消</button>
                                <button type="submit" className="flex-1 py-3 sm:py-2 text-white bg-[#064e3b] rounded-lg hover:bg-[#065f46]">確認修改</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Quick View: Next 14 Days Strip */}
            <div className="bg-white rounded-xl shadow-sm border border-[#e7e5e4] p-3 sm:p-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-3 text-[#57534e] font-bold text-sm">
                    <CalendarIcon size={16} className="text-[#d97706]" />
                    未來兩週速覽
                </div>
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x touch-pan-x">
                    {next14Days.map((day, i) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const hasShift = myUpcomingShifts.find(s => s.date === dateStr);
                        const isToday = isSameDay(day, today);
                        const weekDayMap = ['日', '一', '二', '三', '四', '五', '六'];
                        const zhDay = weekDayMap[day.getDay()];

                        return (
                            <button
                                key={i} 
                                onClick={() => hasShift && scrollToDate(dateStr)}
                                disabled={!hasShift}
                                className={`snap-start flex-shrink-0 w-14 h-20 sm:w-14 sm:h-20 rounded-xl flex flex-col items-center justify-center border transition-all ${
                                    hasShift 
                                    ? 'bg-[#ecfdf5] border-[#064e3b] shadow-sm cursor-pointer hover:bg-[#d1fae5] active:scale-95' 
                                    : isToday 
                                        ? 'bg-[#fffbeb] border-[#fcd34d] cursor-default' 
                                        : 'bg-white border-[#e7e5e4] opacity-50 cursor-default'
                                }`}
                            >
                                <span className={`text-[10px] font-medium mb-1 ${hasShift ? 'text-[#064e3b]' : 'text-gray-400'}`}>
                                    {isToday ? '今日' : `週${zhDay}`}
                                </span>
                                <span className={`text-lg font-bold leading-none ${hasShift ? 'text-[#064e3b]' : 'text-gray-600'}`}>
                                    {format(day, 'd')}
                                </span>
                                <div className="mt-2 h-1.5 w-1.5 rounded-full">
                                    {hasShift && <div className="w-1.5 h-1.5 rounded-full bg-[#d97706]"></div>}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* TEAM TASKS SECTION (New) */}
            {teamShiftsToday.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 sm:p-5 border border-blue-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-[#1e3a8a] font-bold">
                        <Users size={20} />
                        <h3>今日夥伴動態 (互相支援)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {teamShiftsToday.map(shift => {
                            const partner = allEmployees.find(e => e.id === shift.employeeId);
                            const completedCount = shift.tasks.filter(t => t.isCompleted).length;
                            
                            return (
                                <div key={shift.id} className="bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                        <img src={partner?.avatar} alt={partner?.name} className="w-10 h-10 rounded-full bg-gray-200" />
                                        <div className="flex-1">
                                            <div className="font-bold text-gray-800">{partner?.name || '未知夥伴'}</div>
                                            <div className="text-xs text-blue-600 bg-blue-50 inline-block px-1.5 rounded mt-0.5">{shift.role}</div>
                                        </div>
                                        <div className="text-xs font-bold text-gray-400">
                                            {completedCount}/{shift.tasks.length}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                                        {shift.tasks.length === 0 && <p className="text-xs text-gray-400 italic">無任務</p>}
                                        {shift.tasks.map(task => (
                                            <div 
                                                key={task.id} 
                                                onClick={(e) => handleTaskClick(e, shift.id, task)}
                                                className={`flex items-start gap-3 p-2 rounded cursor-pointer transition-colors border ${
                                                    task.isCompleted 
                                                    ? 'bg-gray-50 border-transparent' 
                                                    : 'bg-white border-gray-200 hover:border-blue-300 active:bg-blue-50'
                                                }`}
                                            >
                                                <div className={`mt-0.5 ${task.isCompleted ? 'text-emerald-500' : 'text-gray-300'}`}>
                                                    {task.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                        {task.description}
                                                    </p>
                                                    {task.isCompleted && task.completedBy && task.completedBy !== shift.employeeId && (
                                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded w-fit">
                                                            <HelpingHand size={10} />
                                                            由 {getEmployeeName(task.completedBy)} 協助完成
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* My Shifts Section */}
            {Object.keys(groupedShifts).length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#e7e5e4]">
                    <div className="bg-[#f5f5f4] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tent size={40} className="text-[#a8a29e]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#44403c]">目前沒有排班</h3>
                    <p className="text-[#78716c]">享受山林間的寧靜時光吧！</p>
                </div>
            ) : (
                Object.entries(groupedShifts).map(([month, monthShifts]) => (
                    <div key={month} className="space-y-4">
                        <div className="sticky top-0 bg-[#f5f5f4]/95 backdrop-blur-sm z-10 py-2 px-1 flex items-center gap-2 text-[#57534e] font-bold">
                            <span className="w-2 h-2 rounded-full bg-[#57534e]"></span>
                            {month}
                        </div>
                        
                        {monthShifts.map((shift) => {
                            const shiftDate = parseISO(shift.date);
                            const isToday = isSameDay(shiftDate, today);

                            return (
                                <div 
                                    key={shift.id} 
                                    ref={(el) => { shiftRefs.current[shift.date] = el; }}
                                    onClick={() => onViewShift(shift)}
                                    className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all cursor-pointer hover:shadow-md active:scale-[0.99] ${isToday ? 'border-[#064e3b] ring-2 ring-[#064e3b]/20 shadow-md transform scale-[1.01]' : 'border-[#e7e5e4]'}`}
                                >
                                    {/* Compact Shift Header */}
                                    <div className="flex flex-col sm:flex-row border-b border-[#f5f5f4]">
                                        {/* Date Box */}
                                        <div className={`p-4 flex sm:flex-col items-center justify-between sm:justify-center gap-3 sm:w-28 ${isToday ? 'bg-[#064e3b] text-white' : 'bg-[#fafaf9] text-[#44403c]'}`}>
                                            <div className="flex flex-row sm:flex-col items-baseline sm:items-center gap-1 sm:gap-0">
                                                <span className={`text-2xl font-bold ${isToday ? 'text-white' : 'text-[#064e3b]'}`}>{format(shiftDate, 'dd')}</span>
                                                <span className={`text-xs font-medium uppercase ${isToday ? 'text-emerald-100' : 'text-[#a8a29e]'}`}>
                                                    週{['日', '一', '二', '三', '四', '五', '六'][shiftDate.getDay()]}
                                                </span>
                                            </div>
                                            {isToday && <span className="bg-[#fbbf24] text-[#78350f] text-[10px] font-bold px-2 py-0.5 rounded-full">TODAY</span>}
                                        </div>

                                        {/* Info Box */}
                                        <div className="flex-1 p-4 flex flex-col justify-center">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs px-2 py-0.5 rounded border font-medium ${shift.color}`}>
                                                            {shift.role}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[#57534e] font-bold text-lg">
                                                        <Clock size={18} className="text-[#d97706]" />
                                                        {shift.startTime} - {shift.endTime}
                                                    </div>
                                                    {((shift.breakStartTime && shift.breakEndTime) || (shift.breakDuration && shift.breakDuration > 0)) && (
                                                        <div className="flex items-center gap-1.5 text-xs text-[#78716c] mt-1.5 ml-0.5">
                                                            <Coffee size={14} className="text-[#a8a29e]" />
                                                            <span className="font-medium">
                                                                {(shift.breakStartTime && shift.breakEndTime) 
                                                                    ? `休息 ${shift.breakStartTime}-${shift.breakEndTime}`
                                                                    : `休息 ${shift.breakDuration} 分鐘`
                                                                }
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-gray-300">
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task Progress & List (Preview) */}
                                    <div className="p-4 bg-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="flex items-center gap-2 text-sm font-bold text-[#78716c]">
                                                <ListTodo size={16} />
                                                任務 ({shift.tasks.filter(t => t.isCompleted).length}/{shift.tasks.length})
                                            </h4>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {shift.tasks.length === 0 && <p className="text-[#a8a29e] italic text-xs py-1">無指定任務</p>}
                                            {shift.tasks.map(task => (
                                                <div 
                                                    key={task.id} 
                                                    onClick={(e) => handleTaskClick(e, shift.id, task)}
                                                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                                        task.isCompleted 
                                                            ? 'bg-[#f5f5f4] border-transparent opacity-70' 
                                                            : 'bg-white border-[#e7e5e4] hover:border-[#d97706] hover:shadow-sm active:bg-amber-50'
                                                    }`}
                                                >
                                                    <div className={`mt-0.5 transition-colors ${task.isCompleted ? 'text-emerald-600' : 'text-[#d6d3d1]'}`}>
                                                        {task.isCompleted ? <CheckCircle2 size={20} className="fill-emerald-50" /> : <Circle size={20} />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <span className={`text-sm block leading-snug ${task.isCompleted ? 'text-[#a8a29e] line-through' : 'text-[#44403c]'}`}>
                                                            {task.description}
                                                        </span>
                                                        {task.completedBy && task.completedBy !== shift.employeeId && task.isCompleted && (
                                                             <div className="flex items-center gap-1 mt-1 text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded w-fit">
                                                                <HelpingHand size={10} />
                                                                由 {getEmployeeName(task.completedBy)} 協助
                                                            </div>
                                                        )}
                                                        {task.tags && task.tags.length > 0 && !task.isCompleted && (
                                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                                {task.tags.map(tag => (
                                                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
                                                                        {tag}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Log Preview */}
                                        {shift.shiftLog && (
                                            <div className="mt-4 pt-3 border-t border-[#f5f5f4]">
                                                <div className="flex gap-2">
                                                    <StickyNote size={14} className="text-[#d97706] mt-0.5 flex-shrink-0" />
                                                    <p className="text-xs text-[#78350f] bg-[#fffbeb] p-2 rounded w-full line-clamp-2">
                                                        {shift.shiftLog}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))
            )}
             {/* Feedback Box */}
             <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-100 p-4">
                <div className="flex items-center gap-2 mb-3 text-amber-800 font-bold text-sm">
                    <MessageSquarePlus size={16} />
                    夥伴心聲 / 建議
                </div>
                <div className="relative">
                    <textarea 
                        value={feedbackContent}
                        onChange={(e) => setFeedbackContent(e.target.value)}
                        placeholder="有什麼想跟執行長說的嗎？..."
                        className="w-full p-3 pr-12 rounded-lg border border-amber-200 bg-white/80 focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base sm:text-sm min-h-[80px] resize-none"
                    />
                    <button 
                        onClick={handleSubmitFeedback}
                        disabled={!feedbackContent.trim() || isFeedbackSubmitting}
                        className="absolute bottom-3 right-3 p-1.5 bg-[#d97706] text-white rounded-full shadow-md hover:bg-[#b45309] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        <Send size={16} />
                    </button>
                </div>
                <p className="text-[10px] text-amber-600/60 mt-2 text-right">
                    * 您的留言將直接傳送給執行長
                </p>
            </div>
        </div>
    );
};