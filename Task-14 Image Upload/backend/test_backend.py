import io
import os
import json
import unittest
from app import app, UPLOAD_FOLDER
from database import init_db

class FlaskImageUploadTestCase(unittest.TestCase):
    def setUp(self):
        self.app = app
        self.app.config['TESTING'] = True
        self.client = self.app.test_client()
        init_db()

    def test_01_upload_valid_image(self):
        """Test uploading a valid PNG image."""
        # Create a tiny 1x1 valid PNG in memory
        png_data = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00'
            b'\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        data = {
            'image': (io.BytesIO(png_data), 'test_camera.png')
        }
        response = self.client.post('/api/upload', data=data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 201)
        res_json = response.get_json()
        self.assertIn('image_url', res_json)
        self.assertTrue(res_json['image_url'].startswith('/static/uploads/'))
        
        # Verify file exists on disk
        filename = res_json['filename']
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        self.assertTrue(os.path.exists(filepath))

        # Verify static serving
        static_res = self.client.get(res_json['image_url'])
        self.assertEqual(static_res.status_code, 200)

    def test_02_upload_invalid_file_type(self):
        """Test uploading an unallowed file type (.txt) returns 400."""
        data = {
            'image': (io.BytesIO(b'Hello text file'), 'notes.txt')
        }
        response = self.client.post('/api/upload', data=data, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)
        res_json = response.get_json()
        self.assertIn('error', res_json)

    def test_03_upload_no_file(self):
        """Test sending empty request to /api/upload returns 400."""
        response = self.client.post('/api/upload', data={}, content_type='multipart/form-data')
        self.assertEqual(response.status_code, 400)

    def test_04_create_and_fetch_product(self):
        """Test creating a product with image_url and fetching it."""
        # First upload an image
        png_data = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00'
            b'\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        upload_res = self.client.post(
            '/api/upload',
            data={'image': (io.BytesIO(png_data), 'headphones.png')},
            content_type='multipart/form-data'
        )
        image_url = upload_res.get_json()['image_url']

        # Create product with this image_url
        new_prod = {
            'name': 'Studio Monitor Pro',
            'price': 249.99,
            'category': 'Audio',
            'description': 'Studio grade audio headphones with high fidelity sound.',
            'stock': 12,
            'image_url': image_url
        }
        create_res = self.client.post('/api/products', json=new_prod)
        self.assertEqual(create_res.status_code, 201)
        created_data = create_res.get_json()['product']
        self.assertEqual(created_data['name'], 'Studio Monitor Pro')
        self.assertEqual(created_data['image_url'], image_url)
        prod_id = created_data['id']

        # Fetch product
        get_res = self.client.get(f'/api/products/{prod_id}')
        self.assertEqual(get_res.status_code, 200)
        self.assertEqual(get_res.get_json()['product']['id'], prod_id)

    def test_05_update_product_replaces_image(self):
        """Test updating a product with a new image."""
        # Create product with first image
        png_data = (
            b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
            b'\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc`\x00\x00\x00'
            b'\x02\x00\x01H\xaf\xa4q\x00\x00\x00\x00IEND\xaeB`\x82'
        )
        upload1 = self.client.post(
            '/api/upload',
            data={'image': (io.BytesIO(png_data), 'img1.png')},
            content_type='multipart/form-data'
        )
        url1 = upload1.get_json()['image_url']
        filename1 = upload1.get_json()['filename']

        create_res = self.client.post('/api/products', json={
            'name': 'Test Item',
            'price': 50,
            'category': 'Test',
            'image_url': url1
        })
        prod_id = create_res.get_json()['product']['id']

        # Upload second image
        upload2 = self.client.post(
            '/api/upload',
            data={'image': (io.BytesIO(png_data), 'img2.png')},
            content_type='multipart/form-data'
        )
        url2 = upload2.get_json()['image_url']

        # Update product to url2
        update_res = self.client.put(f'/api/products/{prod_id}', json={
            'name': 'Test Item Updated',
            'price': 60,
            'category': 'Test',
            'image_url': url2
        })
        self.assertEqual(update_res.status_code, 200)
        self.assertEqual(update_res.get_json()['product']['image_url'], url2)

        # Confirm old image file was cleaned up from disk
        self.assertFalse(os.path.exists(os.path.join(UPLOAD_FOLDER, filename1)))

if __name__ == '__main__':
    unittest.main()
