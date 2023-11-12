var express = require('express');
var router = express.Router();
var objectId = require('mongodb').ObjectId
const superHelpers = require('../helpers/super-helpers');
const { response } = require('../app');
const verifyLogin = (req,res,next)=>{
  if(req.session.superLoggedIn){
    next()
  }else{
    res.redirect('/superadmin/superlogin')
  }
}

router.get('/',(req, res, next)=>{
      res.render('superadmin/superroot',{showSeader: false})  
  });
router.get('/superlogin',(req,res)=>{
  if(req.session.userLoggedIn){
    res.redirect('/')
  }else{
    res.render('superadmin/superlogin',{"LoginERROR":req.session.superLoginErr,showSeader: false})
    req.session.userLoginErr = false
  }
})
router.post('/viewadmin',(req,res)=>{
    superHelpers.dosuperLogin(req.body).then((response)=>{
      if(response.status){
        req.session.superLoggedIn = true
        req.session.superuser=response.superuser
        res.redirect('/superadmin/viewadmin')
      }else{
        req.session.superLoginErr = "Invalid Username or Password"
        res.redirect('/superadmin/superlogin')
      }
    }) 
  })
  router.get('/superlogout',(req,res)=>{
    req.session.destroy(err => {
      if (err) {
        console.log(err);
      } else {
        res.redirect('/superadmin');
      }
    });
  })
router.get('/viewadmin',verifyLogin,async (req,res)=>{
  let suber = req.session.superuser
  let superAdmin = await superHelpers.getSuperinfo(suber._id)
  superHelpers.getAlladmin().then((admin)=>{
    res.render('superadmin/viewadmin',{showSeader: true,admin,superAdmin,suber,superadmin:true})
  })
})
router.get('/addadmin',verifyLogin,function(req,res){
  res.render('superadmin/addadmin',{superadmin:true,showSeader: true})
})
router.post('/addadmin',(req,res)=>{ 
  superHelpers.addadmin(req.body,(id)=>{
    image=req.files.Image
    image.mv('./public/admin-images/'+id+'.jpg',(err)=>{
      if(!err){
        res.redirect("/superadmin/addadmin")
      }else{
        console.log(err);
      }
    })
  });
})
router.get('/editadmin/:id',verifyLogin,async(req,res)=>{
  let Admin = await superHelpers.getAdminDetails(req.params.id)
  res.render('superadmin/editadmin',{Admin,admin:true,showSeader:true})
})
router.post('/editadmin/:id', (req, res) => {
  superHelpers.updateAdmin(req.params.id, req.body).then(() => {
    res.redirect('/superadmin/viewadmin');

    if (req.files && req.files.Image) {
      let image = req.files.Image;
      image.mv('./public/admin-images/' + req.params.id + '.jpg', (err) => {
        if (!err) {
          console.log('Image uploaded successfully');
        } else {
          console.log(err);
        }
      })
    }
  })
})
router.get('/deleteadmin/:id',verifyLogin,(req,res)=>{
  let adminId = req.params.id
  superHelpers.deleteAdmin(adminId).then((response)=>{
    res.redirect('/superadmin/viewadmin')
  })
})
router.get('/updateadminpass/:id',verifyLogin,async(req,res)=>{
  let Admin = await superHelpers.getAdminDetails(req.params.id)
  res.render('superadmin/updateadminpass',{Admin})
})
router.post('/updateadminpass/:id',async(req,res)=>{
  let Admin = await superHelpers.getAdminDetails(req.params.id)
  superHelpers.updateAPass(Admin,req.body).then((response)=>{
    if(response.status){
      res.redirect('/superadmin/viewadmin')
      console.log("password updated successfully")
    }else{
      console.log("Password Mismatch")
    }
  })
})
router.get('/viewusers',verifyLogin,(req,res)=>{
  let suber = req.session.superuser
  superHelpers.getAlluser().then((users)=>{
    res.render('superadmin/viewusers',{showSeader: true,users,suber,superadmin:true})
  })
})
router.get('/deleteuser/:id',verifyLogin,(req,res)=>{
  let userId = req.params.id
  superHelpers.deleteUser(userId).then((response)=>{
    res.redirect('/superadmin/viewusers')
  })
})
router.get('/updatesuperinfo/:id',verifyLogin,async(req,res)=>{
let suber = req.session.superuser
let superAdmin = await superHelpers.getSuperinfo(suber._id)
  res.render('superadmin/updatesuperinfo',{superAdmin})
})
router.post('/updatesuperinfo/:id', async(req, res) => {
  let suber = req.session.superuser
  let superAdmin = await superHelpers.getSuperinfo(suber._id)
  superHelpers.updateSuperinfo(superAdmin, req.body).then((response) => {
    if(response.status){
      res.redirect('/superadmin/');
      console.log("password updated successfully")
    }else{
      console.log("Password Mismatch")
    }
  })
})
module.exports = router;