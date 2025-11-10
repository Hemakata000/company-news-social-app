import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components';
import LoadingState from './components/LoadingState';
import './App.css';

// Lazy load pages for better performance
const HomePage = React.lazy(() => import('./pages/HomePage'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));

function App() {
  return (
    <>
      {/* TEST BANNER - Hot reload verification */}
      <div style={{ 
        background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)', 
        color: 'white', 
        padding: '12px', 
        textAlign: 'center', 
        fontWeight: 'bold',
        fontSize: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        ✅ HOT RELOAD WORKING - Changes detected successfully!
      </div>
      
      <Suspense fallback={<LoadingState message="Loading application..." size="large" />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route 
              index 
              element={
                <Suspense fallback={<LoadingState message="Loading home page..." />}>
                  <HomePage />
                </Suspense>
              } 
            />
            <Route 
              path="about" 
              element={
                <Suspense fallback={<LoadingState message="Loading about page..." />}>
                  <AboutPage />
                </Suspense>
              } 
            />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;