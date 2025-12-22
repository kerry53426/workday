import React, { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay, isBefore } from 'date-fns';
import { Shift, Employee } from '../types';
import { Plus, Clock, Users, Coffee, LayoutList, Grid3X3, Calendar as CalendarIcon } from 'lucide-react';

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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

    const getShiftsForDay = (date: Date) => {
        return shifts.filter(s => isSameDay(new Date(s.date), date));
    };

    const getEmployeeName = (id: string) => {
        return employees.find(e => e.id === id)?.name || '未知';
    };

    const getEmployeeAvatar = (id: string) => {
        return employees.find(e => e.id === id)?.avatar;
    };

    return (
        <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex justify-end mb-2">
                <div className="bg-white p-1 rounded-lg border border-[#e7e5e4] shadow-sm flex items-center gap-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'grid' ? 'bg-[#064e3b] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <Grid3X3 size={16} />
                        <span className="hidden sm:inline">週曆</span>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === 'list' ? 'bg-[#064e3b] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                        <LayoutList size={16} />
                        <span className="hidden sm:inline">清單</span>
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                // GRID VIEW (Existing Logic)
                <div className="bg-white rounded-xl shadow-md border border-[#e7e5e4] overflow-hidden">
                    <div className="overflow-x-auto">
                        <div className="min-w-[800px]">
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
                            <div className="grid grid-cols-7 min-h-[500px] bg-[#fffbeb] bg-opacity-30">
                                {weekDays.map((day, i) => {
                                    const dayShifts = getShiftsForDay(day);
                                    const formattedDate = format(day, 'yyyy-MM-dd');
                                    const isPast = isBefore(day, new Date(new Date().setHours(0,0,0,0)));

                                    return (
                                        <div 
                                            key={i} 
                                            className={`border-r border-[#e7e5e4] last:border-r-0 p-2 relative group hover:bg-[#fafaf9] transition-colors ${isPast ? 'bg-[#f5f5f4]/50' : ''}`}
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
                                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isAllDone ? 'bg-emerald-500' : 'bg-amber-400'}`}></div>
                                                            <div className="pl-2.5 pr-2 py-2">
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <div className="font-bold text-sm text-[#44403c] truncate leading-tight">
                                                                        {getEmployeeName(shift.employeeId)}
                                                                    </div>
                                                                </div>
                                                                <div className="mb-1.5">
                                                                    <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-medium truncate max-w-full ${shift.color}`}>
                                                                        {shift.role}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10px] text-[#78716c] font-medium items-center">
                                                                    <div className="flex items-center gap-0.5">
                                                                        <Clock size={10} />
                                                                        <span>{shift.startTime}-{shift.endTime}</span>
                                                                    </div>
                                                                </div>
                                                                {totalTasks > 0 && (
                                                                    <div className="mt-2 flex items-center gap-1.5">
                                                                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div className={`h-full rounded-full transition-all duration-500 ${isAllDone ? 'bg-emerald-500' : 'bg-amber-400'}`} style={{ width: `${progressPercentage}%` }} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
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
            ) : (
                // LIST VIEW (New Better Readable Format)
                <div className="space-y-4">
                    {weekDays.map((day, i) => {
                        const dayShifts = getShiftsForDay(day);
                        const isToday = isSameDay(day, new Date());
                        const formattedDate = format(day, 'yyyy-MM-dd');
                        
                        return (
                            <div key={i} className={`bg-white rounded-xl shadow-sm border ${isToday ? 'border-[#064e3b] ring-1 ring-[#064e3b]/20' : 'border-[#e7e5e4]'} overflow-hidden`}>
                                {/* Day Header */}
                                <div className={`px-4 py-3 flex justify-between items-center ${isToday ? 'bg-[#ecfdf5]' : 'bg-[#fafaf9]'} border-b border-[#e7e5e4]`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border ${isToday ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white text-[#57534e] border-[#d6d3d1]'}`}>
                                            <span className="text-xs uppercase font-medium">{dayNames[i]}</span>
                                            <span className="text-lg font-bold leading-none">{format(day, 'd')}</span>
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#44403c]">{format(day, 'yyyy年 M月')}</div>
                                            <div className="text-xs text-[#78716c] flex items-center gap-1">
                                                <Users size={12} />
                                                {dayShifts.length > 0 ? `${dayShifts.length} 位夥伴值班` : '本日無排班'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onAddShift(formattedDate)}
                                        className="p-2 text-[#d97706] hover:bg-[#fffbeb] rounded-full transition-colors"
                                        title="新增本日排班"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>

                                {/* Shifts List */}
                                <div className="divide-y divide-[#f5f5f4]">
                                    {dayShifts.length === 0 ? (
                                        <div className="py-6 text-center text-gray-400 text-sm italic">
                                            本日休園或尚未排班
                                        </div>
                                    ) : (
                                        dayShifts.map(shift => {
                                            const completedTasks = shift.tasks.filter(t => t.isCompleted).length;
                                            const totalTasks = shift.tasks.length;
                                            
                                            return (
                                                <div 
                                                    key={shift.id}
                                                    onClick={() => onEditShift(shift)}
                                                    className="p-4 hover:bg-[#fafaf9] cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center gap-4"
                                                >
                                                    {/* Employee Info */}
                                                    <div className="flex items-center gap-3 min-w-[150px]">
                                                        <img 
                                                            src={getEmployeeAvatar(shift.employeeId)} 
                                                            alt="" 
                                                            className="w-10 h-10 rounded-full border border-gray-100" 
                                                        />
                                                        <div>
                                                            <div className="font-bold text-[#44403c]">{getEmployeeName(shift.employeeId)}</div>
                                                            <div className={`text-xs px-1.5 py-0.5 rounded border inline-block mt-0.5 ${shift.color}`}>
                                                                {shift.role}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Time & Stats */}
                                                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
                                                        <div className="flex items-center gap-1.5 text-sm text-[#57534e] col-span-2 sm:col-span-1">
                                                            <Clock size={16} className="text-[#d97706]" />
                                                            <span className="font-medium">{shift.startTime} - {shift.endTime}</span>
                                                        </div>
                                                        
                                                        {shift.breakDuration && shift.breakDuration > 0 ? (
                                                            <div className="flex items-center gap-1.5 text-xs text-[#78716c]">
                                                                <Coffee size={14} />
                                                                <span>休 {shift.breakDuration}分</span>
                                                            </div>
                                                        ) : <div />}

                                                        <div className="col-span-2 sm:col-span-2">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div 
                                                                        className={`h-full rounded-full ${totalTasks > 0 && completedTasks === totalTasks ? 'bg-emerald-500' : 'bg-amber-400'}`} 
                                                                        style={{ width: `${totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100}%` }} 
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                                                    {completedTasks}/{totalTasks} 任務
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
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