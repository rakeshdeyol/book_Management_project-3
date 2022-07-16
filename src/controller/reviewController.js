const bookModel = require("../model/bookModel");
const reviewModel = require("../model/reviewModel");
const { isValidObjectId } = require("mongoose");

const { isValid, isValidRequestBody,isValidName,regexSpaceChar } = require("../validation/validation");
const mongoose = require('mongoose');



//--------------------------##---------***** create review ******----------------##-------------------------------------------------//

const createReview = async function (req, res) {
    try {
        let data = req.body
        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: `Provide valid data for review` });

        let bookId = req.params.bookId;
        if (bookId == '' || !bookId) return res.status(400).send({ status: false, message: "bookId tag is required" });
        if (!isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "bookId is invalid or empty,required here valid information" });
        data.bookId=bookId

        const {reviewedBy,reviewedAt,rating,review}=data


        if(!isValidName(reviewedBy))return res.status(400).send({status:false,msg:"Provide valid name"});
        if(reviewedBy){
        if(!isValid(reviewedBy))return res.status(400).send({status:false,msg:"Give name of reviewer"});
        };

        // if(!isValid(reviewedAt))return res.status(400).send({status:false,msg:"this is format of date 'yyyy-mm-dd' "});
        data["reviewedAt"]=Date.now()

        

       if(!(rating>=1 && rating<=5))return res.status(400).send({status:false,msg:"please provide rating 1-5"});
        if(!isValid(rating))return res.status(400).send({status:false,msg:"please provide rating"});
        
        if(review && !isValid(review))return res.status(400).send({status:false,msg:"please give your review about books"});
        
        let savedData = await reviewModel.create(data);
        const existBookId = await bookModel.findOneAndUpdate({_id:bookId,isDeleted:false},{$inc:{reviews:+1}},{new:true}).lean();
        if (!existBookId)return res.status(404).send({ status: false, msg: `${bookId}.This bookId not found in Db` });
    
        existBookId["createdreview"]=savedData

        return res.send({ status: true, data: existBookId });
    }
    catch (err) {
        res.status(500).send({ status: false, msg: "Internal server error" });
    }
};

// --------------------updating the review



const updateReview = async function (req, res) {
    try {
        const requestBody = req.body
        const bookId = req.params.bookId
        const reviewId = req.params.reviewId

        //     Validation and DB fetch for Existance
        if (!isValid(bookId) || !isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Please! enter a valid bookId" })
        }

        if (!isValid(reviewId) || !isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, message: "Please! enter a valid reviewId" })
        }
        const existBook = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!existBook) {
            return res.status(404).send({ status: false, message: "Book does not found with given id" })
        }
        const existReview = await reviewModel.findOne({ _id: reviewId, isDeleted: false })
        if (!existReview) {
            return res.status(404).send({ status: false, message: "Review Id does not exist in Data-Base" })
        }

        // check params-bookid matches with reiews bookid
        if (!(existReview.bookId == bookId)) {
            return res.status(400).send({ status: false, message: `The Review does not belong to book by Book id: ${bookId}` })
        }
        if (!(Object.keys(requestBody).length > 0)) {
            return res.status(400).send({
                status: false,
                message: "Invalid request parameters, Provide data to update review"
            })
        }

        // DESTURCTURING
        const { reviewedBy, rating, review } = requestBody  

        const filter = {}
        if ("reviewedBy" in requestBody) {
            if (!isValid(reviewedBy)) {
                return res.status(400).send({ status: false, message: "Please! enter a valid data to 'reviewedby' feild" })
            }
            filter['reviewedBy'] = reviewedBy.trim()
        }

        if ("rating" in requestBody) {
            if (!(rating >= 1 && rating <= 5)) {
                return res.status(400).send({ status: false, message: "Please! enter a value to rating feild between 1 and 5" })
            }
            filter['rating'] = rating
        }

        if ("review" in requestBody) {
            if (!isValid(review)) {
                return res.status(400).send({ status: false, message: "Please! enter a valid data to 'review' feild" })
            }
            filter['review'] = review.trim()
        }
        const updatedReview = await reviewModel.findOneAndUpdate({ _id: reviewId }, { $set: filter }, { new: true })
        const reviewData = await reviewModel.findOne({ _id:reviewId }).select({ bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })
        //      Destructuring
        const { _id, title, excerpt, userId, category, subcategory, isDeleted, reviews, deletedAt, releaseAt, createdAt, updatedAt } = existBook
        //     Assigning to varable  data object
        const data = { _id, title, excerpt, userId, category, subcategory, isDeleted, reviews, deletedAt, releaseAt, createdAt, updatedAt, reviewData }

        return res.status(200).send({ status: true, message: "Success", data: data })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
};





// -----------------deleting review by reviewId 

const deleteReviewById = async function (req, res) {
    try {
        let bookId = req.params.bookId
        let reviewId = req.params.reviewId

        // check bookId is a valid ObjectId
        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, msg: 'bookId is not a valid object Id' })
        }

        // check reviewId is a valid ObjectId
        if (!isValidObjectId(reviewId)) {
            return res.status(400).send({ status: false, msg: 'reviewId is not a valid object Id' })
        }

        // find the book with book and check that is not deleted
        const book = await bookModel.findOne({ _id: bookId, isDeleted: false })
        if (!book) {
            return res.status(400).send({ status: false, msg: 'book does not found' })
        }

        // find the book with book and check that is not deleted
        const review = await reviewModel.findOne({ _id: reviewId, bookId:bookId, isDeleted: false })
        if (!review) {
            return res.status(400).send({ status: false, msg: 'review does not exist for given bookId' })
        }

        // set the isDeleted property of review to true 
        const deletedReview = await reviewModel.findOneAndUpdate({ _id: reviewId, bookId: bookId }, { isDeleted: true }, { new: true })
        // decrease the review count in the book
         const decreaseCount = await bookModel.findOneAndUpdate({ _id: bookId, reviews: { $gt: 0 } }, { $inc: { reviews: -1 } })
        return res.status(200).send({ status: true, msg: 'review deleted successfully' })

    } catch (err) {
        return res.status(500).send({ error: err.message })
    }

}

module.exports={updateReview,createReview,deleteReviewById }

