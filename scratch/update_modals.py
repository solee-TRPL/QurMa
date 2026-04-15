
import os

path = r'c:\dataD\qurma\qurma-v14\pages\teacher\StudentDirectory.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace achievement modal
content = content.replace(
    '        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800">',
    '        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300 text-slate-800" onClick={onClose}>'
)

# This replace call will hit both achievement and notes modal as the inner div is same
content = content.replace(
    '            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative">',
    '            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/20 relative" onClick={e => e.stopPropagation()}>'
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated StudentDirectory.tsx")
