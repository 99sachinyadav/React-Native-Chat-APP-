import express from 'express';
import http from "http";
import cors from "cors";
import dotenv from 'dotenv';
import connectDB from './config/db';
import router from './routes/auth.routes';
import { initializeSocket } from './socket/socket';

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api/auth',router);

app.get("/",(req,res)=>{
     res.send("Server is running");
})

const PORT =Number(process.env.PORT)|| 3000;


const server = http.createServer(app);

// listen socket event
// console.log("hello")
initializeSocket(server);
// console.log("hello2");
connectDB().then(()=>{
    server.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server is listning on port ${PORT}`)
})

}).catch((error)=>{
    console.log("Failed to start server due to the database connection error:",error);
})


