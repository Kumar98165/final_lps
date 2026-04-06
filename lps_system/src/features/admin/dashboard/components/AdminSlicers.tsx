import React from 'react';
import { ChevronDown, Car, Users, UserCheck, Activity, Calendar } from 'lucide-react';

export const AdminSlicers: React.FC = () => {
    const slicers = [
        { label: 'Vehicle Model', icon: Car, placeholder: 'ALL MODELS' },
        { label: 'Operators (DEO)', icon: UserCheck, placeholder: 'ALL DEOS' },
        { label: 'Supervisors', icon: Users, placeholder: 'SUPERVISOR USER' },
        { label: 'Production Line', icon: Activity, placeholder: 'ALL LINES' },
        { label: 'Time Period', icon: Calendar, placeholder: 'LAST 7 DAYS' },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {slicers.map((slicer, i) => (
                <div key={i} className="bg-white border border-ind-border/50 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-shadow group cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-ind-bg text-ind-text3 rounded-xl group-hover:bg-ind-border/30 group-hover:text-ind-text transition-colors">
                            <slicer.icon size={14} />
                        </div>
                        <span className="text-[10px] font-black text-ind-text3 uppercase tracking-widest">{slicer.label}</span>
                    </div>
                    <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-black text-ind-text uppercase tracking-tight">{slicer.placeholder}</span>
                        <ChevronDown size={14} className="text-ind-text3 group-hover:text-ind-text transition-colors" />
                    </div>
                </div>
            ))}
        </div>
    );
};
