/**
 * @file 该文件用于实现缓冲区分析。包含点线面交互绘制及其对应缓冲区分析
 */
let entityControllerForBuffer = null;
let mouseEventManagerForBuffer = null;
let entitiesForBuffer = new Array();
//初始化分析功能管理类
var analysisManagerForBuffer = new CesiumZondy.Manager.AnalysisManager({
    viewer: viewer
});

/**
 * 缓冲区分析入口
 */
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
            //强制展示Pin
            if (!isDisplayPin) {
                let visibilityStateIcon = document.getElementById("display-model-pin-button-icon");
                visibilityStateIcon.classList.remove("layui-icon-eye");
                visibilityStateIcon.classList.add("layui-icon-eye-invisible");
                visibilityStateIcon.title = "关闭模型标记";
                isDisplayPin = true;
                //添加pin到地图
                addPinToMap(pinDataSource);
            }
            //移除Pin点击事件，防止冲突
            if (handlerOfClickPin != null) {
                handlerOfClickPin.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, leftClickCallback);
            }
        },
        cancel: function (index, layero) {
            removeEntities();
            entityControllerForBuffer = null;
            mouseEventManagerForBuffer = null;
            //恢复Pin点击事件
            if (handlerOfClickPin != null) {
                handlerOfClickPin = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handlerOfClickPin.setInputAction(clickPin, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            }
            //关闭窗体
            layer.close(index);
        }
    })
}


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
        entitiesForBuffer.push(point);
    });
    //注册鼠标右键单击事件
    mouseEventManagerForBuffer.registerMouseEvent('RIGHT_CLICK', function (e) {
        //缓冲区分析
        let radius = document.getElementById('buffer-radius').value;
        if (radius === '') {
            layer.msg("请输入缓冲区半径")
            removeEntities();
            return;
        }
        let unit = document.getElementById('radius-unit').value;
        pointBufferAnalysis(points, radius, unit)
        //注销各项事件
        //调用此函数时若鼠标仍在地图内，textDiv不会消失，则需额外移除提示文本
        textDiv.style.display = "none";
        textDiv.innerHTML = "提示文本";
        //注销提示的toolTip事件
        mapDiv.removeEventListener('mousemove', showTooltipForBuffer);
        mapDiv.removeEventListener('mouseout', hideTooltipForBuffer);
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
    let tempLineArray = new Array();
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
            let tempLine = entityControllerForBuffer.appendLine('贴地形线', pointArray, 2, new Cesium.Color(0 / 255, 255 / 255, 255 / 255, 0.8), true, true, {});
            tempLineArray.push(tempLine);
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
        var moveLine = viewer.entities.add({
            id: 'moveline',
            polyline: {
                positions: [firstPosition, movePosition],
                width: 2,
                material: Cesium.Color.YELLOW,
                clampToGround: true, //贴地
            }
        });
        tempLineArray.push(moveLine);
    });
    //注册鼠标右键单击事件
    mouseEventManagerForBuffer.registerMouseEvent('RIGHT_CLICK', function (e) {
        if (allPoint.length > 3) {
            //绘制线（名称、点数组、线宽、线颜色、是否识别带高度的坐标、是否贴地形、附加属性）
            let polylineForAnalyis = entityControllerForBuffer.appendLine('贴地形线', allPoint, 2, new Cesium.Color(0 / 255, 255 / 255, 255 / 255, 0.8), true, true, {});
            entitiesForBuffer.push(polylineForAnalyis);
            //移除暂时画的实体
            for (let i = 0; i < tempLineArray.length; i++) {
                viewer.entities.remove(tempLineArray[i]);
            }
            tempLineArray = [];
            //缓冲区分析
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
        //调用此函数时若鼠标仍在地图内，textDiv不会消失，则需额外移除提示文本
        textDiv.style.display = "none";
        textDiv.innerHTML = "提示文本";
        //注销提示的toolTip事件
        mapDiv.removeEventListener('mousemove', showTooltipForBuffer);
        mapDiv.removeEventListener('mouseout', hideTooltipForBuffer);
        mouseEventManagerForBuffer.unRegisterMouseEvent('LEFT_CLICK');
        mouseEventManagerForBuffer.unRegisterMouseEvent('MOUSE_MOVE');
        mouseEventManagerForBuffer.unRegisterMouseEvent('RIGHT_CLICK');
    });
}
/**
 * 绘制面（已屎山……）
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
            viewer.entities.removeById('moveline'); //移除点击前最后的动线
        }
        //移除上一次画好的暂时面
        entityControllerForBuffer.removeEntity(lastPolygon);
        //绘制新的暂时面
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
        //移除上一次画好的动面
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
        //绘制完第一条边后的移动，绘制动面
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
        //将最后一次移动的点、暂时面和动面清除掉
        pointArray = pointArray.splice(0, pointArray.length - 3);
        entityControllerForBuffer.removeEntity(lastPolygon);
        entityControllerForBuffer.removeEntity(movePolygon);
        //移除上一次画好的动面
        if (pointArray.length > 3) {
            //绘制最终的面
            let polygonForAnalyis = entityControllerForBuffer.appendPolygon('贴地形面', pointArray, new Cesium.Color(30 / 255, 144 / 255, 255 / 255, 0.8), true, {});
            entitiesForBuffer.push(polygonForAnalyis);
            //缓冲区分析
            let polygonPositions = polygonForAnalyis.polygon.hierarchy._value.positions;
            let radius = document.getElementById('buffer-radius').value;
            if (radius === '') {
                removeEntities();
                if (movePolygon != null) {
                    entityControllerForBuffer.removeEntity(movePolygon)
                }
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
        //调用此函数时若鼠标仍在地图内，textDiv不会消失，则需额外移除提示文本
        textDiv.style.display = "none";
        textDiv.innerHTML = "提示文本";
        //注销提示的toolTip事件
        mapDiv.removeEventListener('mousemove', showTooltipForBuffer);
        mapDiv.removeEventListener('mouseout', hideTooltipForBuffer);
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
    for (let i = 0; i < entitiesForBuffer.length; i++) {
        viewer.entities.remove(entitiesForBuffer[i]);
    }
    entitiesForBuffer = [];
    //移除动态圆特效
    for (let i of scanEffectArray) {
        analysisManagerForBuffer.removeSceneEffect(i);
    }
    scanEffectArray = [];
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
        entitiesForBuffer.push(bufferPolygon);
    }
    getPinInsert(buffered);
}
/**
 * 线缓冲区分析
 * @param {*} polylinePositions 折线上点的坐标数组
 * @param {*} radius 缓冲区半径
 * @param {*} unit 缓冲区半径单位
 */
