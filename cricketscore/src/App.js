import React from 'react';
import './App.css';
import CricketRunRateCalculator from './components/Runrate';

function App() {
  return (
    <div className="App">
      <div className="compact-header">
        <h2>Cricket Scorecard</h2>
      </div>
      <main className="app-content">
        <CricketRunRateCalculator />
      </main>
    </div>
  );
}

export default App;