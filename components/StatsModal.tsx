import React, { useMemo } from 'react';
import { Shift, Employee } from '../types';
import { X, Calculator, Clock, TrendingUp, CalendarDays, Coins, Coffee } from 'lucide-react';
import { format, isSameMonth, parseISO } from 'date-fns';

interface StatsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    shifts: Shift[];
    employees: Employee[];
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, currentDate, shifts, employees }) => {
    
    // Calculate statistics based on current month
    const stats = useMemo(() => {
        const currentMonthShifts = shifts.filter(s => isSameMonth(parseISO(s.date), currentDate));
        
        const calculateDuration = (start: string, end: string) => {
            const [startH, startM] = start.split(':').map(Number);
            const [endH, endM] = end.split(':').map(Number);
            let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
            if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight
            return diffMinutes / 60;
        };

        const employeeStats = employees.map(emp => {
            const empShifts = currentMonthShifts.filter(s => s.employeeId === emp.id);
            const BASE_WAGE = emp.hourlyWage || 185; // Default to 185 if not set
            
            let totalNetHours = 0;
            let totalBreakHours = 0;
            let estimatedSalary = 0;
            let totalTasks = 0;
            let completedTasks = 0;
            
            // New counters for hours breakdown
            let totalNormalHours = 0;
            let totalOt1Hours = 0; // 1.34x
            let totalOt2Hours = 0; // 1.67x
            
            empShifts.forEach(s => {
                const grossDuration = calculateDuration(s.startTime, s.endTime);
                const breakInHours = (s.breakDuration || 0) / 60;
                let netDuration = grossDuration - breakInHours;
                if (netDuration < 0) netDuration = 0;

                totalNetHours += netDuration;
                totalBreakHours += breakInHours;

                // Calculate breakdown for this shift
                let remaining = netDuration;
                
                // Tier 1: Normal (First 8 hours)
                const normal = Math.min(remaining, 8);
                remaining -= normal;
                
                // Tier 2: OT1 (Next 2 hours, 1.34x)
                const ot1 = Math.min(remaining, 2);
                remaining -= ot1;
                
                // Tier 3: OT2 (Remaining hours, 1.67x)
                const ot2 = Math.max(0, remaining);

                // Accumulate totals
                totalNormalHours += normal;
                totalOt1Hours += ot1;
                totalOt2Hours += ot2;

                // Calculate Pay based on specific tiers using INDIVIDUAL WAGE
                estimatedSalary += Math.round(
                    (normal * BASE_WAGE) + 
                    (ot1 * BASE_WAGE * 1.34) + 
                    (ot2 * BASE_WAGE * 1.67)
                );

                totalTasks += s.tasks.length;
                completedTasks += s.tasks.filter(t => t.isCompleted).length;
            });

            return {
                ...emp,
                shiftCount: empShifts.length,
                totalNetHours: totalNetHours,
                totalBreakHours: totalBreakHours,
                totalNormalHours: totalNormalHours,
                totalOt1Hours: totalOt1Hours,
                totalOt2Hours: totalOt2Hours,
                estimatedSalary: estimatedSalary,
                taskCompletionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
            };
        });

        const grandTotalNetHours = employeeStats.reduce((acc, curr) => acc + curr.totalNetHours, 0);
        const grandTotalSalary = employeeStats.reduce((acc, curr) => acc + curr.estimatedSalary, 0);
        const totalShiftsCount = currentMonthShifts.length;
        // Average wage across valid hours
        const averageWage = grandTotalNetHours > 0 ? Math.round(grandTotalSalary / grandTotalNetHours) : 0;

        return { employeeStats, grandTotalNetHours, grandTotalSalary, totalShiftsCount, averageWage };
    }, [shifts, employees, currentDate]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#064e3b] bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#fcfaf8] rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-[#e7e5e4]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#e7e5e4] flex justify-between items-center bg-[#f5f5f4]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#d97706] text-white rounded-lg shadow-sm">
                            <Calculator size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#44403c]">營運工時統計</h3>
                            <p className="text-xs text-[#78716c] font-medium">{format(currentDate, 'yyyy年 M月')} 報表</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-xl border border-[#e7e5e4] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                <Clock size={24} />
                            </div>
                            <div>
                                <div className="text-xs text-[#78716c]">本月淨工時 (不含休)</div>
                                <div className="text-xl font-bold text-[#064e3b]">{stats.grandTotalNetHours.toFixed(1)} <span className="text-xs font-normal text-gray-500">hr</span></div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-[#e7e5e4] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                                <CalendarDays size={24} />
                            </div>
                            <div>
                                <div className="text-xs text-[#78716c]">總排班數</div>
                                <div className="text-xl font-bold text-[#d97706]">{stats.totalShiftsCount} <span className="text-xs font-normal text-gray-500">班</span></div>
                            </div>
                        </div>
                         <div className="bg-white p-4 rounded-xl border border-[#e7e5e4] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
                                <Coins size={24} />
                            </div>
                            <div>
                                <div className="text-xs text-[#78716c]">薪資總支出 (預估)</div>
                                <div className="text-xl font-bold text-rose-600">${stats.grandTotalSalary.toLocaleString()}</div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-[#e7e5e4] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-700">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <div className="text-xs text-[#78716c]">平均時薪成本</div>
                                <div className="text-xl font-bold text-[#0284c7]">
                                    ${stats.averageWage} <span className="text-xs font-normal text-gray-500">/hr</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2 text-right bg-gray-50 p-2 rounded border border-gray-100">
                        * 計算規則：淨工時 = 總時數 - 休息時間。 薪資計算：依每人基本時薪 (0-8小時) / 加班 1.34倍 (9-10小時) / 加班 1.67倍 ({'>'}10小時)
                    </div>

                    {/* Employee Table */}
                    <div className="bg-white rounded-xl border border-[#e7e5e4] shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-[#fafaf9] border-b border-[#e7e5e4] text-[#57534e] text-sm uppercase tracking-wider">
                                        <th className="px-4 py-4 font-bold sticky left-0 bg-[#fafaf9] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">夥伴姓名 / 時薪</th>
                                        <th className="px-4 py-4 font-bold text-center">排班數</th>
                                        <th className="px-4 py-4 font-bold text-center bg-gray-50 text-gray-700 border-x border-gray-200">淨工時 (hr)</th>
                                        <th className="px-4 py-4 font-bold text-center bg-emerald-50 text-emerald-800">正常 (1.0)</th>
                                        <th className="px-4 py-4 font-bold text-center bg-amber-50 text-amber-800">加班 (1.34)</th>
                                        <th className="px-4 py-4 font-bold text-center bg-rose-50 text-rose-800">加班 (1.67)</th>
                                        <th className="px-4 py-4 font-bold text-center">休息 (hr)</th>
                                        <th className="px-4 py-4 font-bold text-center text-rose-700 border-l border-gray-200">預估薪資</th>
                                        <th className="px-4 py-4 font-bold text-center">達成率</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e7e5e4]">
                                    {stats.employeeStats.map((emp) => (
                                        <tr key={emp.id} className="hover:bg-[#fafaf9] transition-colors">
                                            <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-[#fafaf9] z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                <div className="flex items-center gap-2">
                                                    <img src={emp.avatar} alt={emp.name} className="w-8 h-8 rounded-full shadow-sm" />
                                                    <div>
                                                        <div className="font-bold text-[#44403c] whitespace-nowrap">{emp.name}</div>
                                                        <div className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded inline-block">
                                                            ${emp.hourlyWage}/hr
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="inline-block px-2.5 py-0.5 bg-stone-100 text-stone-700 rounded-full text-xs font-medium">
                                                    {emp.shiftCount}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-[#44403c] bg-gray-50/50 border-x border-[#e7e5e4]">
                                                {emp.totalNetHours.toFixed(1)}
                                            </td>
                                            <td className="px-4 py-4 text-center text-emerald-700 bg-emerald-50/30">
                                                {emp.totalNormalHours > 0 ? emp.totalNormalHours.toFixed(1) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center text-amber-700 bg-amber-50/30 font-medium">
                                                {emp.totalOt1Hours > 0 ? emp.totalOt1Hours.toFixed(1) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center text-rose-700 bg-rose-50/30 font-bold">
                                                {emp.totalOt2Hours > 0 ? emp.totalOt2Hours.toFixed(1) : '-'}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1 text-gray-400 text-xs">
                                                    <span>{emp.totalBreakHours > 0 ? emp.totalBreakHours.toFixed(1) : '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center border-l border-[#e7e5e4]">
                                                <span className="font-bold text-rose-600">
                                                    ${emp.estimatedSalary.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className={`h-2 rounded-full ${
                                                                emp.taskCompletionRate === 100 ? 'bg-emerald-500' : 
                                                                emp.taskCompletionRate > 70 ? 'bg-amber-400' : 'bg-red-400'
                                                            }`} 
                                                            style={{ width: `${emp.taskCompletionRate}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-[10px] font-medium text-gray-500 w-6 text-right">{emp.taskCompletionRate}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};