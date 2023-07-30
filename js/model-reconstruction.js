/**
 * @file 这个文件用于实现建模相关
 */

/**
 * 上传图片的基本设置
 */
// var myserver = "http://127.0.0.1:8081"
layui.use('upload', function () {
    var $ = layui.jquery,
        upload = layui.upload;
    //多图片上传
    upload.render({
        elem: '#uploadimg',
        url: myserver + '/WebUploadIMG' //此处配置你自己的上传接口即可
            ,
        multiple: true,
        before: function (obj) {
            //预读本地文件示例，不支持ie8
            obj.preview(function (index, file, result) {
                $('#up-load-list').append('<img src="' + result + '" alt="' + file.name + '" class="layui-upload-img" style="width:30%">')
            });
        },
        done: function (res) {
            //上传完毕
            console.log(res)
        }
    });
});
/**
 * loading遮罩层动画
 */
function startLoadAnimation() {
    load_index = layer.load(1, {
        shade: [0.5, '#000'], //0.5透明度的灰色背景
        content: '建模中',
        success: function (layero) {
            layero.find('.layui-layer-content').css({
                'padding-top': '39px',
                'width': '42px',
                'height': 'auto',
                "color": "#FFFFFF",
                "background-color": "rgba(0,0,0,0)",
            });
        }
    });
}
/**
 * 时间选择器
 */
layui.use('laydate', function () {
    var laydate = layui.laydate;
    //执行一个laydate实例
    laydate.render({
        elem: '#time0', //指定元素
        theme: '#011530',
        type: 'datetime'
    });
});
/**
 * 选择图片
 */
var load_index;

function chooseimage() {
    layui.use("layer", function () {
        var layer = layui.layer;
        layer.open({
            type: 1,
            title: "图像重建", //弹出层的标题
            content: $('#choose-img'),
            shade: 0, //不显示遮罩
            scrollbar: true,
            area: ['500px', '300px'],
            offset: 'auto',
            btn: ['开始建模', '取消'],
            yes: function (index, layero) {
                startLoadAnimation();
                $('#up-load-list').empty();
                $.get(myserver + '/restruct', function (res) {
                    console.log(res);
                    zipname = res;
                    $('#model_id0').val(zipname);
                    layer.close(load_index);
                    layer.open({
                        type: 1,
                        title: "模型信息填写", //弹出层的标题
                        content: $('#model-infocard-write'),
                        shade: 0, //不显示遮罩
                        area: ['400px', '560px'],
                        offset: 'auto',
                        btn: ['保存'],
                        yes: function (index, layero) {
                            handler0.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, leftClickCallback);
                            mapDiv.removeEventListener('mousemove', showTooltip);
                            mapDiv.removeEventListener('mouseout', hideTooltip);
                            //model_info_submit()
                            var data = {};
                            data["zipname"] = $("#model_id0").val();
                            data["ModelName"] = $("#ModelName0").val();
                            data["ModelInfo"] = $("#ModelInfo0").val();
                            data["ModelType"] = $('#modelType-write input[name="modelType"]:checked').val();
                            data["PostName"] = $("#PostName0").val();
                            data["city"] = $("#city0").val();
                            data["location"] = $("#location0").val();
                            data["poi"] = $("#poi0").val();
                            data["lng"] = $("#lng0").val();
                            data["lat"] = $("#lat0").val();
                            data["time"] = $("#time0").val();
                            $.post(myserver + '/wxcloud_add', data, function (res) {
                                console.log(res);
                                if (res == 0) {
                                    layer.msg('创建成功');
                                    initUserTable();
                                } else {
                                    layer.msg('创建失败');
                                }
                            });
                            layer.close(index);
                        },
                    })
                });
                layer.close(index);
            },
            btn2: function (index, layero) {
                $('#up-load-list').empty();
                layer.close(index);
            },
        });
    });
}


/**
 * 点击界面获取经纬度
 */
var leftClickCallback;
var handler0 = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);;

function get_lnglat0() {
    displayHintTextOfGetLngLat();
    leftClickCallback = function (click) {
        var cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
            $('#lng0').val(longitudeString);
            $('#lat0').val(latitudeString);
        }
    };
    handler0 = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler0.setInputAction(leftClickCallback, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}

function getLngLatShow() {
    displayHintTextOfGetLngLat();
    leftClickCallback = function (click) {
        var cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
        if (cartesian) {
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(6);
            var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(6);
            $('#lng-show').val(longitudeString);
            $('#lat-show').val(latitudeString);
        }
    };
    handler0 = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler0.setInputAction(leftClickCallback, Cesium.ScreenSpaceEventType.LEFT_CLICK);
}
/**
 * 令div跟随鼠标移动，形成tooltip效果：展示获取经纬度的提示文本
 */
function showTooltip(evt) {
    var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop;
    textDiv.style.display = "block";
    textDiv.style.left = evt.clientX + scrollleft + 10 + "px";
    textDiv.style.top = evt.clientY + scrolltop + 10 + "px";
    textDiv.innerHTML = "在地图上单击鼠标左键获取经纬度"
}

function hideTooltip(evt) {
    textDiv.style.display = "none"
    textDiv.innerHTML = "提示文本"
}
let textDiv = document.getElementById("mouse-move-tooltip");
let mapDiv = document.getElementById("cesium-container");

function displayHintTextOfGetLngLat() {
    //鼠标移动到地图上时，显示提示文本
    mapDiv.addEventListener('mousemove', showTooltip);
    //鼠标移出地图时，隐藏提示文本
    mapDiv.addEventListener('mouseout', hideTooltip);
}