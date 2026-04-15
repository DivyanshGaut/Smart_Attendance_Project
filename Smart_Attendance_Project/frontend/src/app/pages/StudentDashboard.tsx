import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { getMyAttendance, scanQr, getTimetable } from "../../services/api";
import { useEffect } from "react";
import {
  Upload,
  BookOpen,
  Clock,
  QrCode,
  LogOut,
  AlertCircle,
  FileText,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
} from "lucide-react";
// import { getMyDocuments } from "../../services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWeekend } from "date-fns";
import QrScanner from "react-qr-scanner";
import { uploadAssignment, getMyDocuments, getMaterials } from "../../services/api";
// import { useEffect } from "react";
// Mock data
const mockAttendance = {
  overall: 78,
  subjects: [
    { name: "Data Structures", percentage: 85, present: 34, total: 40, color: "bg-[#547792]" },
    { name: "Algorithms", percentage: 72, present: 29, total: 40, color: "bg-[#94B4C1]" },
    { name: "Database Systems", percentage: 90, present: 36, total: 40, color: "bg-[#547792]" },
    { name: "Web Development", percentage: 68, present: 27, total: 40, color: "bg-[#94B4C1]" },
    { name: "Operating Systems", percentage: 80, present: 32, total: 40, color: "bg-[#213448]" },
  ],
};
// const user = JSON.parse(localStorage.getItem("user") || "{}");
// Detailed attendance data with classes per day
const detailedAttendanceData = [
  { date: new Date(2026, 2, 2), classes: [
    { subject: "Data Structures", time: "9:00 AM", status: "present" },
    { subject: "Algorithms", time: "11:00 AM", status: "present" },
  ]},
  { date: new Date(2026, 2, 3), classes: [
    { subject: "Database Systems", time: "10:00 AM", status: "present" },
    { subject: "Web Development", time: "2:00 PM", status: "absent" },
  ]},
  { date: new Date(2026, 2, 5), classes: [
    { subject: "Data Structures", time: "9:00 AM", status: "absent" },
    { subject: "Algorithms", time: "11:00 AM", status: "absent" },
    { subject: "Operating Systems", time: "2:00 PM", status: "absent" },
  ]},
  { date: new Date(2026, 2, 9), classes: [
    { subject: "Web Development", time: "10:00 AM", status: "present" },
  ]},
  { date: new Date(2026, 2, 10), classes: [
    { subject: "Data Structures", time: "9:00 AM", status: "absent" },
    { subject: "Database Systems", time: "1:00 PM", status: "present" },
  ]},
];

const mockTimetable = [
  { day: "Monday", classes: [
    { time: "9:00 AM", subject: "Data Structures", room: "A-101" },
    { time: "11:00 AM", subject: "Algorithms", room: "B-203" },
    { time: "2:00 PM", subject: "Database Systems", room: "C-305" },
  ]},
  { day: "Tuesday", classes: [
    { time: "10:00 AM", subject: "Web Development", room: "D-102" },
    { time: "1:00 PM", subject: "Operating Systems", room: "A-204" },
  ]},
  { day: "Wednesday", classes: [
    { time: "9:00 AM", subject: "Data Structures Lab", room: "Lab-1" },
    { time: "2:00 PM", subject: "Algorithms", room: "B-203" },
  ]},
];



const mockStudyMaterials = [
  { title: "Data Structures - Linked Lists", subject: "Data Structures", uploadedBy: "Prof. Smith", date: "Mar 5, 2026" },
  { title: "SQL Query Optimization", subject: "Database Systems", uploadedBy: "Prof. Johnson", date: "Mar 3, 2026" },
  { title: "React Hooks Guide", subject: "Web Development", uploadedBy: "Prof. Williams", date: "Mar 1, 2026" },
];

