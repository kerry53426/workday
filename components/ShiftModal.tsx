import React, { useState, useEffect, useRef } from 'react';
import { Shift, Employee, Task, TaskCategory, generateUUID } from '../types';
import { X, Plus, Trash2, CheckCircle2, Circle, Tent, Settings, GripVertical, StickyNote, FolderPlus, PenLine, Copy, AlertTriangle, Check, Coffee, CheckSquare, HelpingHand, User, Ban } from 'lucide-react';

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
    shifts: Shift[]; // Add shifts for conflict detection
    readOnly?: boolean; // New: Read-only mode
    currentEmployeeId?: string | null; // New: To identify who is interacting
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    initialDate,
    employees,
    existingShift,
    taskCategories,
    onUpdateTaskCategories,
    shifts,
    readOnly = false,
    currentEmployeeId
}) => {
    // Replaced single employeeId with array for multi-select
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    
    // New: Specific break times
    const [breakStartTime, setBreakStartTime] = useState('');
    const [breakEndTime, setBreakEndTime] = useState('');
    
    const [role, setRole] = useState('營地管家');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [shiftLog, setShiftLog] = useState('');
    const [newTaskText, setNewTaskText] = useState('');
    const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
    
    // Validation State
    const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
    const [blockingErrors, setBlockingErrors] = useState<string[]>([]); // New: Errors that prevent saving
    
    // Drag and Drop State
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    
    // Task Completion Selection State
    const [activeCompletionTaskId, setActiveCompletionTaskId] = useState<string | null>(null);
    const selectionRef = useRef<HTMLDivElement>(null);

    // Category Management State
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newTaskInput, setNewTaskInput] = useState<{ [key: string]: string }>({});

    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (existingShift) {
                setSelectedEmployeeIds([existingShift.employeeId]);
                setDate(existingShift.date);
                setStartTime(existingShift.startTime);
                setEndTime(existingShift.endTime);
                
                // Initialize break times
                // If existing shift has specific times, use them
                // If only breakDuration exists (legacy), we leave inputs empty or try to guess (but safer to leave empty)
                setBreakStartTime(existingShift.breakStartTime || '');
                setBreakEndTime(existingShift.breakEndTime || '');
                
                setRole(existingShift.role);
                // Ensure tags exist for older data, and safely map
                setTasks((existingShift.tasks || []).map(t => ({...t, tags: t.tags || []})));
                setShiftLog(existingShift.shiftLog || '');
            } else {
                // Default to first employee if new, but allow clearing
                setSelectedEmployeeIds([employees[0]?.id || '']);
                setDate(initialDate);
                setStartTime('09:00');
                setEndTime('17:00');
                setBreakStartTime('12:00'); // Default break suggestion
                setBreakEndTime('13:00');
                setRole('營地管家');
                setTasks([]);
                setShiftLog('');
            }
            setShowIncompleteOnly(false);
            setIsManagingTemplates(false);
            setActiveCategoryIndex(0);
            setDraggedTaskId(null);
            setConflictWarnings([]);
            setBlockingErrors([]);
            setActiveCompletionTaskId(null);
        }
    }, [isOpen, existingShift, employees, initialDate]);

    // Handle click outside for completion selector
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (selectionRef.current && !selectionRef.current.contains(event.target as Node)) {
                setActiveCompletionTaskId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Check for conflicts whenever critical fields change
    useEffect(() => {
        if (!isOpen || selectedEmployeeIds.length === 0 || !date || !startTime || !endTime || readOnly) return;

        const warnings: string[] = [];
        const errors: string[] = [];
        const currentStart = parseInt(startTime.replace(':', ''));
        const currentEnd = parseInt(endTime.replace(':', ''));

        selectedEmployeeIds.forEach(empId => {
            const emp = employees.find(e => e.id === empId);
            if (!emp) return;

            // 1. Strict Check: Does this employee already have a shift on this day?
            // Exclude the current shift if we are editing
            const existingShiftOnDate = shifts.find(s => {
                if (s.id === existingShift?.id && s.employeeId === empId) return false; // Editing self
                if (s.employeeId !== empId) return false;
                return s.date === date;
            });

            if (existingShiftOnDate) {
                errors.push(`禁止重複排班：${emp.name} 在 ${date} 已經有「${existingShiftOnDate.role}」的班次了。每人每日限排一班。`);
            } else {
                // 2. Overlap Check (Only relevant if we relax the one-shift-per-day rule, keeping logic just in case)
                // Since we block on date, this is theoretically unreachable for now, but good for robustness
                const overlappingShift = shifts.find(s => {
                    if (s.id === existingShift?.id && s.employeeId === empId) return false;
                    if (s.employeeId !== empId) return false;
                    
                    // Different date? No conflict
                    if (s.date !== date) return false;

                    const sStart = parseInt(s.startTime.replace(':', ''));
                    const sEnd = parseInt(s.endTime.replace(':', ''));

                    return (currentStart < sEnd && currentEnd > sStart);
                });

                if (overlappingShift) {
                     warnings.push(`注意：${emp.name} 的時段與現有排班重疊。`);
                }
            }
        });

        // Validate Break Times
        if (breakStartTime && breakEndTime) {
            const bStart = parseInt(breakStartTime.replace(':', ''));
            const bEnd = parseInt(breakEndTime.replace(':', ''));
            
            if (bEnd <= bStart) {
                errors.push("休息結束時間必須晚於開始時間");
            }
            if (bStart < currentStart || bEnd > currentEnd) {
                errors.push("休息時間必須在排班時段內");
            }
        } else if (breakStartTime && !breakEndTime) {
             errors.push("請設定休息結束時間");
        } else if (!breakStartTime && breakEndTime) {
             errors.push("請設定休息開始時間");
        }

        setConflictWarnings(warnings);
        setBlockingErrors(errors);
    }, [selectedEmployeeIds, date, startTime, endTime, breakStartTime, breakEndTime, isOpen, shifts, existingShift, employees, readOnly]);

    const toggleEmployeeSelection = (id: string) => {
        if (readOnly) return;
        if (selectedEmployeeIds.includes(id)) {
            setSelectedEmployeeIds(prev => prev.filter(eid => eid !== id));
        } else {
            setSelectedEmployeeIds(prev => [...prev, id]);
        }
    };

    const handleAddTask = (description?: string) => {
        if (readOnly) return;
        const text = description || newTaskText;
        if (!text.trim()) return;
        
        setTasks([...tasks, { 
            id: generateUUID(), 
            description: text, 
            isCompleted: false,
            tags: [],
            assigneeIds: []
        }]);

        if (!description) {
            setNewTaskText('');
        }
    };

    const removeTask = (taskId: string) => {
        if (readOnly) return;
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    // Modified to show selector when completing
    const handleTaskCompletionClick = (task: Task) => {
        if (readOnly) return;
        
        if (task.isCompleted) {
            // If unchecking, simply remove completed status and completedBy
            setTasks(tasks.map(t => 
                t.id === task.id ? { ...t, isCompleted: false, completedBy: undefined } : t
            ));
        } else {
            // If checking, show selection UI
            setActiveCompletionTaskId(task.id);
        }
    };

    const confirmTaskCompletion = (taskId: string, completerId: string) => {
        setTasks(tasks.map(t => 
            t.id === taskId ? { ...t, isCompleted: true, completedBy: completerId } : t
        ));
        setActiveCompletionTaskId(null);
    };

    // Toggle specific assignee for a task
    const toggleTaskAssignee = (taskId: string, empId: string) => {
        if (readOnly) return;
        setTasks(tasks.map(t => {
            if (t.id !== taskId) return t;
            
            const currentAssignees = t.assigneeIds || [];
            if (currentAssignees.includes(empId)) {
                return { ...t, assigneeIds: currentAssignees.filter(id => id !== empId) };
            } else {
                return { ...t, assigneeIds: [...currentAssignees, empId] };
            }
        }));
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        if (readOnly) return;
        setDraggedTaskId(id);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, targetId: string) => {
        e.preventDefault();
        if (readOnly || !draggedTaskId || draggedTaskId === targetId) return;

        const originalTasks = [...tasks];
        const draggedIndex = originalTasks.findIndex(t => t.id === draggedTaskId);
        const targetIndex = originalTasks.findIndex(t => t.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const [movedItem] = originalTasks.splice(draggedIndex, 1);
        originalTasks.splice(targetIndex, 0, movedItem);
        setTasks(originalTasks);
    };

    const handleDragEnd = () => {
        setDraggedTaskId(null);
    };

    // --- Template/Category Management Handlers ---
    const handleAddCategory = () => {
        if (readOnly) return;
        if (newCategoryName.trim()) {
            onUpdateTaskCategories([...taskCategories, {
                id: generateUUID(),
                name: newCategoryName.trim(),
                tasks: []
            }]);
            setNewCategoryName('');
        }
    };

    const handleDeleteCategory = (id: string) => {
        if (readOnly) return;
        if(window.confirm('確定要刪除此分類及其所有常用任務嗎？')) {
            const newCategories = taskCategories.filter(c => c.id !== id);
            onUpdateTaskCategories(newCategories);
            if (activeCategoryIndex >= newCategories.length) {
                setActiveCategoryIndex(Math.max(0, newCategories.length - 1));
            }
        }
    };

    const handleAddTemplateTask = (categoryId: string) => {
        if (readOnly) return;
        const taskText = newTaskInput[categoryId];
        if (taskText?.trim()) {
            const newCategories = taskCategories.map(cat => {
                if (cat.id === categoryId) {
                    return { ...cat, tasks: [...cat.tasks, taskText.trim()] };
                }
                return cat;
            });
            onUpdateTaskCategories(newCategories);
            setNewTaskInput({ ...newTaskInput, [categoryId]: '' });
        }
    };

    const handleDeleteTemplateTask = (categoryId: string, taskIndex: number) => {
        if (readOnly) return;
        const newCategories = taskCategories.map(cat => {
            if (cat.id === categoryId) {
                return { ...cat, tasks: cat.tasks.filter((_, i) => i !== taskIndex) };
            }
            return cat;
        });
        onUpdateTaskCategories(newCategories);
    };

    // --- Save Logic ---
    const handleSave = () => {
        if (readOnly) return;
        if (blockingErrors.length > 0) {
            alert("請先解決排班衝突（紅色警告）後再儲存。");
            return;
        }
        if (selectedEmployeeIds.length === 0) {
            alert("請至少選擇一位夥伴！");
            return;
        }

        const newShifts: Shift[] = [];
        
        // Calculate break duration in minutes for legacy support
        let calculatedBreakDuration = 0;
        if (breakStartTime && breakEndTime) {
             const [bsh, bsm] = breakStartTime.split(':').map(Number);
             const [beh, bem] = breakEndTime.split(':').map(Number);
             calculatedBreakDuration = (beh * 60 + bem) - (bsh * 60 + bsm);
        }

        selectedEmployeeIds.forEach(empId => {
            const selectedEmployee = employees.find(e => e.id === empId);
            
            // If editing an existing shift and this iteration matches the original employee, 
            // keep the ID. Otherwise (new employee added to existing shift), create new ID.
            const isOriginalEmployee = existingShift && existingShift.employeeId === empId;
            const shiftId = isOriginalEmployee ? existingShift.id : generateUUID();
            
            // Filter tasks: include if assigneeIds is empty OR includes this employee
            const personalTasks = tasks.filter(t => {
                if (!t.assigneeIds || t.assigneeIds.length === 0) return true; // Unassigned = everyone
                return t.assigneeIds.includes(empId);
            }).map(t => ({
                ...t,
                id: isOriginalEmployee ? t.id : generateUUID() // Deep copy logic for ID
            }));

            const shiftData: Shift = {
                id: shiftId,
                employeeId: empId,
                date: date || initialDate,
                startTime,
                endTime,
                breakStartTime: breakStartTime || undefined,
                breakEndTime: breakEndTime || undefined,
                breakDuration: calculatedBreakDuration,
                role,
                tasks: personalTasks,
                shiftLog,
                color: selectedEmployee?.color || 'bg-stone-100'
            };
            newShifts.push(shiftData);
        });

        onSave(newShifts);
        onClose();
    };

    // --- Duplicate Logic ---
    const handleDuplicate = () => {
        if (readOnly) return;
        if (blockingErrors.length > 0) {
             alert("複製前請先確認無排班衝突。");
             return;
        }
        if (selectedEmployeeIds.length === 0) return;
        
        const newShifts: Shift[] = [];
        
        // Calculate break duration in minutes for legacy support
        let calculatedBreakDuration = 0;
        if (breakStartTime && breakEndTime) {
             const [bsh, bsm] = breakStartTime.split(':').map(Number);
             const [beh, bem] = breakEndTime.split(':').map(Number);
             calculatedBreakDuration = (beh * 60 + bem) - (bsh * 60 + bsm);
        }

        selectedEmployeeIds.forEach(empId => {
             const selectedEmployee = employees.find(e => e.id === empId);
             
             // Filter tasks for this specific employee duplicate
             const personalTasks = tasks.filter(t => {
                if (!t.assigneeIds || t.assigneeIds.length === 0) return true;
                return t.assigneeIds.includes(empId);
            }).map(t => ({
                ...t, 
                id: generateUUID(), 
                isCompleted: false
            }));

             // Create entirely new shifts
             const shiftData: Shift = {
                id: generateUUID(),
                employeeId: empId,
                date: date || initialDate,
                startTime,
                endTime,
                breakStartTime: breakStartTime || undefined,
                breakEndTime: breakEndTime || undefined,
                breakDuration: calculatedBreakDuration,
                role,
                tasks: personalTasks,
                shiftLog,
                color: selectedEmployee?.color || 'bg-stone-100'
            };
            newShifts.push(shiftData);
        });

        onSave(newShifts);
        alert('排班已複製並新增成功！');
    };

    // Helper to get candidate employees for completion selection
    const getCompletionCandidates = (task: Task) => {
        // Start with explicitly assigned employees
        let candidateIds = task.assigneeIds && task.assigneeIds.length > 0 
            ? [...task.assigneeIds] 
            : [...selectedEmployeeIds]; // If none assigned, all shift owners

        // Add current user if not present (allows helping others)
        if (currentEmployeeId && !candidateIds.includes(currentEmployeeId)) {
            candidateIds.push(currentEmployeeId);
        }

        // Return unique employee objects
        return Array.from(new Set(candidateIds))
            .map(id => employees.find(e => e.id === id))
            .filter((e): e is Employee => !!e);
    };

    // Filter tasks logic
    const filteredTasks = tasks.filter(t => {
        const matchesCompletion = !showIncompleteOnly || !t.isCompleted;
        return matchesCompletion;
    });

    const getEmployeeName = (id: string) => employees.find(e => e.id === id)?.name || '夥伴';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-[#064e3b] bg-opacity-70 backdrop-blur-sm">
            {/* Note: Added h-[100dvh] for mobile full screen preference */}
            <div className={`bg-[#fcfaf8] w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl sm:max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 sm:border-4 border-[#e7e5e4] ${readOnly ? 'border-gray-300' : 'border-[#e7e5e4]'}`}>
                {/* Header - Fixed */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#e7e5e4] flex justify-between items-center bg-[#f5f5f4] flex-shrink-0 safe-area-top">
                    <h3 className="text-lg font-bold text-[#44403c] flex items-center gap-2">
                        <div className={`p-1 ${readOnly ? 'bg-gray-500' : 'bg-[#d97706]'} text-white rounded-md`}>
                            <Tent size={18} />
                        </div>
                        {readOnly ? '排班詳情' : (existingShift ? '編輯排班' : '新增排班')}
                    </h3>
                    <div className="flex gap-2">
                        {!readOnly && existingShift && (
                             <button 
                                onClick={handleDuplicate}
                                className="text-xs flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 text-gray-600 transition-colors h-8"
                                title="複製目前設定為新排班"
                             >
                                <Copy size={14} /> <span className="hidden sm:inline">複製</span>
                             </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 bg-white rounded-full border border-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
                    {/* Blocking Errors (Strict Validation) */}
                    {!readOnly && blockingErrors.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded text-red-800 text-sm flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 shadow-sm">
                            <div className="font-bold flex items-center gap-1">
                                <Ban size={16} /> 無法儲存：
                            </div>
                            {blockingErrors.map((err, idx) => (
                                <div key={idx} className="flex items-start gap-2 pl-1">
                                    <span>• {err}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Conflict Warnings (Advisory) */}
                    {!readOnly && conflictWarnings.length > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded text-amber-800 text-sm flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
                            {conflictWarnings.map((warning, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                                    <span>{warning}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Employee Selection (Multi-select) */}
                    <div>
                        <label className="block text-sm font-bold text-[#57534e] mb-2 flex justify-between items-center">
                            <span>選擇夥伴 (可多選)</span>
                            <span className="text-xs font-normal text-gray-400">已選 {selectedEmployeeIds.length} 人</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {employees.map(emp => {
                                const isSelected = selectedEmployeeIds.includes(emp.id);
                                return (
                                    <button
                                        key={emp.id}
                                        onClick={() => toggleEmployeeSelection(emp.id)}
                                        disabled={readOnly}
                                        className={`flex items-center gap-2 p-2 sm:p-2 rounded-lg border transition-all ${
                                            isSelected 
                                            ? 'bg-[#064e3b] border-[#064e3b] text-white shadow-md' 
                                            : readOnly 
                                                ? 'bg-gray-50 border-gray-200 text-gray-400 opacity-50' 
                                                : 'bg-white border-[#d6d3d1] text-[#57534e] hover:border-[#a8a29e]'
                                        } min-h-[50px]`} 
                                    >
                                        <div className={`w-8 h-8 rounded-full border-2 overflow-hidden flex-shrink-0 ${isSelected ? 'border-white' : 'border-transparent'}`}>
                                            <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="font-bold text-sm">{emp.name}</span>
                                        {isSelected && <Check size={16} className="ml-auto" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div>
                         <label className="block text-sm font-bold text-[#57534e] mb-1.5">日期</label>
                            <input
                                type="date"
                                value={date}
                                disabled={readOnly}
                                onChange={(e) => setDate(e.target.value)}
                                className={`w-full px-3 py-3 sm:py-2.5 text-base sm:text-sm bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                            />
                    </div>

                    {/* Time & Role */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-[#57534e] mb-1.5">開始時間</label>
                            <input
                                type="time"
                                value={startTime}
                                disabled={readOnly}
                                onChange={(e) => setStartTime(e.target.value)}
                                className={`w-full px-3 py-3 sm:py-2.5 text-base sm:text-sm bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#57534e] mb-1.5">結束時間</label>
                            <input
                                type="time"
                                value={endTime}
                                disabled={readOnly}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={`w-full px-3 py-3 sm:py-2.5 text-base sm:text-sm bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <label className="block text-sm font-bold text-[#57534e] mb-2 flex items-center gap-1">
                            <Coffee size={14} className="text-amber-600"/>
                            休息時間 (空班)
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">休息開始</label>
                                <input
                                    type="time"
                                    value={breakStartTime}
                                    disabled={readOnly}
                                    onChange={(e) => setBreakStartTime(e.target.value)}
                                    className={`w-full px-2 py-2 text-sm bg-white border border-[#d6d3d1] rounded focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100' : ''}`}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 mb-1 block">休息結束</label>
                                <input
                                    type="time"
                                    value={breakEndTime}
                                    disabled={readOnly}
                                    onChange={(e) => setBreakEndTime(e.target.value)}
                                    className={`w-full px-2 py-2 text-sm bg-white border border-[#d6d3d1] rounded focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100' : ''}`}
                                />
                            </div>
                        </div>
                        <div className="text-[10px] text-gray-400 mt-1 text-right">
                             * 休息時間不計入薪資工時
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#57534e] mb-1.5">任務角色</label>
                        <input
                            type="text"
                            value={role}
                            disabled={readOnly}
                            onChange={(e) => setRole(e.target.value)}
                            placeholder="例如：營地管家"
                            className={`w-full px-3 py-3 sm:py-2.5 text-base sm:text-sm bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                        />
                    </div>

                    {/* Tasks Section */}
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <label className="block text-sm font-bold text-[#57534e]">工作項目</label>
                            </div>
                        </div>

                        {/* Task Categories & Templates Section (Hide in ReadOnly) */}
                        {!readOnly && (
                        <div className="bg-white border border-[#d6d3d1] rounded-lg p-3 mb-3 shadow-inner">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[70%]">
                                    {isManagingTemplates ? (
                                        <span className="text-xs font-bold text-[#d97706] flex items-center gap-1">
                                            <PenLine size={12} /> 編輯模式
                                        </span>
                                    ) : (
                                        taskCategories.map((cat, idx) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setActiveCategoryIndex(idx)}
                                                className={`text-xs px-2 py-1.5 rounded-t-lg whitespace-nowrap transition-colors ${activeCategoryIndex === idx ? 'bg-[#fffbeb] text-[#d97706] border-b-2 border-[#d97706] font-bold' : 'text-stone-500 hover:text-stone-700'}`}
                                            >
                                                {cat.name}
                                            </button>
                                        ))
                                    )}
                                </div>
                                <button 
                                    onClick={() => setIsManagingTemplates(!isManagingTemplates)}
                                    className={`text-xs px-2 py-1 rounded transition-colors flex items-center gap-1 ${isManagingTemplates ? 'bg-[#064e3b] text-white' : 'text-stone-400 hover:text-[#d97706] hover:bg-stone-50'}`}
                                >
                                    {isManagingTemplates ? '完成' : <Settings size={14} />}
                                </button>
                            </div>

                            {isManagingTemplates ? (
                                <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                                    {taskCategories.map((cat) => (
                                        <div key={cat.id} className="bg-gray-50 p-2 rounded border border-gray-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-xs text-stone-700">{cat.name}</span>
                                                <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={12} /></button>
                                            </div>
                                            <div className="space-y-1 pl-1 border-l-2 border-gray-200 mb-2">
                                                {cat.tasks.map((t, tIdx) => (
                                                    <div key={tIdx} className="flex justify-between items-center group">
                                                        <span className="text-xs text-stone-600 truncate">{t}</span>
                                                        <button onClick={() => handleDeleteTemplateTask(cat.id, tIdx)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><X size={12} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-1">
                                                <input 
                                                    type="text" 
                                                    placeholder={`新增任務...`}
                                                    value={newTaskInput[cat.id] || ''}
                                                    onChange={(e) => setNewTaskInput({...newTaskInput, [cat.id]: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTemplateTask(cat.id)}
                                                    className="flex-1 text-xs px-1.5 py-1 border rounded text-base sm:text-xs"
                                                />
                                                <button onClick={() => handleAddTemplateTask(cat.id)} className="bg-[#e7e5e4] px-1.5 rounded text-stone-600"><Plus size={12} /></button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                                        <input 
                                            type="text" 
                                            placeholder="新增分類名稱..."
                                            value={newCategoryName}
                                            onChange={(e) => setNewCategoryName(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                            className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded text-base sm:text-xs"
                                        />
                                        <button onClick={handleAddCategory} className="flex items-center gap-1 bg-[#d97706] text-white px-2 py-1 rounded text-xs hover:bg-[#b45309]">
                                            <FolderPlus size={12} /> 新增
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex flex-wrap gap-2 min-h-[50px] content-start">
                                        {taskCategories[activeCategoryIndex]?.tasks.length === 0 && (
                                            <span className="text-xs text-gray-400 italic py-2">此分類暫無常用任務</span>
                                        )}
                                        {taskCategories[activeCategoryIndex]?.tasks.map((t, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => handleAddTask(t)}
                                                className="text-[11px] sm:text-xs bg-[#fffbeb] text-[#92400e] border border-[#fcd34d] px-2 py-1.5 rounded-full hover:bg-[#fef3c7] transition-colors"
                                            >
                                                + {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        )}

                        {/* Completion Status Filter */}
                        <div className="flex justify-between items-center px-0.5 mb-2">
                            <span className="text-xs text-[#a8a29e] font-medium">
                                {filteredTasks.filter(t => t.isCompleted).length}/{filteredTasks.length} 符合 (總計 {tasks.length})
                            </span>
                            <label className="flex items-center gap-1.5 text-xs font-medium text-[#57534e] hover:text-[#064e3b] cursor-pointer transition-colors select-none">
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${showIncompleteOnly ? 'bg-[#064e3b] border-[#064e3b]' : 'bg-white border-[#d6d3d1]'}`}>
                                    {showIncompleteOnly && <CheckSquare size={10} className="text-white" />}
                                </div>
                                <input 
                                    type="checkbox" 
                                    checked={showIncompleteOnly}
                                    onChange={(e) => setShowIncompleteOnly(e.target.checked)}
                                    className="hidden"
                                />
                                只顯示未完成
                            </label>
                        </div>
                        
                        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto bg-[#f5f5f4] p-2 rounded-lg border border-inner border-[#e7e5e4]">
                            {filteredTasks.length === 0 && (
                                <p className="text-sm text-[#a8a29e] italic text-center py-4">
                                    {tasks.length > 0 ? "沒有符合條件的任務" : "尚未指派任何任務"}
                                </p>
                            )}
                            {filteredTasks.map(task => (
                                <div 
                                    key={task.id} 
                                    draggable={!readOnly && !showIncompleteOnly}
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragOver={(e) => handleDragOver(e, task.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-start gap-3 sm:gap-2 bg-white p-3 sm:p-2.5 rounded-md shadow-sm group hover:ring-1 hover:ring-[#d6d3d1] transition-all relative ${draggedTaskId === task.id ? 'opacity-40 border-2 border-dashed border-[#064e3b]' : ''}`}
                                >
                                    {!readOnly && !showIncompleteOnly && (
                                        <div className="mt-0.5 cursor-move text-[#d6d3d1] hover:text-[#a8a29e] flex-shrink-0 hidden sm:block" title="拖曳排序">
                                            <GripVertical size={16} />
                                        </div>
                                    )}
                                    <div className="relative">
                                        <button
                                            onClick={() => handleTaskCompletionClick(task)}
                                            disabled={readOnly}
                                            className={`mt-0.5 transition-colors ${task.isCompleted ? 'text-emerald-600' : 'text-[#d6d3d1] hover:text-[#a8a29e]'} flex-shrink-0 ${readOnly ? 'cursor-default' : ''} p-1`}
                                        >
                                            {task.isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                                        </button>
                                        
                                        {/* Completer Selector Popover */}
                                        {activeCompletionTaskId === task.id && (
                                            <div 
                                                ref={selectionRef}
                                                className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-xl border border-gray-100 p-3 min-w-[200px] animate-in fade-in zoom-in-95"
                                            >
                                                <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1">
                                                    <HelpingHand size={12} /> 是誰完成的？
                                                </h4>
                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                    {getCompletionCandidates(task).map(emp => (
                                                        <button
                                                            key={emp.id}
                                                            onClick={() => confirmTaskCompletion(task.id, emp.id)}
                                                            className="flex items-center gap-2 w-full p-2 hover:bg-emerald-50 rounded-lg transition-colors text-left"
                                                        >
                                                            <img src={emp.avatar} alt={emp.name} className="w-6 h-6 rounded-full" />
                                                            <span className="text-sm font-medium text-gray-700">{emp.name}</span>
                                                            {currentEmployeeId === emp.id && (
                                                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 rounded ml-auto">我</span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <span className={`text-sm block break-words ${task.isCompleted ? 'text-[#a8a29e] line-through' : 'text-[#44403c]'}`}>
                                                {task.description}
                                            </span>
                                            
                                            {/* Assignee Selection (Only visible if employees are selected) */}
                                            {selectedEmployeeIds.length > 0 && (
                                                <div className="flex -space-x-1.5 flex-shrink-0">
                                                    {selectedEmployeeIds.map(empId => {
                                                        const emp = employees.find(e => e.id === empId);
                                                        if (!emp) return null;
                                                        // Check if this employee is assigned (or if no one is assigned, implies all)
                                                        const isAssigned = !task.assigneeIds || task.assigneeIds.length === 0 || task.assigneeIds.includes(empId);
                                                        
                                                        return (
                                                            <button
                                                                key={emp.id}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleTaskAssignee(task.id, emp.id);
                                                                }}
                                                                disabled={readOnly}
                                                                title={`${isAssigned ? '已指派給' : '未指派給'} ${emp.name}`}
                                                                className={`w-5 h-5 rounded-full border border-white transition-all overflow-hidden ${isAssigned ? 'opacity-100 ring-1 ring-emerald-500' : 'opacity-30 grayscale hover:opacity-100'} ${readOnly ? 'cursor-default' : ''}`}
                                                            >
                                                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        {/* Display Completed By Info (New) */}
                                        {task.isCompleted && task.completedBy && (
                                            <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 bg-gray-50 inline-block px-1.5 py-0.5 rounded">
                                                <HelpingHand size={10} />
                                                <span>由 {getEmployeeName(task.completedBy)} 完成</span>
                                            </div>
                                        )}
                                    </div>
                                    {!readOnly && (
                                    <button 
                                        onClick={() => removeTask(task.id)}
                                        className="text-[#d6d3d1] hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 p-1"
                                    >
                                        <X size={16} />
                                    </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!readOnly && (
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                placeholder="輸入任務..."
                                className="flex-1 px-3 py-3 sm:py-2.5 text-base sm:text-sm border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b]"
                            />
                            <button
                                type="button"
                                onClick={() => handleAddTask()}
                                className="p-2.5 bg-[#064e3b] text-white rounded-lg hover:bg-[#065f46] shadow-sm transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                        )}
                    </div>

                    {/* Shift Log Section */}
                    <div>
                        <label className="block text-sm font-bold text-[#57534e] mb-1.5 flex items-center gap-1.5">
                            <StickyNote size={16} className="text-[#d97706]" />
                            班次日誌
                        </label>
                        <textarea
                            value={shiftLog}
                            onChange={(e) => setShiftLog(e.target.value)}
                            disabled={readOnly}
                            placeholder="記錄當日特殊事項、交接重點..."
                            className={`w-full px-3 py-3 sm:py-2.5 text-base sm:text-sm bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] min-h-[80px] leading-relaxed resize-y ${readOnly ? 'bg-gray-100 text-gray-600' : ''}`}
                        />
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#f5f5f4] border-t border-[#e7e5e4] flex justify-between flex-shrink-0 safe-area-bottom">
                    {!readOnly && existingShift ? (
                         <button
                         onClick={() => {
                             onDelete(existingShift.id);
                             onClose();
                         }}
                         className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm px-3 py-2 sm:px-4 rounded-lg hover:bg-red-50 transition-colors"
                     >
                         <Trash2 size={18} /> <span className="hidden sm:inline">刪除</span>
                     </button>
                    ) : <div></div>}
                   
                    <div className="flex gap-3 w-full sm:w-auto justify-end">
                        <button
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 text-sm font-medium text-[#57534e] bg-white border border-[#d6d3d1] rounded-lg hover:bg-[#e7e5e4] transition-colors"
                        >
                            {readOnly ? '關閉' : '取消'}
                        </button>
                        {!readOnly && (
                        <button
                            onClick={handleSave}
                            disabled={blockingErrors.length > 0}
                            className={`flex-1 sm:flex-none px-6 py-2.5 sm:py-2 text-sm font-medium text-white rounded-lg shadow-md transition-colors ${blockingErrors.length > 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#d97706] hover:bg-[#b45309]'}`}
                        >
                            {existingShift ? '儲存' : '確認'}
                        </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};