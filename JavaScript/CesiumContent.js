(function(){
	"use strict";
	
	//Cesium Ion Token
	//Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyMTRjOTU4NC05YjgzLTRkY2ItODc5Ny1iMmNjYTY1NGM4NTYiLCJpZCI6MTMzNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjMxNjA2NDd9.8QNebQOHWVNfaHACDU8dgldjiaDQnrin6OkSht96Tx8';
	
	var entryList = ["出入口"]
	var serviceList = ["公用类","行政管理设施","户外活动场所","教育设施","金融邮电",
						"垃圾处理","商业服务","文化活动中心","医疗卫生设施","自发性服务设施"];
	var trafficList = ["地铁","公交站","小区停车场","周边道路信息"];
	
	//初始化Cesium
	var viewer = new Cesium.Viewer('cesiumContainer',{
		baseLayerPicker : false,
		timeline : false,
		scene3DOnly : true,
		selectionIndicator: false,
		infoBox: false,
		imageryProvider: new Cesium.UrlTemplateImageryProvider({
			//谷歌地图影像图层
			url:"http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali",
		}),
		animation: false
	});
	var scene = viewer.scene;
	//scene.screenSpaceCameraController.enableRotate = false;
	//scene.screenSpaceCameraController.enableTranslate = false;
	scene.screenSpaceCameraController.enableZoom = false;
	//scene.screenSpaceCameraController.enableTilt = false;
	//scene.screenSpaceCameraController.enableLook = false;
	viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	
	var selectedEntity = undefined;
	var originEntity = undefined;
	var selectedVillage="";
	var villages = [];
	var villageIndex = [];
	var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
	//初始化视角 坐标
	//西安市区坐标
	var initialPosition = new Cesium.Cartesian3.fromDegrees(108.962896,34.270019, 55000.000000);
	//上庄灞柳小区坐标
	//var initialPosition = new Cesium.Cartesian3.fromDegrees(109.0045201705284,34.38019345131998, 2000.000000);
	var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(0.000000, -90.000000, 0.000000);
	var villageOrientation = new Cesium.HeadingPitchRoll.fromDegrees(0.000000, -45.000000, 0.000000);
	var homeCameraView = {
		destination : initialPosition,
		orientation : {
			heading : initialOrientation.heading,
			pitch : initialOrientation.pitch,
			roll : initialOrientation.roll
		}
	};	


	viewer.scene.camera.setView(homeCameraView);
	viewer.homeButton.viewModel.command.beforeExecute.addEventListener(function (e) {
		e.cancel = true;
		handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
		handler.setInputAction(onLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		handler.setInputAction(onDoubleClick, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

		closePicBox("infoPopLayer");
		closePicBox("picPopLayer");
		serviceData.show = false;
		trafficData.show = false;
		viewer.selectedEntity = undefined;
		closePicBox("descPopLayer");
		closePicBox("menuLayer");
		serviceData.show = false;
		viewer.selectedEntity = undefined;
		viewer.scene.camera.flyTo(homeCameraView);
	});

/* 	var layers = viewer.scene.imageryLayers;
	var blackMarble = layers.addImageryProvider(new Cesium.createTileMapServiceImageryProvider({
		url : 'http://cesiumjs.org/tilesets/imagery/blackmarble',
		maximumLevel : 8,
		credit : 'Black Marble imagery courtesy NASA Earth Observatory'
	})); */


	var kmlOptions = {
		camera : viewer.scene.camera,
		canvas : viewer.scene.canvas,
		//clampToGround : true
	};

	//获取小区信息
	villages.push("XM61010000000088");

	var command = "";
	command = "SELECT * FROM 小区总表";
	getInfo(command).then(function(value){
		for(var i in value)
		{
			villageIndex[value[i].项目编号] = value[i];
		}
		console.log(villageIndex);
	})
	
	
	for (var i = 0; i < villages.length; i++)
	{
		readBoundaryLineKML('/Source/KMLFiles/' + villages[i] + '_bl.kml');
		readBuildingKML('/Source/KMLFiles/' + villages[i] + '_bldg.kml');
	}

	var entryData = new Cesium.CustomDataSource();
	var trafficData = new Cesium.CustomDataSource();
	var buildingData = new Cesium.CustomDataSource();
	var serviceData = new Cesium.CustomDataSource();


	var command = "";
	
	
	//读取信息
	function readListData(toReadList, toReadData)
	{		
		for(var list in toReadList)
		{
			command = "SELECT * FROM " + toReadList[list];
			getInfo(command).then(function(value){
				for(var i in value)
				{
					var obj = value[i];
					var description = [1, 2, 3, 4];
					var entity = new Cesium.Entity({
						position: Cesium.Cartesian3.fromDegrees(obj.经度 - 0.005, obj.纬度 + 0.0014),	
						point: {
							pixelSize : 3,
							color : Cesium.Color.RED,
							outlineColor : Cesium.Color.WHITE,
							outlineWidth : 1
						},
						label: {
							text : obj.名称,
							showBackground : true,
							scale : 0.6,
							horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
							verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
							//distanceDisplayCondition : new Cesium.DistanceDisplayCondition(10.0, 8000.0),
					        pixelOffset:new Cesium.Cartesian2(0,-5)            //偏移
						},
						description: description
					});
					toReadData.entities.add(entity);
				}
			});
		}
		viewer.dataSources.add(toReadData);
		toReadData.show = false;
	}
	
	readListData(entryList, entryData);
	readListData(serviceList, serviceData);
	readListData(trafficList, trafficData);
	
	

	handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	handler.setInputAction(onLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	handler.setInputAction(onDoubleClick, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

	//读取小区轮廓kml文件
	function readBoundaryLineKML(url)
	{
		var boundaryPromise = Cesium.KmlDataSource.load(url, kmlOptions);
		boundaryPromise.then(function(dataSource) {
			viewer.dataSources.add(dataSource);

			var boundaryEntities = dataSource.entities.values;
			for(var i = 0; i < boundaryEntities.length; i++)
			{
				var entity = boundaryEntities[i];
				if (Cesium.defined(entity.polygon)) 
				{
					entity.polygon.material = Cesium.Color.WHITE;
					entity.polygon.outline = true;
					entity.polygon.outlineColor = Cesium.Color.YELLOW;
					entity.polygon.outlineWidth = 10;
					var polyPositions = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now()).positions;
	                var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
	                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
	                entity.position = polyCenter;
	                // Generate labels
	                entity.label = {
	                    text : entity.name,
						font:'normal 52px MicroSoft YaHei',    //字体样式
	                    showBackground : true,
	                    scale : 0.5,
				        fillColor:Cesium.Color.BLACK,        //字体颜色
						horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
						verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
						distanceDisplayCondition : new Cesium.DistanceDisplayCondition(8000.0, 80000.0),
				        backgroundColor:Cesium.Color.WHITE,    //背景颜色
				        showBackground:true,                //是否显示背景颜色
				        style: Cesium.LabelStyle.FILL,        //label样式
				        pixelOffset:new Cesium.Cartesian2(0,-16)            //偏移
	                };
					/*var polyPositions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
					var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
					polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
					entity.position = polyCenter;
					entity.label = {
						text : entity.name,
						font:'normal 52px MicroSoft YaHei',    //字体样式
						scale : 0.5,
				        fillColor:Cesium.Color.BLACK,        //字体颜色
						horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
						verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
						distanceDisplayCondition : new Cesium.DistanceDisplayCondition(8000.0, 80000.0),
				        backgroundColor:Cesium.Color.WHITE,    //背景颜色
				        showBackground:true,                //是否显示背景颜色
				        style: Cesium.LabelStyle.FILL,        //label样式
				        pixelOffset:new Cesium.Cartesian2(0,-16)            //偏移
					};*/
					viewer.scene.postProcessStages.fxaa.enabled = false;
					entity.description = undefined;
				}
			}
		})
	}
	
	/* //读取小区周边kml文件	
	function readNeighborKML(url)
	{		
		var neighborPromise = Cesium.KmlDataSource.load(url, kmlOptions);
		neighborPromise.then(function(dataSource) {
			viewer.dataSources.add(dataSource);
			dataSourceIndex[dataSource.name+'_nbhd'] = viewer.dataSources.indexOf(dataSource);
			dataSource.show = false;
			var neighborEntities = dataSource.entities.values;
			for(var i = 0; i < neighborEntities.length; i++)
			{
			  var entity = neighborEntities[i];
			  if (Cesium.defined(entity.billboard)) {
			  	entity.billboard = undefined;
			  		entity.point= {
				        pixelSize : 3,
				        color : Cesium.Color.RED,
				        outlineColor : Cesium.Color.WHITE,
				        outlineWidth : 1
				    };
					entity.label = {
						text : entity.name,
						showBackground : true,
						scale : 0.6,
						horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
						verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
						distanceDisplayCondition : new Cesium.DistanceDisplayCondition(10.0, 8000.0),
				        pixelOffset:new Cesium.Cartesian2(0,-5)            //偏移
					}
					var cartographicPosition = Cesium.Cartographic.fromCartesian(entity.position.getValue(Cesium.JulianDate.now()));
					var latitude = Cesium.Math.toDegrees(cartographicPosition.latitude);
					var longitude = Cesium.Math.toDegrees(cartographicPosition.longitude);
					var description = '<table class="cesium-infoBox-defaultTable cesium-infoBox-defaultTable-lighter"><tbody>' +
						'<tr><th>' + "Longitude" + '</th><td>' + longitude.toFixed(5) + '</td></tr>' +
						'<tr><th>' + "Latitude" + '</th><td>' + latitude.toFixed(5) + '</td></tr>' +
						'</tbody></table>';
					entity.description = description;
				}
			}
		})
	} */

	//读取建筑kml文件
	function readBuildingKML(url)
	{
		var buildingPromise = Cesium.KmlDataSource.load(url, kmlOptions);
		var floorData = [];
		buildingPromise.then(function(dataSource) {
			viewer.dataSources.add(dataSource);
			buildingData = dataSource;
			dataSource.show = false;
			var buildingEntities = dataSource.entities.values;
			for(var i = 0; i < buildingEntities.length; i++)
			{
				var entity = buildingEntities[i];
				if (Cesium.defined(entity.polygon)) 
				{
					if (Cesium.defined(entity.kml.extendedData))
					{
						var buildingInfo = entity.kml.extendedData;
						entity.polygon.extrudedHeight = buildingInfo.floor.value * 3;
						entity.polygon.material = Cesium.Color.TAN;
						entity.polygon.outline = false;
						entity.description = '';
						entity.name = buildingInfo.buildingName.value;			
						command = "SELECT * FROM 小区单元 WHERE 单元号 = 1#";						
 						var buildingSql = NonAsyncReadData(command);
						if (buildingSql != "")
						{
							var obj = buildingSql[0];
							var description = "<table>";
							for(var j in obj)
							{
								description += "<tr>";
								description += ("<td>" + j + "</td><td>" + obj[j] + "<td>");
								description += "</tr>";
							}
							description += "</table>";
							entity.description = description;
						}
						else
						{
							entity.description = undefined;
						}
						//TODO:根据高度设置颜色
					}
				}
			}
			//createChart(floorData);
			
		})
	}
		



	//选择框
	$('input[type="radio"][name="mode"]').change(function modechange(){
		var mode = $(this).val();
		if(mode == "overview")
		{
			closePicBox("hoverPopLayer");
			buildingData.show = true;
			//根据selectvillage得到概览内容，填入infoPopLayer中的表格内
			document.getElementById("infoPopLayer").innerHTML=
				"<a href=\"javascript:void(0)\" Onclick=\"closePicBox('infoPopLayer')\">x</a><br/>"
				+ "<table>" 
				+ "<tr><th>" + "表头1" + "</th><th>" + "表头2" + "</th></tr>" 
				+ "<tr><td>" + "表项1" + "</td><td>" + "表项2" + "</td></tr>" 
				+ "</table>";
			
			popPicBox("infoPopLayer");
			document.getElementById("descPopLayer").innerHTML=
				"<a href=\"javascript:void(0)\" Onclick=\"closePicBox('descPopLayer')\">x</a><br/>"
				+ "description here";
			//TODO:小区描述
			popPicBox("descPopLayer");
		}
		else if(mode == "building")
		{
			closePicBox("hoverPopLayer");
			buildingData.show = true;
		}
		else if(mode == "traffic")
		{
			closePicBox("hoverPopLayer");
			buildingData.show = false;
		}
		else if(mode == "service")
		{
			closePicBox("hoverPopLayer");
			buildingData.show = false;
		}
		else if(mode == "plan")
		{
			closePicBox("hoverPopLayer");
			buildingData.show = true;
		}
	});

	function isEntity(feature){
		if (Cesium.defined(feature)) {
			var entity = Cesium.defaultValue(feature.id, feature.primitive.id);
			if (entity instanceof Cesium.Entity)
				return true;
		}
		return false;
	}

	//读取sql信息	
	function getInfo(sqlCommand){
		return new Promise(function(resolve, reject){
			$.getJSON("/get?command=" + sqlCommand, function(json){
				resolve(json);
			});	
		})   	
	};
	
	//同步读取
	function NonAsyncReadData(command)
	{
		var xmlhttp;   
		if (window.XMLHttpRequest)
		{
			//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
			xmlhttp=new XMLHttpRequest();
		}
		else
		{
			// IE6, IE5 浏览器执行代码
			xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
		}

		xmlhttp.open("GET", "/get?command=" + command, false);
		xmlhttp.send();
		return JSON.parse(xmlhttp.responseText);
	}
	
	function JsonToChart(json, elementId){
    	var tableHtml = "<table>";
		for(var obj in json){
		    tableHtml += "<tr>";
		    tableHtml += ("<td>" + obj + "</td><td>" + json[obj] + "<td>");
		    tableHtml += "</tr>";
    	}
    	tableHtml += "</table>";
    	document.getElementById(elementId).innerHTML = tableHtml;
    };
	
	//悬停小区信息
	/* function onMouseMove(movement) {
	    var startFeature = viewer.scene.pick(movement.startPosition);
	    var endFeature = viewer.scene.pick(movement.endPosition);
	    var startFlag = isEntity(startFeature);
	    var endFlag = isEntity(endFeature);
	    if(startFlag && endFlag && (startFeature!=endFeature)){
	    	startFeature.id.polygon.material = Cesium.Color.WHITE;
	    	endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
	    	var command = "SELECT * FROM 小区总表 WHERE 项目编号 = '" + endFeature.id.kml.extendedData.village.value + "'";
			popPicBox("hoverPopLayer");
			getInfo(command).then(function(value){
				JsonToChart(value[0], "hoverPopLayer");
			});
			document.getElementById("cesiumContainer").style.cursor = "pointer";
	    }
		if(startFlag && (!endFlag))
		{
			startFeature.id.polygon.material = Cesium.Color.WHITE;
			closePicBox("hoverPopLayer");
			document.getElementById("cesiumContainer").style.cursor = "default";
		}
		if((!startFlag) && endFlag)
		{
			endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
	    	var command = "SELECT * FROM 小区总表 WHERE 项目编号 = '" + endFeature.id.kml.extendedData.village.value + "'";
			popPicBox("hoverPopLayer");
			getInfo(command).then(function(value){
				JsonToChart(value[0], "hoverPopLayer");
			});
			document.getElementById("cesiumContainer").style.cursor = "pointer";
		}
	} */

	//悬停小区
	function onMouseMove(movement) {
	    var startFeature = viewer.scene.pick(movement.startPosition);
	    var endFeature = viewer.scene.pick(movement.endPosition);
	    var startFlag = isEntity(startFeature);
	    var endFlag = isEntity(endFeature);
	    if(startFlag && endFlag && (startFeature!=endFeature)){
	    	startFeature.id.polygon.material = Cesium.Color.WHITE;
	    	endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
			document.getElementById("cesiumContainer").style.cursor = "pointer";
	    }
		if(startFlag && (!endFlag))
		{
			startFeature.id.polygon.material = Cesium.Color.WHITE;
			document.getElementById("cesiumContainer").style.cursor = "default";
		}
		if((!startFlag) && endFlag)
		{
			endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
	    	var hover = document.getElementById("hoverPopLayer");
			document.getElementById("cesiumContainer").style.cursor = "pointer";
		}
	}
	
	//左键单击显示小区信息
	function onLeftClick(movement) {
		var pickedFeature = viewer.scene.pick(movement.position);
    	if (Cesium.defined(pickedFeature)) {
		    selectedEntity = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
			if (selectedEntity instanceof Cesium.Entity) {
				document.getElementById("cesiumContainer").style.cursor = "default";
				selectedVillage = selectedEntity.kml.extendedData.village.value;
				popPicBox("descPopLayer");
				document.getElementById("descPopLayer").innerHTML=
					"<a href=\"javascript:void(0)\" Onclick=\"closePicBox('descPopLayer')\">x</a><br/><p>"
					+ villageIndex[selectedVillage].交通信息文字简介 + "</p>";
				popPicBox("picPopLayer");
				document.getElementById("picPopLayer").innerHTML=
				"<a href=\"javascript:void(0)\" Onclick=\"closePicBox('picPopLayer')\">x</a><br/>"
				+ "<img src = '/Source/pic/" + selectedVillage + "/" + villageIndex[selectedVillage].项目效果图 + "'/>";
			}
		}
	}

	//左键双击选中进入小区
	function onDoubleClick(movement) {
    	var pickedFeature = viewer.scene.pick(movement.position);
    	if (Cesium.defined(pickedFeature)) {
		    selectedEntity = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
			if (selectedEntity instanceof Cesium.Entity) {
				document.getElementById("cesiumContainer").style.cursor = "default";
				closePicBox("descPopLayer");
	            var polyCenter = selectedEntity.position.getValue();
	            var cartographic=Cesium.Cartographic.fromCartesian(polyCenter);
				var lat = Cesium.Math.toDegrees(cartographic.latitude);
				var lng = Cesium.Math.toDegrees(cartographic.longitude);
	            var destinationView = {
	            	destination : new Cesium.Cartesian3.fromDegrees(lng, lat-0.0045, 500),
	            	orientation : villageOrientation
	            };
				viewer.scene.camera.flyTo(destinationView);
				selectedVillage = selectedEntity.kml.extendedData.village.value;
				serviceData.show = true;
				trafficData.show = true;
				buildingData.show = true;
				$('input:radio[name="mode"][value="overview"]').prop("checked", "checked");
				//TODO:根据selectvillage得到概览内容，填入infoPopLayer中的表格内
				var information = "<table>";
				var village = villageIndex[selectedVillage];
				for(var i in village)
				{
					if((i!="项目图片")&&(i!="项目效果图")&&(i!="交通信息文字简介")&&(i!="经度")&&(i!="纬度"))
					{
						information += ("<tr><th>" + i + "</th><th>" + village[i] + "</th></tr>"); 
					}
				}
				information += "</table>";
				popPicBox("infoPopLayer");
				document.getElementById("infoPopLayer").innerHTML = 
					"<a href=\"javascript:void(0)\" Onclick=\"closePicBox('infoPopLayer')\">x</a><br/>"
					+ information;

				popPicBox("picPopLayer");
				document.getElementById("picPopLayer").innerHTML=
				"<a href=\"javascript:void(0)\" Onclick=\"closePicBox('picPopLayer')\">x</a><br/>"
				+ "<img src = '/Source/pic/" + selectedVillage + "/" + villageIndex[selectedVillage].项目图片 + "'/>";

				handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
				handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
				handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
				handler.setInputAction(onLeftClickBldg, Cesium.ScreenSpaceEventType.LEFT_CLICK);
				handler.setInputAction(onMouseMoveBldg, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
				selectedEntity.polygon.material = new Cesium.Color(1,1,1,0);
				
				var menuLayer = document.getElementById("menuLayer");
				menuLayer.style.display = "block";
		    }
  		}
	}

	//TODO:识别entity类型
	function isBuilding(feature){
		if (Cesium.defined(feature)) {
			var entity = Cesium.defaultValue(feature.id, feature.primitive.id);
			if ((entity instanceof Cesium.Entity)&&(Cesium.defined(entity.polygon.extrudedHeight)))
				return true;
		}
		return false;
	}

	function onMouseMoveBldg(movement) {
	    var startFeature = viewer.scene.pick(movement.startPosition);
	    var endFeature = viewer.scene.pick(movement.endPosition);
	    var startFlag = isBuilding(startFeature);
	    var endFlag = isBuilding(endFeature);
	    if(startFlag && endFlag && (startFeature!=endFeature)){
	    	startFeature.id.polygon.material = Cesium.Color.TAN;
	    	endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
	    	hover.innerHTML=endFeature.id.description;
			console.log(endFeature.id);
	    	popPicBox("hoverPopLayer");
	    }
		if(startFlag && (!endFlag))
		{
			startFeature.id.polygon.material = Cesium.Color.TAN;
			closePicBox("hoverPopLayer");
		}
		if((!startFlag) && endFlag)
		{
			endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
	    	hover.innerHTML=endFeature.id.description;
	    	popPicBox("hoverPopLayer");
	    }
	}

	//小区内左键单击选择建筑
	function onLeftClickBldg(movement) {
    	var pickedFeature = viewer.scene.pick(movement.position);
    	if (Cesium.defined(pickedFeature)) {
		    selectedEntity = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
			if (selectedEntity instanceof Cesium.Entity) {
				document.getElementById("picPopLayer").innerHTML=
				"<a href=\"javascript:void(0)\" Onclick=\"closePicBox('picPopLayer')\">x</a><br/>"
				+ "<img src = '/Source/pic/baliu_001.jpg'/>";
				popPicBox("picPopLayer");
				document.getElementById("infoPopLayer").innerHTML=
				"<a href=\"javascript:void(0)\" Onclick=\"closePicBox('infoPopLayer')\">x</a><br/>"
				+ "<table>" 
				+ "<tr><th>" + "表头1" + "</th><th>" + "表头2" + "</th></tr>" 
				+ "<tr><td>" + "表项1" + "</td><td>" + "表项2" + "</td></tr>" 
				+ "</table>";
				popPicBox("infoPopLayer");
		    }
  		}
	}
	
}());