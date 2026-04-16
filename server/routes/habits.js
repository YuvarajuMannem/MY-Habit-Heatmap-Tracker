const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Habit = require('../models/Habit');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all habits for user
router.get('/', async (req, res) => {
  try {
    const habits = await Habit.find({ userId: req.userId }).sort('-createdAt');
    res.json(habits);
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new habit
router.post('/', [
  body('name').trim().notEmpty().withMessage('Habit name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    // Check if habit already exists for this user
    const existingHabit = await Habit.findOne({ userId: req.userId, name });
    if (existingHabit) {
      return res.status(400).json({ message: 'Habit already exists' });
    }

    const habit = new Habit({
      userId: req.userId,
      name
    });

    await habit.save();
    res.status(201).json(habit);
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update habit completion
router.put('/:habitId/toggle/:date', async (req, res) => {
  try {
    const { habitId, date } = req.params;
    
    const habit = await Habit.findOne({ _id: habitId, userId: req.userId });
    if (!habit) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    // Toggle the completion status for the date
    const currentStatus = habit.data.get(date) || false;
    habit.data.set(date, !currentStatus);
    
    await habit.save();
    res.json(habit);
  } catch (error) {
    console.error('Toggle habit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete habit (with password verification)
router.delete('/:habitId', [
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { habitId } = req.params;
    const { password } = req.body;

    // Verify user password
    const user = await User.findById(req.userId);
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Delete the habit
    const result = await Habit.findOneAndDelete({ 
      _id: habitId, 
      userId: req.userId 
    });

    if (!result) {
      return res.status(404).json({ message: 'Habit not found' });
    }

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;