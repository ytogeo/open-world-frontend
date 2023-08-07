/**
 * 通视分析相关
 */
var viewPoint;
var destinationPointArray = new Array();
var rayArray = new Array();
var objectsToExclude = [];
let handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
document.getElementById("drawViewPoint").addEventListener('click', function () {
    drawViewPoint();
});
document.getElementById("drawDestinationPoint").addEventListener('click', function () {
    drawDestinationPoint();
});
/**
 * 显示通视分析表单弹窗
 */
function visibilityAnalysis() {
    layer.open({
        shade: 0,
        type: 1,
        title: '通视分析',
        area: ['460px', '250px'],
        fix: false,
        content: $("#visibilityAnalysisDiv"),
        btn: ['确定', '清除'],
        btn1: function () {
            //开始分析
            startVisibilityAnalysis(viewPoint, destinationPointArray);
            //通视分析分析
            layer.msg("分析完成！");
            $('#drawViewPoint').removeClass("layui-btn-disabled").attr("disabled", false);
            $('#drawDestinationPoint').removeClass("layui-btn-disabled").attr("disabled", false);
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
        },
        btn2: function () {
            //清除点
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            $('#drawViewPoint').removeClass("layui-btn-disabled").attr("disabled", false);
            $('#drawDestinationPoint').removeClass("layui-btn-disabled").attr("disabled", false);
            //清除起始点
            viewer.entities.remove(viewPoint);
            viewPoint = null;
            //清除目标点
            for (let i = 0; i < destinationPointArray.length; i++) {
                viewer.entities.remove(destinationPointArray[i]);
            }
            destinationPointArray = new Array();
            //清除射线
            for (let i = 0; i < rayArray.length; i++) {
                viewer.entities.remove(rayArray[i]);
            }
            rayArray = [];
            return false;
        },
        cancel: function () {
            //清除点
            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            $('#drawViewPoint').removeClass("layui-btn-disabled").attr("disabled", false);
            $('#drawDestinationPoint').removeClass("layui-btn-disabled").attr("disabled", false);
            //清除起始点
            viewer.entities.remove(viewPoint);
            viewPoint = null;
            //清除目标点
            for (let i = 0; i < destinationPointArray.length; i++) {
                viewer.entities.remove(destinationPointArray[i]);
            }
            destinationPointArray = new Array();
            //清除射线
            for (let i = 0; i < rayArray.length; i++) {
                viewer.entities.remove(rayArray[i]);
            }
            rayArray = [];
        }
    });
}
/**
 * 绘制点
 */
var viewPointPinURI = pinBuilder.fromText("起", Cesium.Color.LIMEGREEN, 38).toDataURL();
var viewDestinationPinURI = pinBuilder.fromText("终", Cesium.Color.RED, 38).toDataURL();

function drawPoint(position, URI) {
    var point = viewer.entities.add({
        position: position,
        billboard: {
            image: URI,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        },
    });
    return point;
}
/**
 * 绘制观察点
 */
