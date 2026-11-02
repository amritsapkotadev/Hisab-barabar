import { v4 as uuidv4 } from 'uuid'
import type { IGroupMember } from '@/models/Group'

/**
 * Build a fresh list of group members from raw display names (used at group
 * creation time). Each member gets a stable, unique `id` that never changes
 * and never collides, even if two members share the same `name`.
 */
export function buildMembersFromNames(names: string[]): IGroupMember[] {
  return names
    .map((name) => (typeof name === 'string' ? name.trim() : ''))
    .filter((name) => name.length > 0)
    .map((name) => ({ id: uuidv4(), name } as IGroupMember))
}

/** Find a member by their stable group-scoped id. */
export function findMemberById(members: IGroupMember[], id: string): IGroupMember | undefined {
  return members.find((member) => member.id === id)
}

/** Find a member linked to a real registered account. */
export function findMemberByUserId(members: IGroupMember[], userId: string): IGroupMember | undefined {
  return members.find((member) => {
    if (!member.userId) return false
    // `userId` may be a raw ObjectId, a string, or a populated User document.
    const raw: any = member.userId
    const linkedId = raw._id?.toString() ?? raw.toString()
    return linkedId === userId
  })
}

/**
 * A user can access a group if they created it or are linked to one of its
 * member entries. The creator check matters for groups created before the
 * member-identity migration (creator may not be linked yet).
 */
export function canAccessGroup(
  group: { createdBy?: any; members?: IGroupMember[] },
  userId: string
): boolean {
  if (!group) return false
  const rawCreator: any = group.createdBy
  const creatorId = rawCreator?._id?.toString() ?? rawCreator?.toString()
  if (creatorId === userId) return true
  return !!findMemberByUserId(group.members || [], userId)
}

/**
 * Add (or "claim") a real registered account as a group member.
 *
 * If an unlinked ghost member already exists with a matching name (case
 * insensitive), that entry is claimed (its `userId` is set) instead of
 * creating a duplicate row — this preserves the member's stable `id` and any
 * expense/balance history already attached to it.
 */
export function addOrClaimMember(
  members: IGroupMember[],
  user: { id: string; name: string }
): { members: IGroupMember[]; member: IGroupMember; alreadyMember: boolean } {
  const existingByUserId = findMemberByUserId(members, user.id)
  if (existingByUserId) {
    return { members, member: existingByUserId, alreadyMember: true }
  }

  const ghostMatch = members.find(
    (member) => !member.userId && member.name.trim().toLowerCase() === user.name.trim().toLowerCase()
  )
  if (ghostMatch) {
    ghostMatch.userId = user.id as unknown as IGroupMember['userId']
    return { members, member: ghostMatch, alreadyMember: false }
  }

  const newMember: IGroupMember = { id: uuidv4(), name: user.name, userId: user.id as unknown as IGroupMember['userId'] }
  members.push(newMember)
  return { members, member: newMember, alreadyMember: false }
}
