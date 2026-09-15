import unittest
from unittest.mock import MagicMock, patch
from flask_bcrypt import generate_password_hash
from app import app, jwt_blocklist

class TestJWTAuthentication(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.client = app.test_client()
        jwt_blocklist.clear()

        self.customer_password = 'customer123'
        self.customer_hash = generate_password_hash(self.customer_password).decode('utf-8')
        self.customer_user = {
            'id': 2,
            'name': 'John Customer',
            'email': 'customer@ecommerce.com',
            'password': self.customer_hash,
            'role': 'customer'
        }

        self.admin_password = 'admin123'
        self.admin_hash = generate_password_hash(self.admin_password).decode('utf-8')
        self.admin_user = {
            'id': 1,
            'name': 'Admin User',
            'email': 'admin@ecommerce.com',
            'password': self.admin_hash,
            'role': 'admin'
        }

    @patch('app.get_db_connection')
    def test_01_login_success_returns_jwt_tokens(self, mock_db):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.customer_user

        response = self.client.post('/api/login', json={
            'email': 'customer@ecommerce.com',
            'password': 'customer123'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()

        # Verify access_token and refresh_token are returned
        self.assertIn('access_token', data)
        self.assertIn('refresh_token', data)
        self.assertIn('user', data)
        self.assertEqual(data['user']['email'], 'customer@ecommerce.com')
        self.assertEqual(data['user']['role'], 'customer')

        # Verify no session cookies are set
        set_cookie = response.headers.get('Set-Cookie', '')
        self.assertNotIn('session', set_cookie)

    @patch('app.get_db_connection')
    def test_02_login_invalid_password_returns_401(self, mock_db):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.customer_user

        response = self.client.post('/api/login', json={
            'email': 'customer@ecommerce.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 401)
        data = response.get_json()
        self.assertIn('error', data)

    def test_03_protected_route_without_token_returns_401(self):
        # Access /api/orders/my without Authorization header
        response = self.client.get('/api/orders/my')
        self.assertEqual(response.status_code, 401)

    @patch('app.get_db_connection')
    def test_04_protected_route_with_valid_token_returns_200(self, mock_db):
        # 1. Login to obtain access token
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.customer_user

        login_res = self.client.post('/api/login', json={
            'email': 'customer@ecommerce.com',
            'password': 'customer123'
        })
        token = login_res.get_json()['access_token']

        # 2. Access protected route with Bearer token
        mock_cursor.fetchall.return_value = []
        response = self.client.get('/api/orders/my', headers={
            'Authorization': f'Bearer {token}'
        })
        self.assertEqual(response.status_code, 200)

    @patch('app.get_db_connection')
    def test_05_admin_route_forbidden_for_customer(self, mock_db):
        # 1. Login as customer
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.customer_user

        login_res = self.client.post('/api/login', json={
            'email': 'customer@ecommerce.com',
            'password': 'customer123'
        })
        customer_token = login_res.get_json()['access_token']

        # 2. Attempt to access admin routes with customer token
        response = self.client.get('/api/orders', headers={
            'Authorization': f'Bearer {customer_token}'
        })
        self.assertEqual(response.status_code, 403)

        response_stats = self.client.get('/api/admin/stats', headers={
            'Authorization': f'Bearer {customer_token}'
        })
        self.assertEqual(response_stats.status_code, 403)

    @patch('app.get_db_connection')
    def test_06_admin_route_accessible_by_admin(self, mock_db):
        # 1. Login as admin
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.admin_user

        login_res = self.client.post('/api/login', json={
            'email': 'admin@ecommerce.com',
            'password': 'admin123'
        })
        admin_token = login_res.get_json()['access_token']

        # 2. Access admin stats
        mock_cursor.fetchone.side_effect = [
            {'total_orders': 10, 'total_revenue': 50000.0},
            {'total_products': 25},
            {'low_stock_count': 2},
            {'total_customers': 15}
        ]
        mock_cursor.fetchall.return_value = []

        response = self.client.get('/api/admin/stats', headers={
            'Authorization': f'Bearer {admin_token}'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['total_orders'], 10)
        self.assertEqual(data['total_revenue'], 50000.0)

    @patch('app.get_db_connection')
    def test_07_refresh_token_issues_new_access_token(self, mock_db):
        # 1. Login as customer
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.customer_user

        login_res = self.client.post('/api/login', json={
            'email': 'customer@ecommerce.com',
            'password': 'customer123'
        })
        refresh_token = login_res.get_json()['refresh_token']

        # 2. Request new access token using refresh token
        mock_cursor.fetchone.return_value = self.customer_user
        refresh_res = self.client.post('/api/refresh', headers={
            'Authorization': f'Bearer {refresh_token}'
        })
        self.assertEqual(refresh_res.status_code, 200)
        new_token = refresh_res.get_json().get('access_token')
        self.assertIsNotNone(new_token)

        # 3. Use new token to access protected route
        mock_cursor.fetchall.return_value = []
        orders_res = self.client.get('/api/orders/my', headers={
            'Authorization': f'Bearer {new_token}'
        })
        self.assertEqual(orders_res.status_code, 200)

    @patch('app.get_db_connection')
    def test_08_logout_blacklists_token(self, mock_db):
        # 1. Login
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.customer_user

        login_res = self.client.post('/api/login', json={
            'email': 'customer@ecommerce.com',
            'password': 'customer123'
        })
        access_token = login_res.get_json()['access_token']

        # 2. Logout with token
        logout_res = self.client.post('/api/logout', headers={
            'Authorization': f'Bearer {access_token}'
        })
        self.assertEqual(logout_res.status_code, 200)

        # 3. Try to use revoked token
        response = self.client.get('/api/orders/my', headers={
            'Authorization': f'Bearer {access_token}'
        })
        self.assertEqual(response.status_code, 401)

    @patch('app.get_db_connection')
    def test_09_api_me_returns_user_info_from_jwt(self, mock_db):
        mock_conn = MagicMock()
        mock_cursor = MagicMock()
        mock_db.return_value = mock_conn
        mock_conn.cursor.return_value = mock_cursor
        mock_cursor.fetchone.return_value = self.customer_user

        login_res = self.client.post('/api/login', json={
            'email': 'customer@ecommerce.com',
            'password': 'customer123'
        })
        access_token = login_res.get_json()['access_token']

        response = self.client.get('/api/me', headers={
            'Authorization': f'Bearer {access_token}'
        })
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data['user']['id'], 2)
        self.assertEqual(data['user']['name'], 'John Customer')
        self.assertEqual(data['user']['role'], 'customer')

if __name__ == '__main__':
    unittest.main()
