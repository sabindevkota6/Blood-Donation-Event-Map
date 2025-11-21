# Blood Donation Event Map

A full-stack web application designed to facilitate blood donation events. This platform allows users to view, create, and manage blood donation events on an interactive map, streamlining the process of connecting donors with events.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Project](#running-the-project)
- [API Overview](#api-overview)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features
- **User Authentication:** Secure login and registration using JWT.
- **Profile Management:** Users can create and update their profiles.
- **Event Management:** Create, read, update, and delete blood donation events.
- **Interactive Map:** Visualize events geographically using Leaflet maps.
- **Image Uploads:** Seamless image handling with Cloudinary.

## Tech Stack
**Backend:**
- Node.js & Express.js
- MongoDB & Mongoose
- JWT (JSON Web Tokens)
- Cloudinary (Image Uploads)

**Frontend:**
- React.js
- React Router DOM
- React Leaflet (Maps)
- Axios
- React Hook Form

## Prerequisites
- Node.js (v14+ recommended)
- npm (Node Package Manager)
- MongoDB (Local or Atlas URI)
- Cloudinary Account (for image uploads)

## Installation

The project is divided into `backend` and `frontend` directories. You will need to set up both.

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Blood-Donation-Event-Map
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

## Configuration

### Backend
Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGODB_URI=<your_mongodb_connection_string>
JWT_SECRET=<your_jwt_secret_key>
NODE_ENV=development

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

### Frontend
(Optional) Create a `.env` file in the `frontend` directory if you need to override the API URL:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Project

You need to run the backend and frontend servers simultaneously.

### Start Backend
In the `backend` terminal:
```bash
npm start
# OR for development with auto-reload
npm run dev
```
*Server will start on http://localhost:5000*

### Start Frontend
In the `frontend` terminal:
```bash
npm start
```
*Application will open at http://localhost:3000*

## API Overview

### Auth
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create a new event (Protected)
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event (Protected)
- `DELETE /api/events/:id` - Delete event (Protected)

### Profile
- `GET /api/profile/me` - Get current user profile
- `PUT /api/profile` - Update profile

## Troubleshooting

**1. "MongoNetworkError" or Database Connection Failed**
- Ensure your MongoDB instance is running or your `MONGODB_URI` is correct.
- Check if your IP is whitelisted in MongoDB Atlas.

**2. Cloudinary Errors**
- Verify your `CLOUDINARY_*` credentials in `backend/.env`.
- Ensure you have a stable internet connection.

**3. Map not loading**
- Ensure the frontend has internet access to load map tiles.
