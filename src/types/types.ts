import { NextFunction, Request, Response } from "express";

export interface NewUserRequest {
  name: string;
  email: string;
  photo: string;
  gender: string;
  _id: string;
  dob: Date;
}

export interface NewProductRequest {
  name: string;
  category: string;
  price: number;
  stock: number;
}

export type ControllerType = (
  req: Request<any>,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export type BaseQuery = {
  price?: { $lte: number };
  category?: string;
  name?: {
    $regex: string;
    $options: string;
  };
};


export type InvalidateCacheType ={
  product?:boolean;
  admin?:boolean;
  order?:boolean;
  userId?:string;
  orderId?:string;
  productId?:string | string[];
}

export type OrderItemsType = {
  name:string;
  photo:string;
  productId:string;
  price:number;
  quantity:number;
}

export type ShippingInfoType = {
  address:string;
  city:string;
  state:string;
  pincode:number;
  country:string;
}

export type NewOrderRequestBody = {
  shippingInfo:ShippingInfoType;
  user:string;
  subtotal:number;
  tax:number;
  shippingCharges:number;
  discount:number;
  total:number;
  status:string;
  orderItems:OrderItemsType[];
}