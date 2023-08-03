/**
 * @file 该文件用于实现缓冲区分析。包含点线面交互绘制及其对应缓冲区分析
 */
let entityControllerForBuffer = null;
let mouseEventManagerForBuffer = null;

function bufferAnalysis() {
    layer.open({
        title: ['缓冲区分析', 'height:30px;font-size:13.5px;line-height:30px;'],
        type: 1,
        shade: 0,
        offset: ['150px', '15px'],
        area: ["350px", "165px"],
        content: $("#buffer-analysis"),
        success: function (layero, index) {
            //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
            //构造几何绘制控制对象
            entityControllerForBuffer = new CesiumZondy.Manager.EntityController({
                viewer: viewer
            });
            //构造鼠标事件管理对象
            mouseEventManagerForBuffer = new CesiumZondy.Manager.MouseEventManager({
                viewer: viewer
            });
        },
        cancel: function (index, layero) {
            removeEntities();
            entityControllerForBuffer = null;
            mouseEventManagerForBuffer = null;
            layer.close(index);
        }
    })
}

// layer.open({
//     title: ['缓冲区分析', 'height:30px;font-size:13.5px;line-height:30px;'],
//     type: 1,
//     shade: 0,
//     offset: ['150px', '15px'],
//     area: ["350px", "165px"],
//     content: $("#buffer-analysis"),
//     success: function (layero, index) {
//         //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
//         layero[0].childNodes[2].childNodes[0].style.top = "-8px";
//         layero[0].childNodes[2].childNodes[0].style.right = "-5px";
//         //构造几何绘制控制对象
//         entityControllerForBuffer = new CesiumZondy.Manager.EntityController({
//             viewer: viewer
//         });
//         //构造鼠标事件管理对象
//         mouseEventManagerForBuffer = new CesiumZondy.Manager.MouseEventManager({
//             viewer: viewer
//         });
//     },
//     cancel: function (index, layero) {
//         layer.close(index);
//         //移除提示的toolTip
//         mapDiv.removeEventListener('mousemove', showTooltip);
//         mapDiv.removeEventListener('mouseout', hideTooltip);
//     }
// })

/**
 * 绘制点
 */
function drawPointForBuffer() {
    let points = new Array();
    //清除绘制的内容
    removeEntities();
    //添加提示tooltip
    displayHintTextOfBufferAnalysis();
    //注册鼠标左键单击事件
    mouseEventManagerForBuffer.registerMouseEvent('LEFT_CLICK', function (movement) {
        //屏幕坐标转笛卡尔坐标
        var cartesian = viewer.getCartesian3Position(movement.position, cartesian);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height; //模型高度
        //添加点：经度、纬度、高程、名称、像素大小、颜色、外边线颜色、边线宽度
        let point = entityControllerForBuffer.appendPoint(lng, lat, height, '点', 10, new Cesium.Color(32 / 255, 178 / 255, 170 / 255, 1), new Cesium.Color(255 / 255, 255 / 255, 0 / 255, 1), 1.5);
        points.push(point);
    });
    //注册鼠标右键单击事件
    mouseEventManagerForBuffer.registerMouseEvent('RIGHT_CLICK', function (e) {
        let radius = document.getElementById('buffer-radius').value;
        if (radius === '') {
            layer.msg("请输入缓冲区半径")
            removeEntities();
            return;
        }
        let unit = document.getElementById('radius-unit').value;
        pointBufferAnalysis(points, radius, unit)
        mouseEventManagerForBuffer.unRegisterMouseEvent('LEFT_CLICK');
        mouseEventManagerForBuffer.unRegisterMouseEvent('RIGHT_CLICK');
    });
}
/**
 * 绘制线
 */
