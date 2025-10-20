import { UserRole } from '../../../def/enums/user_role.enum';

export type FindUsersQuery = {
  // @Transform(({ value }) => value.toLowerCase().trim())
  email?: string;
  // @Transform(({ value }) => value.trim())
  name?: string;
  role?: UserRole;
  limit?: number;
  page?: number;
}
