const express = require('express')
const projectController = require('../controllers/projectController')
const router = express.Router()

router.get("/:id", projectController.getProject)
router.put("/:id", projectController.saveProject)

module.exports = router