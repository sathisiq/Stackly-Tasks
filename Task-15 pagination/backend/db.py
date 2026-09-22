import os
import mysql.connector

# Database Configuration with Environment Variable support and local defaults
DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_USER = os.environ.get("DB_USER", "root")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "Sathis@2002")
DB_NAME = os.environ.get("DB_NAME", "ecommerce")
DB_PORT = int(os.environ.get("DB_PORT", 3306))

def get_server_connection():
    """Connect to MySQL server without specifying a database (used for initialization/seed)."""
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )

def get_db_connection():
    """Connect to the 'ecommerce' MySQL database."""
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT
    )
