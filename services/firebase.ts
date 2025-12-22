import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { FirebaseConfig, Shift, Employee, TaskCategory, Notification, Feedback } from "../types";

let db: any = null;

// Initialize Firebase App
export const initFirebase = (config: FirebaseConfig) => {
    try {
        if (!getApps().length) {
            const app = initializeApp(config);
            db = getFirestore(app);
            console.log("Firebase initialized successfully");
        } else {
            const app = getApp();
            db = getFirestore(app);
        }
        return true;
    } catch (error) {
        console.error("Firebase initialization failed:", error);
        return false;
    }
};

// Generic Save Function
export const saveToCloud = async (collectionName: string, data: any) => {
    if (!db) return;
    try {
        // We use a single document 'data' inside the collection to store the array
        // This is a simple strategy for this scale. For larger apps, store each item as a doc.
        // But to keep it compatible with the current "Array" state structure:
        await setDoc(doc(db, collectionName, "main_store"), { items: data });
    } catch (e) {
        console.error(`Error saving to ${collectionName}:`, e);
    }
};

// Generic Subscribe Function
export const subscribeToCloud = (collectionName: string, callback: (data: any[]) => void) => {
    if (!db) return () => {};
    
    const unsubscribe = onSnapshot(doc(db, collectionName, "main_store"), (docSnapshot) => {
        if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            if (data && data.items) {
                callback(data.items);
            }
        } else {
            // Initialize if empty
            callback([]);
        }
    }, (error) => {
        console.error(`Error in snapshot listener for ${collectionName}:`, error);
    });

    return unsubscribe;
};

export const isFirebaseInitialized = () => !!db;
