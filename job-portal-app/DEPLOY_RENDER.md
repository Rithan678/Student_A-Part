Deploying Study A-Part on Render

This document explains the recommended steps to deploy the project to Render (backend Node API + frontend static site). It also lists environment variables and small code changes already made.

Summary of repo changes
- `frontend/src/config/api.ts` now uses `REACT_APP_API_BASE_URL` at build time if provided. This lets the built frontend call the deployed backend URL without editing source after build.

High-level plan
1. Provision a managed MySQL (or use an external managed MySQL like PlanetScale) and an object storage bucket (AWS S3 / DigitalOcean Spaces).
2. Create two Render services: a Web Service for the backend and a Static Site (or Web Service) for the frontend.
3. Set environment variables for each service (DB credentials for backend; `REACT_APP_API_BASE_URL` for frontend build).
4. Deploy and verify /api/health and frontend pages.

Detailed steps

1) Prepare database and object storage
- Option A (external MySQL): create a PlanetScale or other MySQL instance and get host/user/password/database and port.
- Option B (Render managed DB): If you prefer to use Render's managed database, create one and note the connection details.

Create an S3 (or Spaces) bucket and credentials for storing uploaded PDFs. You'll need:
- S3_BUCKET
- S3_REGION
- S3_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY

Note: This app currently stores uploaded PDFs in `backend/uploads` on disk. For production you should update the backend `auth`/`admin` upload code to upload to S3 and serve from S3 (or use a CDN). This guide assumes you'll configure S3 and update the code or add a simple S3 adapter.

2) Connect your Git repo to Render
- Sign into Render and connect your GitHub/GitLab account.
- Select the `job-portal-app` repository and branch to deploy.

3) Backend service (Web Service)
- Create a new Web Service on Render.
- Name: study-a-part-backend (or similar)
- Environment: Node
- Region: choose your region
- Branch: main (or your chosen branch)
- Root Directory / Path: `backend` (so Render runs build inside backend)
- Build Command: `npm install` (Render runs `npm run build` if you supply; this project doesn't have a separate build step)
- Start Command: `npm run start` (or `node server-react-api.js`)
- Health check: set to `http://{your-service}.onrender.com/api/health` (you can set it after the first deploy if needed)

4) Backend environment variables (set in Render Dashboard -> Environment)
- NODE_ENV=production
- PORT=3001 (or leave blank; Render provides a port but code uses process.env.PORT)
- DB_HOST=your-db-host
- DB_USER=your-db-user
- DB_PASSWORD=your-db-password
- DB_NAME=your-db-name
- DB_PORT=3306 (if needed)
- S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY (if you adapt uploads to use S3)

Security: mark secrets "Private" in Render.

5) Frontend deployment (Static Site recommended)
Option A: Static Site on Render
- Create a new Static Site.
- Name: study-a-part-frontend
- Root Directory / Path: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `frontend/build`
- Environment variables (set in Render site settings -> Environment):
  - REACT_APP_API_BASE_URL=https://<your-backend-service>.onrender.com

Option B: Vercel for frontend
- You can use Vercel for the frontend and Render for the backend. In that case set `REACT_APP_API_BASE_URL` on Vercel.

6) Configuring CORS
- In `backend/server-react-api.js` the CORS origin is currently set to `http://localhost:3000`. Update it in Render backend environment or edit the file to allow your frontend URL (for example `https://<your-frontend>.onrender.com`).
- Alternatively set an env var in Render for allowed origin and modify code to read it.

7) File uploads
- Migrate file uploads to S3 or another object store for durability. If you need, I can add S3 upload integration to `backend/routes/auth.js` and `backend/routes/admin.js`.

8) Verify deployment
- Once both services are deployed, check:
  - Backend health: `https://<backend>.onrender.com/api/health`
  - Frontend: visit the static site domain and try signup/login flows.

Local build and test before pushing
- Backend locally (after creating `.env` with DB credentials):
```powershell
cd C:\project\Student_APart\job-portal-app\backend
npm install
# create .env with DB credentials
npm run dev
```

- Frontend local:
```powershell
cd C:\project\Student_APart\job-portal-app\frontend
npm install
npm start
# Or build for production
npm run build
```

Helpful environment variables summary
- Backend (required): DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, PORT (optional), NODE_ENV
- Backend (recommended): S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY
- Frontend (build-time): REACT_APP_API_BASE_URL (e.g. `https://<backend>.onrender.com`)

If you want, I can:
- Add a small guide file (`DEPLOY_RENDER.md`) (done)
- Add S3 upload integration in backend code (I can implement safe changes and test)
- Generate a `render.yaml` for infra-as-code (I can create it if you prefer).

Next steps I can take for you
- Implement S3 uploads and update the backend to serve files from S3.
- Create `render.yaml` for automatic deploys and managed services.
- Walk through creating the Render services in your Render account step-by-step and set the env vars.

Tell me which of the next steps you'd like me to do.
