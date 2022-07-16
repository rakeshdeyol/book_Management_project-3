const userModel =require("../model/userModel")
const jwt = require("jsonwebtoken")
const isValidRequestBody= require('../validation/validation')

//-----------------userLogin 

const userLogin = async function(req,res){
    
    let email=req.body.email;
    let password=req.body.password
    //if (!(isValidRequestBody(data))) return res.status(400).send({ status: false, msg: "data is empty" });
    if(!(email)) return res.status(400).send({status:false,msg:"email is required"})
    if(!(password)) return res.status(400).send({status:false,msg:"password is required"})

    let user = await userModel.findOne({email:email,password:password});
    if(!user) return res.status(400).send({status:false,msg:"Please enter valid email and password"})
    

    let token = jwt.sign(
        { userId: user._id.toString(), iat: Math.floor(new Date().getTime() / 1000) },

        "project_3_Group-64", { expiresIn:"6000s" }
    );
    let decode= jwt.verify(token,"project_3_Group-64")
    let date=decode.iat
    let time= new Date(date*1000).toString()
    res.status(200).send({ status: true, message: "Successfully loggedin",iat:time, token: token });


    // let token = jwt.sign(
    //     {
    //         userId: user._id.toString(),
    //         iat: Math.floor(Date.now()/1000),
    //         exp: Math.floor(Date.now()/1000)+1*60 
    //     },
    //     "project_3_Group-64"               
    // )
    //     res.setHeader("x-api-key",token)
    //     return res.status(201).send({status:true,msg:"  sucessfully login",token: token})
        
    }

    module.exports.userLogin = userLogin;