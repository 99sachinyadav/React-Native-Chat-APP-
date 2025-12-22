import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../model/Conversation";
import Message from "../model/Message";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {
  socket.on("getConversations", async () => {
    // console.log("getConversation evet");
    try {
      const userid = socket.data.userId;
      if (!userid) {
        return socket.emit("getConversations", {
          sucess: false,
          msg: "Unauthorized",
        });
      }
      // find all participants

      const conversation = await Conversation.find({
        participants: userid,
      })
        .sort({ updatedAt: -1 })
        .populate({
          path: "lastMessage",
          select: "content senderId attachment createdAt",
        })
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .lean();

      socket.emit("getConversations", {
        success: true,
        data: conversation,
      });
    } catch (error: any) {
      console.log("getConversation error", error);
      socket.emit("getConversation", {
        success: false,
        msg: "Failed to fetch conversations",
      });
    }
  });
  socket.on("newConversation", async (data) => {
    // console.log("newConversation event", data);
    try {
      if (data.type == "direct") {
        const existingConversation = await Conversation.findOne({
          type: "direct",
          participants: { $all: data.participants, $size: 2 },
        })
          .populate({
            path: "participants",
            select: "name avatar email",
          })
          .lean();
        if (existingConversation) {
          socket.emit("newConversation", {
            success: true,
            data: { ...existingConversation, isNew: false },
          });
          return;
        }
      }

      //  creaate new conversation

      const conversation = await Conversation.create({
        type: data.type,
        participants: data.participants,
        name: data.name || "",
        avatar: data.avatar || "",
        createdBy: socket.data.userId,
      });

      // get all connected user connected
      const connectedSocket = Array.from(io.sockets.sockets.values()).filter(
        (s) => data.participants.includes(s.data.userId)
      );
      // join all online user out of connected user
      connectedSocket.forEach((participantSocket) => {
        participantSocket.join(conversation._id.toString());
      });
      //  send conversation data to all
      const populatedConversation = await Conversation.findById(
        conversation._id
      )
        .populate({
          path: "participants",
          select: "name avatar email",
        })
        .lean();

      if (!populatedConversation) {
        throw new Error("Failed to populate conversations");
      }

      // emit conversation to all participants

      io.to(conversation._id.toString()).emit("newConversation", {
        success: true,
        data: { ...populatedConversation, isNew: true },
      });
    } catch (error) {
      console.log("newConversation error", error);
      socket.emit("newConversation", {
        success: false,
        msg: "Failed to create conversation",
      });
    }
  });

  socket.on("newMessage",async(data)=>{
    // console.log("newMessage event :",data);
    try {
        const message = await Message.create({
            conversationId:data.conversationId,
            senderId:data.sender.id,
            content:data.content,
            attachment:data.attachment

        })
        // send the message to all  the participantes of conversation
        // console.log(data.attachment)
        io.to(data.conversationId).emit("newMessage",{
            sucess:true,
            data:{
                id:message._id,
                content:data.content,
                sender:{
                    id:data.sender.id,
                    name:data.sender.name,
                    avatar:data.sender.avatar,
                },
                attachment:data.attachment,
                createdAt:new Date().toISOString(),
                conversationId:data.conversationId
            }
        })
        

        // update conversation in lastMessage

        await Conversation.findByIdAndUpdate(data.conversationId,{
            lastMessage:message._id
        })
    } catch (error) {
        console.log("newMessage error", error);
      socket.emit("newMessage", {
        success: false,
        msg: "Failed to create conversation",
      });
    }
  })


  socket.on("getMessage",async(data:{conversationId:string})=>{
    // console.log("getMessage event :",data);
    try {
         const messages = await Message.find({
            conversationId:data.conversationId,
         })
         .sort({createdAt:-1})
         .populate<{ senderId:{_id:string;name:string;avatar:string}}>({
            path:"senderId",
            select:"name avatar"
         }).lean();
        // console.log("message",messages)
         const messageWithSender = messages.map((message)=>({
            ...message,
            id:message._id,
            attachment:message.attachment,
            sender:{
                id:message.senderId._id,
                name:message.senderId.name,
                avatar:message.senderId.avatar,
            }
         }))
        //  console.log(messageWithSender)
         socket.emit("getMessage",({
            success:true,
            data:messageWithSender
         }))
     
    } catch (error) {
        console.log("getMessage error", error);
      socket.emit("getMessage", {
        success: false,
        msg: "Failed to Fetch history message",
      });
    }
  })
}
