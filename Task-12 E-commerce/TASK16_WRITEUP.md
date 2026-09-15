# Task 16 – JWT Authentication (Full Stack Write-Up)

**Student Name:** Sathis  
**Repository Link:** [https://github.com/sathisiq/Stackly-Tasks](https://github.com/sathisiq/Stackly-Tasks)  
**Project Path:** Task-12 E-commerce (Upgraded to JWT Authentication for Task 16)  
**Tech Stack:** React (Vite, Tailwind CSS, Axios) + Flask (Python, Flask-JWT-Extended, Flask-Bcrypt) + MySQL  

---

## 1. Mandatory Conceptual Q&A Write-Up

### Q1. What is the difference between an access token and a refresh token? Why are they different expiry lengths?

#### Core Conceptual Differences
| Attribute | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Primary Purpose** | Authenticates and authorizes individual API requests. Grants direct access to protected resources. | Obtains a fresh access token once the existing one expires, without forcing the user to log in again. |
| **Payload Claims** | Contains user identity (user_id) along with authorization claims (e.g., ole: 'admin', 
ame, email). | Minimal payload, typically contains only the subject (user_id) and token type identifier (	oken_type: 'refresh'). |
| **Destination Endpoints** | Sent in Authorization: Bearer <token> header to all protected business routes (/api/orders, /api/me, /api/admin/stats). | Sent strictly to the token renewal endpoint (POST /api/refresh). |
| **Lifespan / Expiry** | **Short-lived** (typically 15 minutes). | **Long-lived** (typically 7 days to 30 days). |
| **Attack Surface** | Frequently transmitted over the network with every API call, making it more vulnerable to interception. | Infrequently transmitted (only once every 15 minutes when refreshing). |

#### Why They Have Different Expiry Lengths
1. **Mitigating Token Compromise (The Security Window):**
   - Because JWTs are stateless, once signed and distributed, a backend cannot inherently invalidate a JWT without maintaining a revocation list.
   - If an **access token** is leaked or intercepted by an attacker via a Man-In-The-Middle (MITM) attack or cross-site scripting (XSS), the attacker's window of opportunity is limited to its short lifespan (**15 minutes** in our application). After 15 minutes, that stolen access token is automatically rejected by the server as expired.
2. **User Convenience and Seamless UX (No Constant Re-Logins):**
   - If access tokens lasted 7 days, any compromised token would remain valid for an entire week.
   - Conversely, if we only had short-lived access tokens without refresh tokens, users would be rudely kicked back to the login screen every 15 minutes, destroying the user experience.
   - The **refresh token** solves this tradeoff: it stays idle in client storage and is only transmitted to POST /api/refresh when necessary. If an account is suspended or a refresh token is revoked, the refresh token cannot generate new access tokens, effectively locking out unauthorized parties at the next refresh cycle.

---

### Q2. What is an Axios interceptor and why is it better than manually adding the token to every API call?

#### What is an Axios Interceptor?
An Axios interceptor is middleware for HTTP requests and responses. It intercepts requests **before** they leave the browser and intercepts responses **before** they are resolved by 	hen() or catch() in component code.

`javascript
// Request Interceptor: Injects Authorization header before dispatching
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = Bearer ;
  }
  return config;
});
`

#### Why Interceptors are Superior to Manual Token Handling:
1. **Single Point of Configuration (DRY Principle):**
   - Without an interceptor, every single API call across dozen of components (Home.jsx, Cart.jsx, Orders.jsx, AdminProducts.jsx, AdminOrders.jsx, AdminDashboard.jsx, ProductForm.jsx) would have to manually fetch the token from localStorage and construct { headers: { Authorization: Bearer  } }.
   - If header structure or token naming changes, you would have to edit dozens of files instead of a single interceptor in pi.js.
2. **Elimination of Human Error:**
   - Developers frequently forget to attach authorization headers to new endpoints. An interceptor guarantees 100% consistent coverage for all outgoing requests made through the Axios instance.
3. **Transparent Token Refreshing (Silent Renewal):**
   - An interceptor can catch 401 Unauthorized responses in the background, pause the failed request, request a new access token from /api/refresh, update localStorage, update the failed request's headers, and replay the original request.
   - Component code remains completely unaware that a token expired and renewed; no loading spinners break and no page reloads occur.

---

### Q3. What happens in your app when the access token expires mid-session? Walk through the exact sequence of events in your interceptor code.

Here is the exact step-by-step lifecycle when an access token expires while a user is interacting with the store:

`mermaid
sequenceDiagram
    autonumber
    actor User
    participant Component as React Component
    participant Interceptor as Axios Interceptor (api.js)
    participant Storage as localStorage
    participant Backend as Flask API (/api/refresh)
    participant Protected as Flask Route (/api/orders/my)

    User->>Component: Clicks "My Orders"
    Component->>Interceptor: api.get('/api/orders/my')
    Interceptor->>Storage: Read 'access_token'
    Storage-->>Interceptor: Expired access_token
    Interceptor->>Protected: GET /api/orders/my with expired token
    Protected-->>Interceptor: 401 Unauthorized (Signature / ExpiredSignatureError)
    
    Note over Interceptor: Response Interceptor catches 401 & checks !original._retry
    Interceptor->>Interceptor: Set original._retry = true
    Interceptor->>Storage: Read 'refresh_token'
    Storage-->>Interceptor: Valid refresh_token
    
    Interceptor->>Backend: POST /api/refresh (Bearer refresh_token)
    Backend->>Backend: Verify refresh token signature & user_id
    Backend-->>Interceptor: 200 OK with new access_token
    
    Interceptor->>Storage: Save new 'access_token'
    Interceptor->>Protected: Retry original GET /api/orders/my (Bearer new_access_token)
    Protected-->>Component: 200 OK with orders data
    Component-->>User: Displays orders seamlessly (no disruption)
`

#### Code Implementation in src/api.js:
`javascript
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    // Step 1: Detect 401 Unauthorized and ensure request wasn't already retried
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        // Step 2: Retrieve refresh token from localStorage
        const refresh = localStorage.getItem('refresh_token');
        if (!refresh) throw new Error('No refresh token available');

        // Step 3: Call POST /api/refresh with Refresh Token in Authorization header
        const res = await axios.post(
          'http://localhost:5000/api/refresh',
          {},
          { headers: { Authorization: Bearer  } }
        );

        // Step 4: Extract new access token and persist to localStorage
        const newToken = res.data.access_token;
        localStorage.setItem('access_token', newToken);

        // Step 5: Update failed request's Authorization header with new token
        original.headers.Authorization = Bearer ;

        // Step 6: Replay and return the original request with seamless resolution
        return api(original);
      } catch (refreshErr) {
        // Step 7: If refresh fails (refresh token expired after 7 days or revoked), clean up and redirect
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);
`

---

### Q4. What is the difference between JWT authentication and Flask session authentication? Why is JWT better for a React single-page application?

#### Comprehensive Comparison
| Dimension | Flask Session Authentication | JWT Authentication |
| :--- | :--- | :--- |
| **Statefulness** | **Stateful:** Server signs a session ID stored in a cookie. Server must retain or validate session state. | **Stateless:** Server issues a cryptographically signed token. Server validates signature using secret key without querying session stores. |
| **Storage Mechanism** | Client browser cookie (Set-Cookie: session=...; HttpOnly). | Client localStorage (or memory) and sent via Authorization: Bearer <token>. |
| **Cross-Origin Requests (CORS)** | Difficult. Requires withCredentials: true, exact origin matching, and complex cookie security configurations (SameSite=None; Secure). | Trivial. Standard HTTP Authorization headers work smoothly across any domain, port, or subdomain. |
| **Multi-Client Support** | Built specifically for web browsers. Mobile apps (iOS/Android), CLI tools, and 3rd-party services struggle with cookie management. | Universal. Identical JSON token payload works seamlessly across web browsers, React Native, Flutter, microservices, and external REST consumers. |
| **Horizontal Scalability** | Requires sticky sessions on load balancers or a centralized distributed session store (e.g., Redis / Memcached cluster). | Trivially scalable. Any backend server node with the shared JWT_SECRET_KEY can independently verify any token. |
| **CSRF Vulnerability** | Vulnerable to Cross-Site Request Forgery (CSRF) because browsers automatically attach cookies to cross-site requests. | Immune to CSRF because tokens stored in JavaScript memory/localStorage are never automatically attached by browsers. |

#### Why JWT is Superior for a React Single-Page Application (SPA):
1. **Decoupled Architecture:** React SPAs are typically built and deployed independently from the backend (e.g., frontend on Vite port 5173/CDN and backend on port 5000/cloud instance). JWT allows complete separation of concerns without cookie domain restrictions.
2. **Stateless Scalability:** When traffic surges, additional Flask workers or microservices can be spun up without configuring a shared Redis session store.
3. **Payload Portability:** The frontend can inspect claims inside the access token (such as user role and expiration timestamp) to adjust UI states instantly without having to make redundant /api/me trips to the server on every render.

---

## 2. Verification and Testing Results

### Automated Backend Unit Tests (	est_jwt_auth.py)
All 9 automated unit tests passed cleanly:
`ash
python -m unittest test_jwt_auth.py -v
`
- 	est_01_login_success_returns_jwt_tokens ... **OK**
- 	est_02_login_invalid_password_returns_401 ... **OK**
- 	est_03_protected_route_without_token_returns_401 ... **OK**
- 	est_04_protected_route_with_valid_token_returns_200 ... **OK**
- 	est_05_admin_route_forbidden_for_customer ... **OK**
- 	est_06_admin_route_accessible_by_admin ... **OK**
- 	est_07_refresh_token_issues_new_access_token ... **OK**
- 	est_08_logout_blacklists_token ... **OK**
- 	est_09_api_me_returns_user_info_from_jwt ... **OK**
**Result: Ran 9 tests in 9.197s. OK (100% pass rate)**

### Frontend Production Build
`ash
npm run build
`
- Modules transformed: 1,666 modules
- Output bundle: dist/assets/index-C_7k1bVf.js (321 kB), dist/assets/index-DAYZsDKB.css (33 kB)
- Built in 8.44s with zero syntax or bundling errors.

---

## 3. Screen Recording Checklist for Submission

When recording your screen for final submission:
1. **Open Google Chrome / Browser DevTools**:
   - Press F12 or Ctrl + Shift + I and select the **Network** tab.
   - Filter by Fetch/XHR.
2. **Login Demonstration**:
   - Navigate to /login and click **Demo Customer** or **Demo Admin**.
   - Inspect the POST /api/login response: show ccess_token, efresh_token, and user payload.
   - In the **Headers** tab of /api/login, point out that **no Set-Cookie session header** is returned.
3. **Protected API Call Demonstration**:
   - Click on **My Orders** or **Storefront**.
   - Select the GET /api/orders/my or /api/me request in the Network tab.
   - Under **Request Headers**, clearly highlight:
     Authorization: Bearer eyJhbGciOiJIUzI1Ni...
   - Point out the **Cookies** sub-tab: confirm no session cookie is sent.
4. **Page Refresh Demonstration**:
   - Refresh the page (F5).
   - Show that the user stays logged in seamlessly (the checkAuth() method restored the user state via GET /api/me using the persisted token).
5. **Logout Demonstration**:
   - Click the user dropdown and click **Sign Out**.
   - Open DevTools **Application** tab -> **Local Storage**: show that ccess_token and efresh_token are cleared.
   - Attempting to visit /orders immediately redirects to /login.
