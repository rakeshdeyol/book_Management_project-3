const mongoose = require('mongoose')
const objectId = mongoose.Schema.Types.ObjectId

const booksSchema = new mongoose.Schema({

    title: {
         type: String,
         required: true,
         unique: true,
         trim:true 
        },
        
        bookCover: String,

    excerpt: {
        type: String,
        required: true,
        trim:true
     },

    userId: {
         type: objectId, 
         required: true, 
         ref:'user',
         trim:true 
        },

    ISBN: {
         type: String,
         required: true, 
         unique: true,
         trim:true 
        },

    category: { 
        type: String, 
        required: true,
        trim:true 
    },

    subcategory: [{
         type: String,
         required: true,
         trim:true 
        }],

    reviews: { 
        type: Number, 
        default: 0 ,
        trim:true
    }, 

    deletedAt: { 
        type: Date,
        default:null
    },

    isDeleted: {
         type: Boolean,
         default: false
        },

    releasedAt: { 
        type: String, 
        required: true
    },
    
   

}, { timestamps: true })

module.exports = mongoose.model('book',booksSchema)

