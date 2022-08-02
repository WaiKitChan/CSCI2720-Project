const ce = React.createElement; // no JSX
const hr = ()=>ce("hr");
const br = ()=>ce("br");

class App extends React.Component {
	constructor(props) {
		super(props);
		this.state={isLoggedIn:false,username:"",isAdmin:false,page:0};
		this.popstate=this.popstate.bind(this);
		this.loginHandler=this.loginHandler.bind(this);
		this.logoutHandler=this.logoutHandler.bind(this);
		this.changePage=this.changePage.bind(this);
	}
	popstate(e) {
		if(e.state)this.setState({page:e.state.page?e.state.page:0});
	}
	componentDidMount() {
		addEventListener("popstate",this.popstate);
		fetch("/user/login",{method:"GET"})
		.then(res=>res.json())
		.then(res=>this.setState({isLoggedIn:res.status>0,username:res.status>0?res.data.username:"",isAdmin:(res.status==2)}))
		.catch(err=>console.log(err));
	}
	componentWillUnmount() {
		removeEventListener("popstate",this.popstate);
	}
	loginHandler(username,admin) {
		this.setState({isLoggedIn:true,username:username,isAdmin:admin});
	}
	logoutHandler() {
		this.setState({isLoggedIn:false,username:"",isAdmin:false});
	}
	changePage(pageId) {
		const pages = ["/chart","/favourites","/locations","/admin/user","/admin/loc","/admin/dest","/admin/journey"];
		history.pushState({page:pageId},"Journey Time Indicator",pages[pageId+2]);
		this.setState({page:pageId});
	}
	render() {return ce("div",{className:"container-fluid vh-100 mx-auto",style:{"width":"90%"}},
		ce(Header,{isLoggedIn:this.state.isLoggedIn,username:this.state.username,logoutHandler:this.logoutHandler}),
		ce(Nav,{isLoggedIn:this.state.isLoggedIn,isAdmin:this.state.isAdmin,changePage:this.changePage}),
		ce(Main,{isLoggedIn:this.state.isLoggedIn,isAdmin:this.state.isAdmin,loginHandler:this.loginHandler,page:this.state.page}),
		ce(Footer)
	);}
}

class Header extends React.Component {
	constructor(props) {
		super(props);
		this.logout=this.logout.bind(this);
	}
	logout() {
		fetch("/user/logout",{method:"POST"})
		.then(res=>res.json())
		.then(res=>this.props.logoutHandler())
		.catch(err=>console.log(err));
	}
	render() {return ce("header",{className:"d-flex p-2"},
		ce("h1",{className:"col-7"},"Journey Time Indicator"),
		ce("div",{id:"loginName",className:"col-5 text-right"},
			this.props.isLoggedIn?this.props.username:"User not logged in",
			br(),
			this.props.isLoggedIn?ce("button",{type:"button",className:"btn btn-outline-secondary mt-1",onClick:this.logout},"Logout"):null
		)
	);}
}

class Nav extends React.Component {
	render() {
		var links = [
			ce("div",{key:0,className:"text-link text-primary",onClick:()=>this.props.changePage(0)},"Main"),
			ce("div",{key:1,className:"text-link text-primary",onClick:()=>this.props.changePage(-1)},"Favourites"),
			ce("div",{key:2,className:"text-link text-primary",onClick:()=>this.props.changePage(-2)},"Chart"),
			ce("div",{key:3,className:"text-link text-primary",onClick:()=>this.props.changePage(1)},"User"),
			ce("div",{key:4,className:"text-link text-primary",onClick:()=>this.props.changePage(2)},"Location"),
			ce("div",{key:5,className:"text-link text-primary",onClick:()=>this.props.changePage(3)},"Destination"),
			ce("div",{key:6,className:"text-link text-primary",onClick:()=>this.props.changePage(4)},"Journey")
		];
		return ce("nav",{className:"d-flex justify-content-around align-items-center px-2 "+(this.props.isLoggedIn?"nav-visible":"nav-hidden")},links.slice(0,this.props.isAdmin?7:3));
	}
}

class Main extends React.Component {
	render() {
		var comp;
		if(!this.props.isLoggedIn)comp=Form;
		else if((!this.props.isAdmin)&&this.props.page>0)comp=Location;
		else switch(this.props.page){
			case -2: comp=Chart; break;
			case -1: comp=Favourite; break;
			case 0: comp=Location; break;
			default: comp=Admin;
		}
		return ce("section",{className:"px-2 py-3"},
			ce(comp,{isAdmin:this.props.isAdmin,loginHandler:this.props.loginHandler,page:this.props.page})
		);
	}
}

