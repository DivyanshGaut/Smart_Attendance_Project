import axios from "axios";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;

export type UserRole = "student" | "teacher" | "admin";

export type LoginResponse = {
  message: string;
  token: string;
  user: {
    id: string;
    role: UserRole;
    name: string;
    identifier: string;
  };
};

export type AttendanceRecord = {
  _id: string;
  studentId: string;
  subject: string;
  date: string;
  time?: string;
  status: string;
};

export type AttendanceSummary = {
  total: number;
  present: number;
  percentage: number;
  records: AttendanceRecord[];
};

export type AttendanceReportRow = {
  rollNo: string;
  name: string;
  attendance: number;
  classes?: string;
  present?: number;
  total?: number;
};

export type AdminDashboardSummary = {
  totalStudents: number;
  activeToday: number;
  totalSections: number;
  totalTeachers: number;
  avgAttendance: number;
  debarredCount: number;
  qrScansToday: number;
  sections: string[];
  subjects: string[];
};

export type AdminAttendanceAnalytics = {
  month: number;
  year: number;
  pie: {
    status: string;
    count: number;
  }[];
  subjectBreakdown: {
    subject: string;
    present: number;
    absent: number;
  }[];
  weeklyOverview: {
    day: string;
    present: number;
    absent: number;
  }[];
};

export type QrValidationRecord = {
  id: string;
  timestamp: string;
  teacher: string;
  subject: string;
  section: string;
  studentsMarked: number;
  status: string;
  location: string;
};

export type DocumentRecord = {
  _id: string;
  title: string;
  subject: string;
  fileUrl: string;
  fileName: string;
  createdAt?: string;
  updatedAt?: string;
  uploadedBy?: {
    teacherName?: string;
  };
};

export type TimetableEntry = {
  _id: string;
  subject: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  batch?: string;
  teacherId?: {
    teacherName?: string;
    email?: string;
  };
};

export const login = async (
  role: UserRole,
  identifier: string,
  password: string
) => {
  const response = await api.post<LoginResponse>("/auth/login", {
    role,
    identifier,
    password,
  });

  return response.data;
};

export const scanQr = async (data: {
  qrToken: string;
  latitude?: number;
  longitude?: number;
}) => {
  const response = await api.post("/student/scan-qr", data);
  return response.data;
};

export const getMyAttendance = async () => {
  const response = await api.get<AttendanceSummary>("/student/my-attendance");
  return response.data;
};

export const generateQr = async (data: {
  subject: string;
  section: string;
  latitude: number;
  longitude: number;
  expirySeconds: number;
}) => {
  const response = await api.post<{
    message: string;
    qrCodeDataUrl: string;
    session: {
      id: string;
      qrToken: string;
      subject: string;
      section: string;
      expiryTime: string;
    };
  }>("/teacher/generate-qr", data);

  return response.data;
};

export const getAttendanceReport = async (params: {
  month: number;
  year: number;
  subject: string;
  section?: string;
}) => {
  const response = await api.get<AttendanceReportRow[]>("/admin/monthly-report", {
    params,
  });

  return response.data;
};

export const getDefaulters = async (params: {
  month: number;
  year: number;
  subject: string;
  section?: string;
  threshold?: number;
}) => {
  const response = await api.get<AttendanceReportRow[]>("/admin/defaulters", {
    params,
  });

  return response.data;
};

export const getTimetable = async (params?: {
  teacherId?: string;
  dayOfWeek?: string;
  batch?: string;
}) => {
  const response = await api.get<{ count: number; timetable: TimetableEntry[] }>(
    "/timetable",
    { params }
  );

  return response.data;
};

export const createTimetableEntry = async (entryData: {
  subject: string;
  teacherId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  batch?: string;
}) => {
  const response = await api.post("/timetable", entryData);
  return response.data;
};

export const uploadAssignment = async (formData: FormData) => {
  const response = await api.post<DocumentRecord>("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getMyDocuments = async () => {
  const response = await api.get<DocumentRecord[]>("/documents/my-documents");
  return response.data;
};

export const getMaterials = async () => {
  const response = await api.get<DocumentRecord[]>("/documents/materials");
  return response.data;
};

export const getTeacherDocuments = async () => {
  const response = await api.get<DocumentRecord[]>("/documents/teacher-documents");
  return response.data;
};

export const getAdminDashboardSummary = async () => {
  const response = await api.get<AdminDashboardSummary>("/admin/dashboard-summary");
  return response.data;
};

export const getAdminAttendanceAnalytics = async (params: {
  month: number;
  year: number;
  section?: string;
}) => {
  const response = await api.get<AdminAttendanceAnalytics>("/admin/attendance-analytics", {
    params,
  });
  return response.data;
};

export const getAdminQrValidations = async (params?: { limit?: number }) => {
  const response = await api.get<QrValidationRecord[]>("/admin/qr-validations", {
    params,
  });
  return response.data;
};

