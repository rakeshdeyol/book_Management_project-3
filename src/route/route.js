const express = require("express");
const router =express.Router();
const userController = require("../controller/userController")
const bookController =require("../controller/bookController")
const reviewController = require("../controller/reviewController")
const middleware = require("../middleware/auth")
const login = require("../controller/login")


//---------------------------------- *** user api ***-----------------------------------------//

router.post("/register",userController.createUser)

 router.post("/login",login.userLogin)
 //-----------------------------------## Book api ##-------------------------------------------------//

router.post("/books",middleware.authentication,bookController.createBookDoc);
            
router.get("/books",middleware.authentication,bookController.getBooks);

 router.get("/books/:bookId",middleware.authentication,bookController.getBookByBookId);

 router.put("/books/:bookId",middleware.authentication,bookController.updateBook);

 router.delete("/books/:bookId",middleware.authentication,bookController.deleteBookId);

//----------------------##  review's Api ##-----------------------------------------------------------//

router.post("/books/:bookId/review",reviewController.createReview);


 router.delete("/books/:bookId/review/:reviewId",reviewController.deleteReviewById)


// ==========> This API is used for handling any invalid Endpoints <=========== 
router.all("/*", async function (req, res) {
    res.status(404).send({ status: false, msg: "Page Not Found!!!" });
  });

module.exports=router;