class Location extends React.Component {
	constructor(props) {
		super(props);
		this.state={locId:""};
		this.popstate=this.popstate.bind(this);
		this.changeLoc=this.changeLoc.bind(this);
	}
	popstate(e) {
		if(e.state)this.setState({locId:e.state.locId?e.state.locId:""});
	}
	componentDidMount() {
		addEventListener("popstate",this.popstate);
	}
	componentWillUnmount() {
		removeEventListener("popstate",this.popstate);
	}
	changeLoc(locId){
		history.pushState({locId:locId},"Journey Time Indicator","/locations"+(locId?("/"+locId):""));
		this.setState({locId:locId});
	}
	render() {return ce(this.state.locId?LocDetails:LocSelect,{locId:this.state.locId,changeLoc:this.changeLoc});}
}

class LocSelect extends React.Component {
	render() {return ce("div",null,
		ce(LocList,{changeLoc:this.props.changeLoc}),
		hr(),
		ce(LocSearch,{changeLoc:this.props.changeLoc}),
		hr(),
		ce(LocMap,{changeLoc:this.props.changeLoc})
	);}
}

class LocList extends React.Component {
	constructor(props) {
		super(props);
		this.state={pending:false,loc:[]};
		this.sort=this.sort.bind(this);
	}
	componentDidMount() {
		fetch("/journey/loc?sort=locId&order=0",{method:"GET"})
		.then(res=>res.json())
		.then(res=>this.setState({loc:res.data}))
		.catch(err=>console.log(err));
	}
	sort(sort,order) {
		this.setState({pending:true});
		fetch("/journey/loc?sort="+sort+"&order="+order,{method:"GET"})
		.then(res=>res.json())
		.then(res=>this.setState({pending:false,loc:res.data}))
		.catch(err=>console.log(err));
	}
	render() {
		var i=0,j=0,tr=[
			ce("th",{key:0},
				ce("div",null,"Location ID"),
				ce("div",null,
					ce("button",{type:"button",className:"btn btn-light btn-up",onClick:()=>this.sort("locId",1),disabled:this.state.pending},String.fromCharCode(8743)),
					ce("button",{type:"button",className:"btn btn-light btn-down",onClick:()=>this.sort("locId",0),disabled:this.state.pending},String.fromCharCode(8744))
				)
			),
			ce("th",{key:1},
				ce("div",null,"Location Name"),
				ce("div",null,
					ce("button",{type:"button",className:"btn btn-light btn-up",onClick:()=>this.sort("name",1),disabled:this.state.pending},String.fromCharCode(8743)),
					ce("button",{type:"button",className:"btn btn-light btn-down",onClick:()=>this.sort("name",0),disabled:this.state.pending},String.fromCharCode(8744))
				)
			),
			ce("th",{key:2},
				ce("div",null,"Latitude"),
				ce("div",null,
					ce("button",{type:"button",className:"btn btn-light btn-up",onClick:()=>this.sort("latitude",1),disabled:this.state.pending},String.fromCharCode(8743)),
					ce("button",{type:"button",className:"btn btn-light btn-down",onClick:()=>this.sort("latitude",0),disabled:this.state.pending},String.fromCharCode(8744))
				)
			),
			ce("th",{key:3},
				ce("div",null,"Longitude"),
				ce("div",null,
					ce("button",{type:"button",className:"btn btn-light btn-up",onClick:()=>this.sort("longitude",1),disabled:this.state.pending},String.fromCharCode(8743)),
					ce("button",{type:"button",className:"btn btn-light btn-down",onClick:()=>this.sort("longitude",0),disabled:this.state.pending},String.fromCharCode(8744))
				)
			)
		],tbody=[ce("tr",{key:i++},tr)];
		const columns = ["name","latitude","longitude"];
		for(const loc of this.state.loc){
			j=0;
			tr=[ce("td",{key:j++,className:"text-primary text-link",onClick:()=>this.props.changeLoc(loc.locId)},loc.locId)];
			for(const key of columns)tr.push(ce("td",{key:j++},loc[key]));
			tbody.push(ce("tr",{key:i++},tr));
		}

		return ce("div",null,
			ce("h3",null,"List of locations"),
			ce("table",{className:"table-data"},ce("tbody",null,tbody)),
		);
	}
}

