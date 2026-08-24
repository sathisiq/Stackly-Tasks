import os
from flask_bcrypt import generate_password_hash
from db import get_server_connection, get_db_connection, DB_NAME

def create_database_and_tables():
    print(f"Connecting to MySQL server to ensure database '{DB_NAME}' exists...")
    server_conn = get_server_connection()
    server_cursor = server_conn.cursor()
    server_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    server_conn.commit()
    server_cursor.close()
    server_conn.close()

    print(f"Connecting to database '{DB_NAME}' to set up tables...")
    conn = get_db_connection()
    cursor = conn.cursor()

    # Drop existing tables if re-seeding cleanly
    cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
    cursor.execute("DROP TABLE IF EXISTS order_items;")
    cursor.execute("DROP TABLE IF EXISTS orders;")
    cursor.execute("DROP TABLE IF EXISTS products;")
    cursor.execute("DROP TABLE IF EXISTS categories;")
    cursor.execute("DROP TABLE IF EXISTS users;")
    cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")

    # 1. users table
    cursor.execute("""
    CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin','customer') DEFAULT 'customer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. categories table
    cursor.execute("""
    CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE
    );
    """)

    # 3. products table
    cursor.execute("""
    CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        category_id INT,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
    """)

    # 4. orders table
    cursor.execute("""
    CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
        address TEXT NOT NULL,
        ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 5. order_items table
    cursor.execute("""
    CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    );
    """)

    conn.commit()
    print("All tables created successfully.")
    return conn, cursor

