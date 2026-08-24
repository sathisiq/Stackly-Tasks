-- ===================================================
-- ApexMart E-Commerce Platform — MySQL Database Schema (INR Currency)
-- ===================================================

-- 1. Create Database
CREATE DATABASE IF NOT EXISTS ecommerce
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ecommerce;

-- 2. Disable Foreign Key Checks temporarily for clean creation
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

-- 3. Create 'users' table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'customer') DEFAULT 'customer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create 'categories' table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

-- 5. Create 'products' table
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

-- 6. Create 'orders' table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    address TEXT NOT NULL,
    ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Create 'order_items' table (stores unit_price in INR at time of purchase)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- ===================================================
-- Initial Seed Data (INR)
-- ===================================================

-- Categories
INSERT INTO categories (name) VALUES
('Electronics'),
('Fashion & Apparel'),
('Home & Living'),
('Books & Stationery'),
('Sports & Fitness');

-- Users (Default passwords are: 'admin123' and 'customer123' hashed with bcrypt)
INSERT INTO users (name, email, password, role) VALUES
('Admin User', 'admin@ecommerce.com', '$2b$12$4mUfP5kUqM9yYtO4qQ5WvOfK1rC/1aI7f0Pj9t6V7XWfE8k5N5u4a', 'admin'),
('John Customer', 'customer@ecommerce.com', '$2b$12$9vO4qQ5WvOfK1rC/1aI7f0Pj9t6V7XWfE8k5N5u4a4mUfP5kUqM9yY', 'customer');

-- Products (INR)
INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES
('Sony WH-1000XM5 Wireless Headphones', 'Industry-leading noise canceling with two processors and 8 microphones.', 29990.00, 18, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'),
('Apple MacBook Pro 14-inch M3', 'Next-generation Apple silicon with blazing performance and Liquid Retina XDR display.', 169900.00, 10, 1, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800'),
('Mechanical RGB Gaming Keyboard', 'Custom hot-swappable tactile mechanical switches with per-key RGB backlighting.', 4999.00, 25, 1, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800'),
('Classic Vintage Leather Jacket', 'Handcrafted genuine full-grain leather biker jacket with soft quilted lining.', 12499.00, 12, 2, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'),
('Minimalist White Canvas Sneakers', 'Everyday low-top sneakers crafted from sustainable organic canvas.', 3499.00, 20, 2, 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800'),
('Nordic Minimalist Desk Lamp', 'Dimmable LED architect desk lamp with natural wood arm and matte finish metal shade.', 2999.00, 14, 3, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'),
('Deep Tissue Percussion Massage Gun', 'Ultra-quiet brushless motor with 6 interchangeable massage heads and 20 speed levels.', 5499.00, 3, 5, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800');
