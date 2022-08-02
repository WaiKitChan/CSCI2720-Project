const express = require("express");
const router = express.Router();
const session = require("express-session");
const bcrypt = require("bcryptjs");
const fetch = require("node-fetch");
const xml2js = require("xml2js");
const mysql = require("mysql");
const connection = require("../mysql/connect.js");
const message = require("./message.js");

/* Response statuses:
 * -4: User is already logged in (with HTTP status 400)	*unused
 * -3: User is not logged in (with HTTP status 401)
 * -2: Special error					*User is not logged in as admin (with HTTP status 401)
 * -1: Invalid input data				*HTTP status is not set to 400
 *  0: Server error (with HTTP status 500)
 *  1: Success
 *  2: Special success					*unused
 */

// frequently used messages
const dberror = (req,res,err)=>{
	res.status(500).send(message(0,"Database error."));
	console.log(err);
};
const success = (req,res,msg,result)=>{ // not used for select
	res.send(message(1,msg,result));
	console.log(msg+"\nRef:"+JSON.stringify(result));
};

// admin authantocation
router.all("/*",(req,res,next)=>{
	if(req.session.active!==true)res.status(401).send(message(-3,"User is not logged in."));
	else connection.query("SELECT admin FROM user WHERE username=?;",[req.session.username],(err,data)=>{
		if(err)dberror(req,res,err);
		else if(!data[0].admin)res.status(401).send(message(-2,"User is not an administrator."));
		else next();
	});
});

// user CRUD
router.get("/user/:name",(req,res)=>{ // get one user
	connection.query("SELECT username,admin,lastLogin FROM user WHERE username=?;",[req.params.name],(err,data)=>{
		if(err)dberror(req,res,err);
		else if(data.length==0) res.send(message(-1,"User "+req.params.name+" not found."));
		else res.send(message(1,"User found.",data[0]));
	});
});
router.get("/user",(req,res)=>{ // get all users
	connection.query("SELECT username,admin,lastLogin FROM user ORDER BY username ASC;",(err,data)=>{
		if(err)dberror(req,res,err);
		else res.send(message(1,data.length+" users found.",data));
	});
});
router.post("/user",(req,res)=>{ // create one user
	bcrypt.genSalt(10,(err,salt)=>{
		if(err){
			res.status(500).send(message(0,"Cannot generate salt."));
			console.log(err);
		} else bcrypt.hash(req.body.password,salt,(err,hash)=>{
			if(err){
				res.status(500).send(message(0,"Cannot generate hashed password."));
				console.log(err);
			} else connection.query("INSERT INTO user (username,password,admin) VALUES (?,?,?);",[req.body.username,hash,req.body.admin],(err,result)=>{
				if(err)dberror(req,res,err);
				else success(req,res,"User "+req.body.username+" created.",result);
			});
		});
	});
});
router.put("/user",(req,res)=>{ // update one user
	var query,data;
	if(req.body.password)bcrypt.genSalt(10,(err,salt)=>{ // generate new password if password needs to be updated
		if(err){
			res.status(500).send(message(0,"Cannot generate salt."));
			console.log(err);
		} else bcrypt.hash(req.body.password,salt,(err,hash)=>{
			if(err){
				res.status(500).send(message(0,"Cannot generate hashed password."));
				console.log(err);
			} else connection.query("UPDATE user SET username=?,password=?,admin=? WHERE username=?;",[req.body.username,hash,req.body.admin,req.body.username],(err,result)=>{
				if(err)dberror(req,res,err);
				else if(result.affectedRows>0)success(req,res,"User "+req.body.username+" updated.",result);
				else res.send(message(-1,"User "+req.body.username+" not found.",result));
			});
		});
	}); else connection.query("UPDATE user SET username=?,admin=? WHERE username=?;",[req.body.username,req.body.admin,req.body.username],(err,result)=>{
		if(err)dberror(req,res,err);
		else if(result.affectedRows>0)success(req,res,"User "+req.body.username+" updated.",result);
		else res.send(message(-1,"User "+req.body.username+" not found.",result));
	});
});
router.delete("/user/:name",(req,res)=>{ // delete one user
	connection.query("DELETE FROM user WHERE username=?;",[req.params.name],(err,result)=>{
		if(err)dberror(req,res,err);
		else if(result.affectedRows>0)success(req,res,"User "+req.params.name+" deleted.",result);
		else res.send(message(-1,"User "+req.params.name+" not found.",result));
	});
});