function drawViewPoint() {
    //清除起始点
    viewer.entities.remove(viewPoint);
    viewPoint = null;
    //清除目标点
    for (let i = 0; i < destinationPointArray.length; i++) {
        viewer.entities.remove(destinationPointArray[i]);
    }
    destinationPointArray = new Array();
    //清除射线
    for (let i = 0; i < rayArray.length; i++) {
        viewer.entities.remove(rayArray[i]);
    }
    rayArray = new Array();
    $('#drawViewPoint').addClass("layui-btn-disabled").attr("disabled", true);
    handler.setInputAction(function (event) {
        if (viewPoint) {
            viewer.entities.remove(viewPoint);
        }
        //获取地形上的坐标
        let ray = viewer.camera.getPickRay(event.position);
        let dcrCoor = viewer.scene.globe.pick(ray, viewer.scene);
        viewPoint = drawPoint(dcrCoor, viewPointPinURI);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
/**
 * 绘制目标点
 */
function drawDestinationPoint() {
    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK)
    $('#drawDestinationPoint').addClass("layui-btn-disabled").attr("disabled", true);
    handler.setInputAction(function (event) {
        //获取地形上的坐标
        let ray = viewer.camera.getPickRay(event.position);
        let dcrCoor = viewer.scene.globe.pick(ray, viewer.scene);
        destinationPoint = drawPoint(dcrCoor, viewDestinationPinURI);
        destinationPointArray.push(destinationPoint);
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function getDistance(start, end) {
    var startCartographic = Cesium.Cartographic.fromCartesian(start);
    var endCartographic = Cesium.Cartographic.fromCartesian(end);
    var startLon = Cesium.Math.toDegrees(startCartographic.longitude);
    var startLat = Cesium.Math.toDegrees(startCartographic.latitude);
    var endLon = Cesium.Math.toDegrees(endCartographic.longitude);
    var endLat = Cesium.Math.toDegrees(endCartographic.latitude);
    var from = turf.point([startLon, startLat]);
    var to = turf.point([endLon, endLat]);
    var options = {
        units: 'miles'
    };
    return turf.distance(from, to, options);
}

function equalOfDirection(resultDirection, direction) {
    if (Math.abs(resultDirection.x - direction.x) < 0.00001 && Math.abs(resultDirection.y - direction.y) < 0.00001 && Math.abs(resultDirection.z - direction.z) < 0.00001) {
        return true;
    }
    return false;
}

function isLeftSmallerThanRight(left, right) {
    if (right - left > 0.000001) {
        return true;
    }
    return false;
}
/**
 * 通视分析
 * @param {*} viewPoint 
 * @param {*} destinationPointArray 
 */
function startVisibilityAnalysis(viewPoint, destinationPointArray) {
    var viewPointPosition = viewPoint.position._value;
    //对每一个目标点
    for (let i = 0; i < destinationPointArray.length; i++) {
        //获取射线方向（单位向量）
        let direction = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(destinationPointArray[i].position._value, viewPointPosition, new Cesium.Cartesian3()), new Cesium.Cartesian3());
        //获取射线（起始点+方向向量）
        let ray = new Cesium.Ray(viewPointPosition, direction);
        //计算相交
        //let result = viewer.scene.pickFromRay(ray,);
        let result = viewer.scene.globe.pick(ray, viewer.scene);
        if (result !== undefined && result !== null) {
            //计算result与起点的方向向量与距离，用于后面的比较
            let resultDirection = Cesium.Cartesian3.normalize(Cesium.Cartesian3.subtract(result, viewPointPosition, new Cesium.Cartesian3()), new Cesium.Cartesian3());
            let resultDistance = getDistance(viewPointPosition, result);
            let destinationDistance = getDistance(viewPointPosition, destinationPointArray[i].position._value);
            //判断result是否在起点终点之间
            if (resultDistance < destinationDistance && equalOfDirection(resultDirection, direction)) {
                //可视线
                drawLine(result, viewPointPosition, Cesium.Color.GREEN);
                //不可视线
                drawLine(result, destinationPointArray[i].position._value, Cesium.Color.RED);
                //drawPoint(result, pinBuilder.fromText("!", Cesium.Color.YELLOW, 38).toDataURL());
            } else {
                //连接起点和终点
                drawLine(viewPointPosition, destinationPointArray[i].position._value, Cesium.Color.GREEN);
                console.log("没有遮挡");
            }
        } else {
            //连接起点和终点
            drawLine(viewPointPosition, destinationPointArray[i].position._value, Cesium.Color.GREEN);
            console.log("没有遮挡");
        }
    }
}

function drawLine(start, end, color) {
    var line = viewer.entities.add({
        polyline: {
            positions: [start, end],
            width: 4,
            material: color,
        }
    });
    rayArray.push(line);
}