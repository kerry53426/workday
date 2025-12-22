import React from 'react';
import { Mountain } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    title: string;
    actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, actions }) => {
    return (
        <div className="min-h-screen flex flex-col bg-[#f5f5f4]">
            <header className="bg-[#064e3b] text-white shadow-md sticky top-0 z-30 border-b-4 border-[#92400e] safe-area-top">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-14 sm:h-16">
                        <div className="flex items-center min-w-0 flex-shrink-1 mr-2">
                            <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2 tracking-wide truncate">
                                <div className="p-1.5 bg-white/10 rounded-full flex-shrink-0">
                                    <Mountain size={18} className="text-[#fbbf24]" />
                                </div>
                                <span className="hidden xs:inline truncate">愛上喜翁</span>
                                <span className="text-xs sm:text-sm font-light opacity-80 border-l border-white/30 pl-2 ml-1 whitespace-nowrap">{title}</span>
                            </h1>
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                            {actions}
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 safe-area-bottom">
                {children}
            </main>
        </div>
    );
};