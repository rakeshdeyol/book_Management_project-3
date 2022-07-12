const bookModel = require("../model/bookModel");
const userModel = require("../model/userModel");
const reviewModel = require("../model/reviewModel");
const { isValid, isValidRequestBody, isValidOjectId, isValidRegxDate, isValidRegxISBN } = require("../validation/validation");
const { isValidObjectId } = require("mongoose");
const mongoose = require("mongoose");
const { request } = require("express");
const ObjectId = require('mongoose').Types.ObjectId


//-----------------##---------## create Books documents ##------------------##----------------------//

const createBookDoc = async function (req, res) {
    try {
        let data = req.body

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: "data is empty" });
        // destructure
        let { title, excerpt, ISBN, category, subcategory, userId } = data


        if (!isValid(title)) return res.status(400).send({ status: false, msg: "title is invalid or empty,required here valid information" });
       if (userId == '' || !userId) return res.status(400).send({ status: false, message: "userId tag is required" });
 

        if (!isValidOjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid or empty,required here valid information" });

        if (!isValid(excerpt)) return res.status(400).send({ status: false, msg: "excerpt is invalid or empty,required here valid information" });
        if (!isValid(ISBN)) return res.status(400).send({ status: false, msg: "ISBN is invalid or empty,required here valid information" });
        if (!isValid(category)) return res.status(400).send({ status: false, msg: "category is invalid or empty,required here valid information" });
        if (!isValid(subcategory)) return res.status(400).send({ status: false, msg: "subcategory is invalid or empty,required here valid information" });
        // if (!isValid(releasedAt)) return res.status(400).send({ status: false, msg: "releasedAt is invalid" });

        //  ISBN NO. VALIDATION
        if (!isValid(ISBN) || isValidRegxISBN(ISBN)) {
            return res.status(400).send({ status: false, message: "Enter valid ISBN, min 13 digit value" });
        }

        let duplicatetitle = await bookModel.findOne({ title: title });
        if (duplicatetitle) return res.status(400).send({ status: false, msg: 'title already exists' });

        let duplicateISBN = await bookModel.findOne({ ISBN: ISBN })
        if (duplicateISBN) return res.status(400).send({ status: false, msg: 'ISBN already exists' });



        let isExistsuserId = await userModel.findById(userId);
        if (!isExistsuserId) return res.status(400).send({ status: false, msg: `${userId}. This userId is not present in DB` });

        // authorization 

        let verifyToken = req.loggedInUser
        if (verifyToken != userId) return res.status(403).send({ status: false, msg: "You are not authorize to createBook from another userId" });

        let newdoc = await bookModel.create(data);
        res.status(201).send({ status: true, data: newdoc });
    }
    catch (err) {
        res.status(500).send({ status: false, msg: "Internal server error" });
    }
};

// ---------------------------****---  Get Books ------***----------------------------------***---------------

const getBooks = async function (req, res) {
    try {
        let userQuery = req.query;
        let filter = { isDeleted: false};

        if (!isValidRequestBody(userQuery)) {
            let books = await bookModel.find(filter).select({ title: 1, book_id: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1});
            return res.status(200).send({ status: true, data: books })
        };

        const { userId, category, subcategory } = userQuery;
        if (!isValid(userId) && !isValid(category) && !isValid(subcategory))
            return res.status(400).send({ status: false, msg: "invalid query parameter" })

         

        if (userId) {
            if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId" });
            filter["userId"] = userId;
        }
        if (isValid(category)) {
            filter["category"] = category.trim();
        }
        if (isValid(subcategory)) {
            const subCategoryArray = subcategory.trim().split(",").map((s) => s.trim());
            filter["subcategory"] = { $in: subCategoryArray };
        };
        // if(userQuery!=filter) return res.status(400).send({status:false,msg:"Invalid input in query params"})

        let findBook = await bookModel.find(filter).select({ title: 1, book_id: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1, });
        if (Array.isArray(findBook) && findBook.length === 0) {
            return res.status(404).send({ status: false, message: "Books Not Found" });
        } else {
            res.status(200).send({ status: true, message: "Books list", data: findBook });
        };
    }
    catch (err) {
        res.status(500).send({ status: false, message: "Internal Server Error", error: err.message, });
    }
};


// ------------------------------------------****---------------------------------------------***---------------------------------

