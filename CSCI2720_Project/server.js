/*
const mongoose = require("./mongodb/connect.js");
const {Location,Destination,Journey,User} = require("./mongodb/schema.js");
*/


/* Initialization, only uncomment if needed */
/* const connection = require("./mysql/tables.js");
const bcrypt = require("bcryptjs");
bcrypt.genSalt(10,(err,salt)=>{
	if(err)throw err;
	else bcrypt.hash("admin",salt,(err,hash)=>{
		if(err)throw err;
		else connection.query("INSERT INTO user (username,password,admin) VALUES ('admin',?,true);",[hash],(err,result)=>{
			if(err)throw err;
			else console.log("Admin account created.\nRef:",result);
		});
	});
});*/

const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const session = require("express-session");
const Store = require("./mongodb/store.js")(session);
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
	secret:"Group17",
	resave:true,
	saveUninitialized:true,
	cookie:{HttpOnly:true,MaxAge:3600000},
	store:new Store()
}));

app.use(express.static("public"));

const {userRouter} = require("./router/userRouter.js");
const {journeyRouter} = require("./router/journeyRouter.js");
const {adminRouter} = require("./router/adminRouter.js");
app.use("/user",userRouter);
app.use("/journey",journeyRouter);
app.use("/a",adminRouter);

app.all("/*",(req,res)=>res.redirect("/"));

const server = app.listen(2083);

