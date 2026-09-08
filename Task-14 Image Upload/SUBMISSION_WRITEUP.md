# Task 14 — Image Upload & Storage System: Technical Write-Up

## Overview
This document provides complete technical answers to the required submission questions for **Task 14**, detailing the architecture, validation mechanisms, file storage strategy, and bonus features implemented in the full-stack system.

---

### Question 1: What is `multipart/form-data` and why is it different from a normal JSON request when uploading files?

#### Technical Explanation:
- **`application/json` (Standard REST API format)**:
  - JSON is fundamentally a text-based format designed for structured key-value pairs, strings, numbers, booleans, and arrays.
  - To send binary files (such as `.png`, `.jpg`, `.webp`) inside a standard JSON payload, the binary data must first be converted into a Base64-encoded ASCII string.
  - **Downsides of JSON for files**:
    1. **Size Overhead**: Base64 encoding inflates the payload size by approximately **33%** (6 bits per byte instead of 8 bits).
    2. **Memory Overhead**: The entire file must be read into memory, converted into a huge text string, and serialized/deserialized by both client and server, causing memory spikes and CPU lag on large files.

- **`multipart/form-data` (Binary Form format)**:
  - Specifically designed by RFC 7578 to transmit binary files alongside standard text fields in a single HTTP request.
  - It separates individual form fields using a unique, auto-generated **boundary delimiter string** (e.g., `------WebKitFormBoundary7MA4YWxkTrZu0gW`).
  - Each part within the request contains its own metadata headers (`Content-Disposition: form-data; name="image"; filename="photo.jpg"` and `Content-Type: image/jpeg`), followed immediately by raw binary octet streams.
  - **Benefits**:
    1. **Streamable**: Flask / Werkzeug can stream incoming chunks directly from the network socket into temporary storage or directly to disk without holding the entire file in RAM.
    2. **Zero Base64 overhead**: The raw bytes are sent as-is without any 33% inflation.

#### Frontend Axios Code:
```javascript
const formData = new FormData();
formData.append('image', file);

const uploadRes = await api.post('/api/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  onUploadProgress: (progressEvent) => {
    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
    setUploadProgress(percent);
  }
});
```

---

### Question 2: How do you generate a unique filename for every upload? What would happen if you didn't?

#### Technical Explanation:
- When a user uploads a file, the client file name is often generic (e.g., `image.png`, `photo.jpg`, `cover.jpg`, `IMG_001.jpg`).
- If filenames are stored directly as provided by the user:
  1. **Silent Overwrite (Data Collision)**: If Admin A uploads `photo.jpg` for a laptop product and later Admin B uploads `photo.jpg` for a coffee mug, the second file would overwrite the first on the server disk. As a result, the laptop product page would now display the coffee mug image.
  2. **Security Vulnerabilities**: Raw user filenames may contain dangerous characters, spaces, or directory traversal payloads (e.g., `../../etc/passwd` or script files).
  3. **Browser Caching Issues**: Reusing the same name for a replaced image causes client browsers to serve stale cached images instead of the updated version.

#### Implementation with `uuid.uuid4().hex`:
We extract the file extension, generate a 128-bit cryptographically random hexadecimal UUID, and append the extension:

```python
import uuid

# Extract lowercase extension
ext = file.filename.rsplit('.', 1)[-1].lower()

# Generate 32-character collision-free hex string
unique_name = f"{uuid.uuid4().hex}.{ext}"

# Full destination path: static/uploads/<unique_name>
filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_name)
file.save(filepath)

image_url = f"/static/uploads/{unique_name}"
```

**Result**: Every single upload receives a guaranteed unique identifier (e.g. `95dfd782c90d4e84b907cc08b390b1c2.jpg`), making accidental overwrites mathematically impossible.

---

### Question 3: What validation did you add to block non-image files or oversized files? Show the exact code.

#### 1. Backend Server-Side Validation:
We enforce a **defense-in-depth** strategy on Flask:
- **Maximum File Size Protection**: Configured via `MAX_CONTENT_LENGTH` and caught with a dedicated 413 HTTP error handler.
- **Allowed Extension Whitelist**: Verifying that only `.png`, `.jpg`, `.jpeg`, and `.webp` are accepted.
- **Empty Filename / Missing Key Check**: Ensuring request contains the `image` multipart field.

```python
# Backend Configuration & Helpers (backend/app.py)
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB limit in bytes

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE

def allowed_file(filename):
    if not filename or '.' not in filename:
        return False
    ext = filename.rsplit('.', 1)[-1].lower()
    return ext in ALLOWED_EXTENSIONS

@app.errorhandler(413)
@app.errorhandler(RequestEntityTooLarge)
def handle_file_too_large(e):
    return jsonify({"error": "File size exceeds the 2 MB limit"}), 413

@app.route('/api/upload', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": "Invalid file type. Allowed extensions are: png, jpg, jpeg, webp"
        }), 400

    # Proceed to save file...
```

#### 2. Frontend Client-Side Pre-Validation:
We validate files before triggering any network request:
```javascript
// Frontend File Handler (frontend/src/components/ProductForm.jsx)
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

const handleFileSelect = (selectedFile) => {
  if (!selectedFile) return;

  // 1. Validate file MIME type
  if (!ALLOWED_TYPES.includes(selectedFile.type)) {
    showToast('Invalid file format. Please upload PNG, JPG, or WEBP.', 'error');
    return;
  }

  // 2. Validate file size
  if (selectedFile.size > MAX_FILE_SIZE) {
    const sizeInMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
    showToast(`File is too large (${sizeInMB} MB). Maximum limit is 2.0 MB.`, 'error');
    return;
  }

  setFile(selectedFile);
  setPreview(URL.createObjectURL(selectedFile));
};
```

---

### Question 4: Where does Flask store the uploaded file, and what URL pattern does the frontend use to display it afterward?

#### Storage Architecture:
1. **Server Storage Path**:
   - Files are physically stored inside: `backend/static/uploads/`
   - Configured dynamically via `os.path.join(BASE_DIR, 'static', 'uploads')`.
   - The directory is tracked in Git via `backend/static/uploads/.gitkeep` while `.gitignore` ignores all uploaded binary files.

2. **Database Storage**:
   - The database stores only the relative server path:
     `image_url = "/static/uploads/<unique_name>.<ext>"`
   - Storing relative paths keeps the database portable across environments (local dev on port 5000, production domains, CDNs).

3. **Frontend URL Pattern**:
   - The frontend prepends the backend base URL (`http://localhost:5000`):
     ```jsx
     // ProductCard.jsx and ProductDetail.jsx
     <img src={`http://localhost:5000${product.image_url}`} alt={product.name} />
     ```
   - If a product has no image (`image_url` is empty), a styled **"No image"** placeholder box is rendered instead of a broken `<img>` icon.

---

## Bonus Features Implemented

1. **Drag-and-Drop Upload Zone**:
   - Interactive drag-over visual styling, drop events, file type validation, and click-to-browse trigger.
2. **Old Image File Deletion on Server**:
   - When a product is updated with a new image or when a product is deleted, the backend `delete_file_from_disk()` function removes the superseded file from `static/uploads/`, preventing server disk clutter.
3. **Upload Progress Percentage Bar**:
   - Axios `onUploadProgress` tracks uploaded bytes in real-time, rendering an animated percentage progress bar during form submission.
4. **Instant Client-Side Preview**:
   - Uses `URL.createObjectURL(selected)` for zero-latency preview before submission.
