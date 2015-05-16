lg(__FILE__ + '.js');

//function winCompanySelect (tTitle, tButtonLabel, fSelectedHr, opts) {
function winCompanySelect (o) {
	lg('winCompanySelect');
	this.refresh = function () {
		if (!this.crutch1) { this.crutch1 = true; return; }
		lg('refresh');
		if (this.store1.getCount() > 0) { this.grid1.view.bufferedRenderer.scrollTo(1); }
	}.bind(this);
	//var exPars = isNumber(o.ignoreType) ? {ignoreType: o.ignoreType} : {};
	this.store1 = Ext.create('Ext.data.BufferedStore', {
		id:'store', model:'allshippersIdBasedSimpleModel', remoteGroup:true, remoteSort:true, remoteFilter:true, pageSize:300,
		autoLoad:false,
		proxy:{
			type:'allshippersCompaniesGetAPI', url:'api.php', noCache:false, simpleSortMode:true, sortParam:'sort', groupDirectionParam:'dir', startParam:'start', limitParam:'limit',
			//extraParams:exPars,
			reader: {type:'json', rootProperty:'data', totalProperty:'total'},
		},
		sorters:[{property:'name', direction:'ASC'}],
		listeners:{refresh:this.refresh} // по событию обновления (фильтров) нужно делать такую херню, потому что иначе таблица глючит (это костыль)
	});
	this.selectionHr = function (t, sel, op) {
		if (!sel || sel.length < 1) { return; }
		lg('selectionHr');
		this.record1 = sel[0];
		this.btSelect.setDisabled(false);
	}.bind(this);
	this.dclickHr = function () {
		lg('dclickHr');
		this.btSelectHr();
	}.bind(this);
	this.grid1 = Ext.create('Ext.grid.Panel', {
		store:this.store1, loadMask:true, multiSelect:false, selModel:{pruneRemoved:false}, viewConfig:{trackOver:false}, plugins:'gridfilters', emptyText:'',
		columns:[
			{text:"ID",       dataIndex:'id',      width:80,  sortable:false, groupable:false, filter:false, hidden:true},
			{text:"ИНН",      dataIndex:'inn',     width:120, sortable:true,  groupable:false, filter:true},
			{text:"Название", dataIndex:'name',    width:300, sortable:true,  groupable:false, filter:true},
			{text:"ОГРН",     dataIndex:'ogrn',    width:120, sortable:true,  groupable:false, filter:true, hidden:true},
			{text:"КПП",      dataIndex:'kpp',     width:120, sortable:true,  groupable:false, filter:true, hidden:true},
			{text:"Адерс",    dataIndex:'address', width:300, sortable:true,  groupable:false, filter:true}
		],
		listeners:{selectionchange:this.selectionHr, itemdblclick:this.dclickHr}
	});
	this.hr = o.selectedHr;
	this.btSelectHr = function () {
		lg('btSelectHr');
		if (this.hr) { this.hr(this.record1.data); }
		this.win1.close();
	}.bind(this);
	this.btSelect = Ext.create('Ext.Button', {text:o.btLabel, handler:this.btSelectHr, disabled:true});
	var opt = {
		title:o.title, maximized:false, maximizable:true, minimizable:false, monitorResize:true, closable:true, width:480, height:520, resizable:true, modal:true, padding:3, bodyPadding:0, layout:'fit',
		items:[this.grid1], bbar:[this.btSelect]
	};
	this.win1 = Ext.create('Ext.window.Window', opt);
	this.win1.show();
}