const router = require("express").Router()
const userController = require("../controller/userController")

router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile/:id", userController.getProfile);
router.put("/update/:id", userController.updateProfile);
router.get("/allusers", userController.allUser);
router.get("/logactivities", userController.getLoginActivities);
router.delete("/logactivity/:id", userController.deleteLoginActivity);

module.exports = router


// const router = require("express").Router();
// const userController = require("../controller/userController");
// const csurf = require("csurf");

// // CSRF protection
// const csrfProtection = csurf({ cookie: true });

// router.post("/register", csrfProtection, userController.register);
// router.post("/login", csrfProtection, userController.login);
// router.get("/profile/:id", csrfProtection, userController.getProfile);
// router.put("/update/:id", csrfProtection, userController.updateProfile);
// router.get("/allusers", csrfProtection, userController.allUser);
// router.get("/logactivities", csrfProtection, userController.getLoginActivities);
// router.delete("/logactivity/:id", csrfProtection, userController.deleteLoginActivity);

// module.exports = router;
