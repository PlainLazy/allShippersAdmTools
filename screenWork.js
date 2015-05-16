lg(__FILE__ + '.js');

//интерфейс рабоей области
function screenWork () {
	lg('screenWork');
	
	this.btUsersHr = function () {
		lg('btUsersHr');
		new winUsers();
	}.bind(this);
	
	this.btCompaniesHr = function () {
		lg('btCompaniesHr');
		new winCompanies();
	}.bind(this);
	
	this.btMapHr = function () {
		lg('btMapHr');
		new winYmap();
	}.bind(this);
	
	this.btLogutHr = function () {
		lg('btLogutHr');
		new api({cm:'logout', sid:sid}, this.logoutHr);
	}.bind(this);
	
	this.logoutHr = function (dat) {
		lg('logoutHr');
		cookieDel('sid');
		cookieDel('sid_remember');
		sid = null;
		this.panel.remove(true);
		screenLogin();
	}.bind(this);
	
	// создаем элементы рабочей области
	this.btUsers = Ext.create('Ext.button.Button', {text:'Пользователи', flex:0, handler:this.btUsersHr});
	this.btCompanies = Ext.create('Ext.button.Button', {text:'Компании', flex:0, handler:this.btCompaniesHr});
	this.btMap = Ext.create('Ext.button.Button', {text:'Карта', flex:0, handler:this.btMapHr});
	this.btLogout = Ext.create('Ext.button.Button', {text:'Выход', flex:0, handler:this.btLogutHr});
	
	// создаем рабочую область
	this.panel = Ext.create('Ext.container.Viewport', {
		renderTo:document.body, layout:'fit',
		items: [{
			xtype:'panel', bodyPadding:10, layout:'fit',
			dockedItems: {  // элементы cсверху
				xtype:'toolbar', items:[this.btUsers,this.btCompanies,this.btMap,'->',this.btLogout]
			}
		}]
	});
	
}