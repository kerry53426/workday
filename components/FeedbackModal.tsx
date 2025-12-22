import React from 'react';
import { Feedback, Employee } from '../types';
import { X, MessageSquareQuote, Trash2, Check, User, CheckCircle2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    feedbacks: Feedback[];
    employees: Employee[];
    onMarkAsRead: (id: string) => void;
    onDeleteFeedback: (id: string) => void;
    onDeleteAllRead?: () => void; // New prop for bulk delete
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
    isOpen, 
    onClose, 
    feedbacks, 
    employees, 
    onMarkAsRead, 
    onDeleteFeedback,
    onDeleteAllRead
}) => {
    if (!isOpen) return null;

    const sortedFeedbacks = [...feedbacks].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const getEmployee = (id: string) => employees.find(e => e.id === id);
    const readCount = feedbacks.filter(f => f.isRead).length;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064e3b] bg-opacity-70 backdrop-blur-sm">
            <div className="bg-[#fcfaf8] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-[#e7e5e4] flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#e7e5e4] flex justify-between items-center bg-[#f5f5f4] flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#d97706] text-white rounded-lg shadow-sm">
                            <MessageSquareQuote size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#44403c]">夥伴心聲與建議</h3>
                            <p className="text-xs text-[#78716c] font-medium">聆聽第一線夥伴的真實回饋</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onDeleteAllRead && readCount > 0 && (
                            <button 
                                onClick={onDeleteAllRead}
                                className="hidden sm:flex items-center gap-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors border border-red-200"
                                title="刪除所有已讀留言"
                            >
                                <Trash2 size={12} /> 清空已讀 ({readCount})
                            </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-0 overflow-y-auto bg-[#f5f5f4] flex-1">
                    {sortedFeedbacks.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center text-gray-400">
                            <MessageSquareQuote size={48} className="opacity-20 mb-3" />
                            <p>目前沒有任何留言</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {sortedFeedbacks.map(fb => {
                                const emp = getEmployee(fb.employeeId);
                                return (
                                    <div key={fb.id} className={`p-5 transition-colors ${fb.isRead ? 'bg-white opacity-90' : 'bg-amber-50'}`}>
                                        <div className="flex items-start gap-4">
                                            {/* Avatar */}
                                            <div className="flex-shrink-0">
                                                {emp ? (
                                                    <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full border border-gray-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <div>
                                                        <span className="font-bold text-[#44403c] mr-2">
                                                            {emp ? emp.name : '未知夥伴'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {format(parseISO(fb.date), 'yyyy/MM/dd HH:mm')}
                                                        </span>
                                                    </div>
                                                    {!fb.isRead && (
                                                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full">NEW</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-[#57534e] whitespace-pre-wrap leading-relaxed">
                                                    {fb.content}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 ml-2">
                                                {!fb.isRead ? (
                                                    <button 
                                                        onClick={() => onMarkAsRead(fb.id)}
                                                        className="text-[#064e3b] hover:bg-emerald-100 p-2 rounded-full transition-colors bg-white shadow-sm border border-gray-100"
                                                        title="標示為已讀"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                ) : (
                                                    <span className="text-gray-300 p-2">
                                                        <CheckCircle2 size={18} />
                                                    </span>
                                                )}
                                                <button 
                                                    onClick={() => onDeleteFeedback(fb.id)}
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                    title="刪除"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                {onDeleteAllRead && readCount > 0 && (
                    <div className="sm:hidden p-3 border-t border-[#e7e5e4] bg-white">
                        <button 
                            onClick={onDeleteAllRead}
                            className="w-full flex justify-center items-center gap-1 text-xs text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors border border-red-200 font-bold"
                        >
                            <Trash2 size={14} /> 清空所有已讀留言 ({readCount})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};