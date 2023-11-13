var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
const productHelpers = require('../helpers/product-helpers');
const { response } = require('../app');
const superHelpers = require('../helpers/super-helpers');
const verifyLogin = (req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  }else{
    res.redirect('/admin/adminlogin')
  }
}


router.get('/',(req, res, next)=> {
  res.render('admin/adminroot',{showAeder:false})
});
router.get('/add-product',verifyLogin,function(req,res){
  let aber = req.session.admin
  res.render('admin/add-product',{Admin:true,aber,showAeder:true})
})
router.get('/adminlogin',(req,res)=>{
  if(req.session.userLoggedIn){
    res.redirect('/admin/view-product')
  }else{
    res.render('admin/adminlogin',{"LoginERROR":req.session.adminLoginErr,Admin:true,showSeader: false})
    req.session.userLoginErr = false
  }
})


router.post('/view-product',(req,res)=>{
  productHelpers.doadminLogin(req.body).then((response)=>{
    if(response.status){
      req.session.adminLoggedIn = true
      req.session.admin=response.admin
      let aber = req.session.admin
      productHelpers.getAllProducts(req.session.admin._id).then((products) => {
        res.render('admin/view-products', { Admin: true, aber, products, showAeder: true });
      });
    }else{
      req.session.adminLoginErr = "Invalid Username or Password"
      res.redirect('/admin/adminlogin')
    }
  }) 
})
router.get('/adminlogout',(req,res)=>{
  req.session.destroy(err => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/admin');
    }
  });
})

router.post('/add-product', (req, res) => {
  let AdmiN = req.session.admin._id
  let aber = req.session.admin
  productHelper.addProduct(req.body,AdmiN).then((id) => {
      let image = req.files.Image;
      return new Promise((resolve, reject) => {
        image.mv('./public/product-images/' + id + '.jpg', (err) => {
          if (!err) {
            resolve();
          } else {
            reject(err);
          }
        });
      });
    }).then(() => {
      res.render("admin/add-product",{ Admin: true,aber,showAeder:true });
    }).catch((err) => {
      console.log(err);
    });
});
router.get('/view-product',(req,res)=>{
  let adminId = req.session.admin._id;
  let aber = req.session.admin
  console.log(adminId)
    productHelpers.getAllProducts(adminId).then((products) => {
      res.render('admin/view-products', {Admin: true, products,aber,showAeder:true });
  }); 
})
router.get('/delete-product/:id',(req,res)=>{
  let prodId = req.params.id
  productHelpers.deleteProduct(prodId).then((response)=>{
    res.redirect('/admin/view-product')
  })
})
router.get('/edit-product/:id',async(req,res)=>{
  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product',{product,Admin:true,showAeder:true,})
})
router.post('/edit-product/:id',(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/view-product')
    
    if(req.files && req.files.Image){
      let image=req.files.Image
      image.mv('./public/product-images/'+req.params.id+'.jpg')
    } 
  })
})
router.get('/adminprofile',verifyLogin, async (req, res) => {
  let aber=req.session.admin
  console.log(req.body)
  if (req.session && req.session.admin) {
    const profile = await productHelpers.getadminProfile(req.session.admin._id);
    console.log(profile)
    res.render('admin/adminprofile',{showAeder:true,profile,aber,Admin:true})
  } else {
    res.redirect('/admin/adminlogin')
  }
})
router.get('/editadminprofile/:id',verifyLogin,async(req,res)=>{
  let Admin = await productHelpers.getadminProfileDetails(req.params.id)
  res.render('admin/editadminprofile',{Admin})
})
router.post('/editadminprofile/:id',(req,res)=>{
  productHelpers.updateadminProfile(req.params.id,req.body).then(()=>{
    res.redirect('/admin/adminprofile')
    
    if(req.files && req.files.Image){
      let image=req.files.Image
      image.mv('./public/admin-images/'+req.params.id+'.jpg')
    }
  })
}) 

router.get('/recoverpass',async(req,res)=>{
  let Admin = await productHelpers.getadminProfileDetails()
  res.render('admin/recoverpass',{Admin})
}) 
router.post('/recoverpass',(req,res)=>{
  productHelpers.doRecoveradminpass(req.body).then((response)=>{
    if(response.status){
      res.redirect('/admin/adminlogin');
    }else{
      console.log('password mismatch')
    }
  }) 
})
module.exports = router;
