# How to Run Rentify on Another PC (Step-by-Step)

Follow these simple steps to run this project on any computer:

---

## 1. Prerequisites
Make sure **Node.js** (v18 or higher) is installed on the PC.
- Download from: [https://nodejs.org](https://nodejs.org) (LTS version recommended).

---

## 2. Extract the Project
Extract `Rentify.zip` to any folder on your computer (e.g., `Desktop/Rentify`).

---

## 3. Step-by-Step Execution

### Step A: Start the Backend Server

1. Open a **Terminal / Command Prompt** (or VS Code terminal).
2. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. *(Optional)* If you want to fill the database with sample rental items & categories:
   ```bash
   npm run seed
   ```
5. Start the backend server:
   ```bash
   npm start
   ```
   *(You should see: `MongoDB Connected` and `Rentify Unified Backend Server running on port 5000`)*

---

### Step B: Start the Frontend App

1. Open a **SECOND / NEW Terminal** window.
2. Navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the frontend dev server:
   ```bash
   npm run dev
   ```
   *(You will see: `Local: http://localhost:5173`)*

---

## 4. Open in Browser
Open your web browser (Chrome, Edge, Firefox, etc.) and go to:
👉 **`http://localhost:5173`**

---

## 5. Demo Accounts (If using seeded data)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Demo User 1** | `rahul@example.com` | `password123` |
| **Demo User 2** | `priya@example.com` | `password123` |
| **Demo User 3** | `arjun@example.com` | `password123` |

*(You can also click **Sign Up** to create your own account instantly without any email verification).*
