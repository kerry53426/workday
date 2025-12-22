import React from 'react';
import { Shift, Employee, Task } from '../types';
import { format, isSameDay, parseISO } from 'date-fns';
import { CheckCircle2, Circle, Clock, Tent, ListTodo, LogOut, StickyNote } from 'lucide-react';

interface EmployeePortalProps {
    employee: Employee;
    shifts: Shift[];
    onToggleTask: (shiftId: string, taskId: string) => void;
    onLogout: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ employee, shifts, onToggleTask, onLogout }) => {
    // Sort shifts by date, nearest first
    const sortedShifts = [...shifts]
        .filter(s => s.employeeId === employee.id)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const upcomingShifts = sortedShifts.filter(s => new Date(s.date) >= new Date(new Date().setHours(0,0,0,0)));

    const handleTaskClick = (shiftId: string, task: Task) => {
        // DIRECT TOGGLE: Removed window.confirm to improve responsiveness on mobile.
        // Users can simply tap again to undo if they made a mistake.
        onToggleTask(shiftId, task.id);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 shadow-md border-l-8 border-[#d97706] flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <img 
                        src={employee.avatar} 
                        alt={employee.name} 
                        className="w-20 h-20 rounded-full object-cover border-4 border-[#fffbeb] shadow-lg"
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-[#44403c]">早安，{employee.name}！</h2>
                        <p className="text-[#78716c] mt-1">準備好迎接美好的一天了嗎？這是您的營地任務。</p>
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="flex flex-col items-center gap-1 text-[#a8a29e] hover:text-[#d97706] transition-colors p-2"
                    title="登出"
                >
                    <LogOut size={20} />
                    <span className="text-xs">登出</span>
                </button>
            </div>

            {upcomingShifts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-[#e7e5e4]">
                    <div className="bg-[#f5f5f4] w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Tent size={40} className="text-[#a8a29e]" />
                    </div>
                    <h3 className="text-lg font-bold text-[#44403c]">目前沒有排班</h3>
                    <p className="text-[#78716c]">享受山林間的寧靜時光吧！</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {upcomingShifts.map((shift) => {
                        const shiftDate = parseISO(shift.date);
                        const isToday = isSameDay(shiftDate, new Date());

                        return (
                            <div key={shift.id} className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${isToday ? 'border-[#064e3b] ring-4 ring-[#ecfdf5]' : 'border-[#e7e5e4]'}`}>
                                {/* Shift Header */}
                                <div className={`px-6 py-4 flex flex-wrap justify-between items-center gap-4 ${shift.color.split(' ')[0]}`}>
                                    <div className="flex items-center gap-4">
                                        <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl p-2.5 min-w-[70px] shadow-sm">
                                            <div className="text-xs font-bold uppercase opacity-60 text-[#44403c]">{format(shiftDate, 'M')}月</div>
                                            <div className="text-2xl font-bold text-[#064e3b]">{format(shiftDate, 'dd')}</div>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 font-bold text-lg text-[#44403c]">
                                                <Tent size={18} className="text-[#d97706]" />
                                                {shift.role}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-[#57534e] mt-1">
                                                <Clock size={16} />
                                                {shift.startTime} - {shift.endTime}
                                                {isToday && <span className="bg-[#064e3b] text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2">今日值班</span>}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Task List */}
                                <div className="p-6">
                                    <h4 className="flex items-center gap-2 text-sm font-bold text-[#78716c] uppercase tracking-wide mb-4">
                                        <ListTodo size={16} />
                                        任務清單 ({shift.tasks.filter(t => t.isCompleted).length}/{shift.tasks.length})
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        {shift.tasks.length === 0 && <p className="text-[#a8a29e] italic text-sm text-center py-2">沒有指定特定任務。</p>}
                                        {shift.tasks.map(task => (
                                            <div 
                                                key={task.id} 
                                                onClick={() => handleTaskClick(shift.id, task)}
                                                className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                                                    task.isCompleted 
                                                        ? 'bg-[#f5f5f4] border-[#e7e5e4]' 
                                                        : 'bg-white border-[#d6d3d1] hover:border-[#064e3b] hover:shadow-sm'
                                                }`}
                                            >
                                                <div className={`mt-0.5 transition-colors ${task.isCompleted ? 'text-emerald-600' : 'text-[#d6d3d1]'}`}>
                                                    {task.isCompleted ? <CheckCircle2 size={22} className="fill-emerald-50" /> : <Circle size={22} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className={`text-base block break-words ${task.isCompleted ? 'text-[#a8a29e] line-through' : 'text-[#44403c]'}`}>
                                                        {task.description}
                                                    </span>
                                                    {task.tags && task.tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {task.tags.map(tag => (
                                                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded border bg-stone-100 text-stone-600 border-stone-200">
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Shift Log Display */}
                                    {shift.shiftLog && (
                                        <div className="mt-6 pt-4 border-t border-[#e7e5e4]">
                                            <h4 className="flex items-center gap-2 text-sm font-bold text-[#78716c] uppercase tracking-wide mb-3">
                                                <StickyNote size={16} />
                                                班次日誌 / 備註
                                            </h4>
                                            <div className="bg-[#fffbeb] border border-[#fcd34d] p-4 rounded-lg text-sm text-[#78350f] whitespace-pre-wrap leading-relaxed shadow-sm">
                                                {shift.shiftLog}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};