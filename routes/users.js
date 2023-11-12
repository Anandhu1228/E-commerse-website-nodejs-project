var express = require('express');
var router = express.Router();
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const session = require('express-session');
const { log } = require('handlebars');
const verifyLogin = (req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let uber=req.session.user
  cartCount = null
  if(req.session.user){
    cartCount =await userHelpers.getCartCount(req.session.user._id)
  }
  
  productHelpers.getAllProducts().then((products)=>{
    res.render('user/view-products',{showHeader: true,products,uber,cartCount})
  })
});
router.get('/login',(req,res)=>{
  if(req.session.userLoggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{"LoginERROR":req.session.userLoginErr})
    req.session.userLoginErr = false
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup',{ showHeader: false })
})
router.post('/signup',(req,res)=>{
  
  userHelpers.doSignup(req.body).then((response)=>{
    let id = response;
    let image=req.files.Image
    image.mv('./public/user-images/'+id+'.jpg',(err)=>{
      if(!err){ 
        console.log(response);
        res.render('user/login',{showHeader: false })
      }else{
        console.log(err);
      }
    })
  })
})
router.post('/login',(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.userLoggedIn = true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.userLoginErr = "Invalid Username or Password"
      res.redirect('/login')
    }
  }) 
})
router.get('/logout',(req,res)=>{
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });

})

router.get('/cart',verifyLogin,async(req,res)=>{
  let uber=req.session.user
  let cartproduct =await userHelpers.getCartProducts(req.session.user._id)
  let totalValue = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/cart',{showHeader: true,cartproduct,uber,totalValue})
})
router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log(req.body)
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.carttotal = await userHelpers.getTotalAmount(req.session.user._id)
    res.json(response) 
  })
})
router.post('/delete-product-form-cart',(req,res,next)=>{
  userHelpers.deletecartProduct(req.body).then((response)=>{
    res.json(response)
  })
})
router.get('/place-order',verifyLogin,async(req,res)=>{
  let uber=req.session.user
  total = await userHelpers.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user,uber})
})
router.post('/place-order',async(req,res)=>{
  let cproducts = await userHelpers.getCartProductList(req.body.userId)
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId)
  userHelpers.placeOrder(req.body,cproducts,totalPrice).then((orderID)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codsuccess:true})
    }else{
      userHelpers.generateRazorpay(orderID,totalPrice).then((response)=>{
        res.json(response)
      })
    }
  })
})
router.get('/profile',verifyLogin, async (req, res) => {
  let uber=req.session.user
  if (req.session && req.session.user) {
    const profile = await userHelpers.getProfile(req.session.user._id);
    res.render('user/profile', { showHeader: true,user: req.session.user,profile,uber});
  } else {
    res.redirect('/login')
  }
})
router.get('/edit-profile/:id',verifyLogin,async(req,res)=>{
  let user = await userHelpers.getProfileDetails(req.params.id)
  res.render('user/edit-profile',{user})
})
router.post('/edit-profile/:id',(req,res)=>{
  userHelpers.updateProfile(req.params.id,req.body).then(()=>{
    res.redirect('/profile')
    let image=req.files.Image
    if(req.files.Image){
      image.mv('./public/user-images/'+req.params.id+'.jpg')
    }
  })
})

router.get('/order-success',verifyLogin,(req,res)=>{
  let uber=req.session.user
  res.render('user/order-success',{user:req.session.user,uber})
})
router.get('/orders',verifyLogin, async (req, res) => {
  let uber=req.session.user
  if (req.session && req.session.user) {
    const orders = await userHelpers.getUserOrders(req.session.user._id);
    res.render('user/orders', { showHeader: true,user: req.session.user,orders,uber });
  } else {
    res.redirect('/login')
  }
});

router.get('/view-order-products/:id',verifyLogin,async(req,res)=>{
  let uber=req.session.user
  let products = await userHelpers.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products,uber})
})
router.post('/verify-payment',(req,res)=>{
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment successful")
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err)
    res.json({status:false})
  })
})
router.get('/order-fail',(req,res)=>{
  let uber=req.session.user
  res.render('user/order-fail',{user:req.session.user,uber})
})
router.get('/updateuserpass/:id',verifyLogin,async(req,res)=>{
  let User = await userHelpers.getProfileDetails(req.params.id)
  res.render('user/updateuserpassword',{User})
})
router.post('/updateuserpass/:id',async(req,res)=>{
  let User = await userHelpers.getProfileDetails(req.params.id)
  console.log(User)
  userHelpers.updateUPass(User,req.body).then((response)=>{
    if(response.status){
      res.redirect('/profile')
      console.log("password updated successfully")
    }else{
      console.log("Password Mismatch")
    }
  })
})
router.get('/recoverpass',async(req,res)=>{
  let User = await userHelpers.getProfileDetails()
  res.render('user/recoverpass',{User})
})
router.post('/recoverpass',(req,res)=>{
  userHelpers.doRecoveruserpass(req.body).then((response)=>{
    if(response.status){
      res.redirect('/login');
    }else{
      console.log('password mismatch')
    }
  }) 
})

module.exports = router;