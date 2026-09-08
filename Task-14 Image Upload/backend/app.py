import os
import uuid
import json
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.exceptions import RequestEntityTooLarge
from database import get_db_connection, init_db, row_to_dict

app = Flask(__name__, static_folder='static')
CORS(app, resources={r"/*": {"origins": "*"}})

# -------------------------------------------------------------
# Configuration
# -------------------------------------------------------------
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB in bytes

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE


def allowed_file(filename):
    """Check if the file has an allowed image extension."""
    if not filename or '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[-1].lower()
    return ext in ALLOWED_EXTENSIONS


def delete_file_from_disk(image_url):
    """Safely delete an uploaded file from disk if it exists."""
    if not image_url or not image_url.startswith('/static/uploads/'):
        return
    filename = image_url.replace('/static/uploads/', '')
    # Don't delete sample images or traverse directories
    if filename.startswith('sample_') or '..' in filename:
        return
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
            print(f"[CLEANUP] Deleted file: {filepath}")
        except Exception as e:
            print(f"[CLEANUP ERROR] Could not delete {filepath}: {e}")


# -------------------------------------------------------------
# Error Handlers
# -------------------------------------------------------------
@app.errorhandler(413)
@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({"error": "File size exceeds the 2 MB limit"}), 413


@app.errorhandler(404)
def handle_not_found(e):
    return jsonify({"error": "Resource not found"}), 404


@app.errorhandler(500)
def handle_server_error(e):
    return jsonify({"error": "Internal server error"}), 500


# -------------------------------------------------------------
# Upload Routes
# -------------------------------------------------------------
@app.route('/api/upload', methods=['POST'])
def upload_image():
    """
    Handles single file upload.
    Validates file presence, filename, extension, and generates unique UUID name.
    """
    if 'image' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": "Invalid file type. Allowed extensions are: png, jpg, jpeg, webp"
        }), 400

    # Generate a unique filename so uploads never overwrite
    ext = file.filename.rsplit('.', 1)[-1].lower()
    unique_name = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)

    # Save to disk
    file.save(filepath)

    image_url = f"/static/uploads/{unique_name}"
    return jsonify({
        "message": "Image uploaded successfully",
        "image_url": image_url,
        "filename": unique_name
    }), 201


@app.route('/api/upload/multiple', methods=['POST'])
def upload_multiple_images():
    """
    Bonus: Handles multiple file uploads for product gallery.
    """
    if 'images' not in request.files:
        return jsonify({"error": "No files provided"}), 400

    files = request.files.getlist('images')
    if not files or len(files) == 0:
        return jsonify({"error": "No files selected"}), 400

    uploaded_urls = []
    for file in files:
        if file and file.filename != '' and allowed_file(file.filename):
            ext = file.filename.rsplit('.', 1)[-1].lower()
            unique_name = f"{uuid.uuid4().hex}.{ext}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
            file.save(filepath)
            uploaded_urls.append(f"/static/uploads/{unique_name}")

    if not uploaded_urls:
        return jsonify({"error": "No valid image files could be uploaded"}), 400

    return jsonify({
        "message": f"Successfully uploaded {len(uploaded_urls)} image(s)",
        "image_urls": uploaded_urls
    }), 201


# -------------------------------------------------------------
# Static File Serving Route
# -------------------------------------------------------------
@app.route('/static/uploads/<path:filename>')
def serve_upload(filename):
    """Serve uploaded images from the static/uploads folder."""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


# -------------------------------------------------------------
# Product CRUD Routes
# -------------------------------------------------------------
@app.route('/api/products', methods=['GET'])
def get_products():
    """
    Get all products, with optional query filters:
    - category (filter by category)
    - search (search in name or description)
    """
    category = request.args.get('category')
    search = request.args.get('search')

    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM products WHERE 1=1"
    params = []

    if category and category.lower() != 'all':
        query += " AND LOWER(category) = LOWER(?)"
        params.append(category)

    if search:
        query += " AND (LOWER(name) LIKE LOWER(?) OR LOWER(description) LIKE LOWER(?))"
        search_param = f"%{search}%"
        params.extend([search_param, search_param])

    query += " ORDER BY id DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    products = [row_to_dict(row) for row in rows]
    return jsonify({"products": products, "count": len(products)}), 200


