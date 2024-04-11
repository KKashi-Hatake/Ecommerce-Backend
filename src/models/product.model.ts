import mongoose, { mongo } from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Please enter Name"] },
    photo: {
      type: String,
      required: [true, "Please enter photo"],
    },
    price: {
      type: Number,
      required: [true, "Please enter Price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter Stock"],
    },
    category: {
      type: String,
      required: [true, "Please enter Category"],
      trim:true
    },
  },
  {
    timestamps: true,
  }
);

export const Product = mongoose.model("Product", productSchema);
