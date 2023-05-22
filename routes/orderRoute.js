const express = require("express");
const { newOrder, getSingleOrder, myOrders, getAllOrders, updateOrder, deleteOrders } = require("../controllers/orderController");
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles} = require("../middleware/auth");

router.route("/order/new").post(isAuthenticatedUser, newOrder)
router.route("/order/:id").get(isAuthenticatedUser,authorizeRoles("admin"), getSingleOrder);
router.route("/orders/me").get(isAuthenticatedUser, myOrders)
router.route("/admin/order").get(isAuthenticatedUser, authorizeRoles("admin"), getAllOrders);
router.route("/admin/order/:id")
.put(isAuthenticatedUser, authorizeRoles("admin"), updateOrder)
.delete(isAuthenticatedUser, authorizeRoles("admin"), deleteOrders)
module.exports = router
