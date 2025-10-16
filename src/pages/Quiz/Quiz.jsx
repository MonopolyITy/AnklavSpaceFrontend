import React, { useEffect, useState } from 'react';
import questions from "./questions";
import { useParams, useSearchParams, Link } from "react-router-dom";
import axios from '../../api/axios';

export default function Quiz() {
  const [currentId, setCurrentId] = useState(0);
  // Данные ввода по именам участников: { [name]: { econ, human, social } }
  const [inputs, setInputs] = useState({});
  // Порядок имён на экране: [selfName, ...partners]
  const [orderedNames, setOrderedNames] = useState([]);
  const [isFinished, setIsFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [showErrors, setShowErrors] = useState(false); // показывать ошибки только после сабмита

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

  const handleOptionClick = (nextId) => {
    setCurrentId(nextId);
    setServerError("");
    setShowErrors(false);
  };

  // Парсер чисел (поддержка запятых и знака %)
  const coerce = (v) => {
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v !== 'string') return 0;
    const s = v.trim().replace(',', '.').replace('%', '');
    const m = s.match(/-?\d+(?:\.\d+)?/);
    const n = m ? parseFloat(m[0]) : NaN;
    return Number.isFinite(n) ? n : 0;
  };

  const EPS = 0.5; // допустимая погрешность для суммы (в процентах)

  // Утилиты для валидации/вывода
  const parseTriple = (personName) => {
    const econ = coerce(inputs?.[personName]?.econ);
    const human = coerce(inputs?.[personName]?.human);
    const social = coerce(inputs?.[personName]?.social);
    const sum = econ + human + social;
    return { econ, human, social, sum };
  };

  const getPersonErrors = (triple) => {
    const msgs = [];
    if (Math.abs(triple.sum - 100) > EPS) {
      msgs.push(`Сумма должна быть 100% (сейчас ${Math.round(triple.sum)}%)`);
    }
    const outOfRange = (
      triple.econ < 0 || triple.human < 0 || triple.social < 0 ||
      triple.econ > 100 || triple.human > 100 || triple.social > 100
    );
    if (outOfRange) msgs.push('Каждое значение 0–100%');
    return msgs;
  };

  const isFormValid = () => {
    for (const name of orderedNames) {
      const errs = getPersonErrors(parseTriple(name));
      if (errs.length) return false;
    }
    return true;
  };

  const handleInputChange = (personName, field, value) => {
    setInputs((prev) => ({
      ...prev,
      [personName]: { ...prev[personName], [field]: value },
    }));
    // если ошибки уже показаны, пересчитывать на лету — логика остаётся
    if (showErrors) {
      // просто форсируем ререндер через setState выше; вычисления делаем при рендере
    }
  };

  const toNums = (obj = {}) => ({
    econ: coerce(obj.econ),
    human: coerce(obj.human),
    social: coerce(obj.social),
  });

  const handleSubmitInputs = async () => {
    setServerError("");
    setShowErrors(true);
    if (!isFormValid()) return; // блокируем отправку, пока не исправят

    try {
      setIsSubmitting(true);
      const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

      const selfName = orderedNames[0] || nameFromQuery;
      const partners = orderedNames.slice(1);

      const payload = {
        id: userId != null ? String(userId) : undefined,
        name: selfName,
        self_input: toNums(inputs[selfName]),
        partners_input: partners.map((p) => ({
          partnerName: p,
          ...toNums(inputs[p]),
        })),
      };

      await axios.post(`/api/rooms/${roomId}/answer`, payload);
      setIsFinished(true);
    } catch (e) {
      console.error('Не удалось отправить ответы:', e);
      const status = e?.response?.status;
      const msg = e?.response?.data?.error;
      if (status === 400) {
        setServerError(`{"error": "${msg || 'Пользователь с таким ID или именем уже добавлен'}"}`);
      } else if (status === 404) {
        setServerError(`{"error": "${msg || 'Комната не найдена'}"}`);
      } else {
        setServerError('{"error": "Не удалось отправить ответы. Попробуйте ещё раз."}');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Экран после успешной отправки
  if (isFinished) {
    return (
      <div style={{ padding: 20 }}>
        <h3 style={{ marginTop: 0 }}>Отлично! Ответы отправлены.</h3>
        <p style={{ fontSize: 14, lineHeight: 1.5 }}>
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

  // После последнего вопроса — ввод чисел
  if (currentId === 4) {
    return (
      <div style={{ padding: 20 }}>
        <h3>
          Оцени вклад свой и партнёров по трём капиталам — экономическому, человеческому и
          социальному — в сумме 100% на каждого.
        </h3>

        {serverError && (
          <pre style={{ background: '#fff3f3', border: '1px solid #f3caca', padding: '8px', borderRadius: 6 }}>
{serverError}
          </pre>
        )}

        {orderedNames.map((personName, i) => {
          const triple = parseTriple(personName);
          const personErrors = showErrors ? getPersonErrors(triple) : [];

          const fieldHasError = (field) => {
            if (!showErrors) return false;
            const v = triple[field];
            return v < 0 || v > 100;
          };

          return (
            <div key={personName} style={{ marginBottom: 10, marginTop: 10 }}>
              <p style={{ fontSize: 14 }}>{i === 0 ? `${personName} (вы)` : personName}</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between' }}>
                {['econ', 'human', 'social'].map((field) => (
                  <input
                    key={field}
                    type="number"
                    placeholder={field}
                    step="any"
                    inputMode="numeric"
                    value={(inputs[personName] && inputs[personName][field]) || ''}
                    onChange={(e) => handleInputChange(personName, field, e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      marginTop: '10px',
                      padding: 5,
                      borderRadius: 5,
                      border: fieldHasError(field) ? '1px solid #b00020' : '1px solid #4e4c501b',
                      outline: 'none',
                    }}
                  />
                ))}
              </div>

              {showErrors && personErrors.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <ul style={{
                    margin: 0,
                    color: '#b00020',
                    fontSize: 12,
                    lineHeight: 1.3,
                  }}>
                    {personErrors.map((msg, idx) => (
                      <li key={idx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Сумма: {Math.round(triple.sum || 0)}%</div>
            </div>
          );
        })}

        <button
          onClick={handleSubmitInputs}
          disabled={isSubmitting}
          style={{
            marginTop: 10,
            width: '100%',
            height: '40px',
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
    <div style={{ padding: 20 }}>
      <p style={{ whiteSpace: 'pre-line' }}>{currentQuestion.text}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {currentQuestion.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleOptionClick(opt.next)}
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