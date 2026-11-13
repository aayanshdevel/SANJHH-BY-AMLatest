import Link from "next/link";

export default function ProductCard({ id, title, price, salePrice, images }) {
    // Format numbers nicely for Indian Rupees
    const formatPrice = (amount) => {
        return new Intl.NumberFormat('en-IN').format(amount);
    };

    const mainImage = images && images.length > 0 ? images[0] : "";

    return (
        // FIX: Replaced min-w with strict w-[320px] and added flex-none to stop stretching
        <div className="group w-[280px] sm:w-[320px] flex-none snap-start">
            <Link href={`/product/${id}`} className="block overflow-hidden relative mb-4">

                {salePrice && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] uppercase font-bold px-2 py-1 z-10 tracking-widest">
            Sale
          </span>
                )}

                {/* The aspect-[3/4] forces the portrait shape, object-cover crops it perfectly */}
                <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-100">
                    {mainImage && (
                        <img
                            src={mainImage}
                            alt={title}
                            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700 ease-in-out"
                        />
                    )}
                </div>
            </Link>

            <div className="flex flex-col items-center text-center">
                {/* Added truncate so super long titles don't break the layout */}
                <h3 className="text-sm font-medium text-zinc-900 mb-1.5 w-full truncate px-2">{title}</h3>
                <div className="flex space-x-2 text-sm tracking-wide">
                    {salePrice ? (
                        <>
                            <span className="text-zinc-400 line-through">₹ {formatPrice(price)}</span>
                            <span className="text-zinc-900">₹ {formatPrice(salePrice)}</span>
                        </>
                    ) : (
                        <span className="text-zinc-900">₹ {formatPrice(price)}</span>
                    )}
                </div>
            </div>
        </div>
    );
}