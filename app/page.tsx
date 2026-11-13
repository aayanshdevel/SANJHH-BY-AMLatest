import Hero from "../src/components/Hero";
import ProductCarousel from "../src/components/ProductCarousel";
import ValueProps from "../src/components/ValueProps";

export default function Home() {
    return (
        <div className="flex flex-col w-full">
            <Hero />

            {/* Carousel 1 */}


            <ProductCarousel title="New Arrivals" />

            <div className="w-full h-px bg-zinc-100 my-8 max-w-screen-2xl mx-auto" />

            {/* Carousel 2 (Changed to match your Admin dropdown exactly) */}


            <ProductCarousel title="Festive Edit" />

            {/* Value Proposition Section */}
            <ValueProps />
        </div>
    );
}