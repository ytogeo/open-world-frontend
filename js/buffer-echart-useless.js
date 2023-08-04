/**
 * @file 这个文件用于展示缓冲区分析后的统计界面
 */


//当界面加载完成后
window.onload = function () {
    let ifm = window.frames["layui-layer-iframe1"].document;
    chartModelType(ifm, jsonArray)
}

function chartLocation(ifm, jsonArray) {
    var id_location = [];
    var num_location = [];
    for (var i = 0; i < jsonArray.length; i++) {
        id_location.push(jsonArray[i].location);
        num_location.push(Number(jsonArray[i].count));
    }
    var myChart = echarts.init(ifm.getElementById("chart2"));
    var option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            top: '15%',
            right: '3%',
            left: '5%',
            bottom: '12%'
        },
        xAxis: [{
            type: 'category',
            data: id_location,
            axisLine: {
                lineStyle: {
                    color: 'rgba(255,255,255,0.12)'
                }
            },
            axisLabel: {
                margin: 10,
                color: '#e2e9ff',
                fontSize: 14
            },
        }],
        yAxis: [{
            axisLabel: {
                formatter: '{value}',
                color: '#e2e9ff',
            },
            axisLine: {
                show: false
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(255,255,255,0.12)'
                }
            },
            minInterval: 1
        }],
        series: [{
            type: 'bar',
            data: num_location,
            barWidth: '20px',
            itemStyle: {
                normal: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                        offset: 0,
                        color: 'rgba(0,244,255,1)' // 0% 处的颜色
                    }, {
                        offset: 1,
                        color: 'rgba(0,77,167,1)' // 100% 处的颜色
                    }], false),
                    barBorderRadius: [5, 5, 5, 5],
                    shadowColor: 'rgba(0,160,221,1)',
                    shadowBlur: 20,
                }
            },


        }]
    };
    myChart.setOption(option);
}

function chartModelType(ifm, jsonArray) {
    var img = "./image/pie.png";
    //获得json中所有模型类型字段的值（箭头函数）
    let typeList = jsonArray.map(item => {
        return item.ModelType
    })
    //为typeList中每一项计数
    let typeAndValue = typeList.reduce(function (prev, next) {
        prev[next] = (prev[next] + 1) || 1;
        return prev;
    }, {});
    //将typeAndValue中的键值对转换为数组
    for (var i = 0; i < id_ModelType.length; i++) {
        modelType.push({
            name: id_ModelType[i],
            value: num_ModelType[i]
        });
    }
    var data = [];
    var color = ['#006ced', '#ffe000', '#ffa800']
    for (var i = 0; i < trafficWay.length; i++) {
        data.push({
            value: trafficWay[i].value,
            name: trafficWay[i].name,
            itemStyle: {
                normal: {
                    borderWidth: 5,
                    shadowBlur: 20,
                    borderColor: color[i],
                    shadowColor: color[i]
                }
            }
        }, {
            value: 2,
            name: '',
            itemStyle: {
                normal: {
                    label: {
                        show: false
                    },
                    labelLine: {
                        show: false
                    },
                    color: 'rgba(0, 0, 0, 0)',
                    borderColor: 'rgba(0, 0, 0, 0)',
                    borderWidth: 0
                }
            }
        });
    }
    var seriesOption = [{
        name: '',
        type: 'pie',
        clockWise: false,
        radius: [65, 69],
        hoverAnimation: false,
        itemStyle: {
            normal: {
                label: {
                    show: true,
                    position: 'outside',
                    color: '#ddd',
                    formatter: function (params) {
                        var percent = 0;
                        var total = 0;
                        for (var i = 0; i < trafficWay.length; i++) {
                            total += trafficWay[i].value;
                        }
                        percent = ((params.value / total) * 100).toFixed(0);
                        if (params.name !== '') {
                            return '模型类型：' + params.name + '\n' + '\n' + '占百分比：' + percent + '%' + '\n' + '\n' + '数量：' + params.value;
                        } else {
                            return '';
                        }
                    },
                },
                labelLine: {
                    length: 10,
                    length2: 20,
                    show: true,
                    color: '#00ffff'
                }
            }
        },
        data: data
    }];
    var myChart = echarts.init(ifm.getElementById("chart3"));
    var option = {
        color: color,
        title: {
            text: '模型类型',
            top: '45%',
            textAlign: "center",
            left: "49%",
            textStyle: {
                color: '#fff',
                fontSize: 20,
                fontWeight: '400'
            }
        },
        graphic: {
            elements: [{
                type: "image",
                z: 3,
                style: {
                    image: img,
                    width: 100,
                    height: 100
                },
                left: 'center',
                top: 'center',
                position: [100, 100]
            }]
        },
        tooltip: {
            show: false
        },
        legend: {
            icon: "circle",
            orient: 'horizontal',
            // x: 'left',
            data: id_ModelType,
            right: 0,
            bottom: 0,
            align: 'right',
            textStyle: {
                color: "#fff"
            },
            itemGap: 20
        },
        toolbox: {
            show: false
        },
        series: seriesOption
    }
    myChart.setOption(option);
}

