const express = require("express")
const dashboardController = require("../controllers/dashboardController")
const router = express.Router()

router.get("/:id", dashboardController.loadDashboard)
router.post("/:id/new-project", dashboardController.newProject)
router.get("/:id/logout", dashboardController.logOut)
router.delete("/:id/delete-project", dashboardController.deleteProject)

module.exports = router