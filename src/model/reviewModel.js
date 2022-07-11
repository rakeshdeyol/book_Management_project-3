const mongoose = require('mongoose')
const ObjectId = mongoose.Schema.Types.ObjectId

const reviewSchema = new mongoose.Schema({

    bookId: { type: ObjectId, required: true, ref: "book",trim:true},

    reviewedBy: { type: String, required: true, default: 'Guest',trim:true },

    reviewedAt: { type: Date, required: true,trim:true },

    rating: { type: Number,min:1,max:5, required: true,trim:true}, //rating 1-5 dena hai 

    review: { type: String,trim:true },

    isDeleted: { type: Boolean, default: false ,trim:true},

}, { timestamps: true })

module.exports = mongoose.model('review', reviewSchema)