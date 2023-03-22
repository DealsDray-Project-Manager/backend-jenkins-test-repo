const mongoose = require("mongoose")

const ctxCategorySchema = mongoose.Schema({
   
    code: {
        type: String,
        index:true,
    },
    description: {
        type: String
    },
    category_type:{
        type:String
    },
    float: {
        type: Number
    },
    sereis_start:{
        type:Number
    },
    series_end:{
        type:Number
    },
    created_at:{
        type:Date
    },
})
const ctxCategory = mongoose.model("ctxCategory", ctxCategorySchema)
module.exports = {
    ctxCategory: ctxCategory
}