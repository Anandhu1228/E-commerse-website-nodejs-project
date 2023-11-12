var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')

var objectId = require('mongodb').ObjectId
module.exports={

    getAllProducts:(adminId=null) => { 
        return new Promise(async (resolve, reject) => {
            let query = {};
            if (adminId) {
                query.AdminId = adminId;
            }
            let products = await db.getDb().collection(collection.PRODUCT_COLLECTION).find(query).toArray();
            resolve(products);
        });
    },
    doadminLogin:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {}
            
            let admin = await db.getDb().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
            if(admin){
                bcrypt.compare(adminData.Password,admin.Passkey).then((status)=>{
                    if(status){
                        console.log("login success");
                        response.admin=admin
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
    doRecoveradminpass:(adminDetails)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {}
            let admin = await db.getDb().collection(collection.ADMIN_COLLECTION).findOne({Email:adminDetails.Email})

            if(admin){
                let OldP = adminDetails.oldpassword;
                let NewP = admin.Cpasskey;
                let NewPW = adminDetails.newpassword;
                let adminId = admin._id

                bcrypt.compare(OldP,NewP).then(async(status)=>{
                    if(status){
                        NewPW = await bcrypt.hash(NewPW, 10);
                        db.getDb().collection(collection.ADMIN_COLLECTION).updateOne({ _id: new objectId(adminId)},
                        {
                            $set: {
                                Passkey: NewPW,
                                Cpasskey:NewPW
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
    
    addProduct: (product,adminId) => {
        product.AdminId = adminId
        return new Promise((resolve, reject) => {
          db.getDb().collection(collection.PRODUCT_COLLECTION).insertOne(product)
            .then((data) => {
              resolve(data.insertedId);
            })
            .catch((err) => {
              reject(err);
            });
        });
      },
      
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.PRODUCT_COLLECTION).deleteOne({_id:new objectId(prodId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.PRODUCT_COLLECTION).findOne({_id:new objectId(prodId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(prodId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.PRODUCT_COLLECTION).updateOne({_id:new objectId(prodId)},{
                $set:{
                    Name:proDetails.Name,
                    Descreption:proDetails.Descreption,
                    Price:proDetails.Price,
                    Category:proDetails.Category
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    getadminProfile: (adminId) => {
        return new Promise(async (resolve, reject) => {
            let profile = await db.getDb().collection(collection.ADMIN_COLLECTION).findOne({ _id: new objectId(adminId) });
            resolve(profile);
        });
    },
    getadminProfileDetails:(adminId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.ADMIN_COLLECTION).findOne({_id:new objectId(adminId)}).then((admin)=>{
                resolve(admin)
            })
        })
    },
    updateadminProfile:(adminId,adminDetails)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.ADMIN_COLLECTION).updateOne({_id:new objectId(adminId)},{
                $set:{
                    Name:adminDetails.Name,
                    Email:adminDetails.Email,
                    Contact:adminDetails.Contact
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}