/**
 * @description：将模型以pin的形式添加到地图
 */
let isDisplayPin = true;
let pinArray = new Array();
let handlerOfClickPin = null;

function switchDisplayState() {
    let visibilityStateIcon = document.getElementById("display-model-pin-button-icon");
    //pin展示的状态下，点击可以关闭pin
    if (isDisplayPin) {
        visibilityStateIcon.classList.remove("layui-icon-eye");
        visibilityStateIcon.classList.add("layui-icon-eye-invisible");
        visibilityStateIcon.title = "关闭模型标记";
        isDisplayPin = false;
        //添加pin到地图
        addPinToMap(pinDataSource);
        return;
    }
    //移除所有pin
    visibilityStateIcon.classList.remove("layui-icon-eye-invisible");
    visibilityStateIcon.classList.add("layui-icon-eye");
    visibilityStateIcon.title = "打开模型标记";
    for (let i = 0; i < pinArray.length; i++) {
        viewer.entities.remove(pinArray[i]);
    }
    pinArray = []; //清空数组
    //在表格中重新加载所有数据
    let table = layui.table;
    table.reloadData('db-table', {
        url: myserver + '/wxcloud_query',
    })
    //移除点击事件
    handlerOfClickPin.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, leftClickCallback);
    //修改状态
    isDisplayPin = true;
}
/**
 * 根据pinDataSource，将pin添加到地图上
 * @param {*} pinDataSource 
 */
function addPinToMap(pinDataSource) {
    //定义三种模型对应的Pin样式
    let pinURIOfBuilding = pinBuilder.fromMakiIconId("building", Cesium.Color.GOLDENROD, 40);
    let pinURIOfStatue = pinBuilder.fromMakiIconId("landmark", Cesium.Color.DODGERBLUE, 40);
    let pinURIOfOthers = pinBuilder.fromMakiIconId("natural", Cesium.Color.SEAGREEN, 40);
    let currentPinURI = null;
    //遍历数据源
    for (let i of pinDataSource.values()) {
        //根据模型类别设置当前URL（pin的样式）
        switch (i.type) {
            case "建筑":
                currentPinURI = pinURIOfBuilding;
                break;
            case "雕塑":
                currentPinURI = pinURIOfStatue;
                break;
            case "其他物件":
                currentPinURI = pinURIOfOthers;
                break;
            default:
                break;
        }
        Promise.resolve(
            currentPinURI
        ).then(function (canvas) {
            //将PIN添加到地图上
            let pin = viewer.entities.add({
                name: i.id,
                position: Cesium.Cartesian3.fromDegrees(i.lng, i.lat),
                billboard: {
                    image: canvas.toDataURL(),
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, //贴地
                },
            });
            //存入PinArray
            pinArray.push(pin);
        });
    }
    //点击事件
    handlerOfClickPin = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handlerOfClickPin.setInputAction(clickPin, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
/**
 * 左键点击pin时触发的事件
 * @param {*} e 
 */
function clickPin(e) {
    var pick = viewer.scene.pick(e.position);
    if (pick && pick.id) {
        let pickItem = pinDataSource.get(pick.id.name); //获取点击到的pin信息
        //摄像机跳转到pin的位置
        viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(pickItem['lng'], pickItem['lat'], 500),
            orientation: {
                heading: Cesium.Math.toRadians(0.0),
                pitch: Cesium.Math.toRadians(-90.0),
                roll: 0.0
            }
        });
        //强制打开侧边栏，在侧边栏中显示模型信息
        if (!isAsideShow) {
            switchAside();
        }
        //根据pickItem的id条件查找
        let table = layui.table;
        table.reloadData('db-table', {
            url: myserver + '/wxcloud_dify_query', //条件查询接口
            where: {
                zipname: pickItem['id'],
            },
        })
    }
}