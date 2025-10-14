import React, { useEffect } from 'react';
import Home from './pages/Home/Home';
import Header from './components/Header/Header';

const tg = window.Telegram.WebApp;

const App = () => {
  
  useEffect(() => {  
      tg.ready();
      tg.expand();

      //  const isMobileFullscreen = /Android|iPhone|iPad/i.test(navigator.userAgent);
      // if (isMobileFullscreen) {
      //   tg.requestFullscreen();
      // }
    
      tg.setHeaderColor('#4E4C50');
  }, []);

  return (
    <>
      <Header/>
      <Home/>
    </>
  )
}

export default App
