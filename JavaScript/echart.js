function createChart(x_data, y_data, x_name, y_name)
{
	var dom = document.getElementById("echartsContainer");
	var myChart = echarts.init(dom);
	var app = {};
	option = null;
	option = {
		xAxis: {
			type: 'category',
			data: x_data,
			name: x_name
			},
		yAxis: {
			type: 'value',
			name: y_name
			},
		series: [{
			data: y_data,
			type: 'line'
			}],
			textStyle: {
			color: 'rgba(255, 255, 255, 0.3)'
			}
	};
	if (option && typeof option === "object") {
		myChart.setOption(option, true);
	}
	dom.display = "block";
}