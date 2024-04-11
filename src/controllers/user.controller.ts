import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.model.js";
import { NewUserRequest } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";

export const newUser = TryCatch(
  async (
    req: Request<{}, {}, NewUserRequest>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, _id, dob } = req.body;
    let user = await User.findById(_id);
    if(user) return res.status(200).json({
      success:true,
      message:`Welcome, ${user.name}`,
    })

    if(!_id||!name||!email||!gender||!photo||!dob){
      return next(new ErrorHandler("Please add all fields", 400))
    }

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob,
    });

    return res.status(201).json({
      success: true,
      message: `Welcome ${user.name}`,
    });
  }
);


export const getAllUsers = TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
  const users = await User.find();
  res.status(200).json({
    success:true,
    users
  })
})


export const getUser = TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
  const {id} = req.params;
  const user = await User.findById(id);
  if(!user){
    return next(new ErrorHandler('Invalid Id', 400))
  }
  res.status(200).json({
    success:true,
    user
  })
})



export const deleteUser = TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
  const {id} = req.params;
  const user = await User.findById(id);
  if(!user){
    return next(new ErrorHandler('Invalid Id', 400))
  }
  await user.deleteOne();
  res.status(200).json({
    success:true,
    message:"User deleted"
  })
})