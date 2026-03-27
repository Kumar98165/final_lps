import { Cpu } from 'lucide-react';

interface IndustrialConsoleProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
}

export const IndustrialConsole = ({ title, description, icon }: IndustrialConsoleProps) => {
    return (
        <div className="bg-white border border-slate-200 rounded-[3rem] p-10 min-h-[300px] relative overflow-hidden group">
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
            <div className="relative z-10 h-full flex flex-col justify-center items-center text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-200 transition-all duration-700 group-hover:scale-110 group-hover:rotate-12">
                    {icon || <Cpu size={48} strokeWidth={1} />}
                </div>
                <div className="space-y-2 max-w-md">
                    <h3 className="text-2xl font-black text-slate-900 uppercase">{title}</h3>
                    <p className="text-slate-400 font-bold leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </div>
    );
};
