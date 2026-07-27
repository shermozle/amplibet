import './index.css';
// Imported for its side effect: Amplitude initialises at module load so that
// events on the landing page fire before any component mounts.
import './utils/analytics';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Root container #root not found');
createRoot(container).render(<App />);
