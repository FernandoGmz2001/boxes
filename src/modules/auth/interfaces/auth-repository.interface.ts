import type {
  IAuthUser,
  IAuthUserRecord,
} from './auth-user.interface.js';

export const AUTH_REPOSITORY: symbol = Symbol('AUTH_REPOSITORY');

export interface IAuthRepository {
  findByEmail(email: string): Promise<IAuthUserRecord | null>;
  findById(id: number): Promise<IAuthUser | null>;
}
