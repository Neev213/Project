# Weather Earth

A full-stack weather app where you scroll out of deep space, dive through the clouds, and land in the real sky above any place on Earth. The globe, the Sun and the Moon sit where they really are for the place you search, so it is night on the planet when it is night at your city.

**Live demo:** `<https://your-project.vercel.app>`

<!-- Add 3-4 screenshots or a short GIF in docs/screenshots/ and link them here:
![Landing](docs/screenshots/landing.png)
![Dashboard](docs/screenshots/dashboard.png)
-->

## Features

**Experience**
- Scroll-driven landing page: the camera travels around a 3D Earth as you scroll.
- Camera fly to a glowing glass login window, then a plunge through a particle cloud layer and a white flash into the dashboard.
- Real sky for the searched place: the Sun and Moon are positioned from their true altitude and bearing, and the Earth's day and night sides match the local time.
- Weather you can see: rain, snow, clouds, fog, wind and lightning change the scene to match the current conditions.

**Weather**
- Current conditions, feels-like, wind, humidity, pressure, UV index, cloud cover, sunrise, sunset and rain chance.
- Next 24 hours and a 7-day forecast with temperature range bars.
- Search with suggestions from 3 letters: up to 10 matches including small villages, each with region, country and population. Same-name places are told apart by coordinates, so "Kapasan, Rajasthan" is not confused with another Kapasan.
- Keyboard navigation in the search box (arrows, Enter, Escape) and screen-reader roles.

**Accounts**
- Sign up with a 6-digit email code, or continue with Google.
- Favorites shown as a 3D cover-flow carousel (Swiper), and recent-search chips. Both are saved per user by coordinates.

