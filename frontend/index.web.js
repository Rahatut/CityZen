import 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './global.css';

enableScreens();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
