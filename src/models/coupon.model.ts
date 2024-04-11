import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, "Please add coupon"],
    unique: true,
  },
  amount: {
    type: Number,
    required: [true, "Please add the discount amount"],
  },
});

export const Coupon = mongoose.model("Coupon", couponSchema);
