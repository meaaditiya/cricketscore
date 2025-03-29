import React, { useState, useEffect, useMemo } from 'react';
import { Trophy, Undo2, Edit2, RefreshCw, ChevronRight, AlertTriangle } from 'lucide-react';
import './Runrate.css';
// Main Component
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // Calculate Current Run Rate
  const calculateRunRate = () => {
    const totalBalls = overs * 6 + balls;
    const totalOversFloat = totalBalls / 6;
    return totalOversFloat > 0 ? (currentScore / totalOversFloat).toFixed(2) : '0.00';
  };

  // Calculate Required Run Rate
  const calculateRequiredRunRate = () => {
    if (!targetScore) return '0.00';
    
    const remainingRuns = targetScore - currentScore;
    if (remainingRuns <= 0) return '0.00';
    
    const ballsBowled = overs * 6 + balls;
    const ballsRemaining = totalOvers * 6 - ballsBowled;
    const oversRemaining = ballsRemaining / 6;
    
    return oversRemaining > 0 ? (remainingRuns / oversRemaining).toFixed(2) : 'N/A';
  };

  // Enhanced Win Probability Algorithm with pitch conditions and momentum
  const calculateWinProbability = useMemo(() => {
    if (!targetScore) return null;

    const remainingRuns = targetScore - currentScore;
    const ballsBowled = overs * 6 + balls;
    const ballsRemaining = (totalOvers * 6) - ballsBowled;
    const wicketsRemaining = 10 - wickets;

    // Terminal conditions
    if (remainingRuns <= 0) return 100;
    if (wickets >= 10 || ballsRemaining <= 0) return 0;

    // Base factors
    const currentRunRate = parseFloat(calculateRunRate());
    const requiredRunRate = parseFloat(calculateRequiredRunRate());
    
    // Calculate based on multiple factors
    let probability = 50; // Base starting point
    
    // Factor 1: Run rate comparison (max impact: ±20%)
    const runRateDifference = currentRunRate - requiredRunRate;
    probability += Math.min(Math.max(runRateDifference * 10, -20), 20);
    
    // Factor 2: Wickets remaining (max impact: 20%)
    probability += (wicketsRemaining / 10) * 20;
    
    // Factor 3: Pressure based on chase stage (max impact: ±15%)
    const chaseCompletion = ballsBowled / (totalOvers * 6);
    if (chaseCompletion > 0.5) { // Second half of innings
      // Higher pressure in later stages
      const pressureFactor = (chaseCompletion - 0.5) * 2; // 0 to 1
      
      if (currentRunRate < requiredRunRate) {
        // Increasing pressure if behind
        probability -= pressureFactor * 15;
      } else {
        // Decreasing pressure if ahead
        probability += pressureFactor * 10;
      }
    }
    
    // Factor 4: Momentum (based on last 12 balls) (max impact: ±10%)
    const recentHistory = history.slice(-12);
    if (recentHistory.length > 0) {
      const recentScoring = recentHistory.reduce((sum, ball) => {
        if (ball === 'W') return sum - 5; // Wicket hurts momentum
        if (ball === 'WD' || ball === 'NB') return sum + 1;
        if (ball === '4') return sum + 4;
        if (ball === '6') return sum + 6;
        return sum + parseInt(ball || 0);
      }, 0);
      
      // Calculate recent run rate
      const recentBalls = Math.min(12, recentHistory.length);
      const recentRunRate = (recentScoring / recentBalls) * 6;
      
      // Adjust momentum factor
      const momentumImpact = Math.min(Math.max((recentRunRate - requiredRunRate) * 5, -10), 10);
      probability += momentumImpact;
    }
    
    // Factor 5: Close game adjustment
    if (remainingRuns < 20 && ballsRemaining > remainingRuns) {
      // Favor batting side in close games with plenty of balls
      probability += 5;
    }
    
    return Math.min(Math.max(Math.round(probability), 0), 100);
  }, [currentScore, targetScore, overs, balls, wickets, totalOvers, history]);

  // Get comprehensive match status with contextual information
  const getMatchStatus = () => {
    if (!targetScore) return "First Innings";
    
    const runsNeeded = targetScore - currentScore;
    const ballsBowled = overs * 6 + balls;
    const ballsRemaining = (totalOvers * 6) - ballsBowled;
    
    if (runsNeeded <= 0) return "Victory!";
    if (wickets >= 10 || ballsRemaining <= 0) return "Defeat";
    
    // Contextual status based on situation
    const requiredRunRate = parseFloat(calculateRequiredRunRate());
    
    if (ballsRemaining < 6) {
      return `Need ${runsNeeded} from last ${ballsRemaining} ${ballsRemaining === 1 ? 'ball' : 'balls'}`;
    } else if (requiredRunRate > 12) {
      return `Need ${runsNeeded} runs at ${requiredRunRate} RPO (difficult)`;
    } else {
      return `Need ${runsNeeded} from ${Math.floor(ballsRemaining/6)}.${ballsRemaining%6} overs`;
    }
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
    
    // Get last event and remove from history
    const newHistory = [...history];
    const lastEvent = newHistory.pop();
    setHistory(newHistory);
    
    // Update score based on what was reverted
    if (lastEvent === 'W') {
      setWickets(prev => Math.max(prev - 1, 0));
    } else if (lastEvent === 'WD' || lastEvent === 'NB') {
      setCurrentScore(prev => Math.max(prev - 1, 0));
    } else {
      const runs = lastEvent === '4' ? 4 : lastEvent === '6' ? 6 : parseInt(lastEvent || 0);
      setCurrentScore(prev => Math.max(prev - runs, 0));
    }
    
    // Update last over
    const newLastOver = [...lastOver];
    if (newLastOver.length > 0) {
      newLastOver.pop();
      setLastOver(newLastOver);
    } else if (overs > 0) {
      // We need to reconstruct the last over from history
      // Take the last 6 balls before the current over
      const prevOverIndex = (overs - 1) * 6;
      const prevOverEndIndex = Math.min(prevOverIndex + 6, newHistory.length);
      const prevOverStartIndex = Math.max(prevOverEndIndex - 6, 0);
      const prevOverBalls = newHistory.slice(prevOverStartIndex, prevOverEndIndex);
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
    if (window.confirm("Are you sure you want to reset the match?")) {
      setCurrentScore(0);
      setOvers(0);
      setBalls(0);
      setHistory([]);
      setLastOver([]);
      setWickets(0);
      setOverStats([]);
      setTargetScore(0);
    }
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
        const currentRunsInOver = lastOver.reduce((sum, ball) => {
          if (ball === 'W') return sum;
          if (ball === 'WD' || ball === 'NB') return sum + 1;
          return sum + (ball === '4' ? 4 : ball === '6' ? 6 : parseInt(ball) || 0);
        }, runs);
        
        const overRunsData = {
          overNumber: overs + 1,
          runs: currentRunsInOver,
          wickets: lastOver.filter(ball => ball === 'W').length + (eventType === 'W' ? 1 : 0),
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

  // Handle wicket
  const handleWicket = () => {
    setWickets(prev => Math.min(prev + 1, 10));
    
    // Advance the ball
    const newBalls = balls + 1;
    if (newBalls === 6) {
      // Calculate over summary
      const overRunsData = {
        overNumber: overs + 1,
        runs: lastOver.reduce((sum, ball) => {
          if (ball === 'W') return sum;
          if (ball === 'WD' || ball === 'NB') return sum + 1;
          return sum + (ball === '4' ? 4 : ball === '6' ? 6 : parseInt(ball) || 0);
        }, 0),
        wickets: lastOver.filter(ball => ball === 'W').length + 1,
        extras: lastOver.filter(ball => ['WD', 'NB'].includes(ball)).length
      };
      
      setOverStats(prev => [...prev, overRunsData]);
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

  // Handle Edit Change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditValues(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
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

  // Toggle Menu for Mobile
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Define CSS classes based on the win probability
  const getWinProbabilityClass = () => {
    if (calculateWinProbability === null) return "";
    const probability = parseInt(calculateWinProbability);
    if (probability >= 75) return "high-probability";
    if (probability >= 40) return "medium-probability";
    return "low-probability";
  };

  return (
    <div className="cricket-calculator">
      <div className="scoreboard">
        <div className="main-score">
          <div className="score-container">
            <h1>{currentScore}/{wickets}</h1>
            <div className="overs-display">
              <h2>{overs}.{balls} overs</h2>
              <button 
                className="edit-btn" 
                onClick={enterEditMode}
                aria-label="Edit score"
              >
                <Edit2 size={18} />
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
            <p className={`win-probability ${getWinProbabilityClass()}`}>
              Win Probability: {calculateWinProbability}%
              {calculateWinProbability > 85 && <Trophy size={16} className="icon" />}
            </p>
          )}
        </div>
      </div>
      
      {editMode ? (
        <div className="edit-panel">
          <h3>Update Score Manually</h3>
          <div className="edit-form">
            <div className="edit-field">
              <label htmlFor="currentScore">Runs:</label>
              <input 
                id="currentScore"
                type="number" 
                name="currentScore"
                value={editValues.currentScore}
                onChange={handleEditChange}
                min="0"
              />
            </div>
            <div className="edit-field">
              <label htmlFor="overs">Overs:</label>
              <input 
                id="overs"
                type="number" 
                name="overs"
                value={editValues.overs}
                onChange={handleEditChange}
                min="0"
                max={totalOvers}
              />
            </div>
            <div className="edit-field">
              <label htmlFor="balls">Balls:</label>
              <input 
                id="balls"
                type="number" 
                name="balls"
                value={editValues.balls}
                onChange={handleEditChange}
                min={0}
                max={5}
              />
            </div>
            <div className="edit-field">
              <label htmlFor="wickets">Wickets:</label>
              <input 
                id="wickets"
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
              {[0, 1, 2, 3, 4, 6].map(runs => (
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
              <button 
                className="extra-btn wide-btn" 
                onClick={() => updateScore(1, false, 'wide')}
              >
                Wide
              </button>
              <button 
                className="extra-btn no-ball-btn" 
                onClick={() => updateScore(1, false, 'noBall')}
              >
                No Ball
              </button>
              <button 
                className="wicket-btn" 
                onClick={handleWicket}
              >
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
                aria-label="Undo last action"
              >
                <Undo2 size={16} /> Undo
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
          
          <div className="accordion-container">
            <button 
              className={`accordion-toggle ${isMenuOpen ? 'active' : ''}`} 
              onClick={toggleMenu}
            >
              Statistics & Settings <ChevronRight size={16} className={`icon ${isMenuOpen ? 'rotated' : ''}`} />
            </button>
            
            <div className={`accordion-content ${isMenuOpen ? 'open' : ''}`}>
              <div className="over-stats-container">
                <h3>Over-by-Over Analysis</h3>
                <div className="over-stats-scroll">
                  {overStats.length === 0 ? (
                    <p className="no-data">No completed overs yet</p>
                  ) : (
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
                  )}
                </div>
              </div>
              
              <div className="settings-panel">
                <h3>Match Settings</h3>
                <div className="settings-form">
                  <div className="input-group">
                    <label htmlFor="totalOvers">Format:</label>
                    <select
                      id="totalOvers"
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
                    <label htmlFor="targetScore">Target:</label>
                    <input 
                      id="targetScore"
                      type="number" 
                      min="0" 
                      value={targetScore} 
                      onChange={(e) => setTargetScore(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <button 
                  className="reset-btn" 
                  onClick={resetMatch}
                  aria-label="Reset match"
                >
                  <RefreshCw size={16} /> Reset Match
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
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CricketRunRateCalculator;