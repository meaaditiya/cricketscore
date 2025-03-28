import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Undo2, Edit2, RefreshCw, ChevronRight } from 'lucide-react';
import './Runrate.css';

const CricketRunRateCalculator = () => {
  // State initialization with localStorage
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
  const [overStats, setOverStats] = useState(() => 
    JSON.parse(localStorage.getItem('cricket_overStats')) || []);
  const [editValues, setEditValues] = useState({
    currentScore: 0,
    overs: 0,
    balls: 0,
    wickets: 0
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem('cricket_score', currentScore);
    localStorage.setItem('cricket_target', targetScore);
    localStorage.setItem('cricket_overs', overs);
    localStorage.setItem('cricket_balls', balls);
    localStorage.setItem('cricket_totalOvers', totalOvers);
    localStorage.setItem('cricket_history', JSON.stringify(history));
    localStorage.setItem('cricket_lastOver', JSON.stringify(lastOver));
    localStorage.setItem('cricket_wickets', wickets);
    localStorage.setItem('cricket_overStats', JSON.stringify(overStats));
  }, [currentScore, targetScore, overs, balls, totalOvers, history, lastOver, wickets, overStats]);

  // Enhanced calculations and statistics
  const calculateRunRate = () => {
    const totalBalls = overs * 6 + balls;
    const totalOversFloat = totalBalls / 6;
    return totalOversFloat > 0 ? (currentScore / totalOversFloat).toFixed(2) : '0.00';
  };

  const calculateRequiredRunRate = () => {
    if (!targetScore) return '0.00';
    
    const remainingRuns = targetScore - currentScore;
    if (remainingRuns <= 0) return '0.00';
    
    const ballsBowled = overs * 6 + balls;
    const ballsRemaining = totalOvers * 6 - ballsBowled;
    const oversRemaining = ballsRemaining / 6;
    
    return oversRemaining > 0 ? (remainingRuns / oversRemaining).toFixed(2) : 'N/A';
  };

  // Win Probability Calculation
  const calculateWinProbability = useMemo(() => {
    if (!targetScore) return null;

    const remainingRuns = targetScore - currentScore;
    const ballsRemaining = (totalOvers * 6) - (overs * 6 + balls);
    const wicketsRemaining = 10 - wickets;

    if (remainingRuns <= 0) return 100;
    if (wickets >= 10 || ballsRemaining <= 0) return 0;

    // Complex win probability calculation
    const runRate = calculateRunRate();
    const requiredRunRate = parseFloat(calculateRequiredRunRate());
    
    let probability = 50; // Base probability
    
    // Adjust based on run rate comparison
    if (runRate > requiredRunRate) {
      probability += 10;
    } else {
      probability -= 10;
    }
    
    // Wickets factor
    probability += (wicketsRemaining * 3);
    
    // Balls remaining factor
    const ballFactor = Math.min(ballsRemaining / 36, 1) * 20;
    probability += ballFactor;

    return Math.min(Math.max(probability, 0), 100).toFixed(1);
  }, [currentScore, targetScore, overs, balls, wickets, totalOvers]);

  // Comprehensive match status
  const getMatchStatus = () => {
    if (!targetScore) return "First Innings";
    
    const runsNeeded = targetScore - currentScore;
    const ballsRemaining = (totalOvers * 6) - (overs * 6 + balls);
    
    if (runsNeeded <= 0) return "Victory!";
    if (wickets >= 10 || ballsRemaining <= 0) return "Defeat";
    
    return `Need ${runsNeeded} runs from ${ballsRemaining} balls`;
  };

  // Enter Edit Mode
  const enterEditMode = () => {
    setEditValues({
      currentScore,
      overs,
      balls,
      wickets
    });
    setEditMode(true);
  };

  // Revert Last Action
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

  // Reset Match
  const resetMatch = () => {
    setCurrentScore(0);
    setOvers(0);
    setBalls(0);
    setHistory([]);
    setLastOver([]);
    setWickets(0);
    setOverStats([]);
    setTargetScore(0);
  };

  // Update score with enhanced over tracking
  const updateScore = (runs, isBoundary = false, isExtra = false) => {
    setCurrentScore(prev => prev + runs);
    
    const eventType = 
      isExtra === 'wide' ? 'WD' : 
      isExtra === 'noBall' ? 'NB' : 
      isBoundary ? (runs === 4 ? '4' : '6') : 
      runs.toString();
    
    setHistory(prev => [...prev, eventType]);
    setLastOver(prev => [...prev, eventType]);
    
    if (!isExtra) {
      const newBalls = balls + 1;
      if (newBalls === 6) {
        // Calculate over summary
        const overRunsData = {
          overNumber: overs + 1,
          runs: lastOver.reduce((sum, ball) => {
            if (!['W', 'WD', 'NB'].includes(ball)) {
              return sum + (ball === '4' ? 4 : ball === '6' ? 6 : parseInt(ball));
            }
            return sum;
          }, 0),
          wickets: lastOver.filter(ball => ball === 'W').length,
          extras: lastOver.filter(ball => ['WD', 'NB'].includes(ball)).length
        };
        
        setOverStats(prev => [...prev, overRunsData]);
        
        setOvers(prev => prev + 1);
        setBalls(0);
        setLastOver([]);
      } else {
        setBalls(newBalls);
      }
    }
  };

  // Handle Edit Change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save Edit Values
  const saveEditValues = () => {
    setCurrentScore(parseInt(editValues.currentScore) || 0);
    setOvers(parseInt(editValues.overs) || 0);
    setBalls(parseInt(editValues.balls) || 0);
    setWickets(parseInt(editValues.wickets) || 0);
    setEditMode(false);
  };

  // Render method with enhanced UI and features
  return (
    <div className="cricket-calculator">
    <div className="scoreboard">
      <div className="main-score">
        <div className="score-container">
          <h1>{currentScore}/{wickets}</h1>
          <div className="overs-display">
            <h2>{overs}.{balls} overs</h2>
            <button className="edit-btn" onClick={enterEditMode}>
              <Edit2 />
            </button>
          </div>
        </div>
      </div>
      
      <div className="target-info">
        {targetScore > 0 && (
          <h3>Target: {targetScore}</h3>
        )}
        <div className="run-rates">
          <p>CRR: <span className="highlight">{calculateRunRate()}</span></p>
          {targetScore > 0 && (
            <p>RRR: <span className={
              parseFloat(calculateRequiredRunRate()) > 12 ? "danger" : 
              parseFloat(calculateRequiredRunRate()) > 9 ? "warning" : "success"
            }>
              {calculateRequiredRunRate()}
            </span></p>
          )}
        </div>
      </div>
      
      <div className="match-status">
        <p>{getMatchStatus()}</p>
        {calculateWinProbability !== null && (
          <p className="win-probability">
            Win Probability: {calculateWinProbability}%
          </p>
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
              <button className="extra-btn wide-btn" onClick={() => updateScore(1, false, 'wide')}>
                Wide
              </button>
              <button className="extra-btn no-ball-btn" onClick={() => updateScore(1, false, 'noBall')}>
                No Ball
              </button>
              <button className="wicket-btn" onClick={() => {
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
              }}>
                Wicket
              </button>
            </div>
          </div>
          <div className="last-over">
            <div className="over-header">
              <h3>Current Over</h3>
              <button 
                className="undo-btn" 
                onClick={revertLastAction}
                disabled={history.length === 0}
              >
                <Undo2 /> Undo
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
          
          <div className="over-stats-container">
        <h3>Over Statistics</h3>
        <div className="over-stats-scroll">
          <table>
            <thead>
              <tr>
                <th>Over</th>
                <th>Runs</th>
                <th>Wickets</th>
                <th>Extras</th>
              </tr>
            </thead>
            <tbody>
              {overStats.map((over, index) => (
                <tr key={index}>
                  <td>{over.overNumber}</td>
                  <td>{over.runs}</td>
                  <td>{over.wickets}</td>
                  <td>{over.extras}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
            
            <button className="reset-btn" onClick={resetMatch} label="reset match">
              <RefreshCw />
            </button>
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