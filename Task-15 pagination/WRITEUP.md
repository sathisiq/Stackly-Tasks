# Task 12: E-Commerce Platform — Technical Write-Up & Conceptual Q&A

---

## 1. What is React Context API and why is it better than prop drilling for the cart? Give a real example from your code.

### Concept:
In React, state traditionally flows downwards via props from parent to child components. When multiple deeply nested or sibling components need access to the same shared state (such as the shopping cart count in the `Navbar`, the "Add to Cart" action in `ProductCard` / `ProductDetail`, and the checkout calculations in `Cart` and `Checkout`), passing props through intermediate components that do not need that data themselves is called **prop drilling**.

Prop drilling creates fragile code, bloats intermediate component signatures, and makes refactoring painful.

**React Context API** provides a built-in mechanism for **global state management**. It creates a centralized data store via `createContext()`. A `<CartProvider>` wraps the entire component tree, allowing *any* descendant component anywhere in the application tree to directly read or update the cart state using a custom hook (`useCart()`) without touching intervening components.

### Real Code Example from Our Project:

#### A. Context Definition & Provider (`frontend/src/context/CartContext.jsx`):
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('apexmart_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('apexmart_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  function addToCart(product, quantity = 1) {
    if (!product || !product.id) return;
    const qtyToAdd = Math.max(1, parseInt(quantity, 10) || 1);

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        const newQty = existing.qty + qtyToAdd;
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

  function removeFromCart(id) {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }

  function clearCart() {
    setCartItems([]);
  }

  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      cartCount,
      cartTotal
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
```

#### B. Direct Consumption across Components:
- **Navbar (`frontend/src/components/Navbar.jsx`)** accesses `cartCount` directly to display the live red badge without needing props from `App.jsx`:
  ```javascript
  const { cartCount } = useCart();
  // Render badge:
  {cartCount > 0 && <span className="badge">{cartCount}</span>}
  ```
- **Product Card (`frontend/src/components/ProductCard.jsx`)** triggers `addToCart` with 1 click:
  ```javascript
  const { addToCart } = useCart();
  // On click:
  addToCart(product, 1);
  ```
- **Cart Page (`frontend/src/pages/Cart.jsx`)** computes item subtotals and clear cart seamlessly:
  ```javascript
  const { cartItems, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
  ```

---

## 2. Why does `order_items` store `unit_price` instead of reading the product price at the time of display?

### Financial & Audit Integrity:
Product catalog prices are dynamic and fluctuate over time due to:
1. Inflation or price updates
2. Seasonal discounts and promotional sales (e.g. Black Friday discounts)
3. Inventory adjustments or supplier cost changes

If the `order_items` table merely stored `product_id` and referenced `products.price` dynamically when generating an invoice or order history, any future price alteration would **retroactively alter the financial records and order totals of past orders**.

### Real-world Consequence if `unit_price` was omitted:
- A customer buys a pair of headphones on sale for **$199.99**.
- Next month, the merchant restores the regular price to **$349.99**.
- When the customer looks at their order receipt in `/orders`, without a recorded `unit_price`, the system would display $349.99 instead of the $199.99 the customer actually paid. This creates severe accounting discrepancies, invoice disputes, and tax audit violations.

### The Solution:
By persisting `unit_price DECIMAL(10,2)` in `order_items` at the exact moment of order placement:
```sql
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);
```
The database records an immutable financial snapshot of the transaction terms at checkout time.

---

## 3. What happens in your backend if a customer tries to order 10 units of a product that only has 3 in stock? Show the exact validation code.

### Backend Behavior:
1. When `POST /api/orders` is called, the backend queries the database with `SELECT id, name, price, stock FROM products WHERE id IN (...) FOR UPDATE;` to lock and inspect current stock levels.
2. For each requested item, the backend compares the requested quantity against `product['stock']`.
3. If any item has `requested_qty > available_stock` (e.g., requested 10, available 3):
   - The backend **immediately halts execution**.
   - **No order record** is inserted.
   - **No stock is decremented** for any item in the cart.
   - The backend responds with **HTTP status `400 Bad Request`** and a clear descriptive error message:
     `"Insufficient stock for 'Deep Tissue Percussion Muscle Massage Gun'. Requested: 10, Available: 3."`

### Exact Validation Code from `backend/app.py`:

```python
@app.route('/api/orders', methods=['POST'])
def place_order():
    user = require_auth()
    if not user:
        return jsonify({'error': 'Authentication required to place an order.'}), 401

    data = request.get_json() or {}
    items = data.get('items', [])
    address = data.get('address', '').strip()

    if not items or not isinstance(items, list):
        return jsonify({'error': 'Your cart is empty. Please add items to order.'}), 400

    if not address:
        return jsonify({'error': 'Delivery address is required.'}), 400

    # Clean & consolidate items list by product_id
    item_quantities = {}
    for item in items:
        pid = item.get('product_id') or item.get('id')
        qty = item.get('quantity') or item.get('qty', 1)
        if not pid or qty <= 0:
            return jsonify({'error': 'Invalid item or quantity in order.'}), 400
        item_quantities[pid] = item_quantities.get(pid, 0) + int(qty)

    product_ids = list(item_quantities.keys())

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # 1. Fetch current product details from database for validation
        format_strings = ','.join(['%s'] * len(product_ids))
        cursor.execute(f"""
            SELECT id, name, price, stock
            FROM products
            WHERE id IN ({format_strings})
            FOR UPDATE;
        """, tuple(product_ids))
        db_products = {p['id']: p for p in cursor.fetchall()}

        # Verify all products exist
        for pid in product_ids:
            if pid not in db_products:
                return jsonify({'error': f'Product ID {pid} does not exist.'}), 400

        # 2. CRITICAL STOCK RULE:
        # Check stock >= requested quantity for every item BEFORE reducing stock or creating order
        for pid, requested_qty in item_quantities.items():
            product = db_products[pid]
            available_stock = product['stock']
            if requested_qty > available_stock:
                return jsonify({
                    'error': f"Insufficient stock for '{product['name']}'. Requested: {requested_qty}, Available: {available_stock}."
                }), 400

        # 3. Calculate total amount using snapshot price
        total_amount = Decimal('0.00')
        order_line_items = []
        for pid, requested_qty in item_quantities.items():
            product = db_products[pid]
            unit_price = Decimal(str(product['price']))
            total_amount += unit_price * requested_qty
            order_line_items.append({
                'product_id': pid,
                'quantity': requested_qty,
                'unit_price': unit_price,
                'name': product['name']
            })

        # 4. Insert order
        cursor.execute("""
            INSERT INTO orders (user_id, total_amount, status, address)
            VALUES (%s, %s, %s, %s);
        """, (user['id'], float(total_amount), 'Pending', address))
        order_id = cursor.lastrowid

        # 5. Insert order_items and reduce product stock
        for line in order_line_items:
            cursor.execute("""
                INSERT INTO order_items (order_id, product_id, quantity, unit_price)
                VALUES (%s, %s, %s, %s);
            """, (order_id, line['product_id'], line['quantity'], float(line['unit_price'])))

            cursor.execute("""
                UPDATE products
                SET stock = stock - %s
                WHERE id = %s;
            """, (line['quantity'], line['product_id']))

        conn.commit()

        return jsonify({
            'message': 'Order placed successfully!',
            'order_id': order_id,
            'total_amount': float(total_amount),
            'status': 'Pending'
        }), 201

    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to place order: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()
```

---

## 4. What is the difference between `ProtectedRoute` and `AdminRoute` in your app? Show both components.

### Distinction:
| Feature | `ProtectedRoute` | `AdminRoute` |
| :--- | :--- | :--- |
| **Purpose** | Guarantees that the visitor is an authenticated user (customer or admin). | Guarantees that the visitor is authenticated AND has the specific role `'admin'`. |
| **Use Cases** | `/checkout`, `/orders` (Customer order history). | `/admin/products`, `/admin/products/add`, `/admin/products/edit/:id`, `/admin/orders`, `/admin/dashboard`. |
| **Unauthorized Action** | Redirects to `/login`, preserving current `location` in state for seamless redirect after login. | Redirects non-admin visitors directly back to the public homepage `/`. |

### Exact Code of Both Components:

#### A. `ProtectedRoute.jsx` (`frontend/src/components/ProtectedRoute.jsx`):
```jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
```

#### B. `AdminRoute.jsx` (`frontend/src/components/AdminRoute.jsx`):
```jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
```