class LocSearch extends React.Component {
	constructor(props) {
		super(props);
		this.state={pending:false,loc:[]};
		this.search=this.search.bind(this);
	}
	search() {
		const str = document.getElementById("str").value,type = document.getElementById("locId").checked?"locId":"locName";
		if(!str){alert("Search string cannot be empty!");return;}
		this.setState({pending:true});
		fetch("/journey/search?str="+str+"&type="+type,{method:"GET"})
		.then(res=>res.json())
		.then(res=>{
			this.setState({pending:false,loc:res.data});
			alert(res.msg);
		})
		.catch(err=>console.log(err));
	}
	render() {
		var i=0,j=0,tr=[
			ce("th",{key:0},"Location ID"),
			ce("th",{key:1},"Location Name"),
			ce("th",{key:2},"Latitude"),
			ce("th",{key:3},"Longitude")
		],tbody=[ce("tr",{key:i++},tr)];
		const columns = ["name","latitude","longitude"];
		for(const loc of this.state.loc){
			j=0;
			tr=[ce("td",{key:j++,className:"text-primary text-link",onClick:()=>this.props.changeLoc(loc.locId)},loc.locId)];
			for(const key of columns)tr.push(ce("td",{key:j++},loc[key]));
			tbody.push(ce("tr",{key:i++},tr));
		}
		return ce("div",null,
			ce("h3",null,"Search locations"),
			ce("table",null,ce("tbody",null,
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"str"},"Search string:")),
					ce("td",null,ce("input",{type:"text",id:"str"}))
				),
				ce("tr",null,
					ce("td",null,"Search by:"),
					ce("td",null,
						ce("input",{type:"radio",id:"locId",name:"type",value:"locId",defaultChecked:true}),
						ce("label",{htmlFor:"locId"},"location ID"),
						ce("input",{type:"radio",id:"locName",name:"type",value:"locName",defaultChecked:false}),
						ce("label",{htmlFor:"locName"},"location name")
					)
				)
			)),
			ce("button",{type:"button",className:"btn btn-primary",onClick:this.search,disabled:this.state.pending},"Search"),
			ce("table",{className:"table-data"},ce("tbody",null,tbody))
		);
	}
}

class LocMap extends React.Component {
	constructor(props) {
		super(props);
		this.initialize=this.initialize.bind(this);
	}
	componentDidMount() {
		fetch("/journey/loc?sort=locId&order=0",{method:"GET"})
		.then(res=>res.json())
		.then(res=>this.initialize(res.data))
		.catch(err=>console.log(err));
	}
	initialize(data) {
		const length=data.length;
		const changeLoc=this.props.changeLoc;
		var i,FlagForMarker = [],marker = [],infowindow = [];

		var mapOptions = {
			center: { lat: 22.30, lng: 114.17 },
			zoom: 10
		};

		var map = new google.maps.Map(
			document.getElementById('map-canvas'),
			mapOptions
		);

		for(i=0;i<length;++i){
			FlagForMarker[i] = -1;

			marker[i] = new google.maps.Marker({
				position: { lat: data[i].latitude, lng:data[i].longitude },
				map: map,
				title:data[i].locId,
				key:i
			});
	
			infowindow[i] = new google.maps.InfoWindow({
				content: '<h5>'+data[i].locId+': '+data[i].name+'</h5>',
				locId:data[i].locId,
				className:"text-link"
			});
	
			marker[i].addListener('click',function(){
				if(FlagForMarker[this.key] > 0){
					changeLoc(this.title);
				}else{
					for(var i=0;i<length;++i){
						FlagForMarker[i]=-1;
						infowindow[i].close();
				  	}
					FlagForMarker[this.key]=1;
					infowindow[this.key].open(map,marker[this.key]);
				}
			});
		}
	}
	render() {
		return ce("div",{id:"map-canvas",style:{height:"70vh"}});
	}
}

class LocDetails extends React.Component {
	render() {return ce("div",null,
		ce("h6",{className:"text-primary text-link",onClick:()=>this.props.changeLoc("")},"Return to location selection"),
		hr(),
		ce(LocData,{locId:this.props.locId}),
		hr(),
		ce(LocComment,{locId:this.props.locId})
	);}
}

class LocData extends React.Component {
	constructor(props) {
		super(props);
		this.state={pending:false,data:{}};
		this.initializeMap=this.initializeMap.bind(this);
		this.setFav=this.setFav.bind(this);
	}
	componentDidMount() {
		fetch("/journey/data/"+this.props.locId,{method:"GET"})
		.then(res=>res.json())
		.then(res=>this.setState({data:res.data},this.initializeMap))
		.catch(err=>console.log(err));
	}
	initializeMap() {
		var i,FlagForMarker = [],marker = [],infowindow = [];

		var mapOptions = {
			center: { lat: 22.30, lng: 114.17 },
			zoom: 10
		};

		var map = new google.maps.Map(
			document.getElementById('map-canvas'),
			mapOptions
		);

		marker = new google.maps.Marker({
			position: { lat: this.state.data.latitude, lng:this.state.data.longitude },
			map: map,
			title:this.state.data.locId
		});
	}
	setFav() {
		this.setState({pending:true});
		if(this.state.data.isUserFav){
			fetch("/user/fav?locId="+this.props.locId,{method:"DELETE"})
			.then(res=>res.json())
			.then(res=>{
				var data=this.state.data;
				data.isUserFav=false;
				data.favcount-=1;
				this.setState({pending:false,data:data});
			})
			.catch(err=>console.log(err));
		} else {
			fetch("/user/fav",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({locId:this.props.locId})})
			.then(res=>res.json())
			.then(res=>{
				var data=this.state.data;
				data.isUserFav=true;
				data.favcount+=1;
				this.setState({pending:false,data:data});
			})
			.catch(err=>console.log(err));
		}
	}
	render() {
		var i=0,tr=[
			ce("th",{key:0},"Destination ID"),
			ce("th",{key:1},"Destination Name"),
			ce("th",{key:2},"Date"),
			ce("th",{key:3},"Time to wait (min)")
		],tbody=[ce("tr",{key:i++},tr)];
		const colours = ["","text-danger","text-warning","text-success"];
		const condition = ["","trafic congested","tunnel congested","tunnel closed",""];
		if(this.state.data.journeys)for(const j of this.state.data.journeys){
			tr=[
				ce("td",{key:0},j.destId),
				ce("td",{key:1},j.name),
				ce("td",{key:2},j.date),
				ce("td",{key:3,className:j.colour?colours[j.colour]:""},j.type==1?j.data:consition[j.data])
			];
			tbody.push(ce("tr",{key:i++},tr));
		}

		return ce("div",null,
			ce("div",{className:"d-flex"},
				ce("h3",{className:"col-9"},this.props.locId+": "+this.state.data.name),
				ce("div",{className:"col-3 text-right"},ce("button",{type:"button",className:this.state.data.isUserFav?"btn btn-outline-danger":"btn btn-outline-dark",onClick:this.setFav,disabled:this.state.pending},this.state.data.isUserFav?"Remove from favourites":"Add to favourites"))
			),
			ce("div",{id:'map-canvas',style:{height:"50vh"}}),
			ce("span",null,"Latitude: "+this.state.data.latitude+"; Longitude: "+this.state.data.longitude+"; Favourited by "+this.state.data.favcount+" users."),
			br(),
			ce("table",{className:"table-data"},ce("tbody",null,tbody))
		);
	}
}

