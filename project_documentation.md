# Military Asset Management System - Project Documentation

## 1. Project Overview

The Military Asset Management System is a comprehensive solution designed to track and manage military assets, including vehicles, weapons, and ammunition, across various bases. It provides real-time visibility into inventory, facilitates transfers between bases, tracks assignments to personnel, and maintains a strict audit trail of all transactions.

**Key Features:**

- **Multi-Base Management:** Track inventory across separate physical locations (Bases).
- **Role-Based Access Control (RBAC):** Strict separation of duties for Admins, Commanders, and Logistics personnel.
- **Audit Logging:** Immutable record of all critical actions (Create, Update, Delete, Transfers).
- **Real-time Dashboard:** Operational metrics and inventory status.

---

## 2. Tech Stack & Architecture

### **Architecture**

The application grants a **Client-Server** architecture (REST API) with a clear separation of concerns:

- **Frontend:** Single Page Application (SPA) communicating with the backend via RESTful API calls.
- **Backend:** Node.js/Express server handling business logic, authentication, and database interaction.
- **Database:** SQLite (Relational DB) for structured data storage.

### **Tech Stack**

| Component          | Technology            | Reason for Choice                                                         |
| ------------------ | --------------------- | ------------------------------------------------------------------------- |
| **Frontend**       | React.js (Vite)       | High performance, component-based UI, fast development build.             |
| **Styling**        | Tailwind CSS          | Utility-first CSS for rapid, responsive, and consistent design.           |
| **Backend**        | Node.js + Express     | Non-blocking I/O for handling multiple concurrent requests efficiently.   |
| **Database**       | SQLite                | Lightweight, serverless, and easy to set up for this scale of deployment. |
| **Authentication** | JWT (JSON Web Tokens) | Stateless authentication mechanism ideal for scalable REST APIs.          |

---

## 3. Data Models / Schema

The database utilizes a relational schema to ensure data integrity.

### **Core Entities**

1.  **Users** (`users`)
    - `id`, `username`, `password_hash`, `role`, `base_id`
    - _Purpose:_ Authentication and authorization. Links users to specific bases.

2.  **Bases** (`bases`)
    - `id`, `name`, `location`
    - _Purpose:_ Physical locations where assets are stored.

3.  **Equipment Types** (`equipment_types`)
    - `id`, `name`, `category` (Vehicle, Weapon, Ammo), `unit`
    - _Purpose:_ Catalog of available equipment definitions.

4.  **Inventory** (`inventory`)
    - `base_id`, `equipment_type_id`, `current_balance`
    - _Purpose:_ Tracks how much of each item operates at a specific base.

5.  **Transactions**
    - **Purchases** (`purchases`): Records external procurement of assets.
    - **Transfers** (`transfers`): Tracks movement of assets between bases (includes status: pending/completed).
    - **Assignments** (`assignments`): Tracks assets issued to specific personnel.

6.  **Audit Logs** (`audit_logs`)
    - `user_id`, `action`, `entity`, `old_values`, `new_values`
    - _Purpose:_ Security and compliance tracking.

---

## 4. RBAC Explanation (Role-Based Access Control)

Access is enforced via **JWT Authentication** and **Middleware** checks (`rbacMiddleware.js`).

| Role          | Permissions            | Description                                                                                                          |
| ------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Admin**     | **Full Access**        | Can create/delete bases, equipment types, and manage all users. Can perform all operational tasks.                   |
| **Commander** | **Operational Access** | Can view dashboard, approve/initiate transfers, and assign assets to soldiers. Restricted from system config.        |
| **Logistics** | **Inventory Access**   | Can manage inventory levels, initiate transfers, and record purchases. Cannot assign assets or change system config. |

**Enforcement Method:**
Routes are protected by middleware that checks the user's role claim in their JWT against the allowed roles for that specific endpoint.
_Example:_ `router.post('/bases', rbacMiddleware(['admin']), ...)`

---

## 5. API Logging

The system implements a dual-layer logging strategy:

1.  **HTTP Request Logging:**
    - Utilizes `morgan` middleware in `dev` mode to log all incoming HTTP requests (Method, URL, Status, Response Time) to the console for monitoring traffic patterns and debugging.

2.  **Transactional Audit Logging:**
    - Custom `auditMiddleware` intercepts state-changing requests (POST, PUT, DELETE).
    - It captures the **Who** (User ID), **What** (Action & Entity), and **When**.
    - These records are persisted to the `audit_logs` database table for compliance and accountability.

---

## 6. Setup Instructions

### **Prerequisites**

- Node.js (v14 or higher)
- npm (Node Package Manager)

### **Backend Setup**

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Initialize the Database:
    ```bash
    node init_sqlite.js
    ```
4.  Seed Default Data (Users & Inventory):
    ```bash
    node seed_sqlite.js
    ```
5.  Start the Server:
    ```bash
    npm run dev
    ```
    _Server runs on `http://localhost:5000`_

### **Frontend Setup**

1.  Open a new terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Development Server:
    ```bash
    npm run dev
    ```
    _Application runs on `http://localhost:5173` (typically)_

---

## 7. API Endpoints

### **Authentication**

- `POST /api/auth/login` - Authenticate user and receive JWT.
- `POST /api/auth/register` - Register a new user.

### **Bases**

- `GET /api/bases` - List all bases.
- `GET /api/bases/:id` - Get base details.
- `POST /api/bases` - Create a new base (Admin only).

### **Equipment**

- `GET /api/equipment-types` - List available equipment definitions.
- `POST /api/equipment-types` - Define new equipment (Admin only).

### **Operations**

- `GET /api/purchases` - View purchase history.
- `POST /api/purchases` - Record a new purchase.
- `GET /api/transfers` - View transfer history.
- `POST /api/transfers` - Initiate a transfer between bases.
- `PATCH /api/transfers/:id/status` - Update transfer status (e.g., complete/cancel).
- `POST /api/assignments` - Assign equipment to a user.

### **Dashboard**

- `GET /api/dashboard/metrics` - High-level statistics for the dashboard.

---

## 8. Login Credentials

The `seed_sqlite.js` script initializes the following accounts for testing:

| **Logistics** | `logistics_bravo` | `password123` |

---

## 9. Deployment

### **Docker (Local / Self-Hosted)**

The project includes a `docker-compose.yml` for easy deployment.

1.  Build and Start:
    ```bash
    docker-compose up --build
    ```
2.  Access:
    - Backend: `http://localhost:5000`
    - Frontend: `http://localhost:5173`

### **Vercel (Frontend)**

1.  Import the repository into Vercel.
2.  Set **Root Directory** to `frontend`.
3.  Add Environment Variable:
    - `VITE_API_URL`: `https://<your-backend-url>/api`
4.  Deploy.

### **Railway (Backend)**

1.  Import the repository into Railway.
2.  Set **Root Directory** to `backend`.
3.  Add Environment Variable (Optional if using defaults):
    - `PORT`: `5000`
4.  Deploy.