function drawPolylineForBuffer() {
    //清除绘制的内容
    removeEntities();
    //添加提示tooltip
    displayHintTextOfBufferAnalysis();
    var pointArray = new Array();
    var allPoint = new Array();
    //注册鼠标左键单击事件
    mouseEventManagerForBuffer.registerMouseEvent('LEFT_CLICK', function (e) {
        //屏幕坐标转笛卡尔坐标
        var cartesian = viewer.getCartesian3Position(e.position, cartesian);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        pointArray.push(lng);
        allPoint.push(lng);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        pointArray.push(lat);
        allPoint.push(lat);
        //模型高度
        var height = cartographic.height;
        pointArray.push(height);
        allPoint.push(height);
        //添加点
        if (pointArray.length > 3) {
            //绘制线（名称、点数组、线宽、线颜色、是否识别带高度的坐标、是否贴地形、附加属性）
            entityControllerForBuffer.appendLine('贴地形线', pointArray, 2, new Cesium.Color(0 / 255, 255 / 255, 255 / 255, 0.8), true, true, {});
            pointArray = new Array();
            pointArray.push(lng);
            pointArray.push(lat);
            pointArray.push(height);
            viewer.entities.removeById('moveline');
        }
    });
    //注册鼠标移动事件
    mouseEventManagerForBuffer.registerMouseEvent('MOUSE_MOVE', function (e) {
        viewer.entities.removeById('moveline');
        if (pointArray.length < 3) {
            return;
        }
        var cartesian = viewer.getCartesian3Position(e.endPosition, cartesian);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height;
        var firstPosition = Cesium.Cartesian3.fromDegrees(pointArray[0], pointArray[1], pointArray[2]);
        var movePosition = Cesium.Cartesian3.fromDegrees(lng, lat, height);
        var redBox = viewer.entities.add({
            id: 'moveline',
            polyline: {
                positions: [firstPosition, movePosition],
                width: 2,
                material: Cesium.Color.YELLOW,
                clampToGround: true, //贴地
            }
        });
    });
    //注册鼠标右键单击事件
    mouseEventManagerForBuffer.registerMouseEvent('RIGHT_CLICK', function (e) {
        //移除所有实体
        entityControllerForBuffer.removeAllEntities();
        if (allPoint.length > 3) {
            //绘制线（名称、点数组、线宽、线颜色、是否识别带高度的坐标、是否贴地形、附加属性）
            let polylineForAnalyis = entityControllerForBuffer.appendLine('贴地形线', allPoint, 2, new Cesium.Color(0 / 255, 255 / 255, 255 / 255, 0.8), true, true, {});
            let linePositions = polylineForAnalyis.polyline.positions._value;
            let radius = document.getElementById('buffer-radius').value;
            if (radius === '') {
                layer.msg("请输入缓冲区半径")
                removeEntities();
                return;
            }
            let unit = document.getElementById('radius-unit').value;
            polylineBufferAnalysis(linePositions, radius, unit)
        }
        pointArray = new Array();
        allPoint = new Array();
        //注销鼠标各项事件
        mouseEventManagerForBuffer.unRegisterMouseEvent('LEFT_CLICK');
        mouseEventManagerForBuffer.unRegisterMouseEvent('MOUSE_MOVE');
        mouseEventManagerForBuffer.unRegisterMouseEvent('RIGHT_CLICK');
    });
}
/**
 * 绘制面
 */
let movePolygon = null;
let lastPolygon = null;
let oringinMoveline = null;

