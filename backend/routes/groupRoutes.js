const express = require('express');
const router = express.Router();
const { createGroup, getGroups, getGroupById, joinGroup, joinGroupById, deleteGroup } = require('../controllers/groupController');
const protect = require('../middleware/authMiddleware');

// All group routes require authentication
router.use(protect);

// Group routes
router.post('/', createGroup);
router.post('/add', createGroup); // Alternative endpoint for compatibility
router.post('/join', joinGroup); // Join by invite code
router.post('/:groupId/join', joinGroupById); // Join by group ID (for deep linking)
router.get('/', getGroups);
router.get('/:id', getGroupById);
router.delete('/:id', deleteGroup);

module.exports = router;