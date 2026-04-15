import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  QrCode,
  Clock,
  AlertTriangle,
  LogOut,
  Users,
  BookOpen,
  Download,
  MapPin,
  Shield,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import {
  generateQr,
  getAttendanceReport,
  getDefaulters,
  getTeacherDocuments,
  uploadAssignment,
  type AttendanceReportRow,
} from "../../services/api";
import { format } from "date-fns";
// Mock data
const mockSections = [
  { id: "CSE-A", name: "CSE Section A", subjects: ["Data Structures", "Algorithms"] },
  { id: "CSE-B", name: "CSE Section B",  subjects: ["Database Systems", "Web Development"] },
];

const mockTimetable = [
  { day: "Monday", time: "9:00 AM - 10:00 AM", subject: "Data Structures", section: "CSE-A", room: "A-101" },
  { day: "Monday", time: "11:00 AM - 12:00 PM", subject: "Algorithms", section: "CSE-A", room: "B-203" },
  { day: "Tuesday", time: "10:00 AM - 11:00 AM", subject: "Database Systems", section: "CSE-B", room: "C-305" },
  { day: "Wednesday", time: "2:00 PM - 3:00 PM", subject: "Web Development", section: "CSE-B", room: "D-102" },
];

export default function TeacherDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const navigate = useNavigate();
  const [report, setReport] = useState<AttendanceReportRow[]>([]);
  const [selectedSection, setSelectedSection] = useState(mockSections[0].id);
  const [selectedSubject, setSelectedSubject] = useState(mockSections[0].subjects[0]);
  const [qrCode, setQrCode] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrTimer, setQrTimer] = useState(0);
  const [isQRActive, setIsQRActive] = useState(false);
  const [showUploadedMaterials, setShowUploadedMaterials] = useState(false);
  const [uploadedMaterials, setUploadedMaterials] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const totalStudents = report.length;
  

  const [debarredList, setDebarredList] = useState<AttendanceReportRow[]>([]);
  const debarredCount = report.filter((s) => (s.attendance || 0) < 75).length;
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const loadAttendanceData = async () => {
    if (!selectedSubject) return;

    try {
      const [reportData, defaulterData] = await Promise.all([
        getAttendanceReport({
          month: currentMonth,
          year: currentYear,
          subject: selectedSubject,
          section: selectedSection,
        }),
        getDefaulters({
          month: currentMonth,
          year: currentYear,
          subject: selectedSubject,
          section: selectedSection,
          threshold: 75,
        }),
      ]);

      setReport(reportData);
      setDebarredList(defaulterData);
    } catch (error) {
      console.error("Failed to load attendance data", error);
    }
  };

  const loadUploadedMaterials = async () => {
    try {
      const docs = await getTeacherDocuments();
      setUploadedMaterials(docs);
    } catch (error) {
      console.error("Failed to load uploaded materials", error);
    }
  };

  const downloadDebarredList = () => {
  if (!debarredList.length) return alert("No data");

  const headers = ["Roll No", "Name", "Attendance", "Classes"];

  const rows = debarredList.map((s) => [
    s.rollNo,
    s.name,
    s.attendance,
    s.classes || `${s.present || 0}/${s.total || 0}`
  ]);

  const csv =
    [headers, ...rows]
      .map(row => row.join(","))
      .join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "debarred_list.csv";
  a.click();

  URL.revokeObjectURL(url);
};

  const handleExport = () => {
    if (!report.length) return alert("No data to export");

    const headers = ["Roll No", "Name", "Attendance", "Classes"];

    const rows = report.map((s) => [
      s.rollNo,
      s.name,
      s.attendance,
      s.classes || `${s.present || 0}/${s.total || 0}`,
    ]);

    const csvContent =
      [headers, ...rows]
        .map(row => row.join(","))
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedSection}_${selectedSubject}_report.csv`;
    // a.download = "attendance_report.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  };
  
useEffect(() => {
  if (!selectedSection || !selectedSubject) return;
  loadAttendanceData();
}, [selectedSection, selectedSubject]);

useEffect(() => {
  loadUploadedMaterials();
}, []);

useEffect(() => {
  if (!isQRActive) return;

  const interval = setInterval(() => {
    loadAttendanceData();
  }, 5000);

  return () => clearInterval(interval);
}, [isQRActive, selectedSubject]);
  
  // QR Code timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isQRActive && qrTimer > 0) {
      interval = setInterval(() => {
        setQrTimer((prev) => {
          if (prev <= 1) {
            setIsQRActive(false);
            setQrCode("");
            setQrToken("");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isQRActive, qrTimer]);

  const generateQRCode = async () => {
    // Get location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const loc = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          setLocation(loc);

          const response = await generateQr({
            subject: selectedSubject,
            section: selectedSection,
            latitude: loc.lat,
            longitude: loc.lon,
            expirySeconds: 60,
          });

          setQrCode(response.qrCodeDataUrl);
          setQrToken(response.session.qrToken);
          setQrTimer(60);
          setIsQRActive(true);
        },
        (error) => {
          alert("Location access is required for QR code generation");
          console.error(error);
        }
      );
    }
  };

  const regenerateQRCode = () => {
    alert("Generating new QR code and notifying admin...");
    generateQRCode();
  };

  const handleTeacherUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
    formData.append("subject", selectedSubject);

    try {
      await uploadAssignment(formData);
      await loadUploadedMaterials();
      alert(`File "${file.name}" uploaded successfully for ${selectedSubject}!`);
    } catch (error) {
      console.error("Material upload failed", error);
      alert("Material upload failed");
    }
  };

  // const downloadDebarredList = () => {
  //   alert("Downloading debarred students list as PDF...");
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAE0CF] via-[#f5f0e8] to-[#EAE0CF]">
      {/* Header */}
      <div className="bg-white/80 border-b-2 border-[#94B4C1] backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#213448] to-[#547792] bg-clip-text text-transparent">
              Teacher Dashboard
            </h1>
            <p className="text-[#547792] text-sm">Welcome, {user.name || "Teacher"}</p>
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
        {/* Section and Subject Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-white to-[#94B4C1]/20 border-2 border-[#94B4C1] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#213448] text-lg">Select Section</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger className="bg-white border-[#547792] text-[#213448]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#94B4C1]">
                  {mockSections.map((section) => (
                    <SelectItem key={section.id} value={section.id} className="text-[#213448]">
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-[#547792]/10 to-[#94B4C1]/30 border-2 border-[#547792] shadow-lg">
            <CardHeader>
              <CardTitle className="text-[#213448] text-lg">Select Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="bg-white border-[#547792] text-[#213448]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#94B4C1]">
                  {mockSections
                    .find((s) => s.id === selectedSection)
                    ?.subjects.map((subject) => (
                      <SelectItem key={subject} value={subject} className="text-[#213448]">
                        {subject}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - QR Code Generator */}
          <div className="lg:col-span-1 space-y-6">
            {/* QR Code Generator */}
            <Card className="bg-gradient-to-br from-white to-[#94B4C1]/20 border-2 border-[#547792] shadow-xl">
              <CardHeader>
                <CardTitle className="text-[#213448] flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Generate Attendance QR
                </CardTitle>
                <CardDescription className="text-[#547792]">
                  60s validity • Location verified • Anti-proxy
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!isQRActive ? (
                  <Button
                    onClick={generateQRCode}
                    className="w-full bg-gradient-to-r from-[#547792] to-[#94B4C1] hover:from-[#213448] hover:to-[#547792] text-white py-6 shadow-md"
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    Generate QR Code
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 flex justify-center border-2 border-[#94B4C1]">
                      <img src={qrCode} alt="Attendance QR Code" className="w-64 h-64" />
                    </div>
                    <div className="space-y-2">
                      <div className="rounded-lg border border-[#94B4C1] bg-[#EAE0CF]/40 p-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[#547792]">
                          Scan fallback token
                        </div>
                        <div className="mt-2 break-all rounded bg-white p-2 font-mono text-xs text-[#213448]">
                          {qrToken}
                        </div>
                        <Button
                          onClick={() => navigator.clipboard.writeText(qrToken)}
                          variant="outline"
                          className="mt-2 w-full border-[#547792] text-[#547792] hover:bg-[#547792]/10"
                        >
                          Copy Token
                        </Button>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-[#547792]">Time Remaining:</span>
                        <Badge
                          variant={qrTimer > 30 ? "default" : "destructive"}
                          className={qrTimer > 30 ? "bg-green-600" : ""}
                        >
                          {qrTimer}s
                        </Badge>
                      </div>
                      <Progress value={(qrTimer / 60) * 100} className="h-2 bg-[#EAE0CF]" />
                      <div className="flex items-center gap-2 text-xs text-[#547792]">
                        <Shield className="w-4 h-4" />
                        <span>Screenshot & Multiple scan protected</span>
                      </div>
                      {location && (
                        <div className="flex items-center gap-2 text-xs text-[#547792]">
                          <MapPin className="w-4 h-4" />
                          <span>50m radius validation active</span>
                        </div>
                      )}
                      <Button
                        onClick={regenerateQRCode}
                        variant="outline"
                        className="w-full border-[#547792] text-[#547792] hover:bg-[#547792]/10 mt-2"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Regenerate & Notify Admin
                      </Button>
                      <Button
                        onClick={loadAttendanceData}
                        variant="outline"
                        className="w-full border-[#547792] text-[#547792] hover:bg-[#547792]/10"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Attendance Data
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-to-br from-[#547792]/10 to-[#94B4C1]/30 border-2 border-[#94B4C1] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448]">Section Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-[#94B4C1]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#547792]" />
                    <span className="text-[#213448]">Total Students</span>
                  </div>
                  <span className="text-[#213448] font-bold">
                    {totalStudents}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white/80 rounded-lg border border-[#94B4C1]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-[#213448]">Debarred</span>
                  </div>
                  <span className="text-orange-600 font-bold">{debarredCount}</span>
                </div>
              </CardContent>
            </Card>

            {/* Upload Material */}
            <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448] flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Study Material Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-gradient-to-r from-[#547792] to-[#94B4C1] hover:from-[#213448] hover:to-[#547792] text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New Material
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleTeacherUpload(e.target.files[0]);
                    }
                  }}
                />
                <Button
                  onClick={() => setShowUploadedMaterials(!showUploadedMaterials)}
                  variant="outline"
                  className="w-full border-[#547792] text-[#547792] hover:bg-[#547792]/10"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {showUploadedMaterials ? "Hide" : "View"} Uploaded Materials
                </Button>

                {showUploadedMaterials && (
                  <div className="mt-4 space-y-2 border-t-2 border-[#94B4C1] pt-4">
                    <h4 className="text-[#213448] font-semibold text-sm mb-3">Uploaded Materials</h4>
                    {uploadedMaterials.length === 0 ? (
                      <div className="p-3 bg-[#EAE0CF]/50 border border-[#94B4C1] rounded-lg text-[#547792] text-sm">
                        No materials uploaded yet
                      </div>
                    ) : uploadedMaterials.map((material) => (
                      <div
                        key={material._id}
                        className="p-3 bg-[#EAE0CF]/50 border border-[#94B4C1] rounded-lg hover:bg-[#94B4C1]/20 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-[#213448] font-medium text-sm">{material.title}</div>
                            <div className="text-[#547792] text-xs mt-1">{material.subject}</div>
                            <div className="flex gap-2 text-xs text-[#547792] mt-1">
                              <span>{material.createdAt ? format(new Date(material.createdAt), "MMM d, yyyy") : "Recently"}</span>
                              <span>•</span>
                              <span>{material.fileName}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-[#547792] hover:text-[#213448]"
                              onClick={() => material.fileUrl && window.open(material.fileUrl, "_blank")}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="attendance" className="w-full">
              <TabsList className="grid grid-cols-3 bg-white border-2 border-[#94B4C1] shadow-sm">
                <TabsTrigger value="attendance" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
                  Attendance Report
                </TabsTrigger>
                <TabsTrigger value="debarred" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
                  Debarred List
                </TabsTrigger>
                <TabsTrigger value="timetable" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
                  My Timetable
                </TabsTrigger>
              </TabsList>

              {/* Attendance Report */}
              <TabsContent value="attendance">
                <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#213448]">
                      Monthly Attendance Report - {selectedSection}
                    </CardTitle>
                    <CardDescription className="text-[#547792]">
                      {selectedSubject} - {format(new Date(), "MMMM yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="grid grid-cols-5 gap-4 p-3 bg-[#94B4C1]/20 rounded-lg font-semibold text-[#213448] text-sm">
                        <div>Roll No</div>
                        <div className="col-span-2">Student Name</div>
                        <div className="text-center">Attendance</div>
                        <div className="text-center">Classes</div>
                      </div>
                      {report.map((student) => (
                      // {mockAttendanceData.map((student) => (
                        <div
                          key={student.rollNo}
                          className="grid grid-cols-5 gap-4 p-3 bg-[#EAE0CF]/30 border border-[#94B4C1] rounded-lg hover:bg-[#94B4C1]/20 transition-colors"
                        >
                          <div className="text-[#547792] font-medium">{student.rollNo}</div>
                          <div className="col-span-2 text-[#213448]">{student.name}</div>
                          <div className="text-center">
                            <Badge
                              variant={student.attendance >= 75 ? "default" : "destructive"}
                              className={student.attendance >= 75 ? "bg-green-600" : ""}
                            >
                              {student.attendance}%
                            </Badge>
                          </div>
                          <div className="text-center text-[#547792] text-sm">
                            {student.classes || `${student.present}/${student.total}`}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                      onClick={handleExport}
                        variant="outline"
                        className="border-[#547792] text-[#547792] hover:bg-[#547792]/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Debarred List */}
              <TabsContent value="debarred">
                <Card className="bg-white border-2 border-red-400 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-red-700 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Debarred Students List (Below 75%)
                    </CardTitle>
                    <CardDescription className="text-red-600">
                      Students with attendance below required threshold
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {debarredList.length === 0 ? (
                      <div className="text-center py-8 text-[#547792]">
                        No students below 75% attendance threshold
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {debarredList.map((student: any) => (
                            <div
                              key={student.rollNo}
                              className="p-4 bg-red-50 border-2 border-red-300 rounded-lg"
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="text-red-800 font-semibold">{student.name} ({student.rollNo})</div>
                                  <div className="text-red-600 text-sm">Present: {student.present || 0}/{student.total || 0} classes</div>
                                </div>
                                <div className="text-right">
                                  <Badge variant="destructive" className="text-lg px-3 py-1">
                                    {student.attendance}%
                                  </Badge>
                                  <div className="text-red-600 text-xs mt-1">
                                    Needs {Math.max(0, Math.ceil((0.75 * (student.total || 0) - (student.present || 0)) / 0.25))} more
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-6 flex justify-end">
                          <Button
                            onClick={downloadDebarredList}
                            className="bg-gradient-to-r from-[#547792] to-[#94B4C1] hover:from-[#213448] hover:to-[#547792] text-white"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Debarred List
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timetable */}
              <TabsContent value="timetable">
                <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-[#213448] flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      My Lecture Schedule
                    </CardTitle>
                    <CardDescription className="text-[#547792]">
                      Your weekly teaching timetable
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                        const dayClasses = mockTimetable.filter((t) => t.day === day);
                        return (
                          <div key={day} className="space-y-2">
                            <h3 className="text-[#547792] font-semibold text-lg">{day}</h3>
                            {dayClasses.length === 0 ? (
                              <div className="p-3 bg-[#EAE0CF]/50 border border-[#94B4C1] rounded-lg text-[#547792] text-sm">
                                No classes scheduled
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {dayClasses.map((cls, idx) => (
                                  <div
                                    key={idx}
                                    className="p-4 bg-[#94B4C1]/20 border border-[#94B4C1] rounded-lg hover:bg-[#94B4C1]/30 transition-colors"
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="space-y-1">
                                        <div className="text-[#213448] font-semibold">{cls.subject}</div>
                                        <div className="flex items-center gap-2 text-[#547792] text-sm">
                                          <Clock className="w-3 h-3" />
                                          <span>{cls.time}</span>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <Badge className="bg-[#547792] text-white">{cls.section}</Badge>
                                        <div className="text-[#547792] text-sm mt-1">{cls.room}</div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
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
