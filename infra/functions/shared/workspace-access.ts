import { getItem, queryByGSI1 } from './dynamo';

export interface WorkspaceAccess {
  ownerPK: string;
  ownerId: string;
  workspaceId: string;
  role: 'owner' | 'editor' | 'viewer';
}

export async function resolveWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceAccess | null> {
  // Check if user owns the workspace
  const owned = await getItem(`USER#${userId}`, `WORKSPACE#${workspaceId}`);
  if (owned) {
    return {
      ownerPK: `USER#${userId}`,
      ownerId: userId,
      workspaceId,
      role: 'owner',
    };
  }

  // Check if workspace is shared with user via GSI1
  const shares = await queryByGSI1(`SHARED_USER#${userId}`, `WORKSPACE#`);
  const match = shares.find(s => s.workspaceId === workspaceId);
  if (!match) return null;

  const ownerId = match.ownerId as string;
  return {
    ownerPK: `USER#${ownerId}`,
    ownerId,
    workspaceId,
    role: match.role as 'editor' | 'viewer',
  };
}

export function assertWriteAccess(access: WorkspaceAccess): void {
  if (access.role === 'viewer') {
    throw new Error('Permissão insuficiente: acesso somente leitura');
  }
}

export function assertOwnerAccess(access: WorkspaceAccess, userId: string): void {
  if (access.ownerId !== userId) {
    throw new Error('Apenas o dono do espaço pode realizar esta ação');
  }
}