def seed_data(conn, cursor):
    print("Seeding initial users...")
    admin_pw = generate_password_hash("admin123").decode('utf-8')
    cust_pw = generate_password_hash("customer123").decode('utf-8')

    users_data = [
        ("Admin User", "admin@ecommerce.com", admin_pw, "admin"),
        ("John Customer", "customer@ecommerce.com", cust_pw, "customer"),
        ("Sarah Jenkins", "sarah@example.com", cust_pw, "customer")
    ]
    cursor.executemany(
        "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s);",
        users_data
    )

    print("Seeding categories...")
    categories = [
        ("Electronics",),
        ("Fashion & Apparel",),
        ("Home & Living",),
        ("Books & Stationery",),
        ("Sports & Fitness",)
    ]
    cursor.executemany("INSERT INTO categories (name) VALUES (%s);", categories)
    conn.commit()

    # Retrieve category IDs
    cursor.execute("SELECT id, name FROM categories;")
    cat_map = {name: cid for cid, name in cursor.fetchall()}

    print("Seeding 24 products in Indian Rupees (INR)...")
    products = [
        # Electronics
        (
            "Sony WH-1000XM5 Wireless Headphones",
            "Industry-leading noise canceling with two processors and 8 microphones. Up to 30-hour battery life with quick charging.",
            29990.00,
            18,
            cat_map["Electronics"],
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Apple MacBook Pro 14-inch M3",
            "Next-generation Apple silicon with blazing performance, Liquid Retina XDR display, and all-day battery life.",
            169900.00,
            10,
            cat_map["Electronics"],
            "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Mechanical RGB Gaming Keyboard",
            "Custom hot-swappable tactile mechanical switches, sound dampening foam, and per-key RGB backlighting.",
            4999.00,
            25,
            cat_map["Electronics"],
            "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Ultra-Wide 34-inch Curved Gaming Monitor",
            "144Hz refresh rate, 1ms response time, HDR400 with immersive 1500R curvature for professional work and gaming.",
            38500.00,
            7,
            cat_map["Electronics"],
            "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Logitech MX Master 3S Wireless Mouse",
            "Quiet clicks and 8K DPI tracking on glass surface. MagSpeed electromagnetic scrolling.",
            8995.00,
            30,
            cat_map["Electronics"],
            "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&auto=format&fit=crop&q=60"
        ),

        # Fashion & Apparel
        (
            "Classic Vintage Leather Jacket",
            "Handcrafted genuine full-grain leather biker jacket with soft quilted lining and heavy-duty YKK zippers.",
            12499.00,
            12,
            cat_map["Fashion & Apparel"],
            "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Minimalist White Canvas Sneakers",
            "Everyday low-top sneakers crafted from sustainable organic canvas with cushioned memory foam insole.",
            3499.00,
            20,
            cat_map["Fashion & Apparel"],
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Polarized Aviator Sunglasses",
            "Timeless classic metal frame sunglasses offering 100% UV400 protection and glare reduction.",
            2199.00,
            40,
            cat_map["Fashion & Apparel"],
            "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Premium Merino Wool Knit Sweater",
            "Ultra-soft, breathable, and temperature-regulating crewneck sweater for effortless casual layering.",
            4799.00,
            15,
            cat_map["Fashion & Apparel"],
            "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Modern Urban Waterproof Backpack",
            "25L roll-top commuter backpack with dedicated 16-inch laptop compartment and weather-sealed pockets.",
            3999.00,
            22,
            cat_map["Fashion & Apparel"],
            "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=60"
        ),

        # Home & Living
        (
            "Handmade Ceramic Pour-Over Coffee Dripper",
            "Artisanal matte ceramic coffee maker for rich, clean pour-over brewing. Heat-retentive design.",
            1899.00,
            18,
            cat_map["Home & Living"],
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Nordic Minimalist Desk Lamp",
            "Dimmable LED architect desk lamp with natural wood arm and matte finish metal shade.",
            2999.00,
            14,
            cat_map["Home & Living"],
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Organic Aromatherapy Scented Candle Set",
            "Hand-poured 100% natural soy wax candles infused with lavender, sandalwood, and eucalyptus essential oils.",
            1499.00,
            35,
            cat_map["Home & Living"],
            "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Indoor Succulent & Ceramic Planter Set",
            "Set of 3 assorted low-maintenance live indoor succulents in handcrafted geometric ceramic pots.",
            1299.00,
            16,
            cat_map["Home & Living"],
            "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Luxury Egyptian Cotton Bath Towel Set",
            "Plush 700 GSM 4-piece bath towel set with ultra-absorbent combed cotton fibers.",
            2799.00,
            20,
            cat_map["Home & Living"],
            "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=800&auto=format&fit=crop&q=60"
        ),

        # Books & Stationery
        (
            "Designing Data-Intensive Applications",
            "The definitive guide to the principles and architecture behind modern data storage and processing systems.",
            2250.00,
            15,
            cat_map["Books & Stationery"],
            "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Refillable Genuine Leather Journal",
            "Handcrafted rustic leather-bound notebook with 200 pages of bleed-proof archival deckle edge paper.",
            1450.00,
            28,
            cat_map["Books & Stationery"],
            "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Brass Fountain Pen with Gold Nib",
            "Precision-weighted solid brass fountain pen with fine iridium point nib and piston converter.",
            2890.00,
            19,
            cat_map["Books & Stationery"],
            "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Clean Code: Agile Software Craftsmanship",
            "Robert C. Martin's revolutionary handbook on software craft, patterns, and writing maintainable code.",
            1899.00,
            12,
            cat_map["Books & Stationery"],
            "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=800&auto=format&fit=crop&q=60"
        ),

        # Sports & Fitness
        (
            "High-Density Non-Slip Yoga Mat (6mm)",
            "Eco-friendly TPE alignment yoga mat with optimal cushioning and anti-tear mesh for Pilates and yoga.",
            1999.00,
            25,
            cat_map["Sports & Fitness"],
            "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Adjustable Dumbbell Set (2.5 - 24 kg)",
            "Space-saving selectorized dumbbell system that replaces 15 sets of weights with an intuitive turn dial.",
            18990.00,
            8,
            cat_map["Sports & Fitness"],
            "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Insulated Stainless Steel Water Bottle (1 Litre)",
            "Double-wall vacuum insulated canteen keeps drinks ice-cold for 24 hours or piping hot for 12 hours.",
            1299.00,
            50,
            cat_map["Sports & Fitness"],
            "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Speed Jump Rope with Ball Bearings",
            "Tangle-free adjustable steel wire jump rope with ergonomic aluminum handles for cardio and CrossFit.",
            899.00,
            30,
            cat_map["Sports & Fitness"],
            "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&auto=format&fit=crop&q=60"
        ),
        (
            "Deep Tissue Percussion Muscle Massage Gun",
            "Ultra-quiet brushless motor with 6 interchangeable massage heads and 20 speed levels for recovery.",
            5499.00,
            3,  # Low stock test product (< 5)
            cat_map["Sports & Fitness"],
            "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop&q=60"
        )
    ]

    cursor.executemany("""
    INSERT INTO products (name, description, price, stock, category_id, image_url)
    VALUES (%s, %s, %s, %s, %s, %s);
    """, products)
    conn.commit()

    print("Seeding sample initial order in INR...")
    cursor.execute("SELECT id FROM users WHERE email='customer@ecommerce.com';")
    customer_user_id = cursor.fetchone()[0]

    # Create sample order in INR (Sony headphones + Canvas sneakers = 29990 + 3499 = 33489)
    cursor.execute("""
    INSERT INTO orders (user_id, total_amount, status, address)
    VALUES (%s, %s, %s, %s);
    """, (customer_user_id, 33489.00, "Confirmed", "Flat 402, Green Meadows, MG Road, Bengaluru, Karnataka 560001"))
    sample_order_id = cursor.lastrowid

    cursor.execute("SELECT id, price FROM products WHERE name LIKE 'Sony WH-1000XM5%';")
    prod1 = cursor.fetchone()
    cursor.execute("SELECT id, price FROM products WHERE name LIKE 'Minimalist White Canvas%';")
    prod2 = cursor.fetchone()

    if prod1 and prod2:
        cursor.execute("""
        INSERT INTO order_items (order_id, product_id, quantity, unit_price)
        VALUES (%s, %s, %s, %s), (%s, %s, %s, %s);
        """, (sample_order_id, prod1[0], 1, prod1[1], sample_order_id, prod2[0], 1, prod2[1]))
        conn.commit()

    print("Database seeding in INR completed successfully!")

if __name__ == "__main__":
    try:
        conn, cursor = create_database_and_tables()
        seed_data(conn, cursor)
        cursor.close()
        conn.close()
        print("\nSeed summary:")
        print(" - Database: ecommerce")
        print(" - Currency: Indian Rupees (INR / Rs.)")
        print(" - Admin account: admin@ecommerce.com / admin123")
        print(" - Customer account: customer@ecommerce.com / customer123")
    except Exception as e:
        print(f"Error during seeding: {e}")
