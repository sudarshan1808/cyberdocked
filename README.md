# Cyberflix MERN Stack Project

A full-stack MERN (MongoDB, Express, React, Node.js) application for streaming platform content management.

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Deployment**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## Project Structure

```
/project-root
/client          # React + Vite frontend
/server          # Node + Express backend
docker-compose.yml
.github/workflows/deploy.yml
```

## Local Development Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Docker & Docker Compose

### Environment Variables

Create `.env` files in both `client/` and `server/` directories.

**server/.env:**
```
MONGO_URI=mongodb://127.0.0.1:27017/cyberflix
JWT_SECRET=your-jwt-secret
PORT=5000
```

**client/.env:**
```
VITE_API_URL=http://localhost:5000
```

### Running with Docker Compose

```bash
docker-compose up --build
```

This will start:
- Frontend on http://localhost:3000
- Backend on http://localhost:5000

### Running Locally (without Docker)

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Start development servers:
   ```bash
   npm run dev
   ```

## Production Deployment

### Docker Images

The project includes Dockerfiles for both frontend and backend:

- Backend: `Dockerfile` in `server/`
- Frontend: Multi-stage `Dockerfile` in `client/` (build + nginx)

### CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

- Builds Docker images on push to `main`
- Pushes images to Docker Hub as `<username>/mern-backend` and `<username>/mern-frontend`

### Required GitHub Secrets

Set these in your repository settings:

- `DOCKER_USERNAME`: Your Docker Hub username
- `DOCKER_PASSWORD`: Your Docker Hub password/token

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/content` - Get all content
- `GET /api/content/:id` - Get content by ID
- `POST /api/watchlist` - Add to watchlist
- `GET /api/watchlist` - Get user watchlist

## Features

- User authentication and authorization
- Content browsing and details
- Personal watchlist
- Email verification
- Responsive design

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `docker-compose up --build`
5. Push to your fork
6. Create a pull request