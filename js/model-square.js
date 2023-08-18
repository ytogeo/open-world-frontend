/**
 * @file 该文件用于实现共享广场功能
 */
let userCart = new Array(); //用户购物车，存储了用户选择的模型id
var table = layui.table;
/**
 * 以下两个函数实现了地图界面与共享广场界面的切换
 */
function displayMap() {
    //界面显隐性
    let modelSquare = document.getElementById("square");
    modelSquare.style.display = "none";
    let map = document.getElementById("map");
    map.style.display = "block";
    //header
    let mapLi = document.getElementById("mapLi");
    mapLi.classList.add("nav_active");
    let squareLi = document.getElementById("squareLi");
    squareLi.classList.remove("nav_active");
    //还原工具菜单可用性
    isMenuShow = false;
}

function displayModelSquare() {
    //界面显隐性
    let modelSquare = document.getElementById("square");
    modelSquare.style.display = "block";
    let map = document.getElementById("map");
    map.style.display = "none";
    //header
    let mapLi = document.getElementById("mapLi");
    mapLi.classList.remove("nav_active");
    let squareLi = document.getElementById("squareLi");
    squareLi.classList.add("nav_active");
    initModelSquare()
    //禁止打开工具菜单
    isMenuShow = true;
}


/**
 * 【我要上传】按钮
 */
function goToUpdate() {
    //强制打开侧边栏
    if (!isAsideShow) {
        switchAside();
    }
    layer.msg("请在右侧展柜中选择您的模型上传");
}


/**
 * 初始化数据广场表格
 */
function initModelSquare() {
    layui.use('table', function () {
        var table = layui.table;
        table.render({
            id: 'db-table-square-all',
            elem: '#db-table-square-all',
            height: '600px',
            url: myserver + '/wxcloud-query-for-modelSquare',
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
                        field: 'ModelInfo',
                        title: '模型描述',
                    },
                    {
                        field: 'ModelType',
                        title: '模型类别',
                        width: 110,
                    },
                    {
                        field: 'PostName',
                        title: '提交人',
                        width: 110,
                    },
                    {
                        field: 'city',
                        title: '市名',
                        width: 90,
                    },
                    {
                        field: 'location',
                        title: '位置名称',
                        width: 170
                    },
                    {
                        field: 'poi',
                        title: '详细地址',
                        width: 170
                    },
                    {
                        field: 'lng',
                        title: '经度',
                        width: 100
                    },
                    {
                        field: 'lat',
                        title: '纬度',
                        width: 100
                    },
                    {
                        title: '操作',
                        width: 170,
                        align: 'center',
                        fixed: 'right',
                        toolbar: '#square-tool-bar',
                    }
                ]
            ],
            page: {
                limit: 15,
                limits: [15, 20, 50, 100]
            },
            done: function (res, curr, count) {
                model_data = res.data;
                
            }
        });


    });
}
/**
 * 根据userCart初始化购物车内容
 */
