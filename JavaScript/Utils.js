//判断是否为entity
function isEntity(feature){
	if (Cesium.defined(feature)) {
		var entity = Cesium.defaultValue(feature.id, feature.primitive.id);
		if (entity instanceof Cesium.Entity)
			return true;
	}
	return false;
}

//将json对象转为表格
function JsonToChart(json, ignoreList){
	var tableHtml = "<table>";
	for(var i in json){
		if (ignoreList.indexOf(i) == -1)
		{
			tableHtml += "<tr>";
			tableHtml += ("<td>" + i + "</td><td>" + json[i] + "<td>");
			tableHtml += "</tr>";
		}
	}
	tableHtml += "</table>";
	return tableHtml;
};

//判断数据集
function isIncluded(feature, dataSource){
	if (Cesium.defined(feature)) {
		var entity = Cesium.defaultValue(feature.id, feature.primitive.id);
		if (dataSource.entities.contains(entity))
		{
			return true;
		}
	}
	return false;
}

//读取sql	
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
		xmlhttp=new XMLHttpRequest();
	}
	else
	{
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}

	xmlhttp.open("GET", "/get?command=" + command, false);
	xmlhttp.send();
	return JSON.parse(xmlhttp.responseText);
}