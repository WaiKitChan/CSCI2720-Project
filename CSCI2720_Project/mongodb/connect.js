const mongoose = require("mongoose");
mongoose.connect("mongodb://s1155125609:@localhost/s1155125609",{useNewUrlParser:true,useFindAndModify:false,useCreateIndex:true,useUnifiedTopology:true}); // password has been removed
const db = mongoose.connection;
db.on("error",console.error.bind(console,"Mongodb connection error."));
db.once("open",()=>console.log("Mongodb connection is open."));
module.exports = mongoose;

