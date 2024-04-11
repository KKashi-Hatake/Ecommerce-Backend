import mongoose, { Document } from "mongoose";
import { InvalidateCacheType, OrderItemsType } from "../types/types.js";
import { Product } from "../models/product.model.js";
import { nodeCache } from "../app.js";

export const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGO_URI!);
    console.log("Database connected on host", connect.connection.host);
  } catch (error) {
    console.log("Error in DB connection file: ", error);
    process.exit(1);
  }
};

export const InvalidateCache = ({
  product,
  admin,
  order,
  userId,
  orderId,
  productId,
}: InvalidateCacheType) => {
  if (product) {
    const productkeys = ["latest-product", "categories", "all-products"];
    if (typeof productId === "string") productkeys.push(`product-${productId}`);
    if (typeof productId === "object")
      productId.forEach((i) => productkeys.push(`product-${i}`));

    nodeCache.del(productkeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];
    nodeCache.del(orderKeys);
  }
  if (admin) {
    nodeCache.del(["admin-stats","admin-pie-chart","admin-bar-chart","admin-line-chart"])
  }
};

export const reduceStock = async (orderItems: OrderItemsType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) return thisMonth * 100;
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) => {
    let a: string = category as string;
    return Product.countDocuments({ category: a });
  });

  const categoriesCount = await Promise.all(categoriesCountPromise);
  const categoryCount: Record<string, number>[] = [];
  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });
  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?:number;
  total?:number;
}
export const getChartData = ({
  length,
  docArr,
  today,
  property
}: {
  length: number;
  docArr: MyDocument[];
  today:Date;
  property?:string;
}) => {;
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    if (monthDiff < length) {
      data[length - monthDiff - 1] += property?i.discount!:1;
    }
  });
  return data;
};
