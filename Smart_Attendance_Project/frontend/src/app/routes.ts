import { createBrowserRouter } from "react-router";
import Login from "./pages/Login";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/student",
    Component: StudentDashboard,
  },
  {
    path: "/teacher",
    Component: TeacherDashboard,
  },
  {
    path: "/admin",
    Component: AdminDashboard,
  },
]);
