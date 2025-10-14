import React, { useEffect, useState } from 'react';
import Home from './pages/Home/Home';
import Header from './components/Header/Header';
import Loader from './pages/Loader/Loader';

const tg = window.Telegram.WebApp;

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {  
    tg.ready();
    tg.expand();
    ////////
    const isMobileFullscreen = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobileFullscreen) {
      tg.requestFullscreen();
    }
    ////////
    tg.setHeaderColor('#4E4C50');

    const contentTimer = setTimeout(() => setShowContent(true), 500);

    const bodyTimer = setTimeout(() => {
      document.body.style.backgroundColor = 'white';
    }, 1000);

    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const removeTimer = setTimeout(() => setIsLoading(false), 2500);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(bodyTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      <div style={{ position: 'relative' }}>
        {showContent && (
          <>
            <Header />
            <Home />
          </>
        )}
        {isLoading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#4E4C50',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            pointerEvents: 'none',
            opacity: fadeOut ? 0 : 1,
            transition: 'opacity 0.6s ease',
          }}>
            <Loader />
          </div>
        )}
      </div>
    </>
  );
}

export default App
