# SplitSaathi - Expense Splitter App

A React Native app for splitting expenses among friends and groups.

## Features

### Core Features
- Create and manage groups
- Add expenses with different split types (Equal, Unequal, Percentage, Shares)
- Track balances and settlements
- Export expense data

### New: Settle Up Feature

The settle up feature helps users understand who owes whom and what amounts need to be transferred to balance all accounts.

#### How it works:
1. **Balance Calculation**: The system calculates each member's balance based on:
   - Money they've paid for the group
   - Money they owe to the group
   - Different split types (equal, unequal, percentage, shares)

2. **Settlement Algorithm**: Uses a greedy algorithm to minimize the number of transactions needed:
   - Groups members with positive balances (who get money back)
   - Groups members with negative balances (who owe money)
   - Calculates optimal payment paths to settle all debts

3. **Settlement Display**: Shows:
   - Individual balances for each member
   - Required transactions to settle up
   - Total unsettled amount
   - Settlement status (settled/unsettled)

#### Usage:
1. Navigate to a group
2. Go to the "Balances" tab
3. Tap "Settle Up" button
4. View detailed settlement instructions

#### API Endpoints:
- `GET /api/groups/:id/settlements` - Get settlement calculations for a group

#### Frontend:
- `/settle-up/[groupId]` - Settle up page showing detailed settlement information

## Technical Implementation

### Backend (Node.js/Express)
- Settlement calculation in `backend/controllers/groupController.js`
- Route: `backend/routes/groupRoutes.js`
- Handles different split types (equal, unequal, percentage, shares)

### Frontend (React Native/Expo)
- Settle up screen: `app/settle-up/[groupId].tsx`
- API service: `services/api.ts`
- Types: `types/index.ts`

### Key Algorithms
1. **Balance Calculation**: Processes all expenses and calculates net balance per member
2. **Settlement Optimization**: Greedy algorithm to minimize transaction count
3. **Split Type Handling**: Supports all split types with proper calculation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on device or simulator

## API Documentation

### Get Group Settlements
```
GET /api/groups/:id/settlements
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balances": {
      "John": 25.50,
      "Jane": -15.25,
      "Bob": -10.25
    },
    "settlements": [
      {
        "from": "Jane",
        "to": "John",
        "amount": 15.25
      },
      {
        "from": "Bob", 
        "to": "John",
        "amount": 10.25
      }
    ],
    "totalUnsettled": 25.50,
    "isSettled": false
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License 