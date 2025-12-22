import React from 'react';
import { format, startOfWeek, addDays, isSameDay, isBefore } from 'date-fns';
import { Shift, Employee } from '../types';
import { Plus, User, Clock, Tent, CheckCircle2, CircleDashed, ListTodo, Users } from 'lucide-react';

interface CalendarViewProps {
    currentDate: Date;
    shifts: Shift[];
    employees: Employee[];
    onAddShift: (date: string) => void;
    onEditShift: (shift: Shift) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
    currentDate, 
    shifts, 
    employees, 
    onAddShift, 
    onEditShift 
}) => {
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

    const getShiftsForDay = (date: Date) => {
        return shifts.filter(s => isSameDay(new Date(s.date), date));
    };

    const getEmployeeName = (id: string) => {
        return employees.find(e => e.id === id)?.name || '未知';
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-[#e7e5e4] overflow-hidden">
            {/* Header Row */}
            <div className="grid grid-cols-7 border-b border-[#e7e5e4] bg-[#fafaf9]">
                {weekDays.map((day, i) => {
                    const isToday = isSameDay(day, new Date());
                    const dailyShifts = getShiftsForDay(day);
                    const staffCount = new Set(dailyShifts.map(s => s.employeeId)).size;

                    return (
                        <div key={i} className={`p-4 text-center border-r border-[#e7e5e4] last:border-r-0 ${isToday ? 'bg-[#ecfdf5]' : ''}`}>
                            <div className="text-xs font-bold text-[#78716c] uppercase tracking-wider mb-1">
                                {dayNames[i]}
                            </div>
                            <div className={`text-lg font-bold ${isToday ? 'text-[#059669]' : 'text-[#44403c]'}`}>
                                {format(day, 'd')}
                            </div>
                            {staffCount > 0 && (
                                <div className="mt-2 flex justify-center">
                                    <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-600 text-[10px] px-2 py-0.5 rounded-full font-bold" title="今日值班人數">
                                        <Users size={10} /> {staffCount}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Grid Body */}
            <div className="grid grid-cols-7 h-[600px] overflow-y-auto bg-[#fffbeb] bg-opacity-30">
                {weekDays.map((day, i) => {
                    const dayShifts = getShiftsForDay(day);
                    const formattedDate = format(day, 'yyyy-MM-dd');
                    const isPast = isBefore(day, new Date(new Date().setHours(0,0,0,0)));

                    return (
                        <div 
                            key={i} 
                            className={`border-r border-[#e7e5e4] last:border-r-0 p-2 min-h-[150px] relative group hover:bg-[#fafaf9] transition-colors ${isPast ? 'bg-[#f5f5f4]/50' : ''}`}
                        >
                            <div className={`space-y-2 ${isPast ? 'opacity-60 grayscale-[30%]' : ''}`}>
                                {dayShifts.map(shift => {
                                    const completedTasks = shift.tasks.filter(t => t.isCompleted).length;
                                    const totalTasks = shift.tasks.length;
                                    const isAllDone = totalTasks > 0 && completedTasks === totalTasks;
                                    const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

                                    return (
                                        <div
                                            key={shift.id}
                                            onClick={() => onEditShift(shift)}
                                            className={`p-2.5 rounded-lg border text-xs cursor-pointer hover:shadow-md transition-all ${shift.color} relative overflow-hidden group/card`}
                                        >
                                            {/* Status Indicator Strip */}
                                            {isAllDone && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}
                                            
                                            <div className="font-bold truncate flex items-center gap-1.5 text-sm pl-1.5 text-[#44403c]">
                                               <User size={12} className="opacity-60" /> 
                                               {getEmployeeName(shift.employeeId)}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1 opacity-70 pl-1.5 text-[#57534e]">
                                                <Clock size={12} />
                                                {shift.startTime} - {shift.endTime}
                                            </div>
                                            <div className="mt-1 font-medium text-[#44403c] truncate flex items-center gap-1.5 pl-1.5">
                                                <Tent size={12} className="text-[#d97706]" />
                                                {shift.role}
                                            </div>
                                            
                                            {totalTasks > 0 && (
                                                <div className="mt-2.5 pl-1.5 pr-0.5">
                                                    <div className="flex justify-between items-end mb-1">
                                                        <span className={`text-[10px] flex items-center gap-1 ${isAllDone ? 'text-emerald-700 font-bold' : 'text-[#78716c]'}`}>
                                                            {isAllDone ? <CheckCircle2 size={10} /> : <ListTodo size={10} />}
                                                            {completedTasks}/{totalTasks}
                                                        </span>
                                                        <span className="text-[10px] font-bold opacity-60">{progressPercentage}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden border border-black/5">
                                                        <div 
                                                            className={`h-full rounded-full transition-all duration-500 ease-out ${isAllDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                                            style={{ width: `${progressPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            
                            {/* Add Button (Visible on Hover) */}
                            <button
                                onClick={() => onAddShift(formattedDate)}
                                className="absolute bottom-2 right-2 p-2 bg-[#d97706] text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[#b45309] hover:scale-110 z-10"
                                title="新增排班"
                            >
                                <Plus size={18} />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};