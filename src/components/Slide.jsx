import React from 'react'

export default function Slide({ item, theme }) {
  const t = theme || {}
  const bg = t.bgColor || '#0d0d0f'
  const accent = t.accentColor || '#ddfe78'
  const text = t.textColor || '#ffffff'
  const overlay = t.overlayColor || 'rgba(0,0,0,0.35)'

  return (
    <div className="w-screen h-[calc(100vh-80px)] md:h-screen" style={{ background: bg }}>
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
        {/* Image */}
        <img
          src={item?.imageUrl}
          alt={item?.ig || 'single'}
          className="w-full h-full object-contain md:object-cover"
          style={{ maxHeight: '100%', maxWidth: '100%' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: overlay }} />

        {/* Bottom text card */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[92%] md:w-[70%]">
          <div className="rounded-2xl px-5 py-4" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                <div className="text-xl md:text-3xl font-black" style={{ color: accent }}>
                  @{item?.ig || 'unknown'}
                </div>
                <div className="text-sm md:text-lg mt-1" style={{ color: text }}>
                  {item?.caption || ''}
                </div>
              </div>
              <div className="hidden md:block text-xs opacity-70">Single Showcase</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