export default function StudentDashboard() {
  const handleUpload = async (file: File) => {

  const formData = new FormData();

  formData.append("file", file);
  formData.append("title", file.name);
  formData.append("subject", selectedSubject);

  try {

    await uploadAssignment(formData);
    const res = await getMyDocuments();
    setDocuments(res);

    alert("Assignment uploaded successfully");

  } catch (err) {

    console.error(err);
    alert("Upload failed");

  }

};
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const canUseCameraScanner =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost") &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia;
  const [selectedSubject, setSelectedSubject] = useState(mockAttendance.subjects[0].name);
  const [showScanner, setShowScanner] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scannerResult, setScannerResult] = useState("");
  const [isSubmittingScan, setIsSubmittingScan] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  useEffect(() => {

  const fetchDocuments = async () => {

    try {

      const res = await getMyDocuments();

      setDocuments(res);

    } catch (err) {

      console.error("Failed to fetch documents");

    }

  };

  fetchDocuments();

}, []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrScannerRef = useRef<any>(null);
const [attendanceData, setAttendanceData] = useState<any>(null);
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const overallAttendance = attendanceData?.percentage || mockAttendance.overall;
useEffect(() => {

  const fetchAttendance = async () => {

    try {

      const res = await getMyAttendance();

      setAttendanceData(res);

    } catch (error) {

      console.error("Attendance fetch failed", error);

    }

  };

  fetchAttendance();

}, []);
useEffect(() => {

  const fetchMaterials = async () => {
    try {
      const res = await getMaterials();
      setMaterials(res);
    } catch (error) {
      console.error("Materials fetch failed", error);
    }
  };

  const fetchTimetable = async () => {
    try {
      const res = await getTimetable();
      setTimetable(res.timetable || []);
    } catch (error) {
      console.error("Timetable fetch failed", error);
    }
  };

  fetchMaterials();
  fetchTimetable();

}, []);
const subjects = attendanceData
  ? Object.values(
      attendanceData.records.reduce((acc: any, record: any) => {

        if (!acc[record.subject]) {
          acc[record.subject] = { name: record.subject, present: 0, total: 0 };
        }

        acc[record.subject].total++;

        if (record.status === "present") {
          acc[record.subject].present++;
        }

        return acc;

      }, {})
    ).map((s: any) => ({
      name: s.name,
      percentage: Math.round((s.present / s.total) * 100),
      present: s.present,
      total: s.total,
      color: "bg-[#547792]"
    }))
  : mockAttendance.subjects;
const handleScan = async (data: any) => {

  const qrToken = data?.text || data;

  if (!qrToken || isSubmittingScan) return;

  setIsSubmittingScan(true);
  setScannerResult(qrToken);
  setScannerError("");

  const submitAttendance = async (payload: { qrToken: string; latitude?: number; longitude?: number }) => {
    try {
      await scanQr(payload);

      const refreshedAttendance = await getMyAttendance();
      setAttendanceData(refreshedAttendance);

      alert("Attendance marked successfully");

      setShowScanner(false);
      setScannerResult("");
    } catch (error) {
      console.error(error);
      setScannerError("QR code invalid, expired, already used, or for a different section");
      alert("Attendance could not be marked");
    } finally {
      setIsSubmittingScan(false);
    }
  };

  if (!navigator.geolocation || !window.isSecureContext) {
    setScannerError("Location is unavailable on local HTTP, using development fallback");
    submitAttendance({ qrToken });
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    submitAttendance({
      qrToken,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, (error) => {

    console.error(error);
    setScannerError("Location unavailable, using development fallback");
    submitAttendance({ qrToken });

  });

};
  const handleError = (err: any) => {
    setScannerError("Camera access denied or not available");
    console.error(err);
  };

  const getAbsentCountForDay = (day: Date) => {
    const dayData = detailedAttendanceData.find(d => isSameDay(d.date, day));
    if (!dayData) return 0;
    return dayData.classes.filter(c => c.status === "absent").length;
  };

  const getRedShade = (absentCount: number) => {
    if (absentCount === 0) return "";
    if (absentCount === 1) return "bg-red-200";
    if (absentCount === 2) return "bg-red-400";
    return "bg-red-600";
  };

  const hasClassesOnDay = (day: Date) => {
    return detailedAttendanceData.some(d => isSameDay(d.date, day));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAE0CF] via-[#f5f0e8] to-[#EAE0CF]">
      {/* Header */}
      <div className="bg-white/80 border-b-2 border-[#94B4C1] backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#213448] to-[#547792] bg-clip-text text-transparent">
              Student Dashboard
            </h1>
            <p className="text-[#547792] text-sm">
  Welcome back, {user.name || user.studentName}
</p>
          </div>
          <Button
            onClick={() => navigate("/")}
            variant="outline"
            className="border-[#547792] text-[#547792] hover:bg-[#94B4C1]/30 hover:text-[#213448]"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Low Attendance Alert */}
        {overallAttendance < 75 && (
          <div className="mb-6 bg-red-50 border-2 border-red-400 rounded-xl p-4 flex items-center gap-3 shadow-md">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="text-red-800 font-bold">Low Attendance Warning!</h3>
              <p className="text-red-700 text-sm">
                Your attendance is {overallAttendance}%. Minimum required: 75%
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Overall Attendance */}
            <Card className="bg-gradient-to-br from-white to-[#94B4C1]/20 border-2 border-[#94B4C1] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448] flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Overall Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-[#213448] to-[#547792] bg-clip-text text-transparent">
                    {overallAttendance}%
                  </div>
                  <Progress value={overallAttendance} className="h-3 mb-2 bg-[#EAE0CF]" />
                  <p className="text-[#547792] text-sm">
                    {overallAttendance>= 75 ? "Good standing" : "Below requirement"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QR Scanner */}
            <Card className="bg-gradient-to-br from-[#547792]/10 to-[#94B4C1]/30 border-2 border-[#547792] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448] flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Mark Attendance
                </CardTitle>
                <CardDescription className="text-[#547792]">
                  Scan the teacher QR on Android/Chrome, or use image upload/token fallback
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showScanner ? (
                  <Button
                    onClick={() => setShowScanner(true)}
                    className="w-full bg-gradient-to-r from-[#547792] to-[#94B4C1] hover:from-[#213448] hover:to-[#547792] text-white py-6 shadow-md"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Open Scanner
                  </Button>
                ) : (
                  <div className="space-y-3">
                    {canUseCameraScanner ? (
                      <div className="overflow-hidden rounded-lg border-2 border-[#94B4C1] bg-black">
                        <QrScanner
                          ref={qrScannerRef}
                          delay={300}
                          constraints={{
                            audio: false,
                            video: { facingMode: "environment" },
                          }}
                          onError={handleError}
                          onScan={handleScan}
                          style={{ width: "100%" }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                        Camera scanning is unavailable on this page because phone browsers only allow camera access on
                        `https` or `localhost`. Use `Upload QR Image` or paste the token instead.
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-[#547792] text-[#547792] hover:bg-[#94B4C1]/20"
                      onClick={() => qrScannerRef.current?.openImageDialog?.()}
                    >
                      Upload QR Image
                    </Button>
                    <input
                      type="text"
                      value={scannerResult}
                      onChange={(e) => setScannerResult(e.target.value)}
                      placeholder="Paste QR token here if needed"
                      className="w-full rounded-md border border-[#94B4C1] px-3 py-2 text-sm text-[#213448] outline-none focus:border-[#547792]"
                    />
                    <Button
                      type="button"
                      onClick={() => handleScan(scannerResult)}
                      disabled={!scannerResult || isSubmittingScan}
                      className="w-full bg-gradient-to-r from-[#547792] to-[#94B4C1] hover:from-[#213448] hover:to-[#547792] text-white"
                    >
                      {isSubmittingScan ? "Marking..." : "Submit Token"}
                    </Button>
                    {scannerError && (
                      <p className="text-red-600 text-sm">{scannerError}</p>
                    )}
                    <Button
                      onClick={() => {
                        setShowScanner(false);
                        setScannerError("");
                        setScannerResult("");
                      }}
                      variant="outline"
                      className="w-full border-[#547792] text-[#547792] hover:bg-[#94B4C1]/20"
                    >
                      Close Scanner
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448]">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full border-[#547792] text-[#547792] hover:bg-[#547792]/10 hover:text-[#213448]"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Assignment
                </Button>
                <input
  ref={fileInputRef}
  type="file"
  className="hidden"
  onChange={(e) => {
    if (e.target.files?.[0]) {
      handleUpload(e.target.files[0]);
    }
  }}
/>
                <Button
                  onClick={() => setShowDocuments(!showDocuments)}
                  variant="outline"
                  className="w-full border-[#547792] text-[#547792] hover:bg-[#547792]/10 hover:text-[#213448]"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Documents
                </Button>

                {showDocuments && (
                  <div className="mt-4 space-y-2 border-t-2 border-[#94B4C1] pt-4">
                    <h4 className="text-[#213448] font-semibold text-sm mb-3">Uploaded Documents</h4>
                    {documents.map((doc: any, idx: number) =>
                      <div
                        key={doc._id || idx}
                        className="p-3 bg-[#EAE0CF]/50 border border-[#94B4C1] rounded-lg hover:bg-[#94B4C1]/20 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-[#213448] font-medium text-sm">{doc.title}</div>
                            <div className="text-[#547792] text-xs mt-1">{doc.subject}</div>
                            <div className="flex gap-2 text-xs text-[#547792] mt-1">
                              <span>{doc.createdAt ? format(new Date(doc.createdAt), "MMM d, yyyy") : "Recently"}</span>
                              <span>•</span>
                              <span>{doc.fileName || "Uploaded file"}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-[#547792] hover:text-[#213448]"
                              onClick={() => doc.fileUrl && window.open(doc.fileUrl, "_blank")}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-800">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid grid-cols-4 bg-white border-2 border-[#94B4C1] shadow-sm">
                <TabsTrigger value="calendar" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="attendance" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
                  Attendance
                </TabsTrigger>
                <TabsTrigger value="timetable" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
                  Timetable
                </TabsTrigger>
                <TabsTrigger value="materials" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
                  Materials
                </TabsTrigger>
              </TabsList>

              {/* Calendar Tab - Default */}
              <TabsContent value="calendar">
                <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#213448]">
                      Attendance Calendar - {format(currentMonth, "MMMM yyyy")}
                    </CardTitle>
                    <CardDescription className="text-[#547792]">
                      Track your attendance day by day. Click on any date to view details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Color Legend */}
                    <div className="mb-6 p-4 bg-[#EAE0CF]/50 rounded-lg border border-[#94B4C1]">
                      <h4 className="text-[#213448] font-semibold text-sm mb-3">Absent Classes Legend</h4>
                      <div className="flex flex-wrap gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-200 rounded border border-red-300"></div>
                          <span className="text-[#547792] text-sm">1 class absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-400 rounded border border-red-500"></div>
                          <span className="text-[#547792] text-sm">2 classes absent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-600 rounded border border-red-700"></div>
                          <span className="text-[#547792] text-sm">3+ classes absent</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-[#547792] font-semibold text-sm py-2">
                          {day}
                        </div>
                      ))}
                      {daysInMonth.map((day, idx) => {
                        const hasClasses = hasClassesOnDay(day);
                        const absentCount = getAbsentCountForDay(day);
                        const isWeekendDay = isWeekend(day);
                        const isToday = isSameDay(day, new Date());
                        const redShade = getRedShade(absentCount);

                        return (
                          <button
                            key={idx}
                            onClick={() => hasClasses ? setSelectedDate(day) : null}
                            className={`aspect-square flex items-center justify-center rounded-lg text-sm relative transition-all ${
                              isToday
                                ? "bg-[#547792] text-white font-bold ring-2 ring-[#213448]"
                                : absentCount > 0
                                ? `${redShade} border-2 border-red-700 text-white font-semibold hover:scale-105 cursor-pointer`
                                : hasClasses
                                ? "bg-green-100 border-2 border-green-400 text-green-800 hover:bg-green-200 cursor-pointer"
                                : isWeekendDay
                                ? "bg-[#EAE0CF]/50 text-[#547792]/50"
                                : "bg-white border border-[#94B4C1] text-[#547792]"
                            }`}
                          >
                            {format(day, "d")}
                            {hasClasses && absentCount === 0 && (
                              <CheckCircle2 className="absolute top-0.5 right-0.5 w-3 h-3 text-green-600" />
                            )}
                            {absentCount > 0 && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-800 text-white rounded-full text-xs flex items-center justify-center font-bold">
                                {absentCount}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Date Details */}
                    {selectedDate && (
                      <div className="mt-6 p-4 bg-[#94B4C1]/20 border-2 border-[#547792] rounded-lg">
                        <h4 className="text-[#213448] font-bold text-lg mb-3">
                          Classes on {format(selectedDate, "MMMM d, yyyy")}
                        </h4>
                        <div className="space-y-2">
                          {detailedAttendanceData
                            .find(d => isSameDay(d.date, selectedDate))
                            ?.classes.map((cls, idx) => (
                              <div
                                key={idx}
                                className={`p-3 rounded-lg border-2 flex items-center justify-between ${
                                  cls.status === "present"
                                    ? "bg-green-50 border-green-400"
                                    : "bg-red-50 border-red-400"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {cls.status === "present" ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <XCircle className="w-5 h-5 text-red-600" />
                                  )}
                                  <div>
                                    <div className={`font-semibold ${cls.status === "present" ? "text-green-800" : "text-red-800"}`}>
                                      {cls.subject}
                                    </div>
                                    <div className={`text-sm ${cls.status === "present" ? "text-green-600" : "text-red-600"}`}>
                                      {cls.time}
                                    </div>
                                  </div>
                                </div>
                                <Badge
                                  variant={cls.status === "present" ? "default" : "destructive"}
                                  className={cls.status === "present" ? "bg-green-600" : ""}
                                >
                                  {cls.status.toUpperCase()}
                                </Badge>
                              </div>
                            ))}
                        </div>
                        <Button
                          onClick={() => setSelectedDate(null)}
                          variant="outline"
                          className="w-full mt-4 border-[#547792] text-[#547792] hover:bg-[#94B4C1]/20"
                        >
                          Close Details
                        </Button>
                      </div>
                    )}

                    <div className="flex gap-4 mt-4 justify-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border-2 border-green-400 rounded"></div>
                        <span className="text-[#547792]">All Present</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-200 border-2 border-red-700 rounded"></div>
                        <span className="text-[#547792]">Has Absences</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-[#547792] rounded"></div>
                        <span className="text-[#547792]">Today</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-4">
                <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#213448]">Subject-wise Attendance</CardTitle>
                    <CardDescription className="text-[#547792]">
                      Detailed breakdown of your attendance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {subjects.map((subject) => (
                      <div key={subject.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${subject.color}`}></div>
                            <span className="text-[#213448] font-medium">{subject.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant={subject.percentage >= 75 ? "default" : "destructive"}
                              className={subject.percentage >= 75 ? "bg-green-600" : ""}
                            >
                              {subject.percentage}%
                            </Badge>
                            <span className="text-[#547792] text-sm">
                              {subject.present}/{subject.total}
                            </span>
                          </div>
                        </div>
                        <Progress value={subject.percentage} className="h-2 bg-[#EAE0CF]" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timetable Tab */}
              <TabsContent value="timetable">
                <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#213448] flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Weekly Timetable
                    </CardTitle>
                    <CardDescription className="text-[#547792]">Your class schedule</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(timetable.length
                      ? [
                          { key: "MON", label: "Monday" },
                          { key: "TUE", label: "Tuesday" },
                          { key: "WED", label: "Wednesday" },
                          { key: "THU", label: "Thursday" },
                          { key: "FRI", label: "Friday" },
                          { key: "SAT", label: "Saturday" },
                          { key: "SUN", label: "Sunday" },
                        ]
                          .map((day) => ({
                            day: day.label,
                            classes: timetable
                              .filter((entry: any) => entry.dayOfWeek === day.key)
                              .map((entry: any) => ({
                                time: `${entry.startTime} - ${entry.endTime}`,
                                subject: entry.subject,
                                room: entry.room || entry.batch || "TBA",
                                teacher: entry.teacherId?.teacherName || "Teacher",
                              })),
                          }))
                          .filter((day) => day.classes.length > 0)
                      : mockTimetable
                    ).map((day) => (
                      <div key={day.day} className="space-y-2">
                        <h3 className="text-[#547792] font-semibold text-lg">{day.day}</h3>
                        <div className="space-y-2">
                          {day.classes.map((cls, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-3 bg-[#94B4C1]/20 border border-[#94B4C1] rounded-lg hover:bg-[#94B4C1]/30 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-[#547792]" />
                                <span className="text-[#213448] font-medium">{cls.time}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-[#213448]">{cls.subject}</div>
                                <div className="text-[#547792] text-sm">{cls.room}</div>
                                {"teacher" in cls && <div className="text-[#547792] text-xs">Teacher: {cls.teacher}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Study Materials Tab */}
              <TabsContent value="materials">
                <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#213448] flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Study Materials
                    </CardTitle>
                    <CardDescription className="text-[#547792]">
                      Resources uploaded by teachers
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(materials.length
                      ? materials.map((material: any) => ({
                          title: material.title,
                          subject: material.subject,
                          uploadedBy: material.uploadedBy?.teacherName || "Teacher",
                          date: material.createdAt ? format(new Date(material.createdAt), "MMM d, yyyy") : "Recently",
                          fileUrl: material.fileUrl,
                          fileName: material.fileName,
                        }))
                      : mockStudyMaterials
                    ).map((material: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-4 bg-[#EAE0CF]/50 border border-[#94B4C1] rounded-lg hover:bg-[#94B4C1]/20 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex gap-3">
                            <FileText className="w-5 h-5 text-[#547792] mt-1" />
                            <div>
                              <h4 className="text-[#213448] font-medium">{material.title}</h4>
                              <p className="text-[#547792] text-sm">{material.subject}</p>
                              <div className="flex gap-3 mt-1 text-xs text-[#547792]">
                                <span>By {material.uploadedBy}</span>
                                <span>•</span>
                                <span>{material.date}</span>
                              </div>
                              {"fileName" in material && material.fileName && (
                                <div className="text-[#547792] text-xs mt-1">File: {material.fileName}</div>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-[#547792] text-[#547792] hover:bg-[#547792]/10"
                            onClick={() => material.fileUrl && window.open(material.fileUrl, "_blank")}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
