import React from "react";

const baseMessages1 = [
  "MANAJEMEN PESANTREN",
  "BERSAMA QURMA",
  "OTOMATISASI DATA",
  "LAPORAN REAL-TIME",
  "SOLUSI DIGITAL",
];
// 4x is plenty to cover ultra-wide screens without hitting browser width limits
const messages1 = Array(4).fill(baseMessages1).flat();

const baseMessages2 = [
  "ATUR JADWAL PRAKTIS",
  "PEMANTAUAN TAHFIDZ",
  "AKSES 24/7",
  "KONTROL GURU MUDAH",
  "REKAPITULASI CEPAT",
];
const messages2 = Array(4).fill(baseMessages2).flat();

const CustomSparkles = ({ className, fill, strokeWidth }: { className?: string, fill?: string, strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill={fill || "none"} 
    stroke="currentColor" 
    strokeWidth={strokeWidth || 2} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    <path d="M20 3v4" />
    <path d="M22 5h-4" />
  </svg>
);

const RibbonContent = ({ messages, iconColor, reverse = false }: { messages: string[], iconColor: string, reverse?: boolean }) => (
  <div className={`flex items-center justify-center gap-5 sm:gap-8 shrink-0 pr-5 sm:pr-8 w-max ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'}`}>
    {messages.map((msg, i) => (
      <div key={i} className="flex items-center gap-5 sm:gap-8 shrink-0">
        <span className="font-black text-lg sm:text-lg md:text-[28px] tracking-tight uppercase whitespace-nowrap leading-none mt-1">
          {msg}
        </span>
        <CustomSparkles className={`w-5 h-5 sm:w-7 sm:h-7 shrink-0 ${iconColor}`} fill="currentColor" strokeWidth={1} />
      </div>
    ))}
  </div>
);

export function MarqueeRibbon() {
  return (
    <div 
      className="relative w-full h-32 md:h-48 flex items-center justify-center my-4"
      style={{ clipPath: "inset(-150px 0 -150px 0)" }}
    >
      {/* Background Layer: Ribbon 1 (Tilted Right, Moving Left) */}
      <div className="absolute w-[110vw] left-[-5vw] bg-linear-to-r from-jade-900 to-jade-600 text-white flex items-center py-3.5 md:py-5 rotate-3 md:rotate-2 shadow-xl z-10 border-y-2 border-jade-600/50 overflow-hidden flex-nowrap">
        <RibbonContent messages={messages1} iconColor="text-white opacity-90" />
        <RibbonContent messages={messages1} iconColor="text-white opacity-90" />
      </div>

      {/* Foreground Layer: Ribbon 2 (Tilted Left, Moving Right) */}
      <div className="absolute w-[110vw] left-[-5vw] bg-linear-to-r from-[#80c229] to-[#b0f25d] text-jade-900 flex items-center py-3.5 md:py-5 -rotate-3 md:-rotate-2 shadow-2xl z-20 border-y-2 border-[#98d44c]/50 overflow-hidden flex-nowrap">
        <RibbonContent messages={messages2} iconColor="text-white" reverse={true} />
        <RibbonContent messages={messages2} iconColor="text-white" reverse={true} />
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        @keyframes marquee-reverse {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        .animate-marquee {
          animation: marquee 60s linear infinite;
        }
        .animate-marquee-reverse {
          animation: marquee-reverse 70s linear infinite;
        }
      `}</style>
    </div>
  );
}
