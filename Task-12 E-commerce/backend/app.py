import os
import math
from datetime import timedelta
from decimal import Decimal
from flask import Flask, request, jsonify
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from db import get_db_connection

app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.environ.get("JWT_SECRET_KEY", "super-secret-jwt-key-2026-apexmart-production")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(minutes=15)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=7)

jwt = JWTManager(app)

# In-memory JWT blocklist for token revocation on logout (Bonus feature)
jwt_blocklist = set()

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    jti = jwt_payload.get("jti")
    return jti in jwt_blocklist

# Configure CORS to allow frontend communication with JWT Authorization header
CORS(
    app,
    origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_headers=["Content-Type", "Authorization"]
)

bcrypt = Bcrypt(app)

# Helper function to serialize Decimal / datetime objects to JSON-friendly types
def serialize_row(row_dict):
    if not row_dict:
        return row_dict
    result = {}
    for k, v in row_dict.items():
        if isinstance(v, Decimal):
            result[k] = float(v)
        elif hasattr(v, 'isoformat'):
            result[k] = v.isoformat()
        else:
            result[k] = v
    return result

def serialize_rows(rows_list):
    return [serialize_row(r) for r in rows_list]

def is_admin_user():
    claims = get_jwt()
    return claims.get('role') == 'admin'


