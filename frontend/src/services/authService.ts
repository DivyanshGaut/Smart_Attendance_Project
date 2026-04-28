import { login, resetPassword, type UserRole } from "./api";

export const loginStudent = async (
  role: UserRole,
  identifier: string,
  password: string
) => {
  return login(role, identifier, password);
};

export const resetUserPassword = async (
  role: UserRole,
  identifier: string,
  newPassword: string
) => {
  return resetPassword(role, identifier, newPassword);
};
