lg(__FILE__ + '.js');

function winCompanyLink (o) {
	lg('winCompanyLink');
	
	this.companySelectedHr = function (_oCompany) {
		lg('companySelectedHr ' + _oCompany.name);
		this.oCompany = _oCompany;
		this.tfCompanyName.setValue(this.oCompany.name);
	}.bind(this);
	
	this.btCompanySelectHr = function () {
		lg('btCompanySelectHr');
		new winCompanySelect({title:'Выбор компании для связи', btLabel:'Выбрать', selectedHr:this.companySelectedHr});
	}.bind(this);
	
	this.linkTypeSelectedHr = function (_oLink) {
		lg('linkTypeSelectedHr ' + _oLink.name);
		this.oLink = _oLink;
		this.tfLinkType.setValue(this.oLink.name);
	}.bind(this);
	
	this.btLinkTypeSelectHr = function () {
		lg('btLinkTypeSelectHr');
		new winLinkTypeSelect({title:'Выбор типа связи', btLabel:'Выбрать', selectedHr:this.linkTypeSelectedHr});
	}.bind(this);
	
	this.hr = o.saveHr;
	this.btSaveHr = function () {
		lg('btSaveHr');
		if (!this.oCompany || !this.oLink || !this.hr) { return; }
		this.hr(this.oCompany, this.oLink);
	}.bind(this);
	
	this.tfCompanyName = Ext.create('Ext.form.field.Text', {allowBlank:true, width:300, maxLength:2048, editable:false});
	this.tfLinkType = Ext.create('Ext.form.field.Text', {allowBlank:true, width:300, maxLength:2048, editable:false});
	this.btCompanySelect = Ext.create('Ext.Button', {text:'Выбрать', handler:this.btCompanySelectHr});
	this.btLinkTypeSelect = Ext.create('Ext.Button', {text:'Выбрать', handler:this.btLinkTypeSelectHr});
	this.btSave  = Ext.create('Ext.button.Button', {text: 'Создать', margin:'0 0 0 90', handler:this.btSaveHr});
	
	var opt = {
		title:'Новая связь', maximized:false, maximizable:false, minimizable:false, monitorResize:true, closable:true, autowidth:true, autoheight:true, resizable:true, modal:true, padding:3, bodyPadding:0, layout:'vbox',
		items:[
			{layout:'hbox',items:[{xtype:'label',text:'Компания',padding:4,width:80},this.tfCompanyName,this.btCompanySelect]},
			{layout:'hbox',items:[{xtype:'label',text:'Тип связи',padding:4,width:80},this.tfLinkType,this.btLinkTypeSelect]},
			{padding:4,items:[this.btSave]}
		]
	};
	this.win1 = Ext.create('Ext.window.Window', opt);
	this.win1.show();
}