function drawPolygonForBuffer() {
    //清除绘制的内容
    removeEntities();
    //添加提示tooltip
    displayHintTextOfBufferAnalysis();
    var pointArray = new Array();
    //注册鼠标左键单击事件
    mouseEventManagerForBuffer.registerMouseEvent('LEFT_CLICK', function (e) {
        //屏幕坐标转笛卡尔坐标
        var cartesian = viewer.getCartesian3Position(e.position, cartesian);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        pointArray.push(lng);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        pointArray.push(lat);
        //模型高度
        var height = cartographic.height;
        pointArray.push(height);
        //第二次点击，画线
        if (pointArray.length == 6) {
            //绘制线（名称、点数组、线宽、线颜色、是否识别带高度的坐标、是否贴地形、附加属性）
            oringinMoveline = entityControllerForBuffer.appendLine('贴地形线', pointArray, 2, new Cesium.Color(255 / 255, 215 / 255, 0 / 255, 0.5), true, true, {});
            return;
        }
        //第三次点击，画一个面
        if (viewer.entities.getById('moveline') != null) {
            viewer.entities.removeById('moveline');
        }
        entityControllerForBuffer.removeEntity(lastPolygon);
        //绘制面
        lastPolygon = entityControllerForBuffer.appendPolygon('贴地形面', pointArray, new Cesium.Color(135 / 255, 206 / 255, 250 / 255, 0.8), true, {});
        if (movePolygon != null) {
            entityControllerForBuffer.removeEntity(movePolygon)
        }
        if (oringinMoveline != null) {
            entityControllerForBuffer.removeEntity(oringinMoveline)
        }
    });
    //注册鼠标移动事件
    mouseEventManagerForBuffer.registerMouseEvent('MOUSE_MOVE', function (e) {
        if (movePolygon != null) {
            entityControllerForBuffer.removeEntity(movePolygon)
        }
        //有两个点之前，绘制的是动线
        if (pointArray.length < 6) {
            viewer.entities.removeById('moveline');
            var cartesian = viewer.getCartesian3Position(e.endPosition, cartesian);
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var lng = Cesium.Math.toDegrees(cartographic.longitude);
            var lat = Cesium.Math.toDegrees(cartographic.latitude);
            var height = cartographic.height;
            var firstPosition = Cesium.Cartesian3.fromDegrees(pointArray[pointArray.length - 3], pointArray[pointArray.length - 2], pointArray[pointArray.length - 1]);
            var movePosition = Cesium.Cartesian3.fromDegrees(lng, lat, height);
            var redBox = viewer.entities.add({
                id: 'moveline',
                polyline: {
                    positions: [firstPosition, movePosition],
                    width: 1,
                    material: Cesium.Color.YELLOW,
                    clampToGround: true, //贴地
                }
            });
            return
        }
        //绘制完第一条边后的移动
        //如果还没有移动过，则不清除上一次的点
        if (pointArray.length > 6) {
            pointArray = pointArray.splice(0, pointArray.length - 3);
        }
        var cartesian = viewer.getCartesian3Position(e.endPosition, cartesian);
        var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        var lng = Cesium.Math.toDegrees(cartographic.longitude);
        var lat = Cesium.Math.toDegrees(cartographic.latitude);
        var height = cartographic.height;
        pointArray.push(lng);
        pointArray.push(lat);
        pointArray.push(height);
        //绘制动面
        movePolygon = entityControllerForBuffer.appendPolygon('movePolygon', pointArray, new Cesium.Color(202 / 255, 255 / 255, 112 / 255, 0.8), true, {});
    });
    //注册鼠标右键单击事件
    mouseEventManagerForBuffer.registerMouseEvent('RIGHT_CLICK', function (e) {
        //将最后一次移动的清除掉
        pointArray = pointArray.splice(0, pointArray.length - 3);
        //移除所有实体
        entityControllerForBuffer.removeAllEntities();
        if (pointArray.length > 3) {
            //绘制最终的面
            let polygonForAnalyis = entityControllerForBuffer.appendPolygon('贴地形面', pointArray, new Cesium.Color(30 / 255, 144 / 255, 255 / 255, 0.8), true, {});
            let polygonPositions = polygonForAnalyis.polygon.hierarchy._value.positions;
            let radius = document.getElementById('buffer-radius').value;
            if (radius === '') {
                removeEntities();
                layer.msg("请输入缓冲区半径")
                return;
            }
            let unit = document.getElementById('radius-unit').value;
            polygonPositions.push(polygonPositions[0]); //首尾放一样的才能用缓冲区分析
            polygonBufferAnalysis(polygonPositions, radius, unit)
        }
        pointArray = new Array();
        //注销鼠标各项事件
        mouseEventManagerForBuffer.unRegisterMouseEvent('LEFT_CLICK');
        mouseEventManagerForBuffer.unRegisterMouseEvent('MOUSE_MOVE');
        mouseEventManagerForBuffer.unRegisterMouseEvent('RIGHT_CLICK');
        //结束绘制后，应当计算缓冲区
        //待补
    });
}

/*移除绘制图形 */
function removeEntities() {
    //调用此函数时若鼠标仍在地图内，textDiv不会消失，则需额外移除提示文本
    textDiv.style.display = "none";
    textDiv.innerHTML = "提示文本";
    //注销提示的toolTip事件
    mapDiv.removeEventListener('mousemove', showTooltipForBuffer);
    mapDiv.removeEventListener('mouseout', hideTooltipForBuffer);
    //注销鼠标各项事件
    mouseEventManagerForBuffer.unRegisterMouseEvent('LEFT_CLICK');
    mouseEventManagerForBuffer.unRegisterMouseEvent('MOUSE_MOVE');
    mouseEventManagerForBuffer.unRegisterMouseEvent('RIGHT_CLICK');
    //移除所有实体
    entityControllerForBuffer.removeAllEntities();
}
let bufferPolygon = null;

/**
 * 点缓冲区分析
 * @param {*} points 点实体数组
 * @param {*} radius 缓冲半径
 * @param {*} unit 缓冲半径单位
 */
