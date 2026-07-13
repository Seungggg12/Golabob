import { AuthUser } from "./auth-user";

export interface RequestWithUser {
  headers: Record<string, string | string[] | undefined>;
  user?: AuthUser;
}
