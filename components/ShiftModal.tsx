
import React, { useState, useEffect, useRef } from 'react';
import { Shift, Employee, Task, TaskCategory, generateUUID } from '../types';
import { X, Plus, Trash2, CheckCircle2, Circle, Tent, Clock, Coffee, HelpingHand, BookOpen, Layers, Edit3, Save, BookHeart, User, Crown } from 'lucide-react';

interface ShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (shift: Shift | Shift[]) => void;
    onDelete: (id: string) => void;
    initialDate: string;
    employees: Employee[];
    existingShift?: Shift;
    taskCategories: TaskCategory[];
    onUpdateTaskCategories: (categories: TaskCategory[]) => void;
    shifts: Shift[];
    currentEmployeeId?: string | null;
    userRole: 'manager' | 'employee' | null;
    onUpdateEmployee?: (employee: Employee) => void;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
    isOpen, onClose, onSave, onDelete, initialDate, employees, existingShift, taskCategories, onUpdateTaskCategories, shifts, currentEmployeeId, userRole, onUpdateEmployee
}) => {
    const isManager = userRole === 'manager';
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [breakStartTime, setBreakStartTime] = useState('');
    const [breakEndTime, setBreakEndTime] = useState('');
    const [role, setRole] = useState('營地管家');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [shiftLog, setShiftLog] = useState('');
    const [newTaskText, setNewTaskText] = useState('');
    const [activeCompletionTaskId, setActiveCompletionTaskId] = useState<string | null>(null);
    const [showCategories, setShowCategories] = useState(false);
    const [showPersonalTemplates, setShowPersonalTemplates] = useState(false);
    const [isEditingTemplates, setIsEditingTemplates] = useState(false);
    const [newPersonalTemplate, setNewPersonalTemplate] = useState('');
    const selectionRef = useRef<HTMLDivElement>(null);

    // Determine target employee for personal templates
    const targetEmployeeForTemplates = React.useMemo(() => {
        if (!isManager && currentEmployeeId) {
            return employees.find(e => e.id === currentEmployeeId);
        }
        if (isManager && selectedEmployeeIds.length === 1) {
            return employees.find(e => e.id === selectedEmployeeIds[0]);
        }
        return null;
    }, [isManager, currentEmployeeId, selectedEmployeeIds, employees]);

    useEffect(() => {
        if (isOpen) {
            if (existingShift) {
                setSelectedEmployeeIds([existingShift.employeeId]);
                setDate(existingShift.date);
                setStartTime(existingShift.startTime);
                setEndTime(existingShift.endTime);
                setBreakStartTime(existingShift.breakStartTime || '');
                setBreakEndTime(existingShift.breakEndTime || '');
                setRole(existingShift.role);
                // Ensure legacy tasks default to 'manager' if undefined
                setTasks((existingShift.tasks || []).map(t => ({
                    ...t, 
                    tags: t.tags || [],
                    creatorRole: t.creatorRole || 'manager'
                })));
                setShiftLog(existingShift.shiftLog || '');
            } else {
                setSelectedEmployeeIds([employees[0]?.id || '']);
                setDate(initialDate);
                setStartTime('09:00');
                setEndTime('17:00');
                setBreakStartTime('12:00');
                setBreakEndTime('13:00');
                setRole('營地管家');
                setTasks([]);
                setShiftLog('');
            }
            setActiveCompletionTaskId(null);
            setShowCategories(false);
            setShowPersonalTemplates(false);
            setIsEditingTemplates(false);
        }
    }, [isOpen, existingShift, employees, initialDate]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectionRef.current && !selectionRef.current.contains(event.target as Node)) {
                setActiveCompletionTaskId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAddTask = (textInput?: string) => {
        const text = textInput || newTaskText;
        if (!text.trim()) return;
        
        // Assign creator role based on current user
        const creatorRole = isManager ? 'manager' : 'employee';

        const newTasks = [...tasks, { 
            id: generateUUID(), 
            description: text, 
            isCompleted: false, 
            tags: [], 
            assigneeIds: [],
            creatorRole: creatorRole
        }];
        setTasks(newTasks);
        if (!textInput) setNewTaskText('');
    };

    const handleTaskClick = (task: Task) => {
        if (task.isCompleted) {
            const updatedTasks = tasks.map(t => t.id === task.id ? { ...t, isCompleted: false, completedBy: undefined } : t);
            setTasks(updatedTasks);
            if (!isManager && existingShift) handleSaveInternal(updatedTasks);
        } else {
            setActiveCompletionTaskId(task.id);
        }
    };

    const confirmCompletion = (taskId: string, completerId: string) => {
        const updatedTasks = tasks.map(t => t.id === taskId ? { ...t, isCompleted: true, completedBy: completerId } : t);
        setTasks(updatedTasks);
        setActiveCompletionTaskId(null);
        if (!isManager && existingShift) handleSaveInternal(updatedTasks);
    };

    const handleSaveInternal = (overriddenTasks?: Task[]) => {
        if (selectedEmployeeIds.length === 0) return;
        const currentTasks = overriddenTasks || tasks;
        const newShifts: Shift[] = [];
        let breakMin = 0;
        if (breakStartTime && breakEndTime) {
            const [bsh, bsm] = breakStartTime.split(':').map(Number);
            const [beh, bem] = breakEndTime.split(':').map(Number);
            breakMin = (beh * 60 + bem) - (bsh * 60 + bsm);
        }
        selectedEmployeeIds.forEach(empId => {
            const emp = employees.find(e => e.id === empId);
            const isOrig = existingShift && existingShift.employeeId === empId;
            newShifts.push({
                id: isOrig ? existingShift.id : generateUUID(),
                employeeId: empId,
                date: date || initialDate,
                startTime,
                endTime,
                breakStartTime: breakStartTime || undefined,
                breakEndTime: breakEndTime || undefined,
                breakDuration: breakMin > 0 ? breakMin : undefined,
                role,
                tasks: currentTasks.map(t => ({...t, id: isOrig ? t.id : generateUUID()})),
                shiftLog,
                color: emp?.color || 'bg-stone-100'
            });
        });
        onSave(newShifts);
    };

    const handleManagerSave = () => { handleSaveInternal(); onClose(); };

    const addNewCategory = () => {
        const name = prompt("請輸入新分類名稱 (例如：夜勤、櫃台服務)");
        if (!name) return;
        onUpdateTaskCategories([...taskCategories, { id: generateUUID(), name, tasks: [] }]);
    };

    const addTaskToCategory = (catId: string) => {
        const text = prompt("請輸入此分類的標準任務內容");
        if (!text) return;
        const next = taskCategories.map(c => c.id === catId ? { ...c, tasks: [...c.tasks, text] } : c);
        onUpdateTaskCategories(next);
    };

    const removeTaskFromCategory = (catId: string, taskText: string) => {
        const next = taskCategories.map(c => c.id === catId ? { ...c, tasks: c.tasks.filter(t => t !== taskText) } : c);
        onUpdateTaskCategories(next);
    };

    const removeCategory = (catId: string) => {
        if (window.confirm("警告：確定要刪除整個任務分類？該分類下的所有常用任務將被移除。")) {
            onUpdateTaskCategories(taskCategories.filter(c => c.id !== catId));
        }
    };

    const handleAddPersonalTemplate = () => {
        if (!newPersonalTemplate.trim() || !targetEmployeeForTemplates || !onUpdateEmployee) return;
        const current = targetEmployeeForTemplates.customTemplates || [];
        onUpdateEmployee({
            ...targetEmployeeForTemplates,
            customTemplates: [...current, newPersonalTemplate.trim()]
        });
        setNewPersonalTemplate('');
    };

    const handleRemovePersonalTemplate = (text: string) => {
        if (!targetEmployeeForTemplates || !onUpdateEmployee) return;
        const current = targetEmployeeForTemplates.customTemplates || [];
        onUpdateEmployee({
            ...targetEmployeeForTemplates,
            customTemplates: current.filter(t => t !== text)
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#fcfaf8] w-full h-full sm:h-auto sm:max-h-[95vh] sm:rounded-2xl shadow-2xl sm:max-w-lg flex flex-col overflow-hidden">
                <div className="px-4 py-4 border-b flex justify-between items-center bg-gray-50 flex-shrink-0">
                    <h3 className="text-lg font-black flex items-center gap-2">
                        {isManager ? <Tent className="text-[#d97706]" size={20}/> : <Clock className="text-[#064e3b]" size={20}/>}
                        {isManager ? '執行長排班' : '我的任務明細'}
                    </h3>
                    <button onClick={onClose} className="p-1 bg-white border rounded-full"><X size={20}/></button>
                </div>

                <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 pb-24">
                    {isManager && !existingShift && (
                        <div>
                            <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">選擇夥伴</label>
                            <div className="grid grid-cols-2 gap-2">
                                {employees.map(emp => (
                                    <button key={emp.id} onClick={() => setSelectedEmployeeIds(p => p.includes(emp.id) ? p.filter(i=>i!==emp.id) : [...p, emp.id])} className={`flex items-center gap-2 p-2 rounded-xl border text-sm transition-all ${selectedEmployeeIds.includes(emp.id) ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-gray-200 text-gray-600'}`}>
                                        <img src={emp.avatar} className="w-6 h-6 rounded-full object-cover" />
                                        <span className="truncate font-bold">{emp.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <label className="block text-[10px] font-black text-gray-400 mb-1 uppercase tracking-widest">班次日期</label>
                            <input type="date" value={date} disabled={!isManager} onChange={e=>setDate(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm disabled:bg-gray-50 disabled:text-gray-500 font-bold" />
                        </div>
                        <div><label className="block text-[10px] font-black text-gray-400 mb-1">上班時間</label><input type="time" value={startTime} disabled={!isManager} onChange={e=>setStartTime(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm disabled:bg-gray-50 font-bold" /></div>
                        <div><label className="block text-[10px] font-black text-gray-400 mb-1">下班時間</label><input type="time" value={endTime} disabled={!isManager} onChange={e=>setEndTime(e.target.value)} className="w-full p-2.5 border rounded-xl text-sm disabled:bg-gray-50 font-bold" /></div>
                        <div><label className="block text-[10px] font-black text-amber-600 mb-1 flex items-center gap-1"><Coffee size={12}/> 休息開始</label><input type="time" value={breakStartTime} disabled={!isManager} onChange={e=>setBreakStartTime(e.target.value)} className="w-full p-2.5 border border-amber-100 bg-amber-50/20 rounded-xl text-sm disabled:opacity-60 font-bold" /></div>
                        <div><label className="block text-[10px] font-black text-amber-600 mb-1 flex items-center gap-1"><Coffee size={12}/> 休息結束</label><input type="time" value={breakEndTime} disabled={!isManager} onChange={e=>setBreakEndTime(e.target.value)} className="w-full p-2.5 border border-amber-100 bg-amber-50/20 rounded-xl text-sm disabled:opacity-60 font-bold" /></div>
                    </div>

                    <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-black text-gray-500 uppercase tracking-widest">任務項目</label>
                            <div className="flex gap-2">
                                {targetEmployeeForTemplates && (
                                    <button onClick={() => {setShowPersonalTemplates(!showPersonalTemplates); setShowCategories(false);}} className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border transition-all ${showPersonalTemplates ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                                        <BookHeart size={12}/> 我的常用
                                    </button>
                                )}
                                {isManager && (
                                    <button onClick={() => {setShowCategories(!showCategories); setShowPersonalTemplates(false);}} className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg border transition-all ${showCategories ? 'bg-amber-50 text-[#d97706] border-amber-200' : 'bg-white text-gray-500 border-gray-200'}`}>
                                        <Layers size={12}/> 常用範本
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Personal Templates Section */}
                        {showPersonalTemplates && targetEmployeeForTemplates && (
                             <div className="mb-4 p-4 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl shadow-sm animate-in slide-in-from-top-2">
                                <div className="text-xs font-black text-indigo-700 mb-2 flex items-center gap-2">
                                    <BookHeart size={14}/> {targetEmployeeForTemplates.name}的常用語句
                                </div>
                                <div className="flex gap-2 mb-3">
                                    <input 
                                        type="text" 
                                        value={newPersonalTemplate}
                                        onChange={e => setNewPersonalTemplate(e.target.value)}
                                        placeholder="輸入常用語句..."
                                        className="flex-1 p-2 border border-indigo-200 rounded-lg text-xs"
                                    />
                                    <button onClick={handleAddPersonalTemplate} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold">新增</button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(!targetEmployeeForTemplates.customTemplates || targetEmployeeForTemplates.customTemplates.length === 0) ? (
                                        <span className="text-[10px] text-gray-400 italic">尚無常用語句，請上方新增</span>
                                    ) : (
                                        targetEmployeeForTemplates.customTemplates.map((t, idx) => (
                                            <div key={idx} className="group relative">
                                                <button onClick={() => handleAddTask(t)} className="text-[10px] bg-white border border-indigo-200 text-indigo-800 px-2 py-1.5 rounded-lg font-bold hover:bg-indigo-100 hover:border-indigo-300 transition-colors shadow-sm">
                                                    + {t}
                                                </button>
                                                <button onClick={() => handleRemovePersonalTemplate(t)} className="absolute -top-1.5 -right-1.5 bg-red-400 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X size={8}/>
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                             </div>
                        )}

                        {showCategories && isManager && (
                            <div className="mb-4 p-4 bg-white border-2 border-amber-100 rounded-2xl shadow-lg animate-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-3 border-b pb-2">
                                    <span className="text-xs font-black text-amber-700">任務範本庫</span>
                                    <button onClick={() => setIsEditingTemplates(!isEditingTemplates)} className="text-[10px] font-black text-blue-600 flex items-center gap-1">
                                        {isEditingTemplates ? <><Save size={12}/> 完成編輯</> : <><Edit3 size={12}/> 編輯範本</>}
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {taskCategories.map(cat => (
                                        <div key={cat.id} className={`transition-all ${isEditingTemplates ? 'p-3 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50' : ''}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-[10px] font-black text-gray-400 uppercase">{cat.name}</div>
                                                    {isEditingTemplates && (
                                                        <button 
                                                            onClick={() => removeCategory(cat.id)} 
                                                            className="p-1 bg-red-100 text-red-500 rounded hover:bg-red-200 transition-colors"
                                                            title="刪除整個分類"
                                                        >
                                                            <Trash2 size={12}/>
                                                        </button>
                                                    )}
                                                </div>
                                                {isEditingTemplates && (
                                                    <button onClick={() => addTaskToCategory(cat.id)} className="text-[9px] text-blue-500 font-bold bg-blue-50 px-2 py-1 rounded border border-blue-100">+ 新增任務</button>
                                                )}
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {cat.tasks.map(t => (
                                                    <div key={t} className="group relative">
                                                        <button onClick={() => !isEditingTemplates && handleAddTask(t)} className={`text-[10px] p-1.5 rounded-lg font-bold border ${isEditingTemplates ? 'bg-white text-gray-400 cursor-default border-dashed' : 'bg-gray-50 hover:bg-amber-100 border-gray-200 text-gray-700'}`}>
                                                            + {t}
                                                        </button>
                                                        {isEditingTemplates && (
                                                            <button onClick={() => removeTaskFromCategory(cat.id, t)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
                                                                <X size={8}/>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {isEditingTemplates && (
                                        <button onClick={addNewCategory} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-black text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all">+ 新增分類</button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-2 mb-4">
                            {tasks.map(task => {
                                // Default to 'manager' if undefined (legacy tasks)
                                const taskCreator = task.creatorRole || 'manager';
                                // Lock if current user is Employee AND task was created by Manager
                                const isLocked = !isManager && taskCreator === 'manager';

                                return (
                                    <div key={task.id} className="relative">
                                        <div className={`flex items-start gap-4 p-4 bg-white border rounded-2xl shadow-sm transition-all ${task.isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-gray-100'}`}>
                                            <button onClick={() => handleTaskClick(task)} className={`mt-0.5 flex-shrink-0 transition-transform active:scale-90 ${task.isCompleted ? 'text-emerald-500' : 'text-gray-300'}`}>
                                                {task.isCompleted ? <CheckCircle2 size={28}/> : <Circle size={28}/>}
                                            </button>
                                            <div className="flex-1 min-w-0" onClick={() => !task.isCompleted && handleTaskClick(task)}>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {taskCreator === 'employee' ? (
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 flex items-center gap-1">
                                                            <User size={8}/> 自主新增
                                                        </span>
                                                    ) : isManager ? (
                                                         // Only show manager tag to manager for clarity, or nothing
                                                         null
                                                    ) : (
                                                         <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-bold border border-amber-100 flex items-center gap-1">
                                                            <Crown size={8}/> 交辦事項
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-base block leading-tight ${task.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 font-black'}`}>{task.description}</span>
                                                {task.isCompleted && task.completedBy && (
                                                    <div className="text-[10px] text-emerald-600 bg-white border border-emerald-100 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 mt-1 font-black">
                                                        <HelpingHand size={10}/> {employees.find(e=>e.id===task.completedBy)?.name} 已回報
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Only show delete button if NOT locked */}
                                            {!isLocked && (
                                                <button onClick={()=>setTasks(tasks.filter(t=>t.id!==task.id))} className="text-gray-300 hover:text-red-500 p-1">
                                                    <Trash2 size={18}/>
                                                </button>
                                            )}
                                        </div>
                                        {activeCompletionTaskId === task.id && (
                                            <div ref={selectionRef} className="absolute left-0 right-0 top-14 z-[100] bg-white border-2 border-emerald-500 rounded-2xl shadow-2xl p-4 animate-in zoom-in-95 duration-150">
                                                <p className="text-xs font-black text-emerald-800 mb-3 text-center">誰完成了此項任務？</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {employees.map(emp => (
                                                        <button key={emp.id} onClick={()=>confirmCompletion(task.id, emp.id)} className="flex items-center gap-2 p-3 hover:bg-emerald-50 rounded-xl text-sm border border-gray-100 font-bold active:bg-emerald-100">
                                                            <img src={emp.avatar} className="w-8 h-8 rounded-full object-cover" />
                                                            <span className="truncate">{emp.name}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                                <button onClick={() => setActiveCompletionTaskId(null)} className="w-full mt-3 py-2 text-xs text-gray-400 font-bold">取消</button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex gap-2">
                            <input type="text" value={newTaskText} onChange={e=>setNewTaskText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleAddTask()} placeholder="新增本班次特殊工作..." className="flex-1 p-3 border rounded-xl text-sm font-bold shadow-inner" />
                            <button onClick={()=>handleAddTask()} className="p-3 bg-[#064e3b] text-white rounded-xl shadow-lg active:translate-y-0.5 transition-all"><Plus size={20}/></button>
                        </div>
                        
                        {/* New Shift Log Section */}
                        <div className="mt-6 pt-4 border-t border-dashed border-gray-200 animate-in fade-in duration-500">
                             <label className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                <BookOpen size={16} className="text-[#d97706]"/> 班次日誌 & 交接事項
                            </label>
                            <textarea 
                                value={shiftLog} 
                                onChange={(e) => setShiftLog(e.target.value)} 
                                placeholder="請在此記錄今日的重要事件、客戶需求或需交接給下一班的事項..." 
                                className="w-full p-4 border rounded-xl text-sm font-bold bg-[#fffbeb] focus:bg-white focus:ring-2 focus:ring-[#d97706]/20 transition-all min-h-[100px] leading-relaxed"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2.5 text-sm font-black text-gray-500">關閉</button>
                    {isManager ? (
                        <>
                            {existingShift && <button onClick={()=>{if(window.confirm('確定刪除此排班？')){onDelete(existingShift.id); onClose();}}} className="px-4 py-2.5 text-sm font-black text-red-500">刪除班次</button>}
                            <button onClick={handleManagerSave} className="px-8 py-2.5 text-sm font-black text-white bg-[#d97706] rounded-xl shadow-lg hover:bg-[#b45309] active:scale-95 transition-all">儲存班表</button>
                        </>
                    ) : (
                         <button onClick={handleManagerSave} className="px-8 py-2.5 text-sm font-black text-white bg-[#064e3b] rounded-xl shadow-lg hover:bg-[#065f46] active:scale-95 transition-all">儲存更新</button>
                    )}
                </div>
            </div>
        </div>
    );
};