**Performance and polish**
- The API answers first and saves search history in the background.
- Forecasts are cached on the server for 10 minutes and place lookups for an hour, with a matching 10-minute cache in the browser.
- Results for a suggestion are prefetched when you hover it, so picking it feels instant.
- Loading screen with real progress, an error boundary around the 3D canvas, a lower pixel ratio on phones and a mobile layout for the search bar.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS 4, React Router 7, Axios |
| 3D | Three.js, React Three Fiber, Drei, custom GLSL shaders |
| Animation | GSAP, Framer Motion, Swiper |
| Astronomy | suncalc 2 (Sun and Moon position) |
| Auth | JWT, bcryptjs, email verification codes, Google Sign-In (`@react-oauth/google`, `google-auth-library`) |
| Backend | Node.js 18+, Express 5, Mongoose 9, node-cache |
| Database | MongoDB Atlas |
| Data | [Open-Meteo](https://open-meteo.com/) forecast and geocoding APIs |
| Email | Brevo transactional email API (codes print in the terminal in development) |
| Security | helmet, express-rate-limit, CORS limited to the frontend origin, request body size limit, input validation |
| Hosting | Vercel (frontend), Render (backend), MongoDB Atlas |

## How it works

**One scene for the whole app.** A single React Three Fiber canvas lives outside the router, so moving between the landing page, login and dashboard is one continuous camera journey instead of three separate scenes. Scene state (scroll, mouse, camera phase, sky, weather mood) lives in refs, so animating it never re-renders React.

**The real sky.** For a place and a time, suncalc gives the Sun's and Moon's altitude and bearing. The app builds the place's up, east and north directions on the globe, then rotates the Earth so that place sits under the camera and the Sun's bearing faces the view. One shared light direction drives every shader: the Earth's day and night blend with city lights, the cloud layer and the atmosphere glow all agree on where the terminator is.

**Weather mood.** Weather codes, precipitation, cloud cover and wind are turned into a set of eased values (cloud, rain, snow, fog, darkness, flash). Particle systems and the light intensity read those values, so the scene changes smoothly when you switch city.

**Search by place, not by name.** Suggestions carry coordinates. Choosing one fetches the forecast by latitude and longitude, so two places with the same name stay separate, and favorites and history use the same rounded coordinates as their key.

## Project structure

```
Project/
├── Frontend/
│   ├── public/textures/      Earth day, night and cloud maps
│   └── src/
│       ├── api/              Axios instance and API calls
│       ├── components/       Glass UI, dashboard widgets, loader
│       ├── context/          Scene and auth state
│       ├── hooks/            useWeather, useFavorites, usePlunge, ...
│       ├── pages/            Landing, Login, Dashboard
│       ├── three/            Canvas, camera and sky rigs, objects, sky maths
│       └── utils/
└── backend/
    ├── controllers/
    ├── middleware/
    ├── models/               User, Favorite, SearchHistory
    ├── routes/
    ├── services/             Open-Meteo calls and cache
    ├── utils/                Email and token helpers
    └── server.js
```

## Getting started

**You need:** Node.js 18 or newer (the backend uses the built-in `fetch`), a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, and a Google OAuth Web client ID.

### 1. Clone

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=<your Atlas connection string>
JWT_SECRET=<a long random string>
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=<your Google OAuth client ID>

# Optional in development. Without BREVO_API_KEY, verification codes
# are printed in this terminal instead of being emailed.
# BREVO_API_KEY=
# EMAIL_FROM=
# EMAIL_FROM_NAME=Weather Earth
```

```bash
npm run dev
```

The server refuses to start if `CLIENT_URL`, `JWT_SECRET` or `MONGO_URI` is missing.

### 3. Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=<your Google OAuth client ID>
```

```bash
npm run dev
```

Open http://localhost:5173. Vite reads `.env` only at startup, so restart it after any change.

### Google Sign-In setup

1. In Google Cloud Console, open **APIs & Services → Credentials** and create an **OAuth client ID** of type **Web application**.
2. Add `http://localhost:5173` (and your deployed frontend URL later) under **Authorized JavaScript origins**.
3. Use the client ID in both `.env` files. No client secret is needed, because the backend verifies the ID token against the client ID.

### Testing the sky

Add `?fx=rain`, `?fx=snow`, `?fx=storm`, `?fx=fog`, `?fx=cloudy` or `?fx=clear` to the dashboard URL to force a weather mood without waiting for real weather.

## Environment variables

**Backend**

| Variable | Purpose |
| --- | --- |
| `PORT` | Local port. Leave it unset on Render, which provides its own. |
| `MONGO_URI` | MongoDB Atlas connection string. |
| `JWT_SECRET` | Secret used to sign login tokens. |
| `CLIENT_URL` | Exact frontend origin allowed by CORS, with no trailing slash. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID, used to verify Google sign-ins. |
| `NODE_ENV` | Set to `production` when deployed. |
| `BREVO_API_KEY` | Brevo API key for verification emails. |
| `EMAIL_FROM` | Verified sender address in Brevo. |
| `EMAIL_FROM_NAME` | Optional sender name (defaults to "Weather Earth"). |

**Frontend**

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL including `/api`. |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID. |

Never commit `.env` files. Vite variables are baked in at build time, so redeploy the frontend after changing them.

## API

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | none | Create an account and email a 6-digit code |
| `POST` | `/api/auth/verify-email` | none | Confirm the code |
| `POST` | `/api/auth/resend-code` | none | Send a new code (60 s cooldown) |
| `POST` | `/api/auth/login` | none | Log in with email and password |
| `POST` | `/api/auth/google` | none | Log in with a Google ID token |
| `GET` | `/api/auth/me` | required | Current user |
| `GET` | `/api/weather` | optional | Forecast by `city`, or by `lat`, `lon`, `name`, `country`, `admin1`. Saves history when logged in. `prefetch=1` skips history. |
| `GET` | `/api/weather/search?q=` | none | Place suggestions (up to 10) |
| `GET` | `/api/favorites` | required | List favorites |
| `POST` | `/api/favorites` | required | Add a favorite |
| `DELETE` | `/api/favorites/:id` | required | Remove a favorite |
| `GET` | `/api/history` | required | Recent searches, newest first |
| `DELETE` | `/api/history` | required | Clear history |

## Security

- Passwords are hashed with bcrypt. Verification codes are stored only as hashes, expire after 10 minutes, allow 5 attempts and can be resent once a minute.
- Login tokens are JWTs checked by middleware on protected routes.
- `helmet` security headers, CORS limited to `CLIENT_URL`, a 10 kB JSON body limit, and input validation on auth routes.
- Rate limiting: a general limit on all routes and stricter limits on login, Google login, register, verify and resend.
- Secrets live only in environment variables, and the server exits at startup if a required one is missing.

## Deployment

| Part | Host | Settings |
| --- | --- | --- |
| Frontend | Vercel | Root directory `Frontend`. Environment variables `VITE_API_URL` and `VITE_GOOGLE_CLIENT_ID`. A `vercel.json` rewrite sends every route to `index.html`, so refreshing `/dashboard` works. |
| Backend | Render | Root directory `backend`, build command `npm install`, start command `npm start`. Set the backend variables above, and set `CLIENT_URL` to the exact Vercel URL. |
| Database | MongoDB Atlas | Allow network access from `0.0.0.0/0` (Render's free tier has no fixed IP) and use a strong database password. |

Also add the deployed frontend URL to the Google client's **Authorized JavaScript origins**.

Render's free tier spins the server down after 15 minutes without traffic, so the first request after a pause can take about a minute. The dashboard shows a "waking up" message while it starts.

## Roadmap

- Celsius and Fahrenheit toggle
- Reduced-motion mode and lower sphere detail on weak GPUs
- Automated backend tests and schema validation with Zod

## Credits

- Weather and geocoding data: [Open-Meteo.com](https://open-meteo.com/), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Sun and Moon positions: [suncalc](https://github.com/mourner/suncalc)
- Earth textures: `<add the source and license of your day, night and cloud maps>`
- 3D and animation: [Three.js](https://threejs.org/), [React Three Fiber](https://r3f.docs.pmnd.rs/), [Drei](https://github.com/pmndrs/drei), [GSAP](https://gsap.com/), [Framer Motion](https://www.framer.com/motion/), [Swiper](https://swiperjs.com/)

## Author

`Neev Soni` · [GitHub](https://github.com/Neev213) 