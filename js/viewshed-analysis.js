/**
 * @file 该文件用于实现视域分析
 */

//引入高级分析模块
var advancedAnalysisManager = new CesiumZondy.Manager.AdvancedAnalysisManager({
    viewer: viewer
});
var VisualAnalysisManager = new Cesium.VisualAnalysisManager({
    scene: viewer.scene
})

//定义可视域分析类
var viewshed3d;
//是否可以开始可视域分析
var viewshedAn = true;
//是否已选择观察点
var viewshed3ding = false;

/**
 * 视域分析窗口入口
 */
function viewshedAnalysis() {
    layui.use("layer", function () {
        var layer = layui.layer;
        layer.open({
            title: ['视域分析', 'height:30px;font-size:13.5px;line-height:30px;'],
            type: 1,
            shade: 0,
            offset: ['100px', '15px'],
            area: ["350px", "120px"],
            content: $("#viewshed-analysis"),
            move: false,
            success: function (layero, index) {
                //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
                layero[0].childNodes[2].childNodes[0].style.top = "-8px";
                layero[0].childNodes[2].childNodes[0].style.right = "-5px";
                startViewshedAnalysis();
            },
        });
    });
}
// layui.use("layer", function () {
//     var layer = layui.layer;
//     layer.open({
//         title: ['视域分析', 'height:30px;font-size:13.5px;line-height:30px;'],
//         type: 1,
//         shade: 0,
//         offset: ['100px', '15px'],
//         area: ["350px", "120px"],
//         content: $("#viewshed-analysis"),
//         move: false,
//         success: function (layero, index) {
//             //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
//             layero[0].childNodes[2].childNodes[0].style.top = "-8px";
//             layero[0].childNodes[2].childNodes[0].style.right = "-5px";
//             startViewshedAnalysis();
//         },
//     });
// });
//startViewshedAnalysis();
function startViewshedAnalysis() {

}

// function stopviewshedAn() {
//     //注销事件
//     webGlobe.unRegisterMouseEvent('LEFT_CLICK');
//     webGlobe.unRegisterMouseEvent('RIGHT_CLICK');
//     webGlobe.unRegisterMouseEvent('MOUSE_MOVE');
//     //移除分析显示结果
//     webGlobe.viewer.scene.VisualAnalysisManager.removeAll();
// }