import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  saveParticipant, 
  saveParticipantFallback,
  initDatabase 
} from '../utils/netlifyDb';
import './JoinQuiz.css';

const JoinQuiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');
  const [quizInfo, setQuizInfo] = useState(null);

  useEffect(() => {
    const checkQuizAndParticipant = async () => {
      // Initialize database
      await initDatabase().catch(err => console.error('Failed to initialize database:', err));
      
      // Validate quiz ID
      if (!quizId) {
        setError('Invalid quiz session');
        return;
      }
      
      try {
        // Check if quiz exists in Netlify database
        // This would typically be a database query
        // For now, we'll still use localStorage as a fallback
        const existingResults = JSON.parse(localStorage.getItem('quizResults')) || [];
        const quizExists = existingResults.some(result => result.quizId === quizId);
        
        if (!quizExists) {
          // Try to find quiz in active sessions
          const activeSessions = JSON.parse(localStorage.getItem('activeQuizSessions')) || [];
          const activeQuiz = activeSessions.find(session => session.quizId === quizId);
          
          if (activeQuiz) {
            setQuizInfo(activeQuiz);
          } else {
            setError('Quiz session not found or has expired');
          }
        }
        
        // Check if user has already joined this quiz
        // This would be a database query in a real implementation
        const participants = JSON.parse(localStorage.getItem('quizParticipants')) || [];
        const alreadyJoined = participants.some(p => p.quizId === quizId && p.deviceId === getDeviceId());
        
        if (alreadyJoined) {
          const participant = participants.find(p => p.quizId === quizId && p.deviceId === getDeviceId());
          setName(participant.name);
          setEmail(participant.email || '');
          setJoined(true);
        }
      } catch (error) {
        console.error('Error checking quiz and participant:', error);
        setError('Error connecting to quiz database. Please try again.');
      }
    };
    
    checkQuizAndParticipant();
  }, [quizId]);

  // Generate or retrieve a unique device ID
  const getDeviceId = () => {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    try {
      // Create participant object
      const participant = {
        name,
        email: email.trim() || null,
        quizId,
        deviceId: getDeviceId(),
        joinedAt: new Date().toISOString(),
        browser: navigator.userAgent,
        status: 'joined' // joined, active, completed
      };
      
      // Save to Netlify database
      await saveParticipant(participant);
      
      // Update UI
      setJoined(true);
      setError('');
    } catch (error) {
      console.error('Failed to save participant to Netlify:', error);
      
      // Fallback to localStorage
      const participant = {
        name,
        email: email.trim() || null,
        quizId,
        deviceId: getDeviceId(),
        joinedAt: new Date().toISOString(),
        browser: navigator.userAgent,
        status: 'joined' // joined, active, completed
      };
      
      saveParticipantFallback(participant);
      
      // Update UI
      setJoined(true);
      setError('');
    }
    
    // Update active sessions (fallback)
    const activeSessions = JSON.parse(localStorage.getItem('activeQuizSessions')) || [];
    if (!activeSessions.some(session => session.quizId === quizId)) {
      // Add this quiz to active sessions if not already there
      const newSession = {
        quizId,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      localStorage.setItem('activeQuizSessions', 
        JSON.stringify([...activeSessions, newSession])
      );
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="join-container">
      <h1>Join Quiz Session</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {!joined ? (
        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email (Optional)</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
          
          <div className="quiz-info">
            <p>Quiz ID: {quizId}</p>
            {quizInfo && (
              <p>Quiz Type: {quizInfo.quizType || 'Standard'}</p>
            )}
          </div>
          
          <div className="form-buttons">
            <button type="submit" className="join-button">Join Quiz</button>
            <button type="button" onClick={handleGoHome} className="home-button">Back to Home</button>
          </div>
        </form>
      ) : (
        <div className="joined-message">
          <h2>Successfully Joined!</h2>
          <p>Welcome, {name}!</p>
          <p>You have joined quiz session: {quizId}</p>
          <p>Wait for the quiz host to start the session.</p>
          <p className="device-id">Your Device ID: {getDeviceId().substring(0, 8)}...</p>
          
          <button onClick={handleGoHome} className="home-button">Back to Home</button>
        </div>
      )}
    </div>
  );
};

export default JoinQuiz;