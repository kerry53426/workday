import React, { useState } from 'react';
import { SystemSettings, FirebaseConfig } from '../types';
import { X, Cloud, Save, AlertTriangle, CheckCircle2, Link } from 'lucide-react';
import { initFirebase } from '../services/firebase';

interface SystemSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: SystemSettings;
    onSaveSettings: (settings: SystemSettings) => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ 
    isOpen, 
    onClose, 
    settings, 
    onSaveSettings 
}) => {
    const [configJson, setConfigJson] = useState(
        settings.firebaseConfig ? JSON.stringify(settings.firebaseConfig, null, 2) : ''
    );
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

    if (!isOpen) return null;

    const handleSave = () => {
        try {
            const parsedConfig: FirebaseConfig = JSON.parse(configJson);
            
            // Validate basic fields
            if (!parsedConfig.apiKey || !parsedConfig.projectId) {
                throw new Error("設定檔缺少必要欄位 (apiKey, projectId)");
            }

            // Test connection
            const success = initFirebase(parsedConfig);
            if (success) {
                setTestStatus('success');
                onSaveSettings({
                    firebaseConfig: parsedConfig,
                    isCloudSyncEnabled: true
                });
                setTimeout(() => {
                    onClose();
                }, 1500);
            } else {
                setTestStatus('error');
            }
        } catch (e) {
            setTestStatus('error');
            alert("設定檔格式錯誤，請確認是有效的 JSON 格式。");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#064e3b] bg-opacity-70 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-[#0284c7] text-white rounded-lg">
                            <Cloud size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#44403c]">雲端同步設定</h3>
                            <p className="text-xs text-[#78716c]">設定 Firebase 以啟用跨裝置即時同步</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} /> 如何取得設定碼？
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-xs">
                            <li>前往 <a href="https://console.firebase.google.com/" target="_blank" className="underline font-bold text-blue-600">Firebase Console</a> 並建立新專案。</li>
                            <li>在專案設定中，新增一個「網頁應用程式 (Web App)」。</li>
                            <li>複製 <code>const firebaseConfig = &#123;...&#125;;</code> 大括號內的內容。</li>
                            <li>將內容貼入下方欄位。</li>
                            <li>務必在 Firebase Console 的 Firestore Database 中開啟權限 (設為 test mode 或自訂規則)。</li>
                        </ol>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#57534e] mb-2">
                            Firebase Configuration (JSON)
                        </label>
                        <textarea
                            value={configJson}
                            onChange={(e) => {
                                setConfigJson(e.target.value);
                                setTestStatus('idle');
                            }}
                            placeholder={
`{
  "apiKey": "AIzaSy...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}`}
                            className="w-full h-48 p-3 text-xs font-mono bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0284c7] focus:border-transparent resize-none"
                        />
                    </div>

                    {testStatus === 'success' && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-lg animate-in fade-in">
                            <CheckCircle2 size={18} /> 連線成功！系統已啟用雲端同步。
                        </div>
                    )}

                    {testStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 p-3 rounded-lg animate-in fade-in">
                            <AlertTriangle size={18} /> 連線失敗，請檢查設定碼是否正確。
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2 bg-[#064e3b] text-white rounded-lg hover:bg-[#065f46] transition-colors font-bold text-sm flex items-center gap-2 shadow-md"
                        >
                            <Save size={16} /> 儲存並連線
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
