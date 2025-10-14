import Joi from 'joi';
import type { CreateUser } from './create-user.type';
import { Role } from '../../../entities/user.entity';

export type UpdateUser = Partial<CreateUser>;