import React, { useState, useEffect, useRef } from 'react';
import { Shift, Employee, Task, DEFAULT_TASK_TAGS, TaskCategory, generateUUID } from '../types';
import { generateTasksForRole } from '../services/geminiService';
import { X, Sparkles, Plus, Trash2, Loader2, CheckCircle2, Circle, Tent, Zap, Settings, GripVertical, Tag, Filter, StickyNote, FolderPlus, PenLine, Copy, AlertTriangle, Check, Coffee } from 'lucide-react';

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
    readOnly = false
}) => {
    // Replaced single employeeId with array for multi-select
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [breakDuration, setBreakDuration] = useState(60); // Default 60 mins break
    const [role, setRole] = useState('營地管家');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [shiftLog, setShiftLog] = useState('');
    const [newTaskText, setNewTaskText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showIncompleteOnly, setShowIncompleteOnly] = useState(false);
    const [conflictWarnings, setConflictWarnings] = useState<string[]>([]);
    
    // Drag and Drop State
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
    
    // Category Management State
    const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
    const [isManagingTemplates, setIsManagingTemplates] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newTaskInput, setNewTaskInput] = useState<{ [key: string]: string }>({});

    // Tag Management State
    const [availableTags, setAvailableTags] = useState<string[]>(DEFAULT_TASK_TAGS);
    const [currentInputTags, setCurrentInputTags] = useState<string[]>([]);
    const [isTagPickerOpen, setIsTagPickerOpen] = useState(false);
    const [newCustomTag, setNewCustomTag] = useState('');
    const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
    const tagPickerRef = useRef<HTMLDivElement>(null);

    // Initialize state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (existingShift) {
                setSelectedEmployeeIds([existingShift.employeeId]);
                setDate(existingShift.date);
                setStartTime(existingShift.startTime);
                setEndTime(existingShift.endTime);
                setBreakDuration(existingShift.breakDuration ?? 60);
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
                setBreakDuration(60);
                setRole('營地管家');
                setTasks([]);
                setShiftLog('');
            }
            setShowIncompleteOnly(false);
            setIsManagingTemplates(false);
            setActiveCategoryIndex(0);
            setDraggedTaskId(null);
            setCurrentInputTags([]);
            setActiveTagFilters([]);
            setIsTagPickerOpen(false);
            setConflictWarnings([]);
            
            const existingTags = existingShift?.tasks?.flatMap(t => t.tags || []) || [];
            const uniqueTags = Array.from(new Set([...DEFAULT_TASK_TAGS, ...existingTags]));
            setAvailableTags(uniqueTags);
        }
    }, [isOpen, existingShift, employees, initialDate]);

    // Check for conflicts whenever critical fields change
    useEffect(() => {
        if (!isOpen || selectedEmployeeIds.length === 0 || !date || !startTime || !endTime || readOnly) return;

        const warnings: string[] = [];
        const currentStart = parseInt(startTime.replace(':', ''));
        const currentEnd = parseInt(endTime.replace(':', ''));

        selectedEmployeeIds.forEach(empId => {
            const emp = employees.find(e => e.id === empId);
            if (!emp) return;

            const conflictingShift = shifts.find(s => {
                if (s.id === existingShift?.id && s.employeeId === empId) return false; // Don't check against self if editing
                if (s.employeeId !== empId) return false;
                if (s.date !== date) return false;

                const sStart = parseInt(s.startTime.replace(':', ''));
                const sEnd = parseInt(s.endTime.replace(':', ''));

                // Check overlap
                return (currentStart < sEnd && currentEnd > sStart);
            });

            if (conflictingShift) {
                warnings.push(`注意：${emp.name} 在 ${conflictingShift.startTime}-${conflictingShift.endTime} 已有「${conflictingShift.role}」排班。`);
            }
        });

        setConflictWarnings(warnings);
    }, [selectedEmployeeIds, date, startTime, endTime, isOpen, shifts, existingShift, employees, readOnly]);

    // Close tag picker when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (tagPickerRef.current && !tagPickerRef.current.contains(event.target as Node)) {
                setIsTagPickerOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const toggleEmployeeSelection = (id: string) => {
        if (readOnly) return;
        if (selectedEmployeeIds.includes(id)) {
            setSelectedEmployeeIds(prev => prev.filter(eid => eid !== id));
        } else {
            setSelectedEmployeeIds(prev => [...prev, id]);
        }
    };

    const handleGenerateTasks = async () => {
        if (readOnly) return;
        setIsGenerating(true);
        try {
            const suggestedTasks = await generateTasksForRole(role, startTime, endTime);
            const newTasks: Task[] = suggestedTasks.map(desc => ({
                id: generateUUID(),
                description: desc,
                isCompleted: false,
                tags: [],
                assigneeIds: [] // Default to empty (all)
            }));
            setTasks([...tasks, ...newTasks]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAutoAssign = () => {
        if (readOnly) return;
        let suggestedTasks: string[] = [];
        let autoTag: string | null = null;
        const currentRole = role.trim();
        const startHour = parseInt(startTime.split(':')[0]);

        if (currentRole.includes('管家')) {
            suggestedTasks = ["巡視帳篷設施狀況", "協助生火與戶外求生教學", "夜間營區安全巡邏", "即時解決住客需求", "檢查公共衛浴整潔"];
            autoTag = "營務";
        } else if (currentRole.includes('櫃台') || currentRole.includes('接待')) {
            suggestedTasks = ["辦理住客入住手續 (Check-in)", "營區環境與設施介紹", "代訂餐點與活動預約", "接聽客服電話", "結帳與發票開立"];
            autoTag = "櫃台";
        } else if (currentRole.includes('清潔') || currentRole.includes('房務')) {
            suggestedTasks = ["更換帳篷床單被套", "浴室廁所清潔消毒", "補齊衛浴備品", "清理垃圾與回收分類", "公共區域地面清掃"];
            autoTag = "房務";
        } else if (currentRole.includes('活動') || currentRole.includes('領隊')) {
            suggestedTasks = ["集合遊客進行解說", "活動器材準備與檢查", "戶外安全維護", "帶動現場氣氛", "活動後場地復原"];
            autoTag = "活動";
        } else if (currentRole.includes('餐飲') || currentRole.includes('廚房')) {
            suggestedTasks = ["食材清洗與備料", "餐點製作與擺盤", "出餐與桌邊服務", "廚房器具清潔歸位", "庫存盤點"];
            autoTag = "餐飲";
        }

        if (suggestedTasks.length === 0) {
            if (startHour < 11) {
                suggestedTasks = ["早餐食材補貨與準備", "協助住客退房檢查 (Check-out)", "整理公共交誼廳", "早班交接事項確認"];
            } else if (startHour < 15) {
                suggestedTasks = ["帳篷內部深度清潔", "戶外桌椅擦拭", "準備迎賓下午茶點心", "園區景觀維護"];
            } else if (startHour < 19) {
                suggestedTasks = ["接待下午入住貴賓", "營火堆搭建準備", "晚餐時段巡視", "確認夜間照明設備"];
            } else {
                suggestedTasks = ["營火晚會協助", "星空導覽指引", "深夜靜音管制勸導", "夜間門禁安全確認"];
            }
        }

        const newTasks: Task[] = suggestedTasks.map(desc => ({
            id: generateUUID(),
            description: desc,
            isCompleted: false,
            tags: autoTag ? [autoTag] : [],
            assigneeIds: []
        }));

        setTasks(prev => [...prev, ...newTasks]);
    };

    const handleAddTask = (description?: string) => {
        if (readOnly) return;
        const text = description || newTaskText;
        if (!text.trim()) return;
        
        const tags = description ? [] : currentInputTags; 

        setTasks([...tasks, { 
            id: generateUUID(), 
            description: text, 
            isCompleted: false,
            tags: tags,
            assigneeIds: []
        }]);

        if (!description) {
            setNewTaskText('');
            setCurrentInputTags([]); 
        }
    };

    const removeTask = (taskId: string) => {
        if (readOnly) return;
        setTasks(tasks.filter(t => t.id !== taskId));
    };

    const toggleTaskCompletion = (taskId: string) => {
        if (readOnly) return;
        setTasks(tasks.map(t => 
            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
        ));
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

    // --- Tag Handlers ---
    const toggleInputTag = (tag: string) => {
        if (readOnly) return;
        if (currentInputTags.includes(tag)) {
            setCurrentInputTags(currentInputTags.filter(t => t !== tag));
        } else {
            setCurrentInputTags([...currentInputTags, tag]);
        }
    };

    const handleAddCustomTag = () => {
        if (readOnly) return;
        if (newCustomTag.trim() && !availableTags.includes(newCustomTag.trim())) {
            const newTag = newCustomTag.trim();
            setAvailableTags([...availableTags, newTag]);
            setCurrentInputTags([...currentInputTags, newTag]);
            setNewCustomTag('');
        }
    };

    const toggleFilterTag = (tag: string) => {
        if (activeTagFilters.includes(tag)) {
            setActiveTagFilters(activeTagFilters.filter(t => t !== tag));
        } else {
            setActiveTagFilters([...activeTagFilters, tag]);
        }
    };

    // --- Save Logic ---
    const handleSave = () => {
        if (readOnly) return;
        if (selectedEmployeeIds.length === 0) {
            alert("請至少選擇一位夥伴！");
            return;
        }

        const newShifts: Shift[] = [];

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

            const shiftData = {
                id: shiftId,
                employeeId: empId,
                date: date || initialDate,
                startTime,
                endTime,
                breakDuration,
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
        if (selectedEmployeeIds.length === 0) return;
        
        const newShifts: Shift[] = [];
        
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
             const shiftData = {
                id: generateUUID(),
                employeeId: empId,
                date: date || initialDate,
                startTime,
                endTime,
                breakDuration,
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

    // Filter tasks logic
    const filteredTasks = tasks.filter(t => {
        const matchesCompletion = !showIncompleteOnly || !t.isCompleted;
        const matchesTags = activeTagFilters.length === 0 || (t.tags && t.tags.some(tag => activeTagFilters.includes(tag)));
        return matchesCompletion && matchesTags;
    });

    const getTagColor = (tag: string) => {
        const colors = [
            'bg-red-100 text-red-700 border-red-200',
            'bg-orange-100 text-orange-700 border-orange-200',
            'bg-amber-100 text-amber-700 border-amber-200',
            'bg-emerald-100 text-emerald-700 border-emerald-200',
            'bg-teal-100 text-teal-700 border-teal-200',
            'bg-sky-100 text-sky-700 border-sky-200',
            'bg-indigo-100 text-indigo-700 border-indigo-200',
            'bg-violet-100 text-violet-700 border-violet-200',
            'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
            'bg-rose-100 text-rose-700 border-rose-200',
        ];
        let hash = 0;
        for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
        const index = Math.abs(hash) % colors.length;
        return colors[index];
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-[#064e3b] bg-opacity-70 backdrop-blur-sm">
            <div className={`bg-[#fcfaf8] w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl shadow-2xl sm:max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 sm:border-4 border-[#e7e5e4] ${readOnly ? 'border-gray-300' : 'border-[#e7e5e4]'}`}>
                {/* Header - Fixed */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-[#e7e5e4] flex justify-between items-center bg-[#f5f5f4] flex-shrink-0">
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
                                className="text-xs flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 text-gray-600 transition-colors"
                                title="複製目前設定為新排班"
                             >
                                <Copy size={14} /> <span className="hidden sm:inline">複製</span>
                             </button>
                        )}
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Body - Scrollable */}
                <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
                    {/* Conflict Warnings */}
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
                                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${
                                            isSelected 
                                            ? 'bg-[#064e3b] border-[#064e3b] text-white shadow-md' 
                                            : readOnly 
                                                ? 'bg-gray-50 border-gray-200 text-gray-400 opacity-50' 
                                                : 'bg-white border-[#d6d3d1] text-[#57534e] hover:border-[#a8a29e]'
                                        }`}
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
                                className={`w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
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
                                className={`w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-[#57534e] mb-1.5">結束時間</label>
                            <input
                                type="time"
                                value={endTime}
                                disabled={readOnly}
                                onChange={(e) => setEndTime(e.target.value)}
                                className={`w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-[#57534e] mb-1.5 flex items-center gap-1">
                                <Coffee size={14} className="text-amber-600"/>
                                休息時間 (分)
                                <span className="text-[10px] font-normal text-gray-400 bg-gray-100 px-1 rounded ml-1">不計薪</span>
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="10"
                                value={breakDuration}
                                disabled={readOnly}
                                onChange={(e) => setBreakDuration(Number(e.target.value))}
                                className={`w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-[#57534e] mb-1.5">任務角色</label>
                            <input
                                type="text"
                                value={role}
                                disabled={readOnly}
                                onChange={(e) => setRole(e.target.value)}
                                placeholder="例如：營地管家"
                                className={`w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] ${readOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                            />
                        </div>
                    </div>

                    {/* Tasks Section */}
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                                <label className="block text-sm font-bold text-[#57534e]">工作項目</label>
                                {!readOnly && !isManagingTemplates && (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={handleAutoAssign}
                                            className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded-full transition-colors border border-amber-200"
                                        >
                                            <Zap size={14} className="fill-amber-700" />
                                            快速指派
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleGenerateTasks}
                                            disabled={isGenerating}
                                            className="flex items-center gap-1.5 text-xs font-medium text-[#064e3b] hover:text-[#065f46] bg-[#ecfdf5] px-2.5 py-1.5 rounded-full transition-colors disabled:opacity-50 border border-[#a7f3d0]"
                                        >
                                            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                            AI 智慧建議
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Task Categories & Templates Section (Hide in ReadOnly) */}
                        {!readOnly && (
                        <div className="bg-white border border-[#d6d3d1] rounded-lg p-3 mb-3 shadow-inner">
                            <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-[70%]">
                                    {isManagingTemplates ? (
                                        <span className="text-xs font-bold text-[#d97706] flex items-center gap-1">
                                            <PenLine size={12} /> 編輯分類與常用任務
                                        </span>
                                    ) : (
                                        taskCategories.map((cat, idx) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setActiveCategoryIndex(idx)}
                                                className={`text-xs px-2 py-1 rounded-t-lg whitespace-nowrap transition-colors ${activeCategoryIndex === idx ? 'bg-[#fffbeb] text-[#d97706] border-b-2 border-[#d97706] font-bold' : 'text-stone-500 hover:text-stone-700'}`}
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
                                    {isManagingTemplates ? '完成編輯' : <Settings size={14} />}
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
                                                    placeholder={`新增 ${cat.name} 任務...`}
                                                    value={newTaskInput[cat.id] || ''}
                                                    onChange={(e) => setNewTaskInput({...newTaskInput, [cat.id]: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTemplateTask(cat.id)}
                                                    className="flex-1 text-xs px-1.5 py-1 border rounded"
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
                                            className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded"
                                        />
                                        <button onClick={handleAddCategory} className="flex items-center gap-1 bg-[#d97706] text-white px-2 py-1 rounded text-xs hover:bg-[#b45309]">
                                            <FolderPlus size={12} /> 新增分類
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
                                                className="text-[10px] sm:text-xs bg-[#fffbeb] text-[#92400e] border border-[#fcd34d] px-2 py-1 rounded-full hover:bg-[#fef3c7] transition-colors"
                                            >
                                                + {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        )}

                        {/* Filter Bar */}
                        <div className="flex flex-col gap-2 mb-2">
                             {/* Tag Filters */}
                            {availableTags.length > 0 && tasks.length > 0 && (
                                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                                    <Filter size={12} className="text-gray-400 flex-shrink-0" />
                                    {availableTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleFilterTag(tag)}
                                            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all whitespace-nowrap ${
                                                activeTagFilters.includes(tag)
                                                ? 'bg-[#064e3b] text-white border-[#064e3b]'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                    {activeTagFilters.length > 0 && (
                                        <button onClick={() => setActiveTagFilters([])} className="text-[10px] text-gray-400 underline whitespace-nowrap">清除</button>
                                    )}
                                </div>
                            )}

                            {/* Completion Status Filter */}
                            <div className="flex justify-between items-center px-0.5">
                                <span className="text-xs text-[#a8a29e] font-medium">
                                    {filteredTasks.filter(t => t.isCompleted).length}/{filteredTasks.length} 符合 (總計 {tasks.length})
                                </span>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-[#57534e] hover:text-[#064e3b] cursor-pointer transition-colors select-none">
                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${showIncompleteOnly ? 'bg-[#064e3b] border-[#064e3b]' : 'bg-white border-[#d6d3d1]'}`}>
                                        {showIncompleteOnly && <CheckCircle2 size={10} className="text-white" />}
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
                                    draggable={!readOnly && !showIncompleteOnly && activeTagFilters.length === 0}
                                    onDragStart={(e) => handleDragStart(e, task.id)}
                                    onDragOver={(e) => handleDragOver(e, task.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`flex items-start gap-2 bg-white p-2.5 rounded-md shadow-sm group hover:ring-1 hover:ring-[#d6d3d1] transition-all ${draggedTaskId === task.id ? 'opacity-40 border-2 border-dashed border-[#064e3b]' : ''}`}
                                >
                                    {!readOnly && !showIncompleteOnly && activeTagFilters.length === 0 && (
                                        <div className="mt-0.5 cursor-move text-[#d6d3d1] hover:text-[#a8a29e] flex-shrink-0" title="拖曳排序">
                                            <GripVertical size={16} />
                                        </div>
                                    )}
                                    <button
                                        onClick={() => toggleTaskCompletion(task.id)}
                                        disabled={readOnly}
                                        className={`mt-0.5 transition-colors ${task.isCompleted ? 'text-emerald-600' : 'text-[#d6d3d1] hover:text-[#a8a29e]'} flex-shrink-0 ${readOnly ? 'cursor-default' : ''}`}
                                    >
                                        {task.isCompleted ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                                    </button>
                                    <div className="flex-1 min-w-0">
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

                                        {task.tags && task.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {task.tags.map(tag => (
                                                    <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded border ${getTagColor(tag)}`}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    {!readOnly && (
                                    <button 
                                        onClick={() => removeTask(task.id)}
                                        className="text-[#d6d3d1] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {!readOnly && (
                        <div className="flex gap-2 mb-4">
                            {/* Tag Selection Trigger */}
                            <div className="relative" ref={tagPickerRef}>
                                <button 
                                    type="button"
                                    onClick={() => setIsTagPickerOpen(!isTagPickerOpen)}
                                    className={`p-2.5 rounded-lg border transition-colors flex items-center justify-center ${currentInputTags.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-[#d6d3d1] text-gray-400 hover:text-gray-600'}`}
                                    title="設定標籤"
                                >
                                    <Tag size={20} />
                                    {currentInputTags.length > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                            {currentInputTags.length}
                                        </span>
                                    )}
                                </button>
                                
                                {isTagPickerOpen && (
                                    <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in zoom-in duration-200">
                                        <h4 className="text-xs font-bold text-gray-500 mb-2">選擇任務標籤</h4>
                                        <div className="flex flex-wrap gap-1.5 mb-3 max-h-40 overflow-y-auto">
                                            {availableTags.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => toggleInputTag(tag)}
                                                    className={`text-xs px-2 py-1 rounded-full border transition-all ${
                                                        currentInputTags.includes(tag) 
                                                        ? 'bg-amber-100 border-amber-300 text-amber-800 font-medium' 
                                                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                        <div className="flex gap-1 border-t border-gray-100 pt-2">
                                            <input 
                                                type="text" 
                                                value={newCustomTag}
                                                onChange={(e) => setNewCustomTag(e.target.value)}
                                                placeholder="自訂標籤..."
                                                className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:border-amber-500 focus:outline-none"
                                            />
                                            <button 
                                                onClick={handleAddCustomTag}
                                                type="button"
                                                className="bg-amber-500 text-white p-1 rounded hover:bg-amber-600"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input
                                type="text"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                placeholder="輸入任務... (可點選左側設定標籤)"
                                className="flex-1 px-3 py-2.5 text-sm border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b]"
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
                            班次日誌 / 備註
                        </label>
                        <textarea
                            value={shiftLog}
                            onChange={(e) => setShiftLog(e.target.value)}
                            disabled={readOnly}
                            placeholder="記錄當日特殊事項、交接重點或執行長叮嚀..."
                            className={`w-full px-3 py-2.5 bg-white border border-[#d6d3d1] rounded-lg focus:ring-[#064e3b] focus:border-[#064e3b] min-h-[80px] text-sm leading-relaxed resize-y ${readOnly ? 'bg-gray-100 text-gray-600' : ''}`}
                        />
                    </div>
                </div>

                {/* Footer - Fixed */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#f5f5f4] border-t border-[#e7e5e4] flex justify-between flex-shrink-0">
                    {!readOnly && existingShift ? (
                         <button
                         onClick={() => {
                             onDelete(existingShift.id);
                             onClose();
                         }}
                         className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
                     >
                         <Trash2 size={16} /> <span className="hidden sm:inline">刪除排班</span>
                     </button>
                    ) : <div></div>}
                   
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-[#57534e] bg-white border border-[#d6d3d1] rounded-lg hover:bg-[#e7e5e4] transition-colors"
                        >
                            {readOnly ? '關閉' : '取消'}
                        </button>
                        {!readOnly && (
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 text-sm font-medium text-white bg-[#d97706] rounded-lg hover:bg-[#b45309] shadow-md transition-colors"
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