import { UserRole } from '../../../def/enums/user_role.enum';

export type CreateUser = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
};

