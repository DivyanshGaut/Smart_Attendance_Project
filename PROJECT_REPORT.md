# Smart Attendance and Proxy Detection System

Project documentation, architecture notes, flow explanation, tech stack summary, and viva/interview preparation.

Generated for: Smart_Attendance_Project  
Prepared on: 29 April 2026

---

## 1. Project Overview

Smart Attendance and Proxy Detection System is a MERN-style web application for managing student attendance using short-lived QR codes and location verification. The system has three main user roles:

- Student: scans attendance QR codes, views personal attendance, uploads assignments, downloads study material, and checks timetable.
- Teacher: generates live QR codes for a selected subject and section, monitors attendance, exports reports, views defaulters, and uploads study material.
- Admin: monitors overall attendance statistics, QR validation history, section/subject analytics, teacher/student counts, and defaulter summaries.

The main idea is to reduce proxy attendance by combining:

- Authenticated user identity through JWT.
- QR payloads signed using HMAC.
- Short QR expiry windows.
- Teacher location captured during QR generation.
- Student GPS location captured during scan.
- Radius-based distance validation.
- Duplicate scan prevention per QR session and subject/day.
- Client device scan identifier checks.

---

## 2. Main Objectives

- Digitize class attendance marking.
- Prevent students from marking attendance for absent classmates.
- Provide separate dashboards for students, teachers, and administrators.
- Generate subject-wise and monthly attendance reports.
- Identify students below required attendance thresholds.
- Maintain QR validation logs for administrative monitoring.
- Support study material and assignment document workflows.
- Keep the application deployable on Render with MongoDB Atlas.

---

## 3. High-Level Architecture

The system follows a client-server architecture:

```text
React/Vite Frontend
        |
        | HTTPS API calls using Axios
        v
Express.js Backend API
        |
        | Mongoose ODM
        v
MongoDB Database
```

Additional backend services:

- JWT authentication for all protected APIs.
- Joi request validation for important inputs.
- Multer file upload handling.
- Nodemailer for low attendance warning email flow.
- QRCode library for QR image generation.
- HMAC SHA-256 for QR payload signing.
- Express rate limiting for auth/API/QR scan protection.

---

## 4. Folder Structure

```text
Smart_Attendance_Project/
  backend/
    package.json
    server/
      server.js
      config/db.js
      controllers/
      middleware/
      models/
      routes/
      utils/
      seedAdmin.js
      seedStudent.js
      seedTeacher.js
      seedTimetable.js
      migrateStudentSections.js
    uploads/
  frontend/
    package.json
    src/
      main.tsx
      config.js
      services/
      app/
        App.tsx
        routes.ts
        pages/
        components/ui/
      styles/
  render.yaml
  DEPLOY_RENDER.md
```

---

## 5. Tech Stack

### Frontend

- React with TypeScript.
- Vite as the build tool and development server.
- React Router for client-side routing.
- Axios for API communication.
- Tailwind CSS and component utilities for styling.
- Radix UI based components.
- Lucide React icons.
- Recharts for admin analytics charts.
- react-qr-scanner for scanning QR codes.
- date-fns for date formatting and calendar helpers.

### Backend

- Node.js runtime.
- Express.js for REST APIs.
- MongoDB as the database.
- Mongoose for schema modeling and queries.
- bcrypt for password hashing.
- jsonwebtoken for JWT login sessions.
- Joi for request validation.
- qrcode for QR image generation.
- crypto module for HMAC QR signatures.
- multer for uploads.
- helmet for basic HTTP security headers.
- cors for frontend-backend communication.
- express-rate-limit for abuse protection.
- morgan for request logging.
- nodemailer for email warnings.

### Deployment

- Render web service for backend.
- Render static site for frontend.
- MongoDB Atlas or another hosted MongoDB service.
- Environment variables for secrets and URLs.

---

## 6. Backend Architecture

The backend entry point is `backend/server/server.js`.

Responsibilities:

