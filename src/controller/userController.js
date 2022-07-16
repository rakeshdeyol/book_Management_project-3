const userModel = require("../model/userModel");
const {isValid,isValidName,isValidEmail,isValidMobile,isValidPassword,isValidRequestBody,isValidPincode} =require("../validation/validation")

                      //  creating user
const createUser = async function (req, res) {
    try {
        let userBody = req.body;
       
                     //  validate body

        if (!isValidRequestBody(userBody)) {
            return res.status(400).send({ status: false, msg: "userDetails must be provided" });
        }

                        // destructuring
        let { title, name, phone, email, password, address } = userBody 

                       //  validation
        if (!isValid(title)) return res.status(400).send({ status: false, msg: "title is required" })
        if (!isValid(name)) return res.status(400).send({ status: false, msg: "name is required" })
        if (!isValid(phone)) return res.status(400).send({ status: false, msg: "phone is required" })
        if (!isValid(email)) return res.status(400).send({ status: false, msg: "Email is required" })
        if (!isValid(password)) return res.status(400).send({ status: false, msg: "password is required" })
        // if (!isValid(address)) return res.status(400).send({ status: false, msg: "address is required" })

                               //---------title validation
        if (!["Mr", "Miss", "Mrs"].includes(title.trim())) {
            return res.status(400).send({ status: false, msg: "Title must includes['Mr','Miss','Mrs']" })
        }

                         //------match name with regex
        if (!isValidName(name.trim()))
            return res.status(400).send({ status: false, msg: "Please use valid type of name" })
        

                             //-------match phone with regex
        if (!isValidMobile(phone.trim())) {
            return res.status(400).send({ status: false, msg: "please provide a valid phone Number" })
        } 

                             //------checking duplicate phone no
        let duplicatePhone = await userModel.findOne({ phone: phone })
        if (duplicatePhone) {
            return res.status(400).send({ status: false, msg: 'Phone already exists' })
        }

                               //-------match email with regex
        if (!isValidEmail(email.trim())) {
            return res.status(400).send({ status: false, msg: "Please provide a email in correct format" })
        }

                                //--------match password with regex
         if (!isValidPassword(password.trim())) {
            return res.status(400).send({ status: false, msg: "Please provide Password first letter in uppercase, lowercase and number with min. 8  max 15 length" })
        }

                                   //check if email is already in use
        let duplicateEmail = await userModel.findOne({ email: email })
        if (duplicateEmail) {
            return res.status(400).send({ status: false, msg: 'email already exists' })
        }
                                    //----------addressValidation
        if("address" in userBody){
            const { pincode,street,city } = address
            if(typeof address === "string") return res.status(400).send({status:false,message:"Address Should be of object type"})
            if(isValidRequestBody(address)) return res.status(400).send({status:false,message:"Address Should Not Be Empty"})
            if("street" in address){
                if(!isValid(street)) return res.status(400).send({status:false,message:"Dont Left Street Attribute Empty"})}
            if("city" in address){
                if(!isValid(city)) return res.status(400).send({status:false,message:"Dont Left city Attribute Empty"})
                if(!isValidName(city)) return res.status(400).send({status:false,message:"Pls Enter Valid City Name"})}
            if("pincode"in address){
                if(!isValid(pincode)) return res.status(400).send({status:false,message:"Dont Left pincode Attribute Empty"})
                if (!isValidPincode(pincode)) return res.status(400).send({ status: false, message: "Pls Enter Valid PAN Pincode" })}
            }
            

        let newUser = await userModel.create(userBody);
        return res.status(201).send({ status: true, msg: "user created successfully", data: newUser })
     } catch (err) {
       console.log(err)
        return res.status(500).send({ status: false, msg: "message error" })
     }
}

module.exports = { createUser }