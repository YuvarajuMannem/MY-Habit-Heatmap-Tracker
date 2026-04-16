import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import HeatmapGrid from './components/HeatmapGrid';
import HabitForm from './components/HabitForm';
import DeleteConfirmation from './components/DeleteConfirmation';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || '';

const mapToObject = (map) => {
  if (!map) return {};
  if (map instanceof Map) return Object.fromEntries(map);
  if (typeof map === 'object' && !Array.isArray(map)) return map;
  return {};
};

const getCompletedCount = (habitData) => {
  const dataObj = mapToObject(habitData);
  return Object.values(dataObj).filter(v => v === true).length;
};

function AppContent() {
  const [habits, setHabits] = useState([]);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [todayStatus, setTodayStatus] = useState({});
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchHabits = async () => {
      if (!isAuthenticated) {
        setLoadingHabits(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/api/habits`);
        setHabits(response.data);
        if (response.data.length > 0 && !selectedHabit) {
          setSelectedHabit(response.data[0]._id);
        }
        
        const todayMap = {};
        response.data.forEach(habit => {
          const dataObj = mapToObject(habit.data);
          todayMap[habit._id] = dataObj[today] || false;
        });
        setTodayStatus(todayMap);
      } catch (error) {
        console.error('Failed to fetch habits:', error);
        if (error.response?.status === 401) logout();
      } finally {
        setLoadingHabits(false);
      }
    };

    fetchHabits();
  }, [isAuthenticated, logout, selectedHabit, today]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const addHabit = async (habitName) => {
    if (!habitName.trim()) return;
    try {
      const response = await axios.post(`${API_URL}/api/habits`, { name: habitName });
      const newHabit = response.data;
      setHabits([...habits, newHabit]);
      setSelectedHabit(newHabit._id);
      setTodayStatus(prev => ({ ...prev, [newHabit._id]: false }));
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add habit');
    }
  };

  const confirmDeleteHabit = (habitId) => {
    const habit = habits.find(h => h._id === habitId);
    setHabitToDelete(habit);
    setDeleteModalOpen(true);
  };

  const deleteHabit = async (password) => {
    if (!habitToDelete) return;
    try {
      await axios.delete(`${API_URL}/api/habits/${habitToDelete._id}`, { data: { password } });
      setHabits(habits.filter(h => h._id !== habitToDelete._id));
      if (selectedHabit === habitToDelete._id) {
        setSelectedHabit(habits.length > 1 ? habits[0]._id : null);
      }
      setDeleteModalOpen(false);
      setHabitToDelete(null);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete habit');
    }
  };

  const toggleToday = async (habitId) => {
    try {
      const response = await axios.put(`${API_URL}/api/habits/${habitId}/toggle/${today}`);
      const updatedHabit = response.data;
      
      setHabits(habits.map(habit => 
        habit._id === habitId ? updatedHabit : habit
      ));
      
      const newStatus = !todayStatus[habitId];
      setTodayStatus(prev => ({ ...prev, [habitId]: newStatus }));
      
      if (newStatus) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 2000);
      }
    } catch (error) {
      console.error('Failed to toggle day:', error);
    }
  };

  const toggleDay = async (habitId, date) => {
    try {
      const response = await axios.put(`${API_URL}/api/habits/${habitId}/toggle/${date}`);
      const updatedHabit = response.data;
      
      setHabits(habits.map(habit => 
        habit._id === habitId ? updatedHabit : habit
      ));
      
      if (date === today) {
        setTodayStatus(prev => ({ ...prev, [habitId]: !prev[habitId] }));
      }
    } catch (error) {
      console.error('Failed to toggle day:', error);
    }
  };

  const generateDates = (days) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const calculateTodayStreak = (habitData) => {
    const dataObj = mapToObject(habitData);
    let streak = 0;
    let currentDate = new Date();
    
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (dataObj[dateStr]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const calculateWeeklyPercentage = (habitData) => {
    const dates = generateDates(7);
    const dataObj = mapToObject(habitData);
    const completed = dates.filter(date => dataObj[date]).length;
    return Math.round((completed / 7) * 100);
  };

  const getMotivationMessage = (streak) => {
    if (streak === 0) return "Start your streak today!";
    if (streak < 3) return "Great start! Keep going!";
    if (streak < 7) return "You're on fire! 🔥";
    if (streak < 14) return "Amazing consistency! ⚡";
    if (streak < 30) return "Legendary streak! 🏆";
    return "You're unstoppable! 👑";
  };

  const currentHabit = habits.find(h => h._id === selectedHabit);
  const todayStreak = currentHabit ? calculateTodayStreak(currentHabit.data) : 0;

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : 'light'}`}>
      {showConfetti && (
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div key={i} className="confetti" style={{
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 0.5 + 's',
              backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`
            }} />
          ))}
        </div>
      )}
      
      <div className="container">
        <header className="header">
          <div className="header-left">
            <h1>
              <span className="logo-icon">✨</span>
              MYhabitTracker
            </h1>
            {user && (
              <div className="user-profile">
                <div className="user-avatar">{user.name[0].toUpperCase()}</div>
                <span className="user-name">{user.name}</span>
              </div>
            )}
          </div>
          <div className="header-actions">
            <button 
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="logout-btn" onClick={logout}>
              <span>Sign Out</span>
            </button>
          </div>
        </header>

        <HabitForm onAddHabit={addHabit} />

        {loadingHabits ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : habits.length > 0 ? (
          <>
            <div className="habits-navigation">
              {habits.map(habit => (
                <button
                  key={habit._id}
                  className={`habit-tab ${selectedHabit === habit._id ? 'active' : ''}`}
                  onClick={() => setSelectedHabit(habit._id)}
                >
                  <span className="habit-icon">
                    {habit.name.toLowerCase().includes('gym') ? '💪' :
                     habit.name.toLowerCase().includes('code') ? '💻' :
                     habit.name.toLowerCase().includes('read') ? '📚' :
                     habit.name.toLowerCase().includes('med') ? '🧘' : '🎯'}
                  </span>
                  {habit.name}
                  {todayStatus[habit._id] && <span className="today-check">✓</span>}
                  <span 
                    className="delete-habit"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDeleteHabit(habit._id);
                    }}
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>

            {currentHabit && (
              <>
                <div className="today-spotlight">
                  <div className="spotlight-content">
                    <div className="spotlight-left">
                      <h2>Today's Mission</h2>
                      <div className="habit-focus">
                        <span className="habit-icon-large">
                          {currentHabit.name.toLowerCase().includes('gym') ? '💪' :
                           currentHabit.name.toLowerCase().includes('code') ? '💻' :
                           currentHabit.name.toLowerCase().includes('read') ? '📚' :
                           currentHabit.name.toLowerCase().includes('med') ? '🧘' : '🎯'}
                        </span>
                        <div>
                          <h3>{currentHabit.name}</h3>
                          <p className="streak-message">{getMotivationMessage(todayStreak)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="spotlight-right">
                      <button
                        className={`today-action-btn ${todayStatus[currentHabit._id] ? 'completed' : ''}`}
                        onClick={() => toggleToday(currentHabit._id)}
                      >
                        {todayStatus[currentHabit._id] ? (
                          <>
                            <span>✓ Completed</span>
                            <small>Great job!</small>
                          </>
                        ) : (
                          <>
                            <span>Mark as Done</span>
                            <small>Keep your streak alive!</small>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="stats-dashboard">
                  <div className="stat-card primary">
                    <div className="stat-icon">🔥</div>
                    <div className="stat-info">
                      <div className="stat-label">Current Streak</div>
                      <div className="stat-value">{todayStreak} {todayStreak === 1 ? 'day' : 'days'}</div>
                    </div>
                  </div>
                  <div className="stat-card secondary">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                      <div className="stat-label">This Week</div>
                      <div className="stat-value">{calculateWeeklyPercentage(currentHabit.data)}%</div>
                    </div>
                  </div>
                  <div className="stat-card tertiary">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                      <div className="stat-label">Total Done</div>
                      <div className="stat-value">{getCompletedCount(currentHabit.data)}</div>
                    </div>
                  </div>
                </div>

                <div className="heatmap-section">
                  <h3>Your Journey</h3>
                  <HeatmapGrid
                    habitId={currentHabit._id}
                    data={mapToObject(currentHabit.data)}
                    onToggleDay={toggleDay}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h3>Start Your Journey</h3>
            <p>Add your first habit to begin tracking your progress!</p>
            <div className="habit-suggestions">
              <span>Try:</span>
              <button onClick={() => addHabit('Gym')}>💪 Gym</button>
              <button onClick={() => addHabit('Coding')}>💻 Coding</button>
              <button onClick={() => addHabit('Reading')}>📚 Reading</button>
            </div>
          </div>
        )}

        {deleteModalOpen && (
          <DeleteConfirmation
            habitName={habitToDelete?.name}
            onConfirm={deleteHabit}
            onCancel={() => {
              setDeleteModalOpen(false);
              setHabitToDelete(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;