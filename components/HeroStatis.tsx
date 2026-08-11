export default function HeroStatis() {
  return (
    <section className="relative h-screen min-h-[620px] px-6 lg:px-8 overflow-hidden flex items-center justify-center bg-[#1A1200]">
      {/* Background Image Existing */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: "url('/image/keluarga-besar-nagari.jpeg')",
          }}
        ></div>

        {/* Warm Dark Mahogany Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A1200]/80 via-[#2C1B01]/70 to-[#1A1200]/85 z-[1]"></div>
      </div>

      {/* Hero Content Panel */}
      <div className="relative max-w-5xl mx-auto text-center animate-fade-in z-10 space-y-5">
        {/* Official Motto Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B6A587]/20 border border-[#B6A587]/40 backdrop-blur-md shadow-lg">
          <span className="w-2 h-2 rounded-full bg-[#B6A587] animate-pulse"></span>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-[0.25em] text-[#E6DDCF]">
            RANCAK BANA
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
          Nagari Aia Manggih Barat
        </h1>

        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-[#B6A587] to-transparent mx-auto rounded-full"></div>

        <p className="text-base sm:text-lg md:text-xl text-[#F7F2E8]/95 max-w-3xl mx-auto leading-relaxed drop-shadow-md font-medium">
          &ldquo;Ramah, Amanah, Normatif, Cepat, Akurat, Kreatif, Bebas Biaya, Aman, Nyaman, dan Adil&rdquo;
        </p>
      </div>

      {/* Scroll Down Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
        <span className="text-[10px] uppercase tracking-widest text-[#E6DDCF] font-bold">Jelajahi Nagari</span>
        <svg className="w-5 h-5 text-[#B6A587] animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}
