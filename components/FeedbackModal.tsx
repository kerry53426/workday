import React, { useState } from 'react';
import { Feedback, Employee } from '../types';
import { X, MessageSquareQuote, Trash2, Check, User, CheckCircle2, Star, Tag, Edit3, Save, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    feedbacks: Feedback[];
    employees: Employee[];
    onMarkAsRead: (id: string) => void;
    onDeleteFeedback: (id: string) => void;
    onDeleteAllRead?: () => void;
    onUpdateFeedback?: (id: string, updates: Partial<Feedback>) => void; // New prop
}

type FilterType = 'all' | 'important' | 'unread' | 'read';

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
    isOpen, 
    onClose, 
    feedbacks, 
    employees, 
    onMarkAsRead, 
    onDeleteFeedback,
    onDeleteAllRead,
    onUpdateFeedback
}) => {
    const [filter, setFilter] = useState<FilterType>('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNote, setEditNote] = useState('');
    const [editCategory, setEditCategory] = useState<string>('其他');

    if (!isOpen) return null;

    // Sort: Important first, then date
    const sortedFeedbacks = [...feedbacks].sort((a, b) => {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const filteredFeedbacks = sortedFeedbacks.filter(f => {
        if (filter === 'important') return f.isImportant;
        if (filter === 'unread') return !f.isRead;
        if (filter === 'read') return f.isRead;
        return true;
    });

    const getEmployee = (id: string) => employees.find(e => e.id === id);
    const readCount = feedbacks.filter(f => f.isRead).length;

    const startEditing = (fb: Feedback) => {
        setEditingId(fb.id);
        setEditNote(fb.adminNote || '');
        setEditCategory(fb.category || '其他');
    };

    const saveEditing = (id: string) => {
        if (onUpdateFeedback) {
            onUpdateFeedback(id, {
                adminNote: editNote,
                category: editCategory as any
            });
        }
        setEditingId(null);
    };

    const toggleImportance = (id: string, current: boolean) => {
        if (onUpdateFeedback) {
            onUpdateFeedback(id, { isImportant: !current });
        }
    };

    const categories = ['設備', '人事', '營運', '其他'];

    const getCategoryColor = (cat?: string) => {
        switch (cat) {
            case '設備': return 'bg-blue-100 text-blue-700 border-blue-200';
            case '人事': return 'bg-purple-100 text-purple-700 border-purple-200';
            case '營運': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064e3b] bg-opacity-70 backdrop-blur-sm">
            <div className="bg-[#fcfaf8] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border-4 border-[#e7e5e4] flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#e7e5e4] bg-[#f5f5f4] flex-shrink-0">
                    <div className="flex justify-between items-center mb-3">
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
                             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-200 rounded-full">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button 
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${filter === 'all' ? 'bg-[#44403c] text-white border-[#44403c]' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            全部 ({feedbacks.length})
                        </button>
                         <button 
                            onClick={() => setFilter('important')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border flex items-center gap-1 ${filter === 'important' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Star size={12} className={filter === 'important' ? 'fill-amber-700' : ''} />
                            重要星號
                        </button>
                        <button 
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${filter === 'unread' ? 'bg-red-100 text-red-700 border-red-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            未讀 ({feedbacks.filter(f => !f.isRead).length})
                        </button>
                        <button 
                            onClick={() => setFilter('read')}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap border ${filter === 'read' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                        >
                            已讀 ({readCount})
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-0 overflow-y-auto bg-[#f5f5f4] flex-1">
                    {filteredFeedbacks.length === 0 ? (
                        <div className="py-12 text-center flex flex-col items-center text-gray-400">
                            <MessageSquareQuote size={48} className="opacity-20 mb-3" />
                            <p>此分類下沒有留言</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredFeedbacks.map(fb => {
                                const emp = getEmployee(fb.employeeId);
                                const isEditing = editingId === fb.id;

                                return (
                                    <div key={fb.id} className={`p-5 transition-colors ${fb.isRead ? 'bg-white opacity-95' : 'bg-amber-50/80 border-l-4 border-l-amber-400'}`}>
                                        <div className="flex items-start gap-4">
                                            {/* Avatar & Importance */}
                                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                                                {emp ? (
                                                    <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full border border-gray-200" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                                {onUpdateFeedback && (
                                                    <button 
                                                        onClick={() => toggleImportance(fb.id, !!fb.isImportant)}
                                                        className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${fb.isImportant ? 'text-amber-500' : 'text-gray-300'}`}
                                                        title="標記為重要"
                                                    >
                                                        <Star size={18} className={fb.isImportant ? 'fill-amber-500' : ''} />
                                                    </button>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-1.5">
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                                                        <span className="font-bold text-[#44403c]">
                                                            {emp ? emp.name : '未知夥伴'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">
                                                            {format(parseISO(fb.date), 'yyyy/MM/dd HH:mm')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {fb.category && (
                                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getCategoryColor(fb.category)}`}>
                                                                {fb.category}
                                                            </span>
                                                        )}
                                                        {!fb.isRead && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full animate-pulse">NEW</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <p className="text-sm text-[#57534e] whitespace-pre-wrap leading-relaxed mb-3">
                                                    {fb.content}
                                                </p>

                                                {/* Admin Section */}
                                                {(onUpdateFeedback || fb.adminNote) && (
                                                    <div className={`mt-3 pt-3 border-t border-dashed border-gray-200 ${isEditing ? 'bg-gray-50 p-3 rounded-lg border-none' : ''}`}>
                                                        {isEditing ? (
                                                            <div className="space-y-3 animate-in fade-in duration-200">
                                                                <div className="flex items-center gap-2">
                                                                    <Tag size={14} className="text-gray-500" />
                                                                    <span className="text-xs font-bold text-gray-600">設定分類：</span>
                                                                    <div className="flex gap-1 flex-wrap">
                                                                        {categories.map(cat => (
                                                                            <button
                                                                                key={cat}
                                                                                onClick={() => setEditCategory(cat)}
                                                                                className={`text-xs px-2 py-1 rounded border transition-colors ${editCategory === cat ? getCategoryColor(cat) : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                                                            >
                                                                                {cat}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <Edit3 size={14} className="text-gray-500" />
                                                                        <span className="text-xs font-bold text-gray-600">管理者備註 (僅執行長可見)：</span>
                                                                    </div>
                                                                    <textarea
                                                                        value={editNote}
                                                                        onChange={(e) => setEditNote(e.target.value)}
                                                                        placeholder="撰寫處理進度或備註..."
                                                                        className="w-full text-xs p-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                                                        rows={2}
                                                                    />
                                                                </div>
                                                                <div className="flex justify-end gap-2">
                                                                    <button 
                                                                        onClick={() => setEditingId(null)}
                                                                        className="text-xs px-3 py-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                                                                    >
                                                                        取消
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => saveEditing(fb.id)}
                                                                        className="text-xs px-3 py-1.5 bg-[#064e3b] text-white rounded hover:bg-[#065f46] transition-colors flex items-center gap-1"
                                                                    >
                                                                        <Save size={12} /> 儲存設定
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex justify-between items-start gap-2">
                                                                <div className="flex-1">
                                                                    {fb.adminNote ? (
                                                                        <div className="flex gap-2">
                                                                             <div className="mt-0.5"><AlertCircle size={14} className="text-[#d97706]" /></div>
                                                                             <p className="text-xs text-gray-600 italic bg-amber-50 px-2 py-1 rounded inline-block">
                                                                                <span className="font-bold text-[#d97706] not-italic mr-1">管理者備註:</span> 
                                                                                {fb.adminNote}
                                                                             </p>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-xs text-gray-300 italic pl-1">無備註</span>
                                                                    )}
                                                                </div>
                                                                {onUpdateFeedback && (
                                                                    <button 
                                                                        onClick={() => startEditing(fb)}
                                                                        className="text-xs text-[#064e3b] hover:text-[#065f46] hover:bg-emerald-50 px-2 py-1 rounded transition-colors flex items-center gap-1 whitespace-nowrap"
                                                                    >
                                                                        <Edit3 size={12} /> 編輯/分類
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col gap-2 ml-1">
                                                {!fb.isRead ? (
                                                    <button 
                                                        onClick={() => onMarkAsRead(fb.id)}
                                                        className="text-[#064e3b] hover:bg-emerald-100 p-2 rounded-full transition-colors bg-white shadow-sm border border-gray-100"
                                                        title="標示為已讀"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        disabled
                                                        className="text-gray-300 p-2 cursor-default"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
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