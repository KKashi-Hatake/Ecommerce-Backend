import { NextFunction, Request, Response } from "express";
import ErrorHandler from '../utils/utility-class.js'
import { ControllerType } from "../types/types.js";



export const errorMiddleware = (err:ErrorHandler,
    req:Request, res:Response, next:NextFunction)=>{
        err.message ||= "Interanl Server Error";
        err.statusCode ||= 500;
        if(err.name === 'CastError') err.message = "Invalid ID";
        return res.status(400).json({
            sucess:false,
            message:err.message
        })
    }



export const TryCatch =(func: ControllerType)=>(req:Request, res:Response,next:NextFunction)=>{
    try {
        func(req,res,next);
    } catch (error) {
        next(error);
    }
}