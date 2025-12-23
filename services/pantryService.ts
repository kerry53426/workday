
// Pantry Cloud Service
// API Docs: https://documenter.getpostman.com/view/3281832/SzmZeMLC

const BASE_URL = "https://getpantry.cloud/apiv1/pantry";
const BASKET_NAME = "aishang_camping_data"; // 固定籃子名稱

// 驗證 ID 格式
const isValidId = (id: string) => id && id.length > 20 && id.includes('-');

export const checkPantryConnection = async (pantryId: string): Promise<boolean> => {
    if (!navigator.onLine || !isValidId(pantryId)) return false;
    
    try {
        const response = await fetch(`${BASE_URL}/${pantryId}`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        if (!response.ok) return false;
        const data = await response.json();
        return !!data.name;
    } catch (e) {
        console.error("Pantry connection check failed:", e);
        return false;
    }
};

// 從雲端讀取所有資料
export const loadFromPantry = async (pantryId: string) => {
    if (!navigator.onLine || !isValidId(pantryId)) {
        return null;
    }

    try {
        const response = await fetch(`${BASE_URL}/${pantryId}/basket/${BASKET_NAME}`, {
            method: 'GET',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            if (response.status === 404 || response.status === 400) {
                return null;
            }
            // 避免拋出錯誤導致整個應用程式掛掉，僅回傳 null 使用本地備份
            return null;
        }
        return await response.json();
    } catch (e) {
        // 攔截 "Failed to fetch" 錯誤，這通常是網路不穩或 CORS 暫時性問題
        console.warn("Pantry 讀取失敗，將使用本地資料:", e);
        return null;
    }
};

// 將資料儲存至雲端
export const saveToPantry = async (pantryId: string, data: any) => {
    if (!navigator.onLine || !isValidId(pantryId)) return;

    try {
        const response = await fetch(`${BASE_URL}/${pantryId}/basket/${BASKET_NAME}`, {
            method: 'POST', // Pantry 使用 POST 來取代整個籃子內容
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            console.error("雲端儲存失敗:", response.status);
        }
    } catch (e) {
        console.error("網路錯誤，無法儲存至雲端:", e);
    }
};
