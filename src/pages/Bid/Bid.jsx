import React, { useState } from 'react';
import axios from '../../api/axios';
import './Bid.css';

const Bid = () => {
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);

    const handleSubmit = async () => {
    if (isLoading) return;
    const tg = window.Telegram.WebApp;
    const tgUser = tg?.initDataUnsafe?.user 

    setIsLoading(true);
    try {
      await axios.post('/api/bid', { id: tgUser.id });
      setSuccess(true);
      setError('');
      setFadeOut(false);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setSuccess(false);
          setError('');
          setFadeOut(false);
        }, 500);
      }, 3000);
    } catch (error) {
      console.error(error);
      setError('Не удалось отправить заявку. Попробуйте позже.');
      setFadeOut(false);
      setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setSuccess(false);
          setError('');
          setFadeOut(false);
        }, 500);
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bid-container">
      <h2 className='bid-title font-display '>
        Разбор партнёрства - это первый шаг к справедливому распределению долей
      </h2>
      <p className="bid-text">
        На встрече мы проанализируем ваш проект по модели трёх капиталов - экономического, человеческого и социального. 
        Ты узнаешь, кто из партнёров вносит наибольший вклад, где возможны перекосы и как сбалансировать доли, 
        чтобы все участники чувствовали себя честно и мотивированно.
      </p>
      <p className="bid-text">
        После подтверждения мы свяжемся с тобой, чтобы согласовать удобное время и формат разбора.
      </p>
      <button className="bid-button" onClick={handleSubmit}>Записаться</button>
      {error && (
        <div className={`fade-container ${fadeOut ? 'fade-out' : ''}`}>
          <p className="bid-error">
            Пользователь не найден
          </p>
        </div>
      )}
      {success && (
        <div className={`fade-container ${fadeOut ? 'fade-out' : ''}`}>
          <p className="bid-success">
            Мы передали ваш контакт менеджеру! Валерия свяжется с вами в течение суток.
          </p>
        </div>
      )}
    </div>
  );
};

export default Bid;