// location CRUD
router.get("/loc/:id",(req,res)=>{ // get one location
	connection.query("SELECT locId,name,latitude,longitude FROM location WHERE locId=?;",[req.params.id],(err,data)=>{
		if(err)dberror(req,res,err);
		else if(data.length==0) res.send(message(-1,"Location ID "+req.params.id+" not found."));
		else res.send(message(1,"Location found.",data[0]));
	});
});
router.get("/loc",(req,res)=>{ // get all locations
	connection.query("SELECT locId,name,latitude,longitude FROM location ORDER BY locId ASC;",(err,data)=>{
		if(err)dberror(req,res,err);
		else res.send(message(1,data.length+" locations found.",data));
	});
});
router.post("/loc",(req,res)=>{ // create one location
	connection.query("INSERT INTO location (locId,name,latitude,longitude) VALUES (?,?,?,?);",[req.body.locId,req.body.name,req.body.latitude,req.body.longitude],(err,result)=>{
		if(err)dberror(req,res,err);
		else success(req,res,"Location "+req.body.name+" (id:"+req.body.locId+") created.",result);
	});
});
router.put("/loc",(req,res)=>{ // update one location
	connection.query("UPDATE location SET locId=?,name=?,latitude=?,longitude=? WHERE locId=?;",[req.body.locId,req.body.name,req.body.latitude,req.body.longitude,req.body.locId],(err,result)=>{
		if(err)dberror(req,res,err);
		else if(result.affectedRows>0)success(req,res,"Location "+req.body.name+" (id:"+req.body.locId+") updated.",result);
		else res.send(message(-1,"Location ID "+req.body.locID+" not found.",result));
	});
});
router.delete("/loc/:id",(req,res)=>{ // delete one location
	connection.query("DELETE FROM location WHERE locId=?;",[req.params.id],(err,result)=>{
		if(err)dberror(req,res,err);
		else if(result.affectedRows>0)success(req,res,"Location (id:"+req.params.id+") deleted.",result);
		else res.send(message(-1,"Location ID "+req.params.id+" not found.",result));
	});
});

// destination CRUD
router.get("/dest/:id",(req,res)=>{ // get one destination
	connection.query("SELECT destId,name FROM destination WHERE destId=?;",[req.params.id],(err,data)=>{
		if(err)dberror(req,res,err);
		else if(data.length==0) res.send(message(-1,"Destination ID "+req.params.id+" not found."));
		else res.send(message(1,"Destination found.",data[0]));
	});
});
router.get("/dest",(req,res)=>{ // get all destinations
	connection.query("SELECT destId,name FROM destination ORDER BY destId ASC;",(err,data)=>{
		if(err)dberror(req,res,err);
		else res.send(message(1,data.length+" destinations found.",data));
	});
});
router.post("/dest",(req,res)=>{ // create one destination
	connection.query("INSERT INTO destination (destId,name) VALUES (?,?);",[req.body.destId,req.body.name],(err,result)=>{
		if(err)dberror(req,res,err);
		else success(req,res,"Destination "+req.body.name+" (id:"+req.body.destId+") created.",result);
	});
});
router.put("/dest",(req,res)=>{ // update one destination
	connection.query("UPDATE destination SET destId=?,name=? WHERE destId=?;",[req.body.destId,req.body.name,req.body.destId],(err,result)=>{
		if(err)dberror(req,res,err);
		else if(result.affectedRows>0)success(req,res,"Destination "+req.body.name+" (id:"+req.body.destId+") updated.",result);
		else res.send(message(-1,"Destination ID "+req.body.destID+" not found.",result));
	});
});
router.delete("/dest/:id",(req,res)=>{ // delete one destination
	connection.query("DELETE FROM destination WHERE destId=?;",[req.params.id],(err,result)=>{
		if(err)dberror(req,res,err);
		else if(result.affectedRows>0)success(req,res,"Destination (id:"+req.params.id+") deleted.",result);
		else res.send(message(-1,"Destination ID "+req.params.id+" not found.",result));
	});
});

