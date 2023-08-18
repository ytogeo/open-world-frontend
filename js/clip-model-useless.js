/**
 * @file 该文件用于实现模型剖切分析
 * 进度：可能弃用。由于GLTF模型的原点与场景中模型应该有的原点不同，导致剖切面无法正确地设置在想要的地方
 */
let mouseEventManagerForClip = null;
let entitiesForClip = new Array();


function displayClipWindow() {
    layer.open({
        title: ['剖切分析', 'height:30px;font-size:14px;line-height:30px;'],
        type: 1,
        shade: 0,
        area: ["450px", "150px"],
        offset: ['100px', '15px'],
        content: $("#clip-analysis"),
        success: function (layero, index) {
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
            initClipModelList();
            //构造几何绘制控制对象
            entityControllerForClip = new CesiumZondy.Manager.EntityController({
                viewer: viewer
            });
            //构造鼠标事件管理对象
            mouseEventManagerForClip = new CesiumZondy.Manager.MouseEventManager({
                viewer: viewer
            });
        },
        cancel: function () {
            stopSkyline();
        }
    })
}
displayClipWindow()
/**
 * 初始化待剖析模型列表（根据当前地图上的模型，动态渲染select元素）
 */
function initClipModelList() {
    //下拉框select元素
    let modelList = document.getElementById("clip-model-list");
    //遍历模型管理器字典
    modelManagerDic.forEach(function (value, key) {
        //新建option元素
        let newOption = document.createElement("option");
        newOption.setAttribute("value", value.model.id);
        newOption.innerHTML = value.model.name;
        //将新建的option添加到select中
        modelList.appendChild(newOption);
    });
}
/**
 * 为生成剖切面绘制线
 */
let curLine = null;

function drawLineForClip() {
    //添加提示tooltip
    displayHintTextOfClip();
    var pointArray = new Array();
    var allPoint = new Array();
    //注册鼠标左键单击事件
    mouseEventManagerForClip.registerMouseEvent('LEFT_CLICK', function (e) {
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
        //添加第二个点
        if (pointArray.length > 3) {
            //绘制线（名称、点数组、线宽、线颜色、是否识别带高度的坐标、是否贴地形、附加属性）
            curLine = entityControllerForClip.appendLine('clip plane line', pointArray, 2, new Cesium.Color(0 / 255, 255 / 255, 255 / 255, 0.8), true, false, {});
            pointArray = new Array();
            pointArray.push(lng);
            pointArray.push(lat);
            pointArray.push(height);
            viewer.entities.removeById('moveline');
            pointArray = new Array();
            allPoint = new Array();
            //注销鼠标各项事件
            //调用此函数时若鼠标仍在地图内，textDiv不会消失，则需额外移除提示文本
            textDiv.style.display = "none";
            textDiv.innerHTML = "提示文本";
            //注销提示的toolTip事件
            mapDiv.removeEventListener('mousemove', showTooltipForClip);
            mapDiv.removeEventListener('mouseout', hideTooltipForClip);
            mouseEventManagerForClip.unRegisterMouseEvent('LEFT_CLICK');
            mouseEventManagerForClip.unRegisterMouseEvent('MOUSE_MOVE');
            //修改按钮状态
            document.getElementById("draw-clipline").classList.add("layui-btn-disabled");
            document.getElementById("horizontal-clip").classList.remove("layui-btn-disabled");
            document.getElementById("vertical-clip").classList.remove("layui-btn-disabled");
        }
    });
    //注册鼠标移动事件
    mouseEventManagerForClip.registerMouseEvent('MOUSE_MOVE', function (e) {
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
                //clampToGround: true, //贴地
            }
        });

    });
}
/**
 * 令div跟随鼠标移动，形成tooltip效果：展示剖切分析的操作提示文本
 */

function showTooltipForClip(evt) {
    var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop;
    textDiv.style.display = "block";
    textDiv.style.left = evt.clientX + scrollleft + 10 + "px";
    textDiv.style.top = evt.clientY + scrolltop + 10 + "px";
    textDiv.innerHTML = "左键继续绘制";
}

function hideTooltipForClip(evt) {
    textDiv.style.display = "none";
    textDiv.innerHTML = "提示文本";
}

function displayHintTextOfClip() {
    //鼠标移动到地图上时，显示提示文本
    mapDiv.addEventListener('mousemove', showTooltipForClip);
    //鼠标移出地图时，隐藏提示文本
    mapDiv.addEventListener('mouseout', hideTooltipForClip);
}

/**
 * 根据绘制的线，构造水平剖切面
 */
let curClippingPlanes = null;



function getHorizontalClipPlane() {
    //去除该次绘制的线
    viewer.entities.remove(curLine);
    //获取绘制的线的坐标数组
    let pointArray = curLine.polyline.positions.getValue();
    //获取剖切面作用的模型id
    let modelId = document.getElementById("clip-model-list").value;
    let model = viewer.entities.getById(modelId)
    //获得当前模型对应的剖切面集合
    curClippingPlanes = clippingPlanesDic.get(modelId)
    console.log(model)
}
/**
 * 根据绘制的线，构造垂直剖切面
 */
function getVerticalClipPlane() {

}
/**
 * 结束剖切，清除剖切线/面
 */
function stopClip() {
    //清除剖切线
    viewer.entities.remove(curLine);
    curLine = null;
    //按钮状态复原
    document.getElementById("draw-clipline").classList.remove("layui-btn-disabled");
    document.getElementById("horizontal-clip").classList.add("layui-btn-disabled");
    document.getElementById("vertical-clip").classList.add("layui-btn-disabled");
}