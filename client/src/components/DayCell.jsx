import React from 'react';

function DayCell({ date, isCompleted, intensity, isFuture, onToggle }) {
  const handleClick = () => {
    if (!isFuture) {
      onToggle();
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getIntensityClass = () => {
    if (!isCompleted) return 'intensity-0';
    return `intensity-${intensity}`;
  };

  return (
    <div
      className={`day-cell ${getIntensityClass()} ${isFuture ? 'future' : ''}`}
      onClick={handleClick}
      data-tooltip={`${formatDate(date)}${isCompleted ? ' - Completed ✓' : ' - Click to mark'}`}
      role="button"
      tabIndex={isFuture ? -1 : 0}
      aria-label={`${formatDate(date)} - ${isCompleted ? 'Completed' : 'Not completed'}`}
      onKeyPress={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isFuture) {
          e.preventDefault();
          handleClick();
        }
      }}
    />
  );
}

export default DayCell;