class LocComment extends React.Component {
	constructor(props) {
		super(props);
		this.state={pending:false,comments:[]};
		this.addComment=this.addComment.bind(this);
	}
	componentDidMount() {
		fetch("/journey/comment/"+this.props.locId,{method:"GET"})
		.then(res=>res.json())
		.then(res=>this.setState({comments:res.data}))
		.catch(err=>console.log(err));
	}
	addComment() {
		const content=document.getElementById("content").value;
		if(!content){alert("Comment cannot be empty!");return;}
		this.setState({pending:true});
		fetch("/journey/comment/"+this.props.locId,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({content:content})})
		.then(res=>res.json())
		.then(res=>{return fetch("/journey/comment/"+this.props.locId,{method:"GET"});})
		.then(res=>res.json())
		.then(res=>this.setState({pending:false,comments:res.data}))
		.catch(err=>console.log(err));
	}
	render() {
		var i=0,tr=[
			ce("th",{key:0},"User"),
			ce("th",{key:1},"Comment"),
			ce("th",{key:2},"Posted at")
		],tbody=[ce("tr",{key:i++},tr)];
		for(const cmt of this.state.comments){
			tr=[
				ce("td",{key:0},cmt.username),
				ce("td",{key:1,className:"text-raw"},cmt.content),
				ce("td",{key:2},cmt.time)
			]
			tbody.push(ce("tr",{key:i++},tr));
		}
		return ce("div",null,
			ce("h3",null,"Comments"),
			ce("table",{className:"table-comments"},ce("tbody",null,tbody)),
			ce("h6",null,"Add comment:"),
			ce("textarea",{id:"content",className:"input-comment",placeholder:"<=120 characters",maxLength:120}),
			br(),
			ce("button",{type:"button",className:"btn btn-primary",onClick:this.addComment,disabled:this.state.pending},"Submit")
		);
	}
}