function chartCount() {
    $.get(myserver + "/wxcloud_query_count", function (res) {
        start(res.count);
    });
}

function chartPostName() {
    $.get(myserver + "/wxcloud_field_query", {
        field_name: "PostName"
    }, function (res) {
        var id_PostName = [];
        var num_PostName = [];
        for (var i = 0; i < res.length; i++) {
            id_PostName.push(res[i]._id);
            num_PostName.push(Number(res[i].count.$numberInt));
        }
        var myChart = echarts.init(document.getElementById("chart4"));
        var datas = [];
        for (var i = 0; i < id_PostName.length; i++) {
            datas.push({
                name: id_PostName[i],
                value: num_PostName[i]
            });
        }
        datas.sort(function (a, b) {
            return b.value - a.value;
        });
        let max = datas.reduce(function (prev, current) {
            return prev.value > current.value ? prev : current
        })
        var colorList = ['rgba(211, 68, 53, 1)', 'rgba(228, 133, 48, 1)', 'rgba(231, 185, 44, 1)', 'rgba(23, 165, 213, 1)'];
        let maxArr = new Array(datas.length).fill(max.value * 1.5);
        option = {

            tooltip: {
                show: false,
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
            },
            legend: {
                show: false,
            },
            grid: {
                left: 0,
                right: 30,
                containLabel: true,
            },
            xAxis: {
                show: false,
                type: 'value',
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: ['rgba(62, 113, 157, 0.5)']
                    }
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(62, 113, 157, 0.5)'
                    }
                },
                axisLabel: {
                    color: 'rgba(62, 113, 157, 1)'
                }
            },
            yAxis: [{
                type: 'category',
                inverse: true,
                axisLine: {
                    show: false,
                },
                axisTick: {
                    show: false,
                },
                axisPointer: {
                    label: {
                        show: true,
                        margin: 30,
                    },
                },
                data: datas.map((item) => item.name),
                axisLabel: {
                    margin: 100,
                    fontSize: 14,
                    align: 'left',
                    color: '#fff',
                    rich: {
                        a1: {
                            color: '#fff',
                            backgroundColor: colorList[0],
                            width: 20,
                            height: 20,
                            align: 'center',
                            borderRadius: 10,
                        },
                        a2: {
                            color: '#fff',
                            backgroundColor: colorList[1],
                            width: 20,
                            height: 20,
                            align: 'center',
                            borderRadius: 10,
                        },
                        a3: {
                            color: '#fff',
                            backgroundColor: colorList[2],
                            width: 20,
                            height: 20,
                            align: 'center',
                            borderRadius: 10,
                        },
                        b: {
                            color: '#fff',
                            backgroundColor: colorList[3],
                            width: 20,
                            height: 20,
                            align: 'center',
                            borderRadius: 10,
                        },
                    },
                    formatter: function (params) {
                        var index = datas.map((item) => item.name).indexOf(params);
                        index = index + 1;
                        if (index - 1 < 3) {
                            return ['{a' + index + '|' + index + '}' + '  ' + params].join('\n');
                        } else {
                            return ['{b|' + index + '}' + '  ' + params].join('\n');
                        }
                    },
                },
            }],
            series: [{
                    z: 2,
                    name: 'value',
                    type: 'bar',
                    barWidth: 8,
                    zlevel: 1,
                    data: datas.map((item, i) => {
                        itemStyle = {}
                        itemStyle.color = new echarts.graphic.LinearGradient(0, 0, 1, 0, [{
                                offset: 0,
                                color: 'rgba(24, 103, 222, 0.4)',
                            },
                            {
                                offset: 1,
                                color: i < 3 ? colorList[i] : colorList[3],
                            },
                        ])
                        return {
                            value: item.value,
                            itemStyle: itemStyle,
                        };
                    }),
                    label: {
                        show: true,
                        position: 'right',
                        color: '#fff',
                        fontSize: 14,
                    },
                    itemStyle: {
                        barBorderRadius: [0, 15, 15, 0],
                    }
                },
                {
                    name: '背景',
                    type: 'bar',
                    barWidth: 24,
                    barGap: '-200%',
                    itemStyle: {
                        normal: {
                            color: 'rgba(0, 64, 128, 0.19)',
                        },
                    },
                    data: maxArr,
                },
            ],
        };
        myChart.setOption(option);
    });
}

