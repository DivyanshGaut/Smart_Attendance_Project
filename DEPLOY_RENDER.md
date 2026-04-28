# Deploying This Project on Render

This project should be deployed as two Render services:

- `backend` as a Node web service
- `frontend` as a static site

## 1. Push the project to GitHub

Render deploys from a Git repository, so make sure this folder is pushed first.

## 2. Create the backend service

In Render, create a new `Web Service` and point it to this repo.

Use these settings:

- Root Directory: `backend`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check Path: `/api/health`

Required environment variables:

- `MONGODB_URI`: your MongoDB Atlas connection string
- `JWT_SECRET`: any long random secret
- `QR_SIGNING_SECRET`: another long random secret used to sign attendance QR payloads
- `FRONTEND_URL`: your frontend Render URL, for example `https://smart-attendance-frontend.onrender.com`

Optional environment variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
- `ATTENDANCE_RADIUS_METERS`
- `ATTENDANCE_MAX_ACCURACY_METERS`
- `ALLOW_INSECURE_DEV_ATTENDANCE=false`

Notes:

- The backend now supports `MONGODB_URI` for hosted MongoDB.
- Do not use local MongoDB on Render.
- File uploads are saved in `backend/uploads`. On Render, local disk is ephemeral, so uploaded files can disappear after redeploy or restart unless you attach persistent storage or move uploads to cloud storage.

## 3. Create the frontend service

In Render, create a new `Static Site` from the same repo.

Use these settings:

- Root Directory: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`

Required environment variable:

- `VITE_API_URL`: your backend API base URL with `/api`, for example `https://smart-attendance-backend.onrender.com/api`

Redirects/Rewrites:

- Rewrite `/*` to `/index.html`

This is required because the frontend uses browser routing.

## 4. Update backend CORS

After the frontend is created, copy its Render URL and set:

- `FRONTEND_URL=https://your-frontend-name.onrender.com`

Then redeploy the backend.

## 5. MongoDB setup

Use MongoDB Atlas or another hosted MongoDB provider.

Recommended Atlas steps:

1. Create a cluster.
2. Create a database user.
3. Allow Render to connect. For quick testing you can allow `0.0.0.0/0`, then lock it down later.
4. Copy the connection string into `MONGODB_URI`.

## 6. Optional: deploy from blueprint

This repo includes `render.yaml`, so you can also use Render Blueprint deploy.

You still need to fill in the secret env vars manually:

- `MONGODB_URI`
- `JWT_SECRET`
- `QR_SIGNING_SECRET`
- `FRONTEND_URL`
- `VITE_API_URL`
- SMTP values if you use email

## 7. Verify after deploy

Check these URLs:

- Backend health: `https://your-backend.onrender.com/api/health`
- Frontend: `https://your-frontend.onrender.com`

If login fails in production, the usual causes are:

- wrong `VITE_API_URL`
- wrong `FRONTEND_URL`
- missing `MONGODB_URI`
- MongoDB Atlas network access not allowed
