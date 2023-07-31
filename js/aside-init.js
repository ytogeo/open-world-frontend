/**
 * @file 这个文件用于初始化侧边栏（用户界面）
 */

const pinDataSource = new Map();
/**
 * 初始化侧边栏用户界面数据库
 */

function initUserTable() {
    layui.use('table', function () {
        var table = layui.table;
        table.render({
            id: 'db-table',
            elem: '#db-table',
            height: '325px',
            url: myserver + '/wxcloud_query',
            parseData: function (res) { //res 即为原始返回的数据
                return {
                    "code": res.errcode, //解析接口状态
                    "msg": res.errmsg, //解析提示文本
                    "count": res.pager.Total, //解析数据长度
                    "data": res.data.map(function (str) {
                        return JSON.parse(str);
                    }) //解析数据列表
                };
            },
            cols: [
                [{
                        field: 'ModelName',
                        title: '模型名称',
                        fixed: 'left',
                    },
                    {
                        field: 'zipname',
                        title: '模型ID',
                        sort: true
                    },
                    {
                        field: 'ModelInfo',
                        title: '模型描述',
                    },
                    {
                        field: 'ModelType',
                        title: '模型类别',
                    },
                    {
                        field: 'PostName',
                        title: '提交人',
                    },

                    {
                        title: '操作',
                        width: 125,
                        align: 'center',
                        fixed: 'right',
                        toolbar: '#info-tool-bar',
                    }
                ]
            ],
            page: {
                limit: 5,
                limits: [5, 10, 20, 50, 100]
            },
            done: function (res, curr, count) {
                model_data = res.data;
                $("table").css("width", "100%");
            }
        });
        table.on('tool(db-table)', function (obj) {
            var data = obj.data; //获得当前行数据
            var layEvent = obj.event; //获得 lay-event 对应的值（也可以是表头的 event 参数对应的值）
            var tr = obj.tr; //获得当前行 tr 的 DOM 对象（如果有的话）
            if (layEvent === 'view-info') { //查看信息
                viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(data["lng"], data["lat"], 500),
                    orientation: {
                        heading: Cesium.Math.toRadians(0.0),
                        pitch: Cesium.Math.toRadians(-90.0),
                        roll: 0.0
                    }
                });
                viewModel_info(data);
            } else if (layEvent === 'download-model') { //下载
                window.open(myserver + '/download/' + data["zipname"]);
            } else if (layEvent === 'delete-model') { //删除
                layer.confirm('确定删除这个模型吗？', function (index) {
                    $.post(myserver + '/wxcloud_delete', {
                        zipname: data["zipname"]
                    }, function (res) {
                        console.log(res);
                        if (res == 0) {
                            layer.msg('删除成功');
                            obj.del(); //删除对应行（tr）的DOM结构，并更新缓存
                            layer.close(index);
                        } else {
                            layer.msg('删除失败');
                        }
                    });
                });
            } else if (layEvent === 'add-to-map-model') { //将模型添加到地图
                layer.confirm('要将模型添加到地图吗？', {
                    title: "添加到地图",
                }, function (index) {
                    //判断是否已经添加过
                    if (modelManagerDic.has(data["zipname"])) {
                        layer.msg("不可重复添加模型");
                        return;
                    }
                    //提示信息
                    layer.msg('加载中，请稍后');
                    setTimeout(function () {
                        //调用添加模型到地图的函数
                        addModelToMap(data["zipname"], data["ModelName"], data["lng"], data["lat"]);
                        layer.msg('请在地图中调整模型');
                    }, 3000)
                    layer.close(index);
                });
            } else if (layEvent === 'upload-to-square') { //将模型上传至共享广场
                layer.confirm('要将模型上传到共享广场吗？', {
                    title: "上传至广场",
                }, function (index) {
                    //待补
                    layer.close(index);
                });
            }
        });

    });
}
/**
 * 初始化地图上Pin的数据源
 * @param {*} data 数据库返回的数据
 */
