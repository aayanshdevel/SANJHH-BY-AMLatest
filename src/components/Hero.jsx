import Link from "next/link";

export default function Hero() {
    return (
        <section className="relative h-[85vh] w-full overflow-hidden">
            {/* Background Image (Using a placeholder for now) */}
            <img
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2000&auto=format&fit=crop"
                alt="Sanjhhbyam Festive Collection"
                className="absolute inset-0 h-full w-full object-cover object-center"
            />

            {/* Subtle Dark Overlay so the white text is readable */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h1 className="text-5xl md:text-7xl font-serif text-white tracking-widest mb-6">
                    THE FESTIVE EDIT
                </h1>
                <p className="text-sm md:text-base text-white/90 mb-10 max-w-lg font-light tracking-wider">
                    Discover our new collection of premium ethnic and western wear, designed for the modern woman.
                </p>

                {/* Call to Action Button */}
                <Link
                    href="/shop"
                    className="bg-white text-zinc-900 px-10 py-4 text-xs font-semibold tracking-[0.2em] uppercase hover:bg-zinc-100 hover:scale-105 transition-all duration-300"
                >
                    Shop Collection
                </Link>
            </div>
        </section>
    );
}