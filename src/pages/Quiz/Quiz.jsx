// import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from "react-router-dom";
// import axios from '../../api/axios';
// import text from './text.js'


const Quiz = () => {
    const { roomId } = useParams();

    
    const [searchParams] = useSearchParams();
    const name = searchParams.get("name") || "Guest";

//     const [room, setRoom] = useState(null);

//     useEffect(() => {
//         axios.get(`/api/rooms/${roomId}`)
//         .then(response => {
//             setRoom(response.data);
//         })
//         .catch(error => {
//             console.error('Ошибка при загрузке комнаты:', error);
//         });
//   }, [roomId]);

//   console.log(room.members, name)

  return (
    <div>
        {roomId} {name}
    </div>
  )
}

export default Quiz
