import React, { useState } from 'react';
import { SystemSettings } from '../types';
import { X, Cloud, Save, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { checkPantryConnection } from '../services/pantryService';

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
    const [pantryId, setPantryId] = useState(settings.pantryId || '');
    const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error' | 'testing'>('idle');

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!pantryId.trim()) {
            alert("請輸入 Pantry ID");
            return;
        }

        setTestStatus('testing');
        const success = await checkPantryConnection(pantryId.trim());
        
        if (success) {
            setTestStatus('success');
            onSaveSettings({
                pantryId: pantryId.trim(),
                isCloudSyncEnabled: true
            });
            setTimeout(() => {
                onClose();
            }, 1500);
        } else {
            setTestStatus('error');
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
                            <h3 className="text-xl font-bold text-[#44403c]">雲端同步設定 (Pantry)</h3>
                            <p className="text-xs text-[#78716c]">使用免費的 Pantry Cloud 進行跨裝置同步</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                        <h4 className="font-bold flex items-center gap-2 mb-2">
                            <AlertTriangle size={16} /> 如何取得 Pantry ID？(僅需 1 分鐘)
                        </h4>
                        <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm">
                            <li>前往 <a href="https://getpantry.cloud/" target="_blank" rel="noopener noreferrer" className="underline font-bold text-blue-600 inline-flex items-center gap-1">Pantry Cloud 官網 <ExternalLink size={12}/></a> 並點擊 "Create a Pantry"。</li>
                            <li>輸入您的 Email 註冊 (完全免費)。</li>
                            <li>註冊後在 Dashboard 您會看到一串 <strong>Your Pantry ID</strong>。</li>
                            <li>將該 ID 複製並貼入下方欄位。</li>
                        </ol>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-[#57534e] mb-2">
                            Pantry ID
                        </label>
                        <input
                            type="text"
                            value={pantryId}
                            onChange={(e) => {
                                setPantryId(e.target.value);
                                setTestStatus('idle');
                            }}
                            placeholder="例如：9581632d-..."
                            className="w-full p-3 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0284c7] focus:border-transparent"
                        />
                    </div>

                    {testStatus === 'testing' && (
                         <div className="flex items-center gap-2 text-gray-600 text-sm p-3">
                            <span className="animate-spin">⏳</span> 測試連線中...
                        </div>
                    )}

                    {testStatus === 'success' && (
                        <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold bg-emerald-50 p-3 rounded-lg animate-in fade-in">
                            <CheckCircle2 size={18} /> 連線成功！系統已啟用雲端同步。
                        </div>
                    )}

                    {testStatus === 'error' && (
                        <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 p-3 rounded-lg animate-in fade-in">
                            <AlertTriangle size={18} /> 連線失敗，請檢查 ID 是否正確。
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
                            disabled={testStatus === 'testing'}
                            className="px-6 py-2 bg-[#064e3b] text-white rounded-lg hover:bg-[#065f46] transition-colors font-bold text-sm flex items-center gap-2 shadow-md disabled:opacity-50"
                        >
                            <Save size={16} /> 儲存並啟用
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};