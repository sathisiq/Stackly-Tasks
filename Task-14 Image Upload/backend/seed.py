import os
import json
from PIL import Image, ImageDraw, ImageFont
from database import get_db_connection, init_db

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def create_sample_image(filename, title, color_bg, color_accent):
    """Generate a clean mock product image and save directly to static/uploads."""
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    if os.path.exists(filepath):
        return f"/static/uploads/{filename}"

    img = Image.new('RGB', (600, 600), color=color_bg)
    draw = ImageDraw.Draw(img)

    # Draw stylish rounded rect / card in center
    draw.rectangle([40, 40, 560, 560], fill=color_bg, outline=color_accent, width=4)
    draw.ellipse([200, 160, 400, 360], fill=color_accent)

    # Draw label text
    try:
        # Fallback font
        draw.text((300, 440), title, fill=(255, 255, 255), anchor="mm")
    except Exception:
        draw.text((220, 440), title, fill=(255, 255, 255))

    img.save(filepath, format='JPEG', quality=90)
    return f"/static/uploads/{filename}"

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as count FROM products")
    count = cursor.fetchone()['count']
    if count > 0:
        print(f"Database already has {count} products. Skipping seeding.")
        conn.close()
        return

    # Create sample static files
    img1 = create_sample_image("sample_headphone.jpg", "Wireless Headphones", (30, 41, 59), (59, 130, 246))
    img2 = create_sample_image("sample_watch.jpg", "Smartwatch Pro", (15, 23, 42), (16, 185, 129))
    img3 = create_sample_image("sample_keyboard.jpg", "Mechanical Keyboard", (45, 55, 72), (245, 158, 11))
    img4 = create_sample_image("sample_sneakers.jpg", "Urban Runner Shoes", (67, 56, 202), (236, 72, 153))

    sample_products = [
        (
            "Aura ANC Wireless Headphones",
            2499.00,
            "Electronics",
            "Premium active noise-canceling over-ear headphones with 40-hour battery life and spatial audio support.",
            25,
            img1,
            json.dumps([])
        ),
        (
            "Chronos Smartwatch Pro",
            3999.00,
            "Wearables",
            "Flagship fitness smartwatch with AMOLED display, heart-rate tracking, GPS, and 7-day battery life.",
            18,
            img2,
            json.dumps([])
        ),
        (
            "Vortex RGB Mechanical Keyboard",
            1899.00,
            "Accessories",
            "Hot-swappable mechanical gaming keyboard with customizable RGB backlighting and tactile switches.",
            30,
            img3,
            json.dumps([])
        ),
        (
            "Aero Urban Runner Shoes",
            2999.00,
            "Footwear",
            "Breathable lightweight sneakers designed for maximum comfort and durability during long runs.",
            14,
            img4,
            json.dumps([])
        ),
        (
            "Minimalist Desk Pad (No Image Item)",
            499.00,
            "Accessories",
            "Eco-friendly vegan leather desk mat for sleek workstation organization (Demonstrates 'No image' fallback).",
            50,
            "",
            json.dumps([])
        )
    ]

    cursor.executemany('''
        INSERT INTO products (name, price, category, description, stock, image_url, gallery_urls)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', sample_products)

    conn.commit()
    conn.close()
    print("Database seeded with sample products successfully!")

if __name__ == '__main__':
    seed_database()
