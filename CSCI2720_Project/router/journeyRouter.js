const express = require("express");
const router = express.Router();
const session = require("express-session");
const mysql = require("mysql");
const connection = require("../mysql/connect.js");
const message = require("./message.js");

/* Response statuses:
 * -4: User is already logged in (with HTTP status 400)	*unused
 * -3: User is not logged in (with HTTP status 401)
 * -2: Special error					*unused
 * -1: Invalid input data (with HTTP status 400)
 *  0: Server error (with HTTP status 500)
 *  1: Success
 *  2: Special success					*unused
 */
// All methods here can and will only return statuses -3,-1,0,1

// frequently used messages
const notloggedin = (req,res)=>{
	if(req.session.active!==true){
		res.status(400).send(message(-3,"User is not logged in."));
		return true;
	} else return false;
};
const serverr = (req,res,err)=>{
	res.status(500).send(message(0,"Internal server error."));
	console.log(err);
};

// Login check
router.all("/*",(req,res,next)=>{
	if(notloggedin(req,res))return;
	else next();
});

// Get locations
router.get("/loc",(req,res)=>{
	const sort = ["locId","name","latitude","longitude"];
	if(!sort.includes(req.query.sort))res.status(400).send(message(-1,"Invalid sorting option."));
	connection.query("SELECT locId,name,latitude,longitude FROM location ORDER BY ?? "+(req.query.order=="0"?"ASC":"DESC")+";",[req.query.sort],(err,data)=>{
		if(err)serverr(req,res,err);
		else res.send(message(1,"Locations retrieved.",data));
	});
});

// Get destinations
router.get("/dest",(req,res)=>{
	const sort = ["destId","name"];
	if(!sort.includes(req.query.sort))res.status(400).send(message(-1,"Invalid sorting option."));
	connection.query("SELECT dest,Id,name FROM destination ORDER BY ?? "+(req.query.order=="0"?"ASC":"DESC")+";",[req.query.sort],(err,data)=>{
		if(err)serverr(req,res,err);
		else res.send(message(1,"Destinations retrieved.",data));
	});
});

// Search locations or destinations
router.get("/search",(req,res)=>{
	var query;
	var str=mysql.escape(req.query.str);
	str=str.slice(1,str.length-1);
	switch(req.query.type){
		case"locId":
			query="SELECT locId,name,latitude,longitude FROM location WHERE locId LIKE '%"+str+"%' ORDER BY locId ASC;";
			break;
		case"locName":
			query="SELECT locId,name,latitude,longitude FROM location WHERE name LIKE '%"+str+"%' ORDER BY name ASC;";
			break;
		case"destId":
			query="SELECT destId,name FROM destination WHERE destId LIKE '%"+str+"%' ORDER BY destId ASC;";
			break;
		case"destName":
			query="SELECT destId,name FROM destination WHERE name LIKE '%"+str+"%' ORDER BY name ASC;";
			break;
		default:
			return res.status(400).send(message(-1,"Invalid search type."));
	}
	connection.query(query,(err,data)=>{
		if(err)serverr(req,res,err);
		else res.send(message(1,data.length+" search results found.",data));
	});
});

// Get all location data and journeys
router.get("/data/:loc",(req,res)=>{
	connection.query("SELECT location.locId,location.name,location.latitude,location.longitude,COUNT(favourite.username) AS favcount FROM location LEFT JOIN favourite USING (locId) WHERE location.locId=? GROUP BY location.locId;",[req.params.loc],(err,ldata)=>{
		if(err)serverr(req,res,err);
		else if(ldata.length>0){
			const loc=ldata[0];
			connection.query("SELECT TRUE FROM favourite WHERE username=? AND locId=?;",[req.session.username,req.params.loc],(err,udata)=>{
				if(err)serverr(req,res,err);
				else connection.query("SELECT journey.destId,destination.name,journey.date,journey.type,journey.data,journey.colour,journey.descr FROM journey INNER JOIN destination USING (destId) WHERE journey.locId=? ORDER BY journey.date DESC,journey.destId ASC;",[loc.locId],(err,jdata)=>{
					if(err)serverr(req,res,err);
					else res.send(message(1,"Location data retrieved.",{locId:loc.locId,name:loc.name,latitude:loc.latitude,longitude:loc.longitude,favcount:loc.favcount,isUserFav:(udata.length>0),journeys:jdata}));
				});
			});
		} else res.status(400).send(message(-1,"Location (ID:"+req.params.loc+") not found."));
	});
});

// Get all location comments
router.get("/comment/:loc",(req,res)=>{
	connection.query("SELECT username,content,time FROM comment WHERE locId=? ORDER BY time DESC;",[req.params.loc],(err,data)=>{
		if(err)serverr(req,res,err);
		res.send(message(1,"Location data retrieved.",data));
	});
});

// Add a comment to a location
router.post("/comment/:loc",(req,res)=>{
	connection.query("SELECT locId FROM location WHERE locId=?;",[req.params.loc],(err,data)=>{
		if(err)serverr(req,res,err);
		else if(data.length>0){
			const loc=data[0];
			connection.query("INSERT INTO comment (locId,username,content) VALUES (?,?,?);",[loc.locId,req.session.username,req.body.content],(err,result)=>{
				if(err)serverr(req,res,err);
				else {
					res.send(message(1,"Comment added to location (ID:"+loc.locId+")."));
					console.log("User "+req.session.username+" commented on location "+loc.locId+".\nRef:"+JSON.stringify(result));
				};
			});
		} else res.status(400).send(message(-1,"Location (ID:"+req.params.loc+") not found"));
	});
});

module.exports = {journeyRouter:router};

