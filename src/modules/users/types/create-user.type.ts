import { Role } from '../../../entities/user.entity';
export type CreateUser = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
};

