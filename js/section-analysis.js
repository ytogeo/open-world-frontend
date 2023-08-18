/**
 * @file 该文件用于实现剖面分析
 */

let entityControllerForSection = null;
let mouseEventManagerForSection = null;
let entitiesForSection = new Array();

function displaySectionWindow() {
    layer.open({
        title: ['剖面分析', 'height:30px;font-size:14px;line-height:30px;'],
        type: 1,
        shade: 0,
        area: ["320px", "110px"],
        offset: ['100px', '15px'],
        content: $("#section-analysis"),
        success: function (layero, index) {
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
            //构造几何绘制控制对象
            entityControllerForSection = new CesiumZondy.Manager.EntityController({
                viewer: viewer
            });
            //构造鼠标事件管理对象
            mouseEventManagerForSection = new CesiumZondy.Manager.MouseEventManager({
                viewer: viewer
            });
        },
        cancel: function () {
            clearSection();
        }
    })
}

/**
 * 为剖面设置起始点
 */
let startPoint = null;
let endPoint = null;

function drawPointForSection() {
    viewer.entities.remove(startPoint);
    viewer.entities.remove(endPoint);
    //添加提示tooltip
    displayHintTextOfSectionAnalysis();
    //注册鼠标左键单击事件
    mouseEventManagerForSection.registerMouseEvent('LEFT_CLICK', function (movement) {
        //屏幕坐标转笛卡尔坐标
        var cartesian = viewer.getCartesian3Position(movement.position, cartesian);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height; //模型高度
        //添加点：经度、纬度、高程、名称、像素大小、颜色、外边线颜色、边线宽度
        let point = entityControllerForSection.appendPoint(lng, lat, height, '点', 10, new Cesium.Color(32 / 255, 178 / 255, 170 / 255, 1), new Cesium.Color(255 / 255, 255 / 255, 0 / 255, 1), 1.5);
        //设置起始点与终点
        if (startPoint == null) {
            startPoint = point;
            return;
        }
        endPoint = point;
        //注销鼠标各项事件
        //调用此函数时若鼠标仍在地图内，textDiv不会消失，则需额外移除提示文本
        textDiv.style.display = "none";
        textDiv.innerHTML = "提示文本";
        //注销提示的toolTip事件
        mapDiv.removeEventListener('mousemove', showTooltipForSection);
        mapDiv.removeEventListener('mouseout', hideTooltipForSection);
        mouseEventManagerForSection.unRegisterMouseEvent('LEFT_CLICK');
        mouseEventManagerForSection.unRegisterMouseEvent('MOUSE_MOVE');
        mouseEventManagerForSection.unRegisterMouseEvent('RIGHT_CLICK');
        //修改按钮状态
        document.getElementById("draw-section").classList.add("layui-btn-disabled");
        document.getElementById("get-section").classList.remove("layui-btn-disabled");
        // let waiting = layer.msg("等待绘制剖面…", {
        //     time: 100000
        // })
        //异步绘制剖面完成后
        getSection().then(function () {
            //layer.close(waiting);
            layer.msg("剖面绘制完成")
        })
    });
}

/**
 * 根据起始点，绘制剖面线
 */
let sectionLine = null;

async function getSection() {
    let startPositions = startPoint.position.getValue();
    let endPositions = endPoint.position.getValue();
    // 插值获取两点间的100个点
    var count = 100;
    var cartesians = new Array(count);
    for (var i = 0; i < count; ++i) {
        var offset = i / (count - 1);
        cartesians[i] = Cesium.Cartesian3.lerp(
            startPositions,
            endPositions,
            offset,
            new Cesium.Cartesian3()
        );
    }
    //异步获得模型上高度
    var promise = viewer.scene.clampToHeightMostDetailed(
        cartesians
    );
    //带模型高度的坐标点
    var clampedCartesians = await promise;
    //添加剖面线
    sectionLine = viewer.entities.add({
        polyline: {
            positions: clampedCartesians,
            arcType: Cesium.ArcType.RHUMB,
            material: Cesium.Color.GREEN,
            width: 3,
        },
    });
    return clampedCartesians;
}
/**
 * 展示分析结果
 */