function pointBufferAnalysis(points, radius, unit) {
    for (let i = 0; i < points.length; i++) {
        var wgsPosistions = Cesium.Cartographic.fromCartesian(points[i]._position._value);
        let lon = Cesium.Math.toDegrees(wgsPosistions.longitude);
        let lat = Cesium.Math.toDegrees(wgsPosistions.latitude);
        var point = turf.point([lon, lat]);
        var buffered = turf.buffer(point, radius, {
            units: unit
        });
        var bufferPointsOf2DArray = buffered.geometry.coordinates[0];
        var bufferPoints = [];
        //遍历，将二维数组转换为一维数组，存入bufferPoints数组中
        bufferPointsOf2DArray.map(function (item) {
            bufferPoints.push(item[0], item[1]);
        });
        //添加缓冲区实体
        bufferPolygon = viewer.entities.add({
            polygon: {
                hierarchy: {
                    positions: Cesium.Cartesian3.fromDegreesArray(bufferPoints),
                },
                material: new Cesium.Color(137 / 255, 195 / 255, 235 / 255, 0.8),
                classificationType: Cesium.ClassificationType.BOTH
            }
        });
    }
}
/**
 * 线缓冲区分析
 * @param {*} polylinePositions 折线上点的坐标数组
 * @param {*} radius 缓冲区半径
 * @param {*} unit 缓冲区半径单位
 */
function polylineBufferAnalysis(polylinePositions, radius, unit) {
    var pointsOfLine = new Array();
    console.log(polylinePositions)
    //整理坐标
    for (let j = 0; j < polylinePositions.length; j++) {
        var wgsPosistions = Cesium.Cartographic.fromCartesian(polylinePositions[j]);
        let lon = Cesium.Math.toDegrees(wgsPosistions.longitude);
        let lat = Cesium.Math.toDegrees(wgsPosistions.latitude);
        pointsOfLine.push([lon, lat]);
    }
    var buffered = turf.buffer(turf.lineString(pointsOfLine), radius, {
        units: unit
    });
    var bufferPointsOf2DArray = buffered.geometry.coordinates[0];
    var bufferPoints = [];
    //遍历，将二维数组转换为一维数组，存入bufferPoints数组中
    bufferPointsOf2DArray.map(function (item) {
        bufferPoints.push(item[0], item[1]);
    });
    //添加缓冲区实体
    bufferPolygon = viewer.entities.add({
        polygon: {
            hierarchy: {
                positions: Cesium.Cartesian3.fromDegreesArray(bufferPoints),
            },
            material: new Cesium.Color(137 / 255, 195 / 255, 235 / 255, 0.8),
            classificationType: Cesium.ClassificationType.BOTH
        }
    });
}
/**
 * 面缓冲区分析
 * @param {*} polygonPositions 面上点的坐标数组，必须首尾相连（头和尾一样）
 * @param {*} radius 缓冲区半径
 * @param {*} unit 缓冲区半径单位
 */
function polygonBufferAnalysis(polygonPositions, radius, unit) {
    var pointsOfPolygon = new Array();
    var points = new Array();
    //整理坐标
    for (let j = 0; j < polygonPositions.length; j++) {
        var wgsPosistions = Cesium.Cartographic.fromCartesian(polygonPositions[j]);
        let lon = Cesium.Math.toDegrees(wgsPosistions.longitude);
        let lat = Cesium.Math.toDegrees(wgsPosistions.latitude);
        points.push([lon, lat]);
    }
    pointsOfPolygon.push(points);
    var buffered = turf.buffer(turf.polygon(pointsOfPolygon), radius, {
        units: unit
    });
    var bufferPointsOf2DArray = buffered.geometry.coordinates[0];
    var bufferPoints = [];
    //遍历，将二维数组转换为一维数组，存入bufferPoints数组中
    bufferPointsOf2DArray.map(function (item) {
        bufferPoints.push(item[0], item[1]);
    });
    //添加缓冲区实体
    bufferPolygon = viewer.entities.add({
        polygon: {
            hierarchy: {
                positions: Cesium.Cartesian3.fromDegreesArray(bufferPoints),
            },
            material: new Cesium.Color(137 / 255, 195 / 255, 235 / 255, 0.8),
            classificationType: Cesium.ClassificationType.BOTH
        }
    });
}

/**
 * 令div跟随鼠标移动，形成tooltip效果：展示获取经纬度的提示文本
 */

function showTooltipForBuffer(evt) {
    var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop;
    textDiv.style.display = "block";
    textDiv.style.left = evt.clientX + scrollleft + 10 + "px";
    textDiv.style.top = evt.clientY + scrolltop + 10 + "px";
    textDiv.innerHTML = "左键继续绘制，右键结束绘制并分析缓冲区";
}

function hideTooltipForBuffer(evt) {
    textDiv.style.display = "none";
    textDiv.innerHTML = "提示文本";
}

function displayHintTextOfBufferAnalysis() {
    //鼠标移动到地图上时，显示提示文本
    mapDiv.addEventListener('mousemove', showTooltipForBuffer);
    //鼠标移出地图时，隐藏提示文本
    mapDiv.addEventListener('mouseout', hideTooltipForBuffer);
}