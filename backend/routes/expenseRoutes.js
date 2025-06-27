const express = require('express');
const router = express.Router();
const {
  createExpense,
  createUnequalExpense,
  getExpensesByGroup,
  getAllExpenses,
  deleteExpense,
  updateExpense,
  getExpenseById,
} = require('../controllers/expenseController');
// router.post('/personal', createPersonalExpense);

const protect = require('../middleware/authMiddleware');

// 🔒 All routes below require the user to be authenticated
router.use(protect);

// 📥 Create Expense
router.post('/', createExpense); // general expense route
router.post('/add', createExpense); 
router.post('/unequal', createUnequalExpense); // for custom splits

// 📤 Read Expenses
router.get('/', getAllExpenses); // all expenses for the user
router.get('/group/:groupId', getExpensesByGroup); // by group
router.get('/:id', getExpenseById); // single expense

// 🔁 Update Expense
router.put('/:id', updateExpense);

// ❌ Delete Expense
router.delete('/:id', deleteExpense);

module.exports = router;
