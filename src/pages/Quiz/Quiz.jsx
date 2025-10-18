import React, { useEffect, useState } from 'react';
import questions from "./questions";
import { useParams, useSearchParams, Link } from "react-router-dom";
import CyrillicToTranslit from 'cyrillic-to-translit-js';
import axios from '../../api/axios';

const translit = new CyrillicToTranslit({ preset: 'uk' })

// Латиница → кириллица (обратное)
const fromLatin = (text) => translit.reverse(text);

export default function Quiz() {
  const [currentId, setCurrentId] = useState(0);
  const [answers, setAnswers] = useState([]);
  // Данные ввода по именам участников: { [name]: { econ, human, social } }
  const [inputs, setInputs] = useState({});
  // Порядок имён на экране: [selfName, ...partners]
  const [orderedNames, setOrderedNames] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showErrors, setShowErrors] = useState(false); // показывать ошибки только после сабмита
  const [copiedMap, setCopiedMap] = useState({});

  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const nameFromQuery = searchParams.get("name") || "Guest";

  useEffect(() => {
    axios
      .get(`/api/rooms/${roomId}`)
      .then((response) => {
        const data = response.data || {};

        const members = Array.isArray(data.members) ? data.members : [];
        const maxMembers = Math.min(3, data.maxMembers || members.length || 1);

        const uniqMembers = Array.from(new Set(members));
        const selfName = nameFromQuery;
        const others = uniqMembers.filter((m) => m !== selfName);
        const sorted = [selfName, ...others].slice(0, maxMembers);
        setOrderedNames(sorted);

        // Инициализировать inputs для каждого имени (не затирая уже введённое)
        setInputs((prev) => {
          const next = { ...prev };
          sorted.forEach((n) => {
            if (!next[n]) next[n] = { econ: "", human: "", social: "" };
          });
          return next;
        });
      })
      .catch((error) => {
        console.error('Ошибка при загрузке комнаты:', error);
        setServerError('{"error": "Комната не найдена"}');
      });
  }, [roomId, nameFromQuery]);

  const currentQuestion = questions.find((q) => q.id === currentId);

  const handleOptionClick = (nextId, selectedLabel) => {
    if (currentQuestion.id >= 1 && currentQuestion.id !== 100) {
      setAnswers(prev => [...prev, selectedLabel]);
    }
    setCurrentId(nextId);
    setServerError("");
    setShowErrors(false);
  };

  // Экран после успешной отправки
  if (isFinished) {
    // читаем ссылки из localStorage
    const savedLinks = JSON.parse(localStorage.getItem('anklav_partner_links') || '[]');

    return (
      <div style={{ padding: "0 20px" }}>
        <h3 style={{ marginTop: 0 }}>Отлично! Ответы отправлены.</h3>
        {savedLinks.length > 0 && (
          <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: "10px" }}>
            Поделитесь этими ссылками с партнёрами, чтобы они могли пройти тест.
          </p>
        )}

        {savedLinks.map(({ name, url }) => {
          const handleCopy = async () => {
            try {
              await navigator.clipboard.writeText(url);
            } catch {
              const dummy = document.createElement('textarea');
              dummy.value = url;
              dummy.setAttribute('readonly', '');
              dummy.style.position = 'absolute';
              dummy.style.left = '-9999px';
              document.body.appendChild(dummy);
              dummy.select();
              document.execCommand('copy');
              document.body.removeChild(dummy);
            }

            setCopiedMap((prev) => ({ ...prev, [name]: true }));
            setTimeout(() => {
              setCopiedMap((prev) => ({ ...prev, [name]: false }));
            }, 1000);
          };

          return (
            <button
              key={name}
              onClick={handleCopy}
              style={{
                width: "100%",
                
                background: copiedMap[name] ? "#3D8C3D" : "#4E4C50",
                color: "white",
                border: "none",
                borderRadius: 5,
                padding: "10px 16px",
                marginTop: "10px",
                textAlign: "center",
                cursor: "pointer",
                fontSize: 14,
                transition: "background 0.3s ease"
              }}
            >
              {copiedMap[name]
                ? "✅ Скопировано"
                : `🔗 ${name.startsWith('us') ? fromLatin(name.slice(2)) : name}`}
            </button>
          );
        })}
        
        <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: "10px" }}>
          Когда последний партнёр завершит тест, все участники получат уведомление с
          усреднёнными результатами и финальным распределением долей.
        </p>

        <Link
          to="/"
          style={{
            display: 'inline-block',
            marginTop: 10,
            width: "100%",
            background: '#F1EEDB',
            color: 'black',
            border: 'none',
            padding: '10px 16px',
            borderRadius: 5,
            textDecoration: 'none',
            textAlign: 'center'
          }}
        >
          На главный экран
        </Link>
      </div>
    );
  }

  // После последнего вопроса — ввод распределения по капиталам
  if (currentId === 4) {
    const LABELS = {
      econ: 'Экономический',
      human: 'Человеческий',
      social: 'Социальный',
    };

    // вспомогательные функции
    const coerce = (v) => parseFloat(String(v).replace(',', '.')) || 0;

    const sumCapital = (cap) =>
      orderedNames.reduce((s, name) => s + coerce(inputs[cap]?.[name]), 0);

    const getCapitalError = (cap) => {
      const sum = sumCapital(cap);
      if (Math.abs(sum - 100) > 0.5)
        return `Сумма по ${LABELS[cap].toLowerCase()} капиталу должна быть 100%`;
      const outOfRange = orderedNames.some(name => {
        const v = coerce(inputs[cap]?.[name]);
        return v < 0 || v > 100;
      });
      if (outOfRange) return 'Каждое значение должно быть в диапазоне 0–100%';
      return null;
    };

    const handleInputChange = (cap, name, value) => {
      setInputs(prev => ({
        ...prev,
        [cap]: { ...(prev[cap] || {}), [name]: value }
      }));
    };

    const handleSubmitInputs = async () => {
      setServerError("");
      setShowErrors(true);
      if (['econ', 'human', 'social'].some((cap) => getCapitalError(cap))) return;

      try {
        setIsSubmitting(true);
        const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

        const payload = {
          id: userId != null ? String(userId) : undefined,
          name: nameFromQuery,
          questions_answers: answers,
          self_input: {
            econ: coerce(inputs.econ?.[nameFromQuery]),
            human: coerce(inputs.human?.[nameFromQuery]),
            social: coerce(inputs.social?.[nameFromQuery]),
          },
          partners_input: orderedNames
            .filter(name => name !== nameFromQuery)
            .map(name => ({
              partnerName: name,
              econ: coerce(inputs.econ?.[name]),
              human: coerce(inputs.human?.[name]),
              social: coerce(inputs.social?.[name]),
            })),
        };

        await axios.post(`/api/rooms/${roomId}/answer`, payload);
        setIsFinished(true);
      } catch (e) {
        console.error('Не удалось отправить ответы:', e);
        const status = e?.response?.status;
        if (status === 400) {
          setServerError(`Пользователь с таким ID уже добавлен`);
        } else if (status === 404) {
          setServerError(`Комната не найдена`);
        } else {
          setServerError('Не удалось отправить ответы');
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <div style={{ padding: "0 20px" }}>
        <h3 style={{marginBottom: "20px"}}>
          Распредели 100% по каждому капиталу между всеми участниками
        </h3>

        {serverError && (
          <pre style={{ background: '#fff3f3', border: '1px solid #f3caca', padding: 8, borderRadius: 6 }}>
            {serverError}
          </pre>
        )}

        {['econ', 'human', 'social'].map((cap) => (
          <div key={cap} style={{ marginBottom: 20 }}>
            <h4 style={{ marginBottom: 10, fontSize: "16px" }}>{LABELS[cap]} капитал</h4>

            {orderedNames.map((name) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ width: 100, fontSize: 14 }}>
                  {name.startsWith('us') ? fromLatin(name.slice(2)) : name}
                </span>
                <input
                  type="number"
                  step="any"
                  inputMode="numeric"
                  placeholder="%"
                  value={(inputs[cap] && inputs[cap][name]) || ''}
                  onChange={(e) => handleInputChange(cap, name, e.target.value)}
                  style={{
                    width: '100%',
                    height: 38,
                    padding: 5,
                    marginLeft: "5px",
                    borderRadius: 5,
                    border: '1px solid #4e4c501b',
                  }}
                />
              </div>
            ))}

            {showErrors && getCapitalError(cap) && (
              <div style={{ color: '#b00020', fontSize: 12, marginTop: 4 }}>
                {getCapitalError(cap)}
              </div>
            )}
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>
              Сумма: {Math.round(sumCapital(cap))}%
            </div>
          </div>
        ))}

        <button
          onClick={handleSubmitInputs}
          disabled={isSubmitting}
          style={{
            width: '100%',
            height: 40,
            background: '#F1EEDB',
            color: 'black',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 6,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? 'Отправка...' : 'Завершить'}
        </button>
      </div>
    );
  }

  // Экран вопросов/опций
  return (
    <div style={{ padding: "0 20px" }}>
      <p style={{ whiteSpace: 'pre-line' }}>{currentQuestion.text}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {currentQuestion.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOptionClick(opt.next, opt.label)}
            style={{
              background: '#F1EEDB',
              color: 'black',
              border: 'none',
              padding: '10px 15px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}