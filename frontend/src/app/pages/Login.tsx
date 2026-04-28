import { useState } from "react";
import { useNavigate } from "react-router";
import { GraduationCap, UserCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { loginStudent, resetUserPassword } from "../../services/authService";
import type { UserRole } from "../../services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";

type UserType = UserRole;

export default function Login() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserType>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [resetForm, setResetForm] = useState({
    identifier: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await loginStudent(
        userType,
        credentials.username.trim(),
        credentials.password
      );

      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));

      if (res.user.role === "student") navigate("/student");
      if (res.user.role === "teacher") navigate("/teacher");
      if (res.user.role === "admin") navigate("/admin");
    } catch (error) {
      console.error("Login failed", error);
      alert("Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (resetForm.newPassword !== resetForm.confirmPassword) {
      alert("New passwords do not match");
      return;
    }

    setIsResetting(true);

    try {
      await resetUserPassword(userType, resetForm.identifier.trim(), resetForm.newPassword);
      alert("Password reset successfully. You can sign in with the new password.");
      setCredentials({
        username: resetForm.identifier.trim(),
        password: "",
      });
      setResetForm({
        identifier: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsResetOpen(false);
    } catch (error) {
      console.error("Password reset failed", error);
      alert("Password reset failed. Check your roll number or email.");
    } finally {
      setIsResetting(false);
    }
  };

  const userTypes = [
    {
      type: "student" as const,
      icon: GraduationCap,
      title: "Student Login",
      description: "Access your attendance and study materials",
      gradient: "from-[#547792] to-[#94B4C1]",
      border: "border-[#547792]",
      hover: "hover:border-[#213448] hover:shadow-lg",
    },
    {
      type: "teacher" as const,
      icon: UserCircle,
      title: "Teacher Login",
      description: "Manage attendance and upload resources",
      gradient: "from-[#94B4C1] to-[#EAE0CF]",
      border: "border-[#94B4C1]",
      hover: "hover:border-[#547792] hover:shadow-lg",
    },
    {
      type: "admin" as const,
      icon: ShieldCheck,
      title: "Admin Login",
      description: "Monitor and validate attendance system",
      gradient: "from-[#213448] to-[#547792]",
      border: "border-[#213448]",
      hover: "hover:border-[#94B4C1] hover:shadow-lg",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAE0CF] via-[#f5f0e8] to-[#94B4C1]/30 flex items-center justify-center px-4 py-6 sm:p-6">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#547792]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#94B4C1]/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-tight bg-gradient-to-r from-[#213448] via-[#547792] to-[#213448] bg-clip-text text-transparent sm:text-5xl lg:text-6xl">
            Smart Attendance System
          </h1>
          <p className="mt-3 text-base text-[#547792] sm:text-xl">Advanced Proxy Detection & Real-time Monitoring</p>
        </div>

        {/* User Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {userTypes.map((item) => {
            const Icon = item.icon;
            const isSelected = userType === item.type;
            return (
              <button
                key={item.type}
                onClick={() => setUserType(item.type)}
                className={`p-4 sm:p-6 rounded-2xl border-3 transition-all duration-300 transform hover:scale-[1.02] sm:hover:scale-105 ${
                  isSelected
                    ? `${item.border} bg-gradient-to-br ${item.gradient} shadow-2xl border-4`
                    : `border-2 border-[#94B4C1] bg-white/80 ${item.hover}`
                }`}
              >
                <Icon className={`w-12 h-12 mx-auto mb-4 ${isSelected ? "text-white" : "text-[#547792]"}`} />
                <h3 className={`text-xl font-bold mb-2 ${isSelected ? "text-white" : "text-[#213448]"}`}>
                  {item.title}
                </h3>
                <p className={`text-sm ${isSelected ? "text-white/90" : "text-[#547792]"}`}>
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 border-3 border-[#94B4C1] backdrop-blur-lg shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-[#213448] sm:text-3xl">
              {userTypes.find((u) => u.type === userType)?.title}
            </CardTitle>
            <CardDescription className="text-[#547792]">
              Enter your credentials to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#213448]">
                  Username / Email
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={`Enter your ${userType} ID`}
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="bg-white border-[#94B4C1] text-[#213448] placeholder:text-[#94B4C1] focus:border-[#547792] focus:ring-[#547792]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#213448]">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="bg-white border-[#94B4C1] text-[#213448] placeholder:text-[#94B4C1] focus:border-[#547792] focus:ring-[#547792] pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#547792] hover:text-[#213448]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#547792] to-[#94B4C1] hover:from-[#213448] hover:to-[#547792] text-white py-6 text-lg font-semibold shadow-lg transition-all duration-300"
              >
                {isSubmitting
                  ? "Signing in..."
                  : `Login as ${userType.charAt(0).toUpperCase() + userType.slice(1)}`}
              </Button>

              <div className="text-center text-[#547792] text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setResetForm((current) => ({
                      ...current,
                      identifier: credentials.username.trim(),
                    }));
                    setIsResetOpen(true);
                  }}
                  className="hover:text-[#213448] transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
          <DialogContent className="bg-white border-2 border-[#94B4C1]">
            <DialogHeader>
              <DialogTitle className="text-[#213448]">Reset Password</DialogTitle>
              <DialogDescription className="text-[#547792]">
                Enter your {userType === "student" ? "roll number" : "email"} and choose a new password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-identifier" className="text-[#213448]">
                  {userType === "student" ? "Roll Number" : "Email"}
                </Label>
                <Input
                  id="reset-identifier"
                  value={resetForm.identifier}
                  onChange={(e) => setResetForm({ ...resetForm, identifier: e.target.value })}
                  className="bg-white border-[#94B4C1] text-[#213448]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-password" className="text-[#213448]">
                  New Password
                </Label>
                <Input
                  id="reset-password"
                  type="password"
                  value={resetForm.newPassword}
                  onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                  className="bg-white border-[#94B4C1] text-[#213448]"
                  minLength={6}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password" className="text-[#213448]">
                  Confirm New Password
                </Label>
                <Input
                  id="reset-confirm-password"
                  type="password"
                  value={resetForm.confirmPassword}
                  onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                  className="bg-white border-[#94B4C1] text-[#213448]"
                  minLength={6}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={isResetting}
                className="w-full bg-gradient-to-r from-[#547792] to-[#94B4C1] hover:from-[#213448] hover:to-[#547792] text-white"
              >
                {isResetting ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Footer */}
        <div className="text-center mt-8 text-[#547792] text-sm">
          <p>© 2026 Smart Attendance System - Powered by AI & Location Verification</p>
        </div>
      </div>
    </div>
  );
}
