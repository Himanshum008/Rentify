# Rentify - Peer-to-Peer Rental Marketplace (MERN Stack)

A modern full-stack rental marketplace web application built with **React**, **Node.js**, **Express**, **MongoDB Atlas**, **Socket.io** (Realtime Chat), and **Cloudinary** (Image Uploads).

---

## 🚀 Quick Start Guide (How to Run on Any PC)

### 1. Prerequisites
- **Node.js** (v18+) installed from [nodejs.org](https://nodejs.org).

---

### 2. Run the Backend Server
Open a terminal in the `backend` directory:
```bash
cd backend
npm install
npm start
```
> Server will start on **`http://localhost:5000`** with MongoDB Atlas connected.
> *(Optional: Run `npm run seed` to load initial sample items & test users)*

---

### 3. Run the Frontend App
Open a **second terminal** in the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
> App will start on **`http://localhost:5173`**.

---

### 4. Open the App
Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Demo Login Credentials (Seeded Users)

| Account | Email | Password |
| :--- | :--- | :--- |
| **Demo User 1** | `rahul@example.com` | `password123` |
| **Demo User 2** | `priya@example.com` | `password123` |
| **Demo User 3** | `arjun@example.com` | `password123` |

*Or click **Sign Up** to create a new account instantly (no verification link required).*

---

## 🌟 Key Features
- **Browse & Search Catalog**: Category filters, price range slider, location selector, and sort filters.
- **List an Item (4-step Wizard)**: Upload up to 10 photos to Cloudinary, configure daily pricing, deposits, and specifications.
- **Rent & Booking**: Interactive booking modal with date range picker, fee calculations, and mock checkout.
- **Real-Time Chat (Socket.io)**: Instant live messaging between renters and item owners with typing indicators and notification drawer.
- **User Dashboard (`/my-rentals`)**: Track rentals, listed items, and borrower requests.
