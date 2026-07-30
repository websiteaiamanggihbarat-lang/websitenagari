export default function HeroStatis() {
  return (
    <section className="relative h-screen min-h-[600px] px-6 lg:px-8 overflow-hidden flex items-center justify-center">
      {/* Background Image Existing */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/image/keluarga-besar-nagari.jpeg')",
          }}
        ></div>

        {/* Dark overlay statis untuk readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/70 z-[1]"></div>
      </div>

      {/* Hero Text Statis Existing */}
      <div className="relative max-w-5xl mx-auto text-center animate-fade-in z-10">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-tight drop-shadow-lg">
          Nagari Aia Manggih Barat
        </h1>

        <p className="text-3xl uppercase tracking-[0.3em] text-[#f0e8db] mb-3 drop-shadow-md">
          RANCAK BANA
        </p>

        <p className="text-base md:text-lg text-white/95 max-w-3xl mx-auto leading-relaxed drop-shadow-md">
          "Ramah, Amanah, Normatif, Cepat, Akurat, Kreatif, Bebas Biaya, Aman, Nyaman, dan Adil"
        </p>
      </div>
    </section>
  )
}
