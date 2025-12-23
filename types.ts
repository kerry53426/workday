
export interface Task {
    id: string;
    description: string;
    isCompleted: boolean;
    tags: string[];
    assigneeIds?: string[];
    completedBy?: string;
    creatorRole?: 'manager' | 'employee'; // 標記任務建立者身分
}

export interface Shift {
    id: string;
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    breakStartTime?: string;
    breakEndTime?: string;
    breakDuration?: number; 
    role: string;
    tasks: Task[];
    shiftLog?: string;
    color: string;
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    avatar: string;
    color: string;
    hourlyWage: number;
    password?: string; // 夥伴自定義密碼
    customTemplates?: string[]; // 夥伴個人的常用任務範本
}

export interface TaskCategory {
    id: string;
    name: string;
    tasks: string[];
}

export interface Notification {
    id: string;
    type: 'task_completion' | 'help_received' | 'system';
    title: string;
    message: string;
    timestamp: number;
    isRead: boolean;
    targetEmployeeId: string; // 'manager' or specific employeeId
    senderId?: string;
    relatedShiftId?: string;
}

export interface Feedback {
    id: string;
    employeeId: string;
    content: string;
    date: string;
    isRead: boolean;
    category?: '設備' | '人事' | '營運' | '其他';
    isImportant?: boolean;
    adminNote?: string;
}

// Fix: Added missing FirebaseConfig interface used in services/firebase.ts
export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}

// Fix: Added missing SystemSettings interface used in components/SystemSettingsModal.tsx
export interface SystemSettings {
    pantryId: string;
    isCloudSyncEnabled: boolean;
}

export const generateUUID = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const COLORS = [
    'bg-emerald-100 border-emerald-300 text-emerald-800',
    'bg-amber-100 border-amber-300 text-amber-800',
    'bg-stone-200 border-stone-400 text-stone-800',
    'bg-sky-100 border-sky-300 text-sky-800',
    'bg-orange-100 border-orange-300 text-orange-800',
    'bg-teal-100 border-teal-300 text-teal-800',
    'bg-rose-100 border-rose-300 text-rose-800',
    'bg-indigo-100 border-indigo-300 text-indigo-800',
    'bg-lime-100 border-lime-300 text-lime-800',
];

export const INITIAL_EMPLOYEES: Employee[] = [
    { id: '1', name: '小林', email: 'lin@aishang.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lin&backgroundColor=ecfdf5', color: COLORS[0], hourlyWage: 185, password: '1234' },
    { id: '2', name: '翊丞', email: 'yicheng@aishang.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yi&backgroundColor=fef3c7', color: COLORS[1], hourlyWage: 200, password: '1234' },
    { id: '4', name: 'hili', email: 'hili@aishang.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hili&backgroundColor=e0f2fe', color: COLORS[3], hourlyWage: 250, password: '1234' },
    { id: '5', name: '阿成', email: 'acheng@aishang.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cheng&backgroundColor=ffedd5', color: COLORS[4], hourlyWage: 300, password: '1234' },
];

export const DEFAULT_TASK_CATEGORIES: TaskCategory[] = [
    {
        id: 'housekeeping',
        name: '房務清潔',
        tasks: ["更換帳篷床單被套", "浴室廁所清潔消毒", "補齊衛浴備品", "清理垃圾與回收分類"]
    },
    {
        id: 'kitchen',
        name: '餐飲廚房',
        tasks: ["食材清洗與備料", "餐點製作與擺盤", "廚房器具清潔歸位"]
    }
];
