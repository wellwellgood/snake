import { BrowserRouter } from 'react-router-dom';
import './App.css';
import SnakeGame from './publice/snakeGame';

function App() {
  return (
    <BrowserRouter>
      <SnakeGame />
    </BrowserRouter>
  )
}

export default App;