# ==========================================
# AUTHENTICATION ROUTES (JWT)
# ==========================================

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'customer')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required.'}), 400

    if role not in ['admin', 'customer']:
        role = 'customer'

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        # Check if email exists
        cursor.execute("SELECT id FROM users WHERE email = %s;", (email,))
        if cursor.fetchone():
            return jsonify({'error': 'An account with this email already exists.'}), 400

        hashed_pw = bcrypt.generate_password_hash(password).decode('utf-8')
        cursor.execute(
            "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s);",
            (name, email, hashed_pw, role)
        )
        conn.commit()
        user_id = cursor.lastrowid

        # Generate JWT tokens
        access_token = create_access_token(
            identity=str(user_id),
            additional_claims={'role': role, 'name': name, 'email': email}
        )
        refresh_token = create_refresh_token(
            identity=str(user_id)
        )

        return jsonify({
            'message': 'Registration successful.',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'role': role
            }
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Registration failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id, name, email, password, role FROM users WHERE email = %s;", (email,))
        user = cursor.fetchone()

        if not user or not bcrypt.check_password_hash(user['password'], password):
            return jsonify({'error': 'Invalid email or password.'}), 401

        # Create tokens — identity is the user ID
        # additional_claims carries extra data
        access_token = create_access_token(
            identity=str(user['id']),
            additional_claims={
                'role': user['role'],
                'name': user['name'],
                'email': user['email']
            }
        )
        refresh_token = create_refresh_token(
            identity=str(user['id'])
        )

        return jsonify({
            'message': 'Login successful.',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
    except Exception as e:
        return jsonify({'error': f'Login error: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, name, email, role FROM users WHERE id = %s;", (user_id,))
        user = cursor.fetchone()
        if not user:
            return jsonify({'error': 'User not found.'}), 404

        new_token = create_access_token(
            identity=str(user_id),
            additional_claims={
                'role': user['role'],
                'name': user['name'],
                'email': user['email']
            }
        )
        return jsonify({'access_token': new_token}), 200
    except Exception as e:
        return jsonify({'error': f'Refresh failed: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/logout', methods=['GET', 'POST'])
@jwt_required(optional=True)
def logout():
    # If a valid token was passed, blacklist its jti so it cannot be reused
    claims = get_jwt()
    if claims and "jti" in claims:
        jwt_blocklist.add(claims["jti"])
    return jsonify({'message': 'Logged out successfully.'}), 200


@app.route('/api/me', methods=['GET'])
@jwt_required()
def get_current_user():
    user_id = get_jwt_identity()
    claims = get_jwt()
    return jsonify({
        'user': {
            'id': int(user_id),
            'name': claims.get('name'),
            'email': claims.get('email'),
            'role': claims.get('role')
        }
    }), 200


# ==========================================
# CATEGORIES & PRODUCT ROUTES (PUBLIC)
# ==========================================

@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.id, c.name, COUNT(p.id) AS product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY c.name ASC;
        """)
        categories = cursor.fetchall()
        return jsonify(serialize_rows(categories)), 200
    finally:
        cursor.close()
        conn.close()


@app.route('/api/products', methods=['GET'])
def get_products():
    category_param = request.args.get('category')
    search_query = request.args.get('search', '').strip()
    sort_option = request.args.get('sort', 'newest')

    # Pagination parameters: ?page=1&limit=8
    try:
        page = max(1, int(request.args.get('page', 1)))
    except (ValueError, TypeError):
        page = 1

    try:
        limit = max(1, int(request.args.get('limit', 8)))
    except (ValueError, TypeError):
        limit = 8

    offset = (page - 1) * limit

    # Base WHERE clause
    where_clauses = []
    params = []

    # Category filtering (by id or by name)
    if category_param:
        if category_param.isdigit():
            where_clauses.append("p.category_id = %s")
            params.append(int(category_param))
        else:
            where_clauses.append("c.name = %s")
            params.append(category_param)

    # Search keyword
    if search_query:
        where_clauses.append("(p.name LIKE %s OR p.description LIKE %s)")
        search_pattern = f"%{search_query}%"
        params.extend([search_pattern, search_pattern])

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    # Sort options: price_asc, price_desc, newest
    if sort_option == 'price_asc':
        order_sql = " ORDER BY p.price ASC, p.id ASC"
    elif sort_option == 'price_desc':
        order_sql = " ORDER BY p.price DESC, p.id DESC"
    else:
        order_sql = " ORDER BY p.created_at DESC, p.id DESC"

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Count total matching records first
        count_query = f"""
            SELECT COUNT(*) AS total
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            {where_sql}
        """
        cursor.execute(count_query, params)
        count_row = cursor.fetchone()
        total = count_row['total'] if count_row else 0
        total_pages = math.ceil(total / limit) if total > 0 else 1

        # 2. Fetch only the current page using LIMIT and OFFSET
        data_query = f"""
            SELECT p.id, p.name, p.description, p.price, p.stock,
                   p.category_id, c.name AS category_name, p.image_url, p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            {where_sql}
            {order_sql}
            LIMIT %s OFFSET %s
        """
        cursor.execute(data_query, params + [limit, offset])
        products = cursor.fetchall()

        return jsonify({
            'products': serialize_rows(products),
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': total_pages
        }), 200
    finally:
        cursor.close()
        conn.close()


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT p.id, p.name, p.description, p.price, p.stock,
                   p.category_id, c.name AS category_name, p.image_url, p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = %s;
        """, (product_id,))
        product = cursor.fetchone()
        if not product:
            return jsonify({'error': 'Product not found.'}), 404
        return jsonify(serialize_row(product)), 200
    finally:
        cursor.close()
        conn.close()


# ==========================================
# PRODUCT MANAGEMENT ROUTES (ADMIN ONLY)
# ==========================================

@app.route('/api/products', methods=['POST'])
@jwt_required()
def create_product():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden: Admin privilege required.'}), 403

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    price = data.get('price')
    stock = data.get('stock')
    category_id = data.get('category_id')
    image_url = data.get('image_url', '').strip()

    if not name or price is None or stock is None:
        return jsonify({'error': 'Product name, price, and stock are required.'}), 400

    try:
        price = float(price)
        stock = int(stock)
        category_id = int(category_id) if category_id else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid price, stock, or category ID.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            INSERT INTO products (name, description, price, stock, category_id, image_url)
            VALUES (%s, %s, %s, %s, %s, %s);
        """, (name, description, price, stock, category_id, image_url))
        conn.commit()
        new_id = cursor.lastrowid

        cursor.execute("""
            SELECT p.id, p.name, p.description, p.price, p.stock,
                   p.category_id, c.name AS category_name, p.image_url, p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = %s;
        """, (new_id,))
        new_product = cursor.fetchone()

        return jsonify({
            'message': 'Product created successfully.',
            'product': serialize_row(new_product)
        }), 201
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to create product: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/products/<int:product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden: Admin privilege required.'}), 403

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    description = data.get('description', '').strip()
    price = data.get('price')
    stock = data.get('stock')
    category_id = data.get('category_id')
    image_url = data.get('image_url', '').strip()

    if not name or price is None or stock is None:
        return jsonify({'error': 'Product name, price, and stock are required.'}), 400

    try:
        price = float(price)
        stock = int(stock)
        category_id = int(category_id) if category_id else None
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid price, stock, or category ID.'}), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM products WHERE id = %s;", (product_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Product not found.'}), 404

        cursor.execute("""
            UPDATE products
            SET name = %s, description = %s, price = %s, stock = %s,
                category_id = %s, image_url = %s
            WHERE id = %s;
        """, (name, description, price, stock, category_id, image_url, product_id))
        conn.commit()

        cursor.execute("""
            SELECT p.id, p.name, p.description, p.price, p.stock,
                   p.category_id, c.name AS category_name, p.image_url, p.created_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = %s;
        """, (product_id,))
        updated_product = cursor.fetchone()

        return jsonify({
            'message': 'Product updated successfully.',
            'product': serialize_row(updated_product)
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to update product: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@jwt_required()
def delete_product(product_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden: Admin privilege required.'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM products WHERE id = %s;", (product_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Product not found.'}), 404

        # Check if product is in order_items
        cursor.execute("SELECT COUNT(*) AS count FROM order_items WHERE product_id = %s;", (product_id,))
        count = cursor.fetchone()['count']
        if count > 0:
            return jsonify({
                'error': 'Cannot delete product because it is associated with existing order records.'
            }), 400

        cursor.execute("DELETE FROM products WHERE id = %s;", (product_id,))
        conn.commit()
        return jsonify({'message': 'Product deleted successfully.'}), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to delete product: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()


# ==========================================
# ORDER ROUTES (CUSTOMER)
# ==========================================

@app.route('/api/orders', methods=['POST'])
@jwt_required()
def place_order():
    user_id = int(get_jwt_identity())

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
            return jsonify({'error': f'Invalid item or quantity in order.'}), 400
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

        # 3. Calculate total amount using unit_price at time of purchase
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
        """, (user_id, float(total_amount), 'Pending', address))
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


@app.route('/api/orders/my', methods=['GET'])
@jwt_required()
def get_my_orders():
    user_id = int(get_jwt_identity())

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT o.id, o.user_id, o.total_amount, o.status, o.address, o.ordered_at
            FROM orders o
            WHERE o.user_id = %s
            ORDER BY o.ordered_at DESC, o.id DESC;
        """, (user_id,))
        orders = cursor.fetchall()

        # Fetch items for each order
        order_list = []
        for order in orders:
            cursor.execute("""
                SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
                       p.name AS product_name, p.image_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s;
            """, (order['id'],))
            items = cursor.fetchall()
            order_data = serialize_row(order)
            order_data['items'] = serialize_rows(items)
            order_list.append(order_data)

        return jsonify(order_list), 200
    finally:
        cursor.close()
        conn.close()


# ==========================================
# ORDER ROUTES & ANALYTICS (ADMIN ONLY)
# ==========================================

@app.route('/api/orders', methods=['GET'])
@app.route('/api/admin/orders', methods=['GET'])
@jwt_required()
def get_all_orders():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden: Admin privilege required.'}), 403

    # Pagination parameters: ?page=1&limit=10
    try:
        page = max(1, int(request.args.get('page', 1)))
    except (ValueError, TypeError):
        page = 1

    try:
        limit = max(1, int(request.args.get('limit', 10)))
    except (ValueError, TypeError):
        limit = 10

    offset = (page - 1) * limit
    search = request.args.get('search', '').strip()
    status = request.args.get('status', '').strip()

    where_clauses = []
    params = []

    if status and status != 'ALL':
        where_clauses.append("o.status = %s")
        params.append(status)

    if search:
        where_clauses.append("(CAST(o.id AS CHAR) LIKE %s OR u.name LIKE %s OR u.email LIKE %s OR o.address LIKE %s)")
        search_pattern = f"%{search}%"
        params.extend([search_pattern, search_pattern, search_pattern, search_pattern])

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Count total matching records
        count_query = f"""
            SELECT COUNT(*) AS total
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            {where_sql}
        """
        cursor.execute(count_query, params)
        count_row = cursor.fetchone()
        total = count_row['total'] if count_row else 0
        total_pages = math.ceil(total / limit) if total > 0 else 1

        # 2. Fetch only the paginated slice
        data_query = f"""
            SELECT o.id, o.user_id, u.name AS customer_name, u.email AS customer_email,
                   o.total_amount, o.status, o.address, o.ordered_at
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            {where_sql}
            ORDER BY o.ordered_at DESC, o.id DESC
            LIMIT %s OFFSET %s
        """
        cursor.execute(data_query, params + [limit, offset])
        orders = cursor.fetchall()

        order_list = []
        for order in orders:
            cursor.execute("""
                SELECT oi.id, oi.order_id, oi.product_id, oi.quantity, oi.unit_price,
                       p.name AS product_name, p.image_url
                FROM order_items oi
                LEFT JOIN products p ON oi.product_id = p.id
                WHERE oi.order_id = %s;
            """, (order['id'],))
            items = cursor.fetchall()
            order_data = serialize_row(order)
            order_data['items'] = serialize_rows(items)
            order_list.append(order_data)

        return jsonify({
            'orders': order_list,
            'total': total,
            'page': page,
            'limit': limit,
            'total_pages': total_pages
        }), 200
    finally:
        cursor.close()
        conn.close()


@app.route('/api/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden: Admin privilege required.'}), 403

    data = request.get_json() or {}
    new_status = data.get('status')
    valid_statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled']

    if not new_status or new_status not in valid_statuses:
        return jsonify({
            'error': f'Invalid status. Allowed statuses: {", ".join(valid_statuses)}'
        }), 400

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM orders WHERE id = %s;", (order_id,))
        if not cursor.fetchone():
            return jsonify({'error': 'Order not found.'}), 404

        cursor.execute("UPDATE orders SET status = %s WHERE id = %s;", (new_status, order_id))
        conn.commit()

        return jsonify({
            'message': 'Order status updated successfully.',
            'order_id': order_id,
            'status': new_status
        }), 200
    except Exception as e:
        conn.rollback()
        return jsonify({'error': f'Failed to update order status: {str(e)}'}), 500
    finally:
        cursor.close()
        conn.close()


@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Forbidden: Admin privilege required.'}), 403

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS total_orders, COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders;")
        order_stats = cursor.fetchone()

        cursor.execute("SELECT COUNT(*) AS total_products FROM products;")
        total_products = cursor.fetchone()['total_products']

        cursor.execute("SELECT COUNT(*) AS low_stock_count FROM products WHERE stock < 5;")
        low_stock_count = cursor.fetchone()['low_stock_count']

        cursor.execute("SELECT COUNT(*) AS total_customers FROM users WHERE role = 'customer';")
        total_customers = cursor.fetchone()['total_customers']

        # Top 5 selling products
        cursor.execute("""
            SELECT p.id, p.name, p.image_url, COALESCE(SUM(oi.quantity), 0) AS units_sold,
                   COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
            FROM products p
            LEFT JOIN order_items oi ON p.id = oi.product_id
            GROUP BY p.id, p.name, p.image_url
            ORDER BY units_sold DESC
            LIMIT 5;
        """)
        top_products = cursor.fetchall()

        return jsonify({
            'total_revenue': float(order_stats['total_revenue']),
            'total_orders': order_stats['total_orders'],
            'total_products': total_products,
            'low_stock_count': low_stock_count,
            'total_customers': total_customers,
            'top_products': serialize_rows(top_products)
        }), 200
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting Flask E-Commerce Server on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
