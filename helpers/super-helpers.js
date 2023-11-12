var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId
const { response } = require('../app')
const { parse } = require('handlebars')


module.exports={

    dosuperLogin:(superData)=>{
        return new Promise(async(resolve,reject)=>{
            let response = {}
            let superuser = await db.getDb().collection(collection.SUPER_COLLECTION).findOne({Email:superData.Email})
            if(superuser){
                bcrypt.compare(superData.Password,superuser.Password).then((status)=>{
                    if(status){
                        console.log("login success");
                        response.superuser=superuser
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
    getAlladmin:()=>{
        return new Promise(async(resolve,reject)=>{
            let admins =await db.getDb().collection(collection.ADMIN_COLLECTION).find().toArray()
            resolve(admins)
        })
    },
    getAlluser:()=>{
        return new Promise(async(resolve,reject)=>{
            let users =await db.getDb().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    addadmin:async(admin,callback)=>{
        let P = admin.Passkey
        let Cp = admin.Cpasskey
        if(P==Cp){
            admin.Passkey = await bcrypt.hash(admin.Passkey, 10)
            admin.Cpasskey = await bcrypt.hash(admin.Cpasskey, 10)
            db.getDb().collection(collection.ADMIN_COLLECTION).insertOne(admin).then(data=>{
                callback(data.insertedId)
            })
        }else{
            console.error('Passkey mismatch')
        }      
    },
    getAdminDetails:(adminId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.ADMIN_COLLECTION).findOne({_id:new objectId(adminId)}).then((Admin)=>{
                resolve(Admin)
            })
        })
    },
    updateAdmin:(adminId,adminDetails)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.ADMIN_COLLECTION).updateOne({_id:new objectId(adminId)},{
                $set:{
                    Name:adminDetails.Name,
                    Email:adminDetails.Email,
                    Contact:adminDetails.Contact,
                    Ukey:adminDetails.Ukey
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    deleteAdmin:(adminId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.ADMIN_COLLECTION).deleteOne({_id:new objectId(adminId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    deleteUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            db.getDb().collection(collection.USER_COLLECTION).deleteOne({_id:new objectId(userId)}).then((response)=>{
                resolve(response)
            })
        })
    },
    updateAPass: (Admin, adminDetails) => {
        let OldP = Admin.Passkey;
        let NewP = adminDetails.OldPass;
        let NewPW = adminDetails.NewPass;
        let AdminId = Admin._id;
        let response = {}
        return new Promise ((resolve, reject) => {
          bcrypt.compare(NewP,OldP).then(async(status) => {
            if (status){
              NewPW = await bcrypt.hash(NewPW, 10);
              db.getDb().collection(collection.ADMIN_COLLECTION).updateOne({ _id: new objectId(AdminId)},
              {
                  $set: {
                    Passkey: NewPW,
                  },
                });
                response.status=true
              resolve(response)
            } else {
              resolve({status: false });
            }
          });
        });
      },
      getSuperinfo:(superadminId)=>{
        return new Promise((resolve, reject)=>{
            db.getDb().collection(collection.SUPER_COLLECTION).findOne({_id:new objectId(superadminId)}).then((superadmin)=>{
                resolve(superadmin)
            })
        })
      },
      updateSuperinfo: async(superId, superData) => {
        console.log(superId)
        console.log(superData)
        let response = {};
        let Dkey = superData.SKEY;
        let key = superId.SUKEY;
        let pass = superId.Cpassword;
        let Dpass = superData.OldPass;
        let Newpass = superData.NewPass;
        let Dmail = superData.Email;
    
        return new Promise(async (resolve, reject) => {
            const keyComparePromise =await bcrypt.compare(Dkey, key).catch((error) => {
                console.error('Key comparison error:', error);
                return false; // or handle it according to your logic
            });
            
            const passComparePromise =await bcrypt.compare(Dpass, pass).catch((error) => {
                console.error('Password comparison error:', error);
                return false; // or handle it according to your logic
            });
            console.log(keyComparePromise)
            console.log(passComparePromise)
    
            Promise.all([keyComparePromise, passComparePromise])
                .then(([keyMatch, passMatch]) => {
                    if (keyMatch && passMatch) {
                        Newpass = bcrypt.hashSync(Newpass, 10);
                        db.getDb().collection(collection.SUPER_COLLECTION).updateOne({ _id: new objectId(superId._id) },
                            {
                                $set: {
                                    Password: Newpass,
                                    Email: Dmail,
                                    Cpassword: Newpass
                                },
                            }
                        );
                        response.status = true;
                        resolve(response);
                    } else {
                        resolve({ status: false });
                    }
                })
                .catch((error) => {
                    console.error(error);
                    resolve({ status: false });
                });
        });
    }
}