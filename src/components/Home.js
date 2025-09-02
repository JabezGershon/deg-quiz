import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const startRefreshQuiz = () => {
    navigate('/quiz/refresh');
  };

  const startFinalQuiz = () => {
    navigate('/quiz/final');
  };

  const viewResults = () => {
    navigate('/results');
  };

  return (
    <div className="home-container">
      <h1>Interactive Quiz</h1>
      <button 
        className="quiz-button refresh-button" 
        onClick={startRefreshQuiz}
      >
        Refresh Quiz (2 min)
      </button>
      <button 
        className="quiz-button final-button" 
        onClick={startFinalQuiz}
      >
        Final Quiz (4 min)
      </button>
      <button 
        className="quiz-button results-button" 
        onClick={viewResults}
      >
        Results
      </button>
    </div>
  );
};

export default Home;