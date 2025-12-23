
// Pantry Cloud Service
// API Docs: https://documenter.getpostman.com/view/3281832/SzmZeMLC

const BASE_URL = "https://getpantry.cloud/apiv1/pantry";
const BASKET_NAME = "aishang_camping_data"; // Fixed basket name for simplicity

export const checkPantryConnection = async (pantryId: string): Promise<boolean> => {
    if (!navigator.onLine) return false;
    try {
        const response = await fetch(`${BASE_URL}/${pantryId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) return false;
        const data = await response.json();
        // If we get details about the pantry, it's valid
        return !!data.name;
    } catch (e) {
        console.error("Pantry connection check failed:", e);
        return false;
    }
};

// Load ALL data from the basket
export const loadFromPantry = async (pantryId: string) => {
    // Prevent fetch if offline to avoid "Failed to fetch" error spam
    if (!navigator.onLine) {
        console.warn("Device is offline, skipping Pantry load.");
        return null;
    }

    try {
        const response = await fetch(`${BASE_URL}/${pantryId}/basket/${BASKET_NAME}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });
        
        if (!response.ok) {
            if (response.status === 400 || response.status === 404) {
                // Basket might not exist yet, which is fine (fresh start)
                return null;
            }
            throw new Error(`Failed to load: ${response.status} ${response.statusText}`);
        }
        return await response.json();
    } catch (e) {
        console.error("Error loading from Pantry:", e);
        return null;
    }
};

// Save ALL data to the basket
// We save everything in one basket to ensure consistency and minimize requests
export const saveToPantry = async (pantryId: string, data: any) => {
    if (!navigator.onLine) {
        console.warn("Device is offline, skipping Pantry save (changes kept locally).");
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/${pantryId}/basket/${BASKET_NAME}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            console.error("Failed to save to Pantry:", await response.text());
        }
    } catch (e) {
        console.error("Error saving to Pantry:", e);
    }
};