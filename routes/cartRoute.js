const router = require('express').Router();
const cartController = require('../controller/cartController');

router.post("/add", cartController.addToCart )
router.get("/getcart/:userId", cartController.getCart )
router.delete("/delete", cartController.deleteCartItem )
router.post("/clear",cartController.clearCart); 
router.put("/update", cartController.updateCartItem);


module.exports = router;