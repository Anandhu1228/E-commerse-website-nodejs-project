var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('../app')
const { parse } = require('handlebars')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'enter key here',
    key_secret: 'enter secret here',
  });


module.exports={

    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            if(userData.Password == userData.Cpass){
                userData.Password = await bcrypt.hash(userData.Password, 10)
                userData.Cpass = await bcrypt.hash(userData.Cpass, 10)
                db.getDb().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.insertedId)
            })
            } 
        })
    },

    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.getDb().collection(collection.USER_COLLECTION).findOne({Email:userData.Email})
            if(user){
                bcrypt.compare(userData.Password,user.Password).then((status)=>{
                    if(status){
                        console.log("login success");
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                        console.log("login failed");
                        resolve({status:false})
                    }
                })
            }else{
                console.log("login failed");
                resolve({status:false})
            }
        })
    },
    doRecoveruserpass:(userDetails)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {}
            let user = await db.getDb().collection(collection.USER_COLLECTION).findOne({Email:userDetails.Email})
            let OldP = userDetails.oldpassword;
            let NewP = user.Cpass;
            let NewPW = userDetails.newpassword;
            let userId = user._id

            if(user){
                bcrypt.compare(OldP,NewP).then(async(status)=>{
                    if(status){
                        NewPW = await bcrypt.hash(NewPW, 10);
                        db.getDb().collection(collection.USER_COLLECTION).updateOne({ _id: new objectId(userId)},
                        {
                            $set: {
                                Password: NewPW,
                                Cpass:NewPW
                            },
                        });
                        response.status=true
                    resolve(response)
                    }else{
                        console.log("login failed");
                        resolve({status:false})
                    }
                })
            }else{
                console.log("login failed");
                resolve({status:false})
            }
        })
    },
    addToCart:(proId,userId)=>{
        let proObj = {
            item:new objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.getDb().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(userCart){ 
                let prodExist = userCart.products.findIndex(product=> product.item==proId)
                if(prodExist!= -1){
                    // MEANS PRODUCT IS PRESENT
                    db.getDb().collection(collection.CART_COLLECTION).updateOne({
                        user:new objectId(userId),
                        'products.item':new objectId(proId)
                        },
                        {
                            $inc:{ 'products.$.quantity' :1 }
                        }
                    ).then(()=>{
                        resolve()
                    })
                }else{
                db.getDb().collection(collection.CART_COLLECTION).updateOne({user:new objectId(userId)},
                    {
                        
                        $push:{products:proObj} 
                        
                    }
                ).then((response)=>{
                    resolve()
                })
            }
            }else{ 
                let cartObj = {
                    user:new objectId(userId),
                    products:[proObj]
                }
                db.getDb().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.getDb().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:new objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'productDT'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,productDX:{$arrayElemAt:['$productDT',0]}
                    }
                }
            ]).toArray() 
            resolve(cartItems)
        }) 
    }, 
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart = await db.getDb().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if(cart){
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        Quantity = parseInt(details.QUANTITY)
        counter = parseInt(details.COUNT)
        return new Promise((resolve,reject)=>{
            if(counter==-1 && Quantity==1){
                db.getDb().collection(collection.CART_COLLECTION).updateOne({
                    _id:new objectId(details.CART)},
                    {
                        $pull:{products:{item:new objectId(details.PRODUCT)}}
                    }).then((response)=>{
                    resolve({removeProduct:true})
                    })
            }else{
                db.getDb().collection(collection.CART_COLLECTION).updateOne({
                    _id:new objectId(details.CART),
                    'products.item':new objectId(details.CART),
                    'products.item':new objectId(details.PRODUCT)
                    },
                    {
                        $inc:{ 'products.$.quantity' :counter }
                    }).then((response)=>{
                    resolve({status:true})
                })
            }
        })
    },
    deletecartProduct:(detailed)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.CART_COLLECTION).updateOne({
                _id:new objectId(detailed.CarT)},
                {
                    $pull:{products:{item:new objectId(detailed.ProducT)}}
                }).then((response)=>{
                resolve({deleteProduct:true})
                })
                
        })
    },
    getTotalAmount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let total = null;
            try{
                const result = await db.getDb().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:new objectId(userId)}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                        $project:{
                            item:'$products.item',
                            quantity:'$products.quantity'
                        }
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'productDT'
                        }
                    },
                    {
                        $project:{
                            item:1,quantity:1,productDX:{$arrayElemAt:['$productDT',0]}
                        }
                    },
                    {
                        $group:{
                            _id:null,
                            total:{$sum:{$multiply:[
                                {$toDouble: '$quantity'},
                                {$toDouble: '$productDX.Price'}
                            ]}}
                        }
                    }
                ]).toArray() 

                if (result.length > 0 && result[0].total !== undefined) {
                    total = result[0].total; // Update total when values come in
                  }
            

                resolve(total)
            }catch(err){
                reject(err)
            }
            
        })
    },
    placeOrder:(order,productC,totalC)=>{
        return new Promise((resolve,reject)=>{
            let status = order['payment-method'] === 'COD'?'placed':'pending'
            let orderObj = {
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    pincode:order.pincode
                },
                userId:new objectId(order.userId),
                paymentMethod:order['payment-method'],
                products:productC,
                totalAmount:totalC,
                status:status,
                date:new Date()
            }
            db.getDb().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                const orderID = response.insertedId;
                db.getDb().collection(collection.CART_COLLECTION).deleteOne({user: new objectId(order.userId)})
                resolve(orderID)
            })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let camel = null
            let cartproducts = await db.getDb().collection(collection.CART_COLLECTION).findOne({user:new objectId(userId)})
            if (cartproducts){
                camel = cartproducts.products
            }
           resolve(camel)
        })
    },
    getProfile: (userId) => {
        return new Promise(async (resolve, reject) => {
            let profile = await db.getDb().collection(collection.USER_COLLECTION).findOne({ _id: new objectId(userId) });
            resolve(profile);
        });
    },
    getProfileDetails:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.USER_COLLECTION).findOne({_id:new objectId(userId)}).then((user)=>{
                resolve(user)
            })
        })
    },
    updateProfile:(userId,userDetails)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.USER_COLLECTION).updateOne({_id:new objectId(userId)},{
                $set:{
                    Name:userDetails.Name,
                    Email:userDetails.Email,
                    Contact:userDetails.Contact
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
          
    getUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.getDb().collection(collection.ORDER_COLLECTION).find({
                userId: new objectId(userId)}
                ).toArray()
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems = await db.getDb().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:new objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                    item:'$products.item',
                    quantity:'$products.quantity'
                }
            },
            {
                $lookup:{
                    from:collection.PRODUCT_COLLECTION,
                    localField:'item',
                    foreignField:'_id',
                    as:'product'
                }
            },
            {
                $project:{
                    item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }
            ]).toArray()
            resolve(orderItems)
        })
    },
    generateRazorpay:(orderID,totalPrice)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: totalPrice*100,
                currency: "INR",
                receipt:orderID
            };
            instance.orders.create(options,function(err,order){
                resolve(order)
            })
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256','U2kt1pJWMMT0lAZNe269XawU')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')

            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.ORDER_COLLECTION).updateOne(
                {_id:new objectId(orderId)},
                {
                    $set:{
                        status:'placed'
                    }
                }
            ).then(()=>{
                resolve()
            })
        })
    },
    updateUPass: (User, userDetails) => {
        let OldP = User.Password;
        let NewP = userDetails.OldPass;
        let NewPW = userDetails.NewPass;
        let UserId = User._id;
        let response = {}
        return new Promise ((resolve, reject) => {
          bcrypt.compare(NewP,OldP).then(async(status) => {
            if (status){
              NewPW = await bcrypt.hash(NewPW, 10);
              db.getDb().collection(collection.USER_COLLECTION).updateOne({ _id: new objectId(UserId)},
              {
                  $set: {
                    Password: NewPW,
                  },
                });
                response.status=true
              resolve(response)
            } else {
              resolve({status: false });
            }
          });
        });
      }
} 