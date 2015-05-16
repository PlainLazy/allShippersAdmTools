lg(__FILE__ + '.js');

// окно реестра компаний
function winCompanies () {
	lg('winCompanies');
	
	this.refreshCompanies = function () {
		if (!this.crutchCompanies) { this.crutchCompanies = true; return; }
		lg('refreshCompanies');
		if (this.companiesStore.getCount() > 0) {
			this.companiesGrid.view.bufferedRenderer.scrollTo(1);
		}
	}.bind(this);
	this.refreshRecord = function () {  // обновляем запись в таблице
		this.companiesGrid.getView().refreshNode(this.companyRecord);
	}.bind(this);
	this.companiesStore = Ext.create('Ext.data.BufferedStore', {  // создаем дата провайдер для таблицы
		id:'store', model:'allshippersIdBasedSimpleModel', remoteGroup:true, remoteSort:true, remoteFilter:true, _leadingBufferZone:0, _trailingBufferZone:0, pageSize:300,
		autoLoad:false,
		proxy:{
			type:'allshippersCompaniesGetAPI', url:'api.php', noCache:false, simpleSortMode:true, sortParam:'sort', groupDirectionParam:'dir', startParam:'start', limitParam:'limit',
			reader: {type:'json', rootProperty:'data', totalProperty:'total'}
		},
		sorters:[{property:'name', direction:'ASC'}],
		listeners:{
			//add: function (store, records, index, eOpts ) { lg('add '); },
			refresh: this.refreshCompanies  // по событию обновления (фильтров) нужно делать такую херню, потому что иначе таблица глючит (это костыль)
		}
	});
	this.companiesSelectionChangeHr = function (t, sel, op) {
		lg('companiesSelectionChangeHr');
		if (!sel || sel.length < 1) { return; }
		this.companyRecord = sel[0];  // запоминаем ссылку на запись
		this.btEdit.setDisabled(false);
		this.btDel.setDisabled(false);
		this.linksPanelUpdate();
	}.bind(this);
	//this.companiesGridItemClickHr = function (dv, record, item, index, e) { }.bind(this);
	this.companiesGrid = Ext.create('Ext.grid.Panel', {
		store:this.companiesStore, loadMask:true, selModel:{pruneRemoved:false}, multiSelect:false, viewConfig:{trackOver:false}, plugins:'gridfilters', emptyText:'',
		columns:[  // определение столбцов таблицы
			{text:"ID",       dataIndex:'id',      width:80,  sortable:false, groupable:false, filter:false, hidden:true},
			{text:"ИНН",      dataIndex:'inn',     width:120, sortable:true,  groupable:false, filter:true},
			{text:"Название", dataIndex:'name',    width:300, sortable:true,  groupable:false, filter:true},
			{text:"ОГРН",     dataIndex:'ogrn',    width:120, sortable:true,  groupable:false, filter:true},
			{text:"КПП",      dataIndex:'kpp',     width:120, sortable:true,  groupable:false, filter:true},
			{text:"Адерс",    dataIndex:'address', width:300, sortable:true,  groupable:false, filter:true}
		],
		listeners:{
			//viewready: function (a, b) { lg('viewready'); },
			//itemclick: this.companiesGridItemClickHr,  // событие изменения выделения элементов грида
			selectionchange: this.companiesSelectionChangeHr  // событие по клику на элемент
		}
	});
	
	this.linksPanelUpdate = function () {
		lg('linksPanelUpdate');
		if (!this.companyRecord || this.linksPanel.collapsed) { return; }
		this.btLinkNew.setDisabled(false);
		this.linksPanel.setTitle('Связи "' + this.companyRecord.data.name + '"');
		this.linksStore.proxy.extraParams['compId'] = this.companyRecord.data.id;
		lg('extraParams.compId=' + this.linksStore.proxy.extraParams['compId']);
		this.linksStore.removeAll();
		this.linksStore.loadPage(1);
		this.linkRecord = null;
		this.btLinkDel.setDisabled(true);
		this.linksGrid.getSelectionModel().clearSelections();
	}.bind(this);
	
	//this.linksGridItemClickHr = function (dv, record, item, index, e) { lg('linksGridItemClickHr'); }.bind(this);
	this.linksGridSelectionChangeHr = function (t, sel, op) {
		lg('linksGridSelectionChangeHr');
		if (!sel || sel.length < 1) { return; }
		this.linkRecord = sel[0];  // запоминаем ссылку на запись
		this.btLinkDel.setDisabled(false);
	}.bind(this);
	
	this.companiesRefresh = function () {
		lg('companiesRefresh');
		this.companiesGrid.getSelectionModel().clearSelections();
		this.btEdit.setDisabled(true);
		this.btDel.setDisabled(true);
		this.companyRecord = null;
		if (this.companiesStore.getCount() > 0) {
			this.companiesGrid.view.bufferedRenderer.scrollTo(1);
		}
		this.companiesStore.removeAll();
		this.companiesStore.loadPage(1);
	}.bind(this);
	
	this.deletedHr = function (dat) {
		lg('deletedHr');
		switch (dat.err) {
			case undefined: { this.companiesRefresh(); return; }
			case -10: { note1('Упс', 'Нет прав'); return; }
			default: { note1('Упс', 'Ошибка: ' + dat.err + ': ' + dat.msg); return; }
		}
	}.bind(this);
	
	this.btNewHr = function () {
		lg('btNewHr');
		new winCompanyUpsert({on_complete:this.companiesRefresh});
	}.bind(this);
	
	this.companyLinkNewHr = function (dat) {
		lg('companyLinkNewHr');
		console.debug(dat);
		if (!dat.err) {
			this.linksPanelUpdate();
		} else {
			note1('Упс', 'Ошибка: ' + dat.err + ': ' + dat.msg); return;
		}
	}.bind(this);
	
	this.linkConstructedHr = function (oCompany, oLink) {
		lg('linkConstructedHr');
		new api({cm:'link.new', sid:sid, to:this.companyRecord.data.id, from:oCompany.id, type:oLink.id}, this.companyLinkNewHr);
	}.bind(this);
	this.btLinkNewHr = function () {
		lg('btLinkNewHr');
		new winCompanyLink({saveHr:this.linkConstructedHr});
	}.bind(this);
	
	this.btEditHr = function () {
		if (!this.companyRecord) { return; }
		lg('btEditHr');
		this.requestDetailsFor(this.companyRecord.data.id, this.openUpsertDialog);
	}.bind(this);
	this.openUpsertDialog = function () {
		lg('openUpsertDialog');
		new winCompanyUpsert({data:this.companyRecord.data, details:this.companyDetailsObj, on_complete:this.refreshRecord});
	}.bind(this);
	
	this.requestDetailsFor = function (iCompanyId, readyHr) {
		lg('requestDetailsFor ' + iCompanyId);
		this.companyDetailsReadyHr = readyHr;
		this.companyDetailsLoadingDialog = Ext.Msg.show({title:'Загрузка', message:'Загрузка данных', closable:false, buttons:Ext.Msg.CANCEL, fn:this.companyDetailsLoadingCancelHr});
		this.companyDetailsReq = new api({cm:'comp.details', sid:sid, id:iCompanyId}, this.companyDetailsHr);
	}.bind(this);
	this.companyDetailsHr = function (dat) {
		lg('companyDetailsHr');
		console.debug(dat);
		this.companyDetailsObj = dat.details;
		this.companyDetailsReq = null;
		this.companyDetailsLoadingDialog.close();
		if (dat.err) { note1('Упс', 'Ошибка: ' + dat.err + ': ' + dat.msg); return; }
		if (!dat.details) { note1('Упс', 'Ошибка: company.details response not contains details'); return; }
		this.companyDetailsReadyHr();
	}.bind(this);
	this.companyDetailsLoadingCancelHr = function () {
		lg('companyDetailsLoadingCancelHr');
		this.companyDetailsLoadingDialog = null;
		if (this.companyDetailsReq) {
			this.companyDetailsReq.cancel();
			this.companyDetailsReq = null;
		}
	}.bind(this);
	
	this.btDeleteHr = function () {
		lg('btDeleteHr');
		if (!this.companyRecord) { return; }
		Ext.Msg.show({
			title:'Удаление компании',
			message: 'Удалить эту компанию?<br><b>' + this.companyRecord.data.name + '</b>',
			buttons: Ext.Msg.YESNO,
			icon: Ext.Msg.QUESTION,
			fn: this.delConfirmHr
		});
	}.bind(this);
	this.delConfirmHr = function (btn) {
		lg('delConfirmHr ' + btn);
		if (btn === 'yes') {
			new api({cm:'comp.del', sid:sid, id:this.companyRecord.data.id}, this.deletedHr);
		}
	}.bind(this);
	
	this.btLinkDeleteHr = function () {
		lg('btLinkDeleteHr');
		if (!this.linkRecord) { return; }
		Ext.Msg.show({
			title:'Удаление связи',
			message: 'Удалить связь с этой компанией?<br><b>' + this.linkRecord.data.name + '</b>',
			buttons: Ext.Msg.YESNO,
			icon: Ext.Msg.QUESTION,
			fn: this.delLinkConfirmHr
		});
	}.bind(this);
	this.delLinkConfirmHr = function (btn) {
		lg('delLinkConfirmHr ' + btn);
		if (btn !== 'yes') { return; }
		new api({cm:'link.del', sid:sid, id:this.linkRecord.data.id}, this.linksPanelUpdate);
	}.bind(this);
	this.refreshLinks = function () {
		//if (!this.crutchLinks) { this.crutchLinks = true; return; }
		lg('refreshLinks ' + this.linksStore.getCount());
		if (this.linksStore.getCount() > 0) {
			this.linksGrid.view.bufferedRenderer.scrollTo(1);
		}
	}.bind(this);
	this.linksStore = Ext.create('Ext.data.BufferedStore', {
		id:'store', model:'allshippersIdBasedSimpleModel', remoteGroup:true, remoteSort:true, remoteFilter:true, _leadingBufferZone:0, _trailingBufferZone:0, pageSize:300,
		autoLoad:false,
		proxy: {  // указываем прокси определнный ранее
			extraParams:{'compId':-1},
			type:'allshippersCompanyLinksAPI', url:'api.php', noCache:false, simpleSortMode:true, sortParam:'sort', groupDirectionParam:'dir', startParam:'start', limitParam:'limit',
			reader: {type:'json', rootProperty:'data', totalProperty:'total'}
		},
		sorters:[{property:'name', direction:'ASC'}],
		listeners:{
			//add: function (store, records, index, eOpts ) { lg('add '); },
			refresh: this.refreshLinks  // по событию обновления (фильтров) нужно делать такую херню, потому что иначе таблица глючит (это костыль)
		}
	});
	/*
	this.linksTypeColumnRenerer = function (value, record) {
		return this.linksData[value] || value;
	}.bind(this);
	*/
	this.linksGrid = Ext.create('Ext.grid.Panel', {
		store:this.linksStore, loadMask:true, selModel:{pruneRemoved:false}, multiSelect:false, viewConfig:{trackOver:false}, plugins:'gridfilters', emptyText:'',
		columns:[  // определение столбцов таблицы
			{text:"ID",       dataIndex:'id',      width:80,  sortable:false, groupable:false, filter:false, hidden:true},
			{text:"Прямая связь",   dataIndex:'link_from',  width:120, sortable:true,  groupable:false, filter:true/*, renderer:this.linksTypeColumnRenerer*/},
			{text:"Обратная связь", dataIndex:'link_to',    width:120, sortable:true,  groupable:false, filter:true/*, renderer:this.linksTypeColumnRenerer*/},
			{text:"ИНН",      dataIndex:'inn',     width:120, sortable:true,  groupable:false, filter:true},
			{text:"Название", dataIndex:'name',    width:300, sortable:true,  groupable:false, filter:true},
			{text:"ОГРН",     dataIndex:'ogrn',    width:120, sortable:true,  groupable:false, filter:true},
			{text:"КПП",      dataIndex:'kpp',     width:120, sortable:true,  groupable:false, filter:true},
			{text:"Адерс",    dataIndex:'address', width:300, sortable:true,  groupable:false, filter:true}
		],
		listeners:{
			//viewready: function (a, b) { lg('viewready'); },
			//itemclick: this.linksGridItemClickHr,  // событие по клику на элемент
			selectionchange: this.linksGridSelectionChangeHr
		}
	});
	
	this.btNew = Ext.create('Ext.Button', {text:'Добавить', handler:this.btNewHr});
	this.btEdit = Ext.create('Ext.Button', {text:'Изменить', handler:this.btEditHr, disabled:true});
	this.btDel = Ext.create('Ext.Button', {text:'Удалить', handler:this.btDeleteHr, disabled:true});
	
	this.btLinkNew = Ext.create('Ext.Button', {text:'Добавить', handler:this.btLinkNewHr, disabled:true});
	this.btLinkDel = Ext.create('Ext.Button', {text:'Удалить', handler:this.btLinkDeleteHr, disabled:true});
	
	this.linksCollapseHr = function (p, o) { lg('linksCollapseHr'); }.bind(this);
	this.linksExpandHr = function (p, o) { lg('linksExpandHr'); this.linksPanelUpdate(); }.bind(this);
	
	this.linksPanel = Ext.create('Ext.panel.Panel', {
		region:'east', bodyPadding:0, border:false, layout:'fit', height:'100%', titleAlign:'center', title:'Связи', width:300, split:true, collapsible:true, collapsed:true, floatable:false,
		listeners:{collapse:this.linksCollapseHr, expand:this.linksExpandHr},
		items:[this.linksGrid],
		bbar:[this.btLinkNew,'->',this.btLinkDel]
	});
	
	// разметка окна реестра компаний
	var opt = {
		title:'Реестр компаний', maximized:false, maximizable:true, minimizable:false, monitorResize:true, closable:true, width:800, height:480, resizable:true, modal:true, padding:3, bodyPadding:0,
		layout:'border',
		//layout:'fit',
		//header:{items:[this.btNew,this.btEdit,this.btDel]},
		defaults:{split:true,frame:true},
		items:[
			{
				xtype:'panel', region:'center', bodyPadding:0, border:false, layout:'fit', height:'100%', flex:1,
				items:[this.companiesGrid],
				bbar:[this.btNew,this.btEdit,'->',this.btDel]
			},
			this.linksPanel
		]
	};
	
	this.win = Ext.create('Ext.window.Window', opt);
	this.win.show();
	
}