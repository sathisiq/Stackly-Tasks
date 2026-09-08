import os
import sqlite3
import json

DB_FILE = os.path.join(os.path.dirname(__file__), 'ecommerce.db')

def get_db_connection():
    """Create and return a database connection with dict-like row access."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database tables for products and product images."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Products table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            stock INTEGER DEFAULT 10,
            image_url TEXT,
            gallery_urls TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def row_to_dict(row):
    """Convert a sqlite3.Row object to a standard Python dictionary."""
    if row is None:
        return None
    d = dict(row)
    if 'gallery_urls' in d and d['gallery_urls']:
        try:
            d['gallery_urls'] = json.loads(d['gallery_urls'])
        except Exception:
            d['gallery_urls'] = []
    else:
        d['gallery_urls'] = []
    return d
