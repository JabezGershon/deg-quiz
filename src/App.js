import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Quiz from './components/Quiz';
import Results from './components/Results';
import JoinQuiz from './components/JoinQuiz';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz/:quizType" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
          <Route path="/join/:quizId" element={<JoinQuiz />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
