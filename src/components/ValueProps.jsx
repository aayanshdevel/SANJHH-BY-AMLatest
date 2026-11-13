import { Truck, Sparkles, RefreshCcw } from "lucide-react";

const features = [
    {
        name: "Free Worldwide Shipping",
        description: "On all prepaid orders over ₹5,000.",
        icon: Truck,
    },
    {
        name: "Premium Fabrics",
        description: "Ethically sourced, high-quality materials.",
        icon: Sparkles,
    },
    {
        name: "Easy Exchanges",
        description: "7-day hassle-free return policy.",
        icon: RefreshCcw,
    },
];

export default function ValueProps() {
    return (
        <section className="bg-zinc-50 py-20 px-4 md:px-8">
            <div className="max-w-screen-xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
                    {features.map((feature) => (
                        <div key={feature.name} className="flex flex-col items-center">
                            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-white mb-6 shadow-sm border border-zinc-100">
                                <feature.icon className="h-5 w-5 text-zinc-900" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-sm font-semibold text-zinc-900 tracking-wide mb-2 uppercase">
                                {feature.name}
                            </h3>
                            <p className="text-sm text-zinc-500 font-light">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}