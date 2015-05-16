lg(__FILE__ + '.js');

// окно карты
function winYmap () {
	lg('winYmap');
	
	// генерируем id для контенера карты
	this.sMapContener = 's' + (ymapSerial++);
	
	// обработчик закрытия окна карты
	this.closeHr = function () {
		lg('closeHr');
		// удаляем кару яндекса, чтобы не текла память
		if (this.myMap) {
			this.myMap.destroy();
			this.myMap = undefined;
		}
	}.bind(this);
	
	// обработчик изменения размера окна мкарты
	this.resizeHr = function () {
		lg('resizeHr');
		// подгоняем карту под новый размер окна
		if (this.myMap) {
			this.myMap.container.fitToViewport(true);
		}
	}.bind(this);
	
	// обраотчик готовности модуля карт
	this.ymapsReadyHr = function () {
		lg('this.ymapsReadyHr');
		
		// создаем карту
		this.myMap = new ymaps.Map(this.sMapContener, {center:[55.76, 37.64], zoom:10});
		
		// убираем лишие инструменты
		this.myMap.controls.remove('fullscreenControl');
		this.myMap.controls.remove('geolocationControl');
		this.myMap.controls.remove('routeEditor');
		this.myMap.controls.remove('rulerControl');
		this.myMap.controls.remove('trafficControl');
		this.myMap.controls.remove('typeSelector');
		
		/*
		this.myMap.events.add('actiontickcomplete', function (e) {
				var tick = e.get('tick');
				console.log('actiontickcomplete ' + tick.globalPixelCenter + ' ' + tick.zoom + ' ' + tick.duration);
				console.debug(e.get('action'));
		}.bind(this));
		*/
		
		// подписываемся на событие изменения видимой области карты
		this.myMap.events.add('boundschange', function (event) {
			lg('boundschange');
			console.debug(event.get('oldBounds'), event.get('newBounds'));
			//var b = event.get('newBounds');
			//new api({cm:'map.companies', sid:sid, lat1:b[0][0], long1:b[0][1], lat2:b[1][0], long2:b[1][1]}, this.companiesHr);
			this.upd();
		}.bind(this));
		
		this.upd();
		
	}.bind(this);
	
	// api запрос компаний в видимой на данный момент области карты
	this.upd = function () {
		lg('upd');
		var s = this.myMap.container.getSize();
		//console.debug(s);
		var b = this.myMap.getBounds();
		new api({cm:'map.companies', sid:sid, wi:s[0], he:s[1], clusterize:this.myMap.getZoom() < 18 ? 1 : 0, lat1:b[0][0], long1:b[0][1], lat2:b[1][0], long2:b[1][1]}, this.companiesHr);
	}.bind(this);
	
	// обработчик ответа api о компаниях в текущей области карты
	this.companiesHr = function (dat) {
		lg('this.companiesHr');
		//console.debug(dat);
		switch (dat.err) {
			case undefined: break;  // ошибок нет
			default: note1('Ошибка получения обхектов для карты', dat.err + ': ' + dat.msg); return;  // непредусмотренноя ошибка
		}
		if (!isArray(dat.companies)) { dat.companies = []; }  // если не пришел список, то фиксим ответ (на всякий случай)
		this.myMap.geoObjects.removeAll();  // очищаем карту
		
		// заполяем кару
		
		var myGeoObjects = [];
		
		var clMin = 2000000000;
		var clMax = 0;
		for (var i = 0; i < dat.companies.length; i++) {
			var c = dat.companies[i];
			var cls = c['cluster'];
			if (cls != undefined) {
				if (clMin > cls['cnt']) { clMin = cls['cnt'] }
				if (clMax < cls['cnt']) { clMax = cls['cnt'] }
			}
		}
		var clRange = clMax - clMin;
		
		if (clMax == 0) {
			// нет класетров
			
			var myGeoObjects = [];
			for (var i = 0; i < dat.companies.length; i++) {
				//console.debug(dat.companies[i]);
				var c = dat.companies[i];
				var obj = new ymaps.GeoObject({
					geometry: {
						type: "Point",// тип геометрии - точка
						coordinates: [c['y'], c['x']] // координаты точки
					},
					properties: {
						hintContent: c['nm'],
						balloonContentHeader: c['nm'],
						balloonContentBody: c['nm']
					}
				},{
					preset: 'islands#blueCircleDotIcon'
				});
				myGeoObjects.push(obj);
			}
			
			var clusterer = new ymaps.Clusterer({clusterDisableClickZoom:true});
			clusterer.add(myGeoObjects);
			this.myMap.geoObjects.add(clusterer);
			
		} else {
			// есть кластеры
			
			for (var i = 0; i < dat.companies.length; i++) {
				//console.debug(dat.companies[i]);
				var c = dat.companies[i];
				
				var cls = c['cluster'];
				if (cls != undefined) {
					var clPc = (clRange == 0) ? 1 : (cls['cnt'] - clMin) / clRange;
					var clSize = 15 * clPc;
					var cl1 = -13-6 - clSize;
					var cl2 = 20+6 + clSize + clSize;
					
					//var l1 = ymaps.templateLayoutFactory.createClass('<div style="background-color:white;position:absolute;left:-23px;top:-23px;width:40px;height:40px;border:3px solid #225D9C;color:#225D9C;line-height:40px; border-radius: 40px;text-align: center">' + cls['cnt'] + '</div>');
					var l1 = ymaps.templateLayoutFactory.createClass('<div style="background-color:white;position:absolute;left:'+cl1+'px;top:'+cl1+'px;width:'+cl2+'px;height:'+cl2+'px;border:3px solid #1e98ff;color:#1e98ff;line-height:'+cl2+'px;border-radius:'+cl2+'px;text-align: center">' + cls['cnt'] + '</div>');
					var obj = new ymaps.Placemark(
						[cls['y'], cls['x']],
						{},
						{iconLayout:l1, iconShape:{type:'Circle', coordinates:[0, 0], radius:20}}
					);
					obj.events.add('click', function () { this.myMap.setZoom(this.myMap.getZoom()+1); }.bind(this));
					this.myMap.geoObjects.add(obj);
				} else {
					var obj = new ymaps.GeoObject({
						geometry: {
							type: "Point",// тип геометрии - точка
							coordinates: [c['y'], c['x']] // координаты точки
						},
						properties: {
							hintContent: c['nm']
							//balloonContentHeader: "balloonContentHeader",
							//balloonContentBody: "balloonContentBody"
						}
					},{
						preset: 'islands#blueCircleDotIcon'
					});
					this.myMap.geoObjects.add(obj);
				}
				
				/*
				myGeoObjects.push(new ymaps.GeoObject({
						geometry: {
							type: "Point",// тип геометрии - точка
							coordinates: [c['y'], c['x']] // координаты точки
						},
						properties: {
							hintContent: c['nm']
						}
					}));
					*/
			}
			
		}
		
		/*
		var clusterer = new ymaps.Clusterer({ clusterDisableClickZoom: true });
		clusterer.add(myGeoObjects);
		this.myMap.geoObjects.add(clusterer);
		*/
	}.bind(this);
	
	// разметка окна карты
	var opt = {
		title:'Карта', maximizable:true, maximized:false, minimizable:false, monitorResize:true, width:640, height:480, resizable:true, modal:true, padding:3, bodyPadding:0,
		layout:'fit',
		html:'<div id="'+this.sMapContener+'" style="width: 100%; height: 100%"></div>',  // контейнер для карты просым див-ом
		listeners: {
			close: this.closeHr,  // событие закрытия окна
			resize: this.resizeHr  // собфтие изменения размера окна
		}
	};
	
	// создаем и показываем окно карты
	this.win = Ext.create('Ext.window.Window', opt);
	this.win.show();
	
	// ожидаем готовности модуля карт
	ymaps.ready(this.ymapsReadyHr);
	
}