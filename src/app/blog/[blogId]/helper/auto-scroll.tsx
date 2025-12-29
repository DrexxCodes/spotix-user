// "use client"

// import { Play, Pause } from "lucide-react"

// interface AutoScrollControlsProps {
//   isScrolling: boolean
//   scrollSpeed: number
//   onToggle: () => void
//   onSpeedChange: (speed: number) => void
// }

// export default function AutoScrollControls({
//   isScrolling,
//   scrollSpeed,
//   onToggle,
//   onSpeedChange,
// }: AutoScrollControlsProps) {
//   return (
//     <div className="bg-white border-2 border-[#6b2fa5] rounded-lg px-4 py-4 shadow-md mb-6">
//       <h3 className="text-sm font-semibold text-gray-700 mb-3">Auto Scroll Controls</h3>
//       <div className="flex flex-wrap items-center gap-4">
//         <button
//           onClick={onToggle}
//           className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#6b2fa5] text-white hover:bg-[#5a2589] transition-colors"
//           title={isScrolling ? "Pause auto scroll" : "Start auto scroll"}
//         >
//           {isScrolling ? <Pause size={20} /> : <Play size={20} />}
//         </button>
//         <div className="flex items-center gap-3 flex-1 min-w-[200px]">
//           <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Speed:</label>
//           <input
//             type="range"
//             min="10"
//             max="100"
//             step="5"
//             value={scrollSpeed}
//             onChange={(e) => onSpeedChange(Number(e.target.value))}
//             className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6b2fa5]"
//           />
//           <span className="text-sm font-semibold text-[#6b2fa5] min-w-[2rem] text-right">{scrollSpeed}</span>
//         </div>
//       </div>
//     </div>
//   )
// }
