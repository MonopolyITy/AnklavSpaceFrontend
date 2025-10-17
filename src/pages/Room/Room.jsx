import React, { useEffect, useMemo, useState } from 'react';
import CyrillicToTranslit from 'cyrillic-to-translit-js';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import './Room.css';

const translit = new CyrillicToTranslit({ preset: 'uk' })

// Кириллица → латиница (с сохранением регистра и пробелов)
const toLatin = (text) =>
translit.transform(text).replace(/[^A-Za-z0-9 ]/g, '').trim();

// Латиница → кириллица (обратное)
const fromLatin = (text) => translit.reverse(text);

const Room = () => {
  // 1) Берём имя из Telegram (фолбэк: Guest)
  const tg = typeof window !== 'undefined' ? window?.Telegram?.WebApp : undefined;
  const firstNameFromTG = tg?.initDataUnsafe?.user?.first_name || 'Guest';

  const [maxMembers, setMaxMembers] = useState(3);
  const [members, setMembers] = useState([firstNameFromTG, '', '']);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // синхронизируем первое имя при появлении из TG
  useEffect(() => {
    setMembers(prev => {
      const updated = [...prev];
      updated[0] = firstNameFromTG;
      return updated;
    });
  }, [firstNameFromTG]);

  // только 2 или 3 участника (кнопки)
  const onChangeMax = (val) => {
    const n = val === 2 ? 2 : 3;
    setMaxMembers(n);
    setMembers(prev => {
      const next = [...prev];
      next[0] = firstNameFromTG; // первый — всегда текущий пользователь
      if (next.length > n) return next.slice(0, n);
      while (next.length < n) next.push('');
      return next;
    });
  };

  const onChangeMember = (index, value) => {
    setMembers(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const validate = () => {
    if (members.length !== maxMembers) return 'Список имён не совпадает';
    // Очищаем имена: заменяем множественные пробелы, trim, и валидируем
    const cleaned = members.map(name =>
      (name ?? '').replace(/\s+/g, ' ').trim()
    );
    // Проверяем только буквы и пробелы
    const nameRegex = /^[A-Za-zА-Яа-яЁёІіЇїЄєҐґ\s]+$/;
    for (let i = 0; i < cleaned.length; i++) {
      if (!cleaned[i]) {
        setMembers(cleaned);
        return 'Заполните все имена участников';
      }
      if (!nameRegex.test(cleaned[i])) {
        setMembers(cleaned);
        return 'Имена должны содержать только буквы';
      }
    }
    // Сохраняем очищённые имена, если всё ок
    setMembers(cleaned);
    return '';
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError('');
    setCreating(true);
    setResult(null);

    try {
      const payload = {
        maxMembers,
        members: members.map(m => {
          const original = m.trim();
          const cleaned = original.replace(/\s+/g, ' ').trim();
          const latin = toLatin(cleaned);

          // Проверяем, отличается ли исходное имя от переведённого (с учётом очищенного)
          const needsPrefix = latin.toLowerCase() !== cleaned.toLowerCase();
          const finalName = needsPrefix ? `us${latin}` : latin;

          return finalName;
        }),
      };
      const { data } = await axios.post('/api/rooms/create', payload);
      setResult(data);
      setMembers([firstNameFromTG, '', '', ''].slice(0, maxMembers));
    } catch (err) {
      console.error(err);
      setError('Не удалось создать комнату.');
    } finally {
      setCreating(false);
    }
  };

  function spaceToZero(text) {
  return text.replace(/ /g, '0');
}

  // собираем ссылки после успешного создания
  const built = useMemo(() => {
    if (!result?.roomId || !Array.isArray(result?.members)) return null;

    const roomId = result.roomId;
    const first = result.members[0];

    const joinPath = (name) => {
    const latin = toLatin(name);
    // сравнение: если строки различаются (например, разные символы)
    const prefix = latin.toLowerCase() !== name.toLowerCase() ? 'us' : '';
    return `quiz${roomId}name${spaceToZero(prefix + latin)}`;
  };
    const quizPath = (name) => `/quiz/${roomId}?name=${encodeURIComponent(name)}`; // для первого — Link (React Router)

    const TG_BASE = 'https://t.me/anklavspacebot/anklav?startapp=';

    return {
      firstStartPath: quizPath(first),
      // для партнёров (2 и, если есть, 3) — тг мини-ап
      externalLinks: result.members.slice(1, 3).map((name) => ({
        name,
        url: `${TG_BASE}${joinPath(name)}`,
      })),
    };
  }, [result]);

  useEffect(() => {
    if (built?.externalLinks?.length > 0) {
      const links = built.externalLinks.map(link => ({
        name: link.name,
        url: link.url
      }));
      localStorage.setItem('anklav_partner_links', JSON.stringify(links));
    }
  }, [built]);

  return (
    <div className="quiz">
      <h2 className="quiz__title font-display">Создание комнаты</h2>

      <form onSubmit={handleCreate} className="quiz__form">
        <div className="quiz__field">
          <span className="quiz__label">Сколько всего участников?</span>
          <div className="quiz__segments">
            <button
              type="button"
              onClick={() => onChangeMax(2)}
              className={`quiz__segment-btn ${maxMembers === 2 ? 'is-active' : ''}`}
            >
              2
            </button>
            <button
              type="button"
              onClick={() => onChangeMax(3)}
              className={`quiz__segment-btn ${maxMembers === 3 ? 'is-active' : ''}`}
            >
              3
            </button>
            <Link className='quiz__segment-btn' style={{display: "flex", justifyContent: "center", alignItems: "center"}}>4+</Link>
          </div>
        </div>

        <div className="quiz__field">
          <div className="quiz__label quiz__label--strong">Имена участников</div>
          {Array.from({ length: maxMembers }).map((_, i) => (
            <div key={i} className="quiz__input-row">
              <input
                type="text"
                value={members[i] ?? ''}
                onChange={(e) => onChangeMember(i, e.target.value)}
                placeholder={i === 0 ? 'Ваше имя' : `Партнёр ${i}`}
                readOnly={i === 0}
                className={`quiz__input ${i === 0 ? 'quiz__input--readonly' : ''}`}
              />
            </div>
          ))}
        </div>

        {error && <div className="quiz__error">{error}</div>}

        <button type="submit" disabled={creating} className="quiz__submit">
          {creating ? 'Создание…' : 'Создать комнату'}
        </button>
      </form>

      {result && (
        <div className="quiz__card">
          <div className="quiz__card-title">Комната создана</div>
          <div className="quiz__card-row">
            Участники: {Array.isArray(result.members)
              ? result.members
                  .map(name => {
                    if (name.startsWith('us')) {
                      // Убираем 'us' и переводим обратно
                      return fromLatin(name.slice(2));
                    }
                    return name;
                  })
                  .join(', ')
              : ''}
          </div>

          {built && (
            <div className="quiz__actions">
              <div>
                <Link to={built.firstStartPath} className="quiz__start-btn">
                  Начать тест
                </Link>
              </div>

            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Room;