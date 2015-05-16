lg(__FILE__ + '.js');

// окно реестра компаний
function winUsers () {
	lg('winUsers');
	
	this.refreshUsers = function () {
		if (!this.crutchUsers) { this.crutchUsers = true; return; }
		lg('refreshUsers');
		if (this.usersStore.getCount() > 0) {
			this.usersGrid.view.bufferedRenderer.scrollTo(1);
		}
	}.bind(this);
	this.refreshRecord = function () {
		this.usersGrid.getView().refreshNode(this.userRecord);
	}.bind(this);
	this.usersStore = Ext.create('Ext.data.BufferedStore', {
		id:'store', model:'allshippersIdBasedSimpleModel', remoteGroup:true, remoteSort:true, remoteFilter:true, _leadingBufferZone:0, _trailingBufferZone:0, pageSize:300,
		autoLoad:false,
		proxy:{
			type:'allshippersUsersListAPI', url:'api.php', noCache:false, simpleSortMode:true, sortParam:'sort', groupDirectionParam:'dir', startParam:'start', limitParam:'limit',
			reader: {type:'json', rootProperty:'data', totalProperty:'total'}
		},
		sorters:[{property:'name', direction:'ASC'}],
		listeners:{
			//add: function (store, records, index, eOpts ) { lg('add '); },
			refresh: this.refreshUsers  // по событию обновления (фильтров) нужно делать такую херню, потому что иначе таблица глючит (это костыль)
		}
	});
	this.usersSelectionChangeHr = function (t, sel, op) {
		lg('usersSelectionChangeHr');
		if (!sel || sel.length < 1) { return; }
		this.userRecord = sel[0];
		//this.btEdit.setDisabled(false);
		//this.btDel.setDisabled(false);
		this.permsPanelUpdate();
	}.bind(this);
	//this.usersGridItemClickHr = function (dv, record, item, index, e) { }.bind(this);
	this.usersGrid = Ext.create('Ext.grid.Panel', {
		store:this.usersStore, loadMask:true, selModel:{pruneRemoved:false}, multiSelect:false, viewConfig:{trackOver:false}, plugins:'gridfilters', emptyText:'',
		columns:[  // определение столбцов таблицы
			{text:"ID",     dataIndex:'id',     width:80,  sortable:false, groupable:false, filter:false, hidden:true},
			{text:"Email",  dataIndex:'email',  width:300, sortable:true,  groupable:false, filter:true},
			{text:"Имя",    dataIndex:'name',   width:300, sortable:true,  groupable:false, filter:true},
		],
		listeners:{
			//viewready: function (a, b) { lg('viewready'); },
			//itemclick: this.usersGridItemClickHr,
			selectionchange: this.usersSelectionChangeHr
		}
	});
	
	this.permsPanelUpdate = function () {
		lg('permsPanelUpdate');
		if (!this.userRecord || this.permsPanel.collapsed) { return; }
		this.btPermNew.setDisabled(false);
		this.permsPanel.setTitle('Права "' + this.userRecord.data.name + '"');
		this.permsStore.proxy.extraParams['userId'] = this.userRecord.data.id;
		lg('extraParams.userId=' + this.permsStore.proxy.extraParams['userId']);
		this.permsStore.removeAll();
		this.permsStore.loadPage(1);
		this.permRecord = null;
		this.btPermDel.setDisabled(true);
		this.permsGrid.getSelectionModel().clearSelections();
	}.bind(this);
	
	//this.permsGridItemClickHr = function (dv, record, item, index, e) { lg('permsGridItemClickHr'); }.bind(this);
	this.permsGridSelectionChangeHr = function (t, sel, op) {
		lg('permsGridSelectionChangeHr');
		if (!sel || sel.length < 1) { return; }
		this.permRecord = sel[0];
		this.btPermDel.setDisabled(false);
	}.bind(this);
	
	this.usersRefresh = function () {
		lg('usersRefresh');
		this.usersGrid.getSelectionModel().clearSelections();
		//this.btEdit.setDisabled(true);
		//this.btDel.setDisabled(true);
		this.userRecord = null;
		if (this.usersStore.getCount() > 0) {
			this.usersGrid.view.bufferedRenderer.scrollTo(1);
		}
		this.usersStore.removeAll();
		this.usersStore.loadPage(1);
	}.bind(this);
	
	/*
	this.deletedHr = function (dat) {
		lg('deletedHr');
		switch (dat.err) {
			case undefined: { this.usersRefresh(); return; }
			case -10: { note1('Упс', 'Нет прав'); return; }
			default: { note1('Упс', 'Ошибка: ' + dat.err + ': ' + dat.msg); return; }
		}
	}.bind(this);
	
	this.btNewHr = function () {
		lg('btNewHr');
		new winCompanyUpsert({on_complete:this.usersRefresh});
	}.bind(this);
	*/
	
	this.userPermNewHr = function (dat) {
		lg('userPermNewHr');
		console.debug(dat);
		if (!dat.err) {
			this.permsPanelUpdate();
		} else {
			note1('Упс', 'Ошибка: ' + dat.err + ': ' + dat.msg); return;
		}
	}.bind(this);
	
	this.permSelectedHr = function (oPerm) {
		lg('permSelectedHr');
		new api({cm:'user.perm.new', sid:sid, user:this.userRecord.data.id, perm:oPerm.id}, this.userPermNewHr);
	}.bind(this);
	this.btPermNewHr = function () {
		lg('btPermNewHr');
		new winPermTypeSelect({selectedHr:this.permSelectedHr});
	}.bind(this);
	/*
	this.btEditHr = function () {
		if (!this.userRecord) { return; }
		lg('btEditHr');
		this.requestDetailsFor(this.userRecord.data.id, this.openUpsertDialog);
	}.bind(this);
	this.openUpsertDialog = function () {
		lg('openUpsertDialog');
		new winCompanyUpsert({data:this.userRecord.data, details:this.userDetailsObj, on_complete:this.refreshRecord});
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
	*/
	this.btPermDeleteHr = function () {
		lg('btPermDeleteHr');
		if (!this.permRecord) { return; }
		Ext.Msg.show({
			title:'Удаление права',
			message: 'Удалить это право?<br><b>' + this.permRecord.data.perm + '</b>',
			buttons: Ext.Msg.YESNO,
			icon: Ext.Msg.QUESTION,
			fn: this.delPermConfirmHr
		});
	}.bind(this);
	this.delPermConfirmHr = function (btn) {
		lg('delpermConfirmHr ' + btn);
		if (btn !== 'yes') { return; }
		new api({cm:'user.perm.del', sid:sid, id:this.permRecord.data.id}, this.permsPanelUpdate);
	}.bind(this);
	this.refreshPerms = function () {
		//if (!this.crutchPerms) { this.crutchPerms = true; return; }
		lg('refreshPerms ' + this.permsStore.getCount());
		if (this.permsStore.getCount() > 0) {
			this.permsGrid.view.bufferedRenderer.scrollTo(1);
		}
	}.bind(this);
	this.permsStore = Ext.create('Ext.data.BufferedStore', {
		id:'store', model:'allshippersIdBasedSimpleModel', remoteGroup:true, remoteSort:true, remoteFilter:true, _leadingBufferZone:0, _trailingBufferZone:0, pageSize:300,
		autoLoad:false,
		proxy: {
			extraParams:{'userId':-1},
			type:'allshippersUserPermsListAPI', url:'api.php', noCache:false, simpleSortMode:true, sortParam:'sort', groupDirectionParam:'dir', startParam:'start', limitParam:'limit',
			reader: {type:'json', rootProperty:'data', totalProperty:'total'}
		},
		sorters:[{property:'name', direction:'ASC'}],
		listeners:{
			//add: function (store, records, index, eOpts ) { lg('add '); },
			refresh: this.refreshPerms
		}
	});
	
	this.permsGrid = Ext.create('Ext.grid.Panel', {
		store:this.permsStore, loadMask:true, selModel:{pruneRemoved:false}, multiSelect:false, viewConfig:{trackOver:false}, plugins:'gridfilters', emptyText:'',
		columns:[  // определение столбцов таблицы
			{text:"ID",     dataIndex:'id',    width:80,  sortable:false, groupable:false, filter:false, hidden:true},
			{text:"Право",  dataIndex:'perm',  width:300, sortable:true,  groupable:false, filter:true}
		],
		listeners:{
			//viewready: function (a, b) { lg('viewready'); },
			//itemclick: this.permsGridItemClickHr,  // событие по клику на элемент
			selectionchange: this.permsGridSelectionChangeHr
		}
	});
	
	/*
	this.btNew = Ext.create('Ext.Button', {text:'Добавить', handler:this.btNewHr});
	this.btEdit = Ext.create('Ext.Button', {text:'Изменить', handler:this.btEditHr, disabled:true});
	this.btDel = Ext.create('Ext.Button', {text:'Удалить', handler:this.btDeleteHr, disabled:true});
	*/
	this.btPermNew = Ext.create('Ext.Button', {text:'Добавить', handler:this.btPermNewHr, disabled:true});
	this.btPermDel = Ext.create('Ext.Button', {text:'Удалить', handler:this.btPermDeleteHr, disabled:true});
	
	this.permsCollapseHr = function (p, o) { lg('permsCollapseHr'); }.bind(this);
	this.permsExpandHr = function (p, o) { lg('permsExpandHr'); this.permsPanelUpdate(); }.bind(this);
	
	this.permsPanel = Ext.create('Ext.panel.Panel', {
		region:'east', bodyPadding:0, border:false, layout:'fit', height:'100%', titleAlign:'center', title:'Права', width:300, split:true, collapsible:true, collapsed:true, floatable:false,
		listeners:{collapse:this.permsCollapseHr, expand:this.permsExpandHr},
		items:[this.permsGrid],
		bbar:[this.btPermNew,'->',this.btPermDel]
	});
	
	// разметка окна реестра компаний
	var opt = {
		title:'Пользователи', maximized:false, maximizable:true, minimizable:false, monitorResize:true, closable:true, width:800, height:480, resizable:true, modal:true, padding:3, bodyPadding:0,
		layout:'border',
		defaults:{split:true,frame:true},
		items:[
			{
				xtype:'panel', region:'center', bodyPadding:0, border:false, layout:'fit', height:'100%', flex:1,
				items:[this.usersGrid]
			},
			this.permsPanel
		]
	};
	
	this.win = Ext.create('Ext.window.Window', opt);
	this.win.show();
	
}