import User from "../model/User";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { generateToken } from "../utils/token";
 

export const  registerUser = async (req:Request,res:Response): Promise<void> => {
    const {email,password,name,avatar} = req.body;
//   console.log("Register request body:", req.body);
    try {
        if(!email || !password || !name ){
            res.status(400).json({message:"Please provide all required fields"});
            return;
        }
        let existedUser = await  User.findOne({email: email.toLowerCase().trim()});
        if(existedUser){
            res.status(409).json({message:"User with this email already exists"});
            return;
        }
        const hashedPassword = await bcrypt.hash(password, 10);
       const user = new User({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            name,
            avatar:avatar || '',
        });
        await user.save();
        res.status(201).json({sucess:true, token:generateToken(user), message:"User registered successfully"});
    } catch (error) {
        console.log("Error in registerUser:", error);
        res.status(500).json({message:"Internal server error",error});
    }
}
export const  loginUser = async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            res.status(400).json({ message: "Please provide email and password" });
            return;
        }

        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        const token = generateToken(user);
        res.status(200).json({ message: "Login successful", user, token: token });
    } catch (error) {
        console.log("Error in loginUser:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
}