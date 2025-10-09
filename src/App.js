import React, { useEffect } from 'react';

const tg = window.Telegram.WebApp;

const App = () => {
  
  useEffect(() => {
     const isMobileFullscreen = /Android|iPhone|iPad/i.test(navigator.userAgent);
  
      tg.ready();
      tg.expand();
    
      if (isMobileFullscreen) {
        tg.requestFullscreen();
      }
    
      tg.setHeaderColor('#FFFFFF');
  }, []);

  return (
    <div style={{height: "100vh", width: "100vw", display: "flex", justifyContent: "center", alignItems: "center"}}>
      <p>Anklav Space</p>
    </div>
  )
}

export default App
