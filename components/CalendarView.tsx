
import React, { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, isBefore, parseISO } from 'date-fns';
import { Shift, Employee } from '../types';
import { Plus, Clock, Search, LayoutGrid, Layers, Calendar as CalendarIcon, Star, CheckSquare, ListChecks } from 'lucide-react';

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
    const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

    const filteredShifts = useMemo(() => {
        if (!searchQuery.trim()) return shifts;
        const query = searchQuery.toLowerCase();
        return shifts.filter(s => {
            const empName = employees.find(e => e.id === s.employeeId)?.name.toLowerCase() || '';
            const role = s.role.toLowerCase();
            const taskMatch = s.tasks.some(t => t.description.toLowerCase().includes(query));
            return empName.includes(query) || role.includes(query) || taskMatch;
        });
    }, [shifts, searchQuery, employees]);

    const getShiftsForDay = (date: Date) => {
        return filteredShifts.filter(s => isSameDay(parseISO(s.date), date));
    };

    const getEmployee = (id: string) => employees.find(e => e.id === id);
    const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3 rounded-2xl shadow-sm border border-[#e7e5e4]">
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" placeholder="搜尋夥伴或職位..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs" />
                </div>
                <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-auto">
                    <button onClick={() => setViewMode('grid')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-2 transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#064e3b]' : 'text-gray-500'}`}><LayoutGrid size={14} /> 網格模式</button>
                    <button onClick={() => setViewMode('timeline')} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[10px] font-black flex items-center justify-center gap-2 transition-all ${viewMode === 'timeline' ? 'bg-white shadow-sm text-[#064e3b]' : 'text-gray-500'}`}><Layers size={14} /> 時間軸模式</button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
                    {weekDays.map((day, i) => {
                        const dayShifts = getShiftsForDay(day);
                        const isToday = isSameDay(day, new Date());
                        const isPast = isBefore(day, new Date(new Date().setHours(0,0,0,0)));

                        return (
                            <div key={i} className={`flex flex-col min-h-[160px] sm:min-h-[300px] bg-white rounded-2xl border transition-all ${isToday ? 'border-[#064e3b] shadow-lg ring-2 ring-[#064e3b]/5' : 'border-[#e7e5e4]'} ${isPast ? 'opacity-70' : ''}`}>
                                <div className={`p-2 text-center border-b flex sm:flex-col items-center justify-between sm:justify-center gap-1 ${isToday ? 'bg-[#064e3b] text-white' : 'bg-gray-50'}`}>
                                    <div className="flex flex-col sm:items-center">
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-80">{dayNames[i]}</div>
                                        <div className="text-base font-black leading-tight">{format(day, 'd')}</div>
                                    </div>
                                    {isToday && <Star size={12} className="text-[#fbbf24] fill-[#fbbf24] animate-pulse" />}
                                </div>
                                <div className="p-2 space-y-2 flex-1 overflow-y-auto overflow-x-visible">
                                    {dayShifts.map(shift => {
                                        const emp = getEmployee(shift.employeeId);
                                        const doneCount = shift.tasks.filter(t => t.isCompleted).length;
                                        const totalCount = shift.tasks.length;
                                        return (
                                            <div key={shift.id} onClick={() => onEditShift(shift)} className="relative bg-white border border-gray-100 rounded-xl p-2 shadow-sm hover:border-[#d97706] cursor-pointer transition-all active:scale-95 group hover:z-20 hover:shadow-md">
                                                <div className="flex items-center gap-1.5 mb-1">
                                                    <img src={emp?.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                                                    <span className="font-black text-[10px] text-gray-700 truncate">{emp?.name}</span>
                                                </div>
                                                <div className="flex justify-between items-center mb-1">
                                                    <div className={`text-[8px] font-black px-1 py-0.5 rounded ${shift.color}`}>{shift.role}</div>
                                                    <div className="flex items-center gap-0.5 text-[8px] font-bold text-emerald-600">
                                                        <CheckSquare size={10}/> {doneCount}/{totalCount}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 text-[8px] text-gray-400 font-bold"><Clock size={8}/> {shift.startTime}-{shift.endTime}</div>

                                                {/* Hover Tooltip Task Preview */}
                                                <div className="absolute left-0 top-[95%] pt-2 w-[110%] z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none hidden group-hover:block">
                                                    <div className="bg-white/95 backdrop-blur-md border-2 border-amber-100 rounded-xl shadow-xl p-3 relative">
                                                        <div className="absolute -top-1.5 left-4 w-3 h-3 bg-white border-t border-l border-amber-100 transform rotate-45"></div>
                                                        <div className="text-[9px] font-black text-[#d97706] mb-1.5 flex items-center gap-1 uppercase tracking-widest">
                                                            <ListChecks size={10} /> 任務預覽
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            {shift.tasks.length === 0 ? (
                                                                <p className="text-[10px] text-gray-400 italic">尚未建立任務</p>
                                                            ) : (
                                                                shift.tasks.slice(0, 3).map((task, idx) => (
                                                                    <div key={idx} className="flex items-start gap-1.5 text-[10px] text-gray-600">
                                                                        <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.isCompleted ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                                                        <span className={`truncate leading-tight ${task.isCompleted ? 'line-through text-gray-300' : ''}`}>
                                                                            {task.description}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            )}
                                                            {shift.tasks.length > 3 && (
                                                                <div className="text-[9px] text-gray-400 pl-3 font-bold">
                                                                    + 還有 {shift.tasks.length - 3} 項...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!isPast && (
                                        <button onClick={() => onAddShift(format(day, 'yyyy-MM-dd'))} className="w-full py-3 border-2 border-dashed border-gray-100 rounded-xl text-gray-300 hover:border-[#064e3b] hover:text-[#064e3b] transition-all flex items-center justify-center"><Plus size={16} /></button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* Timeline View Simplified */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-4">
                    <h3 className="font-black text-sm mb-4">今日人力分佈</h3>
                    <div className="space-y-3">
                        {getShiftsForDay(new Date()).length === 0 ? <p className="text-center text-xs text-gray-400 italic">今日無排班</p> : 
                            getShiftsForDay(new Date()).map(shift => {
                                const emp = getEmployee(shift.employeeId);
                                return (
                                    <div key={shift.id} className="flex items-center gap-3">
                                        <img src={emp?.avatar} className="w-6 h-6 rounded-full" alt="" />
                                        <span className="text-[10px] font-bold w-12">{emp?.name}</span>
                                        <div className="flex-1 h-6 bg-gray-50 rounded-lg relative overflow-hidden">
                                            <div onClick={() => onEditShift(shift)} className={`absolute h-full border-l-2 flex items-center px-2 text-[8px] font-black cursor-pointer ${shift.color}`} style={{left:'10%', width:'70%'}}>
                                                {shift.startTime}-{shift.endTime} ({shift.role})
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        }
                    </div>
                </div>
            )}
        </div>
    );
};
