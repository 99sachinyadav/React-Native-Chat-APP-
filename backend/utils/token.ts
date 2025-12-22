import { UserProps } from "../types";
import jwt from "jsonwebtoken";

export const generateToken = (user: UserProps) => {
    // console.log("Generating token for user:", user);
    const payload ={
        user:{
            id:user._id,
            name:user.name,
            email:user.email,
            avatar:user.avatar
        }
    }
    return jwt.sign(payload,process.env.JWT_SECRET as string,{expiresIn:'6h'});
}