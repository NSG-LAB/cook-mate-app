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

## Feature Roadmap

### Recipe Core

- Implemented: Recipe difficulty tags (easy, medium, hard)
- Implemented: Prep vs cook time split (not just total time)
- Implemented: Ingredient substitution suggestions ("no butter? use oil")
- Implemented: Print-friendly recipe view
- Implemented: Recipe version history (when a user edits their submission)
- Implemented: Video timestamp linking (jump to specific cooking step in the video)

### Smart Suggestions

- Implemented: "Cook again" - re-suggest recipes the user has cooked before
- Implemented: Seasonal ingredient suggestions (what's fresh and cheap right now)
- Implemented: Weather-based suggestions ("it's cold, here's a soup")
- Implemented: Occasion-based filters (date night, kids meal, meal prep Sunday)
- Implemented: AI-powered recipe remix (generate a variation based on what you have)

### Grocery and Pantry

- Implemented: Barcode scanner demo flow to add items to pantry
- Implemented: One-tap reorder for frequently bought items
- Implemented: Supermarket aisle grouping in grocery list (dairy together, produce together)
- Implemented: Budget tracker (spent vs planned)

### Nutrition and Health

- Allergen warning badges on recipe cards
- Water intake tracker alongside meals
- Integration with Apple Health / Google Fit
- Goal-based filtering (high protein, low carb, weight loss)

### Social and Community

- Recipe challenges (cook this week's featured dish)
- Chef badges and achievement system
- Tip threads under each recipe ("I added chili flakes, 10/10")
- Report / flag inappropriate community recipes

### UX and Engagement

- Voice command support ("Hey app, what can I cook with eggs?")
- Cooking history / cook log
- In-app cooking timer (independent of recipe steps)
- Widget for home screen (today's meal plan or random recipe)
- Haptic feedback during step-by-step cooking mode
- Multilingual support

### Admin and Backend

- Recipe moderation dashboard for community submissions
- Analytics dashboard (most cooked, most saved, drop-off points)
- A/B testing hooks for recommendation algorithms
- Ingredient price feed integration (for real cost estimates)
- CDN-backed video streaming for recipe videos

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
