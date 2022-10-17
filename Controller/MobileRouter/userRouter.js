// User Model require 
const {user}=require("../../Model/userModel")


// Module Exports 
module.exports={
    // User exist or not
    findUser:(email)=>{
        return new Promise(async(resolve,reject)=>{
            let userExist=await user.findOne({email:email}).catch((err)=>reject(err))
            if(userExist){
                resolve(userExist)
            }
            else
            {
                resolve()
            }
        })
    },
     // user otp store to database
     userOtpStore:(userId,otp)=>{
        return new Promise(async(resolve,reject)=>{
            let userOtp= await user.findByIdAndUpdate(userId,{last_otp:otp}).catch((err)=>reject(err))
            if(userOtp){
                resolve(userOtp)
            }
            else
            {
                resolve()
            }
        })
    },
    findOtp:(userId,otp)=>{
        return new Promise(async(resolve,reject)=>{
            let userOtpFind=await user.findOne({_id:userId,last_otp:otp}).catch((err)=> reject(err))
            if(userOtpFind){
                resolve(userOtpFind)
            }
            else
            {
                resolve()
            }
        })
    },
    userInfo:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let userInfo=await user.findOne({_id:userId}).catch((err)=> reject(err))
            if(userInfo){
                resolve(userInfo)
            }
            else
            {
                resolve()
            }
        })
    }
}