class Favourite extends React.Component {
	constructor(props) {
		super(props);
		this.state={pending:false,fav:[],loc:[]};
		this.shiftLocation=this.shiftLocation.bind(this);
		this.submit=this.submit.bind(this);
	}
	componentDidMount() {
		var favId=[];
		fetch("/user/fav",{method:"GET"})
		.then(res=>res.json())
		.then(res=>{
			this.setState({fav:res.data});
			for(const loc of res.data)favId.push(loc.locId);
			return fetch("/journey/loc?sort=locId&order=0",{method:"GET"});
		})
		.then(res=>res.json())
		.then(res=>{
			var loc=res.data,locOut=document.getElementById("locOut"),locIn=document.getElementById("locIn"),option;
			for(var i=0;i<loc.length;++i){
				option=document.createElement("option"); // React is arguably more troublesome for this since React components must be updated through state
				option.setAttribute("value",loc[i].locId);
				option.setAttribute("title",loc[i].name);
				option.innerHTML=loc[i].locId;
				if(favId.includes(loc[i].locId))locIn.appendChild(option);
				else locOut.appendChild(option);
			}
			this.setState({loc:loc})
		})
		.catch(err=>console.log(err));
	}
	shiftLocation(toFav) {
		var locOut=document.getElementById("locOut"),locIn=document.getElementById("locIn"),options,i;
		if(toFav){
			options=locOut.getElementsByTagName("option");
			for(i=0;i<options.length;++i)if(options[i].selected){
				options[i].selected=false;
				locIn.appendChild(options[i--]);
			}
		} else {
			options=locIn.getElementsByTagName("option");
			for(i=0;i<options.length;++i)if(options[i].selected){
				options[i].selected=false;
				locOut.appendChild(options[i--]);
			}
		}
	}
	submit() {
		var body={locId:[]};
		const newFav=document.getElementById("locIn").getElementsByTagName("option");
		for(const loc of newFav)body.locId.push(loc.value);
		this.setState({pending:true});
		fetch("/user/fav",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
		.then(res=>res.json())
		.then(res=>{
			var i,j,fav=[],favId=body.locId,loc=this.state.loc,locId=[];
			for(i=0;i<loc.length;++i)locId.push(loc[i].locId);
			for(i=0;i<favId.length;++i){
				j=locId.indexOf(favId[i]);
				if(j>=0)fav.push(loc[j]);
			}
			this.setState({fav:fav,pending:false});
			alert(res.msg);
		})
		.catch(err=>console.log(err));
	}
	render() {
		var i=0,j=0,tr=[
			ce("th",{key:0},"Location ID"),
			ce("th",{key:1},"Location Name"),
			ce("th",{key:2},"Latitude"),
			ce("th",{key:3},"Longitude")
		],tbody=[ce("tr",{key:i++},tr)];
		const columns = ["locId","name","latitude","longitude"];
		for(const fav of this.state.fav){
			j=0;
			tr=[];
			for(const key of columns)tr.push(ce("td",{key:j++},fav[key]));
			tbody.push(ce("tr",{key:i++},tr));
		}

		return ce("div",null,
			ce("h3",null,"User favourites"),
			ce("table",{className:"table-data"},ce("tbody",null,tbody)),
			hr(),
			ce("div",{className:"d-flex align-items-end"},
				ce("table",null,ce("tbody",null,
					ce("tr",null,
						ce("td",null,"Locations"),
						ce("td"),
						ce("td",null,"Favourites")
					),
					ce("tr",null,
						ce("td",null,ce("select",{id:"locOut",className:"input-multi",multiple:true})),
						ce("td",null,
							ce("button",{type:"button",className:"btn btn-secondary",onClick:()=>this.shiftLocation(true)},"->"),
							br(),
							ce("button",{type:"button",className:"btn btn-secondary",onClick:()=>this.shiftLocation(false)},"<-"),
						),
						ce("td",null,ce("select",{id:"locIn",className:"input-multi",multiple:true}))
					)
				)),
				ce("div",{className:"my-4"},ce("small",null,"*hover on the options for details"))
			),
			br(),
			ce("button",{type:"button",className:"btn btn-primary",onClick:this.submit,disabled:this.state.pending},"Update Favourites")
		);
	}
}

class Chart extends React.Component {
	constructor(props) {
		super(props);
		this.state={pending:false};
		this.drawChart=this.drawChart.bind(this);
	}
	drawChart() {
		this.setState({pending:true});
		fetch("/a/chart",{method:"POST"})
		.then(res=>res.json())
		.then(res=>this.setState({pending:false}))
		.catch(err=>console.log(err));
	}
	render() {
		const adminPart = ce("div",null,
			hr(),
			ce("button",{type:"button",className:"btn btn-primary",onClick:this.drawChart,disabled:this.state.pending},"Draw New Chart"),
			ce("small",null,"*admin right required, may need to reload page")
		);
		return ce("div",null,
			ce("h3",null,"Journey Time Chart 1"),
			ce("img",{src:"./chart/chartNode1.png",alt:"Journey Time Chart 1"}),
			hr(),
			ce("h3",null,"Journey Time Chart 2"),
			ce("img",{src:"./chart/chartNode2.png",alt:"Journey Time Chart 2"}),
			this.props.isAdmin?adminPart:null
		);
	}
}

class Admin extends React.Component {
	constructor(props) {
		super(props);
		this.state={pending:false,data:[[],[],[],[]],action:0}; // (action) 0: insert, 1: update, 2: delete
		this.submit=this.submit.bind(this);
		this.changeAction=this.changeAction.bind(this);
	}
	componentDidMount() {
		var data = []; // 0: user, 1: location, 2: destination, 3: journey
		fetch("/a/user",{method:"GET"})
		.then(res=>res.json())
		.then(res=>{
			data.push(res.data);
			return fetch("/a/loc",{method:"GET"});
		})
		.then(res=>res.json())
		.then(res=>{
			data.push(res.data);
			return fetch("/a/dest",{method:"GET"});
		})
		.then(res=>res.json())
		.then(res=>{
			data.push(res.data);
			return fetch("/a/journey",{method:"GET"});
		})
		.then(res=>res.json())
		.then(res=>{
			data.push(res.data);
			this.setState({data:data});
		})
		.catch(err=>console.log(err));
	}
	submit() {
		const type = this.props.page-1;
		const action = this.state.action;
		const keyFields = ["username","locId","destId"];
		var message = document.getElementById("message"),data = this.state.data;
		if(type==3){ // journey
			if(action==2){ // wipe
				if(confirm("Wipe journey database?")){
					this.setState({pending:true});
					fetch("/a/journey",{method:"DELETE"})
					.then(res=>res.json())
					.then(res=>{
						data[3]=[];
						this.setState({pending:false,data:data});
						message.innerHTML=res.msg;
					})
					.catch(err=>console.log(err));
				} else return;
			} else { // fetch or refresh
				if(confirm(action==0?"Fetch new journey data?":"Wipe database and fetch new journey data?")){
					this.setState({pending:true});
					fetch("/a/journey",{method:action==0?"POST":"PUT"})
					.then(res=>res.json())
					.then(res=>{
						message.innerHTML=res.msg;
						return fetch("/a/journey",{method:"GET"});
					})
					.then(res=>res.json())
					.then(res=>{
						data[3]=res.data;
						this.setState({pending:false,data:data});
					})
					.catch(err=>console.log(err));
				} else return;
			}
		} else {
			const keyField = keyFields[type],keyValue = document.getElementById(keyField).value,keyCheck = this.state.data[type].map((row)=>row[keyField]),keyIndex = keyCheck.indexOf(keyValue);
			if(!keyValue){message.innerHTML="Key field cannot be empty.";return;}

			if(action==0){ // insert
				if(keyIndex>=0){message.innerHTML="Cannot insert data with conflicting key field ("+keyValue+").";return;}
			} else { // update or delete
				if(keyIndex<0){message.innerHTML="Cannot "+(type==1?"type":"delete")+" non-existent data.";return;}
			}
			const loc = ["/a/user","/a/loc","/a/dest"];
			if(action==2){ // delete
				const datatype = ["user","location","destination"];
				if(confirm("Delete "+datatype[type]+" ("+keyValue+")?")){
					this.setState({pending:true});
					fetch(loc[type]+"/"+keyValue,{method:"DELETE"})
					.then(res=>res.json())
					.then(res=>{
						data[type].splice(keyIndex,1);
						this.setState({pending:false,data:data});
						message.innerHTML=res.msg;
					})
					.catch(err=>console.log(err));
				} else return;
			} else { // insert or update
				if(type==0){ // user
					const username=document.getElementById("username").value,password=document.getElementById("password").value,admin=document.getElementById("admin").checked;
					if(username.length<4||username.length>20){message.innerHTML="Length of username should be between 4 and 20 characters.";return;}
					else if(password) {
						if(password.length<4||password.length>20){message.innerHTML="Length of password should be between 4 and 20 characters.";return;}
					} else if(action==0){message.innerHTML="Password cannot be left empty for insert operation.";return;}
					
					var body;
					if(password)body={username:username,password:password,admin:admin};
					else body={username:username,admin:admin};

					this.setState({pending:true});
					fetch(loc[0],{method:action==0?"POST":"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
					.then(res=>res.json())
					.then(res=>{
						body.admin*=1; // cast to int
						if(action==0)data[0].push(body);
						else data[0].splice(keyIndex,1,body);
						this.setState({pending:false,data:data});
						message.innerHTML=res.msg;
					})
					.catch(err=>console.log(err));
				} else { // location or destination
					var body;
					if(type==1){
						const name=document.getElementById("name").value,latitude=document.getElementById("latitude").value,longitude=document.getElementById("longitude").value;
						if(action==0&&!(name&&latitude&&longitude)){message.innerHTML="Data cannot be left empty for insert operation.";return;}
						body={
							locId:keyValue,
							name:name?name:data[1][keyIndex].name,
							latitude:latitude?latitude:data[1][keyIndex].latitude,
							longitude:longitude?longitude:data[1][keyIndex].longitude
						};
					} else {
						const name=document.getElementById("name").value;
						if(action==0&&(!name)){message.innerHTML="Data cannot be left empty for insert operation.";return;}
						body={
							destId:keyValue,
							name:name?name:data[2][keyIndex].name
						};
					}
					if(confirm((action==0?"Insert":"Update")+" "+(type==1?"location":"destination")+" ("+keyValue+")?")){
						this.setState({pending:true});
						fetch(loc[type],{method:action==0?"POST":"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)})
						.then(res=>res.json())
						.then(res=>{
							if(action==0)data[type].push(body);
							else data[type].splice(keyIndex,1,body);
							this.setState({pending:false,data:data});
							message.innerHTML=res.msg;
						})
						.catch(err=>console.log(err));
					} else return;
				}
			}
		}
	}
	changeAction(a) {
		this.setState({action:a});
	}
	render() {
		const t = this.props.page-1;
		const types = ["Users","Locations","Destinations","Journeys"];
		const columns = [
			["username","admin","lastLogin"],
			["locId","name","latitude","longitude"],
			["destId","name"],
			["locId","destId","date","type","data","colour","descr"]
		];

		var i=0,j=0,tr=[];
		for(const key of columns[t])tr.push(ce("th",{key:i++},key));
		var tbody = [ce("tr",{key:j++},tr)];
		for(const row of this.state.data[t]){
			i=0;
			tr=[];
			for(const key of columns[t])tr.push(ce("td",{key:i++},row[key]));
			tbody.push(ce("tr",{key:j++},tr));
		}
		
		var inputform;
		switch(t){
			case 0: inputform=ce("table",null,ce("tbody",null,
				ce("tr",null,
					ce("td",null,ce("label",null,"Action")),
					ce("td",null,
						ce("input",{type:"radio",name:"action",id:"insert",onClick:()=>this.changeAction(0),defaultChecked:this.state.action==0}),
						ce("label",{htmlFor:"insert"},"Insert"),
						ce("input",{type:"radio",name:"action",id:"update",onClick:()=>this.changeAction(1),defaultChecked:this.state.action==1}),
						ce("label",{htmlFor:"update"},"update"),
						ce("input",{type:"radio",name:"action",id:"delete",onClick:()=>this.changeAction(2),defaultChecked:this.state.action==2}),
						ce("label",{htmlFor:"delete"},"delete")
					)
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"username"},"Username")),
					ce("td",null,ce("input",{type:"text",id:"username"}))
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"password"},"Password")),
					ce("td",null,ce("input",{type:"text",id:"password",disabled:this.state.action==2}))
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"admin"},"Admin")),
					ce("td",null,ce("input",{type:"checkbox",id:"admin",disabled:this.state.action==2}))
				)
			)); break;
			case 1: inputform=ce("table",null,ce("tbody",null,
				ce("tr",null,
					ce("td",null,ce("label",null,"Action")),
					ce("td",null,
						ce("input",{type:"radio",name:"action",id:"insert",onClick:()=>this.changeAction(0),defaultChecked:this.state.action==0}),
						ce("label",{htmlFor:"insert"},"Insert"),
						ce("input",{type:"radio",name:"action",id:"update",onClick:()=>this.changeAction(1),defaultChecked:this.state.action==1}),
						ce("label",{htmlFor:"update"},"update"),
						ce("input",{type:"radio",name:"action",id:"delete",onClick:()=>this.changeAction(2),defaultChecked:this.state.action==2}),
						ce("label",{htmlFor:"delete"},"delete")
					)
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"locId"},"Location ID")),
					ce("td",null,ce("input",{type:"text",id:"locId"}))
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"name"},"Name")),
					ce("td",null,ce("input",{type:"text",id:"name",className:"input-long",disabled:this.state.action==2}))
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"latitude"},"Latitude")),
					ce("td",null,ce("input",{type:"number",id:"latitude",disabled:this.state.action==2}))
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"longitude"},"Longitude")),
					ce("td",null,ce("input",{type:"number",id:"longitude",disabled:this.state.action==2}))
				),
			)); break;
			case 2: inputform=ce("table",null,ce("tbody",null,
				ce("tr",null,
					ce("td",null,ce("label",null,"Action")),
					ce("td",null,
						ce("input",{type:"radio",name:"action",id:"insert",onClick:()=>this.changeAction(0),defaultChecked:this.state.action==0}),
						ce("label",{htmlFor:"insert"},"Insert"),
						ce("input",{type:"radio",name:"action",id:"update",onClick:()=>this.changeAction(1),defaultChecked:this.state.action==1}),
						ce("label",{htmlFor:"update"},"update"),
						ce("input",{type:"radio",name:"action",id:"delete",onClick:()=>this.changeAction(2),defaultChecked:this.state.action==2}),
						ce("label",{htmlFor:"delete"},"delete")
					)
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"destId"},"Destination ID")),
					ce("td",null,ce("input",{type:"text",id:"destId"}))
				),
				ce("tr",null,
					ce("td",null,ce("label",{htmlFor:"name"},"Name")),
					ce("td",null,ce("input",{type:"text",id:"name",className:"input-long",disabled:this.state.action==2}))
				)
			)); break;
			case 3: inputform=ce("table",null,ce("tbody",null,
				ce("tr",null,
					ce("td",null,ce("label",null,"Action")),
					ce("td",null,
						ce("input",{type:"radio",name:"action",id:"insert",onClick:()=>this.changeAction(0),defaultChecked:this.state.action==0}),
						ce("label",{htmlFor:"insert"},"fetch"),
						ce("input",{type:"radio",name:"action",id:"update",onClick:()=>this.changeAction(1),defaultChecked:this.state.action==1}),
						ce("label",{htmlFor:"update"},"refresh"),
						ce("input",{type:"radio",name:"action",id:"delete",onClick:()=>this.changeAction(2),defaultChecked:this.state.action==2}),
						ce("label",{htmlFor:"delete"},"wipe"),
						br(),
						ce("small",{className:"text-danger"},"fetch and refresh will not work if locations and destinations are not properly set.")
					)
				)
			));
		}
		return ce("div",null,
			ce("h3",null,types[t]),
			ce("table",{className:"table-data"},ce("tbody",null,tbody)),
			hr(),
			inputform,
			ce("button",{type:"button",className:"btn btn-primary",onClick:this.submit,disabled:this.state.pending},"Submit"),
			ce("small",null,"*leave unneeded fields empty during update operation"),
			br(),br(),
			"Note: Update of data in the table above is not guaranteed to be correct. Page reload is recommended.",
			hr(),
			ce("h6",null,"Message:"),
			ce("span",{id:"message"})
		);
	}
}

