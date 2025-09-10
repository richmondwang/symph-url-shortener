# Symph URL Shortener — NestJS Backend

A modular, production-ready backend for a URL shortener service, built with [NestJS](https://nestjs.com/), MongoDB, Redis, and JWT authentication.

## Features
- Shorten URLs with custom slugs, expiration, UTM tracking, and click analytics
- User registration and JWT-based authentication
- RESTful API with modular controllers and services
- MongoDB for persistent storage
- Redis for caching and fast redirects
- Comprehensive unit and e2e tests (Jest)
- Config validation with Joi

## Project Structure
```
backend-node/
  src/
    auth/           # Auth module (JWT, register, login)
    check-slug/     # Slug availability checker
    dto/            # DTOs for requests/responses
    models/         # Mongoose models
    redirect/       # Redirect logic
    services/       # MongoDB & Redis services
    slugs/          # Slug management
    utils/          # Utility functions
    app.module.ts   # Main NestJS module
    main.ts         # Entry point
  test/             # e2e tests (Jest + Supertest)
  .env.test         # Test environment variables
  package.json      # Scripts & dependencies
```

## Getting Started

### Prerequisites
- Node.js >= 20
- MongoDB instance
- Redis instance

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file in `backend-node/` with:
```
MONGO_URI=mongodb://localhost:27017/urlshortener
MONGO_DB=urlshortener
REDIS_URL=redis://localhost:6379
JWT_SECRET_KEY=your_secret_key
BASE_URL=http://localhost:3000
```
For tests, `.env.test` is used automatically.

### Running the Server
```bash
npm run start:dev
```

### Running Tests
- **Unit tests:**
  ```bash
  npm run test
  ```
- **e2e tests:**
  ```bash
  npm run test:e2e
  ```
- **All tests:**
  ```bash
  npm run test:all
  ```

## API Endpoints
- `POST /api/register` — Register user
- `POST /api/login` — Login and get JWT
- `POST /api/shorten` — Create short URL
- `GET /api/slugs` — List user slugs
- `GET /:slug` — Redirect to destination
- `POST /api/check-slug` — Check slug availability

## Testing & Mocks
- All service tests use Jest mocks for MongoDB and Redis (see `src/*/*.spec.ts`)
- e2e tests use Supertest and require `.env.test`

## Scripts
- `start:dev` — Start server in watch mode
- `test` — Run unit tests
- `test:e2e` — Run e2e tests
- `test:all` — Run all tests
- `lint` — Run ESLint
- `format` — Run Prettier
