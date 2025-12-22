import { Socket, Server as SocketIOServer } from "socket.io";
import User from "../model/User";
import { generateToken } from "../utils/token";

export function registerUserEvent(io: SocketIOServer, socket: Socket) {
  socket.on("testSocket", (data) => {
    socket.emit("testSocket", { msg: "its working!!!" });
  });

  socket.on(
    "updateprofile",
    async (data: { name?: string; avatar?: string }) => {
      // console.log("updateprofile event", data);

      const userid = socket.data.userId;
      if (!userid) {
        return socket.emit("updateprofile", {
          sucess: false,
          msg: "Unauthorized",
        });
      }
      try {
        const updatedUser = await User.findByIdAndUpdate(
          userid,
          { name: data.name, avatar: data.avatar },
          {
            new: true,
          }
        );
        if(!updatedUser){
           return socket.emit("updateprofile", {
          sucess: false,
          msg: "User not found",
        });
        }

        const newToken = generateToken(updatedUser);

        socket.emit('updateprofile',{
          sucess:true,
          data:{token:newToken},
          msg:"profile updated sucessfuliy"
        })
      } catch (error) {
        console.log("Error updating profile", error);
        socket.emit("updateprofile", {
          sucess: false,
          msg: "Error updating profile",
        });
      }
    }
  );
 socket.on("getContacts",async()=>{
   try {
      const userid = socket.data.userId;
      if (!userid) {
        return socket.emit("updateprofile", {
          sucess: false,
          msg: "Unauthorized",
        });
      }
      const user = await User.find(
        {_id:{$ne: userid}},
        {password:0}
      )
    .lean()

    const contacts = user.map((user)=>({
      id:user._id.toString(),
      name:user.name,
      email:user.email,
      avatar:user.avatar||"",
    }))
    socket.emit("getContacts",{
          success:true,
         data:contacts
        })
   } catch (error:any) {
        console.log("getContacts error ",error);
        socket.emit("getContacts",{
          success:false,
          msg:"Failed to fetch Contacts"
        })
   }
 })

}
