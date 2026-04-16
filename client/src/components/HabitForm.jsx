import React, { useState } from 'react';

function HabitForm({ onAddHabit }) {
  const [habitName, setHabitName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (habitName.trim()) {
      onAddHabit(habitName);
      setHabitName('');
    }
  };

  return (
    <form className="habit-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="habit-input"
        placeholder="Enter a new habit (e.g., Coding, Gym)"
        value={habitName}
        onChange={(e) => setHabitName(e.target.value)}
        maxLength={30}
      />
      <button type="submit" className="add-btn">
        + Add Habit
      </button>
    </form>
  );
}

export default HabitForm;