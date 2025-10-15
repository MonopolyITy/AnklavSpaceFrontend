import React from 'react'
import { useParams, useSearchParams } from "react-router-dom";

const Quiz = () => {
    const { roomId } = useParams();

    // Достаём name из query (?name=Guest)
    const [searchParams] = useSearchParams();
    const name = searchParams.get("name") || "Guest";

  return (
    <div>
      {roomId} {name}
    </div>
  )
}

export default Quiz
