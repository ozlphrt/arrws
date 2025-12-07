import { useState, useCallback } from 'react';
import DotCanvas from './components/DotCanvas';
import './App.css';

function App() {
  const [tapPosition, setTapPosition] = useState(null);

  const handleCanvasTap = useCallback((x, y) => {
    setTapPosition({ x, y });
    // This will trigger snake animations later
    console.log('Tap at:', x, y);
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <h1 className="title">ARROWS</h1>
      </header>
      <main className="main-content">
        <DotCanvas onTap={handleCanvasTap} tapPosition={tapPosition} />
      </main>
    </div>
  );
}

export default App;


