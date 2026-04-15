import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  LogOut,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Shield,
  QrCode,
  UserCircle,
} from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  getAdminAttendanceAnalytics,
  getAdminDashboardSummary,
  getAdminQrValidations,
  getAttendanceReport,
  getDefaulters,
  type AdminAttendanceAnalytics,
  type AdminDashboardSummary,
  type AttendanceReportRow,
  type QrValidationRecord,
} from "../../services/api";

const PIE_COLORS = {
  present: "#547792",
  absent: "#94B4C1",
};

const ALL_SECTIONS_VALUE = "__all__";
const FALLBACK_SECTIONS = ["CSE-A", "CSE-B", "CSE-C", "IT-A", "IT-B"];
const FALLBACK_SUBJECTS = [
  "Data Structures",
  "Algorithms",
  "Database Systems",
  "Web Development",
  "Operating Systems",
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AdminAttendanceAnalytics | null>(null);
  const [qrValidations, setQrValidations] = useState<QrValidationRecord[]>([]);
  const [report, setReport] = useState<AttendanceReportRow[]>([]);
  const [defaulters, setDefaulters] = useState<AttendanceReportRow[]>([]);
  const [selectedSection, setSelectedSection] = useState(ALL_SECTIONS_VALUE);
  const [selectedSubject, setSelectedSubject] = useState(FALLBACK_SUBJECTS[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summaryData = await getAdminDashboardSummary();
        setSummary(summaryData);

        if (summaryData.subjects.length) {
          setSelectedSubject(summaryData.subjects[0]);
        }
      } catch (error) {
        console.error("Failed to load admin summary", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSummary();
  }, []);

  useEffect(() => {
    const loadQrValidations = async () => {
      try {
        const records = await getAdminQrValidations({ limit: 20 });
        setQrValidations(records);
      } catch (error) {
        console.error("Failed to load QR validations", error);
      }
    };

    loadQrValidations();
  }, []);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analyticsData = await getAdminAttendanceAnalytics({
          month: currentMonth,
          year: currentYear,
          section: selectedSection === ALL_SECTIONS_VALUE ? undefined : selectedSection,
        });
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Failed to load attendance analytics", error);
      }
    };

    loadAnalytics();
  }, [selectedSection, currentMonth, currentYear]);

  useEffect(() => {
    if (!selectedSubject) return;

    const loadSubjectData = async () => {
      try {
        const [reportData, defaulterData] = await Promise.all([
          getAttendanceReport({
            month: currentMonth,
            year: currentYear,
            subject: selectedSubject,
            section: selectedSection === ALL_SECTIONS_VALUE ? undefined : selectedSection,
          }),
          getDefaulters({
            month: currentMonth,
            year: currentYear,
            subject: selectedSubject,
            section: selectedSection === ALL_SECTIONS_VALUE ? undefined : selectedSection,
            threshold: 75,
          }),
        ]);

        setReport(reportData);
        setDefaulters(defaulterData);
      } catch (error) {
        console.error("Failed to load selected subject report", error);
      }
    };

    loadSubjectData();
  }, [selectedSection, selectedSubject, currentMonth, currentYear]);

  const subjectOptions = useMemo(() => {
    const analyticsSubjects = analytics?.subjectBreakdown.map((item) => item.subject) || [];
    const summarySubjects = summary?.subjects || [];
    return Array.from(new Set([...FALLBACK_SUBJECTS, ...analyticsSubjects, ...summarySubjects]));
  }, [analytics, summary]);

  const sectionOptions = useMemo(
    () => Array.from(new Set([ALL_SECTIONS_VALUE, ...FALLBACK_SECTIONS, ...(summary?.sections || [])])),
    [summary]
  );

  const analyticsPieCards = (analytics?.subjectBreakdown || []).map((item) => {
    const total = item.present + item.absent;
    const percentage = total ? Math.round((item.present / total) * 100) : 0;

    return {
      subject: item.subject,
      data: [
        { name: "Present", value: item.present, color: PIE_COLORS.present },
        { name: "Absent", value: item.absent, color: PIE_COLORS.absent },
      ],
      percentage,
    };
  });

  const reportDerivedPieCard = useMemo(() => {
    if (!report.length || !selectedSubject) return null;

    let present = 0;
    let total = 0;

    report.forEach((student) => {
      const [studentPresent, studentTotal] = (student.classes || "0/0").split("/").map(Number);
      present += Number.isFinite(studentPresent) ? studentPresent : 0;
      total += Number.isFinite(studentTotal) ? studentTotal : 0;
    });

    if (!total) return null;

    const absent = Math.max(total - present, 0);
    return {
      subject: selectedSubject,
      data: [
        { name: "Present", value: present, color: PIE_COLORS.present },
        { name: "Absent", value: absent, color: PIE_COLORS.absent },
      ],
      percentage: Math.round((present / total) * 100),
    };
  }, [report, selectedSubject]);

  const pieCards = analyticsPieCards.length ? analyticsPieCards : reportDerivedPieCard ? [reportDerivedPieCard] : [];

  const weeklyOverview = analytics?.weeklyOverview || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAE0CF] via-[#f5f0e8] to-[#EAE0CF]">
      <div className="bg-white/80 border-b-2 border-[#94B4C1] backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#213448] to-[#547792] bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-[#547792] text-sm">Welcome, {user.name || "Administrator"}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard icon={<Users className="w-8 h-8 text-[#547792]" />} label="Total Students" value={summary?.totalStudents ?? 0} />
          <StatCard icon={<CheckCircle2 className="w-8 h-8 text-green-600" />} label="Active Today" value={summary?.activeToday ?? 0} accent />
          <StatCard icon={<Calendar className="w-8 h-8 text-[#547792]" />} label="Sections" value={summary?.totalSections ?? 0} />
          <StatCard icon={<UserCircle className="w-8 h-8 text-[#213448]" />} label="Teachers" value={summary?.totalTeachers ?? 0} accent />
          <StatCard icon={<TrendingUp className="w-8 h-8 text-[#213448]" />} label="Avg Attendance" value={`${summary?.avgAttendance ?? 0}%`} />
          <StatCard icon={<QrCode className="w-8 h-8 text-[#547792]" />} label="QR Scans Today" value={summary?.qrScansToday ?? 0} accent />
        </div>

        <Tabs defaultValue="reports" className="w-full">
          <TabsList className="grid grid-cols-3 bg-white border-2 border-[#94B4C1] shadow-sm">
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
              Subject Reports
            </TabsTrigger>
            <TabsTrigger value="validation" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
              QR Validations
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#547792] data-[state=active]:text-white">
              Weekly Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#213448] text-lg">Select Section</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger className="bg-white border-[#547792] text-[#213448]">
                      <SelectValue placeholder="Choose section" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#94B4C1]">
                      {sectionOptions.map((section) => (
                        <SelectItem key={section} value={section} className="text-[#213448]">
                          {section === ALL_SECTIONS_VALUE ? "All Sections" : section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-[#213448] text-lg">Select Subject</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="bg-white border-[#547792] text-[#213448]">
                      <SelectValue placeholder="Choose subject" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#94B4C1]">
                      {subjectOptions.map((subject) => (
                        <SelectItem key={subject} value={subject} className="text-[#213448]">
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448]">
                  Subject-wise Attendance Distribution - {selectedSection || "All Sections"}
                </CardTitle>
                <CardDescription className="text-[#547792]">
                  Live attendance analytics for {format(new Date(currentYear, currentMonth - 1, 1), "MMMM yyyy")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pieCards.length === 0 ? (
                  <div className="text-[#547792] text-sm">
                    No attendance analytics available yet for {selectedSection === ALL_SECTIONS_VALUE ? "all sections" : selectedSection}.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pieCards.map((subject) => (
                      <div
                        key={subject.subject}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          subject.subject === selectedSubject
                            ? "border-[#547792] bg-[#94B4C1]/20 shadow-lg"
                            : "border-[#94B4C1] bg-white"
                        }`}
                      >
                        <h3 className="text-[#213448] font-semibold text-center mb-4">{subject.subject}</h3>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={subject.data} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                              {subject.data.map((entry, index) => (
                                <Cell key={`${subject.subject}-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#ffffff",
                                border: "2px solid #94B4C1",
                                borderRadius: "8px",
                                color: "#213448",
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: "12px", color: "#547792" }} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-4 flex justify-around text-sm">
                          <div className="text-center">
                            <div className="text-green-600 font-bold text-lg">{subject.data[0].value}</div>
                            <div className="text-[#547792] text-xs">Present</div>
                          </div>
                          <div className="text-center">
                            <div className="text-red-600 font-bold text-lg">{subject.data[1].value}</div>
                            <div className="text-[#547792] text-xs">Absent</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[#213448] font-bold text-lg">{subject.percentage}%</div>
                            <div className="text-[#547792] text-xs">Rate</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448]">
                  Selected Subject Report - {selectedSubject || "No subject selected"}
                </CardTitle>
                <CardDescription className="text-[#547792]">
                  Real student-wise attendance for {selectedSection === ALL_SECTIONS_VALUE ? "all sections" : selectedSection || "selected section"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Badge className="bg-[#547792] text-white">Students: {report.length}</Badge>
                  <Badge variant="destructive">Defaulters: {defaulters.length}</Badge>
                  <Badge className="bg-green-600 text-white">
                    Good Standing: {report.filter((student) => student.attendance >= 75).length}
                  </Badge>
                </div>
                {report.length === 0 ? (
                  <div className="text-[#547792] text-sm">No attendance report found for the selected filters.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-5 gap-4 p-3 bg-[#94B4C1]/20 rounded-lg font-semibold text-[#213448] text-sm">
                      <div>Roll No</div>
                      <div className="col-span-2">Student Name</div>
                      <div className="text-center">Attendance</div>
                      <div className="text-center">Classes</div>
                    </div>
                    {report.map((student) => (
                      <div
                        key={`${student.rollNo}-${selectedSubject}`}
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
                        <div className="text-center text-[#547792] text-sm">{student.classes}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="validation">
            <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448] flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  QR Code Validations & Attendance Marking
                </CardTitle>
                <CardDescription className="text-[#547792]">
                  Recent QR sessions with actual teacher, section, timestamp, and marked attendance count
                </CardDescription>
              </CardHeader>
              <CardContent>
                {qrValidations.length === 0 ? (
                  <div className="text-[#547792] text-sm">No QR validation records available yet.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-7 gap-4 p-3 bg-[#94B4C1]/20 rounded-lg font-semibold text-[#213448] text-sm">
                      <div>Timestamp</div>
                      <div>Teacher</div>
                      <div>Subject</div>
                      <div>Section</div>
                      <div className="text-center">Students</div>
                      <div className="text-center">Location</div>
                      <div className="text-center">Status</div>
                    </div>
                    {qrValidations.map((validation) => (
                      <div
                        key={validation.id}
                        className="grid grid-cols-7 gap-4 p-4 bg-[#EAE0CF]/30 border border-[#94B4C1] rounded-lg hover:bg-[#94B4C1]/20 transition-colors"
                      >
                        <div className="text-[#547792] text-sm">{format(new Date(validation.timestamp), "yyyy-MM-dd HH:mm:ss")}</div>
                        <div className="text-[#213448]">{validation.teacher}</div>
                        <div className="text-[#213448]">{validation.subject}</div>
                        <div className="text-[#547792]">{validation.section}</div>
                        <div className="text-center">
                          <Badge className="bg-[#547792] text-white">{validation.studentsMarked}</Badge>
                        </div>
                        <div className="text-center text-[#547792] text-sm">{validation.location}</div>
                        <div className="text-center">
                          <Badge className={validation.status === "Active" ? "bg-green-600" : "bg-slate-600"}>
                            {validation.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overview">
            <Card className="bg-white border-2 border-[#94B4C1] shadow-lg">
              <CardHeader>
                <CardTitle className="text-[#213448]">Weekly Attendance Overview</CardTitle>
                <CardDescription className="text-[#547792]">
                  Day-wise attendance trends for {selectedSection || "the selected section"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyOverview.length === 0 ? (
                  <div className="text-[#547792] text-sm">No weekly attendance data available yet.</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={weeklyOverview}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#94B4C1" />
                        <XAxis dataKey="day" stroke="#547792" />
                        <YAxis stroke="#547792" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#ffffff",
                            border: "2px solid #94B4C1",
                            borderRadius: "8px",
                            color: "#213448",
                          }}
                        />
                        <Legend wrapperStyle={{ color: "#547792" }} />
                        <Bar dataKey="present" fill="#547792" radius={[8, 8, 0, 0]} name="Present" />
                        <Bar dataKey="absent" fill="#94B4C1" radius={[8, 8, 0, 0]} name="Absent" />
                      </BarChart>
                    </ResponsiveContainer>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                      {weeklyOverview.map((day) => {
                        const total = day.present + day.absent;
                        const percentage = total ? Math.round((day.present / total) * 100) : 0;
                        return (
                          <div key={day.day} className="p-4 bg-[#94B4C1]/20 border border-[#94B4C1] rounded-lg text-center">
                            <div className="text-[#547792] font-semibold mb-2">{day.day}</div>
                            <div className="text-3xl font-bold bg-gradient-to-r from-[#213448] to-[#547792] bg-clip-text text-transparent mb-1">
                              {percentage}%
                            </div>
                            <div className="text-[#547792] text-xs">{day.present}/{total}</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isLoading && <div className="mt-6 text-sm text-[#547792]">Loading admin dashboard...</div>}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <Card
      className={
        accent
          ? "bg-gradient-to-br from-[#547792]/10 to-[#94B4C1]/30 border-2 border-[#547792] shadow-lg"
          : "bg-gradient-to-br from-white to-[#94B4C1]/20 border-2 border-[#94B4C1] shadow-lg"
      }
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <div className="text-2xl font-bold text-[#213448]">{value}</div>
            <div className="text-xs text-[#547792]">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
