import unittest
import math
from unittest.mock import MagicMock, patch
from app import app

class TestPaginationEndpoints(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_pagination_math(self):
        # 47 products, 8 per page -> page 3
        total = 47
        limit = 8
        page = 3
        offset = (page - 1) * limit
        total_pages = math.ceil(total / limit)

        self.assertEqual(limit, 8)
        self.assertEqual(offset, 16)
        self.assertEqual(total_pages, 6)

    @patch('app.get_db_connection')
    def test_get_products_pagination_response_format(self, mock_db_conn):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db_conn.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Mock count result: 47 products
        mock_cursor.fetchone.return_value = {'total': 47}

        # Mock page 1 results: 8 products
        sample_products = [
            {
                'id': i,
                'name': f'Product {i}',
                'description': f'Description {i}',
                'price': 100.0,
                'stock': 10,
                'category_id': 1,
                'category_name': 'Electronics',
                'image_url': 'http://example.com/img.jpg',
                'created_at': None
            }
            for i in range(1, 9)
        ]
        mock_cursor.fetchall.return_value = sample_products

        # Request page 2, limit 8, search "test"
        response = self.client.get('/api/products?page=2&limit=8&search=test&category=1&sort=price_asc')
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIn('products', data)
        self.assertIn('total', data)
        self.assertIn('page', data)
        self.assertIn('limit', data)
        self.assertIn('total_pages', data)

        self.assertEqual(data['page'], 2)
        self.assertEqual(data['limit'], 8)
        self.assertEqual(data['total'], 47)
        self.assertEqual(data['total_pages'], 6)
        self.assertEqual(len(data['products']), 8)

        # Verify SQL queries executed
        calls = mock_cursor.execute.call_args_list
        # 1st call is COUNT query
        count_sql, count_params = calls[0][0]
        self.assertIn("SELECT COUNT(*) AS total", count_sql)
        self.assertIn("p.category_id = %s", count_sql)
        self.assertIn("(p.name LIKE %s OR p.description LIKE %s)", count_sql)

        # 2nd call is paginated query with LIMIT and OFFSET
        data_sql, data_params = calls[1][0]
        self.assertIn("LIMIT %s OFFSET %s", data_sql)
        # Parameters should end with limit (8) and offset ((2 - 1) * 8 = 8)
        self.assertEqual(data_params[-2:], [8, 8])

    @patch('app.require_admin')
    @patch('app.get_db_connection')
    def test_get_orders_pagination_response_format(self, mock_db_conn, mock_require_admin):
        mock_require_admin.return_value = {'id': 1, 'role': 'admin'}
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db_conn.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor

        # Mock count result: 25 orders
        mock_cursor.fetchone.return_value = {'total': 25}

        sample_orders = [
            {
                'id': i,
                'user_id': i,
                'customer_name': f'User {i}',
                'customer_email': f'user{i}@example.com',
                'total_amount': 500.0,
                'status': 'Pending',
                'address': '123 Test Street',
                'ordered_at': None
            }
            for i in range(1, 11)
        ]
        mock_cursor.fetchall.side_effect = [
            sample_orders, # from orders query
            *([[]] * 10)   # 10 empty order item queries
        ]

        response = self.client.get('/api/orders?page=1&limit=10')
        self.assertEqual(response.status_code, 200)

        data = response.get_json()
        self.assertIn('orders', data)
        self.assertIn('total', data)
        self.assertIn('page', data)
        self.assertIn('limit', data)
        self.assertIn('total_pages', data)

        self.assertEqual(data['page'], 1)
        self.assertEqual(data['limit'], 10)
        self.assertEqual(data['total'], 25)
        self.assertEqual(data['total_pages'], 3)

if __name__ == '__main__':
    unittest.main()