function chartPoi() {
    $.get(myserver + "/wxcloud_field_query", {
        field_name: "poi"
    }, function (res) {
        var id_poi = [];
        var num_poi = [];
        for (var i = 0; i < res.length; i++) {
            id_poi.push(res[i]._id);
            num_poi.push(Number(res[i].count.$numberInt));
        }
        var myChart = echarts.init(document.getElementById("chart5"));
        var option = {
            grid: {
                top: 100,
                containLabel: true,
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    lineStyle: {
                        color: {
                            type: 'linear',
                            x: 0,
                            y: 0,
                            x2: 0,
                            y2: 1,
                            colorStops: [{
                                    offset: 0,
                                    color: 'rgba(255,255,255,0)', // 0% 处的颜色
                                },
                                {
                                    offset: 0.5,
                                    color: 'rgba(255,255,255,1)', // 100% 处的颜色
                                },
                                {
                                    offset: 1,
                                    color: 'rgba(255,255,255,0)', // 100% 处的颜色
                                },
                            ],
                            global: false, // 缺省为 false
                        },
                    },
                },
            },
            xAxis: [{
                type: 'category',
                boundaryGap: false,
                axisLabel: {
                    formatter: '{value}',
                    fontSize: 14,
                    margin: 20,
                    textStyle: {
                        color: '#7ec7ff',
                    },
                },
                axisLine: {
                    lineStyle: {
                        color: '#243753',
                    },
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: '#243753',
                    },
                },
                axisTick: {
                    show: false,
                },
                data: id_poi,
            }, ],
            yAxis: [{
                boundaryGap: false,
                type: 'value',
                axisLabel: {
                    textStyle: {
                        color: '#7ec7ff',
                    },
                },
                nameTextStyle: {
                    color: '#fff',
                    fontSize: 12,
                    lineHeight: 40,
                },
                splitLine: {
                    lineStyle: {
                        color: '#243753',
                    },
                },
                axisLine: {
                    show: true,
                    lineStyle: {
                        color: '#283352',
                    },
                },
                axisTick: {
                    show: false,
                },
            }, ],
            series: [{
                name: '报名',
                type: 'line',
                smooth: true,
                showSymbol: true,
                symbolSize: 8,
                zlevel: 3,
                itemStyle: {
                    color: '#19a3df',
                    borderColor: '#a3c8d8',
                },
                lineStyle: {
                    normal: {
                        width: 6,
                        color: '#19a3df',
                    },
                },
                areaStyle: {
                    normal: {
                        color: new echarts.graphic.LinearGradient(
                            0,
                            0,
                            0,
                            1,
                            [{
                                    offset: 0,
                                    color: 'rgba(88,255,255,0.2)',
                                },
                                {
                                    offset: 0.8,
                                    color: 'rgba(88,255,255,0)',
                                },
                            ],
                            false
                        ),
                    },
                },
                data: num_poi,
            }, ],
        };
        myChart.setOption(option);
    });

}

