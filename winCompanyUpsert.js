lg(__FILE__ + '.js');

function winCompanyUpsert (opt) {
	lg('winCompanyUpsert');
	//console.debug(opt);
	
	this.opt = opt;
	this.sMapCont = 's'+(ymapSerial++);
	this.geoIv = null;
	this.geoReq = null;
	this.longLat = null;
	//this.ymapObj = null;
	this.expandAfterGeo = false;
	
	this.isNew = function () { return this.opt.data == null; }
	this.h1 = function (tNew, tUpdate) { return this.isNew() ? tNew : tUpdate; }
	this.empty2null = function (v) { return v == '' ? null : v; }
	this.geoSerial = 100; this.geoId = function () { return this.geoSerial++; }.bind(this);
	
	this.closeHr = function () {
		lg('closeHr');
		this.geoDelayRem();
		this.geoReqCancel();
		if (this.ymapIns) { this.ymapIns.destroy(); this.ymapIns = null; }
	}.bind(this);
	
	this.geoReqSend = function (tCode) {
		lg('geoReqSend "' + tCode + '"');
		this.geoReq = Ext.data.JsonP.request({
			url:'http://geocode-maps.yandex.ru/1.x/',
			params:{geocode:tCode, format:'json', results:5},
			success:this.geoReqSuccessHr,
			failure:this.geoReqFailureHr
		});
	}.bind(this);
	
	this.geoReqCancel = function () {
		lg('geoReqCancel');
		if (!this.geoReq) { return; }
		this.geoReq.success = null;
		this.geoReq.failure = null;
		this.geoReq = null;
	}.bind(this);
	
	this.getCurAddrStr = function () {
		lg('getCurAddrStr');
		/*
		//this.inAddr.selection.data.txt = this.inAddr.getValue();
		//delete this.inAddr.selection.data.ymapObj;
		console.debug(this.inAddr.selection);
		lg(' this.inAddr.getValue()=' + this.inAddr.getValue());
		lg(' this.inAddr.getStore().getById(this.inAddr.getValue())=' + this.inAddr.getStore().getById(this.inAddr.getValue()));
		try { return this.inAddr.getStore().getById(this.inAddr.getValue()).data.txt; } catch (e) { }
		return null;
		*/
		return this.inAddr.selection.data.txt;
	}.bind(this);
	
	this.getCurAddrObj = function () {
		lg('getCurAddrObj');
		/*
		try { return this.inAddr.getStore().getById(this.inAddr.getValue()).data.ymapObj; } catch (e) { }
		return null;
		*/
		return this.inAddr.selection.data.ymapObj;
	}.bind(this);
	
	this.ymapsReadyHr = function () {
		lg('ymapsReadyHr');
		this.ymapIns = new ymaps.Map(this.sMapCont, {center:[55.76, 37.64], zoom:14});
		this.ymapIns.controls.remove('fullscreenControl');
		this.ymapIns.controls.remove('geolocationControl');
		this.ymapIns.controls.remove('routeEditor');
		this.ymapIns.controls.remove('rulerControl');
		this.ymapIns.controls.remove('trafficControl');
		this.ymapIns.controls.remove('typeSelector');
		if (this.longLat) { this.ymapIns.setCenter([this.longLat[1], this.longLat[0]]); }
	}.bind(this);
	
	this.savedHr = function (dat) {
		lg('savedHr');
		switch (dat['err']) {
			case undefined: { break; }
			case -10: { note1('Упс', 'Нет прав'); return; }
			default: { note1('Упс', dat['err'] + ': ' + dat['msg']); return; }
		}
		note1('Ура', this.h1('Компания добавлена','Данные компании изменены'));
		if (!this.isNew()) {
			this.opt.data.inn = this.inINN.value;
			this.opt.data.name = this.inName.value;
			this.opt.data.ogrn = this.inOGRN.value;
			this.opt.data.kpp = this.inKPP.value;
			this.opt.data.address = this.getCurAddrStr();
		}
		if (this.opt.on_complete) { this.opt.on_complete(); }
		this.win.close();
	}.bind(this);
	
	this.btSaveHr = function () {
		lg('btSaveHr');
		var typeId = this.inType.getValue();
		var ymapObj = this.getCurAddrObj();
		lg(' typeId=' + typeId);
		lg(' ymapObj=' + ymapObj);
		lg(' longLat=' + this.longLat);
		lg(' geoReq=' + this.geoReq);
		lg(' geoIv=' + this.geoIv);
		if (!ymapObj || !this.longLat || this.geoReq || this.geoIv) { note1('Геокодинг не закончен', 'Координаты объекта не получены'); return; }
		var cm = {
			sid:  sid,
			name:  this.empty2null(this.inName.value),
			type:  this.empty2null(this.inType.value),
			descr: this.empty2null(this.inDescr.value),
			inn:   this.empty2null(this.inINN.value),
			ogrn:  this.empty2null(this.inOGRN.value),
			kpp:   this.empty2null(this.inKPP.value),
			addr:  this.empty2null(this.getCurAddrStr()),
			longitude: this.longLat[0],
			latitude:  this.longLat[1],
			ymap: ymapObj
		};
		if (this.isNew()) {
			cm.cm = 'comp.new';
		} else {
			cm.cm = 'comp.update';
			cm.id = this.opt.data.id;
		}
		new api(cm, this.savedHr);
	}.bind(this);
	
	this.yampPos = function (obj) {
		lg('yampPos');
		console.debug(obj);
		var p = null; try { p = obj['GeoObject']['Point']['pos']; } catch (e) { lg('ymapObj pos extract failed: ' + e); }
		if (!p) { return; }
		var reg = /^([0-9.]+) ([0-9.]+)$/;
		var p = reg.exec(p);
		if (p && p.length == 3) {
			lg('pos: ' + p[1] + ',' + p[2]);
			this.longLat = [p[1], p[2]];
			if (this.ymapIns) { this.ymapIns.setCenter([this.longLat[1], this.longLat[0]]); }
		}
	}.bind(this);
	
	this.geoReqSuccessHr = function (result, request) {
		lg('geoReqSuccessHr');
		this.geoReqCancel();
		
		var list; try { list = result['response']['GeoObjectCollection']['featureMember']; } catch (e) { lg('featureMembers list extract failed: ' + e); }
		if (!isArray(list) || list.length < 1) { lg('no objects found'); return; }
		var o1 = list[0];
		this.yampPos(o1);
		
		var l = [{id:this.geoId(),txt:this.inAddr.selection.data.txt,ymapObj:o1}];
		for (var i=0; i<list.length; i++) {
			var t = null; try { t = list[i]['GeoObject']['metaDataProperty']['GeocoderMetaData']['text']; } catch (e) { lg('text extract failed: ' + e); }
			//lg('#' + i + ': ' + t);
			if (t) { l.push({id:this.geoId(), txt:t, ymapObj:list[i]}); }
		}
		
		this.inAddr.removeListener('change', this.addrChangedHr);
		this.inAddr.reset();
		this.inAddr.getStore().removeAll();
		this.inAddr.getStore().loadData(l);
		this.inAddr.setValue(l[0].id);
		if (this.expandAfterGeo) {
			this.inAddr.expand();
		}
		this.inAddr.addListener('change', this.addrChangedHr);
		
	}.bind(this);
	this.geoReqFailureHr = function () { lg('geoReqFailureHr'); this.geoReqCancel(); }.bind(this);
	
	this.geoDelayRem = function () {
		lg('geoDelayRem');
		if (!this.geoIv) { return; }
		clearInterval(this.geoIv);
		this.geoIv = null;
	}.bind(this);
	
	this.geoDelaySet = function () {
		lg('geoDelaySet');
		this.geoIv = setInterval(this.geoDelayHr, 1000);
	}.bind(this);
	
	this.geoDelayHr = function () {
		lg('geoDelayHr');
		this.geoDelayRem();
		this.geoReqCancel();
		this.geoReqSend(this.getCurAddrStr());
	}.bind(this);
	
	this.addrChangedHr = function () {
		lg('addrChangedHr');
		this.longLat = null;
		this.geoReqCancel();
		this.geoDelayRem();
		var v = this.inAddr.getValue();
		if (isString(v)) {
			// ввод с клавиатуры
			this.inAddr.selection.data.txt = v;
			this.expandAfterGeo = true;
			this.geoDelaySet();
		} else {
			// выборан из списка готовый варант
			this.yampPos(this.inAddr.selection.data.ymapObj);
		}
	}.bind(this);
	
	this.addrSelectHr = function () {
		//lg('addrSelectHr');
		//this.longLat = null;
		//this.geoReqCancel();
		//this.geoDelayRem();
		//this.yampPos(this.inAddr.selection.data.ymapObj);
	}.bind(this);
	
	this.typeStore = Ext.create('Ext.data.Store', {
		fields:[{name:'id',type:'int'},{name:'txt',type:'string'}],
		data:[
			{id:95,txt:'Генеральный перевозчик'},
			{id:96,txt:'Заброшенный Клиент'},
			{id:97,txt:'Перевозчик'},
			{id:98,txt:'Наша компания'},
			{id:99,txt:'Прочие'},
			{id:100,txt:'Клиент не будем работать'},
			{id:101,txt:'Клиент старое юрлицо'},
			{id:102,txt:'Клиент'},
			{id:103,txt:'Грузоотправитель/Грузополучатель'},
			{id:104,txt:'Клиент почти забытый'},
			{id:105,txt:'Поставщик'},
			{id:106,txt:'Потенциальный клиент'},
			{id:107,txt:'Система мониторинга'},
			{id:108,txt:'Экспедитор'}
		]
	});
	this.addrStore = Ext.create('Ext.data.Store', {
		fields:[
			{name:'id',type:'int'},
			{name:'txt',type:'string'},
			{name:'ymapObj'}
		],
		data:[]
	});
	
	this.inName  = Ext.create('Ext.form.field.Text', {allowBlank:true, width:300, maxLength:2048});
	this.inType  = Ext.create('Ext.form.ComboBox', {editable:false, padding:'0 0 0 0', width:300, queryMode:'local', store:this.typeStore, displayField:'txt', valueField:'id'});
	this.inDescr = Ext.create('Ext.form.field.TextArea', {allowBlank:true, width:300, maxLength:2048*10});
	this.inINN   = Ext.create('Ext.form.field.Text', {allowBlank:true, width:80, maxLength:128});
	this.inOGRN  = Ext.create('Ext.form.field.Text', {allowBlank:true, width:80, maxLength:128});
	this.inKPP   = Ext.create('Ext.form.field.Text', {allowBlank:true, width:80, maxLength:128});
	this.inAddr  = Ext.create('Ext.form.ComboBox', {
			padding:'0 0 0 10', width:300, queryMode:'local', store:this.addrStore, displayField:'txt', valueField:'id',
			listeners:{change: this.addrChangedHr, select: this.addrSelectHr}
		}
	);
	this.btSave  = Ext.create('Ext.button.Button',   {text: this.h1('Добавить','Сохранить'), margin:'0 0 0 90', handler:this.btSaveHr});
	
	var tTitle = this.h1('Добавление компании','Изменение данных компании');
	var opt = {
		title:tTitle,
		maximized:false, maximizable:false, minimizable:false, monitorResize:true, closable:true, autowidth:true, autoheight:true, resizable:false, modal:true,
		padding:10, bodyPadding:0,
		layout:'vbox',
		items:[
			{layout:'hbox',items:[{xtype:'label',text:'Название',padding:'4 0 0 0',width:80},this.inName]},
			{layout:'hbox',items:[{xtype:'label',text:'Тип',padding:'4 0 0 0',width:80},this.inType]},
			{layout:'hbox',items:[{xtype:'label',text:'Описание',padding:'4 0 0 0',width:80},this.inDescr]},
			{layout:'hbox',padding:'10 0 0 0',items:[
				{layout:'hbox',items:[{xtype:'label',text:'ИНН',padding:'4 10 0 0'},this.inINN]},
				{layout:'hbox',items:[{xtype:'label',text:'ОГРН',padding:'4 10 0 10'},this.inOGRN]},
				{layout:'hbox',items:[{xtype:'label',text:'КПП',padding:'4 10 0 10'},this.inKPP]}
			]},
			{padding:'4 0 0 0', width:400, height:240, html:'<div id="'+this.sMapCont+'" style="width:400; height:240px"></div>'},
			{layout:'hbox',padding:'4 0 0 0',items:[{xtype:'label',text:'Адрес',padding:'4 0 0 0',width:80},this.inAddr]},
			{padding:'4 0 0 0',items:[this.btSave]}
		],
		listeners:{close: this.closeHr}
	};
	
	this.addrReset = function (t) {
		lg('addrReset "' + t + '"');
		this.inAddr.removeListener('change', this.addrChangedHr);
		var l = [{id:this.geoId(), txt:t}];
		this.inAddr.getStore().loadData(l);
		this.inAddr.setValue(l[0].id);
		//this.inAddr.setSelection(this.inAddr.getStore().getAt(0));
		//console.debug(l);
		this.inAddr.addListener('change', this.addrChangedHr);
		//lg('inAddr.selection:');
		//console.debug(this.inAddr.selection);
		this.geoReqSend(t);
	}.bind(this);
	
	if (!this.isNew()) {
		this.inName.setValue(this.opt.details.name || '');
		this.inType.setValue(this.opt.details.type_id);
		this.inDescr.setValue(this.opt.details.descr || '');
		this.inINN.setValue(this.opt.details.inn || '');
		this.inOGRN.setValue(this.opt.details.ogrn || '');
		this.inKPP.setValue(this.opt.details.kpp || '');
		this.addrReset(this.opt.details.address || '');
	} else {
		this.inType.setValue(this.typeStore.getAt(0).id);
		this.addrReset('Москва, Красная площадь, 1');
	}
	
	this.win = Ext.create('Ext.window.Window', opt);
	this.win.show();
	
	ymaps.ready(this.ymapsReadyHr);
	
}