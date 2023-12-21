var measureLengthTool;
var measureAreaTool;
var triangulationTool;
var measureSlopeTool;
/**
 * 展示距离测量窗口
 */
function lengthMeasureWindow() {
    layui.use("layer", function () {
        var layer = layui.layer;
        layer.open({
            title: ['距离量测', 'height:30px;font-size:13.5px;line-height:30px;'],
            type: 1,
            shade: 0,
            offset: ['100px', '15px'],
            area: ["350px", "110px"],
            content: $("#length-measure"),
            move: false,
            success: function (layero, index) {
                //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
                layero[0].childNodes[2].childNodes[0].style.top = "-8px";
                layero[0].childNodes[2].childNodes[0].style.right = "-5px";
                lengthMeasure();
            },
            cancel: function () {
                stopLengthMeasure();
            }
        });
    });
}
/*距离测量：开始*/
function lengthMeasure() {
    if (measureLengthTool == undefined) {
        //创建长度测量工具
        measureLengthTool = new Cesium.MeasureLengthTool(viewer);
    }
    //开始长度测量
    measureLengthTool.startTool();
}

/*距离测量：停止*/
function stopLengthMeasure() {
    if (measureLengthTool != undefined) {
        //停止长度测量工具
        measureLengthTool.stopTool();
    }
}


/**
 * 展示面积测量窗口
 */
function areaMeasureWindow() {
    layui.use("layer", function () {
        var layer = layui.layer;
        layer.open({
            title: ['面积量测', 'height:30px;font-size:13.5px;line-height:30px;'],
            type: 1,
            shade: 0,
            offset: ['100px', '15px'],
            area: ["350px", "110px"],
            content: $("#area-measure"),
            move: false,
            success: function (layero, index) {
                //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
                layero[0].childNodes[2].childNodes[0].style.top = "-8px";
                layero[0].childNodes[2].childNodes[0].style.right = "-5px";
                areaMeasure();
            },
            cancel: function () {
                stopAreaMeasure();
            }
        });
    });
}
/*面积测量*/
function areaMeasure() {
    if (measureAreaTool == undefined) {
        //创建面积测量工具
        measureAreaTool = new Cesium.MeasureAreaTool(viewer, {
            exHeight: 3,
        });
    }
    //激活面积测量工具
    measureAreaTool.startTool();
}

/*停止测量*/
function stopAreaMeasure() {
    if (measureAreaTool != undefined) {
        //停止面积测量工具
        measureAreaTool.stopTool();
    }
}

/**
 * 展示三角测量窗口
 */
function triangulationMeasureWindow() {
    layui.use("layer", function () {
        var layer = layui.layer;
        layer.open({
            title: ['三角量测', 'height:30px;font-size:13.5px;line-height:30px;'],
            type: 1,
            shade: 0,
            offset: ['100px', '15px'],
            area: ["350px", "110px"],
            content: $("#tri-measure"),
            move: false,
            success: function (layero, index) {
                //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
                layero[0].childNodes[2].childNodes[0].style.top = "-8px";
                layero[0].childNodes[2].childNodes[0].style.right = "-5px";
                triangulationMeasure();
            },
            cancel: function () {
                stopTriangulationMeasure();
            }
        });
    });
}
/*三角测量*/
function triangulationMeasure() {
    if (triangulationTool == undefined) {
        //创建三角测量工具
        triangulationTool = new Cesium.TriangulationTool(viewer);
    }
    //开始三角测量
    triangulationTool.startTool();
}

/*停止测量*/
function stopTriangulationMeasure() {
    if (triangulationTool != undefined) {
        //定值三角测量工具
        triangulationTool.stopTool();
    }
}

/**
 * 展示坡度测量窗口
 */
function slopeMeasureWindow() {
    layui.use("layer", function () {
        var layer = layui.layer;
        layer.open({
            title: ['坡度量测', 'height:30px;font-size:13.5px;line-height:30px;'],
            type: 1,
            shade: 0,
            offset: ['100px', '15px'],
            area: ["350px", "110px"],
            content: $("#slope-measure"),
            move: false,
            success: function (layero, index) {
                //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
                layero[0].childNodes[2].childNodes[0].style.top = "-8px";
                layero[0].childNodes[2].childNodes[0].style.right = "-5px";
                measureSlope();
            },
            cancel: function () {
                stopMeasureslope();
            }
        });
    });
}
/*坡度测量*/
function measureSlope() {
    if (measureSlopeTool == undefined) {
        //创建坡度测量工具
        measureSlopeTool = new Cesium.MeasureSlopeTool(viewer);
    }
    //开始坡度测量
    measureSlopeTool.startTool();
}

/*停止测量*/
function stopMeasureslope() {
    if (measureSlopeTool != undefined) {
        //停止坡度测量工具
        measureSlopeTool.stopTool();
    }
}