import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import CyrillicToTranslit from 'cyrillic-to-translit-js';
import { Link } from "react-router-dom";

const translit = new CyrillicToTranslit({ preset: 'uk' })

// Латиница → кириллица (обратное)
const fromLatin = (text) => translit.reverse(text);

const Home = () => {

   const navigate = useNavigate();
  const location = useLocation();

  // Проверяем, был ли уже редирект выполнен в этой сессии
  const hasRedirected = useRef(sessionStorage.getItem("startHandled") === "true");


   useEffect(() => {
    // Если редирект уже был — ничего не делаем
    if (hasRedirected.current) return;

    const { start_param: startParam } =
      window.Telegram?.WebApp?.initDataUnsafe || {};

    if (typeof startParam === "string") {
      // пример: quizfjskf4dnameVlad
      const match = startParam.match(/^quiz([a-zA-Z0-9]+)name(.+)$/);

      if (match) {
        const roomId = match[1];
        let name = match[2];

        name = name.replace(/&/g, " ");

        if (name.startsWith("us")) {
          name = fromLatin(name.slice(2));
        }

        if (roomId && name) {
          hasRedirected.current = true;
          sessionStorage.setItem("startHandled", "true");

          // Не редиректим, если уже на нужной странице
          const targetPath = `/quiz/${roomId}?name=${name}`;
          if (location.pathname + location.search !== targetPath) {
            navigate(targetPath, { replace: true });
          }
        }
      }
    }
  }, [navigate, location]);


  return (
    <div style={{margin: "20px"}}>
      <div>
        <Link to="/room" className="font-display" style={{background: "#4E4C50", borderRadius: "5px", color: "white", height: "50px", fontSize: "13px", display: "flex", justifyContent: "center", alignItems: "center"}}>
            <svg style={{marginRight: "5px", marginTop: "2px"}} width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.4 9.09999C8.59833 9.09999 8.77053 9.02719 8.9166 8.88159C9.06267 8.73599 9.13547 8.56379 9.135 8.36499C9.13453 8.16619 9.06173 7.99423 8.9166 7.84909C8.77147 7.70396 8.59927 7.63093 8.4 7.62999C8.20073 7.62906 8.02877 7.7021 7.8841 7.84909C7.73943 7.99609 7.6664 8.16806 7.665 8.36499C7.6636 8.56193 7.73663 8.73413 7.8841 8.88159C8.03157 9.02906 8.20353 9.10186 8.4 9.09999ZM8.4 6.86C8.52833 6.86 8.64803 6.81333 8.7591 6.72C8.87017 6.62666 8.93713 6.50416 8.96 6.3525C8.98333 6.2125 9.0328 6.08416 9.1084 5.9675C9.184 5.85083 9.3212 5.69333 9.52 5.495C9.87 5.145 10.1033 4.86196 10.22 4.6459C10.3367 4.42983 10.395 4.1762 10.395 3.885C10.395 3.36 10.2111 2.93113 9.8434 2.5984C9.47567 2.26567 8.99453 2.09953 8.4 2.1C8.015 2.1 7.665 2.1875 7.35 2.3625C7.035 2.5375 6.78417 2.78833 6.5975 3.115C6.5275 3.23166 6.52167 3.35416 6.58 3.4825C6.63833 3.61083 6.7375 3.70416 6.8775 3.7625C7.00583 3.82083 7.13137 3.82666 7.2541 3.78C7.37683 3.73333 7.4788 3.65166 7.56 3.535C7.665 3.38333 7.7875 3.2697 7.9275 3.1941C8.0675 3.1185 8.225 3.08046 8.4 3.08C8.68 3.08 8.9075 3.15886 9.0825 3.3166C9.2575 3.47433 9.345 3.68713 9.345 3.955C9.345 4.11833 9.29833 4.27303 9.205 4.4191C9.11167 4.56516 8.94833 4.7488 8.715 4.97C8.37667 5.26166 8.16083 5.48636 8.0675 5.6441C7.97417 5.80183 7.91583 6.03213 7.8925 6.335C7.88083 6.475 7.9247 6.5975 8.0241 6.7025C8.1235 6.8075 8.2488 6.86 8.4 6.86ZM4.2 11.2C3.815 11.2 3.48553 11.063 3.2116 10.7891C2.93767 10.5152 2.80047 10.1855 2.8 9.79999V1.4C2.8 1.015 2.9372 0.685533 3.2116 0.4116C3.486 0.137667 3.81547 0.000466666 4.2 0H12.6C12.985 0 13.3147 0.1372 13.5891 0.4116C13.8635 0.686 14.0005 1.01547 14 1.4V9.79999C14 10.185 13.863 10.5147 13.5891 10.7891C13.3152 11.0635 12.9855 11.2005 12.6 11.2H4.2ZM4.2 9.79999H12.6V1.4H4.2V9.79999ZM1.4 14C1.015 14 0.685533 13.863 0.4116 13.5891C0.137667 13.3152 0.000466667 12.9855 0 12.6V3.5C0 3.30166 0.0672001 3.13553 0.2016 3.0016C0.336 2.86766 0.502133 2.80046 0.7 2.8C0.897867 2.79953 1.06423 2.86673 1.1991 3.0016C1.33397 3.13646 1.40093 3.3026 1.4 3.5V12.6H10.5C10.6983 12.6 10.8647 12.6672 10.9991 12.8016C11.1335 12.936 11.2005 13.1021 11.2 13.3C11.1995 13.4979 11.1323 13.6642 10.9984 13.7991C10.8645 13.934 10.6983 14.0009 10.5 14H1.4Z" fill="white"/>
            </svg>
            <p>КАК РАЗДЕЛИТЬ ДОЛИ В ПАРТНЕРСТВЕ?</p>
        </Link>

        <div className="font-display" style={{marginTop: "10px", background: "#F1EEDB", borderRadius: "5px", color: "black", height: "50px", fontSize: "13px", display: "flex", justifyContent: "center", alignItems: "center"}}>
            <p>ЗАПИСАТЬСЯ НА РАЗБОР ПАРТНЕРСТВА</p>
        </div>
      </div>

      <div style={{marginTop: "20px"}}>
        <img style={{borderRadius: "5px"}} src="/img/site.webp" alt="Banner" loading="lazy" decoding="async" width="100%" height="auto" />
      </div>

      <div style={{display: "flex", justifyContent: "space-between", marginTop: "20px"}}>
        <img style={{borderRadius: "5px", width: "calc(50% - 5px)"}} src="/img/podcast1.webp" alt="Banner" loading="lazy" decoding="async" />
        <img style={{borderRadius: "5px", width: "calc(50% - 5px)"}} src="/img/podcast2.webp" alt="Banner" loading="lazy" decoding="async" />
      </div>

    </div>
  )
}

export default Home