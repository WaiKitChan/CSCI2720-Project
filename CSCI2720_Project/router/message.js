
/* Standard response format of the express routers in this project
 * message(st,msg,data) returns a JSON.stringified object in the form
 * {
 * 	status: st,	type: integer
 * 	msg: msg,	type: string
 * 	data: data	type: object or array
 * }
 */

module.exports=(st,msg,data)=>'{"status":'+st+',"msg":"'+msg+'","data":'+(data?JSON.stringify(data):'{}')+'}';

