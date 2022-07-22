const bookModel = require("../model/bookModel");
const userModel = require("../model/userModel");
const reviewModel = require("../model/reviewModel");
const { isValid, isValidRequestBody,isValidOjectId,isValidRegxDate, isValidRegxISBN } = require("../validation/validation");
const aws= require("aws-sdk")

//--------------------aws configuration setup

aws.config.update({
    accessKeyId: "AKIAY3L35MCRVFM24Q7U",
    secretAccessKey: "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",
    region: "ap-south-1"
})

let uploadFile = async (file) => {
    return new Promise(function (resolve, reject) {
        let s3 = new aws.S3({ apiVersion: '2006-03-01' });
        var uploadParams = {
            ACL: "public-read",
            Bucket: "classroom-training-bucket",
            Key: "abc/" + file.originalname,
            Body: file.buffer
        }
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                return reject({ "error": err })
            }
            return resolve(data.Location)
        })
    })
}



//---------------- create Books documents

const createBookDoc = async function (req, res) {
    try {
        let data = req.body

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, msg: "data is empty" });
        // destructure
        let { title, excerpt, ISBN, category, subcategory, userId,releasedAt } = data


        if (!isValid(title)) return res.status(400).send({ status: false, msg: "title is invalid or empty,required here valid information" });
       if (userId == '' || !userId) return res.status(400).send({ status: false, message: "userId  is required" });
 

        if (!isValidOjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid or empty,required here valid information" });

        if (!isValid(excerpt)) return res.status(400).send({ status: false, msg: "excerpt is invalid or empty,required here valid information" });
        if (!isValid(ISBN)) return res.status(400).send({ status: false, msg: "ISBN is invalid or empty,required here valid information" });
        if (!isValid(category)) return res.status(400).send({ status: false, msg: "category is invalid or empty,required here valid information" });
        if (!isValid(subcategory)) return res.status(400).send({ status: false, msg: "subcategory is invalid or empty,required here valid information" });
         if (!isValid(releasedAt)) return res.status(400).send({ status: false, msg: "releasedAt is required" });

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

        let files = req.files
        if (files && files.length > 0) {
            let uploadedFileURL = await uploadFile(files[0])
            req.uploadedFileURL = uploadedFileURL;
            data.bookCover = uploadedFileURL
        }
        else {
            return res.status(400).send({ msg: "No file found" })
        }

        let newdoc = await bookModel.create(data);
        res.status(201).send({ status: true, data: newdoc });
   }
    catch (err) {
        res.status(500).send({ status: false, msg: "Internal server error" });
    }
};

// -----------------fetch Books 

const getBooks = async function (req, res) {
    try {
        let userQuery = req.query;
        let filter = { isDeleted: false};

        if (!isValidRequestBody(userQuery)) {
            let books = await bookModel.find(filter).select({ title: 1, book_id: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1});
            const sorted = books.sort((a, b) => a.title.localeCompare(b.title));
            return res.status(200).send({ status: true, data: sorted })
        };

        const { userId, category, subcategory,bookId} = userQuery;
        if (!isValid(userId) && !isValid(category) && !isValid(subcategory) && !isValid(bookId))
            return res.status(400).send({ status: false, msg: "invalid query parameter" })

         

        if (userId) {
            if (!isValidOjectId(userId)) return res.status(400).send({ status: false, message: "Invalid userId" });
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
        if (Array.isArray(findBook) && findBook.length === 0) 
            return res.status(404).send({ status: false, message: "Books Not Found" });

            // let reviews = await reviewModel.find({ bookId: bookId , isDeleted: false });
            // let booksWithReview = findBook.toObject()
            // Object.assign(booksWithReview, { reviewsData: reviews });
        
            const sortedBooks = findBook.sort((a, b) => a.title.localeCompare(b.title));
        
            res.status(200).send({ status: true, message: "Books list", data: sortedBooks });
       
    }
    catch (err) {
        res.status(500).send({ status: false, message: "Internal Server Error", error: err.message, });
    }
};

// --------------------get Book By BookId  

const getBookByBookId = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        //    VALIDATION
        if (!isValidOjectId(bookId)) {
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
// -------------------updateBook By BookId

const updateBook = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        //BOOKID VALIDATIONS
        if (!isValidOjectId(bookId)) {
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




//----------------------DELETE books by bookId


const deleteBookId = async function (req, res) {
    try {
        const bookId = req.params.bookId;
        if (!isValidOjectId(bookId)) {
            return res.status(400).send({ status: false, message: "Enter BookId in Params also Valid Id" })
        }
        const existBook = await bookModel.findOne({ _id: bookId, isDeleted: false });
        if (!existBook) {
            return res.status(404).send({ status: false, message: "Book not Found ,Allready Deletd With given id" });
        }
        // CHECKING USER AUTHORIZATION
        if (req.loggedInUser != existBook.userId) {
            return res.status(403).send({ status: false, message: "Unauthorize To Make Changes" })
        }
        deletedAt = Date.now();
        const updatedBook = await bookModel.findOneAndUpdate({ _id: bookId }, { $set: { isDeleted: true, deletedAt: deletedAt } }, { new: true });
        res.status(200).send({ status: true, message: "Successfully Deleted" })
    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message })
    }
};

module.exports = { createBookDoc, getBooks, getBookByBookId, updateBook, deleteBookId }