function polylineBufferAnalysis(polylinePositions, radius, unit) {
    var pointsOfLine = new Array();
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
    entitiesForBuffer.push(bufferPolygon);
    getPinInsert(buffered);
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
    entitiesForBuffer.push(bufferPolygon);
    getPinInsert(buffered);
}

/**
 * 获取缓冲区与Pin点的交集
 * @param {*} bufferPolygon 
 */
function getPinInsert(bufferPolygon) {
    let insertedPinArray = new Array();
    //将pin转为turf的点
    for (let i of pinDataSource.values()) {
        var point = turf.point([Number(i.lng), Number(i.lat)]); //这里要将字符串转为数字
        //判断点是否在缓冲区内
        var isInside = turf.booleanPointInPolygon(point, bufferPolygon);
        if (isInside) {
            //将符合条件的pin存入数组
            insertedPinArray.push(i);
        }
    }
    //添加动态圆特效
    changePinState(insertedPinArray);
}
/**
 * 在符合条件的Pin上添加特效（动态圆）
 * @param {*} insertedPinArray 
 */
let scanEffectArray = new Array();

function changePinState(insertedPinArray) {
    for (let i of insertedPinArray) {
        scanEffect = new Cesium.CircleScanEffect(viewer, {
            center: Cesium.Cartesian3.fromDegrees(i.lng, i.lat, 20),
            radius: 50,
            scanColor: new Cesium.Color(135 / 255, 206 / 255, 250 / 255, 0.5),
            duration: 2000
        });
        //添加添加场景特效-动态圆
        analysisManagerForBuffer.addSceneEffect(scanEffect);
        scanEffectArray.push(scanEffect);
    }
}
/**
 * 令div跟随鼠标移动，形成tooltip效果：展示缓冲区分析的操作提示文本
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