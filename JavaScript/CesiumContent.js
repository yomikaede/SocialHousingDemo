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
	
	//初始化视角 坐标
	//西安市区坐标
	//var initialPosition = new Cesium.Cartesian3.fromDegrees(108.962896,34.270019, 55000.000000);
	//上庄灞柳小区坐标
	var initialPosition = new Cesium.Cartesian3.fromDegrees(109.0045201705284,34.38019345131998, 2000.000000);
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

	//读取小区轮廓kml文件
	var kmlOptions = {
		camera : viewer.scene.camera,
		canvas : viewer.scene.canvas,
		clampToGround : true
	};	
	var boundaryPromise = Cesium.KmlDataSource.load('/Source/KMLFiles/baliu_bl.kml', kmlOptions);
	boundaryPromise.then(function(dataSource) {
        viewer.dataSources.add(dataSource);
        var boundaryEntities = dataSource.entities.values;
        for(var i = 0; i < boundaryEntities.length; i++)
        {
        	var entity = boundaryEntities[i];
        	if (Cesium.defined(entity.polyline)) 
        	{
        		entity.polyline.material = Cesium.Color.YELLOW;
        		entity.polyline.width = 5;
                var polyPositions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
                var polyCenter = Cesium.BoundingSphere.fromPoints(polyPositions).center;
                polyCenter = Cesium.Ellipsoid.WGS84.scaleToGeodeticSurface(polyCenter);
                entity.position = polyCenter;
                entity.label = {
                    text : entity.name,
                    show : true,
                    showBackground : true,
                    scale : 0.6,
                    horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                    distanceDisplayCondition : new Cesium.DistanceDisplayCondition(8000.0, 60000.0),
                    disableDepthTestDistance : 100.0
                };
				//TODO: 添加小区描述
                var description = 'Description here.';
                entity.description = description;
        	}
        }
    })

	//读取小区周边kml文件
	var neighborPromise = Cesium.KmlDataSource.load('/Source/KMLFiles/baliu_nbhd.kml', kmlOptions);
    neighborPromise.then(function(dataSource) {
        viewer.dataSources.add(dataSource);
        var neighborEntities = dataSource.entities.values;
        for(var i = 0; i < neighborEntities.length; i++)
        {
          var entity = neighborEntities[i];
          if (Cesium.defined(entity.billboard)) {
                entity.billboard.verticalOrigin = Cesium.VerticalOrigin.BOTTOM;
                entity.label = {
                	text : entity.name,
                    showBackground : true,
                    scale : 0.6,
                    horizontalOrigin : Cesium.HorizontalOrigin.CENTER,
                    verticalOrigin : Cesium.VerticalOrigin.BOTTOM,
                    distanceDisplayCondition : new Cesium.DistanceDisplayCondition(10.0, 8000.0),
                    disableDepthTestDistance : 100.0
                }
                entity.billboard.distanceDisplayCondition = new Cesium.DistanceDisplayCondition(10.0, 8000.0);
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
	
	//读取建筑kml文件
	var buildingPromise = Cesium.KmlDataSource.load('/Source/KMLFiles/baliu_bldg.kml', kmlOptions);
    buildingPromise.then(function(dataSource) {
    	viewer.dataSources.add(dataSource);
        var buildingEntities = dataSource.entities.values;
        for(var i = 0; i < buildingEntities.length; i++)
        {
        	var entity = buildingEntities[i];
        	if (Cesium.defined(entity.polygon)) 
        	{
				//TODO: 添加建筑高度
        		entity.polygon.extrudedHeight = Math.floor(Math.random()*100)+1;
				entity.description = "";
			}
        }
    })
	
	//选中建筑
	//TODO: 根据当前kml重做
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
			popBox();
		  }
	}, Cesium.ScreenSpaceEventType.LEFT_CLICK); */
	
}());