import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getAllQuizResults, 
  getAllQuizResultsFallback,
  initDatabase 
} from '../utils/netlifyDb';
import './Results.css';

const Results = () => {
  const [results, setResults] = useState([]);
  const [expandedResult, setExpandedResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Initialize database
        await initDatabase().catch(err => console.error('Failed to initialize database:', err));
        
        // Fetch results from Netlify database
        const quizResults = await getAllQuizResults();
        setResults(quizResults);
      } catch (error) {
        console.error('Failed to fetch results from Netlify database:', error);
        
        // Fallback to localStorage
        const storedResults = await getAllQuizResultsFallback();
        setResults(storedResults);
      }
    };
    
    fetchResults();
  }, []);

  const handleClearResults = async () => {
    try {
      // In a real implementation, we would clear results from the Netlify database
      // For now, we'll just clear localStorage as a fallback
      localStorage.removeItem('quizResults');
      setResults([]);
    } catch (error) {
      console.error('Failed to clear results:', error);
      // Fallback to localStorage
      localStorage.removeItem('quizResults');
      setResults([]);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  // Toggle expanded result view
  const toggleExpandResult = (index) => {
    if (expandedResult === index) {
      setExpandedResult(null);
    } else {
      setExpandedResult(index);
    }
  };

  return (
    <div className="results-container">
      <h1>Quiz Results</h1>
      
      {results.length === 0 ? (
        <div className="no-results">
          <p>No quiz results available yet.</p>
        </div>
      ) : (
        <div className="results-list">
          <table>
            <thead>
              <tr>
                <th>Quiz Type</th>
                <th>Date</th>
                <th>Score</th>
                <th>Total Questions</th>
                <th>Participants</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <React.Fragment key={index}>
                  <tr className={expandedResult === index ? 'expanded' : ''}>
                    <td>{result.quizType === 'refresh' ? 'Refresh Quiz' : 'Final Quiz'}</td>
                    <td>{new Date(result.date).toLocaleString()}</td>
                    <td>{result.score}</td>
                    <td>{result.totalQuestions}</td>
                    <td>{result.participants ? result.participants.length : 0}</td>
                    <td>
                      <button 
                        onClick={() => toggleExpandResult(index)} 
                        className="expand-btn"
                      >
                        {expandedResult === index ? 'Hide Details' : 'Show Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedResult === index && result.participants && result.participants.length > 0 && (
                    <tr className="participant-details">
                      <td colSpan="6">
                        <div className="participants-container">
                          <h3>Participants</h3>
                          <table className="participants-table">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Joined At</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.participants.map((participant, pIndex) => (
                                <tr key={pIndex}>
                                  <td>{participant.name}</td>
                                  <td>{participant.email || '-'}</td>
                                  <td>{new Date(participant.joinedAt).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="results-buttons">
        <button onClick={handleClearResults} className="clear-btn">Clear Results</button>
        <button onClick={handleGoHome} className="home-btn">Back to Home</button>
      </div>
    </div>
  );
};

export default Results;
