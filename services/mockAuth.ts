/**
 * Deprecated — superseded by `services/mockOtp.ts` and the phone+OTP flow
 * in `pages/auth/AuthFlow.tsx`. Kept as a no-op shim so any legacy import
 * still type-checks. Remove after Sprint 4 once admin login moves server-side.
 */
import { User } from '../types';

export const mockLogin = async (
  _email: string,
  _password: string,
  _users: User[]
): Promise<User | null> => null;

export const mockSocialLogin = async (
  _provider: 'Google' | 'Apple' | 'Facebook',
  _users: User[]
): Promise<User | null> => null;
