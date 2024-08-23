const express = require('express')
const homeController = require('../controllers/homeController')
const router = express.Router()

router.post("/login", homeController.logIn)
router.post("/signup", homeController.signUp)

module.exports = router