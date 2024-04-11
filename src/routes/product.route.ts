import { Router } from "express";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";

const app = Router();

// route - /api/v1/product/new
app.post("/new", adminOnly, singleUpload, newProduct);

// route - /api/v1/product/all
app.get("/all", getAllProducts);

// route - /api/v1/product/latest
app.get("/latest", getLatestProducts);
// route - /api/v1/product/categories
app.get("/categories", getAllCategories);
// route - /api/v1/product/admin-products
app.get("/admin-products", adminOnly, getAdminProducts);

app
  .route("/:id")
  .get(getSingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default app;
