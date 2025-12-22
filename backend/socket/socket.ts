import dotenv from "dotenv";

import { Socket, Server as SocketIOServer } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";
import { registerUserEvent } from "./userEvent";
import { registerChatEvents } from "./chatEvent";
import Conversation from "../model/Conversation";

dotenv.config();

export function initializeSocket(server: any): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
    },
  });
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    // console.log("mytoken",token)
    if (!token) {
      return next(new Error("Authentication error: no token Provided"));
    }

    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      (err: any, decoded: any) => {
        if (err) {
          return next(new Error("Authentication error:invalid token"));
        }
        let userData = decoded.user;
        socket.data = userData;
        socket.data.userId = userData.id;
        next();
      }
    );
  });
  io.on('connection',async (socket:Socket)=>{
    const userId = socket.data.userId;
    console.log(`user connected with ${userId} , username :${socket.data.name}`)
   registerChatEvents(io,socket);
  registerUserEvent(io,socket);
  // join all the conversations the user is part of  rome

  try {
    const conversations = await Conversation.find({
      participants:userId,
    }).select("_id");

    conversations.forEach(conversation=>{
      socket.join(conversation._id.toString())
    })
    
  } catch (error) {
    console.log("Error joining conversations:",error)
  }

    socket.on('disconnect',()=>{
        console.log(`user disconnected with ${userId}  `)
    })
  })
  return io;
}