function initCartContent() {
    layui.use('table', function () {
        var table = layui.table;
        table.render({
            id: 'db-table-square-cart',
            elem: '#db-table-square-cart',
            height: '340px',
            data: userCart,
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
                        checkbox: true,
                        fixed: true
                    },
                    {
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
                        field: 'city',
                        title: '市名',
                        width: 80
                    },
                    {
                        field: 'location',
                        title: '位置名称',
                        width: 100
                    },
                    {
                        title: '操作',
                        width: 120,
                        align: 'center',
                        fixed: 'right',
                        toolbar: '#cart-tool-bar',
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
    });

    table.on("tool(db-table-square-cart)", function (obj) {
        var data = obj.data; //获得当前行数据
        var layEvent = obj.event; //获得 lay-event 对应的值（也可以是表头的 event 参数对应的值）
        var tr = obj.tr; //获得当前行 tr 的 DOM 对象（如果有的话）
        if (layEvent === "cart-delete") {
            //删除指定元素
            userCart.map((item, index) => {
                if (item.zipname == data.zipname) {
                    userCart.splice(index, 1);
                }
            })
            //重载表格
            table.reloadData('db-table-square-cart', {
                data: userCart,
            });
            layer.msg("删除成功")
        }
    });
}
/**
 * 弹窗：我的购物车
 */
function displayMyCart() {
    layer.open({
        title: "我的购物车",
        type: 1,
        shade: 0,
        area: ['50%', '60%'],
        content: $("#my-cart"),
        btn: ['存入我的展柜', '清空购物车'],
        btn1: function (index, layero, that) {
            //存入我的展柜
            var checkStatus = table.checkStatus('db-table-square-cart');
            //将选中的数据存入我的展柜
            addDataFromCart(checkStatus.data);
        },
        btn2: function (index, layero, that) {
            //清空购物车
            userCart = new Array();
            //使用空的数组重新加载数据（清空表格）
            table.reloadData('db-table-square-cart', {
                data: userCart,
            });
            layer.msg("已清空")
            return false;
        },
        success: function (layero, index) {
            initCartContent();
        },
        cancel: function (index, layero) {
            $("#my-cart").hide(); //配合my-cart的css里的display:none，才能彻底隐藏
        }
    })
}

/**
 * 将购物车中选中的数据存入我的展柜
 * @param {Array} data 选中的数据
 */
function addDataFromCart(data) {
    //遍历数组
    for (let i of data) {
        //将数据存入我的展柜（用户数据库）
        $.post(myserver + '/wxcloud_add', i, function (res) {
            if (res != 0) {
                layer.msg('操作失败，请检查网络');
                return;
            }
        });
        //将对应的模型存入用户数据库（static/GLTF)
        var data = {
            id: i.zipname,
        }
        $.post(myserver + '/move-model-sq2ur', data, function (res) {
            if (res != 0) {
                layer.msg('操作失败，请检查网络');
                return;
            }
        });
        //将数据从购物车中删除
        userCart.map((item, index) => {
            if (item.zipname == i.zipname) {
                userCart.splice(index, 1);
            }
        })
    }
    var table = layui.table;
    table.reloadData('db-table-square-cart', {
        data: userCart,
    });
    layer.msg("已将所选数据放入展柜！")
}
/**
 * 弹窗：上传管理
 */
function displayMyUpdate() {
    layer.open({
        title: "上传管理",
        type: 1,
        shade: 0,
        area: ['50%', '52.5%'],
        content: $("#my-upload"),
        success: function (layero, index) {
            initMyUploadContent();
        },
        cancel: function (index, layero) {
            $("#my-upload").hide(); //配合my-cart的css里的display:none，才能彻底隐藏
        }
    })
}
/**
 * 根据myUpload初始化上传管理内容
 */
function initMyUploadContent() {
    layui.use('table', function () {
        var table = layui.table;
        table.render({
            id: 'db-table-square-upload',
            elem: '#db-table-square-upload',
            height: '340px',
            url: myserver + '/wxcloud-query-for-userUpload',
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
                        field: 'city',
                        title: '市名',
                        width: 80
                    },
                    {
                        field: 'location',
                        title: '位置名称',
                        width: 100
                    },
                    {
                        title: '操作',
                        width: 120,
                        align: 'center',
                        fixed: 'right',
                        toolbar: '#my-upload-tool-bar',
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
    });

    table.on("tool(db-table-square-upload)", function (obj) {
        var data = obj.data; //获得当前行数据
        var layEvent = obj.event; //获得 lay-event 对应的值（也可以是表头的 event 参数对应的值）
        var tr = obj.tr; //获得当前行 tr 的 DOM 对象（如果有的话）
        if (layEvent === "upload-delete") {
            layer.confirm('确定从广场中撤下这个模型吗？', function (index) {
                $.post(myserver + '/wxcloud-delete-from-userUpload', {
                    zipname: data["zipname"]
                }, function (res) {
                    if (res == 0) {
                        layer.msg('已成功撤下');
                        table.reloadData('db-table-square-upload', {
                            url: myserver + '/wxcloud-query-for-userUpload',
                        });
                        table.reloadData('db-table-square-all', {
                            url: myserver + '/wxcloud-query-for-modelSquare',
                        });
                        layer.close(index);
                    } else {
                        layer.msg('操作失败，请检查网络');
                    }
                });
            });
        }
    });
}