- Load environment variables.
- Create the Express app.
- Configure security middleware: Helmet, CORS, JSON parser, Morgan.
- Serve uploaded files from `/uploads`.
- Connect to MongoDB.
- Mount route groups under `/api`.
- Register centralized error handling.
- Start the HTTP server.

Main route groups:

- `/api/auth`: login and password reset.
- `/api/student`: student QR scan and personal attendance.
- `/api/teacher`: QR generation and teacher-facing report APIs.
- `/api/admin`: reports, analytics, summaries, QR validations.
- `/api/timetable`: timetable read/create APIs.
- `/api/documents`: document upload and document/material listing.
- `/api/health`: health check endpoint.

---

## 7. Frontend Architecture

The frontend entry point is `frontend/src/main.tsx`, with routes defined in `frontend/src/app/routes.ts`.

Routes:

- `/`: login page.
- `/student`: student dashboard.
- `/teacher`: teacher dashboard.
- `/admin`: admin dashboard.

API services are centralized in `frontend/src/services/api.ts`.

Important frontend behavior:

- Axios uses `VITE_API_URL` or `/api` as the base URL.
- JWT is stored in local storage after login.
- Axios request interceptor attaches `Authorization: Bearer <token>`.
- Each dashboard calls its related backend APIs.
- Student QR scanning requires camera access and browser geolocation.
- Teacher QR generation requires geolocation.

---

## 8. Database Models

### Admin

Stores admin identity and password.

Fields:

- adminName
- email
- password
- role
- timestamps

Password is hashed with bcrypt before save.

### Teacher

Stores teacher identity and subject information.

Fields:

- teacherName
- teacherId
- email
- subject
- password
- role
- timestamps

Password is hashed with bcrypt before save.

### Student

Stores student identity and section.

Fields:

- SrNo
- studentName
- rollNo
- section
- password
- role
- timestamps

Password is hashed with bcrypt before save.

### QrSession

Stores one live attendance QR session.

Fields:

- teacherId
- subject
- section
- qrToken
- expiryTime
- latitude
- longitude
- isActive
- timestamps

The QR token is unique. Old active sessions for the same teacher/subject/section are deactivated before creating a new one.

### Attendance

Stores attendance records.

Fields:

- studentId
- qrSessionId
- section
- subject
- date
- time
- location: latitude, longitude, ipAddress
- scanMetadata: clientScanId, userAgent, accuracy
- status
- timestamps

Important indexes:

- Unique attendance per student, subject, and date.
- Unique attendance per student and QR session.
- QR session + client scan ID index for proxy detection.

### Timetable

Stores scheduled classes.

Fields:

- subject
- teacherId
- dayOfWeek
- startTime
- endTime
- room
- batch
- timestamps

### Document

Stores uploaded assignment/material metadata.

Fields:

- title
- subject
- studentId
- uploadedBy
- fileUrl
- fileName
- timestamps

---

## 9. Authentication and Authorization Flow

1. User selects a role on the login page: student, teacher, or admin.
2. Student logs in with roll number. Teacher/admin logs in with email.
3. Backend validates request with Joi.
4. Backend finds the matching user model based on role.
5. bcrypt compares the submitted password with the stored hash.
6. On success, backend signs a JWT containing user ID and role.
7. Frontend stores token and user object in local storage.
8. Frontend redirects user to the correct dashboard.
9. Protected APIs use `authenticate` middleware to verify JWT.
10. Role-specific APIs use `authorize(...)` middleware.

---

## 10. QR Attendance Flow

### Teacher Side

1. Teacher logs in and opens the Teacher Dashboard.
2. Teacher selects section and subject.
3. Teacher clicks Generate QR Code.
4. Browser asks for teacher location.
5. Frontend sends subject, section, latitude, longitude, and expiry seconds to backend.
6. Backend validates the request.
7. Backend deactivates old active sessions for the same teacher/subject/section.
8. Backend creates a new `QrSession`.
9. Backend creates a signed QR payload with session metadata.
10. Backend converts the signed payload to a QR image data URL.
11. Frontend displays the QR and starts a countdown timer.

