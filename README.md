[![Build Test](https://github.com/richmondwang/symph-url-shortener/actions/workflows/main.yaml/badge.svg)](https://github.com/richmondwang/symph-url-shortener/actions/workflows/main.yaml)

# Symph URL Shortener

A full-stack URL shortener application with authentication, analytics, and a modern React frontend. Built with Go (backend), MongoDB, Redis, and React + Material UI (frontend). Easily run locally with Docker Compose.

## Features
- Shorten URLs with optional custom slug, expiration, and UTM parameters
- User registration and login (JWT-based authentication)
- Track click analytics for each short URL
- View all your shortened URLs
- Custom slug validation and availability check
- RESTful API with OpenAPI/Swagger documentation
- Modern, responsive frontend (React + Material UI)
- MongoDB for persistent storage
- Redis for caching and analytics
- Docker Compose for easy local setup

## Prerequisites
- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Make](https://www.gnu.org/software/make/) (optional, for convenience)
- [Node.js](https://nodejs.org/) (recommended to use [nvm](https://github.com/nvm-sh/nvm) for version management)
- [Go](https://golang.org/) (recommended to use [gvm](https://github.com/moovweb/gvm) for version management)

## Local Development Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/richmondwang/symph-url-shortener.git
   cd symph-url-shortener
   ```

2. **Install dependencies:**
   ```sh
   make install
   ```
   This installs frontend npm packages and runs `go mod tidy` for the backend.

3. **Start all services (backend, frontend, MongoDB, Redis, mongo-express):**
   ```sh
   make up
   ```
   Or directly with Docker Compose:
   ```sh
   docker compose -f docker-compose.yml up --build
   ```

4. **Access the app:**
    - Frontend: [http://localhost:3000](http://localhost:3000)
    - Backend API: [http://localhost:8000](http://localhost:8000)
    - Swagger UI: [http://localhost:8000/swagger/index.html](http://localhost:8000/swagger/index.html)
    - Mongo Express: [http://localhost:8081](http://localhost:8081)
       - **Username:** mongoexpressuser
       - **Password:** mongoexpresspass

## Environment Variables
- See `.env` files and `docker-compose.yml` for all configurable options.
- Default MongoDB credentials: `symph` / `symph`
- JWT secret, CORS origins, and other settings are preconfigured for local development.

## Usage Overview
- Register a new user and log in
- Shorten URLs with custom options
- Copy and share your short links
- View and manage your URLs and analytics
- All API endpoints are documented in Swagger UI

## Project Structure
```
backend/         # Go backend (API, handlers, services, models)
backend-node/    # Node/NestJS backend (API, controllers, services, models, DTO)
frontend/        # React frontend (pages, components, assets)
docker-compose.yml
Makefile
README.md
```

## Notes
- Production deployment is not yet supported (can be added as an enhancement).
- For local development only. All credentials/secrets are for testing purposes.
- For questions or contributions, open an issue or pull request.

---

Enjoy shortening your URLs with Symph URL Shortener!
