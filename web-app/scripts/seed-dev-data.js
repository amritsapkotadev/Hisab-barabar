#!/usr/bin/env node
/**
 * Dev seed: realistic groups + expenses attached to ONE existing user.
 *
 *   node scripts/seed-dev-data.js --user <userId>                      # seed
 *   node scripts/seed-dev-data.js --user <userId> --clean              # remove seeded docs
 *   node scripts/seed-dev-data.js --user <userId> --clean --restore-budget 99
 *
 * Reads MONGODB_URI from .env.local. Every document it creates carries
 * `seedTag`, so --clean deletes only those. Fake members use made-up names and
 * the script aborts if one matches a real user (groups are matched by member
 * name, so a clash would show seeded groups in a real person's app).
 */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const mongoose = require(path.resolve(__dirname, '../node_modules/mongoose'))

const SEED_TAG = 'hb-dev-seed-v1'
const SEED_BUDGET = 25000

const args = process.argv.slice(2)
const argValue = (flag) => {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}
const userId = argValue('--user')
const clean = args.includes('--clean')
const restoreBudget = argValue('--restore-budget')

if (!userId) {
  console.error('Missing --user <userId>')
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

// ---- seed content -----------------------------------------------------------
const FAKE_PEOPLE = ['Aarav Sharma', 'Priya Thapa', 'Rohan Karki', 'Sita Gurung', 'Bikash Rai', 'Nima Sherpa']

// day = days before today. paidBy / participants use "ME" for the current user.
const GROUPS = [
  {
    name: 'Flat 4B Roommates',
    emoji: '🏠',
    description: 'Rent, bills and groceries for the flat',
    members: ['ME', 'Aarav Sharma', 'Priya Thapa', 'Rohan Karki'],
    expenses: [
      { d: 29, desc: 'October rent', amt: 32000, by: 'Aarav Sharma' },
      { d: 26, desc: 'Electricity bill (NEA)', amt: 3640, by: 'ME' },
      { d: 24, desc: 'WorldLink internet', amt: 1695, by: 'Priya Thapa' },
      { d: 19, desc: 'Weekly groceries', amt: 4280, by: 'ME' },
      { d: 14, desc: 'Gas cylinder refill', amt: 1800, by: 'Rohan Karki' },
      { d: 9, desc: 'Cleaning supplies', amt: 960, by: 'Priya Thapa' },
      { d: 4, desc: 'Weekly groceries', amt: 3915, by: 'Aarav Sharma' },
      { d: 1, desc: 'Water jar refill', amt: 420, by: 'ME' },
    ],
  },
  {
    name: 'Pokhara Trip',
    emoji: '🏔️',
    description: 'Long weekend by the lake',
    members: ['ME', 'Aarav Sharma', 'Sita Gurung', 'Bikash Rai', 'Nima Sherpa'],
    expenses: [
      { d: 21, desc: 'Bus tickets Kathmandu-Pokhara', amt: 6500, by: 'Bikash Rai' },
      { d: 20, desc: 'Lakeside hotel (2 nights)', amt: 14400, by: 'ME' },
      { d: 20, desc: 'Dinner at Moondance', amt: 5750, by: 'Sita Gurung' },
      { d: 19, desc: 'Paragliding', amt: 25000, by: 'Nima Sherpa', parts: ['ME', 'Nima Sherpa', 'Bikash Rai', 'Aarav Sharma'] },
      { d: 19, desc: 'Boating on Phewa Lake', amt: 1500, by: 'Aarav Sharma' },
      { d: 18, desc: 'Breakfast and coffee', amt: 2340, by: 'ME' },
      { d: 18, desc: 'Taxi to the airport', amt: 1200, by: 'Sita Gurung', parts: ['Sita Gurung', 'ME', 'Bikash Rai'] },
    ],
  },
  {
    name: 'Office Lunch Gang',
    emoji: '🍜',
    description: 'Weekday lunches near the office',
    members: ['ME', 'Priya Thapa', 'Bikash Rai'],
    expenses: [
      { d: 12, desc: 'Momo at Newa Momo', amt: 1350, by: 'Priya Thapa' },
      { d: 8, desc: 'Thakali set lunch', amt: 1890, by: 'ME' },
      { d: 5, desc: 'Chiya and samosa', amt: 540, by: 'Bikash Rai' },
      { d: 2, desc: 'Pizza Friday', amt: 2250, by: 'ME' },
    ],
  },
]

// Personal spending, current month heavy so the budget gauge has something to show.
// c = category, pm = payment method. Several share a day so the day grouping/total shows up,
// and one has no category to mirror older records.
const PERSONAL = [
  { d: 0, desc: 'Coffee and croissant', amt: 420, c: 'Food', pm: 'Digital Wallet' },
  { d: 0, desc: 'Pathao ride to office', amt: 310, c: 'Transport', pm: 'Digital Wallet' },
  { d: 0, desc: 'Lunch with a very long description that should wrap onto a second line', amt: 380, c: 'Food', pm: 'Cash' },
  { d: 1, desc: 'Ncell data pack', amt: 599, c: 'Bills', pm: 'Digital Wallet' },
  { d: 2, desc: 'Pharmacy', amt: 850, c: 'Health', pm: 'Cash' },
  { d: 3, desc: 'Movie tickets', amt: 1200, c: 'Entertainment', pm: 'Debit Card' },
  { d: 5, desc: 'Gym membership', amt: 3500, c: 'Health', pm: 'Bank Transfer' },
  { d: 6, desc: 'Netflix', amt: 1100, c: 'Entertainment', pm: 'Credit Card' },
  { d: 8, desc: 'Petrol', amt: 1500, c: 'Transport', pm: 'Cash' },
  { d: 10, desc: 'Haircut', amt: 600, pm: 'Cash' },
  { d: 12, desc: 'Books from Ratna Pustak', amt: 2250, c: 'Education', pm: 'Debit Card' },
  { d: 12, desc: 'New earphones', amt: 3200, c: 'Shopping', pm: 'Credit Card' },
  { d: 15, desc: 'Dinner out', amt: 1450, c: 'Food', pm: 'Credit Card' },
  { d: 18, desc: 'Electricity top-up', amt: 800, c: 'Bills', pm: 'Bank Transfer' },
  { d: 21, desc: 'Weekend groceries', amt: 1900, c: 'Food', pm: 'Cash' },
  { d: 24, desc: 'Bus to Pokhara', amt: 1300, c: 'Travel', pm: 'Cash' },
  { d: 33, desc: 'Phone repair', amt: 2800, c: 'Shopping', pm: 'Debit Card' },
  { d: 38, desc: 'Birthday gift', amt: 2200, c: 'Gifts', pm: 'Digital Wallet' },
]

// ---- helpers ----------------------------------------------------------------
const at = (daysAgo, hour = 13) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(hour, 15, 0, 0)
  return d
}
const ymd = (d) => d.toISOString().slice(0, 10)
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

