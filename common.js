// вспомогательные функции - четкая проверка типов
function toStr (v) { return Object.prototype.toString.call(v); }
function isArray (v) { return toStr(v) === '[object Array]'; }
function isObject (v) { return toStr(v) === '[object Object]'; }
function isNumber (v) { return toStr(v) === '[object Number]'; }
function isString (v) { return toStr(v) === '[object String]'; }

// вспомогательные функции - сериализация десериализация object<->json
function o2j (obj) {
	try {
		return JSON.stringify(obj);
	} catch (e) {
		console.error('JSON.stringify fail: ' + e);
		return '{}';
	}
}
function j2o (json) {
	try {
		return JSON.parse(json);
	} catch (e) {
		console.error('JSON.parse fail: ' + e + ' src=' + json);
		return {};
	}
}

// вспомогательные функции - куки (локальное хранилище данных клиента в браузере)
function cookieGet (name) {
	var re = new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)");
	var matches = document.cookie.match(re);
	return matches ? decodeURIComponent(matches[1]) : null;
}
function cookieSet (name, value, options) {
  options = options || {};
	var expires = options.expires;
	if (typeof expires == "number" && expires) {
		var d = new Date();
		d.setTime(d.getTime() + expires*1000);
		expires = options.expires = d;
	}
	if (expires && expires.toUTCString) {
		options.expires = expires.toUTCString();
	}
	value = encodeURIComponent(value);
	var updatedCookie = name + "=" + value;
	for (var propName in options) {
		updatedCookie += "; " + propName;
		var propValue = options[propName];
		if (propValue !== true) {
			updatedCookie += "=" + propValue;
		}
	}
	document.cookie = updatedCookie;
}
function cookieDel (name) {
  cookieSet(name, "", {expires: -1})
}

// покажет далог с заголовком title, текстом content, и при закрытии диалога запустит функцию hr
function note1 (title, content, hr) {
	var w = Ext.create('Ext.window.Window', {title: title, autoHeight:true, modal:true, padding:3, bodyPadding:10, html:content});
	if (hr) { w.listeners = {close:hr, scope:this}; }
	w.show();
}

// запрос к нашему api: передает параметры params, полученный ответ передает в виде Object параметром в функцию hr
// следует пользоваться как "new api(%params%, %handler%)"
function api (params, hr) {
	
	this.hr = hr;
	
	this.successHr = function (resp) {
		lg('successHr ' + resp.responseText);
		if (this.hr) {
			this.hr(j2o(resp.responseText));
		}
	}.bind(this);
	
	this.failHr = function (resp, opts) {
		lg('failHr ' + resp.status);
		//console.debug(resp);
		if (this.hr) {
			this.hr({err:-9000,msg:'api failed'});
		}
	}.bind(this);
	
	this.cancel = function () {
		lg('cancel');
		if (!this.req) { return; }
		abort(this.req);
		this.req = null;
	}.bind(this);
	
	/*
	this.req = Ext.Ajax.request({
		url: 'api.php',  // php
		params: 'cm=' + o2j(params),
		success: this.success,
		failure: this.fail
	});
	*/
	this.req = Ext.Ajax.request({
		//url:'api/',  // python
		url: 'api.php',  // php
		//url:'http://136.243.4.77/cargo/api/',
		//params:'cm=' + o2j(params),
		//method:'GET',
		params:{cm:o2j(params)},
		method:'POST',
		disableCaching:false,
		success:this.successHr,
		failure:this.failHr
	});
	
}

