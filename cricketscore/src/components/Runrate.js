// CricketRunRateCalculator.jsx
import React, { useState, useEffect } from 'react';
import './Runrate.css';

const CricketRunRateCalculator = () => {
  // Initialize state with localStorage values if available
  const [currentScore, setCurrentScore] = useState(() => 
    parseInt(localStorage.getItem('cricket_score')) || 0);
  const [targetScore, setTargetScore] = useState(() => 
    parseInt(localStorage.getItem('cricket_target')) || 0);
  const [overs, setOvers] = useState(() => 
    parseInt(localStorage.getItem('cricket_overs')) || 0);
  const [balls, setBalls] = useState(() => 
    parseInt(localStorage.getItem('cricket_balls')) || 0);
  const [totalOvers, setTotalOvers] = useState(() => 
    parseInt(localStorage.getItem('cricket_totalOvers')) || 20);
  const [history, setHistory] = useState(() => 
    JSON.parse(localStorage.getItem('cricket_history')) || []);
  const [lastOver, setLastOver] = useState(() => 
    JSON.parse(localStorage.getItem('cricket_lastOver')) || []);
  const [wickets, setWickets] = useState(() => 
    parseInt(localStorage.getItem('cricket_wickets')) || 0);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState({
    currentScore: 0,
    overs: 0,
    balls: 0,
    wickets: 0
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('cricket_score', currentScore);
    localStorage.setItem('cricket_target', targetScore);
    localStorage.setItem('cricket_overs', overs);
    localStorage.setItem('cricket_balls', balls);
    localStorage.setItem('cricket_totalOvers', totalOvers);
    localStorage.setItem('cricket_history', JSON.stringify(history));
    localStorage.setItem('cricket_lastOver', JSON.stringify(lastOver));
    localStorage.setItem('cricket_wickets', wickets);
  }, [currentScore, targetScore, overs, balls, totalOvers, history, lastOver, wickets]);
  
  // Calculate current run rate
  const calculateRunRate = () => {
    const totalBalls = overs * 6 + balls;
    const totalOversFloat = totalBalls / 6;
    return totalOversFloat > 0 ? (currentScore / totalOversFloat).toFixed(2) : '0.00';
  };
  
  // Calculate required run rate
  const calculateRequiredRunRate = () => {
    if (!targetScore) return '0.00';
    
    const remainingRuns = targetScore - currentScore;
    if (remainingRuns <= 0) return '0.00';
    
    const ballsBowled = overs * 6 + balls;
    const ballsRemaining = totalOvers * 6 - ballsBowled;
    const oversRemaining = ballsRemaining / 6;
    
    return oversRemaining > 0 ? (remainingRuns / oversRemaining).toFixed(2) : 'N/A';
  };
  
  // Revert last action
  const revertLastAction = () => {
    if (history.length === 0) return;
    
    // Remove last event from history
    const newHistory = [...history];
    const lastEvent = newHistory.pop();
    setHistory(newHistory);
    
    // Update score based on what was reverted
    if (lastEvent === 'W') {
      setWickets(prev => Math.max(prev - 1, 0));
    } else if (lastEvent === 'WD' || lastEvent === 'NB') {
      setCurrentScore(prev => Math.max(prev - 1, 0));
    } else {
      setCurrentScore(prev => Math.max(prev - parseInt(lastEvent || 0), 0));
    }
    
    // Update last over
    const newLastOver = [...lastOver];
    if (newLastOver.length > 0) {
      newLastOver.pop();
      setLastOver(newLastOver);
    } else {
      // We need to reconstruct the last over from history
      const prevOverBalls = newHistory.slice(-6);
      setLastOver(prevOverBalls);
    }
    
    // Adjust the ball/over count
    if (lastEvent !== 'WD' && lastEvent !== 'NB') {
      if (balls === 0 && overs > 0) {
        setOvers(prev => prev - 1);
        setBalls(5);
      } else if (balls > 0) {
        setBalls(prev => prev - 1);
      }
    }
  };
  
  // Update score and advance ball count
  const updateScore = (runs, isBoundary = false, isExtra = false) => {
    setCurrentScore(prev => prev + runs);
    
    // Add to history
    const eventType = 
      isExtra === 'wide' ? 'WD' : 
      isExtra === 'noBall' ? 'NB' : 
      isBoundary ? (runs === 4 ? '4' : '6') : 
      runs.toString();
    
    setHistory(prev => [...prev, eventType]);
    setLastOver(prev => [...prev, eventType]);
    
    // Don't advance ball for extras
    if (!isExtra) {
      const newBalls = balls + 1;
      if (newBalls === 6) {
        setOvers(prev => prev + 1);
        setBalls(0);
        setLastOver([]);
      } else {
        setBalls(newBalls);
      }
    }
  };
  
  const handleWide = () => {
    updateScore(1, false, 'wide');
  };
  
  const handleNoBall = () => {
    updateScore(1, false, 'noBall');
  };
  
  const handleWicket = () => {
    setWickets(prev => Math.min(prev + 1, 10));
    
    // Advance the ball
    const newBalls = balls + 1;
    if (newBalls === 6) {
      setOvers(prev => prev + 1);
      setBalls(0);
      setLastOver([]);
    } else {
      setBalls(newBalls);
    }
    
    // Add to history
    setHistory(prev => [...prev, 'W']);
    setLastOver(prev => [...prev, 'W']);
  };
  
  const resetMatch = () => {
    
      setCurrentScore(0);
      setOvers(0);
      setBalls(0);
      setHistory([]);
      setLastOver([]);
      setWickets(0);
    
  };
  
  const enterEditMode = () => {
    setEditValues({
      currentScore,
      overs,
      balls,
      wickets
    });
    setEditMode(true);
  };
  
  const saveEditValues = () => {
    setCurrentScore(parseInt(editValues.currentScore) || 0);
    setOvers(parseInt(editValues.overs) || 0);
    setBalls(parseInt(editValues.balls) || 0);
    setWickets(parseInt(editValues.wickets) || 0);
    setEditMode(false);
  };
  
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Calculate balls remaining
  const ballsRemaining = (totalOvers * 6) - (overs * 6 + balls);
  const oversRemaining = (ballsRemaining / 6).toFixed(1);
  
  // Calculate if the batting team is winning
  const getMatchStatus = () => {
    if (!targetScore) return "First Innings";
    
    const runsNeeded = targetScore - currentScore;
    if (runsNeeded <= 0) return "Victory!";
    if (wickets >= 10 || ballsRemaining <= 0) return "Defeat";
    
    return `Need ${runsNeeded} runs from ${ballsRemaining} balls`;
  };
  
  return (
    <div className="cricket-calculator">
      <div className="scoreboard">
        <div className="main-score">
          <h1>{currentScore}/{wickets}</h1>
          <div className="overs-display">
            <h2>{overs}.{balls} overs</h2>
            <button className="edit-btn" onClick={enterEditMode}>
              <span role="img" aria-label="edit">✏️</span>
            </button>
          </div>
        </div>
        
        <div className="target-info">
          {targetScore > 0 && (
            <h3>Target: {targetScore}</h3>
          )}
          <div className="run-rates">
            <p>CRR: <span className="highlight">{calculateRunRate()}</span></p>
            {targetScore > 0 && (
              <p>RRR: <span className={calculateRequiredRunRate() > 12 ? "danger" : calculateRequiredRunRate() > 9 ? "warning" : "success"}>
                {calculateRequiredRunRate()}
              </span></p>
            )}
          </div>
        </div>
        
        <div className="match-status">
          <p>{getMatchStatus()}</p>
          {ballsRemaining > 0 && targetScore > 0 && (
            <p className="overs-remaining">{oversRemaining} overs remaining</p>
          )}
        </div>
      </div>
      
      {editMode ? (
        <div className="edit-panel">
          <h3>Update Score Manually</h3>
          <div className="edit-form">
            <div className="edit-field">
              <label>Runs:</label>
              <input 
                type="number" 
                name="currentScore"
                value={editValues.currentScore}
                onChange={handleEditChange}
              />
            </div>
            <div className="edit-field">
              <label>Overs:</label>
              <input 
                type="number" 
                name="overs"
                value={editValues.overs}
                onChange={handleEditChange}
                max={totalOvers - 1}
              />
            </div>
            <div className="edit-field">
              <label>Balls:</label>
              <input 
                type="number" 
                name="balls"
                value={editValues.balls}
                onChange={handleEditChange}
                min={0}
                max={5}
              />
            </div>
            <div className="edit-field">
              <label>Wickets:</label>
              <input 
                type="number" 
                name="wickets"
                value={editValues.wickets}
                onChange={handleEditChange}
                min={0}
                max={10}
              />
            </div>
          </div>
          <div className="edit-actions">
            <button className="cancel-btn" onClick={() => setEditMode(false)}>Cancel</button>
            <button className="save-btn" onClick={saveEditValues}>Save</button>
          </div>
        </div>
      ) : (
        <>
          <div className="last-over">
            <div className="over-header">
              <h3>Current Over</h3>
              <button 
                className="undo-btn" 
                onClick={revertLastAction}
                disabled={history.length === 0}
              >
                <span role="img" aria-label="undo">↩️</span> Undo
              </button>
            </div>
            <div className="balls-container">
              {lastOver.length === 0 ? 
                <p className="empty-over">New over</p> : 
                lastOver.map((ball, idx) => (
                  <span 
                    key={idx} 
                    className={`ball-result ${
                      ball === 'W' ? 'wicket' : 
                      ball === '4' || ball === '6' ? 'boundary' :
                      ball === 'WD' || ball === 'NB' ? 'extra' : ''
                    }`}
                  >
                    {ball}
                  </span>
                ))
              }
            </div>
          </div>
          
          <div className="settings-panel">
            <div className="input-group">
              <label>Overs:</label>
              <select
                value={totalOvers}
                onChange={(e) => setTotalOvers(parseInt(e.target.value))}
              >
                <option value="5">5 (T5)</option>
                <option value="10">10 (T10)</option>
                <option value="20">20 (T20)</option>
                <option value="50">50 (ODI)</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Target:</label>
              <input 
                type="number" 
                min="0" 
                value={targetScore} 
                onChange={(e) => setTargetScore(parseInt(e.target.value) || 0)}
              />
            </div>
            
            <button className="reset-btn" onClick={resetMatch}>
              Reset Match
            </button>
          </div>
          
          <div className="run-buttons">
            <div className="normal-runs">
              {[0, 1, 2, 3, 4, 5, 6].map(runs => (
                <button
                  key={runs}
                  className={`run-btn ${runs === 4 || runs === 6 ? 'boundary-btn' : ''}`}
                  onClick={() => updateScore(runs, runs === 4 || runs === 6)}
                >
                  {runs}
                </button>
              ))}
            </div>
            
            <div className="special-buttons">
              <button className="extra-btn wide-btn" onClick={handleWide}>
                Wide
              </button>
              <button className="extra-btn no-ball-btn" onClick={handleNoBall}>
                No Ball
              </button>
              <button className="wicket-btn" onClick={handleWicket}>
                Wicket
              </button>
            </div>
          </div>
          
          <div className="match-history">
            <h3>Match Events</h3>
            <div className="history-container">
              {history.length === 0 ? (
                <p className="empty-history">No events yet</p>
              ) : (
                <div className="history-balls">
                  {history.map((event, idx) => (
                    <span 
                      key={idx} 
                      className={`history-ball ${
                        event === 'W' ? 'wicket' : 
                        event === '4' || event === '6' ? 'boundary' :
                        event === 'WD' || event === 'NB' ? 'extra' : ''
                      }`}
                    >
                      {event}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CricketRunRateCalculator;