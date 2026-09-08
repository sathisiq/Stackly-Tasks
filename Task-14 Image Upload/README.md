# StoreFlow — Full-Stack Image Upload & Storage System (Task 14)

A complete, production-grade e-commerce product and image management application built with **Flask**, **React (Vite)**, **Axios**, and `multipart/form-data`.

---

## Key Highlights

- **Permanent Server-Hosted Uploads**: Replaced random Picsum URLs with permanent server-side file storage.
- **Multipart/Form-Data Support**: Direct binary streaming upload via Axios and Flask Werkzeug file handler.
- **Collision-Free UUID Naming**: `uuid.uuid4().hex` guarantees that no uploaded file overwrites an existing one.
- **Instant Client-Side Preview**: Uses `URL.createObjectURL(selected)` to display uploaded images immediately before submitting.
- **Dual Validation**: File size (max 2 MB) and file extension (`png`, `jpg`, `jpeg`, `webp`) validated on both client and server.
- **Drag & Drop Upload Zone**: Interactive upload box with drag-over effects, drop support, and file preview card.
- **Upload Progress Bar**: Real-time upload percentage feedback using Axios `onUploadProgress`.
- **Automatic Server Cleanup**: Deletes old/superseded image files when updating or deleting products.
- **Graceful Fallbacks**: Products without images render a custom "No image" placeholder box instead of a broken icon.

---

## Project Structure

```
Task-14 Image Upload/
├── backend/
│   ├── static/
│   │   └── uploads/
│   │       └── .gitkeep             # Preserves folder in git
│   ├── app.py                       # Main Flask app & /api/upload routes
│   ├── database.py                  # SQLite database manager
│   ├── seed.py                      # Seed script for initial sample products
│   ├── test_backend.py              # Backend test suite
│   └── requirements.txt             # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js             # Axios instance & media URL helper
│   │   ├── context/
│   │   │   └── ToastContext.jsx     # Toast context provider & useToast hook
│   │   ├── components/
│   │   │   ├── Toast.jsx            # Toast alert notifications
│   │   │   ├── Navbar.jsx           # Top navigation bar
│   │   │   ├── DragDropZone.jsx     # Drag & drop uploader with preview
│   │   │   ├── ProductForm.jsx      # Admin add/edit form with file upload
│   │   │   ├── ProductCard.jsx      # Product card with server image
│   │   │   └── ProductDetail.jsx    # Full product detail view modal
│   │   ├── pages/
│   │   │   ├── HomePage.jsx         # Storefront catalog with search & filters
│   │   │   └── AdminPage.jsx        # Admin product management dashboard
│   │   ├── App.jsx                  # Main application router
│   │   ├── App.css                  # UI stylesheet
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── .gitignore                       # Ignores static/uploads/* but keeps .gitkeep
├── README.md
└── SUBMISSION_WRITEUP.md            # Answers to the 4 submission questions
```

---

## Quick Start Guide

### 1. Backend Setup (Flask)
```bash
# Navigate to backend directory
cd backend

# Install Python packages
pip install -r requirements.txt

# (Optional) Seed the database with sample products
python seed.py

# Start the Flask API server
python app.py
```
> The backend server will run at: `http://localhost:5000`  
> Uploaded images are served at: `http://localhost:5000/static/uploads/<filename>`

### 2. Frontend Setup (React + Vite)
```bash
# Navigate to frontend directory in a new terminal
cd frontend

# Install node dependencies
npm install

# Start the development server
npm run dev
```
> The frontend application will run at: `http://localhost:5173`

---

## Running Automated Tests

```bash
cd backend
python -m unittest test_backend.py
```
Test suite verifies:
1. Valid image upload & static URL accessibility.
2. Invalid file type rejection (400 Bad Request).
3. Missing file rejection (400 Bad Request).
4. Product creation and retrieval with real image path.
5. Image replacement and automatic server file cleanup.

---

## Git & Submission Check

- `.gitignore` contains:
  ```
  backend/static/uploads/*
  !backend/static/uploads/.gitkeep
  ```
- Detailed answers to technical questions are in `SUBMISSION_WRITEUP.md`.