### Student Side

1. Student logs in and opens the Student Dashboard.
2. Student clicks Open Scanner.
3. Browser requests camera access.
4. Student scans the teacher's live QR code.
5. Frontend parses the QR JSON payload.
6. Browser requests student GPS location.
7. Frontend sends QR payload fields, student location, GPS accuracy, and client scan ID.
8. Backend verifies:
   - JWT belongs to a student.
   - QR session exists.
   - QR session is active.
   - QR has not expired.
   - QR payload expiry matches the stored session.
   - QR HMAC signature is valid.
   - Student belongs to the QR section.
   - GPS accuracy is acceptable.
   - Student is within allowed radius of teacher location.
   - Same device was not already used for another student in the same session.
   - Student has not already marked attendance for that session.
   - Student has not already marked attendance for the subject on the same day.
9. Backend creates the attendance record.
10. Frontend refreshes attendance data and shows success.

---

## 11. Proxy Detection Logic

The project uses several checks together instead of depending on only one check:

- Short-lived QR code: expiry is limited by backend validation.
- Signed QR payload: HMAC prevents tampering with session ID, subject, section, token, issue time, and expiry time.
- Teacher location: stored when QR is generated.
- Student location: captured when scanning QR.
- Radius check: Haversine distance compares teacher and student coordinates.
- GPS accuracy threshold: rejects scans with low location accuracy.
- Duplicate session check: one student cannot mark the same QR session twice.
- Duplicate subject/day check: one student cannot mark the same subject twice on the same date.
- Client scan ID check: same browser/device identifier cannot mark attendance for multiple students in one QR session.
- JWT identity: attendance is always tied to the authenticated student.

---

## 12. Reports and Analytics

### Teacher Reports

Teacher dashboard can show:

- Monthly attendance report for selected section and subject.
- Defaulter list below 75%.
- Total students in current report.
- Debarred count.
- CSV export of attendance report.
- CSV export of defaulter list.

### Admin Reports

Admin dashboard can show:

- Total students.
- Active attendance today.
- Total sections.
- Total teachers.
- Average attendance.
- Debarred student count.
- QR scans generated today.
- Subject-wise present/absent distribution.
- Selected subject student-wise report.
- QR validation history.
- Weekly attendance overview.

---

## 13. Document and Study Material Flow

### Student Assignment Upload

1. Student chooses a file from the dashboard.
2. Frontend sends multipart form data to `/api/documents/upload`.
3. Backend uses Multer to save the file in `backend/uploads`.
4. Backend stores metadata in the `Document` collection with `studentId`.
5. Student can view uploaded documents.

### Teacher Material Upload

1. Teacher chooses a file from the dashboard.
2. Frontend sends multipart form data to `/api/documents/upload`.
3. Backend stores metadata with `uploadedBy` set to teacher ID.
4. Students can view materials uploaded by teachers.
5. Teacher can view their uploaded materials.

Important deployment note: Render local disk is ephemeral, so uploaded files may disappear after restart or redeploy unless persistent disk or cloud storage is used.

---

## 14. Timetable Flow

- `GET /api/timetable` returns timetable entries and supports filters like teacher ID, day of week, and batch.
- `POST /api/timetable` allows admins to create timetable entries.
- Student dashboard displays weekly timetable data.
- Timetable entries reference teachers and include subject, day, start time, end time, room, and batch.

---

## 15. Security Features

- bcrypt password hashing.
- JWT authentication.
- Role-based authorization middleware.
- Helmet security headers.
- CORS allowlist for frontend domains and local network development.
- Rate limiting for auth, general API, and QR scan endpoints.
- Joi validation for key requests.
- HMAC-signed QR payloads.
- Timing-safe signature comparison.
- Location radius validation.
- Duplicate attendance prevention.
- Client scan ID based anti-proxy protection.
- Centralized error handler.