// function initEcharts(jsonArray) {
//     chartLocation(jsonArray)
//     chartModelType(jsonArray)
//     chartCount(jsonArray)
//     chartPostName(jsonArray)
//     chartPpoi(jsonArray)
// }
layui.use("layer", function () {
    var layer = layui.layer;
    layer.open({
        type: 2,
        title: "统计分析", //弹出层的标题
        content: 'chart.html',
        shade: 0, //不显示遮罩
        area: ['60%', '90%'],
        offset: ['80px'],
        maxmin: false,
        closeBtn: 2,
    });
});
let jsonArray = [{
        "ModelInfo": "海棠园石刻",
        "ModelName": "海棠园石刻",
        "ModelType": "雕塑",
        "PostName": "ytogeo",
        "_id": "de90ae1f64b900df004d11aa222f16a7",
        "city": "武汉市",
        "lat": "30.458977",
        "lng": "114.610957",
        "location": "中国地质大学未来城校区",
        "poi": "锦程路68号",
        "time": "2023-07-20 17:39:09",
        "zipname": "2023072017380271"
    },
    {
        "ModelInfo": "一次测试，添加一条记录",
        "ModelName": "测试715",
        "ModelType": "建筑",
        "PostName": "ytogeo",
        "_id": "0bf2073b64b2626500f7b32b752a1526",
        "city": "武汉市",
        "lat": "30.462282",
        "lng": "114.614734",
        "location": "未来城校区",
        "poi": "锦程路68号",
        "time": "2023-07-15 17:09:27",
        "zipname": "2023071517064955"
    },
    {
        "ModelInfo": "艰苦朴素石刻，二次测试",
        "ModelName": "艰苦朴素石刻",
        "ModelType": "雕塑",
        "PostName": "yyt",
        "_id": "7a67810164bbdea20010624027e656ea",
        "city": "武汉市",
        "lat": "30.461738",
        "lng": "114.612895",
        "location": "未来城校区门口艰苦朴素石刻",
        "poi": "锦程街68号",
        "time": "2023-07-22 21:49:54",
        "zipname": "2023072221490580"
    },
    {
        "ModelInfo": "操场旁雕塑",
        "ModelName": "操场旁雕塑",
        "ModelType": "雕塑",
        "PostName": "yyt",
        "_id": "5a027ea064c635eb002889b2333a0c69",
        "city": "武汉市",
        "lat": "30.461561",
        "lng": "114.615525",
        "location": "中国地质大学未来城校区",
        "poi": "锦程街68号",
        "time": "2023-07-30 18:05:08",
        "zipname": "2023073018020090"
    },
    {
        "ModelInfo": "地质工作者雕塑",
        "ModelName": "地质工作者雕塑",
        "ModelType": "雕塑",
        "PostName": "ytogeo",
        "_id": "9c61c31d64b8fa8c003a80cf4343334d",
        "city": "武汉市",
        "lat": "30.460805",
        "lng": "114.612970",
        "location": "未来城校区",
        "poi": "锦程路68号",
        "time": "2023-07-20 17:12:08",
        "zipname": "2023072017100095"
    }
]