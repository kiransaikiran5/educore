# 🎓 EduCore – Online Learning & Course Management Platform

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)
![Docker](https://img.shields.io/badge/Docker-✓-2496ED?logo=docker)

EduCore is a full‑stack online learning platform that allows instructors to create and manage courses, and students to enroll, track progress, take quizzes, and leave reviews. Built with modern, industry‑standard technologies.

![EduCore Dashboard](https://via.placeholder.com/800x400?text=EduCore+Dashboard+Screenshot)

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT‑based authentication with **bcrypt** password hashing.
- Role‑based access control (**Student** / **Instructor**).

### 👨‍🏫 Instructor Features
- Create, update, and delete courses.
- Add, reorder, edit, and remove lessons (video content).
- Create quizzes with multiple‑choice questions.
- View course analytics (total students, revenue, average rating).

### 🧑‍🎓 Student Features
- Browse and search courses by title, category, price, and rating.
- Enroll in courses and track learning progress.
- Mark lessons as complete – progress bar updates in real time.
- Take quizzes and receive instant scores.
- Write and view course reviews.
- Personal dashboard with charts (course completion, quiz performance).

### 🔔 Notifications
- Real‑time in‑app notifications for enrollment, new lessons, and quiz results.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | FastAPI, SQLAlchemy, Pydantic, PyMySQL |
| **Frontend** | React 18, Redux Toolkit, React Router, Tailwind CSS, Chart.js, Formik/Yup |
| **Database** | MySQL 8.0 |
| **DevOps** | Docker, Docker Compose |

---
# Setup Configuration:

## Backend

- cd backend
- python -m venv venv
- source venv/bin/activate      # Windows: venv\Scripts\activate
- pip install -r requirements.txt

# Set environment variables (or use .env)

- export MYSQL_HOST=localhost
- export MYSQL_USER=educore_user
- export MYSQL_PASSWORD=educore_password
- export MYSQL_DATABASE=educore_db
- export SECRET_KEY=your-secret-key

- uvicorn app.main:app --reload --port 8000

## Frontend
- cd frontend
- npm install
- npm start
