lg(__FILE__ + '.js');

// нитерфейс входа
function screenLogin () {
	lg('screenLogin');
	
	// обработчик логина по куке
	this.restoreHr = function (dat) {
		lg('restoreHr');
		if (dat.err || !dat.sid || !dat.user_id) {
			// логин не удался
			cookieDel('sid');  // удаляем куку, т.к. api не принял ее
			cookieDel('sid_remember');  // удаляем куку, т.к. api не принял ее
			//main();  // запускаем все с начала
			screenLogin();
		} else {
			// успешный логин
			sid = this.cookie_sid;  // принимаем токен сесии как основной и будем использовать его далее
			cookieSet('sid', sid, {expires: sid_ttl});
			if (cookieGet('sid_remember')) { cookieSet('sid_remember', true, {expires: sid_ttl}); }
			// создаем интерфейс рабочей области
			new screenWork();
		}
	}.bind(this);
	
	// попытка восстановления сессии
	this.cookie_sid = cookieGet('sid');  // достаем токен сессии из кук
	lg('cookie_sid=' + this.cookie_sid);
	if (this.cookie_sid) {  // токен сесии есть в куках
		new api({cm:'login', sid:this.cookie_sid}, this.restoreHr);  // пробуем сделать логин по куке
		return;
	}
	
	// обработчик клика по кнопке Вход
	this.btLoginHr = function () {
		lg('btLoginHr');
		
		// получаем ввод юзера
		var email = this.inEmail.value;
		var passw = this.inPassw.value;
		
		// проверяем ввод
		if (email.length < 5) { note1('Сообщение', 'Введите Email'); return; }
		if (passw.length < 3) { note1('Сообщение', 'Введите пароль'); return; }
		
		// делаем запрос в api
		new api({cm:'login', email:email, passw:passw}, this.loginHr);
		
	}.bind(this);
	
	// создаем элементы формы входа
	this.inEmail = Ext.create('Ext.form.field.Text', {fieldLabel:'Email', vtype:'email', allowBlank:false, padding:'0 0 0 10', flex:1, maxLength:128});
	this.inPassw = Ext.create('Ext.form.field.Text', {fieldLabel:'Пароль', inputType:'password', allowBlank:false, padding:'0 0 0 10', flex:1, minLength:1, maxLength:32});
	this.inRemember = Ext.create('Ext.form.field.Checkbox', {fieldLabel:'Запомнить', padding:'0 0 0 10', flex:1});
	this.btLogin = Ext.create('Ext.button.Button', {text:'Войти', flex:1, handler:this.btLoginHr});
	
	// компановка элементов формы входа
	var opt = {
		title:'Вход', maximized:false, maximizable:false, closable:false, autoWidth:true, autoHeight:true, resizable:false, modal:true, padding:3, bodyPadding:0, labelAlign:'right', labelWidth:100,
		items:[
			{xtype:'panel', bodyPadding:10, border:false, layout:{type:'vbox', align:'stretch'}, items:[
				this.inEmail, this.inPassw, this.inRemember, this.btLogin
			]}
		]
	};
	
	this.win = Ext.create('Ext.window.Window', opt);  // создаем окно с формой входа
	this.win.show();  // показываем
	
	this.loginHr = function (dat) {  // обработчик логина по мылу+паролю
		lg('loginHr');
		console.debug(dat);
		
		switch (dat.err) {
			case undefined: break;  // выполнено без ошибок
			case -1: note1('Ошибка входа', 'Неверный логин или пароль'); return;  // обработка преусмотренной ошибки
			default: note1('Ошибка входа', dat.err + ': ' + dat.msg); return;  // обработка непредусмотренной ошибки
		}
		
		// обработка исключительных ситуаций
		if (!dat.sid) { note1('Ошибка вохда', 'sid is null'); return; }  // api не сообщил токен сесии (беда)
		if (!dat.user_id) { note1('Ошибка вохда', 'user_id is null'); return; }  // api не сообщил id юзера (печаль)
		
		sid = dat.sid;  // запоминаем токен сесси, дальше будем его использовать
		
		// определяем как хранить токен сесии (запомнить/незапомнить)
		lg('inRemember=' + this.inRemember.checked);
		cookieSet('sid', sid, {expires: this.inRemember.checked ? sid_ttl : 0});  // 0 - храним пока браузер открыт, иначе храним указанное кол-во секунд
		if (this.inRemember.checked) { cookieSet('sid_remember', true, {expires: sid_ttl}); } else { cookieDel('sid_remember'); }
		
		this.win.close();  // закрываем окно входа
		new screenWork();  // создаем интерфйс рабочей области
		
	}.bind(this);
	
}