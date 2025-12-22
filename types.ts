
export interface Task {
    id: string;
    description: string;
    isCompleted: boolean;
    tags: string[];
    assigneeIds?: string[]; // List of employee IDs assigned to this task
    completedBy?: string; // New: ID of the employee who completed this task
}

export interface Shift {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    startTime: string; // HH:mm
    endTime: string; // HH:mm
    breakDuration: number; // Break duration in minutes (unpaid)
    role: string;
    tasks: Task[];
    shiftLog?: string; // New field for notes/logs
    color: string;
}

export interface Employee {
    id: string;
    name: string;
    email: string;
    avatar: string;
    color: string;
    hourlyWage: number; // Individual hourly wage
}

export interface TaskCategory {
    id: string;
    name: string;
    tasks: string[];
}

export interface Notification {
    id: string;
    type: 'task_completion' | 'help_received'; // Added 'help_received'
    title: string;
    message: string;
    timestamp: number;
    isRead: boolean;
    relatedShiftId?: string;
}

export interface Feedback {
    id: string;
    employeeId: string;
    content: string;
    date: string; // ISO String
    isRead: boolean;
    // New management fields
    category?: '設備' | '人事' | '營運' | '其他';
    isImportant?: boolean;
    adminNote?: string;
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}

export interface SystemSettings {
    firebaseConfig?: FirebaseConfig;
    isCloudSyncEnabled: boolean;
}

// Helper to generate unique IDs safely across all browsers/environments
export const generateUUID = () => {
    // Use substring instead of substr (deprecated), and ensure uniqueness
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Nature/Camping Color Palette
export const COLORS = [
    'bg-emerald-100 border-emerald-300 text-emerald-800', // Forest Green
    'bg-amber-100 border-amber-300 text-amber-800',       // Wood/Sun
    'bg-stone-200 border-stone-400 text-stone-800',       // Rock
    'bg-sky-100 border-sky-300 text-sky-800',             // Sky
    'bg-orange-100 border-orange-300 text-orange-800',    // Sunset
    'bg-teal-100 border-teal-300 text-teal-800',          // Lake
    'bg-rose-100 border-rose-300 text-rose-800',          // Flower
    'bg-indigo-100 border-indigo-300 text-indigo-800',    // Night
    'bg-lime-100 border-lime-300 text-lime-800',          // Grass
];

export const INITIAL_EMPLOYEES: Employee[] = [
    { id: '1', name: '小林', email: 'lin@aishang.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lin&backgroundColor=ecfdf5', color: COLORS[0], hourlyWage: 185 },
    { id: '2', name: '翊丞', email: 'yicheng@aishang.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yi&backgroundColor=fef3c7', color: COLORS[1], hourlyWage: 200 },
    { id: '4', name: 'hili', email: 'hili@aishang.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hili&backgroundColor=e0f2fe', color: COLORS[3], hourlyWage: 250 },
    { id: '5', name: '阿成', email: 'acheng@aishang.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cheng&backgroundColor=ffedd5', color: COLORS[4], hourlyWage: 300 },
];

export const DEFAULT_TASK_CATEGORIES: TaskCategory[] = [
    {
        id: 'housekeeping',
        name: '房務清潔',
        tasks: ["更換帳篷床單被套", "浴室廁所清潔消毒", "補齊衛浴備品", "清理垃圾與回收分類", "公共區域地面清掃", "退房巡視 (Check-out)", "帳篷內部深度清潔"]
    },
    {
        id: 'kitchen',
        name: '餐飲廚房',
        tasks: ["食材清洗與備料", "餐點製作與擺盤", "出餐與桌邊服務", "廚房器具清潔歸位", "庫存盤點", "下午茶點心準備", "早餐食材盤點"]
    },
    {
        id: 'front_desk',
        name: '櫃台外場',
        tasks: ["接待入住貴賓 (Check-in)", "營本部櫃台值班", "協助客人搬運行李", "接聽客服電話", "結帳與發票開立", "營區環境與設施介紹"]
    },
    {
        id: 'activity',
        name: '活動營務',
        tasks: ["巡視帳篷與天幕", "營火晚會升火", "夜間營區巡邏", "活動器材準備與檢查", "集合遊客進行解說", "園區景觀維護"]
    }
];

export const DEFAULT_TASK_TAGS = ['房務', '餐飲', '櫃台', '活動', '營務', '緊急'];
