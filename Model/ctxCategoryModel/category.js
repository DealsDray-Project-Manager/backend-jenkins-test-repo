const mongoose = require("mongoose")

const ctxCategorySchema = mongoose.Schema({
   
    Code: {
        type: String
    },
    Description: {
        type: String
    },
    Float: {
        type: String
    },
    created_at:{
        type:Date
    },
})
const ctxCategory = mongoose.model("ctxCategory", ctxCategorySchema)
module.exports = {
    ctxCategory: ctxCategory
}