function displayAnalysisResult() {
    layer.open({
        title: ['分析结果'],
        type: 1,
        shade: 0,
        area: ["500px", "350px"],
        content: $("#section-result"),
        success: function (layero, index) {
            initAnalysisResult();
        },
    })
}
//displayAnalysisResult()
function initAnalysisResult() {
    //清除上一次的折线图
    if (myChart != null) {
        myChart.clear();
    }
    let positions = sectionLine.polyline.positions.getValue();
    //使用map方法，获得z坐标数组
    let zpositions = positions.map(function (item) {
        //笛卡尔转到WGS84弧度坐标系
        let cartographic = Cesium.Cartographic.fromCartesian(item);
        return Number(cartographic.height);
    })
    //获取最大值、最小值
    //注：使用ES6的扩展运算符将数组展开
    let max = Math.max(...zpositions);
    let min = Math.min(...zpositions);
    //计算起始点直线距离
    let startPositions = startPoint.position.getValue();
    let endPositions = endPoint.position.getValue();
    let distance = Cesium.Cartesian3.distance(startPositions, endPositions);
    //计算剖面线长度
    let length = 0;
    let lengthArr = new Array(); //用于折线图X轴显示，存储每一段的长度
    for (let i = 0; i < positions.length - 1; i++) {
        let curLength = Cesium.Cartesian3.distance(positions[i], positions[i + 1])
        length += curLength;
        lengthArr.push(length.toFixed(0));
    }
    //显示四项统计结果
    document.getElementById('max-div').innerHTML = "最大高程：" + max.toFixed(2) + "米";
    document.getElementById('min-div').innerHTML = "最小高程：" + min.toFixed(2) + "米";
    document.getElementById('distance-div').innerHTML = "起始点直线距离：" + distance.toFixed(2) + "米";
    document.getElementById('length-div').innerHTML = "剖面线长度：" + length.toFixed(2) + "米";
    //初始化折线图
    initLineChart(zpositions, lengthArr);
}
/**
 * 清除
 */
function clearSection() {
    //移除相关实体
    viewer.entities.remove(startPoint);
    viewer.entities.remove(endPoint);
    viewer.entities.remove(sectionLine);
    startPoint = null;
    endPoint = null;
    sectionLine = null;
    //恢复按钮状态
    document.getElementById("draw-section").classList.remove("layui-btn-disabled");
    document.getElementById("get-section").classList.add("layui-btn-disabled");
}
/**
 * 令div跟随鼠标移动，形成tooltip效果：展示缓冲区分析的操作提示文本
 */
function showTooltipForSection(evt) {
    var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop;
    textDiv.style.display = "block";
    textDiv.style.left = evt.clientX + scrollleft + 10 + "px";
    textDiv.style.top = evt.clientY + scrolltop + 10 + "px";
    textDiv.innerHTML = "左键绘制起点/终点";
}

function hideTooltipForSection(evt) {
    textDiv.style.display = "none";
    textDiv.innerHTML = "提示文本";
}

function displayHintTextOfSectionAnalysis() {
    //鼠标移动到地图上时，显示提示文本
    mapDiv.addEventListener('mousemove', showTooltipForSection);
    //鼠标移出地图时，隐藏提示文本
    mapDiv.addEventListener('mouseout', hideTooltipForSection);
}

/**
 * 初始化折线图
 * @param {*} zpositions 
 */
let myChart = null;

function initLineChart(data, lengthArr) {
    let zpositions = data.map(item => item.toFixed(2));
    myChart = echarts.init(document.getElementById("my-section-echart"));
    var option = {
        grid: {
            top: "10%",
            left: "0px",
            right: "12.5%",
            bottom: "10%",
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
            name: '距离/m',
            nameTextStyle: {
                color: '#7ec7ff',
            },
            type: 'category',
            boundaryGap: false,
            axisLabel: {
                formatter: '{value}',
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
            interval: lengthArr / 10,
            data: lengthArr,
        }, ],
        yAxis: [{
            boundaryGap: false,
            type: 'value',
            axisLabel: {
                formatter: '{value} m',
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
            name: '高程',
            type: 'line',
            smooth: true,
            showSymbol: true,
            symbolSize: 3,
            zlevel: 3,
            itemStyle: {
                color: '#19a3df',
                borderColor: '#a3c8d8',
            },
            lineStyle: {
                normal: {
                    width: 1,
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
            data: zpositions,
        }, ],
    };
    myChart.setOption(option);
}