/**
 * @file 这个文件用于初始化Cesium，包含viewer的初始化、影像图层等等
 */

//未来城校区
let lon = 114.612958;
let lat = 30.459622;
// Cesium密钥
let defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyYTQ1YWM4Yi1jMWQ2LTRjODktYWUwZi1iN2E3MGY0YTc4NzUiLCJpZCI6MTI2OTc3LCJpYXQiOjE2Nzc3NDg2MTB9.1sM-0Hkm_FzlYZFqnTQlYyLVWZcJqg8EelxDssdjl28';
Cesium.Ion.defaultAccessToken = defaultAccessToken;
var imageryLayersArray = new Array();

/**
 * 初始化viewer
 */
viewer = new Cesium.Viewer("cesium-container", {
    geocoder: false,
    homeButton: false,
    sceneModePicker: false,
    baseLayerPicker: false,
    navigationHelpButton: false,
    animation: false,
    timeline: false,
    fullscreenButton: false,
    vrButton: false,
    infoBox: false,
    terrainProvider: Cesium.createWorldTerrain({
        requestWaterMask: true,
    }),
    //Mapbox自定义样式地图图层
    imageryProvider: new Cesium.MapboxStyleImageryProvider({
        username: "houchaogis",
        styleId: 'clg7s6veu000k01p3q9xjadf2',
        accessToken: 'pk.eyJ1IjoiaG91Y2hhb2dpcyIsImEiOiJjbGc3c3Njem4wbXVqM3NxeWFpbnJleHZnIn0.WRlYOVdh-05m6LJTt9u_IQ',
    }),
    //选中entity的绿色框框
    selectionIndicator: true,
});

//开启深度检测
viewer.scene.globe.depthTestAgainstTerrain = true;
//修改摄像头位置（初始）
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, 2000.0),
    orientation: {
        pitch: Cesium.Math.toRadians(-90.0),
        roll: 0
    }
});
// //设置home键后转到的地方
// Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(
//     lon - 1,
//     lat - 1,
//     lon + 1,
//     lat + 1
// )

/**
 * mapbox地图
 */
let darkMap = new Cesium.MapboxStyleImageryProvider({
    username: "houchaogis",
    styleId: 'clg7s6veu000k01p3q9xjadf2',
    accessToken: 'pk.eyJ1IjoiaG91Y2hhb2dpcyIsImEiOiJjbGc3c3Njem4wbXVqM3NxeWFpbnJleHZnIn0.WRlYOVdh-05m6LJTt9u_IQ',
});

/**
 * 天地图影像与注记
 */
let tdtLayer = new Cesium.UrlTemplateImageryProvider({
    url: "http://t7.tianditu.gov.cn/img_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=img&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=49b046e65d94afd82ff0b5b7b69012fa",
    minimumLevel: 3,
    maximumLevel: 18
});
let tdtNoteLayer = new Cesium.UrlTemplateImageryProvider({
    url: "http://t7.tianditu.gov.cn/cia_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=cia&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}&tk=49b046e65d94afd82ff0b5b7b69012fa",
    minimumLevel: 3,
    maximumLevel: 18
});

/**
 * 修改现在默认的鼠标控制方式
 */
viewer.scene.screenSpaceCameraController.zoomEventTypes = [
    Cesium.CameraEventType.WHEEL, //滚轮缩放
];
viewer.scene.screenSpaceCameraController.tiltEventTypes = [
    Cesium.CameraEventType.MIDDLE_DRAG, //右键拖拽旋转
];


/**
 * 切换图层
 */
document.getElementById("choose-layer-button").addEventListener('click', function () {
    layer.open({
        title: "图层选择",
        type: 1,
        shade: 0,
        content: $("#layer-choose-window"),
    })
    layui.use(['element', 'form'], function () {
        var element = layui.element;
        var form = layui.form;
        //单选框改变事件监听
        form.on("radio(cLayer)", function (data) {
            if (data.value == '1') {
                //显示天地图影像
                viewer.imageryLayers.remove(tdtLayer);
                viewer.imageryLayers.remove(tdtNoteLayer);
                viewer.imageryLayers.addImageryProvider(darkMap);
                return;
            }
            //显示暗色地图
            viewer.imageryLayers.remove(darkMap);
            viewer.imageryLayers.addImageryProvider(tdtLayer);
            viewer.imageryLayers.addImageryProvider(tdtNoteLayer);
        });
        form.render(); //重新渲染form
    });
});
//构建pinBuilder
const pinBuilder = new Cesium.PinBuilder();

// //加载学校3dtiles
// var tileset = viewer.scene.primitives.add(
//     new Cesium.Cesium3DTileset({
//         url: "data/tiles/tileset.json",
//     })
// );
// tileset.readyPromise.then(function (tileset) {
//     //高度偏差，正数为向上偏，负数为向下偏，根据真实的模型位置不断进行调整
//     var heightOffset = 15;
//     //计算tileset的绑定范围
//     var boundingSphere = tileset.boundingSphere;
//     //计算中心点位置
//     var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
//     //计算中心点位置坐标
//     var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude,
//         cartographic.latitude, 0);
//     //偏移后的三维坐标
//     var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude,
//         cartographic.latitude, heightOffset);
//     var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
//     //tileset.modelMatrix转换
//     tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
// })