---

## 16. Environment Variables

Backend:

- `MONGODB_URI`: MongoDB connection string.
- `JWT_SECRET`: secret used for JWT signing.
- `JWT_EXPIRES_IN`: JWT validity period, default 8h.
- `QR_SIGNING_SECRET`: secret used for QR HMAC signatures.
- `FRONTEND_URL` or `FRONTEND_URLS`: allowed frontend origins.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: mail configuration.
- `MAIL_FROM`: sender email for warnings.
- `ATTENDANCE_RADIUS_METERS`: allowed distance from teacher location, default 100.
- `ATTENDANCE_MAX_ACCURACY_METERS`: maximum accepted GPS accuracy value, default 150.
- `PORT`: backend server port, default 5000.

Frontend:

- `VITE_API_URL`: backend API base URL ending with `/api`.

---

## 17. Local Setup

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Useful backend scripts:

```bash
npm run seed:admin
npm run seed:students
npm run seed:teachers
npm run migrate:sections
npm start
```

---

## 18. Deployment Summary

Recommended Render deployment:

- Backend as a Node Web Service.
- Frontend as a Static Site.
- MongoDB Atlas for database.

Backend Render settings:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`

Frontend Render settings:

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Rewrite: `/*` to `/index.html`

---

## 19. Important API Endpoints

Authentication:

- `POST /api/auth/login`
- `POST /api/auth/reset-password`

Student:

- `POST /api/student/scan-qr`
- `GET /api/student/my-attendance`

Teacher:

- `POST /api/teacher/generate-qr`
- `GET /api/teacher/monthly-report`
- `GET /api/teacher/defaulters`

Admin:

- `GET /api/admin/monthly-report`
- `GET /api/admin/defaulters`
- `GET /api/admin/attendance-analytics`
- `GET /api/admin/dashboard-summary`
- `GET /api/admin/qr-validations`

Timetable:

- `GET /api/timetable`
- `POST /api/timetable`

Documents:

- `POST /api/documents/upload`
- `GET /api/documents/my-documents`
- `GET /api/documents/teacher-documents`
- `GET /api/documents/materials`

Health:

- `GET /api/health`

---

## 20. Data Flow Diagram

```text
Teacher Dashboard
  -> Browser Geolocation
  -> POST /api/teacher/generate-qr
  -> QrSession saved in MongoDB
  -> Signed QR generated
  -> QR displayed to class

Student Dashboard
  -> Camera scans QR
  -> Browser Geolocation
  -> POST /api/student/scan-qr
  -> QR/session/signature/location checks
  -> Attendance saved in MongoDB
  -> Dashboard refreshes attendance

Admin Dashboard
  -> GET analytics/report APIs
  -> Aggregates Attendance, Student, Teacher, QrSession, Timetable
  -> Charts, summaries, and validation history displayed
```

---

## 21. Current Strengths

- Role-based system design.
- Practical anti-proxy mechanism using QR plus GPS.
- Signed QR payload prevents QR data tampering.
- Separate student, teacher, and admin dashboards.
- Attendance analytics and defaulter reporting.
- File upload workflow for assignments and study materials.
- Deployment instructions and Render configuration.
- Clear backend modularization into routes, controllers, models, middleware, and utilities.

---

## 22. Possible Improvements

- Store uploads in cloud storage such as S3, Cloudinary, or Firebase Storage for production.
- Add refresh tokens or HTTP-only cookies for stronger session handling.
- Add admin CRUD screens for students, teachers, subjects, sections, and timetable.
- Add test cases for authentication, QR validation, and reports.
- Add stricter file type and file size validation.
- Add audit logs for admin actions.
- Add email/OTP verification before password reset.
- Add real-time attendance updates using WebSockets.
- Add QR session closure by teacher.
- Add attendance export as PDF in addition to CSV.
- Add indexes/aggregation pipelines for report performance at larger scale.

---

## 23. Viva and Interview Questions With Answers

### Project Basics

Q1. What problem does this project solve?  
A. It digitizes attendance and reduces proxy attendance by requiring authenticated QR scans from students near the teacher's location.

Q2. Who are the users of the system?  
A. Students, teachers, and admins.

Q3. What are the main modules?  
A. Authentication, QR attendance, student dashboard, teacher dashboard, admin analytics, timetable, document upload, and reports.

Q4. Why is it called a smart attendance system?  
A. Because it uses QR codes, GPS validation, signed payloads, duplicate checks, analytics, and automated warning flow instead of manual attendance.

Q5. What makes it different from a normal attendance system?  
A. A normal system may only record presence manually. This system verifies identity, time, QR validity, section, GPS proximity, and duplicate scans.

### Architecture

Q6. Which architecture is used?  
A. Client-server architecture with React frontend, Express backend, and MongoDB database.

Q7. Why did you separate frontend and backend?  
A. Separation improves maintainability, allows independent deployment, and keeps UI logic separate from API/business logic.

Q8. What is the role of Express?  
A. Express handles REST API routes, middleware, authentication checks, request validation, and controller execution.

Q9. What is the role of MongoDB?  
A. MongoDB stores users, QR sessions, attendance records, timetable entries, and document metadata.

Q10. What is Mongoose used for?  
A. Mongoose defines schemas, models, indexes, validation rules, and provides database query APIs.

### Authentication

Q11. How does login work?  
A. The user submits role, identifier, and password. Backend validates input, finds the user, compares bcrypt password hash, signs a JWT, and returns token plus user details.

Q12. Why is bcrypt used?  
A. bcrypt hashes passwords with salt, so plain passwords are not stored in the database.

Q13. What is JWT?  
A. JWT is a signed token that carries user identity and role. The backend verifies it before allowing protected API access.

Q14. How is role-based access implemented?  
A. `authenticate` verifies the token and `authorize` checks whether the user's role is allowed for the route.

Q15. Why should JWT secret be stored in environment variables?  
A. Secrets must not be hardcoded because anyone with source access could forge tokens.

### QR Attendance

Q16. How is the QR code generated?  
A. Backend creates a QR session, signs session metadata using HMAC SHA-256, converts it into a QR image data URL, and sends it to the frontend.

Q17. What does the QR payload contain?  
A. It contains type, version, session ID, teacher ID, subject, section, QR token, issued time, expiry time, and signature.

Q18. Why is the QR signed?  
A. Signing prevents students from editing QR fields such as subject, expiry, session ID, or section.

Q19. What happens when QR expires?  
A. The scan API rejects it because current time is greater than session expiry time.

Q20. How does the system prevent duplicate attendance?  
A. It checks existing records for the same student and QR session, and for the same student, subject, and date.

Q21. How is proxy attendance reduced?  
A. The system checks JWT identity, QR signature, session validity, student section, GPS distance, GPS accuracy, client scan ID, and duplicate attendance.

Q22. What is Haversine distance?  
A. It is a formula used to calculate distance between two latitude-longitude points on Earth.

Q23. Why is GPS accuracy checked?  
A. Low accuracy can produce unreliable location results, so the scan is rejected if accuracy is worse than the configured threshold.

Q24. Can a screenshot of QR be misused?  
A. It is harder to misuse because QR expires quickly, is signed, tied to a session, and still requires valid student GPS location.

Q25. Why store teacher location?  
A. Teacher location is the reference point used to verify whether the student is physically near the class.

### Database

Q26. Why use indexes in Attendance?  
A. Indexes speed up lookups and enforce uniqueness for duplicate prevention.

Q27. What is the purpose of QrSession collection?  
A. It stores active and past QR sessions with token, expiry, subject, section, teacher, and location.

Q28. Why is `studentId + subject + date` unique?  
A. To prevent a student from marking attendance more than once for the same subject on the same day.

Q29. Why is `studentId + qrSessionId` unique?  
A. To prevent a student from marking the same QR session multiple times.

Q30. What is the Document model used for?  
A. It stores metadata for uploaded assignments and study materials.

### Frontend

Q31. Why use React?  
A. React makes it easier to build reusable components and dynamic dashboards.

Q32. Why use Vite?  
A. Vite provides fast development server startup and optimized production builds.

Q33. How does frontend attach JWT?  
A. Axios interceptor reads token from local storage and adds it to the Authorization header.

Q34. Which library is used for charts?  
A. Recharts is used in the admin dashboard.

Q35. Which library is used for icons?  
A. Lucide React is used for UI icons.

### Reports and Analytics

Q36. How is monthly report generated?  
A. Backend fetches students, fetches attendance for selected subject/month/year, calculates present count, total count, and percentage.

Q37. What is a defaulter?  
A. A student whose attendance percentage is below the threshold, usually 75%.

Q38. How does admin dashboard calculate average attendance?  
A. It counts all attendance records and calculates present records divided by total records.

Q39. What does QR validation history show?  
A. It shows recent QR sessions, teacher, subject, section, students marked, location, timestamp, and status.

Q40. Why are analytics useful?  
A. They help admins and teachers identify weak attendance patterns and take action early.

### Security

Q41. What security middleware is used?  
A. Helmet, CORS, rate limiters, JWT middleware, role authorization, and Joi validation.

Q42. Why is rate limiting required?  
A. It reduces brute-force login attempts and repeated QR scan abuse.

Q43. Why use timing-safe signature comparison?  
A. It reduces timing attack risk when comparing cryptographic signatures.

Q44. What is CORS?  
A. CORS controls which frontend origins are allowed to call backend APIs from a browser.

Q45. What is the risk of storing JWT in local storage?  
A. If XSS occurs, an attacker may steal the token. HTTP-only cookies are safer for production.

### Deployment

Q46. How is this project deployed?  
A. Backend is deployed as a Render Node web service, frontend as a Render static site, and database on MongoDB Atlas.

Q47. Why is `VITE_API_URL` needed?  
A. It tells the frontend where the backend API is hosted.

Q48. Why is `/api/health` useful?  
A. It lets Render or developers verify that the backend server is running.

Q49. Why should file uploads move to cloud storage in production?  
A. Render's local disk can be ephemeral, so uploaded files may disappear after restarts or redeployments.

Q50. What are the most important backend environment variables?  
A. `MONGODB_URI`, `JWT_SECRET`, `QR_SIGNING_SECRET`, and frontend URL/CORS settings.

### Advanced and HR-Style Questions

Q51. What was the most challenging part of the project?  
A. Combining QR expiry, signature validation, GPS verification, and duplicate prevention into one reliable attendance flow.

Q52. How would you scale this system?  
A. Use database indexes, aggregation pipelines, cloud file storage, caching for dashboard summaries, load-balanced backend instances, and background jobs for email.

Q53. How would you improve password reset?  
A. Add OTP/email verification and short-lived reset tokens instead of directly resetting with identifier.

Q54. How would you test QR attendance?  
A. Unit test QR signature functions, integration test scan API, test expired QR, wrong section, duplicate scan, outside radius, and invalid signature.

Q55. What can be added in future?  
A. Face recognition, biometric integration, WebSocket live attendance, better admin management pages, PDF reports, and cloud storage.

---

## 24. Short Explanation for Viva

This project is a role-based smart attendance web application built using React, Node.js, Express, and MongoDB. Teachers generate short-lived signed QR codes for a subject and section. Students scan the QR code from their dashboard, and the backend validates the student's JWT, QR signature, session expiry, section, location radius, GPS accuracy, and duplicate attendance rules. Attendance is stored in MongoDB and is used to generate student summaries, teacher reports, defaulter lists, admin analytics, and QR validation logs. The project also includes timetable management and document upload features for assignments and study material.

