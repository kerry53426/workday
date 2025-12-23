
import React, { useState, useRef } from 'react';
import { Shift, Employee, Task, Notification } from '../types';
import { format, isSameDay, parseISO, addDays, startOfToday } from 'date-fns';
import { CheckCircle2, Circle, Clock, Tent, ListTodo, LogOut, Calendar as CalendarIcon, MessageSquarePlus, Send, X, ChevronRight, Bell, HelpingHand, Camera, Upload, CheckSquare, Key } from 'lucide-react';

interface EmployeePortalProps {
    employee: Employee;
    shifts: Shift[];
    onToggleTask: (shiftId: string, taskId: string, completerId?: string) => void;
    onLogout: () => void;
    onChangePassword: (newPassword: string) => void;
    onSendFeedback: (content: string) => void;
    onViewShift: (shift: Shift) => void; 
    onUpdateAvatar: (base64: string) => void;
    allEmployees: Employee[]; 
    notifications: Notification[];
    onMarkNotificationRead: (id: string) => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({ 
    employee, shifts, onLogout, onSendFeedback, onViewShift, onUpdateAvatar, onChangePassword, notifications, onMarkNotificationRead
}) => {
    const today = startOfToday();
    const [feedbackContent, setFeedbackContent] = useState('');
    const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
    const [newPwd, setNewPwd] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const myUpcomingShifts = [...shifts]
        .filter(s => s.employeeId === employee.id && new Date(s.date) >= new Date(today.setHours(0,0,0,0)))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const next14Days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

    const handleSubmitFeedback = () => {
        if (!feedbackContent.trim()) return;
        onSendFeedback(feedbackContent);
        setFeedbackContent('');
        alert("訊息已傳送給執行長！");
    };

    const handleAvatarClick = () => { fileInputRef.current?.click(); };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => onUpdateAvatar(reader.result as string);
        reader.readAsDataURL(file);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 safe-area-bottom">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-5 shadow-md border-l-8 border-[#064e3b] flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                        <img src={employee.avatar} alt="" className="w-16 h-16 rounded-full border-4 border-[#ecfdf5] shadow-lg object-cover" />
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera size={16} className="text-white" /></div>
                        <div className="absolute -bottom-1 -right-1 bg-[#064e3b] text-white p-1 rounded-full border-2 border-white"><Upload size={10} /></div>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#44403c]">{employee.name}</h2>
                        <div className="flex gap-2 items-center mt-1">
                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Camping Partner</span>
                            <button onClick={() => setIsChangePwdOpen(true)} className="text-[10px] text-blue-500 font-bold flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded"><Key size={10}/> 改密碼</button>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onLogout} className="p-2.5 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 rounded-xl border border-gray-100"><LogOut size={22} /></button>
                </div>
            </div>

            {/* Change Password Modal */}
            {isChangePwdOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
                        <h3 className="font-black text-gray-800 mb-4">設定新密碼</h3>
                        <input type="text" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="輸入 4-8 位密碼" className="w-full p-3 border rounded-xl mb-4 font-bold text-center tracking-widest" />
                        <div className="flex gap-2">
                            <button onClick={() => setIsChangePwdOpen(false)} className="flex-1 py-2 text-gray-400 font-bold">取消</button>
                            <button onClick={() => { if(newPwd.length < 4) return alert('太短了！'); onChangePassword(newPwd); setIsChangePwdOpen(false); }} className="flex-1 py-2 bg-[#064e3b] text-white rounded-xl font-black">確認修改</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Today Focus Card */}
            <div className="space-y-4">
                <h3 className="font-black text-[#44403c] flex items-center gap-2 px-1">
                    <CheckSquare size={20} className="text-[#d97706]" /> 今日工作回報
                </h3>
                {myUpcomingShifts.filter(s => isSameDay(parseISO(s.date), today)).length === 0 ? (
                    <div className="bg-white rounded-3xl p-10 text-center border-4 border-dashed border-gray-100">
                        <Tent size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-black">今日無班，好好休息享受露營時光！</p>
                    </div>
                ) : (
                    myUpcomingShifts.filter(s => isSameDay(parseISO(s.date), today)).map((shift) => (
                        <div key={shift.id} onClick={() => onViewShift(shift)} className="bg-[#064e3b] text-white rounded-3xl p-7 shadow-xl border-t-8 border-[#d97706] transition-transform active:scale-95 group relative overflow-hidden">
                            <div className="absolute -right-10 -top-10 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                <Tent size={160}/>
                            </div>
                            <div className="flex justify-between items-start mb-8">
                                <div className="z-10">
                                    <div className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-md mb-2 inline-block">TODAY SHIFT</div>
                                    <h4 className="text-3xl font-black mb-1">{shift.role}</h4>
                                    <p className="text-emerald-300 font-black text-base flex items-center gap-1 mt-2"><Clock size={18}/> {shift.startTime} - {shift.endTime}</p>
                                </div>
                                <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl text-center z-10 border border-white/20">
                                    <div className="text-3xl font-black">{shift.tasks.filter(t=>t.isCompleted).length}/{shift.tasks.length}</div>
                                    <div className="text-[10px] font-black uppercase opacity-60">任務進度</div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between bg-white text-[#064e3b] px-5 py-4 rounded-2xl group-hover:bg-[#fbbf24] group-hover:text-[#78350f] transition-all shadow-inner">
                                <span className="font-black text-lg">開始回報工作項目</span>
                                <ChevronRight size={24} />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Calendar Strip (Horizontal Scrolling Future Shifts) */}
            <div className="bg-white rounded-2xl shadow-sm border border-[#e7e5e4] p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[#57534e] font-black text-sm"><CalendarIcon size={16} className="text-[#064e3b]" /> 班表預覽 (14天)</div>
                    <span className="text-[10px] text-gray-300 font-bold">向右滑動查看更多</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {next14Days.map((day, i) => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const hasShift = myUpcomingShifts.find(s => s.date === dateStr);
                        const isToday = isSameDay(day, today);
                        return (
                            <div key={i} onClick={() => hasShift && onViewShift(hasShift)} className={`snap-center flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all ${hasShift ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-md cursor-pointer active:scale-90' : isToday ? 'border-[#d97706] bg-amber-50 text-[#d97706]' : 'bg-gray-50 border-gray-100 text-gray-300'}`}>
                                <span className="text-[10px] font-black">週{['日', '一', '二', '三', '四', '五', '六'][day.getDay()]}</span>
                                <span className="text-xl font-black leading-none mt-1">{format(day, 'd')}</span>
                                {hasShift && <div className="mt-1 w-1 h-1 bg-white rounded-full"></div>}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-white rounded-2xl border-2 border-amber-50 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-[#d97706] font-black">
                    <MessageSquarePlus size={20} /> 給執行長的話
                </div>
                <div className="relative">
                    <textarea value={feedbackContent} onChange={(e) => setFeedbackContent(e.target.value)} placeholder="這裡可以直接跟執行長溝通喔..." className="w-full p-4 rounded-xl border-2 border-gray-100 bg-gray-50/50 focus:bg-white text-sm min-h-[120px] outline-none transition-all font-bold" />
                    <button onClick={handleSubmitFeedback} className="absolute bottom-4 right-4 p-3 bg-[#064e3b] text-white rounded-xl shadow-lg hover:bg-emerald-800 transition-colors"><Send size={20} /></button>
                </div>
            </div>
        </div>
    );
};
