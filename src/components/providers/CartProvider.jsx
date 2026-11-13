"use client";

import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    const addToCart = (product, size) => {
        setCartItems((prev) => {
            // Check if this exact item and size is already in the cart
            const existingItem = prev.find((item) => item.id === product.id && item.size === size);

            if (existingItem) {
                // If it is, just increase the quantity
                return prev.map((item) =>
                    item.id === product.id && item.size === size
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            // Otherwise, add it as a new item
            return [...prev, { ...product, size, quantity: 1 }];
        });

        // Automatically slide the cart drawer open when an item is added
        setIsCartOpen(true);
    };

    const removeFromCart = (id, size) => {
        setCartItems((prev) => prev.filter((item) => !(item.id === id && item.size === size)));
    };

    // Function to empty the cart after successful checkout
    const clearCart = () => {
        setCartItems([]);
    };

    // Calculate the total number of items in the cart
    const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

    // Calculate the total price
    const cartTotal = cartItems.reduce((total, item) => {
        const price = item.salePrice ? item.salePrice : item.price;
        return total + (price * item.quantity); // Fixed the missing * operator
    }, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            cartCount,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
}

// Custom hook to easily use the cart anywhere in our app
export const useCart = () => useContext(CartContext);