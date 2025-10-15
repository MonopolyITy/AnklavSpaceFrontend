import React, { useState, useEffect } from "react";
import { questions } from "./textTemp";
import "./QuizTemp.css";

export default function Quiz() {
  const [current, setCurrent] = useState(0);
  const [fadeState, setFadeState] = useState("fade-in");
  const [answers, setAnswers] = useState([]);
  const [partnersCount, setPartnersCount] = useState(null);
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  useEffect(() => {
    setFadeState("fade-in");
  }, [current]);

  useEffect(() => {
    console.log("partnersCount:", partnersCount);
  }, [partnersCount]);

  const handleClick = (nextId, label, partners) => {
    if (partners) {
      setPartnersCount(partners);
    }
    setAnswers((prev) => [...prev, { questionId: current, answer: label }]);
    console.log("Answers:", [...answers, { questionId: current, answer: label }]);
    setHoveredIndex(null);
    setFadeState("fade-out");
    setTimeout(() => {
      setCurrent(nextId);
      setHoveredIndex(null);
    }, 300);
  };

  const question = questions.find((q) => q.id === current);

  return (
    <div className="quiz-container">
      <div className={`quiz-content ${fadeState}`}>
        <p className="quiz-question">{question.text}</p>
        <div className="quiz-buttons">
          {question.options.map((opt, i) => (
            <button
              className={`quiz-button font-display ${hoveredIndex === i ? "hovered" : ""}`}
              key={`${current}-${i}`}
              onClick={() => handleClick(opt.next, opt.label, opt.partners)}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}