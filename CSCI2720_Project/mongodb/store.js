const mongoose = require("./connect.js");

const SessionSchema = mongoose.Schema({
	sid:{type:String,required:true,unique:true},
	data:{type:mongoose.Schema.Types.Mixed,required:true},
	expires:{type:Date,default:Date.now,expires:3600}
});
const Session = mongoose.model("Session",SessionSchema);

module.exports = (session)=>{
	const noop=()=>{};
	class Store extends session.Store {
		all(cb=noop){
			Session.find({},(err,data)=>{
				if(err)cb(err);
				else if(!data)cb(null,null);
				else cb(null,data);
			});
		}
		length(cb=noop){
			Session.countDocuments({},(err,count)=>{
				if(err)cb(err);
				else cb(null,count);
			});
		}
		get(sid,cb=noop){
			Session.findOne({sid:sid},(err,sess)=>{
				if(err&&err.code!=="ENOENT")cb(err);
				else if(err||!sess)cb(null,null);
				else cb(null,sess.data);
			});
		}
		set(sid,sess,cb=noop){
			Session.findOneAndUpdate({sid:sid},{data:sess},{upsert:true},(err)=>{
				if(err)cb(err);
				else cb(null);
			});
		}
		/*touch(sid,sess,cb=noop){
			Session.deleteOne({sid:sid},(err,data)=>{
				if(err)cb(err);
				else set(sid,sess,cb);
			});
		}*/
		destroy(sid,cb=noop){
			Session.findOneAndDelete({sid:sid},(err)=>{
				if(err)cb(err);
				else cb(null);
			});
		}
		clear(sid,cb=noop){
			Session.deleteMany({},(err)=>{
				if(err)cb(err);
				else cb(null);
			});
		}
	}
	return Store;
}

