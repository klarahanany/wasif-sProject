const Router = require('express')
const router = Router()
const authController = require('../controllers/authController')
const {render} = require("ejs");
router.get('/signup', authController.signup_get)
router.get('/forgotPass', authController.forgotPass_get)

router.post('/signup', authController.signup_post)

router.get('/login', authController.login_get)

router.post('/login', authController.login_post)

router.get('/logout', authController.logout_get)

router.get('/loginError' ,(req,res)=>{
    res.render('loginError')
})
router.post('/forgotPass', authController.forgetPass_post)
router.get('/resetPass/:id/:token', authController.resetPassword_get)
router.post('/resetPass/:id/:token', authController.resetPassword_post)

module.exports = router