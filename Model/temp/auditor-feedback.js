const mongoose=require("mongoose")

const auditorFeedBackSchema=mongoose.Schema({
    uic:{
        type:String
    },
    other_audtior_feedback:{
        type:String
    }
})
const audtiorFeedback=mongoose.model("otherAuditorFeedBack",auditorFeedBackSchema)
module.exports={
    audtiorFeedback:audtiorFeedback
}