function prepare_extjs () {
	lg('prepare_extjs');
	
	Ext.define('allshippersIdBasedSimpleModel', {extend:'Ext.data.Model', idProperty:'id'});
	
	Ext.define('allshippersBaseAjax', {
		extend: 'Ext.data.proxy.Ajax', alias: 'proxy.allshippersBaseAjax',
		request: function(request) { },
		sendRequest: function(request) {
			//console.log('sendRequest');
				// ---
				this.prapreParams(request);
				// ---
			request.setRawRequest(Ext.Ajax.request(request.getCurrentConfig()));
			this.lastRequest = request;
			return request;
    }
	});
	
	Ext.define('allshippersCompaniesGetAPI', {
		extend: 'allshippersBaseAjax', alias: 'proxy.allshippersCompaniesGetAPI',
		prapreParams: function(request) {
			//console.log('prapreParams');
			var ops = request._operation, pars = request._params;
			var cm = {cm:'comps.list', sid:sid, dir:pars.dir==='ASC'?'ASC':'DESC', offset:pars.start, limit:pars.limit};
			if (pars.sort) { cm.orderBy = pars.sort; }
			if (ops._filters) { cm.filters = ops._filters.map(function(e){ return ['name','address','inn','kpp','ogrn'].indexOf(e._property) === -1 ? null : {col:e._property, val:e._value} }); }
			['page','start','limit','sort','dir','filter'].forEach(function(k){delete pars[k];});  // удаляем мусор из запроа
			pars['cm'] = o2j(cm);
    }
	});
	
	Ext.define('allshippersCompanyLinksAPI', {
		extend: 'allshippersBaseAjax', alias: 'proxy.allshippersCompanyLinksAPI',
		prapreParams: function(request) {
			//lg('prapreParams');
			var ops = request._operation, pars = request.getParams();
			var cm = {cm:'comp.links.list', sid:sid, dir:pars.dir==='ASC'?'ASC':'DESC', offset:pars.start, limit:pars.limit};
			if (pars.sort) { cm.orderBy = pars.sort; }
			if (ops._filters) { cm.filters = ops._filters.map(function(e){ return ['link_from','link_to','name','address','inn','kpp','ogrn'].indexOf(e._property) === -1 ? null : {col:e._property, val:e._value} }); }
			if (pars.linksOf) { cm.linksOf = pars.linksOf; }
			['page','start','limit','sort','dir','filter','linksOf'].forEach(function(k){delete pars[k];});  // удаляем мусор из запроа
			for (var k in pars) { cm[k] = pars[k]; delete pars[k]; }  // merge extraParams
			pars['cm'] = o2j(cm);
		}
	});
	
	Ext.define('allshippersLinksTypesAPI', {
		extend: 'allshippersBaseAjax', alias: 'proxy.allshippersLinksTypesAPI',
		prapreParams: function(request) {
			//lg('prapreParams');
			var ops = request._operation, pars = request.getParams();
			var cm = {cm:'links.list', sid:sid, dir:pars.dir==='ASC'?'ASC':'DESC', offset:pars.start, limit:pars.limit};
			if (pars.sort) { cm.orderBy = pars.sort; }
			if (ops._filters) { cm.filters = ops._filters.map(function(e){ return ['name'].indexOf(e._property) === -1 ? null : {col:e._property, val:e._value} }); }
			['page','start','limit','sort','dir','filter'].forEach(function(k){delete pars[k];});  // удаляем мусор из запроа
			pars['cm'] = o2j(cm);
		}
	});
	
	Ext.define('allshippersPermsTypesAPI', {
		extend: 'allshippersBaseAjax', alias: 'proxy.allshippersPermsTypesAPI',
		prapreParams: function(request) {
			//lg('prapreParams');
			var ops = request._operation, pars = request.getParams();
			var cm = {cm:'perms.list', sid:sid, dir:pars.dir==='ASC'?'ASC':'DESC', offset:pars.start, limit:pars.limit};
			if (pars.sort) { cm.orderBy = pars.sort; }
			if (ops._filters) { cm.filters = ops._filters.map(function(e){ return ['name'].indexOf(e._property) === -1 ? null : {col:e._property, val:e._value} }); }
			['page','start','limit','sort','dir','filter'].forEach(function(k){delete pars[k];});  // удаляем мусор из запроа
			pars['cm'] = o2j(cm);
		}
	});
	
	Ext.define('allshippersUsersListAPI', {
		extend: 'allshippersBaseAjax', alias: 'proxy.allshippersUsersListAPI',
		prapreParams: function(request) {
			//lg('prapreParams');
			var ops = request._operation, pars = request.getParams();
			var cm = {cm:'users.list', sid:sid, dir:pars.dir==='ASC'?'ASC':'DESC', offset:pars.start, limit:pars.limit};
			if (pars.sort) { cm.orderBy = pars.sort; }
			if (ops._filters) { cm.filters = ops._filters.map(function(e){ return ['email','name'].indexOf(e._property) === -1 ? null : {col:e._property, val:e._value} }); }
			['page','start','limit','sort','dir','filter'].forEach(function(k){delete pars[k];});  // удаляем мусор из запроа
			pars['cm'] = o2j(cm);
		}
	});
	
	Ext.define('allshippersUserPermsListAPI', {
		extend: 'allshippersBaseAjax', alias: 'proxy.allshippersUserPermsListAPI',
		prapreParams: function(request) {
			//lg('prapreParams');
			var ops = request._operation, pars = request.getParams();
			var cm = {cm:'user.perms.list', sid:sid, dir:pars.dir==='ASC'?'ASC':'DESC', offset:pars.start, limit:pars.limit};
			if (pars.sort) { cm.orderBy = pars.sort; }
			if (ops._filters) { cm.filters = ops._filters.map(function(e){ return ['perm'].indexOf(e._property) === -1 ? null : {col:e._property, val:e._value} }); }
			['page','start','limit','sort','dir','filter'].forEach(function(k){delete pars[k];});  // удаляем мусор из запроа
			for (var k in pars) { cm[k] = pars[k]; delete pars[k]; }  // merge extraParams
			pars['cm'] = o2j(cm);
		}
	});
	
}