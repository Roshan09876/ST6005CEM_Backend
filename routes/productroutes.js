const router = require("express").Router()
const productController = require("../controller/productController");
const { authGuardAdmin } = require("../middleware/authguard");

router.post("/create", productController.createProduct);
router.get("/getallproduct", productController.getallProduct);
router.delete("/delete/:id", productController.deleteProductById);
router.put("/update/:id",authGuardAdmin, productController.updateProduct);
router.get("/product/:id", productController.getProductById);

module.exports = router