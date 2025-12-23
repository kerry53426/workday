
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Removed top-level initialization and configured the service to initialize the client inside the function call for more reliability.
export const generateTasksForRole = async (role: string, startTime: string, endTime: string): Promise<string[]> => {
    // API key must be obtained from process.env.API_KEY as per guidelines.
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
        console.warn("API Key missing, returning mock data");
        return [
            "檢查庫存水位",
            "整理工作區域",
            "準備交班事項",
            "填寫工作日誌",
            "協助顧客需求"
        ];
    }

    try {
        // Fix: Use the standard initialization pattern for GoogleGenAI.
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = `
        請為職位 "${role}" 在 ${startTime} 到 ${endTime} 的班次生成 5 個具體、可執行的簡短工作清單（繁體中文）。
        這些任務應符合一般商業環境中該職位的職責。
        只回傳字串陣列 (JSON array of strings)。
        `;

        // Fix: Call generateContent directly on ai.models with correct model name and prompt.
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.STRING
                    }
                }
            }
        });

        // Fix: Correctly access the response text using the .text property (not a method).
        const text = response.text;
        if (!text) return [];
        
        const tasks = JSON.parse(text) as string[];
        return tasks;

    } catch (error) {
        console.error("Error generating tasks:", error);
        // Fallback in case of API error
        return [
            `執行 ${role} 的例行檢查`,
            `整理與清潔`,
            `確認交辦事項`,
            `團隊協作溝通`,
            `填寫班次紀錄`
        ];
    }
};
