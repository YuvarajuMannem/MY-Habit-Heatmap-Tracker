import React from 'react';
import DayCell from './DayCell';
import './HeatmapGrid.css';

function HeatmapGrid({ habitId, data, onToggleDay }) {
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    // Generate exactly 365 days of data
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const dates = generateDates();
  
  // Group dates by week for grid display
  const weeks = [];
  let currentWeek = [];
  let currentDate = new Date(dates[0]);
  
  // Adjust to start from Sunday
  const startDay = currentDate.getDay();
  for (let i = 0; i < startDay; i++) {
    currentWeek.push(null);
  }
  
  dates.forEach(date => {
    const dateObj = new Date(date);
    const dayOfWeek = dateObj.getDay();
    
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentWeek.push(date);
  });
  
  // Fill the last week
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  // Calculate intensity based on completion count
  const getIntensity = (date) => {
    if (!date || !data[date]) return 0;
    
    // Get completion count for surrounding days to determine intensity
    const dateObj = new Date(date);
    let consecutiveCount = 0;
    
    for (let i = 0; i < 5; i++) {
      const checkDate = new Date(dateObj);
      checkDate.setDate(dateObj.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      if (data[dateStr]) {
        consecutiveCount++;
      } else {
        break;
      }
    }
    
    if (consecutiveCount === 1) return 1;
    if (consecutiveCount === 2) return 2;
    if (consecutiveCount === 3) return 3;
    return 4;
  };

  // Get month labels
  const getMonthLabels = () => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    weeks.forEach((week, weekIndex) => {
      const firstValidDate = week.find(d => d !== null);
      if (firstValidDate) {
        const date = new Date(firstValidDate);
        const month = date.getMonth();
        const prevMonth = weekIndex > 0 ? 
          new Date(weeks[weekIndex - 1].find(d => d !== null) || firstValidDate).getMonth() : 
          -1;
        
        if (month !== prevMonth) {
          months.push({
            name: monthNames[month],
            weekIndex: weekIndex
          });
        }
      }
    });
    
    return months;
  };

  const monthLabels = getMonthLabels();
  const weekdays = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  return (
    <div className="heatmap-container">
      <div className="heatmap-wrapper">
        <div className="heatmap-header">
          <div className="month-labels">
            {monthLabels.map((month, index) => (
              <span 
                key={index} 
                className="month-label"
                style={{ gridColumn: `${month.weekIndex + 2} / span 4` }}
              >
                {month.name}
              </span>
            ))}
          </div>
        </div>
        
        <div className="heatmap-body">
          <div className="weekday-labels">
            {weekdays.map((day, index) => (
              <div key={index} className="weekday-label">
                {day}
              </div>
            ))}
          </div>
          
          <div className="heatmap-grid">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="heatmap-week">
                {week.map((date, dayIndex) => {
                  if (!date) {
                    return <div key={`empty-${weekIndex}-${dayIndex}`} className="day-cell empty" />;
                  }
                  
                  const dateObj = new Date(date);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isFuture = dateObj > today;
                  
                  return (
                    <DayCell
                      key={date}
                      date={date}
                      isCompleted={data[date] || false}
                      intensity={getIntensity(date)}
                      isFuture={isFuture}
                      onToggle={() => !isFuture && onToggleDay(habitId, date)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        
        <div className="heatmap-footer">
          <div className="legend">
            <span className="legend-label">Less</span>
            <div className="legend-cells">
              <div className="legend-cell intensity-0"></div>
              <div className="legend-cell intensity-1"></div>
              <div className="legend-cell intensity-2"></div>
              <div className="legend-cell intensity-3"></div>
              <div className="legend-cell intensity-4"></div>
            </div>
            <span className="legend-label">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeatmapGrid;