import React from 'react';

export const AdminTopBar: React.FC = () => {
    return (
        <div className="flex items-center justify-end">
            <div className="flex items-center gap-3">
                {/* Profile Section */}
                <div className="flex items-center gap-3 pl-4 border-l border-ind-border ml-2">
                    <div className="text-right">
                        <div className="text-[0.75rem] font-black text-ind-text leading-tight uppercase tracking-tight">Admin User</div>
                        <div className="text-[0.55rem] font-bold text-ind-primary uppercase tracking-widest flex items-center justify-end gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-ind-primary shadow-[0_0_8px_rgba(243,112,33,0.4)]" />
                            Admin
                        </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-ind-text flex items-center justify-center text-white font-black text-sm shadow-md overflow-hidden relative group">
                        <img 
                            src={`https://ui-avatars.com/api/?name=Admin+User&background=1A1A1A&color=fff`} 
                            alt="Admin" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
