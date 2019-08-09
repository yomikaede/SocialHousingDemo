(function(){
	"use strict";
	
	//Cesium Ion Token
	//Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyMTRjOTU4NC05YjgzLTRkY2ItODc5Ny1iMmNjYTY1NGM4NTYiLCJpZCI6MTMzNTksInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NjMxNjA2NDd9.8QNebQOHWVNfaHACDU8dgldjiaDQnrin6OkSht96Tx8';
	
	//初始化Cesium
	var viewer = new Cesium.Viewer('cesiumContainer',{
		baseLayerPicker : false,
		timeline : false,
		scene3DOnly : true,
		imageryProvider: new Cesium.UrlTemplateImageryProvider({
			//谷歌地图影像图层
			url:"http://mt1.google.cn/vt/lyrs=s&hl=zh-CN&x={x}&y={y}&z={z}&s=Gali"
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
	var dataSourceIndex = [];
	//初始化视角 坐标
	//西安市区坐标
	var initialPosition = new Cesium.Cartesian3.fromDegrees(108.962896,34.270019, 55000.000000);
	//上庄灞柳小区坐标
	//var initialPosition = new Cesium.Cartesian3.fromDegrees(109.0045201705284,34.38019345131998, 2000.000000);
	var initialOrientation = new Cesium.HeadingPitchRoll.fromDegrees(0.000000, -90.000000, 0.000000);
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
		handlerLMove.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		handlerLClick.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
		handlerLClick.setInputAction(onLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
		closePicBox();
		viewer.selectedEntity = undefined;
		var menuLayer = document.getElementById("menuLayer");
		menuLayer.style.display = "none";
		if(selectedVillage!=""){
			viewer.dataSources.get(dataSourceIndex[selectedVillage+'_bldg']).show=false;
			viewer.dataSources.get(dataSourceIndex[selectedVillage+'_nbhd']).show=false;
		}
		viewer.scene.camera.flyTo(homeCameraView);
	});


	//读取3dtiles（建筑科技大学demo）	
	/* var buildingData = viewer.scene.primitives.add(
	  new Cesium.Cesium3DTileset({
		  url:'/Source/3dtiles/tileset.json'
	  })
	);
	var heightStyle = new Cesium.Cesium3DTileStyle({
		color : {
			conditions : [
				["${floor} >= 20", "rgba(45, 0, 75, 0.5)"],
				["${floor} >= 15", "rgb(102, 71, 151)"],
				["${floor} >= 10", "rgb(170, 162, 204)"],
				["${floor} >= 5", "rgb(224, 226, 238)"],
				["true", "rgb(127, 59, 8)"]
			]
		}
	});	
	buildingData.style = heightStyle; */

	var kmlOptions = {
		camera : viewer.scene.camera,
		canvas : viewer.scene.canvas,
		//clampToGround : true
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
					entity.polygon.material = new Cesium.Color(1,1,1,0.1);
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
					//TODO: 添加小区描述
					var description = 'Description here.';
					entity.description = description;
				}
			}
		})
	}
	
	//读取小区周边kml文件	
	function readNeighborKML(url)
	{		
		var neighborPromise = Cesium.KmlDataSource.load(url, kmlOptions);
		neighborPromise.then(function(dataSource) {
			viewer.dataSources.add(dataSource);
			dataSourceIndex[dataSource.name+'_nbhd'] = viewer.dataSources.indexOf(dataSource);
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
	}

	//读取建筑kml文件
	function readBuildingKML(url)
	{
		var buildingPromise = Cesium.KmlDataSource.load(url, kmlOptions);
		var floorData = [];
		buildingPromise.then(function(dataSource) {
			viewer.dataSources.add(dataSource);
			dataSourceIndex[dataSource.name+'_bldg'] = viewer.dataSources.indexOf(dataSource);
			var buildingEntities = dataSource.entities.values;
			for(var i = 0; i < buildingEntities.length; i++)
			{
				var entity = buildingEntities[i];
				if (Cesium.defined(entity.polygon)) 
				{
					if (Cesium.defined(entity.kml.extendedData))
					{
						var buildingInfo = entity.kml.extendedData;
						if (floorData[buildingInfo.floor.value + '层'] == undefined)
						{
							floorData[buildingInfo.floor.value + '层'] = 0;
						}
						floorData[buildingInfo.floor.value + '层'] = floorData[buildingInfo.floor.value + '层'] + 1;
						entity.polygon.extrudedHeight = buildingInfo.floor.value * 3;
						entity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
											  '<tr><th>层数</th><td>' + buildingInfo.floor.value + '</td></tr>' +
											  '</tbody></table>';
						entity.name = buildingInfo.buildingName.value;					
						//TODO:根据高度设置颜色
					}
				}
			}
			//createChart(floorData);
			
		})
	}
	

	function isEntity(feature){
		if (Cesium.defined(feature)) {
			var entity = Cesium.defaultValue(feature.id, feature.primitive.id);
			if (entity instanceof Cesium.Entity)
				return true;
		}
		return false;
	}

	function onMouseMove(movement) {
	    var startFeature = viewer.scene.pick(movement.startPosition);
	    var endFeature = viewer.scene.pick(movement.endPosition);
	    var startFlag = isEntity(startFeature);
	    var endFlag = isEntity(endFeature);
	    if(startFlag && endFlag && (startFeature!=endFeature)){
	    	startFeature.id.polygon.material = new Cesium.Color(1, 1, 1, 0.1);
	    	endFeature.id.polygon.material = Cesium.Color.WHITE;
	    }
		if(startFlag && (!endFlag))
			startFeature.id.polygon.material = new Cesium.Color(1, 1, 1, 0.1);
		if((!startFlag) && endFlag)
			endFeature.id.polygon.material = Cesium.Color.WHITE;
	}

	//左键单击选中进入小区
	function onLeftClick(movement) {
    	var pickedFeature = viewer.scene.pick(movement.position);
    	if (Cesium.defined(pickedFeature)) {
		    selectedEntity = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
			if (selectedEntity instanceof Cesium.Entity) {
	            var polyCenter = selectedEntity.position.getValue();
	            var cartographic=Cesium.Cartographic.fromCartesian(polyCenter);
				var lat = Cesium.Math.toDegrees(cartographic.latitude);
				var lng = Cesium.Math.toDegrees(cartographic.longitude);
	            viewer.scene.camera.setView({
	            	destination : new Cesium.Cartesian3.fromDegrees(lng, lat, 600),
	            	orientation : initialOrientation
	            });
				readBuildingKML('/Source/KMLFiles/baliu_bldg.kml');
				readNeighborKML('/Source/KMLFiles/baliu_nbhd.kml');
				handlerLMove.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
				handlerLClick.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
				selectedEntity.polygon.material = new Cesium.Color(1,1,1,0);
				selectedVillage = selectedEntity.kml.extendedData.village.value;
				handlerLClick.setInputAction(onLeftClickBldg, Cesium.ScreenSpaceEventType.LEFT_CLICK);
				var menuLayer = document.getElementById("menuLayer");
				menuLayer.style.display = "block";
		    }
  		}
	}

	//小区内左键单击选择建筑
	function onLeftClickBldg(movement) {
    	var pickedFeature = viewer.scene.pick(movement.position);
    	if (Cesium.defined(pickedFeature)) {
		    selectedEntity = Cesium.defaultValue(pickedFeature.id, pickedFeature.primitive.id);
			if (selectedEntity instanceof Cesium.Entity) {
				var buildingImg = document.getElementById("image");
				buildingImg.src = '/Source/pic/' + 'baliu_001.jpg';
				popPicBox();
		    }
  		}
	}

	readBoundaryLineKML('/Source/KMLFiles/baliu_bl.kml');
	var handlerLClick = new Cesium.ScreenSpaceEventHandler(viewer.canvas);
	var handlerLMove = new Cesium.ScreenSpaceEventHandler(viewer.canvas);

	handlerLMove.setInputAction(onMouseMove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
	handlerLClick.setInputAction(onLeftClick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
	
	//选中建筑
	//TODO: 根据当前KML读取重做
	/* var selectedEntity = new Cesium.Entity();
	var originColor = Cesium.Color.BLUE;
	var originFeature = new Cesium.Entity();
	
	viewer.screenSpaceEventHandler.setInputAction(function onLeftClick(movement) {
		  originFeature.color = originColor;
		  var pickedFeature = viewer.scene.pick(movement.position);
		  if(Cesium.defined(pickedFeature))
		  {
			originColor = pickedFeature.color;
			pickedFeature.color = Cesium.Color.BLUE;	
			originFeature = pickedFeature;
			selectedEntity.name='建筑详情';
			viewer.selectedEntity = selectedEntity;
			var buildingID = dictionary[pickedFeature.getProperty('id')];
			var buildingInfo = geoEntities.getById(buildingID).kml.extendedData;
			selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
										  '<tr><th>楼号</th><td>' + buildingInfo.buildingID.value + '</td></tr>' +
										  '<tr><th>层高</th><td>' + buildingInfo.floor.value + '</td></tr>' +
										  '<tr><th>住户数量</th><td>' + buildingInfo.household.value + '</td></tr>' +
										  '</tbody></table>';
			document.getElementById('picContainer').innerHTML = '<img src="/Source/pic/' + buildingInfo.image.value + '"alt="">'
			popPicBox();
		  }
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK); */
	
}());