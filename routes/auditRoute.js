const router = require("express").Router()
const auditController = require("../controller/auditController");
const { authGuard } = require("../middleware/authguard");

router.get('/logs', authGuard, auditController.getAuditLogs);

module.exports = router