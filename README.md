# CookMate Student

Student Cooking Assistant App starter project.

## Stack

- Frontend: React Native (Expo), Axios, React Navigation, Context API
- Backend: Spring Boot, Spring Security (JWT), REST APIs
- Database: MySQL

## Project Structure

- `backend` → Spring Boot API
- `frontend` → React Native app

## Features Included (MVP)

- JWT signup/login
- Simple recipe listing with:
  - time
  - estimated cost
  - calories
  - region
  - video URL
- Budget-based recipe suggestions
- Ingredient-match suggestions (`What’s in my fridge?`)
- Smart grocery list generator from selected recipes
- Nutrition summary endpoint
- React Native screens:
  - Splash
  - Login / Signup
  - Home Dashboard (quick mode + budget slider + suggestions)
  - My Ingredients (chips selector)
  - Recipe Suggestions
  - Recipe Detail
  - Grocery List
  - Profile

## Database Setup

1. Start MySQL locally (8.x recommended).
2. Create the database once:

```sql
CREATE DATABASE cookmate_student;
```

3. Update `spring.datasource.username` / `spring.datasource.password` in `backend/src/main/resources/application.properties` so Spring can connect.

## Backend Run

After the database is reachable, start the API:

```bash
cd backend
mvn spring-boot:run
```

Backend runs at `http://localhost:8080`.

### Seeded data

- A demo account (`student@example.com` / `password123`) is created automatically.
- Nine budget-friendly recipes (rice bowls, noodles, pasta, wraps, breakfast poha, hummus toast, etc.) are inserted on the first boot via `DataSeeder`. They power:
  - Budget + region filters on Home/Suggestions
  - Ingredient matches (poha uses potato/onion, pasta uses tomato/garlic, ramen uses noodles/garlic, etc.)
  - Grocery list generation (all ingredient chips map to actual pantry items stored in MySQL)

To refresh the dataset, drop the `recipes` table or clear it and restart the backend.

## Frontend Run

```bash
cd frontend
npm install
npm run start
```

Or from workspace root:

```bash
npm run start
```

In `frontend/src/services/api.js`, change `BASE_URL` to your machine IP for physical device testing.

## Run on Simulator (Windows)

This project uses Expo, so on Windows you should use an Android emulator.

### 1) Start backend

```bash
cd backend
mvn spring-boot:run
```

### 2) Start Android Emulator

- Open Android Studio
- Go to Device Manager
- Start an AVD (e.g., Pixel API 34)

### 3) Start frontend

```bash
cd frontend
npm install
npm run android
```

### Notes

- Android emulator accesses your PC localhost backend using `http://10.0.2.2:8080`.
- Web and iOS simulator use `http://localhost:8080`.
- For a physical phone, set API base URL to your machine LAN IP (for example `http://192.168.1.10:8080`).

## Default Seed Data

The backend seeds sample quick recipes from multiple regions at startup.
