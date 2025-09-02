// Import neon conditionally to handle development environment
let neon;
let sql;

try {
  // This will be properly imported in the Netlify environment
  // In development, it will fall back to localStorage
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
    const netlifyNeon = require('@netlify/neon');
    neon = netlifyNeon.neon;
    sql = neon(); // automatically uses env NETLIFY_DATABASE_URL
  } else {
    console.log('Running in development mode - using localStorage fallback');
  }
} catch (error) {
  console.error('Failed to initialize Netlify database:', error);
  // We'll use localStorage as fallback
}

/**
 * Database utility functions for Netlify integration
 */

/**
 * Create tables if they don't exist
 */
export const initDatabase = async () => {
  // If sql is not defined (development environment or import failed), use localStorage fallback
  if (!sql) {
    console.log('Using localStorage fallback for database operations');
    return true;
  }
  
  try {
    // Create participants table
    await sql`
      CREATE TABLE IF NOT EXISTS participants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        device_id VARCHAR(255) NOT NULL,
        quiz_id VARCHAR(255) NOT NULL,
        joined_at TIMESTAMP NOT NULL,
        browser VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create quiz_sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_sessions (
        id SERIAL PRIMARY KEY,
        quiz_id VARCHAR(255) NOT NULL UNIQUE,
        quiz_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL,
        completed_at TIMESTAMP
      )
    `;

    // Create quiz_results table
    await sql`
      CREATE TABLE IF NOT EXISTS quiz_results (
        id SERIAL PRIMARY KEY,
        quiz_id VARCHAR(255) NOT NULL UNIQUE,
        quiz_type VARCHAR(50) NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    // Fall back to localStorage
    return true;
  }
};

/**
 * Save a participant to the database
 */
export const saveParticipant = async (participant) => {
  // If sql is not defined (development environment or import failed), use localStorage fallback
  if (!sql) {
    return saveParticipantFallback(participant);
  }
  
  try {
    const result = await sql`
      INSERT INTO participants (
        name, email, device_id, quiz_id, joined_at, browser, status
      ) VALUES (
        ${participant.name},
        ${participant.email || null},
        ${participant.deviceId},
        ${participant.quizId},
        ${participant.joinedAt},
        ${participant.browser},
        ${participant.status}
      )
      RETURNING id
    `;
    return result[0]?.id;
  } catch (error) {
    console.error('Error saving participant:', error);
    return saveParticipantFallback(participant); // Fallback to localStorage
  }
};

/**
 * Update participant status
 */
export const updateParticipantStatus = async (quizId, deviceId, status) => {
  // If sql is not defined (development environment or import failed), use localStorage fallback
  if (!sql) {
    return updateParticipantStatusFallback(quizId, deviceId, status);
  }
  
  try {
    await sql`
      UPDATE participants
      SET status = ${status}
      WHERE quiz_id = ${quizId} AND device_id = ${deviceId}
    `;
    return true;
  } catch (error) {
    console.error('Error updating participant status:', error);
    return updateParticipantStatusFallback(quizId, deviceId, status); // Fallback to localStorage
  }
};

/**
 * Get participants for a quiz
 */
export const getQuizParticipants = async (quizId) => {
  // If sql is not defined (development environment or import failed), use localStorage fallback
  if (!sql) {
    return getQuizParticipantsFallback(quizId);
  }
  
  try {
    const participants = await sql`
      SELECT * FROM participants
      WHERE quiz_id = ${quizId}
      ORDER BY joined_at ASC
    `;
    return participants;
  } catch (error) {
    console.error('Error getting quiz participants:', error);
    return getQuizParticipantsFallback(quizId); // Fallback to localStorage
  }
};

/**
 * Save a quiz session
 */
export const saveQuizSession = async (session) => {
  // If sql is not defined (development environment or import failed), use localStorage fallback
  if (!sql) {
    return saveQuizSessionFallback(session);
  }
  
  try {
    const result = await sql`
      INSERT INTO quiz_sessions (
        quiz_id, quiz_type, created_at, status
      ) VALUES (
        ${session.quizId},
        ${session.quizType},
        ${session.createdAt},
        ${session.status}
      )
      ON CONFLICT (quiz_id) 
      DO UPDATE SET
        status = ${session.status},
        completed_at = ${session.completedAt || null}
      RETURNING id
    `;
    return result[0]?.id;
  } catch (error) {
    console.error('Error saving quiz session:', error);
    return saveQuizSessionFallback(session); // Fallback to localStorage
  }
};

/**
 * Save quiz results
 */
export const saveQuizResults = async (result) => {
  // If sql is not defined (development environment or import failed), use localStorage fallback
  if (!sql) {
    return saveQuizResultsFallback(result);
  }
  
  try {
    await sql`
      INSERT INTO quiz_results (
        quiz_id, quiz_type, score, total_questions, date
      ) VALUES (
        ${result.quizId},
        ${result.quizType},
        ${result.score},
        ${result.totalQuestions},
        ${result.date}
      )
      ON CONFLICT (quiz_id) 
      DO UPDATE SET
        score = ${result.score},
        date = ${result.date}
    `;
    return true;
  } catch (error) {
    console.error('Error saving quiz results:', error);
    return saveQuizResultsFallback(result); // Fallback to localStorage
  }
};

/**
 * Get all quiz results
 */
export const getAllQuizResults = async () => {
  // If sql is not defined (development environment or import failed), use localStorage fallback
  if (!sql) {
    return getAllQuizResultsFallback();
  }
  
  try {
    const results = await sql`
      SELECT r.*, 
        (SELECT json_agg(p.*) FROM participants p WHERE p.quiz_id = r.quiz_id) as participants
      FROM quiz_results r
      ORDER BY r.date DESC
    `;
    return results;
  } catch (error) {
    console.error('Error getting quiz results:', error);
    return getAllQuizResultsFallback(); // Fallback to localStorage
  }
};

/**
 * Fallback functions that use localStorage when database operations fail
 */

// Fallback for saving participant
export const saveParticipantFallback = (participant) => {
  try {
    const participants = JSON.parse(localStorage.getItem('quizParticipants')) || [];
    
    // Remove any previous entries for this participant in this quiz
    const filteredParticipants = participants.filter(
      p => !(p.quizId === participant.quizId && p.deviceId === participant.deviceId)
    );
    
    // Add the new participant entry
    localStorage.setItem('quizParticipants', 
      JSON.stringify([...filteredParticipants, participant])
    );
    
    return true;
  } catch (error) {
    console.error('Error in fallback save participant:', error);
    return false;
  }
};

// Fallback for getting participants
export const getQuizParticipantsFallback = (quizId) => {
  try {
    const participants = JSON.parse(localStorage.getItem('quizParticipants')) || [];
    return participants.filter(p => p.quizId === quizId);
  } catch (error) {
    console.error('Error in fallback get participants:', error);
    return [];
  }
};

// Fallback for updating participant status
export const updateParticipantStatusFallback = (quizId, deviceId, status) => {
  try {
    const participants = JSON.parse(localStorage.getItem('quizParticipants')) || [];
    const updatedParticipants = participants.map(p => {
      if (p.quizId === quizId && p.deviceId === deviceId) {
        return { ...p, status };
      }
      return p;
    });
    
    localStorage.setItem('quizParticipants', JSON.stringify(updatedParticipants));
    return true;
  } catch (error) {
    console.error('Error in fallback update participant status:', error);
    return false;
  }
};

// Fallback for saving quiz session
export const saveQuizSessionFallback = (session) => {
  try {
    const activeSessions = JSON.parse(localStorage.getItem('activeQuizSessions')) || [];
    const sessionIndex = activeSessions.findIndex(s => s.quizId === session.quizId);
    
    if (sessionIndex >= 0) {
      activeSessions[sessionIndex] = session;
    } else {
      activeSessions.push(session);
    }
    
    localStorage.setItem('activeQuizSessions', JSON.stringify(activeSessions));
    return true;
  } catch (error) {
    console.error('Error in fallback save quiz session:', error);
    return false;
  }
};

// Fallback for saving quiz results
export const saveQuizResultsFallback = (result) => {
  try {
    const existingResults = JSON.parse(localStorage.getItem('quizResults')) || [];
    const resultIndex = existingResults.findIndex(r => r.quizId === result.quizId);
    
    if (resultIndex >= 0) {
      existingResults[resultIndex] = result;
    } else {
      existingResults.push(result);
    }
    
    localStorage.setItem('quizResults', JSON.stringify(existingResults));
    return true;
  } catch (error) {
    console.error('Error in fallback save quiz results:', error);
    return false;
  }
};

// Fallback for getting all quiz results
export const getAllQuizResultsFallback = () => {
  try {
    return JSON.parse(localStorage.getItem('quizResults')) || [];
  } catch (error) {
    console.error('Error in fallback get all quiz results:', error);
    return [];
  }
};
