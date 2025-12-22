import React from 'react';
import { format, startOfWeek, addDays, isSameDay, isBefore } from 'date-fns';
import { Shift, Employee } from '../types';
import { Plus, Clock, Users, Coffee } from 'lucide-react';

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
            {/* Scroll Container for Mobile */}
            <div className="overflow-x-auto">
                <div className="min-w-[800px]"> {/* Force minimum width to prevent squishing on mobile */}
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
                                                    className={`rounded-lg border shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 relative overflow-hidden group/card bg-white`}
                                                >
                                                    {/* Status Color Strip */}
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAllDone ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>

                                                    <div className="pl-2.5 pr-2 py-2">
                                                        {/* Header: Name */}
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="font-bold text-sm text-[#44403c] truncate leading-tight">
                                                                {getEmployeeName(shift.employeeId)}
                                                            </div>
                                                        </div>

                                                        {/* Role Badge */}
                                                        <div className="mb-1.5">
                                                            <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium truncate max-w-full ${shift.color}`}>
                                                                {shift.role}
                                                            </span>
                                                        </div>

                                                        {/* Time & Break Info */}
                                                        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#78716c] font-medium items-center">
                                                            <div className="flex items-center gap-0.5">
                                                                <Clock size={10} />
                                                                <span>{shift.startTime}-{shift.endTime}</span>
                                                            </div>
                                                            {shift.breakDuration && shift.breakDuration > 0 ? (
                                                                <div className="flex items-center gap-0.5 text-[#d97706]">
                                                                    <Coffee size={10} />
                                                                    <span>{shift.breakDuration}m</span>
                                                                </div>
                                                            ) : null}
                                                        </div>

                                                        {/* Task Progress Bar */}
                                                        {totalTasks > 0 && (
                                                            <div className="mt-2 flex items-center gap-1.5">
                                                                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${isAllDone ? 'bg-emerald-500' : 'bg-amber-400'}`}
                                                                        style={{ width: `${progressPercentage}%` }}
                                                                    />
                                                                </div>
                                                                <span className={`text-[9px] font-bold ${isAllDone ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                                    {completedTasks}/{totalTasks}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    {/* Add Button */}
                                    <button
                                        onClick={() => onAddShift(formattedDate)}
                                        className="absolute bottom-2 right-2 p-2 bg-[#d97706] text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[#b45309] hover:scale-110 z-10 hidden sm:block"
                                        title="新增排班"
                                    >
                                        <Plus size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};