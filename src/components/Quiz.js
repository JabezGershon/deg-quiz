import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { refreshQuizQuestions, finalQuizQuestions } from '../data/quizData';
import { 
  saveQuizSession, 
  saveQuizSessionFallback, 
  getQuizParticipants, 
  getQuizParticipantsFallback,
  updateParticipantStatus,
  saveQuizResults,
  saveQuizResultsFallback,
  initDatabase
} from '../utils/netlifyDb';
import './Quiz.css';

const Quiz = () => {
  const { quizType } = useParams();
  const navigate = useNavigate();
  
  // Quiz state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answerStatus, setAnswerStatus] = useState(null); // 'correct', 'incorrect', or null
  const [showQRCode, setShowQRCode] = useState(true); // Default to showing QR code at start
  const [quizId, setQuizId] = useState('');
  const [quizStarted, setQuizStarted] = useState(false); // Track if quiz has started
  const [participants, setParticipants] = useState([]);

  // Constants
  const REFRESH_QUIZ_TIME = 120; // 2 minutes in seconds
  const FINAL_QUIZ_TIME = 240; // 4 minutes in seconds

  // Initialize quiz based on type
  useEffect(() => {
    const initializeQuiz = async () => {
      if (quizType === 'refresh') {
        setQuestions([...refreshQuizQuestions]);
        setTimeLeft(REFRESH_QUIZ_TIME);
      } else if (quizType === 'final') {
        setQuestions([...finalQuizQuestions]);
        setTimeLeft(FINAL_QUIZ_TIME);
      } else {
        // Invalid quiz type, redirect to home
        navigate('/');
        return;
      }
      
      // Generate a unique quiz ID
      const newQuizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setQuizId(newQuizId);
      
      // Initialize database
      await initDatabase().catch(err => console.error('Failed to initialize database:', err));
      
      // Create active session in Netlify database
      const newSession = {
        quizId: newQuizId,
        quizType,
        createdAt: new Date().toISOString(),
        status: 'active'
      };
      
      try {
        // Try to save to Netlify database first
        await saveQuizSession(newSession);
      } catch (error) {
        console.error('Failed to save quiz session to Netlify:', error);
        // Fallback to localStorage
        saveQuizSessionFallback(newSession);
      }
    };
    
    initializeQuiz();
  }, [quizType, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0 || showScore || !quizStarted) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setShowScore(true);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, showScore]);
  
  // Check for participants periodically
  useEffect(() => {
    if (!quizId) return;
    
    // Initial check for participants
    const checkParticipants = async () => {
      try {
        // Try to get participants from Netlify database
        const quizParticipants = await getQuizParticipants(quizId);
        setParticipants(quizParticipants);
      } catch (error) {
        console.error('Failed to get participants from Netlify:', error);
        // Fallback to localStorage
        const fallbackParticipants = getQuizParticipantsFallback(quizId);
        setParticipants(fallbackParticipants);
      }
    };
    
    // Check immediately
    checkParticipants();
    
    // Then check every 5 seconds
    const participantTimer = setInterval(checkParticipants, 5000);
    
    return () => clearInterval(participantTimer);
  }, [quizId]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle answer selection
  const handleAnswerClick = (optionId) => {
    if (answerStatus !== null) return; // Prevent multiple selections while showing feedback
    
    setSelectedOption(optionId);
    
    const currentQuestion = questions[currentQuestionIndex];
    const selectedOptionObj = currentQuestion.options.find(option => option.id === optionId);
    
    if (selectedOptionObj.isCorrect) {
      setScore(prevScore => prevScore + 10);
      setAnswerStatus('correct');
    } else {
      setAnswerStatus('incorrect');
    }
    
    // Move to next question after a delay
    setTimeout(() => {
      setSelectedOption(null);
      setAnswerStatus(null);
      
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      } else {
        setShowScore(true);
      }
    }, 1500);
  };

  // Handle restart quiz
  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setScore(0);
    setShowScore(false);
    setSelectedOption(null);
    setAnswerStatus(null);
    setShowQRCode(true);
    setQuizStarted(false);
    
    // Generate a new quiz ID
    const newQuizId = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setQuizId(newQuizId);
    
    if (quizType === 'refresh') {
      setTimeLeft(REFRESH_QUIZ_TIME);
    } else {
      setTimeLeft(FINAL_QUIZ_TIME);
    }
  };

  // Return to home
  const goToHome = () => {
    navigate('/');
  };
  
  // Toggle QR code display
  const toggleQRCode = () => {
    setShowQRCode(!showQRCode);
  };
  
  // Start the quiz
  const startQuiz = async () => {
    setQuizStarted(true);
    setShowQRCode(false);
    
    try {
      // Update participant status to active in Netlify database
      for (const participant of participants) {
        await updateParticipantStatus(quizId, participant.deviceId || participant.device_id, 'active');
      }
    } catch (error) {
      console.error('Failed to update participant status in Netlify:', error);
      // Fallback to localStorage
      const allParticipants = JSON.parse(localStorage.getItem('quizParticipants')) || [];
      const updatedParticipants = allParticipants.map(p => {
        if (p.quizId === quizId) {
          return { ...p, status: 'active' };
        }
        return p;
      });
      
      localStorage.setItem('quizParticipants', JSON.stringify(updatedParticipants));
    }
  };
  
  // Save quiz results to Netlify database with participant data
  const saveResults = async () => {
    try {
      // Get participant info from Netlify database
      const quizParticipants = await getQuizParticipants(quizId);
      
      const result = {
        quizType,
        score,
        totalQuestions: questions.length,
        date: new Date().toISOString(),
        quizId,
        participants: quizParticipants.map(p => ({
          name: p.name,
          email: p.email,
          deviceId: p.device_id || p.deviceId,
          joinedAt: p.joined_at || p.joinedAt
        }))
      };
      
      // Save to Netlify database
      await saveQuizResults(result);
      
      // Update session status to completed
      const updatedSession = {
        quizId,
        quizType,
        status: 'completed',
        completedAt: new Date().toISOString()
      };
      
      await saveQuizSession(updatedSession);
      
      // Navigate to results page
      navigate('/results');
    } catch (error) {
      console.error('Failed to save results to Netlify:', error);
      
      // Fallback to localStorage
      const participants = JSON.parse(localStorage.getItem('quizParticipants')) || [];
      const quizParticipants = participants.filter(p => p.quizId === quizId);
      
      const result = {
        quizType,
        score,
        totalQuestions: questions.length,
        date: new Date().toISOString(),
        quizId,
        participants: quizParticipants.map(p => ({
          name: p.name,
          email: p.email,
          deviceId: p.deviceId,
          joinedAt: p.joinedAt
        }))
      };
      
      // Save to localStorage
      saveQuizResultsFallback(result);
      
      // Update active sessions in localStorage
      const activeSessions = JSON.parse(localStorage.getItem('activeQuizSessions')) || [];
      const sessionIndex = activeSessions.findIndex(session => session.quizId === quizId);
      
      if (sessionIndex >= 0) {
        activeSessions[sessionIndex].status = 'completed';
        activeSessions[sessionIndex].completedAt = new Date().toISOString();
        localStorage.setItem('activeQuizSessions', JSON.stringify(activeSessions));
      }
      
      // Navigate to results page
      navigate('/results');
    }
  };

  // Calculate percentage score
  const calculatePercentage = () => {
    const maxScore = questions.length * 10;
    return Math.round((score / maxScore) * 100);
  };

  // Show loading state if questions aren't loaded yet
  if (questions.length === 0) {
    return <div className="loading">Loading quiz...</div>;
  }

  return (
    <div className="quiz-container">
      {showScore ? (
        <div className="score-section">
          <h2>Quiz Complete!</h2>
          <p className="final-score">
            Your Score: {score}/{questions.length * 10} ({calculatePercentage()}%)
          </p>
          
          {showQRCode && (
            <div className="qr-code-container">
              <QRCode 
                value={`https://deg-quiz.netlify.app/join/${quizId}`} 
                size={200} 
                level="H"
              />
              <p>Scan to join this quiz session</p>
            </div>
          )}
          
          <div className="quiz-buttons">
            <button onClick={toggleQRCode}>
              {showQRCode ? 'Hide QR Code' : 'Show QR Code'}
            </button>
            <button onClick={saveResults}>Save Results</button>
            <button onClick={restartQuiz}>Restart Quiz</button>
            <button onClick={goToHome}>Go Home</button>
          </div>
        </div>
      ) : !quizStarted ? (
        <div className="quiz-intro">
          <h2>{quizType === 'refresh' ? 'Refresh Quiz' : 'Final Quiz'}</h2>
          <p>Scan the QR code below to join this quiz session:</p>
          
          <div className="qr-code-container">
            <QRCode 
              value={`https://deg-quiz.netlify.app/join/${quizId}`} 
              size={200} 
              level="H"
            />
            <p>Quiz ID: {quizId}</p>
            <p className="participant-count">
              {participants.length} {participants.length === 1 ? 'participant' : 'participants'} joined
            </p>
            {participants.length > 0 && (
              <div className="participant-list">
                {participants.map((p, index) => (
                  <span key={index} className="participant-name">{p.name}</span>
                ))}
              </div>
            )}
          </div>
          
          <div className="quiz-buttons">
            <button onClick={startQuiz} className="start-button">Start Quiz</button>
            <button onClick={goToHome}>Go Home</button>
          </div>
        </div>
      ) : (
        <>
          <div className="quiz-header">
            <div className="quiz-info">
              <span>Question {currentQuestionIndex + 1}/{questions.length}</span>
            </div>
            <div className="quiz-info">
              <span>Time: {formatTime(timeLeft)}</span>
            </div>
            <div className="quiz-info">
              <span>Score: {score}</span>
            </div>
          </div>
          
          <div className="question-section">
            <h2>{questions[currentQuestionIndex].question}</h2>
          </div>
          
          <div className="answer-section">
            {questions[currentQuestionIndex].options.map((option) => {
              let className = "answer-option";
              
              if (selectedOption === option.id) {
                className += answerStatus === 'correct' ? " correct" : " incorrect";
              }
              
              return (
                <button
                  key={option.id}
                  className={className}
                  onClick={() => handleAnswerClick(option.id)}
                  disabled={answerStatus !== null}
                >
                  {option.text}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Quiz;