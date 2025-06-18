import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [scoreBoard, setScoreBoard] = useState([]);
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [quizStarted, setQuizStarted] = useState(false);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isAdmin, setIsAdmin] = useState(false);

  const decodeHTML = (str) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = str;
    return textarea.value;
  };

  const shuffle = (array) => array.sort(() => Math.random() - 0.5);

  // Load previous scores
  useEffect(() => {
    const savedScores = localStorage.getItem('quizScores');
    if (savedScores) {
      setScoreBoard(JSON.parse(savedScores));
    }
  }, []);

  // Timer logic
  useEffect(() => {
    if (!quizStarted || showScore) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setShowScore(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [quizStarted, showScore]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Fetch questions when quiz starts
  useEffect(() => {
    if (!quizStarted) return;
    setLoading(true);
    
    fetch(`https://opentdb.com/api.php?amount=15&type=multiple&category=${category}&difficulty=${difficulty}`)
      .then((res) => res.json())
      .then((data) => {
        const formatted = data.results.map((q) => ({
          question: decodeHTML(q.question),
          options: shuffle([...q.incorrect_answers, q.correct_answer]),
          answer: decodeHTML(q.correct_answer),
        }));
        setQuestions(shuffle(formatted));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        alert('Failed to load questions.');
      });
  }, [quizStarted, category, difficulty]); 

  const handleAnswer = (selectedAnswer) => {
    const current = questions[index];

    const isCorrect = selectedAnswer === current.answer;
    const alreadyAnswered = userAnswers[index];

    const newAnswer = {
      question: current.question,
      correctAnswer: current.answer,
      selectedAnswer,
      isCorrect,
      options: current.options,
    };

    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = newAnswer;
    setUserAnswers(updatedAnswers);

    if (!alreadyAnswered && isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
    } else {
      const finalScore = userAnswers.filter((ans) => ans?.isCorrect).length;

      const newEntry = {
        username,
        score: finalScore,
        total: questions.length,
        date: new Date().toLocaleString(),
      };

      // Prevent duplicate usernames
      if (!scoreBoard.find((entry) => entry.username === username)) {
        const updatedBoard = [...scoreBoard, newEntry];
        setScoreBoard(updatedBoard);
        localStorage.setItem('quizScores', JSON.stringify(updatedBoard));
      }

      setScore(finalScore);
      setShowScore(true);
    }
  };

  const handleBack = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };

  const restartQuiz = () => {
    setQuestions([]);
    setIndex(0);
    setScore(0);
    setShowScore(false);
    setLoading(false);
    setCategory('');
    setDifficulty('');
    setQuizStarted(false);
    setUserAnswers([]);
    setUsername('');
    setTimeLeft(120);
  };

  const clearLeaderboard = () => {
    localStorage.removeItem('quizScores');
    setScoreBoard([]);
  };

  const sortedBoard = [...scoreBoard].sort((a, b) => b.score - a.score);

  const handleAdminClear = () => {
    
    const password = prompt('Enter admin password to clear leaderboard:');
    if (password === '@Kizito2008') {
      clearLeaderboard();
      alert('Leaderboard cleared.');
    } else {
      alert('Incorrect password. Access denied.');
    }
  };

  return (
    <div className="app">
      <h1>🧠 Chinonso's React Quiz </h1>

      {!quizStarted ? (
        <div className="setup-section">
          <label>
            Username:
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter a unique name"
            />
          </label>

          <label>
            Category:
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="9">General Knowledge</option>
              <option value="18">Computer Science</option>
              <option value="17">Science & Nature</option>
              <option value="23">History</option>
              <option value="21">Sports</option>
            </select>
          </label>

          <label>
            Difficulty:
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="">-- Select --</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <button
            onClick={() => {
              if (scoreBoard.find((entry) => entry.username === username)) {
                alert('Username already exists on leaderboard.');
              } else {
                setQuizStarted(true);
              }
            }}
            disabled={!username || !category || !difficulty}
          >
            Start Quiz
          </button>
        </div>
      ) : loading ? (
        <p>Loading questions...</p>
      ) : showScore ? (
        <div className="score-section">
          <h2>✅ Quiz Finished!</h2>
          <p> <strong>You scored {score} out of {questions.length}</strong></p>
          <button onClick={restartQuiz} className='user-button'>Restart</button>
          <button onClick={handleAdminClear} className='admin-button'>Clear Leaderboard</button>

          {sortedBoard.length > 0 && (
            <div className="leaderboard">
              <h3>🏆 Leaderboard</h3>
              <ol>
                {sortedBoard.map((entry, i) => {
                  const medals = ['🥇', '🥈', '🥉'];
                  const displayRank = i < 3 ? medals[i] : `#${i + 1}`;
    
                  return (
                    <li key={i}>
                      <strong>{displayRank} {entry.username}</strong>: {entry.score}/{entry.total}
                      <br />
                      <small>{entry.date}</small>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          <div className="review-section">
            <h3>📋 Review</h3>
            {userAnswers.map((ans, i) => (
              <div key={i} className="review-item">
                <p><strong>Q{i + 1}:</strong> {ans.question}</p>
                <p>
                  <strong>Your Answer:</strong>{' '}
                  <span style={{ color: ans.isCorrect ? 'green' : 'red' }}>{ans.selectedAnswer}</span>
                </p>
                {!ans.isCorrect && (
                  <p>
                    <strong style={{ color: 'green' }}>Correct Answer:</strong> {ans.correctAnswer}
                  </p>
                )}
                <hr />
              </div>
            ))}
          </div>
        </div>
      ) : (

        <>
          <div className="timer">⏰ Time Left: {formatTime(timeLeft)}</div>
          {questions.length > 0 && questions[index] && (
            <div className="question-section">
              <p className="progress">Question {index + 1} of {questions.length}</p>
              <h2>Q{index + 1}: {questions[index].question}</h2>
              {questions[index].options.map((option, i) => (
              <button
                key={i}
                className={
                  userAnswers[index]?.selectedAnswer === option
                  ? 'selected'
                  : ''
                }
                onClick={() => handleAnswer(option)}
              >
                {option}
              </button>
            ))}
              <div className="nav-buttons">
                <button onClick={handleBack} disabled={index === 0}>Back</button>
                <button onClick={handleNext}>Next</button>
              </div>
           </div>
         )}
       </>
      )}

        
    </div>
  );
}

export default App;
