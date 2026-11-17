import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Every protected resource and its allowed actions.
 */
export const statement = {
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

/**
 * Role definitions mapped to their allowed permissions.
 */
export const roles = {
  user: ac.newRole({}),
  admin: ac.newRole({
    ...adminAc.statements,
  }),
} as const;

export type RoleName = keyof typeof roles;
export type Resource = keyof typeof statement;
export type Action<R extends Resource> = (typeof statement)[R][number];

/**
 * Synchronous permission check using the role already present on the session.
 */
export function hasPermission<R extends Resource>(
  roleName: string | null | undefined,
  resource: R,
  action: Action<R>,
): boolean {
  if (!roleName || !(roleName in roles)) return false;
  const role = roles[roleName as RoleName];
  const result = role.authorize({ [resource]: [action] });
  return result.success;
}

/**
 * Returns true if the user's role grants access to the `/studio` portal.
 */
export function canAccessStudio(roleName: string | null | undefined): boolean {
  return hasPermission(roleName, "user", "list");
}