@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    """Get single product details by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({"product": row_to_dict(row)}), 200


@app.route('/api/products', methods=['POST'])
def create_product():
    """
    Create a new product.
    Accepts: name, price, category, description, stock, image_url, gallery_urls
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    name = data.get('name', '').strip()
    price = data.get('price')
    category = data.get('category', 'General').strip()
    description = data.get('description', '').strip()
    stock = data.get('stock', 10)
    image_url = data.get('image_url', '').strip()
    gallery_urls = data.get('gallery_urls', [])

    if not name:
        return jsonify({"error": "Product name is required"}), 400
    if price is None or price == '':
        return jsonify({"error": "Product price is required"}), 400

    try:
        price = float(price)
        if price < 0:
            return jsonify({"error": "Price must be a positive number"}), 400
    except (ValueError, TypeError):
        return jsonify({"error": "Price must be a valid number"}), 400

    try:
        stock = int(stock)
    except (ValueError, TypeError):
        stock = 0

    gallery_json = json.dumps(gallery_urls) if isinstance(gallery_urls, list) else '[]'

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO products (name, price, category, description, stock, image_url, gallery_urls)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (name, price, category, description, stock, image_url, gallery_json))
    product_id = cursor.lastrowid
    conn.commit()

    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    new_product = row_to_dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "message": "Product created successfully",
        "product": new_product
    }), 201


@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    """
    Update an existing product.
    Bonus: If image_url is changed, safely delete the superseded old image file from disk.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    existing = cursor.fetchone()

    if not existing:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    existing_dict = row_to_dict(existing)
    old_image_url = existing_dict.get('image_url')

    name = data.get('name', existing_dict['name']).strip()
    price = data.get('price', existing_dict['price'])
    category = data.get('category', existing_dict['category']).strip()
    description = data.get('description', existing_dict['description']).strip()
    stock = data.get('stock', existing_dict['stock'])
    image_url = data.get('image_url', existing_dict['image_url'])
    gallery_urls = data.get('gallery_urls', existing_dict['gallery_urls'])

    try:
        price = float(price)
    except (ValueError, TypeError):
        conn.close()
        return jsonify({"error": "Price must be a valid number"}), 400

    try:
        stock = int(stock)
    except (ValueError, TypeError):
        stock = 0

    gallery_json = json.dumps(gallery_urls) if isinstance(gallery_urls, list) else '[]'

    # Bonus: Delete old image if it was replaced with a new one
    if old_image_url and image_url and old_image_url != image_url:
        delete_file_from_disk(old_image_url)

    cursor.execute('''
        UPDATE products
        SET name = ?, price = ?, category = ?, description = ?, stock = ?, image_url = ?, gallery_urls = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (name, price, category, description, stock, image_url, gallery_json, product_id))
    conn.commit()

    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    updated_product = row_to_dict(cursor.fetchone())
    conn.close()

    return jsonify({
        "message": "Product updated successfully",
        "product": updated_product
    }), 200


@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    """
    Delete a product.
    Bonus: Clean up the associated image file from disk.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM products WHERE id = ?", (product_id,))
    product = cursor.fetchone()

    if not product:
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    prod_dict = row_to_dict(product)
    image_url = prod_dict.get('image_url')
    gallery_urls = prod_dict.get('gallery_urls', [])

    # Delete primary image
    if image_url:
        delete_file_from_disk(image_url)

    # Delete gallery images
    for g_url in gallery_urls:
        delete_file_from_disk(g_url)

    cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Product and associated images deleted successfully"}), 200


@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get list of all distinct product categories."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != '' ORDER BY category ASC")
    rows = cursor.fetchall()
    conn.close()
    categories = [row['category'] for row in rows]
    return jsonify({"categories": categories}), 200


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "service": "Task-14 Image Upload API"}), 200


# -------------------------------------------------------------
# App Entry Point
# -------------------------------------------------------------
if __name__ == '__main__':
    init_db()
    print("Database initialized successfully.")
    print("Upload folder ready at:", UPLOAD_FOLDER)
    print("Starting Flask server on http://localhost:5000 ...")
    app.run(host='0.0.0.0', port=5000, debug=True)
