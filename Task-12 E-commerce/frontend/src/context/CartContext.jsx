import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('apexmart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage', e);
      return [];
    }
  });

  // Save to localStorage whenever cart changes
  useEffect(() => {
    try {
      localStorage.setItem('apexmart_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  function addToCart(product, quantity = 1) {
    if (!product || !product.id) return;
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = existing.qty + qtyToAdd;
        // Cap at available stock if stock is known
        const cappedQty = product.stock !== undefined ? Math.min(newQty, product.stock) : newQty;
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: cappedQty } : item
        );
      }
      return [...prev, {
        id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        image_url: product.image_url,
        stock: product.stock,
        category_name: product.category_name,
        qty: product.stock !== undefined ? Math.min(qtyToAdd, product.stock) : qtyToAdd
      }];
    });
  }

  function updateQuantity(id, quantity) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          const validQty = item.stock !== undefined ? Math.min(qty, item.stock) : qty;
          return { ...item, qty: validQty };
        }
        return item;
      })
    );
  }

  function removeFromCart(id) {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }

  function clearCart() {
    setCartItems([]);
  }

  // Calculated values
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