// journey CRUD
router.get("/journey",(req,res)=>{ // get all journey
	connection.query("SELECT locId,destId,date,type,data,colour,descr FROM journey ORDER BY date DESC,locId ASC,destId ASC;",(err,data)=>{
		if(err)dberror(req,res,err);
		else res.send(message(1,data.length+" journeys found.",data));
	});
});
router.post("/journey",(req,res)=>{ // fetch new journeys
	fetch("https://resource.data.one.gov.hk/td/journeytime.xml",{method:"GET",redirect:"follow"})
	.then(res=>res.text())
	.then(str=>{
		xml2js.parseString(str,(err,data)=>{
			if(err){
				res.send(message(0,"Cannot parse data.",err));
				console.log(err);
			} else {
				var i=0,l,query="INSERT INTO journey (locId,destId,date,type,data,colour,descr) VALUES ";
				const journeys=data.jtis_journey_list.jtis_journey_time,jlen=journeys.length;
				const keys=["LOCATION_ID","DESTINATION_ID","CAPTURE_DATE","JOURNEY_TYPE","JOURNEY_DATA","COLOUR_ID","JOURNEY_DESC"],klen=keys.length;
				for(const j of journeys){
					query+="(";
					l=0;
					for(const k of keys)query+=mysql.escape(j[k][0])+((++l==klen)?"":",");
					query+=(++i==jlen)?")":"),";
				}
				query+=";";
				connection.query(query,(err,result)=>{
					if(err)dberror(req,res,err);
					else success(req,res,"Journeys fetched.",result);
				});
			}
		});
	})
	.catch(err=>{
		res.status(500).send(message(0,"Cannot fetch journey data.",err));
		console.log(err);
	});
});
router.put("/journey",(req,res)=>{ // clear all journeys and fetch new journeys
	fetch("https://resource.data.one.gov.hk/td/journeytime.xml",{method:"GET",redirect:"follow"})
	.then(res=>res.text())
	.then(str=>{
		xml2js.parseString(str,(err,data)=>{
			if(err){
				res.send(message(0,"Cannot parse data.",err));
				console.log(err);
			} else connection.query("TRUNCATE TABLE journey;",(err,result)=>{
				if(err)dberror(req,res,err);
				else {
					console.log("Journey truncated.");
					var i=0,l,query="INSERT INTO journey (locId,destId,date,type,data,colour,descr) VALUES ";
					const journeys=data.jtis_journey_list.jtis_journey_time,jlen=journeys.length;
					const keys=["LOCATION_ID","DESTINATION_ID","CAPTURE_DATE","JOURNEY_TYPE","JOURNEY_DATA","COLOUR_ID","JOURNEY_DESC"],klen=keys.length;
					for(const j of journeys){
						query+="(";
						l=0;
						for(const k of keys)query+=mysql.escape(j[k][0])+((++l==klen)?"":",");
						query+=(++i==jlen)?")":"),";
					}
					query[query.length-1]=";";
					console.log(query);
					connection.query(query,(err,result)=>{
						if(err)dberror(req,res,err);
						else success(req,res,"Journeys fetched and refreshed.",result);
					});
				}
			});
		});
	})
	.catch(err=>{
		res.status(500).send(message(0,"Cannot fetch journey data.",err));
		console.log(err);
	});
});
router.delete("/journey",(req,res)=>{ // delete all journeys
	connection.query("TRUNCATE TABLE journey;",(err,result)=>{
		if(err)dberror(req,res,err);
		else success(req,res,"Journeys wiped",result);
	});
});

module.exports = {adminRouter:router};

