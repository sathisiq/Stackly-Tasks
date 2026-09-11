# Task 15 – Pagination + Debounced Search (Full Stack Write-Up)

**Student Name:** Sathis  
**Repository Link:** [https://github.com/sathisiq/Stackly-Tasks](https://github.com/sathisiq/Stackly-Tasks)  
**Project Path:** `Task-12 E-commerce` (Upgraded for Task 15)  
**Tech Stack:** React (Vite, Tailwind CSS) + Flask (Python) + MySQL  

---

## 1. Conceptual Q&A Write-Up

### Q1. What is `LIMIT` and `OFFSET` in SQL?
- **`LIMIT`**: Dictates the **maximum number of rows** the database engine should return for a query. It controls the page size (e.g., `LIMIT 8` retrieves at most 8 records).
- **`OFFSET`**: Dictates the **number of rows to skip** before beginning to return records from the result set. It allows navigating to arbitrary pages (e.g., `OFFSET 16` skips the first 16 records and returns rows starting from index 17).

#### Calculation Formula:
$$\text{OFFSET} = (\text{page} - 1) \times \text{limit}$$
$$\text{total\_pages} = \left\lceil \frac{\text{total}}{\text{limit}} \right\rceil$$

#### Specific Scenario:
- **Total Products:** 47
- **Page Requested:** Page 3
- **Items per Page:** 8
- **Exact `LIMIT` value:** `8`
- **Exact `OFFSET` value:** $(3 - 1) \times 8 = 16$
- **Total Pages:** $\lceil 47 / 8 \rceil = 6$ pages (Page 1: 1–8, Page 2: 9–16, **Page 3: 17–24**, Page 4: 25–32, Page 5: 33–40, Page 6: 41–47).

```sql
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC
LIMIT 8 OFFSET 16;
```

---

### Q2. Explain how `useDebounce` works. What does the cleanup function (`return () => clearTimeout(timer)`) do and why is it important?

#### How `useDebounce` Works:
`useDebounce` is a custom React hook that delays propagating state changes until the user has stopped triggering updates for a specified duration (e.g., 300 milliseconds).
1. When the user types a character into the input field, the parent component updates the raw `search` state **immediately**. This guarantees zero typing lag or cursor stutter in the UI.
2. The `useDebounce(search, 300)` hook receives the updated value.
3. Inside `useEffect`, a timer is scheduled via `setTimeout` to update the internal `debounced` state after 300ms.
4. If the user stops typing for at least 300ms, the timer completes, the debounced state updates, and the `useEffect` listening to `debouncedSearch` fires a single API call to the backend.

#### Role of the Cleanup Function:
```javascript
useEffect(() => {
  const timer = setTimeout(() => {
    setDebounced(value);
  }, delay);

  // Cleanup function
  return () => clearTimeout(timer);
}, [value, delay]);
```
- **What it does:** Every time `value` changes before the previous delay finishes, React invokes the cleanup function returned by the previous `useEffect` run. `clearTimeout(timer)` cancels the pending timeout before creating a new one.
- **Why it is critical:** Without `clearTimeout(timer)`, typing 6 characters like `"laptop"` in 200ms would schedule 6 separate timers that would all fire in rapid succession 300ms later. That would completely defeat debouncing and still send 6 requests (`l`, `la`, `lap`, `lapt`, `lapto`, `laptop`) to the backend. The cleanup function ensures that **only the final keystroke's timer survives**, firing exactly **one** API request.

---

### Q3. Why do you reset `currentPage` to 1 when the search term changes?

```javascript
useEffect(() => {
  setCurrentPage(1);
}, [debouncedSearch]);
```

#### Why This is Critical:
Suppose a store has 47 products across 6 pages, and a customer is currently browsing **Page 5**.
1. If the customer types `"macbook"` into the search bar, the database search query might only match **2 products** in total.
2. 2 products with 8 products per page only have **1 page of results** (`total_pages = 1`).
3. If `currentPage` remained stuck on `Page 5`, the frontend would request `?page=5&limit=8&search=macbook`.
4. The database would calculate `OFFSET = (5 - 1) * 8 = 32`. Since there are only 2 matching records, skipping 32 rows produces an empty list (`[]`).
5. The customer would see an empty page with "No products found", believing the product does not exist, even though 2 matching items were found!
6. Automatically resetting `currentPage` to `1` ensures that the user is immediately brought to the start of the new query's results (`OFFSET = 0`), displaying the matching items properly.

---

### Q4. Your `Pagination` component is used in two different pages. What props does it accept and how does the parent control which page is active?

#### Props Accepted:
The `<Pagination />` component is a **reusable, controlled component** that accepts three props:
1. `currentPage` *(Number)*: The current active page index (1-based).
2. `totalPages` *(Number)*: The total number of pages available, calculated by the backend or parent as `Math.ceil(total / limit)`.
3. `onPageChange` *(Function)*: A callback function `(newPage: number) => void` triggered when a page number, Previous, or Next button is clicked.

#### How the Parent Controls Which Page is Active:
`<Pagination />` is stateless regarding which page is active; it follows the **Controlled Component pattern**:
- **Parent State Ownership:** The parent component (`Home.jsx` or `AdminOrders.jsx`) holds the authoritative state:
  ```javascript
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  ```
- **Downward Data Flow (Props):** The parent passes `currentPage` and `totalPages` into the `<Pagination />` component. The component uses `currentPage === pageNumber` to apply active highlight styling (`bg-indigo-600 text-white shadow-md`).
- **Upward Event Flow (Callbacks):** When the user clicks the "Next" button or button "3", the component invokes `onPageChange(3)`.
- **State Update & Re-fetch:** The parent's setter `setCurrentPage(3)` updates the parent state. Because `currentPage` is listed in the parent's `useEffect` dependency array, updating it triggers `fetchProducts()` or `fetchOrders()` with `?page=3&limit=...`, cleanly pulling and rendering the new page.

---

## 2. Verification & Screen Recording Guide

### Prerequisites to Run Live:
1. **Start MySQL Service:**
   Open Command Prompt / PowerShell as Administrator and run:
   ```powershell
   net start MYSQL80
   ```
2. **Start Backend (Flask):**
   ```powershell
   cd "c:\Users\sathi\Desktop\stackly task\Task-12 E-commerce\backend"
   python app.py
   ```
   *Runs on `http://localhost:5000`*

3. **Start Frontend (Vite):**
   ```powershell
   cd "c:\Users\sathi\Desktop\stackly task\Task-12 E-commerce\frontend"
   npm run dev
   ```
   *Runs on `http://localhost:5173`*

### Required Screen Recording Checklist:
1. **Initial Load:** Open `http://localhost:5173`. Show that the home page displays 8 products, total product count ("Showing 8 of 47 products"), and pagination buttons at the bottom.
2. **Page Navigation:** Click page button "2" or "Next". Show that page 2 loads different products, the page button 2 highlights, and "Previous" button enables.
3. **Network Tab Proof for Debounce:**
   - Press `F12` to open DevTools, switch to the **Network** tab, and filter by `Fetch/XHR`.
   - In the search bar, type a word slowly (e.g. `laptop`).
   - Point out that **only ONE** request `GET /api/products?page=1&limit=8&search=laptop` is sent after you pause typing for 300ms, instead of 6 individual requests.
4. **Clear Search Reset:**
   - Navigate to page 2 or 3 while searching.
   - Clear the search input using the clear button or backspace.
   - Confirm that the results reset automatically to **Page 1**.
5. **Admin Orders Pagination:**
   - Navigate to `/admin/orders` (or click Customer Orders in Admin portal).
   - Confirm that orders are loaded 10 per page with working Previous/Next and numbered page controls.
