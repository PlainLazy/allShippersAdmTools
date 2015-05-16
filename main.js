/*
// определение координаты компании по адресу, и сохранение их
function company_geocode (id, addr) {
	lg('company_geocode ' + id + ' ' + addr);
	
	this.id = id;
	
	this.success = function (result, request) {
		lg('company_geocode.success ' + result.response);
		// ищем позицию
		var point = null;
		try {
			point = result['response']['GeoObjectCollection']['featureMember'][0]['GeoObject']['Point']['pos']
		} catch (e) {
			lg('company_geocode pos failed: ' + e);
		}
		console.debug(point);
		if (point) {
			// проверяем формат, извлекаем долготу/широту
			var reg = /^([0-9.]+) ([0-9.]+)$/;
			var result = reg.exec(point);
			if (result && result.length == 3) {
				// формат верен, долгота в result[1], широта в result[2]
				lg(' pos: ' + result[1] + ',' + result[2]);
				new api({cm:'company.pos', sid:sid, id:this.id, 'long':result[1], 'lat':result[2]});
			}
		}
	}.bind(this);
	
	// запрос обратного геокодинга (см https://tech.yandex.ru/maps/geocoder/)
	// юзаем jsonp, это херь для обхода безопасности браузеров, котрые не дают по-нормальному заружать данные со сторонних доменов
	Ext.data.JsonP.request({
		url: 'http://geocode-maps.yandex.ru/1.x/',
		params: {geocode: addr, format:'json', results:1},
		//callbackKey: 'callback',
		success: this.success
	});
	
}
*/

// запускается когда extjs будет готов
















