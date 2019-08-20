(function(){
	"use strict";
	
	//Cesium Ion Token
	//Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyMTRjOTU4NC05YjgzLTRkY2ItODc5Ny1iMmNjYTY1NGM4NTYiLCJpZCI6MTMzNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjMxNjA2NDd9.8QNebQOHWVNfaHACDU8dgldjiaDQnrin6OkSht96Tx8';
	
	var entryList = ["出入口"]
	var serviceList = ["公用类","行政管理设施","户外活动场所","教育设施","金融邮电",
						"垃圾处理","商业服务","文化活动中心","医疗卫生设施","自发性服务设施"];
	var trafficList = ["地铁","公交站","小区停车场","周边道路信息"];
	var planChartList = ["住宅建筑面积","商业建筑面积","幼儿园建筑面积","活动中心建筑面积","物业服务建筑面积",
						"卫生站建筑面积","垃圾回收站","公厕","市场建筑面积"];
	var ignoreList = ["项目编号","经度","纬度","项目图片","项目效果图","交通信息文字简介","道路断面形式"];
	
	var originEntity = undefined;
	var selectedVillage = "";
	var villages = [];
	var villageIndex = [];
	var command = "";
	var entryData = new Cesium.CustomDataSource();
	var trafficData = new Cesium.CustomDataSource();
	var buildingData = new Cesium.CustomDataSource();
	var serviceData = new Cesium.CustomDataSource();
	
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
	scene.screenSpaceCameraController.enableZoom = false;
	viewer.screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	
	//初始化视角 坐标
	//西安市区坐标
	var initialPosition = new Cesium.Cartesian3.fromDegrees(108.962896,34.270019, 55000.000000);
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

	//home键设置
	var handler = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
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
		closePicBox("descPopLayer");
		closePicBox("menuLayer");
		serviceData.show = false;
		trafficData.show = false;
		buildingData.show = false;
		entryData.show = false;
		viewer.scene.camera.flyTo(homeCameraView);
	});

	//获取小区信息
	command = "SELECT * FROM 小区总表";
	var villageInfo = NonAsyncReadData(command);
	
	for(var i in villageInfo)
	{
		villages.push(villageInfo[i].项目编号);
		villageIndex[villageInfo[i].项目编号] = villageInfo[i];
	}
	
	for (var i = 0; i < villages.length; i++)
	{
		readBoundaryLineKML('/Source/KMLFiles/' + villages[i] + '_bl.kml');
		readBuildingKML('/Source/KMLFiles/' + villages[i] + '_bldg.kml');
	}
	
	//读取表信息
	function readListData(toReadList, toReadData)
	{		
		for(var list in toReadList)
		{
			command = "SELECT * FROM " + toReadList[list];
			getInfo(command).then(function(value){
				for(var i in value)
				{
					var obj = value[i];
					
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
					        pixelOffset:new Cesium.Cartesian2(0,-5)   
						},
						description: JsonToChart(obj, ignoreList)
					});
					toReadData.entities.add(entity);
				}
			});
		}
		viewer.dataSources.add(toReadData);
		toReadData.show = false;
	}
	
	//读取规划信息
	function readPlanList()
	{
		
		
	}
	
	readListData(entryList, entryData);
	readListData(serviceList, serviceData);
	readListData(trafficList, trafficData);
	
	var kmlOptions = {
		camera : viewer.scene.camera,
		canvas : viewer.scene.canvas,
	};
	
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
	                entity.label = {
	                    text : entity.name,
						font:'normal 52px MicroSoft YaHei',
	                    showBackground : true,
	                    scale : 0.5,
				        fillColor:Cesium.Color.BLACK,
						horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
						verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
						distanceDisplayCondition : new Cesium.DistanceDisplayCondition(8000.0, 80000.0),
				        backgroundColor:Cesium.Color.WHITE, 
				        showBackground:true,
				        style: Cesium.LabelStyle.FILL,
				        pixelOffset:new Cesium.Cartesian2(0,-16)
	                };
					//读取折线
					/*var polyPositions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
					var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
					polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
					entity.position = polyCenter;
					entity.label = {
						text : entity.name,
						font:'normal 52px MicroSoft YaHei',
						scale : 0.5,
				        fillColor:Cesium.Color.BLACK,
						horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
						verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
						distanceDisplayCondition : new Cesium.DistanceDisplayCondition(8000.0, 80000.0),
				        backgroundColor:Cesium.Color.WHITE,
				        showBackground:true,
				        style: Cesium.LabelStyle.FILL,
				        pixelOffset:new Cesium.Cartesian2(0,-16)
					};*/
					viewer.scene.postProcessStages.fxaa.enabled = false;
					entity.description = undefined;
				}
			}
		})
	}

	//读取建筑kml文件
	function readBuildingKML(url)
	{
		var buildingPromise = Cesium.KmlDataSource.load(url, kmlOptions);
		var floorData = [];
		buildingPromise.then(function(dataSource) {
			viewer.dataSources.add(dataSource);
			buildingData = dataSource;
			dataSource.show = false;
			
			command = "SELECT * FROM 小区单元";						
			var buildingSql = NonAsyncReadData(command);
			var sqlData = [];
			for (var i in buildingSql)
			{
				var obj = buildingSql[i];
				sqlData[obj.单元号] = JsonToChart(obj, ignoreList);
			}
			
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
						entity.description = sqlData[entity.name];
						//TODO:根据高度设置颜色
					}
				}
			}
		})
	}
		
	//选择框
	$('input[type="radio"][name="mode"]').change(function modechange(){
		var mode = $(this).val();
		if(mode == "overview")
		{
			closePicBox("hoverPopLayer");
			entryData.show = true;
			trafficData.show = false;
			serviceData.show = false;

			//根据selectvillage得到概览内容，填入infoPopLayer中的表格内
			var information = "<table>";
			var village = villageIndex[selectedVillage];
			for(var i in village)
			{
				if (ignoreList.indexOf(i) == -1)
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
		}
		else if(mode == "building")
		{
			closePicBox("hoverPopLayer");
			closePicBox("infoPopLayer");
			closePicBox("picPopLayer");
			entryData.show = false;
			trafficData.show = false;
			serviceData.show = false;
		}
		else if(mode == "traffic")
		{
			closePicBox("hoverPopLayer");
			closePicBox("infoPopLayer");
			closePicBox("picPopLayer");
			entryData.show = false;
			trafficData.show = true;
			serviceData.show = false;
		}
		else if(mode == "service")
		{
			closePicBox("hoverPopLayer");
			closePicBox("infoPopLayer");
			closePicBox("picPopLayer");
			entryData.show = false;
			trafficData.show = false;
			serviceData.show = true;
		}
		else if(mode == "plan")
		{
			closePicBox("hoverPopLayer");
			closePicBox("infoPopLayer");
			closePicBox("picPopLayer");
			entryData.show = false;
			trafficData.show = false;
			serviceData.show = false;
		}
	});

	//初始化绑定事件
	handler.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	handler.setInputAction(onLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	handler.setInputAction(onDoubleClick, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
	
	//悬停小区
	function onMouseMove(movement) {
	    var startFeature = viewer.scene.pick(movement.startPosition);
	    var endFeature = viewer.scene.pick(movement.endPosition);
	    var startFlag = isEntity(startFeature);
	    var endFlag = isEntity(endFeature);
		
	    if(startFlag && endFlag && (startFeature!=endFeature)){
	    	//endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
			document.getElementById("cesiumContainer").style.cursor = "pointer";
	    }
		if(startFlag && (!endFlag))
		{
			//startFeature.id.polygon.material = Cesium.Color.WHITE;
			document.getElementById("cesiumContainer").style.cursor = "default";
		}
		if((!startFlag) && endFlag)
		{
			//endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
	    	var hover = document.getElementById("hoverPopLayer");
			document.getElementById("cesiumContainer").style.cursor = "pointer";
		}
	}
	
	//左键单击显示小区信息
	function onLeftClick(movement) {
		var pickedFeature = viewer.scene.pick(movement.position);
    	if (Cesium.defined(pickedFeature)) {
		    var selectedEntity = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
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
		    var selectedEntity = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
			if (selectedEntity instanceof Cesium.Entity) {
				document.getElementById("cesiumContainer").style.cursor = "default";
				closePicBox("descPopLayer");
	            var polyCenter = selectedEntity.position.getValue();
	            var cartographic=Cesium.Cartographic.fromCartesian(polyCenter);
				var lat = Cesium.Math.toDegrees(cartographic.latitude);
				var lng = Cesium.Math.toDegrees(cartographic.longitude);
	            var destinationView = {
	            	destination : new Cesium.Cartesian3.fromDegrees(lng, lat - 0.0045, 500),
	            	orientation : villageOrientation
	            };
				viewer.scene.camera.flyTo(destinationView);
				selectedVillage = selectedEntity.kml.extendedData.village.value;
				entryData.show = true;
				trafficData.show = false;
				serviceData.show = false;
				buildingData.show = true;
				$('input:radio[name="mode"][value="overview"]').prop("checked", "checked");
				//TODO:根据selectvillage得到概览内容，填入infoPopLayer中的表格内
				var information = "<table>";
				var village = villageIndex[selectedVillage];
				for(var i in village)
				{
					if(ignoreList.indexOf(i) == -1)
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
				selectedEntity.polygon.material = new Cesium.Color(1, 1, 1, 0);
				
				var menuLayer = document.getElementById("menuLayer");
				menuLayer.style.display = "block";
		    }
  		}
	}

	//小区内悬停
	function onMouseMoveBldg(movement) {
	    var startFeature = viewer.scene.pick(movement.startPosition);
	    var endFeature = viewer.scene.pick(movement.endPosition);
		var entryStartFlag = isIncluded(startFeature, entryData);
	    var entryEndFlag = isIncluded(endFeature, entryData);
	    var buildingStartFlag = isIncluded(startFeature, buildingData);
	    var buildingEndFlag = isIncluded(endFeature, buildingData);
		var serviceStartFlag = isIncluded(startFeature, serviceData);
	    var serviceEndFlag = isIncluded(endFeature, serviceData);
		var trafficStartFlag = isIncluded(startFeature, trafficData);
	    var trafficEndFlag = isIncluded(endFeature, trafficData);
		
		//出入口悬停
	    if(entryStartFlag && entryEndFlag && (startFeature != endFeature))
		{
			document.getElementById("cesiumContainer").style.cursor = "pointer";
	    }
		if(entryStartFlag && (!entryEndFlag))
		{
			document.getElementById("cesiumContainer").style.cursor = "default";
		}
		if((!entryStartFlag) && entryEndFlag)
		{
			document.getElementById("cesiumContainer").style.cursor = "pointer";
	    }
		
		//建筑悬停
	    if(buildingStartFlag && buildingEndFlag && (startFeature != endFeature))
		{
	    	startFeature.id.polygon.material = Cesium.Color.TAN;
	    	endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
			if (Cesium.defined(endFeature.id.description))
			{
				hover.innerHTML = endFeature.id.description;
				popPicBox("hoverPopLayer");
			}
	    }
		if(buildingStartFlag && (!buildingEndFlag))
		{
			startFeature.id.polygon.material = Cesium.Color.TAN;
			closePicBox("hoverPopLayer");
		}
		if((!buildingStartFlag) && buildingEndFlag)
		{
			endFeature.id.polygon.material = new Cesium.Color(0.8, 0.8, 1, 1);
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
			if (Cesium.defined(endFeature.id.description))
			{
				hover.innerHTML = endFeature.id.description;
				popPicBox("hoverPopLayer");
			}
	    }
		
		//公服设施悬停
	    if(serviceStartFlag && serviceEndFlag && (startFeature != endFeature))
		{
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
			if (Cesium.defined(endFeature.id.description))
			{
				hover.innerHTML = endFeature.id.description;
				popPicBox("hoverPopLayer");
			}
	    }
		if(serviceStartFlag && (!serviceEndFlag))
		{
			closePicBox("hoverPopLayer");
		}
		if((!serviceStartFlag) && serviceEndFlag)
		{
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
			if (Cesium.defined(endFeature.id.description))
			{
				hover.innerHTML = endFeature.id.description;
				popPicBox("hoverPopLayer");
			}
	    }
		
		//交通悬停
	    if(trafficStartFlag && trafficEndFlag && (startFeature != endFeature))
		{
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
			if (Cesium.defined(endFeature.id.description))
			{
				hover.innerHTML = endFeature.id.description;
				popPicBox("hoverPopLayer");
			}
	    }
		if(trafficStartFlag && (!trafficEndFlag))
		{
			closePicBox("hoverPopLayer");
		}
		if((!trafficStartFlag) && trafficEndFlag)
		{
	    	var hover = document.getElementById("hoverPopLayer");
	    	hover.style.left = movement.endPosition.x + "px";
	    	hover.style.top = movement.endPosition.y + "px";
			if (Cesium.defined(endFeature.id.description))
			{
				hover.innerHTML = endFeature.id.description;
				popPicBox("hoverPopLayer");
			}
	    }
		
	}

	//左键单击事件（出入口）
	function onLeftClickBldg(movement) {
    	var pickedFeature = viewer.scene.pick(movement.position);
    	if (Cesium.defined(pickedFeature)) {
		    var selectedEntity = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
			if (entryData.entities.contains(selectedEntity)) 
			{
				//TODO：弹出表格
		    }
  		}
	}
	
}());