import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { NewOrderRequestBody } from "../types/types.js";
import { Order } from "../models/order.model.js";
import { InvalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { nodeCache } from "../app.js";


export const newOrder = TryCatch(
  async (
    req: Request<{}, {}, NewOrderRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      shippingInfo,
      shippingCharges,
      status,
      subtotal,
      tax,
      total,
      discount,
      orderItems,
      user,
    } = req.body;

    if (
      !shippingInfo ||
      !shippingCharges ||
      !status ||
      !subtotal ||
      !tax ||
      !total ||
      !discount ||
      !orderItems ||
      !user
    ) {
      console.log('here')
      next(new ErrorHandler("Please enter all fields", 400));
    }

    await Order.create({
      shippingInfo,
      shippingCharges,
      status,
      subtotal,
      tax,
      total,
      discount,
      orderItems,
      user,
    });
    await reduceStock(orderItems);
    InvalidateCache({
      order: true,
      product: true,
      admin: true,
      userId: user,
      productId: orderItems.map((i) => String(i.productId)),
    });
    res.status(201).json({
      success: true,
      message: "Order Placed Successfully",
    });
  }
);

export const myOrders = TryCatch(async (req, res, next) => {
  const user = req.query.id as string;
  let orders;
  if (nodeCache.has(`my-orders-${user}`))
    orders = JSON.parse(nodeCache.get(`my-orders-${user}`) as string);
  else {
    orders = await Order.find({ user });
    nodeCache.set(`my-orders-${user}`, JSON.stringify(orders));
  }
  res.status(200).json({
    success: true,
    orders
  });
});

export const allOrders = TryCatch(async (req, res, next) => {
  let orders=[];
  if (nodeCache.has(`all-orders`))
    orders = JSON.parse(nodeCache.get(`all-orders`) as string);
  else {
    orders = await Order.find().populate("user", "name");
    nodeCache.set(`all-orders`, JSON.stringify(orders));
  }
  res.status(200).json({
    success: true,
    orders,
  });
});

export const getSingleOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  let order;
  if (nodeCache.has(`order-${id}`))
    order = JSON.parse(nodeCache.get(`order-${id}`) as string);
  else {
    order = await Order.findById(id).populate("user", "name");
    if (!order) next(new ErrorHandler("Order Not Found", 404));
    nodeCache.set(`order-${id}`, JSON.stringify(order));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

export const processOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not found", 404));
  switch (order.status) {
    case "Processing":
      order.status = "Shipped";
      break;
    case "Shipped":
      order.status = "Delivered";
      break;
    default:
      order.status = "Delivered";
      break;
  }
  await order.save();
  InvalidateCache({
    order: true,
    product: false,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });
  res.status(200).json({
    success: true,
    message: "Order Processed Successfully",
  });
});

export const deleteOrder = TryCatch(async (req, res, next) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  if (!order) return next(new ErrorHandler("Order Not found", 404));

  await order.deleteOne();
  InvalidateCache({
    order: true,
    product: false,
    admin: true,
    userId: order.user,
    orderId: String(order._id),
  });
  res.status(200).json({
    success: true,
    message: "Order Deleted Successfully",
  });
});