function initPinDataSource(data) {
    for (let i = 0; i < data.length; i++) {
        let item = JSON.parse(data[i]);
        //将数据添加到数据源中（id作为key，lng和lat作为value）
        pinDataSource.set(item["zipname"], {
            id: item["zipname"],
            lng: item["lng"],
            lat: item["lat"],
            type: item["ModelType"],
        });
    }
}
//初始化侧边栏用户表格
initUserTable();
//发送请求，初始化pinDataSource
$.post(myserver + '/wxcloud-query-total-data', function (res) {
    initPinDataSource(res.data)
});
let isAsideShow = false;
/**
 * 实现侧边栏的显示与隐藏的函数
 * @returns void
 */
function switchAside() {
    var aside = document.getElementById("aside-container");
    var content = document.getElementById("aside-content");
    if (!isAsideShow) {
        aside.classList.add("aside-active");
        isAsideShow = true;
        return;
    }
    aside.classList.remove("aside-active");
    isAsideShow = false;
}
/**
 * 用户登录
 */
function userLogin() {
    layer.open({
        title: "用户登录",
        type: 1,
        shade: 0,
        area: ["350px", "350px"],
        content: $("#user-login"),
        btn: ['登录', '取消'],
        yes: function (index, layero) {
            let username = $("#username").val();
            let password = $("#password").val();
            if (username == "admin" && password == "sa.openworld") {
                layer.msg("登录成功", {
                    time: 1000
                }, function () {
                    layer.close(index);
                    document.getElementById("hint-text-login").style.display = "none";
                    document.getElementById("user-closet").style.display = "block";
                });
                return;
            }
            layer.msg("登陆失败", {
                time: 1000
            });
        },
    });
}
/**
 * 更新微信数据库
 */
function model_info_submit() {
    var data = {};
    data["zipname"] = $("#model-id-show").val();
    data["ModelName"] = $("#model-name-show").val();
    data["ModelInfo"] = $("#model-info-show").val();
    data["ModelType"] = $('#modelType-show input[name="modelType"]:checked').val();
    data["PostName"] = $("#postname-show").val();
    data["city"] = $("#city-show").val();
    data["location"] = $("#location-name-show").val();
    data["poi"] = $("#poi-show").val();
    data["lng"] = $("#lng-show").val();
    data["lat"] = $("#lat-show").val();
    data["time"] = $("#time-show").val();
    $.post(myserver + '/wxcloud_update', data, function (res) {
        console.log(res);
        if (res == 0) {
            layer.msg('更新成功');
            initUserTable();
        } else {
            layer.msg('更新失败');
        }
    });
}

/**
 * 弹窗展示模型信息
 */
function viewModel_info(item) {
    let form = layui.form;
    $("#model-id-show").val(item["zipname"]);
    $("#model-name-show").val(item["ModelName"]);
    $("#model-info-show").val(item["ModelInfo"]);
    $("#modelType-show input[name='modelType'][value=" + item["ModelType"] + "]").attr("checked", true);
    $("#postname-show").val(item["PostName"]);
    $("#city-show").val(item["city"]);
    $("#location-name-show").val(item["location"]);
    $("#poi-show").val(item["poi"]);
    $("#lng-show").val(item["lng"]);
    $("#lat-show").val(item["lat"]);
    $("#time-show").val(item["time"]);
    form.render(); //由于对单选框进行动态赋值，所以这里要重新渲染一下
    layui.use("layer", function () {
        layer.open({
            type: 1,
            fix: false,
            anim: 3,
            title: "模型信息", //弹出层的标题
            content: $('#model-infocard-show'),
            shade: 0, //不显示遮罩
            area: ['400px', '560px'],
            offset: ['80px', '10px'],
            closeBtn: 2,
            btn: ['保存'],
            yes: function (index, layero) {
                //上传更新信息
                model_info_submit()
                //移除cesium左键单击事件与tooltip      
                handler0.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, leftClickCallback);
                mapDiv.removeEventListener('mousemove', showTooltip);
                mapDiv.removeEventListener('mouseout', hideTooltip);
                layer.close(index);
            },
            cancel: function (index, layero) {
                //移除cesium左键单击事件与tooltip
                handler0.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK, leftClickCallback);
                mapDiv.removeEventListener('mousemove', showTooltip);
                mapDiv.removeEventListener('mouseout', hideTooltip);
                layer.close(index);
            }
        })
    });
}