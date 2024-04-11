import { log } from "console";
import { nodeCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import {
  calculatePercentage,
  getChartData,
  getInventories,
} from "../utils/features.js";

export const getDashboardStats = TryCatch(async (req, res, next) => {
  let stats = {};
  if (nodeCache.has("admin-stats"))
    stats = JSON.parse(nodeCache.get("admin-stats") as string);
  else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const thisMonth = {
      start: new Date(today.getFullYear(), today.getMonth(), 1),
      end: today,
    };
    const lastMonth = {
      start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      end: new Date(today.getFullYear(), today.getMonth(), 0),
    };
    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });
    const thisMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });
    const thisMonthProductsPromise = Product.find({
      createdAt: {
        $gte: thisMonth.start,
        $lte: thisMonth.end,
      },
    });
    const lastMonthProductsPromise = Product.find({
      createdAt: {
        $gte: lastMonth.start,
        $lte: lastMonth.end,
      },
    });

    const lastSixMonthsOrdersPromise = Order.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    const latestTransactionPromise = Order.find()
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);

    const [
      lastMonthOrders,
      lastMonthProducts,
      lastMonthUsers,
      thisMonthOrders,
      thisMonthProducts,
      thisMonthUsers,
      lastSixMonthsOrders,
      productsCount,
      usersCount,
      allOrders,
      categories,
      femaleUsersCount,
      latestTransaction,
    ] = await Promise.all([
      lastMonthOrdersPromise,
      lastMonthProductsPromise,
      lastMonthUsersPromise,
      thisMonthOrdersPromise,
      thisMonthProductsPromise,
      thisMonthUsersPromise,
      lastSixMonthsOrdersPromise,
      Product.countDocuments(),
      User.countDocuments(),
      Order.find().select("total"),
      Product.distinct("category"),
      User.countDocuments({ gender: "female" }),
      latestTransactionPromise,
    ]);

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );

    const revenue = allOrders.reduce(
      (total, order) => total + (order.total || 0),
      0
    );
    const count = {
      user: usersCount,
      product: productsCount,
      order: allOrders.length,
      revenue
    };

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthlyRevenue = new Array(6).fill(0);

    lastSixMonthsOrders.forEach((order) => {
      const creationDate = order.createdAt;
      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
      if (monthDiff < 6) {
        orderMonthCounts[6 - monthDiff - 1] += 1;
        orderMonthlyRevenue[6 - monthDiff - 1] += order.total;
      }
    });

    const changePercent = {
      revenue: calculatePercentage(thisMonthRevenue, lastMonthRevenue),
      product: calculatePercentage(
        thisMonthProducts.length,
        lastMonthProducts.length
      ),
      user: calculatePercentage(
        thisMonthUsers.length,
        lastMonthUsers.length
      ),
      order: calculatePercentage(
        thisMonthOrders.length,
        lastMonthOrders.length
      ),
    };
    
    const a: string[] = categories as string[];
    const categoriesCount = await getInventories({
      categories: a,
      productsCount,
    });

    const userRatio = {
      male: usersCount - femaleUsersCount,
      female: femaleUsersCount,
    };
    const modifiedLatestTransactions = latestTransaction.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.total,
      quantity: i.orderItems.length,
      status: i.status,
    }));
    stats = {
      categoriesCount,
      changePercent,
      count,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthlyRevenue,
      },
      userRatio,
      latestTransaction: modifiedLatestTransactions,
    };
    nodeCache.set("admin-stats", JSON.stringify(stats));
  }

  return res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieChart = TryCatch(async (req, res, next) => {
  let charts;
  if (nodeCache.has("admin-pie-chart")) charts = JSON.parse(nodeCache.get("admin-pie-chart") as string)
  else {
    const [
      ProcessingOrder,
      shippedOrder,
      deliveredOrder,
      categories,
      productsCount,
      productOutOfStock,
      allOrders,
      allUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Delivered" }),
      Product.distinct("category"),
      Product.countDocuments(),
      Product.countDocuments({ stock: 0 }),
      Order.find().select([
        "total",
        "discount",
        "subtotal",
        "tax",
        "shipingCharges",
      ]),
      User.find().select("dob"),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);

    const grossIncome = allOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );
    const discount = allOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );
    const productionCost = allOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );
    const burnt = allOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
    const marketingCost = Math.round(grossIncome * (30 / 100));
    const netMargin =
      grossIncome - discount - marketingCost - productionCost - burnt;
    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };

    const orderFullfillment = {
      processing: ProcessingOrder,
      shipped: shippedOrder,
      delivered: deliveredOrder,
    };

    const productCategories = await getInventories({
      categories,
      productsCount,
    });

    const stockAvailability = {
      inStock: productsCount - productOutOfStock,
      outOfStock: productOutOfStock,
    };
    const usersAgeGroup = {
      teen: allUsers.filter((i) => i.age < 20).length,
      old: allUsers.filter((i) => i.age >= 20 && i.age < 40).length,
      adult: allUsers.filter((i) => i.age >= 40).length,
    };
    const adminCustomer = {
      admin: adminUsers,
      customer: customerUsers,
    };
    charts = {
      orderFullfillment,
      productCategories,
      stockAvailability,
      revenueDistribution,
      adminCustomer,
      usersAgeGroup,
    };
    nodeCache.set("admin-pie-chart", JSON.stringify(charts));
  }
  res.status(200).json({
    success: true,
    charts,
  });
});

export const getBarChart = TryCatch(async (req, res, next) => {
  let charts;
  if (nodeCache.has("admin-bar-chart"))
    charts = JSON.parse(nodeCache.get("admin-bar-chart") as string);
  else {
    const today = new Date();
    const sixMonthsAgo = today.getMonth() - 6;
    const twelveMonthsAgo = today.getMonth() - 12;
    const lastSixMonthProductsPromise = Product.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const lastSixMonthUsersPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const twelveMonthOrdersPromise = Order.find({
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const [products, users, orders] = await Promise.all([
      lastSixMonthProductsPromise,
      lastSixMonthUsersPromise,
      twelveMonthOrdersPromise,
    ]);

    const productsCount = getChartData({ length: 6, today, docArr: products });
    const UsersCount = getChartData({ length: 6, today, docArr: users });
    const OrdersCount = getChartData({ length: 12, today, docArr: orders });

    charts = {
      products: productsCount,
      users: UsersCount,
      orders: OrdersCount,
    };
    nodeCache.set("admin-bar-chart", JSON.stringify(charts));
  }
  res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineChart = TryCatch(async (req, res, next) => {
  let charts;
  if (nodeCache.has("admin-line-chart"))
    charts = JSON.parse(nodeCache.get("admin-line-chart") as string);
  else {
    const today = new Date();
    const twelveMonthsAgo = today.getMonth() - 12;
    const basequery = {
      createdAt: {
        $gte: twelveMonthsAgo,
        $lte: today,
      },
    };

    const [products, users, orders] = await Promise.all([
      Product.find(basequery).select("createdAt"),
      User.find(basequery).select("createdAt"),
      Order.find(basequery).select(["createdAt","discount","total"]),
    ]);

    const productsCount = getChartData({ length: 12, today, docArr: products });
    const UsersCount = getChartData({ length: 12, today, docArr: users });
    const discount = getChartData({ length: 12, today, docArr: orders, property:"discount" });
    const revenue = getChartData({ length: 12, today, docArr: orders, property:"total" });

    charts = {
      products: productsCount,
      users: UsersCount,
      discount,
      revenue
    };

    nodeCache.set("admin-line-chart", JSON.stringify(charts));
  }
  res.status(200).json({
    success: true,
    charts,
  });
});