class Form extends React.Component {
	constructor(props) {
		super(props);
		this.state={newUser:false,pending:false};
		this.popstate=this.popstate.bind(this);
		history.pushState({newUser:false},"User Login","/login");
		this.switchForm=this.switchForm.bind(this);
		this.login=this.login.bind(this);
		this.register=this.register.bind(this);
	}
	popstate(e) {
		if(e.state)this.setState({newUser:e.state.newUser?true:false});
	}
	componentDidMount() {
		addEventListener("popstate",this.popstate);
	}
	componentWillUnmount() {
		removeEventListener("popstate",this.popstate);
	}
	switchForm() {
		history.pushState({newUser:!this.state.newUser},"Journey Time Indicator",this.state.newUser?"/login":"/register");
		this.setState({newUser:!this.state.newUser});
		document.getElementById("message").innerHTML="";
	}
	login() {
		var username=document.getElementById("username"),password=document.getElementById("password"),message=document.getElementById("message");
		if(!username.value||!password.value){
			message.className="text-danger";
			message.innerHTML="Please fill in the login credentials.";
			return;
		}

		this.setState({pending:true});
		message.className="text-info";
		message.innerHTML="......";

		const data = {username:username.value,password:password.value};
		fetch("/user/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)})
		.then(res=>res.json())
		.then(res=>{switch(res.status){
			case -4:
			case -1:
			case 0:
				message.classList.add("text-danger");
				message.innerHTML=res.msg;
				this.setState({pending:false});
				break;
			case 1:
			case 2:
				message.classList.add("text-success");
				message.innerHTML="Login success!";
				setTimeout(()=>this.props.loginHandler(res.data.username,res.status==2),1000);
		}})
		.catch(err=>console.log(err));
	}
	register() {
		var username=document.getElementById("username"),password=document.getElementById("password"),message=document.getElementById("message");
		message.className="text-danger";
		if(username.value.length<4||username.value.length>20){
			message.innerHTML="Length of username should be between 4 and 20 characters.";
			return;
		} else if(password.value.length<4||password.value.length>20){
			message.innerHTML="Length of password should be between 4 and 20 characters.";
			return;
		} else if(password.value!==document.getElementById("password2").value){
			message.innerHTML="Password and Confirm Password do not match.";
			return;
		}

		this.setState({pending:true});
		message.className="text-info";
		message.innerHTML="......";

		const data = {username:username.value,password:password.value};
		fetch("/user/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)})
		.then(res=>res.json())
		.then(res=>{switch(res.status){
			case -4:
			case -2:
			case -1:
			case 0:
				message.classList.add(res.status==-2?"text-warning":"text-danger");
				message.innerHTML=res.msg;
				this.setState({pending:false});
				break;
			case 1:
				message.classList.add("text-success");
				message.innerHTML="Registration success!";
				setTimeout(()=>{this.switchForm();this.setState({pending:false});},1000);
		}})
		.catch(err=>console.log(err));
	}
	render() {return ce("div",{className:"mx-auto py-5",style:{maxWidth:"400px"}},
		ce("h3",null,this.state.newUser?"User Registration":"User Login"),
		ce("table",null,ce("tbody",null,
			ce("tr",null,
				ce("td",null,ce("label",{htmlFor:"username"},"Username")),
				ce("td",null,ce("input",{type:"text",id:"username",minLength:4,maxLength:20,required:true}))
			),
			ce("tr",null,
				ce("td",null,ce("label",{htmlFor:"password"},"Password")),
				ce("td",null,ce("input",{type:"password",id:"password",minLength:4,maxLength:20,required:true}))
			),
			this.state.newUser?ce("tr",null,
				ce("td",null,ce("label",{htmlFor:"username2"},"Confirm Password")),
				ce("td",null,ce("input",{type:"password",id:"password2",minLength:4,maxLength:20,required:true}))
			):null
		)),
		ce("button",{type:"button",className:"btn btn-primary mr-2",onClick:this.state.newUser?this.register:this.login,disabled:this.state.pending},"Submit"),
		ce("span",{id:"message"}),
		br(),br(),
		ce("span",{className:this.state.pending?"text-muted":"text-link text-primary",onClick:this.state.pending?()=>{}:this.switchForm},this.state.newUser?"Existing User?":"New User?")
	);}
}

class Footer extends React.Component {
	render() {return ce("footer",{className:"p-2"},
		"CSCI2720 Course Project",
		br(),
		"Group 17"
	);}
}

ReactDOM.render(
	ce(App),
	document.getElementById("app")
);
