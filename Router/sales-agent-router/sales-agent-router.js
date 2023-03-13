
const express = require("express");
const router = express.Router();
// user controller
const salesController = require("../../Controller/sales-controller/sales-controller");
/*******************************************************************************************************************/






/* DASHBOARD sales */

router.post("/dashboard/:username",async(req,res,next)=>{
  try {
    const {username}=req.params
    console.log(username,"userame");
    let data=await salesController.dashboardCount(username)
    if(data){
      res.status(200).json({
        data:data
      })
    }
  } catch (error) {
    next(error)
  }
})


/************************************************************************************************************** */
module.exports = router;
