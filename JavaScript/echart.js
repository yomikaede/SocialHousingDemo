function createChart(/*x_data, y_data, x_name, y_name*/chartData)
{
	var dom = document.getElementById("chartPopLayer");
	var myChart = echarts.init(dom);
	var app = {};
	option = null;
	
	var data = [];
	
	for (let obj in chartData)
	{
		var object = {
			value: chartData[obj],
			name: obj
		}
		data.push(object);
	}
	
/* 	option = {
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
	} */
	
	option = {
		backgroundColor: '#2c343c',

		tooltip : {
			trigger: 'item',
			formatter: "{a} <br/>{b} : {c} ({d}%)"
		},

		series : [
			{
				type:'pie',
				radius : '55%',
				center: ['50%', '50%'],
				data: data.sort(function (a, b) { return a.value - b.value; }),
				//roseType: 'radius',
				label: {
					normal: {
						textStyle: {
							color: 'rgba(255, 255, 255, 0.3)'
						}
					}
				},
				labelLine: {
					normal: {
						lineStyle: {
							color: 'rgba(255, 255, 255, 0.3)'
						},
						smooth: 0.2,
						length: 10,
						length2: 20
					}
				},
/* 				itemStyle: {
					normal: {
						color: '#c23531',
						shadowBlur: 200,
						shadowColor: 'rgba(0, 0, 0, 0.5)'
					}
				},  */
				itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
				},

				animationType: 'scale',
				animationEasing: 'elasticOut',
				animationDelay: function (idx) {
					return Math.random() * 200;
				}
			}
		]
	};
	
	if (option && typeof option === "object") {
		myChart.setOption(option, true);
	}
}