import { RoleModel } from '../models/Role';
import {
  ALL_PERMISSIONS,
  ROLE_META,
  ROLE_PERMISSIONS,
} from '../constants';
import { RoleDoc } from '../models/Role';

export async function getPermissionMatrix() {
  const custom = await RoleModel.find({}).lean();

  const customMap = new Map<string, string[]>(
    custom.map((r: any) => [r.name, r.permissions ?? []]),
  );

  const roles = Object.keys(ROLE_META).map((name) => {
    const meta = ROLE_META[name];
    return {
      name,
      label: meta.label,
      desc: meta.desc,
      color: meta.color,
      bg: meta.bg,
      permissions:
        customMap.get(name) ?? (ROLE_PERMISSIONS[name] ?? []),
      isCustom: customMap.has(name),
    };
  });

  const matrix = ALL_PERMISSIONS.map((permission) => ({
    permission,
    roles: roles
      .filter((r) => r.permissions.includes(permission))
      .map((r) => r.name),
  }));

  return { roles, permissions: [...ALL_PERMISSIONS], matrix };
}

export async function getRolePermissions(role: string): Promise<string[]> {
  const custom = await RoleModel.findOne({ name: role.toUpperCase() })
    .select('permissions')
    .lean();
  if (custom && custom.permissions?.length) {
    return custom.permissions;
  }
  return ROLE_PERMISSIONS[role] ?? [];
}

export async function setRolePermissions(
  role: string,
  permissions: string[],
): Promise<string[]> {
  const name = role.toUpperCase();
  const meta = ROLE_META[name];

  await RoleModel.findOneAndUpdate(
    { name },
    {
      $set: {
        name,
        permissions,
        isCustom: true,
        label: meta?.label ?? name,
        description: meta?.desc ?? '',
        color: meta?.color ?? '#4F46E5',
        bg: meta?.bg ?? 'rgba(79,70,229,0.1)',
      },
    },
    { upsert: true, new: true },
  );

  return permissions;
}
