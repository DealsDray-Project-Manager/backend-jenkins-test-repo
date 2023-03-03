const sendGridMail = require('@sendgrid/mail');
const { user } = require('../Model/userModel');
sendGridMail.setApiKey(process.env.SENDGRID_API_KEY);

// Module exports 
module.exports={
    sendOtp: async(email)=>{
            try {
                 const otp= `${Math.floor(1000 + Math.random() * 9000)}`
                 const maileOption={
                    to: email,
                    from: 'no-reply2@dealsdray.com',
                    subject: 'Prexo otp',
                    html:`<p>Your otp - ${otp} </p>`
                   }
                   let respo= await sendGridMail.send(maileOption)
                  
                   if(respo){
                       return {otp:otp ,status:true}
                   }
                   else
                   {
                       return {status:false}
                   }
            } catch (error) {
                return error
            }
    },
}