const getBookByBookId = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        //    VALIDATION
        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "userId is Invalid" });
        }
        //   FETCHING BOOK  WITH   BOKK ID
        const book = await bookModel.findOne({ _id: bookId, isDeleted: false })
        // WHEN  NOT FOUND
        if (!book) {
            return res.status(404).send({ status: false, message: "book not found" })
        }
        // FETCHING   REVIEW   FROM   REVIEW   MODEL 
        const review = await reviewModel.find({ bookId: bookId, isDeleted: false }).select({ _id: 1, bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 });
        const { _id, title, excerpt, userId, category, subcategory, isDeleted, reviews, deletedAt, releaseAt, createdAt, updatedAt } = book  // DESTRUCTURING  BOOK  FOR MAKING RESPONSE

        const data = { _id, title, excerpt, userId, category, subcategory, isDeleted, reviews, deletedAt, releaseAt, createdAt, updatedAt }
        data["reviewData"] = review;
        // SENDING   BOOK   LIST 
        res.status(200).send({ status: true, msg: "Book list", data: data });
    } catch (err) {
        res.status(500).send({ status: false, msg: err.message });
    }
};
// --------------------------------------------***--------------------------------****-------------------------****

const updateBook = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        //BOOKID VALIDATIONS
        if (!isValidObjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Enter BookId in Params also Valid Id" });
        };
        //  DOCUMENT EXIST OR NOT IN DB

        const requestBody = req.body;
        //  IF BODY IS EMPTY
        if (Object.keys(requestBody).length == 0) {
            return res.status(400).send({ status: false, message: "Enter Data in Body" });
        }
       

        const { title, excerpt, releasedAt, ISBN } = requestBody; // DESTRUCTURING
        const bookData = await bookModel.findOne({ _id: bookId, isDeleted: false });
        if (!bookData)
            return res.status(404).send({ status: false, message: "Book not found With Given id,or Allready Delete" });


        // BODY DATA VALIDATIONS
        if(requestBody.title){
        if (!isValid(title)) {
            return res.status(400).send({ status: false, message: "Enter Title" });
        };
        const uniqueTitle = await bookModel.findOne({ title: title });
        if (uniqueTitle) {
            return res.status(400).send({ status: false, message: "Title Allready Exist Use different Title" });
        }
        bookData.title=requestBody.title;

    }

        if(requestBody.excerpt){
        if (!isValid(excerpt)) {
            return res.status(400).send({ status: false, message: "Enter excerpt" });
        };
        bookData.excerpt=requestBody.excerpt;

    }
        //  DATE VALIDATION
        if(requestBody.releaseAt){
        if (!isValid(releasedAt) || !isValidRegxDate(releasedAt)) {
            return res.status(400).send({ status: false, message: "Enter release date Also Formate Should be 'YYYY-MM-DD' " });
        };
        bookData.releasedAt=requestBody.releaseAt;

    }
    

        //  ISBN NO. VALIDATION
        if(requestBody.ISBN){
        if (!isValid(ISBN) || isValidRegxISBN(ISBN)) {
            return res.status(400).send({ status: false, message: "Enter ISBN Also Valid" });
        };
        

        // CHECKING UNIQUE EXISTANCE IN DB

        const uniqueIsbn = await bookModel.findOne({ ISBN: ISBN });
        if (uniqueIsbn) {
            return res.status(400).send({ status: false, message: "ISBN Already Exist Use Different" });
        }

        bookData.ISBN=requestBody.ISBN;


    }

    
        // CHECKING USER AUTERIZATION
        if (req.loggedInUser != bookData.userId)   
            return res.status(403).send({ status: false, message: "Unauthorize To Make Changes" });

        
        //  UPADATING DOCUMENT IN DB
        const updatedBook = await bookModel.findByIdAndUpdate({ _id: bookId }, { $set: { title: title, excerpt: excerpt, releasedAt: releasedAt, ISBN: ISBN } }, { new: true });
        res.status(200).send({ status: true, message: "Updated Successfully", data: updatedBook })

    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
};



// --------------***-----------------***---------------------***------------------
//  DELETE /books/:bookId

const deleteBookId = async (req, res) => {
    try {
        let bookId = req.params.bookId
        //  bookId is present or not
        if (!bookId) return res.status(400).send({ status: false, msg: "bookId must be present in param " })

        // bookId is a valid objectId
        if (!isValidObjectId(bookId)) return res.status(400).send({ status: false, msg: "bookId is not valid" })

        const book = await bookModel.findOne({ _id:reviewId, bookId:bookId, isDeleted: false })
        if (!book) return res.status(404).send({ status: false, msg: "book not exist or allerady deleted" })

        let verifyToken = req.loggedInUser
        if (verifyToken != userId) return res.status(403).send({ status: false, msg: "You are not authorize to createBook from another userId" });

        // set the isDeleted true of that book with deleted date
        await bookModel.findOneAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: new Date() } })
         await reviewModel.findByIdAndUpdate({bookId:bookId},{$set:{isDeleted:true}})
        return res.status(200).send({ status: true, message: "Success" })
    }
    catch (err) {
        console.log(err)
        return res.status(500).send({ status: false, msg: "error.message" })
    }
}

// ------------------------------***-------------------------------***---------------------------***-----------



module.exports = { createBookDoc, getBooks, getBookByBookId, updateBook, deleteBookId }




