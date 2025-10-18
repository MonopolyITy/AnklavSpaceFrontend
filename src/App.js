import React, { useEffect, useState } from 'react';
import Home from './pages/Home/Home';
import Header from './components/Header/Header';
import Loader from './pages/Loader/Loader';
import { Routes, Route } from "react-router-dom";
import Room from './pages/Room/Room';
import axios from './api/axios';
import Quiz from './pages/Quiz/Quiz';
import Bid from './pages/Bid/Bid';

const tg = window.Telegram.WebApp;

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Очистка сохранённых партнёрских ссылок при каждом входе в приложение
  useEffect(() => {
    try {
      localStorage.removeItem('anklav_partner_links');
    } catch (e) {
      console.warn('Не удалось очистить anklav_partner_links из localStorage:', e);
    }
  }, []);

  useEffect(() => {
    // Сразу делаем фон под лоадером
    document.body.style.backgroundColor = '#4E4C50';

    tg.ready();
    tg.expand();
    // ////////
      const isMobileFullscreen = /Android|iPhone|iPad/i.test(navigator.userAgent);
      if (isMobileFullscreen) {
        tg.requestFullscreen();
      }
    ////////
    tg.setHeaderColor('#4E4C50');

    // Контент появляется чуть позже, чтобы избежать просачивания
    const contentTimer = setTimeout(() => setShowContent(true), 1000);

    // Фон меняется на белый чуть раньше исчезновения лоадера
    const bodyTimer = setTimeout(() => {
      document.body.style.backgroundColor = 'white';
    }, 1500);

    // Плавное исчезновение и удаление
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const removeTimer = setTimeout(() => setIsLoading(false), 2600);

    return () => {
      clearTimeout(contentTimer);
      clearTimeout(bodyTimer);
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
  (async () => {
    try {
      const tgUser = tg?.initDataUnsafe?.user;

      const userData = {
        user: {
          id: tgUser?.id,
          username: tgUser?.username,
          first_name: tgUser?.first_name || 'Guest',
          language_code: tgUser?.language_code || 'ru'
        }
      };

      // Отправляем на сервер
      await axios.post('/api/check/user', userData);
    } catch (err) {
      console.error('Ошибка получения пользователя:', err);
    }
  })();
}, []);


  return (
    <>
      <div style={{ position: 'relative' }}>
        {showContent && (
          <>
            <Header />
            <div style={{marginTop: "96px"}}> 
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/room" element={<Room/>} />
                <Route path="/quiz/:roomId" element={<Quiz/>} />
                <Route path="/bid" element={<Bid/>}/>
              </Routes>
            </div>
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