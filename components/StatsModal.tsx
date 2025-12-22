import React, { useMemo } from 'react';
import { Shift, Employee } from '../types';
import { X, Calculator, Clock, CheckCircle2, TrendingUp, CalendarDays, Coins } from 'lucide-react';
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
        const BASE_HOURLY_WAGE = 220;
        
        const calculateDuration = (start: string, end: string) => {
            const [startH, startM] = start.split(':').map(Number);
            const [endH, endM] = end.split(':').map(Number);
            let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
            if (diffMinutes < 0) diffMinutes += 24 * 60; // Handle overnight
            return diffMinutes / 60;
        };

        // Calculate pay for a single shift based on labor standards logic provided
        // 0-8 hrs: Base
        // 8-10 hrs: Base * 1.34
        // >10 hrs: Base * 1.67
        const calculateShiftPay = (duration: number) => {
            let pay = 0;
            
            // Standard hours (First 8 hours)
            const standardHours = Math.min(duration, 8);
            pay += standardHours * BASE_HOURLY_WAGE;

            // Overtime Tier 1 (Next 2 hours, 9th and 10th)
            if (duration > 8) {
                const ot1Hours = Math.min(duration - 8, 2);
                pay += ot1Hours * BASE_HOURLY_WAGE * 1.34;
            }

            // Overtime Tier 2 (After 10 hours)
            if (duration > 10) {
                const ot2Hours = duration - 10;
                pay += ot2Hours * BASE_HOURLY_WAGE * 1.67;
            }

            return Math.round(pay);
        };

        const employeeStats = employees.map(emp => {
            const empShifts = currentMonthShifts.filter(s => s.employeeId === emp.id);
            
            let totalHours = 0;
            let estimatedSalary = 0;
            let totalTasks = 0;
            let completedTasks = 0;
            
            empShifts.forEach(s => {
                const duration = calculateDuration(s.startTime, s.endTime);
                totalHours += duration;
                estimatedSalary += calculateShiftPay(duration);

                totalTasks += s.tasks.length;
                completedTasks += s.tasks.filter(t => t.isCompleted).length;
            });

            return {
                ...emp,
                shiftCount: empShifts.length,
                totalHours: totalHours,
                estimatedSalary: estimatedSalary,
                taskCompletionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
            };
        });

        const grandTotalHours = employeeStats.reduce((acc, curr) => acc + curr.totalHours, 0);
        const grandTotalSalary = employeeStats.reduce((acc, curr) => acc + curr.estimatedSalary, 0);
        const totalShiftsCount = currentMonthShifts.length;

        return { employeeStats, grandTotalHours, grandTotalSalary, totalShiftsCount };
    }, [shifts, employees, currentDate]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#064e3b] bg-opacity-70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#fcfaf8] rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-[#e7e5e4]">
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

                <div className="p-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white p-4 rounded-xl border border-[#e7e5e4] shadow-sm flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                                <Clock size={24} />
                            </div>
                            <div>
                                <div className="text-xs text-[#78716c]">本月總工時</div>
                                <div className="text-xl font-bold text-[#064e3b]">{stats.grandTotalHours.toFixed(1)} <span className="text-xs font-normal text-gray-500">hr</span></div>
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
                                    ${Math.round(stats.grandTotalSalary / (stats.grandTotalHours || 1))} <span className="text-xs font-normal text-gray-500">/hr</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-2 text-right bg-gray-50 p-2 rounded border border-gray-100">
                        * 計算規則：基本時薪 $220 (0-8小時) / 加班 $295 (9-10小時 ×1.34) / 加班 $367 (11小時起 ×1.67)
                    </div>

                    {/* Employee Table */}
                    <div className="bg-white rounded-xl border border-[#e7e5e4] shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#fafaf9] border-b border-[#e7e5e4] text-[#57534e] text-sm uppercase tracking-wider">
                                    <th className="px-6 py-4 font-bold">夥伴姓名</th>
                                    <th className="px-6 py-4 font-bold text-center">排班次數</th>
                                    <th className="px-6 py-4 font-bold text-center">累積工時</th>
                                    <th className="px-6 py-4 font-bold text-center text-rose-700">預估薪資</th>
                                    <th className="px-6 py-4 font-bold text-center">任務達成率</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#e7e5e4]">
                                {stats.employeeStats.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-[#fafaf9] transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full shadow-sm" />
                                                <span className="font-bold text-[#44403c]">{emp.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-block px-3 py-1 bg-stone-100 text-stone-700 rounded-full text-sm font-medium">
                                                {emp.shiftCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-[#064e3b] text-lg">
                                                {emp.totalHours.toFixed(1)}
                                            </span>
                                            <span className="text-xs text-gray-400 ml-1">hr</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-rose-600 text-lg">
                                                ${emp.estimatedSalary.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-24 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                                    <div 
                                                        className={`h-2.5 rounded-full ${
                                                            emp.taskCompletionRate === 100 ? 'bg-emerald-500' : 
                                                            emp.taskCompletionRate > 70 ? 'bg-amber-400' : 'bg-red-400'
                                                        }`} 
                                                        style={{ width: `${emp.taskCompletionRate}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-medium text-gray-600 w-8 text-right">{emp.taskCompletionRate}%</span>
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
    );
};