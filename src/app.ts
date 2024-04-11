import express from "express";
import NodeCache from "node-cache";
import { config } from "dotenv";
import Stripe from "stripe";
import cors from "cors";
import morgan from "morgan";

// Importing Routes
import userRoute from "./routes/user.route.js";
import productRoute from "./routes/product.route.js";
import orderRoute from "./routes/order.route.js";
import paymentRoute from "./routes/payment.route.js";
import dashboardRoute from "./routes/stats.route.js";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";

config({
  path: "./.env",
});

connectDB();

const stripeKey = process.env.STRIPE_KEY || "";
const port = process.env.PORT || 4000;

export const stripe = new Stripe(stripeKey);
export const nodeCache = new NodeCache();

const app = express();

app.use(express.json());
app.use(morgan("dev"));
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["POST", "GET", "PUT", "DELETE"],
  })
);

app.use("/api/v1/user", userRoute);
app.use("/api/v1/product", productRoute);
app.use("/api/v1/order", orderRoute);
app.use("/api/v1/payment", paymentRoute);
app.use("/api/v1/dashboard", dashboardRoute);

app.get("/", (_, res) => {
  res.send("API is working!!");
});

app.use("/upload", express.static("upload"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
