// import React from 'react';
// import { Bar, Doughnut } from 'react-chartjs-2';
// import { Boxes, Monitor, LayoutGrid } from 'lucide-react';
// import type { Material } from '../../hooks/useIndustrialState';

// interface MaterialsProps {
//     materials: Material[];
//     activeModel: string;
//     onModelChange: (model: string) => void;
//     models: string[];
// }

// export const MaterialsUsagePanel: React.FC<MaterialsProps> = ({ materials, activeModel, onModelChange, models }) => {

//     const barData = {
//         labels: materials.map(m => m.name),
//         datasets: [
//             {
//                 label: 'Used',
//                 data: materials.map(m => m.used),
//                 backgroundColor: materials.map(m => m.color + 'cc'),
//                 borderRadius: 5,
//             },
//             {
//                 label: 'Remaining',
//                 data: materials.map(m => m.total - m.used),
//                 backgroundColor: materials.map(m => m.color + '22'),
//                 borderRadius: 5,
//             }
//         ]
//     };

//     const doughnutData = {
//         labels: materials.map(m => m.name),
//         datasets: [{
//             data: materials.map(m => m.used * m.cost),
//             backgroundColor: materials.map(m => m.color),
//             borderWidth: 0,
//             hoverOffset: 5,
//             cutout: '70%'
//         }]
//     };

//     const commonOptions = {
//         responsive: true,
//         maintainAspectRatio: false,
//         plugins: {
//             legend: {
//                 position: 'bottom' as const,
//                 labels: { color: '#475569', boxWidth: 8, font: { size: 9, family: 'JetBrains Mono' } }
//             }
//         }
//     };

//     return (
//         <div className="bg-ind-card border border-ind-border rounded-xl mb-4 overflow-hidden shadow-lg animate-in fade-in duration-700">
//             <div className="flex items-center justify-between p-4 border-b border-ind-border bg-ind-bg2/30">
//                 <div className="flex items-center gap-2 font-bold text-ind-text text-sm">
//                     <Boxes size={16} className="text-ind-orange" />
//                     Materials Usage — Inventory Intelligence
//                 </div>
//                 <div className="flex gap-2">
//                     {models.map(m => (
//                         <button
//                             key={m}
//                             onClick={() => onModelChange(m)}
//                             className={`font-mono-jet text-[0.7rem] px-3 py-1 rounded-md transition-all border ${activeModel === m
//                                 ? 'bg-ind-g1/10 border-ind-g1/30 text-ind-g1 shadow-inner'
//                                 : 'bg-ind-bg2 border-ind-border text-ind-text3 hover:border-ind-border2'
//                                 }`}
//                         >
//                             {m}
//                         </button>
//                     ))}
//                 </div>
//             </div>

//             <div className="p-4">
//                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
//                     {materials.map((m, i) => (
//                         <div key={i} className="bg-ind-bg2/50 border border-ind-border rounded-xl p-3 text-center transition-all hover:border-ind-border2 group shadow-sm">
//                             <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{m.icon}</div>
//                             <div className="font-mono-jet text-[0.62rem] text-ind-text3 uppercase tracking-tighter mb-1 truncate">{m.name}</div>
//                             <div className="text-lg font-black text-ind-text leading-none">{m.used.toLocaleString()}</div>
//                             <div className="font-mono-jet text-[0.55rem] text-ind-text3 mt-1">{m.unit} util.</div>
//                             <div className="h-1 bg-ind-border/30 rounded-full mt-2 overflow-hidden shadow-inner border border-ind-border">
//                                 <div
//                                     className="h-full transition-all duration-1000"
//                                     style={{ width: `${Math.round(m.used / m.total * 100)}%`, backgroundColor: m.color }}
//                                 />
//                             </div>
//                         </div>
//                     ))}
//                 </div>

//                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                     <div className="bg-ind-bg2/30 border border-ind-border rounded-xl p-4">
//                         <div className="font-bold text-ind-text2 text-[0.7rem] uppercase tracking-widest mb-4 flex items-center gap-2">
//                             <Monitor size={12} className="text-ind-orange" />
//                             Inventory Consumption (Units)
//                         </div>
//                         <div className="h-48">
//                             <Bar
//                                 data={barData}
//                                 options={{
//                                     ...commonOptions,
//                                     scales: {
//                                         x: { stacked: true, grid: { display: false }, ticks: { color: '#64748b', font: { size: 8 } } },
//                                         y: { stacked: true, grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { color: '#64748b', font: { size: 8 } } }
//                                     }
//                                 }}
//                             />
//                         </div>
//                     </div>

//                     <div className="bg-ind-bg2/30 border border-ind-border rounded-xl p-4">
//                         <div className="font-bold text-ind-text2 text-[0.7rem] uppercase tracking-widest mb-4 flex items-center gap-2">
//                             <LayoutGrid size={12} className="text-ind-purple" />
//                             Material Cost Distribution
//                         </div>
//                         <div className="h-48">
//                             <Doughnut data={doughnutData} options={commonOptions} />
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };
