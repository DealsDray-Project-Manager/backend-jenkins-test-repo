const mongoose=require("mongoose")

const StxUtilitySchema=mongoose.Schema({
    uic:{
        type:String
    },
    model_name:{
        type:String
    },
    grade:{
        type:String
    },
    ctx_tray_id:{
        type:String
    },
    date:{
        type:Date
    },
    current_status:{
        type:String
    },
    added_status:{
        type:String
    },
    type:{
        type:String
    },
    description:String,
    old_grade:String,
    system_status:String
})
const stxUtility=mongoose.model("stxUtility",StxUtilitySchema)

module.exports={
    stxUtility:stxUtility
}