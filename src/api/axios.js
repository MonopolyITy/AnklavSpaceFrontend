import axios from 'axios';

// // Local
// const instance = axios.create({
//     baseURL: 'http://localhost:8000'
// });

// Server
const instance = axios.create({
    baseURL: 'https://dommusie.space'
});

export default instance;