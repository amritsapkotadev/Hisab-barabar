#!/usr/bin/env node
/**
 * Migrate legacy name-based groups to stable member ids.
 *
 * Legacy docs store `members: ["Kushal Shah", ...]`, name-keyed balances and
 * name-based expense fields (`paidBy`, `participants`, `splits[].participant`,
 * `payers[].name`). This converts them to `{ id, name, userId? }` members and
 * rewrites expenses to use those ids so the current app can read the data.
 *
 *   node --env-file=.env.local scripts/migrate-legacy-groups.js --user you@example.com          # dry run
 *   node --env-file=.env.local scripts/migrate-legacy-groups.js --user you@example.com --apply  # write
 *   node --env-file=.env.local scripts/migrate-legacy-groups.js --all --apply
 *
 * Only the creator entry is linked to a real account (they already have full
 * access). Other ghost members stay unlinked so no account is granted access
 * unexpectedly. Duplicate display names are reported and left untouched.
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const mongoose = require(path.resolve(__dirname, '../node_modules/mongoose'))

const args = process.argv.slice(2)
const argValue = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}
const apply = args.includes('--apply')
const all = args.includes('--all')
const userArg = argValue('--user')
if (!all && !userArg) {
  console.error('Pass --user <email|userId> (or --all). Add --apply to write.')
  process.exit(1)
}

function loadUri() {
  const line = fs
    .readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith('MONGODB_URI='))
  if (!line) throw new Error('MONGODB_URI not found in .env.local')
  return line.slice('MONGODB_URI='.length).trim().replace(/^['"]|['"]$/g, '')
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

function calculateNetSettlements(balances) {
  const settlements = []
  const creditors = []
  const debtors = []
  for (const [userId, balance] of Object.entries(balances)) {
    if (balance > 0.01) creditors.push({ userId, amount: balance })
    else if (balance < -0.01) debtors.push({ userId, amount: -balance })
  }
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)
  while (creditors.length && debtors.length) {
    const creditor = creditors[0]
    const debtor = debtors[0]
    const amount = Math.min(creditor.amount, debtor.amount)
    settlements.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amount: round2(amount) })
    creditor.amount -= amount
    debtor.amount -= amount
    if (creditor.amount < 0.01) creditors.shift()
    if (debtor.amount < 0.01) debtors.shift()
  }
  return settlements
}

async function resolveUser(db, userArg) {
  if (/^[a-f0-9]{24}$/i.test(userArg)) {
    return db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(userArg) })
  }
  return db.collection('users').findOne({ email: userArg.toLowerCase() })
}

async function main() {
  await mongoose.connect(loadUri(), { serverSelectionTimeoutMS: 15000 })
  const db = mongoose.connection.db

  const filter = { members: { $elemMatch: { $type: 'string' } } }
  if (!all) {
    const user = await resolveUser(db, userArg)
    if (!user) throw new Error(`No user matching ${userArg}`)
    filter.$or = [{ createdBy: user._id }, { 'members.userId': user._id }]
  }

  const groups = await db.collection('groups').find(filter).toArray()
  if (!groups.length) {
    console.log('No legacy groups found.')
    return
  }

  let groupsUpdated = 0
  let expensesUpdated = 0
  const ambiguous = []

  for (const group of groups) {
    const groupAmbiguous = []
    const creator = await db.collection('users').findOne(
      { _id: group.createdBy },
      { projection: { name: 1 } }
    )

    const members = group.members
      .filter((member) => typeof member === 'string' || (member && member.name))
      .map((member) =>
        typeof member === 'string'
          ? { id: crypto.randomUUID(), name: member.trim() }
          : {
              id: member.id || crypto.randomUUID(),
              name: member.name,
              ...(member.userId ? { userId: member.userId } : {}),
            }
      )
      .filter((member) => member.name)

    let creatorMember = members.find(
      (member) => member.userId && String(member.userId) === String(group.createdBy)
    )
    if (!creatorMember && creator) {
      creatorMember = members.find(
        (member) =>
          !member.userId && member.name.trim().toLowerCase() === creator.name.trim().toLowerCase()
      )
      if (creatorMember) creatorMember.userId = group.createdBy
      else {
        creatorMember = { id: crypto.randomUUID(), name: creator.name, userId: group.createdBy }
        members.push(creatorMember)
      }
    }

    const ids = new Set(members.map((member) => member.id))
    const byName = new Map()
    for (const member of members) {
      const key = member.name.trim().toLowerCase()
      if (!byName.has(key)) byName.set(key, [])
      byName.get(key).push(member)
    }
    const resolveName = (value) => {
      if (!value) return value
      if (ids.has(value)) return value
      const matches = byName.get(String(value).trim().toLowerCase()) || []
      if (matches.length === 1) return matches[0].id
      if (matches.length > 1) {
        const entry = `${group.name}: "${value}"`
        ambiguous.push(entry)
        groupAmbiguous.push(entry)
      }
      return value
    }

    const expenses = await db.collection('expenses').find({ groupId: group._id }).toArray()
    const migratedExpenses = []
    const expenseUpdates = []
    for (const expense of expenses) {
      const update = {}
      if (expense.paidBy) update.paidBy = resolveName(expense.paidBy)
      if (Array.isArray(expense.participants)) {
        update.participants = expense.participants.map(resolveName)
      }
      if (Array.isArray(expense.splits)) {
        update.splits = expense.splits.map((split) => ({
          ...split,
          participant: resolveName(split.participant),
        }))
      }
      if (Array.isArray(expense.payers)) {
        update.payers = expense.payers.map((payer) => ({
          ...payer,
          name: resolveName(payer.name),
        }))
      }
      migratedExpenses.push({ ...expense, ...update })
      if (Object.keys(update).length) expenseUpdates.push({ id: expense._id, update })
    }

    const balances = {}
    for (const member of members) balances[member.id] = 0
    for (const expense of migratedExpenses) {
      const equal = expense.splitType === 'equal' || !expense.splits?.length
      if (equal) {
        const participants = expense.participants || []
        const share = expense.amount / (participants.length || 1)
        if (expense.paidBy && balances[expense.paidBy] !== undefined) {
          balances[expense.paidBy] = round2(balances[expense.paidBy] + expense.amount)
        }
        for (const participant of participants) {
          if (balances[participant] !== undefined) {
            balances[participant] = round2(balances[participant] - share)
          }
        }
      } else {
        const payers = expense.payers?.length
          ? expense.payers
          : [{ name: expense.paidBy, amountPaid: expense.amount }]
        for (const payer of payers) {
          if (balances[payer.name] !== undefined) {
            balances[payer.name] = round2(balances[payer.name] + payer.amountPaid)
          }
        }
        for (const split of expense.splits) {
          if (balances[split.participant] !== undefined) {
            balances[split.participant] = round2(
              balances[split.participant] - (split.amount || 0)
            )
          }
        }
      }
    }

    const settlements = (group.settlements || []).map((settlement) => ({
      ...settlement,
      fromUserId: resolveName(settlement.fromUserId),
      toUserId: resolveName(settlement.toUserId),
    }))

    if (groupAmbiguous.length) {
      console.log(`Skipping "${group.name}" (${group._id}) because member names are ambiguous.`)
      continue
    }

    console.log(
      `${apply ? 'Migrating' : 'Would migrate'} "${group.name}" (${group._id}): ` +
        `${group.members.length} -> ${members.length} members, ${expenses.length} expenses`
    )

    if (apply) {
      for (const { id, update } of expenseUpdates) {
        await db.collection('expenses').updateOne({ _id: id }, { $set: update })
        expensesUpdated++
      }
      await db.collection('groups').updateOne(
        { _id: group._id },
        {
          $set: {
            members,
            balances,
            netSettlements: calculateNetSettlements(balances),
            settlements,
            totalExpenses: migratedExpenses.reduce((sum, expense) => sum + expense.amount, 0),
          },
        }
      )
      groupsUpdated++
    }
  }

  if (ambiguous.length) {
    console.log(`\nAmbiguous names (left as-is, fix manually):\n- ${ambiguous.join('\n- ')}`)
  }
  console.log(
    `\n${apply ? 'Migrated' : 'Dry run:'} ${apply ? groupsUpdated : groups.length} groups, ` +
      `${apply ? expensesUpdated : 'all'} expenses.${apply ? '' : ' Re-run with --apply to write.'}`
  )
}

main()
  .catch((err) => {
    console.error('Migration failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