async function main() {
  await mongoose.connect(loadUri(), { serverSelectionTimeoutMS: 15000 })
  const db = mongoose.connection.db
  const userOid = new mongoose.Types.ObjectId(userId)
  const user = await db.collection('users').findOne({ _id: userOid })
  if (!user) throw new Error(`No user with id ${userId}`)
  const ME = user.name

  if (clean) {
    const e = await db.collection('expenses').deleteMany({ seedTag: SEED_TAG })
    const g = await db.collection('groups').deleteMany({ seedTag: SEED_TAG })
    console.log(`Removed ${g.deletedCount} groups and ${e.deletedCount} expenses.`)
    if (restoreBudget !== undefined) {
      await db.collection('users').updateOne({ _id: userOid }, { $set: { budget: Number(restoreBudget) } })
      console.log(`Budget restored to ${restoreBudget}.`)
    }
    return
  }

  if ((await db.collection('groups').countDocuments({ seedTag: SEED_TAG })) > 0) {
    throw new Error('Seed data already present. Run with --clean first.')
  }
  const clash = await db.collection('users').find({ name: { $in: FAKE_PEOPLE } }, { projection: { name: 1 } }).toArray()
  if (clash.length) throw new Error(`Fake member names clash with real users: ${clash.map((u) => u.name).join(', ')}`)

  const resolve = (n) => (n === 'ME' ? ME : n)
  let groupCount = 0
  let expenseCount = 0

  for (const g of GROUPS) {
    const memberNames = g.members.map(resolve)
    const memberIdByName = new Map(memberNames.map((name) => [name, crypto.randomUUID()]))
    const members = memberNames.map((name) => ({
      id: memberIdByName.get(name),
      name,
      ...(name === ME ? { userId: userOid } : {}),
    }))

    // Balances are keyed by stable member id, not display name.
    const balances = {}
    for (const member of members) balances[member.id] = 0
    for (const e of g.expenses) {
      const participantIds = (e.parts || g.members).map(resolve).map((n) => memberIdByName.get(n))
      const share = e.amt / participantIds.length
      const payerId = memberIdByName.get(resolve(e.by))
      balances[payerId] = round2(balances[payerId] + e.amt)
      for (const participantId of participantIds) {
        balances[participantId] = round2(balances[participantId] - share)
      }
    }

    const created = at(Math.max(...g.expenses.map((e) => e.d)) + 2, 10)
    const { insertedId } = await db.collection('groups').insertOne({
      name: g.name,
      description: g.description,
      createdBy: userOid,
      members,
      inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase(),
      emoji: g.emoji,
      netSettlements: calculateNetSettlements(balances),
      settlements: [],
      balances,
      settled: false,
      settledAt: null,
      settlementNotes: [],
      totalExpenses: g.expenses.reduce((sum, e) => sum + e.amt, 0),
      seedTag: SEED_TAG,
      createdAt: created,
      updatedAt: created,
      __v: 0,
    })
    groupCount++

    for (const e of g.expenses) {
      const when = at(e.d)
      const participants = (e.parts || g.members).map(resolve).map((n) => memberIdByName.get(n))
      const share = round2(e.amt / participants.length)
      const payerId = memberIdByName.get(resolve(e.by))
      await db.collection('expenses').insertOne({
        description: e.desc,
        amount: e.amt,
        date: ymd(when),
        type: 'group',
        createdBy: userOid,
        groupId: insertedId,
        paidBy: payerId,
        participants,
        splits: participants.map((p) => ({ participant: p, amount: share })),
        payers: [{ name: payerId, amountPaid: e.amt }],
        splitType: 'equal',
        seedTag: SEED_TAG,
        createdAt: when,
        updatedAt: when,
        __v: 0,
      })
      expenseCount++
    }
  }

  for (const p of PERSONAL) {
    const when = at(p.d, 9 + (p.d % 9))
    await db.collection('expenses').insertOne({
      description: p.desc,
      amount: p.amt,
      date: when.toISOString(),
      type: 'personal',
      createdBy: userOid,
      groupId: null,
      paidBy: ME,
      participants: [ME],
      ...(p.c && { category: p.c }),
      paymentMethod: p.pm,
      splits: [],
      payers: [],
      splitType: 'equal',
      seedTag: SEED_TAG,
      createdAt: when,
      updatedAt: when,
      __v: 0,
    })
    expenseCount++
  }

  await db.collection('users').updateOne({ _id: userOid }, { $set: { budget: SEED_BUDGET } })
  console.log(`Seeded ${groupCount} groups and ${expenseCount} expenses for "${ME}".`)
  console.log(`Budget: ${user.budget} -> ${SEED_BUDGET}  (restore with: --clean --restore-budget ${user.budget})`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())
