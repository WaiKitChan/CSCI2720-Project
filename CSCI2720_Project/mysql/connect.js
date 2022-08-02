const mysql = require("mysql");
const connection = mysql.createConnection({host:"localhost",user:"s1155125609",password:"",database:"s1155125609"}); // password has been removed

connection.connect((err)=>{
	if(err)console.log("MySQL connection error.");
	else console.log("MySQL connection success.");
});

module.exports = connection;

