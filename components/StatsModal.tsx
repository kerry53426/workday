
import React, { useMemo, useState } from 'react';
import { Shift, Employee } from '../types';
import { X, Calculator, Clock, User, Award, Info, ChevronDown, ChevronUp, Calendar, Zap } from 'lucide-react';
import { format, isSameMonth, parseISO } from 'date-fns';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    shifts: Shift[];
    employees: Employee[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, currentDate, shifts, employees }) => {
    const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

    const stats = useMemo(() => {
        const currentMonthShifts = shifts.filter(s => isSameMonth(parseISO(s.date), currentDate));
        const calculateDuration = (start: string, end: string) => {
            const [startH, startM] = start.split(':').map(Number);
            const [endH, endM] = end.split(':').map(Number);
            let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
            if (diffMinutes < 0) diffMinutes += 24 * 60;
            return diffMinutes / 60;
        };

        const employeeStats = employees.map(emp => {
            const empShifts = [...currentMonthShifts].filter(s => s.employeeId === emp.id).sort((a,b) => a.date.localeCompare(b.date));
            const BASE_WAGE = emp.hourlyWage || 185;
            let totalNetHours = 0;
            let estimatedSalary = 0;
            let totalNormalHours = 0;
            let totalOt1Hours = 0;
            let totalOt2Hours = 0;
            
            const dailyDetails = empShifts.map(s => {
                const gross = calculateDuration(s.startTime, s.endTime);
                let breakH = 0;
                if (s.breakStartTime && s.breakEndTime) breakH = calculateDuration(s.breakStartTime, s.breakEndTime);
                else if (s.breakDuration) breakH = s.breakDuration / 60;
                
                const net = Math.max(0, gross - breakH);
                
                let remaining = net;
                const normal = Math.min(remaining, 8);
                remaining -= normal;
                const ot1 = Math.min(remaining, 2);
                remaining -= ot1;
                const ot2 = Math.max(0, remaining);

                const dayPay = Math.round((normal * BASE_WAGE) + (ot1 * BASE_WAGE * 1.34) + (ot2 * BASE_WAGE * 1.67));
                
                totalNetHours += net;
                estimatedSalary += dayPay;
                totalNormalHours += normal;
                totalOt1Hours += ot1;
                totalOt2Hours += ot2;

                return { 
                    date: s.date, 
                    net, 
                    pay: dayPay, 
                    startTime: s.startTime, 
                    endTime: s.endTime,
                    normal,
                    ot1,
                    ot2
                };
            });

            return { 
                ...emp, 
                shiftCount: empShifts.length, 
                totalNetHours, 
                estimatedSalary, 
                totalNormalHours,
                totalOt1Hours,
                totalOt2Hours,
                dailyDetails 
            };
        }).filter(e => e.shiftCount > 0);

        return { 
            employeeStats, 
            totalSalary: employeeStats.reduce((a,c)=>a+c.estimatedSalary, 0), 
            totalHours: employeeStats.reduce((a,c)=>a+c.totalNetHours, 0) 
        };
    }, [shifts, employees, currentDate]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-[#064e3b]/90 backdrop-blur-md flex flex-col sm:p-4 animate-in fade-in duration-200">
            <div className="bg-[#fcfaf8] w-full h-[100dvh] sm:h-auto sm:max-h-[95vh] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col border-t-8 border-[#d97706] safe-area-top">
                <div className="px-5 py-4 border-b flex justify-between items-center bg-white flex-shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-[#44403c] flex items-center gap-2"><Award className="text-[#d97706]" size={20} /> {format(currentDate, 'M月')} 營運績效</h3>
                        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">含加班費詳細計算</div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-20">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 text-center">
                            <div className="text-emerald-600 font-black text-[10px] uppercase mb-1">預估薪資支出</div>
                            <div className="text-xl font-black text-emerald-800">${stats.totalSalary.toLocaleString()}</div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 text-center">
                            <div className="text-amber-600 font-black text-[10px] uppercase mb-1">總工時</div>
                            <div className="text-xl font-black text-amber-800">{stats.totalHours.toFixed(1)} <span className="text-xs">H</span></div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest flex items-center gap-2"><User size={16} /> 夥伴工時明細</h4>
                        {stats.employeeStats.map(emp => (
                            <div key={emp.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div onClick={() => setExpandedEmpId(expandedEmpId === emp.id ? null : emp.id)} className="p-4 flex items-center gap-3 cursor-pointer hover:bg-gray-50">
                                    <img src={emp.avatar} className="w-10 h-10 rounded-full border border-gray-100 object-cover" />
                                    <div className="flex-1">
                                        <div className="font-black text-[#44403c]">{emp.name}</div>
                                        <div className="text-[10px] text-emerald-600 font-bold">預估：${emp.estimatedSalary.toLocaleString()}</div>
                                    </div>
                                    <div className="text-right flex items-center gap-3">
                                        <div>
                                            <div className="text-xs font-black text-gray-700">{emp.totalNetHours.toFixed(1)}h</div>
                                            <div className="text-[9px] text-gray-400 uppercase font-black">總工時</div>
                                        </div>
                                        {expandedEmpId === emp.id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                                    </div>
                                </div>
                                {expandedEmpId === emp.id && (
                                    <div className="px-4 pb-4 border-t border-gray-50 bg-gray-50/30 animate-in slide-in-from-top-1">
                                        {/* Monthly Breakdown Summary */}
                                        <div className="flex justify-between py-3 border-b border-dashed border-gray-200 mb-3">
                                             <div className="text-center">
                                                 <div className="text-[9px] text-gray-400 font-bold mb-1">一般工時</div>
                                                 <div className="text-xs font-black text-gray-700">{emp.totalNormalHours.toFixed(1)}h</div>
                                             </div>
                                             <div className="text-center">
                                                 <div className="text-[9px] text-amber-600 font-bold mb-1">加班 1.34</div>
                                                 <div className="text-xs font-black text-amber-700">{emp.totalOt1Hours.toFixed(1)}h</div>
                                             </div>
                                             <div className="text-center">
                                                 <div className="text-[9px] text-red-500 font-bold mb-1">加班 1.67</div>
                                                 <div className="text-xs font-black text-red-600">{emp.totalOt2Hours.toFixed(1)}h</div>
                                             </div>
                                        </div>

                                        <div className="text-[9px] font-black text-gray-400 mb-2 uppercase tracking-tighter">每日班次明細</div>
                                        <div className="space-y-2">
                                            {emp.dailyDetails.map((day, idx) => (
                                                <div key={idx} className="bg-white rounded-xl border border-gray-100 p-2.5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2 font-bold text-gray-700">
                                                            <Calendar size={14} className="text-[#d97706]"/> 
                                                            {format(parseISO(day.date), 'MM/dd')}
                                                            <span className="text-[10px] text-gray-400 font-medium">({day.startTime}-{day.endTime})</span>
                                                        </div>
                                                        <div className="font-black text-[#064e3b] text-sm">${day.pay.toLocaleString()}</div>
                                                    </div>
                                                    
                                                    {/* Work Hour Breakdown Bar */}
                                                    <div className="flex gap-1 text-[9px] font-bold">
                                                        <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded flex-1 text-center">
                                                            一般 {day.normal.toFixed(1)}h
                                                        </div>
                                                        {day.ot1 > 0 && (
                                                            <div className="bg-amber-50 text-amber-700 px-2 py-1 rounded flex-1 text-center flex items-center justify-center gap-1 border border-amber-100">
                                                                <Zap size={8} fill="currentColor"/> 1.34x: {day.ot1.toFixed(1)}h
                                                            </div>
                                                        )}
                                                        {day.ot2 > 0 && (
                                                            <div className="bg-red-50 text-red-700 px-2 py-1 rounded flex-1 text-center flex items-center justify-center gap-1 border border-red-100">
                                                                <Zap size={8} fill="currentColor"/> 1.67x: {day.ot2.toFixed(1)}h
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                        <Info size={18} className="text-blue-600 flex-shrink-0" />
                        <div className="text-[11px] text-blue-700 leading-relaxed font-bold">
                            工時說明：每日正常工時上限 8 小時。第 9-10 小時乘 1.34 倍；第 11 小時起乘 1.67 倍。
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
