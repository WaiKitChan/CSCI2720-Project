const express = require("express");
const router = express.Router();
const session = require("express-session");
const bcrypt = require("bcryptjs");
const mysql = require("mysql");
const connection = require("../mysql/connect.js");
const message = require("./message.js");

/* Response statuses:
 * -4: User is already logged in (with HTTP status 400)
 * -3: User is not logged in (with HTTP status 401)
 * -2: Special error
 * -1: Invalid input data (with HTTP status 400)
 *  0: Server error (with HTTP status 500)
 *  1: Success
 *  2: Special success
 */

// frequently used messages
const loggedin = (req,res)=>{
	if(req.session.active===true){
		res.status(400).send(message(-4,"User is already logged in."));
		return true;
	} else return false;
};
const notloggedin = (req,res)=>{
	if(req.session.active!==true){
		res.status(401).send(message(-3,"User is not logged in."));
		return true;
	} else return false;
};
const serverr = (req,res,err)=>{
	res.status(500).send(message(0,"Internal server error."));
	console.log(err);
};

// User register
// Possible return statuses: -4,-2,-1,0,1
// -2 means username has been taken
router.post("/register",(req,res)=>{
	if(loggedin(req,res))return;

	const username=req.body.username,password=req.body.password;
	if(username.length<4||username.length>20)res.status(400).send(message(-1,"Length of the username should be between 4 and 20 characters."));
	else if(password.length<4||password.length>20)res.status(400).send(message(-1,"Length of the password should be between 4 and 20 characters."));
	else connection.query("SELECT username FROM user WHERE username=?;",[username],(err,data)=>{
		if(err)serverr(req,res,err);
		else if(data.length>0) res.send(message(-2,"Username has already been taken. Please choose another username."));
		else bcrypt.genSalt(10,(err,salt)=>{
			if(err)serverr(req,res,err);
			else bcrypt.hash(password,salt,(err,hash)=>{
				if(err)serverr(req,res,err);
				else connection.query("INSERT INTO user (username,password) VALUES (?,?);",[username,hash],(err,result)=>{
					if(err)serverr(req,res,err);
					else {
						res.send(message(1,"User registered successfully!"));
						console.log("User "+username+" registered.\nRef:"+JSON.stringify(result)+"\n");
					}
				});
			});
		});
	});
});

// User login
// Possible return statuses: -4,-1,0,1,2
// 2 means user is logged in as admin
router.post("/login",(req,res)=>{
	if(loggedin(req,res))return;

	connection.query("SELECT username,password,admin FROM user WHERE username=?;",[req.body.username],(err,data)=>{
		if(err)return serverr(req,res,err);
		if(data.length==0)return res.status(401).send(message(-1,"Login credentials are incorrect."));
		const user=data[0];
		bcrypt.compare(req.body.password,user.password,(err,equal)=>{
			if(err)serverr(req,res,err);
			else if(equal){
				req.session.active=true;
				req.session.username=user.username;
				if(user.admin)res.send(message(2,"Logged in as admin successfully!",{username:user.username}));
				else res.send(message(1,"Logged in successfully!",{username:user.username}));
				console.log("User "+user.username+" logged in.\n");
				connection.query("UPDATE user SET lastLogin=CURRENT_TIMESTAMP WHERE username=?;",[user.username],(err,result)=>{
					if(err)console.log("Failed to update login time of user.\n"+JSON.stringify(err)+"\n");
					else console.log("Ref:"+JSON.stringify(result)+"\n");
				});
			} else res.status(401).send(message(-1,"Login credentials are incorrect."));
		});
	});
});

// Get user login status
// Possible return statuses: -3,0,1,2
// 2 means user is logged in as admin
router.get("/login",(req,res)=>{
	if(notloggedin(req,res))return;
	else connection.query("SELECT admin FROM user WHERE username=?;",[req.session.username],(err,data)=>{
		if(err)serverr(req,res,err);
		if(data[0].admin)res.send(message(2,"User is logged in as admin.",{username:req.session.username}));
		else res.send(message(1,"User is logged in",{username:req.session.username}));
	});
});

// Methods below all require login
// Login check, returns status -3 if not logged in
router.all("/*",(req,res,next)=>{
	if(notloggedin(req,res))return;
	else next();
});

// User logout
// Possible return statuses: -3,0,1
router.post("/logout",(req,res)=>{
	const username=req.session.username;
	req.session.active=false;
	req.session.destroy((err)=>{
		if(err)serverr(req,res,err);
		else {
			res.send(message(1,"User logged out successfully!"));
			console.log("User "+username+" logged out.\n");
		}
	});
});

// Get all user favourites
// Possible return statuses: -3,0,1
router.get("/fav",(req,res)=>{
	connection.query("SELECT location.locId,location.name,location.latitude,location.longitude FROM favourite INNER JOIN location USING (locId) WHERE favourite.username=? ORDER BY location.locId ASC;",[req.session.username],(err,data)=>{
		if(err)serverr(req,res,err);
		else res.send(message(1,"User favourites retrieved.",data));
	});
});

// Set one user favourite
// Possible return statuses: -3,0,1
router.post("/fav",(req,res)=>{
	connection.query("INSERT INTO favourite (username,locId) VALUES (?,?)",[req.session.username,req.body.locId],(err,result)=>{
		if(err)serverr(req,res,err);
		else {
			res.send(message(1,"Location (ID:"+req.body.locId+") added to user favourite."));
			console.log("User "+req.session.username+" set location "+req.body.locId+" as favourite.\nRef:",result);
		}
	});
});

// Update all user favourites
// Possible return statuses: -3,-1,0,1
router.put("/fav",(req,res)=>{
	// unnecessary type check but prevents server failure and shutdown
	if(!Array.isArray(req.body.locId))return res.status(400).send(message(-1,"Invalid input."));

	connection.query("DELETE FROM favourite WHERE username=?;",[req.session.username],(err,result1)=>{
		if(err)serverr(req,res,err);
		else {
			var i=0,query="INSERT INTO favourite (username,locId) VALUES ";
			const l=req.body.locId.length,u=mysql.escape(req.session.username);
			for(const f of req.body.locId)query+="("+u+","+mysql.escape(f)+((++i==l)?")":"),");
			query+=";";
			connection.query(query,(err,result2)=>{
				if(err)serverr(req,res,err);
				else {
					res.send(message(1,"User favourites updated successfully!"));
					console.log("User "+req.session.username+"'s favourites updated.\nRef:",result1,result2);
				}
			});
		}
	});
});

// Remove one user favourite
// Possible return statuses: -3,0,1
router.delete("/fav",(req,res)=>{
	connection.query("DELETE FROM favourite WHERE username=? AND locId=?;",[req.session.username,req.query.locId],(err,result)=>{
		if(err)serverr(req,res,err);
		else {
			res.send(message(1,"Location (ID:"+req.query.locId+") removed from user favourite."));
			console.log("User "+req.session.username+" unset location "+req.query.locId+" as favourite.\nRef:",result);
		}
	});
});

module.exports = {userRouter:router};

