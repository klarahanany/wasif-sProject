const Router = require('express')
const router = Router()
const authController = require('../controllers/authController')
const {render} = require("ejs");
router.get('/signup', authController.signup_get)

router.post('/signup', authController.signup_post)

router.get('/login', authController.login_get)
router.get('/admin/login', authController.adminLogin_get)

router.post('/login', authController.login_post)

router.get('/logout', authController.logout_get)

router.get('/loginError' ,(req,res)=>{
    res.render('loginError')
})
module.exports = router