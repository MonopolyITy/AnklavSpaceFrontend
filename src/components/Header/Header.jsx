import React from 'react'
import "./Header.css"
import { ReactComponent as Logo } from './logo.svg';
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <div className="header">
      <Link to={"/"} style={{ marginTop: "7px" }}>
        <Logo />
      </Link>
      <div style={{ marginLeft: "15px" }}>
        <p className='font-display' style={{ fontSize: "14px" }}>ANKLAV SPACE</p>
        <p style={{ fontSize: "11px", opacity: "0.8" }}>
          Укрепите бизнес через ясность в ролях,<br />долях и ответственности
        </p>
      </div>
    </div>
  )
}

export default Header