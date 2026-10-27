import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './features/auth';
import { AppContextProvider } from './app/context/AppContext';
import { AppRouter } from './app/routes/AppRouter';
import './app/styles/index.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContextProvider>
          <AppRouter />
        </AppContextProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
