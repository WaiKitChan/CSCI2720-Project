const connection = require("./connect.js");

// dropping location and destination can be disastrous as there are no automatic input methods
connection.query("DROP TABLE IF EXISTS journey,favourite,comment,user;",(err,res)=>{if(err)throw err;else console.log(JSON.stringify(res));});

connection.query("CREATE TABLE IF NOT EXISTS location("+
	"locId VARCHAR(3) CHARACTER SET ascii NOT NULL PRIMARY KEY,"+
	"name VARCHAR(80) CHARACTER SET ascii NOT NULL,"+
	"latitude DOUBLE,"+
	"longitude DOUBLE"+
");",(err,res)=>{
	if(err)throw err;
	else console.log("Table location created.\nRef:",JSON.stringify(res));
});

connection.query("CREATE TABLE IF NOT EXISTS destination("+
	"destId VARCHAR(4) CHARACTER SET ascii NOT NULL PRIMARY KEY,"+
	"name VARCHAR(40) CHARACTER SET ascii NOT NULL"+
");",(err,res)=>{
	if(err)throw err;
	else console.log("Table destination created.\nRef:",JSON.stringify(res));
});

connection.query("CREATE TABLE IF NOT EXISTS journey("+
	"id MEDIUMINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"+
	"locId VARCHAR(3) CHARACTER SET ascii NOT NULL,"+
	"destId VARCHAR(4) CHARACTER SET ascii NOT NULL,"+
	"date DATETIME,"+
	"type TINYINT,"+
	"data TINYINT,"+
	"colour TINYINT,"+
	"descr VARCHAR(120) CHARACTER SET utf8,"+	// I do not know how long it should be
	"UNIQUE KEY (locId,destId,date),"+
	"CONSTRAINT loc FOREIGN KEY (locId) REFERENCES location(locId) ON UPDATE CASCADE ON DELETE CASCADE,"+
	"CONSTRAINT dest FOREIGN KEY (destId) REFERENCES destination(destId) ON UPDATE CASCADE ON DELETE CASCADE"+
");",(err,res)=>{
	if(err)throw err;
	else console.log("Table journey created.\nRef:",JSON.stringify(res));
});

connection.query("CREATE TABLE IF NOT EXISTS user("+
	"username VARCHAR(20) CHARACTER SET utf8 NOT NULL PRIMARY KEY,"+
	"password VARCHAR(128) BINARY NOT NULL,"+
	"admin BOOLEAN DEFAULT FALSE,"+
	"lastLogin TIMESTAMP DEFAULT CURRENT_TIMESTAMP"+
");",(err,res)=>{
	if(err)throw err;
	else console.log("Table user created.\nRef:",JSON.stringify(res));
});

connection.query("CREATE TABLE IF NOT EXISTS favourite("+
	"username VARCHAR(20) CHARACTER SET utf8 NOT NULL,"+
	"locId VARCHAR(3) CHARACTER SET ascii NOT NULL,"+
	"PRIMARY KEY (username,locId),"+
	"CONSTRAINT user FOREIGN KEY (username) REFERENCES user(username) ON UPDATE CASCADE ON DELETE CASCADE,"+
	"CONSTRAINT favloc FOREIGN KEY (locId) REFERENCES location(locId) ON UPDATE CASCADE ON DELETE CASCADE"+
");",(err,res)=>{
	if(err)throw err;
	else console.log("Table favourite created.\nRef:",JSON.stringify(res));
});

connection.query("CREATE TABLE IF NOT EXISTS comment("+
	"id MEDIUMINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"+
	"locId VARCHAR(3) CHARACTER SET ascii NOT NULL,"+
	"username VARCHAR(20) CHARACTER SET utf8 NOT NULL,"+
	"content VARCHAR(120) CHARACTER SET utf8 NOT NULL,"+
	"time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"+
	"UNIQUE KEY (username,time)"+
");",(err,res)=>{
	if(err)throw err;
	else console.log("Table comment created.\nRef:",JSON.stringify(res));
});

module.exports = connection;

