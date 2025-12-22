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
            <header className="bg-[#064e3b] text-white shadow-md sticky top-0 z-10 border-b-4 border-[#92400e]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold flex items-center gap-2 tracking-wide">
                                <div className="p-1.5 bg-white/10 rounded-full">
                                    <Mountain size={20} className="text-[#fbbf24]" />
                                </div>
                                <span>愛上喜翁</span>
                                <span className="text-xs font-light opacity-80 border-l border-white/30 pl-2 ml-1">{title}</span>
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {actions}
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};