# 🎬 VideoTube

A  video streaming platform inspired by YouTube, built using the MERN stack. Users can upload videos, interact with content, and experience a dynamic and responsive UI.

---

## 🚀 Features

- 🔐 User Authentication (Signup/Login with JWT)
- 📹 Video Upload & Management
- 👍 Like & 👎 Dislike functionality
- 💬 Comment system
- 📺 Watch videos with dynamic UI
- 🔍 Search functionality
- 📱 Responsive design

---

## 🛠️ Tech Stack
<!-- 
### Frontend
- React.js
- JavaScript (ES6+)
- CSS / Tailwind (if used) -->

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### Other Tools
- JWT (Authentication)
- REST APIs


---

## 📂 Project Structure
VideoTube/
│
├── backend/ # Node.js + Express backend
├── models/ # Database schemas
├── routes/ # API routes
├── controllers/ # Business logic
└── config/ # Configuration files


---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/raman-19/VideoTube.git
cd VideoTube

## For Backend
cd backend
npm install

##Environment Variables
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

##Project Run
npm start

