// import { UserRole } from 'src/def/enums/user_role_status';
export type CreateUser = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  // role: UserRole;
};