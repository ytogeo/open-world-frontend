/**
 * @file 将模型对应的GLTF添加到地图上
 * 注：params参数（对象形式）：存储滑块的值（value），不是直接用于模型变换的参数
 */
let curModelManager = null; //储存当前操作的模型管理器
let sliderList = document.getElementsByClassName("adjust-slide"); //获取所有滑块
let modelManagerDic = new Map(); //模型管理器字典，key是id，value是ModelManager实例
let adjustSelections = ['lng', 'lat', 'height', 'rx', 'ry', 'rz', 'scale']; //params对象的参数名，用于按顺序（下标i）查找对应的成员变量名
/**
 * 模型管理器：储存模型（entity）及其对应的变换参数（滑块值）
 */
class ModelManager {
    model = null;
    //model实际的lng和lat
    modelLng = 0;
    modelLat = 0;
    //滑块获取的调整参数，共七个：XYZ轴平移（3）+XYZ轴旋转（3）+尺度变换（1），同时也是params对象的组成。
    lng = 0;
    lat = 0;
    height = 0;
    rx = 0;
    ry = 0;
    rz = 0;
    scale = 0;
    //是否在调整状态下
    isAdjusted = false;
    /**
     * 构造参数。传入模型的引用以及其真实经纬度
     * @param {*} model 
     * @param {*} lng 
     * @param {*} lat 
     */
    constructor(model, lng, lat) {
        this.model = model;
        this.modelLng = lng;
        this.modelLat = lat;
    }
    //以对象形式返回参数
    getParams() {
        return {
            lng: this.lng,
            lat: this.lat,
            height: this.height,
            rx: this.rx,
            ry: this.ry,
            rz: this.rz,
            scale: this.scale,
        }
    }
    //传入params对象，更新参数
    setParams(params) {
        this.lng = params.lng;
        this.lat = params.lat;
        this.height = params.height;
        this.rx = params.rx;
        this.ry = params.ry;
        this.rz = params.rz;
        this.scale = params.scale;
    }
}

/**
 * 模型管理器的显示（入口）
 */
function modelManagerDisplay() {
    layer.open({
        title: ['模型管理器', 'height:30px;font-size:13px;line-height:30px;'],
        type: 1,
        shade: 0,
        offset: ['100px', '15px'],
        area: ["180px", "250px"],
        content: $("#all-model-manager"),
        success: function (layero, index) {
            //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
        },
    })
    console.log(modelManagerDic)
}
/**
 * 动态渲染模型管理器界面：添加
 * @param {*} id 
 * @param {*} modelname 
 */
function addElementOfModelManager(id, modelname) {
    //获得container父容器
    let modelManagerContainer = document.getElementById('model-list-container');
    //item父容器
    let modelListItem = document.createElement('div');
    modelListItem.setAttribute('class', 'model-list-item');
    //重要: 将item的id设为模型id，方便后续从子元素中获取到该父元素的id，从而从字典中获取到对应的模型管理器
    modelListItem.setAttribute('id', id);
    //item子容器1：复选框
    let modelListItemCheckbox = document.createElement('input');
    modelListItemCheckbox.setAttribute('type', 'checkbox');
    modelListItemCheckbox.setAttribute('name', 'visibility');
    modelListItemCheckbox.setAttribute('title', '显隐性');
    modelListItemCheckbox.setAttribute('onclick', 'checkBoxChangeVisibility(this)');
    modelListItemCheckbox.checked = true;
    //item子容器2：模型名称
    let modelListItemName = document.createElement('label');
    modelListItemName.setAttribute('for', 'modelName');
    modelListItemName.innerHTML = modelname;
    /*item子容器3：模型操作*/
    //模型操作父容器
    let modelListItemOperation = document.createElement('div');
    modelListItemOperation.setAttribute('class', 'model-operations');
    //模型操作子容器1：调整
    let modelListItemAdjust = document.createElement('a');
    modelListItemAdjust.setAttribute('herf', 'javascript:void(0)');
    modelListItemAdjust.setAttribute('style', 'color:#edffff;text-decoration: none;cursor: pointer;');
    modelListItemAdjust.setAttribute('title', '编辑模型位置');
    modelListItemAdjust.setAttribute('onclick', 'editModelAdjustment(this)');
    modelListItemAdjust.innerHTML = '&#x270e;';
    //模型操作子容器2：删除
    let modelListItemDelete = document.createElement('a');
    modelListItemDelete.setAttribute('herf', 'javascript:void(0)');
    modelListItemDelete.setAttribute('style', 'color:#edffff;text-decoration: none;cursor: pointer;');
    modelListItemDelete.setAttribute('title', '删除模型');
    modelListItemDelete.setAttribute('onclick', 'deleteElementOfModelManager(this)');
    modelListItemDelete.innerHTML = '&#xd7;';
    //操作子容器添加到父容器
    modelListItemOperation.appendChild(modelListItemAdjust);
    modelListItemOperation.appendChild(modelListItemDelete);
    //item子容器添加到item父容器
    modelListItem.appendChild(modelListItemCheckbox);
    modelListItem.appendChild(modelListItemName);
    modelListItem.appendChild(modelListItemOperation);
    //item添加到container父容器
    modelManagerContainer.appendChild(modelListItem);
}
/**
 * 动态渲染模型管理器界面：删除
 * @param {*} obj
 */
function deleteElementOfModelManager(obj) {
    let id = obj.parentNode.parentNode.id;
    //从界面中删除模型
    viewer.entities.removeById(id);
    //从字典中删除模型管理器
    modelManagerDic.delete(id);
    //从模型管理器界面删除模型item
    obj.parentNode.parentNode.remove();
    //提示信息
    layer.msg('删除成功');
}
/**
 * 通过监听checkbox实现模型显隐性修改
 * @param {*} obj 
 */
function checkBoxChangeVisibility(obj) {
    //获取模型id
    let id = obj.parentNode.id;
    //从字典中获取id对应的模型
    let model = modelManagerDic.get(id).model;
    //显隐性修改
    model.show = !model.show;
}
/**
 * 根据获得的参数params，调整modelManager实例中对应的模型
 * @param {*} modelManager
 * @param {*} params 
 */
function adjustModel(modelManager, params) {
    let entity = modelManager.model;
    let modelLng = parseFloat(modelManager.modelLng);
    let modelLat = parseFloat(modelManager.modelLat);
    //调整位置：平移
    let newLng = modelLng + params['lng'] * 0.00001;
    let newLat = modelLat + params['lat'] * 0.00001;
    entity.position = Cesium.Cartesian3.fromDegrees(newLng, newLat, 50 + params['height']);
    //调整方向：旋转
    let origin = entity.position.getValue()
    let heading = Cesium.Math.toRadians(params['rz'] * 3.6);
    let pitch = Cesium.Math.toRadians(params['ry'] * 3.6)
    let roll = Cesium.Math.toRadians(params['rx'] * 3.6)
    let hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll)
    let orientation = Cesium.Transforms.headingPitchRollQuaternion(origin, hpr)
    entity.orientation = orientation
    //调整大小：缩放
    entity.model.scale = 10 + params['scale'];
}
/**
 * 从模型管理器中重新编辑（调整）模型位置
 * @param {*} obj 
 */
function editModelAdjustment(obj) {
    let id = obj.parentNode.parentNode.id;
    //根据模型id，从字典中获取对应的模型管理器
    curModelManager = modelManagerDic.get(id);
    //获取当前模型的参数
    let params = curModelManager.getParams();
    //根据参数初始化滑块
    initSliders(params);
    //打开编辑窗口
    layui.use("layer", function () {
        layer.open({
            type: 1,
            fix: false,
            title: "模型调整", //弹出层的标题
            content: $('#adjust-tiles'),
            shade: 0, //不显示遮罩
            area: ['300px', '520px'],
            offset: ['80px', '10px'],
            closeBtn: 2,
            btn: ['保存', '重置'],
            yes: function (index, layero) {
                curModelManager = null;
                layer.msg('调整完成');
                //滑块归零
                initSliders({
                    lng: 0,
                    lat: 0,
                    height: 0,
                    rx: 0,
                    ry: 0,
                    rz: 0,
                    scale: 0
                });
                layer.close(index);
            },
            btn2: function (index, layero) {
                //重置模型状态
                curModelManager.setParams(params);
                adjustModel(curModelManager, curModelManager.getParams())
                //重置滑块状态
                initSliders(curModelManager.getParams());
                return false; //防止弹窗关闭
            },
        })
    });
}
/**
 * 添加新的模型到地图（入口）
 * @param {*} id 传入的模型id
 * @param {*} lng 模型真实经度
 * @param {*} lat 模型真实纬度
 */
function addModelToMap(id, modelname, lng, lat) {
    //初始化滑块
    initSliders({
        lng: 0,
        lat: 0,
        height: 0,
        rx: 0,
        ry: 0,
        rz: 0,
        scale: 0
    });
    layui.use("layer", function () {
        layer.open({
            type: 1,
            fix: false,
            title: "模型调整", //弹出层的标题
            content: $('#adjust-tiles'),
            shade: 0, //不显示遮罩
            area: ['300px', '520px'],
            offset: ['80px', '10px'],
            closeBtn: 2,
            btn: ['保存', '重置'],
            yes: function (index, layero) {
                curModelManager = null;
                layer.msg('调整完成');
                //滑块归零
                initSliders({
                    lng: 0,
                    lat: 0,
                    height: 0,
                    rx: 0,
                    ry: 0,
                    rz: 0,
                    scale: 0
                });
                layer.close(index);
            },
            btn2: function (index, layero) {
                //重置模型状态
                curModelManager.setParams({
                    lng: 0,
                    lat: 0,
                    height: 0,
                    rx: 0,
                    ry: 0,
                    rz: 0,
                    scale: 0
                });
                adjustModel(curModelManager, curModelManager.getParams())
                //重置滑块状态
                initSliders({
                    lng: 0,
                    lat: 0,
                    height: 0,
                    rx: 0,
                    ry: 0,
                    rz: 0,
                    scale: 0
                });
                return false; //防止弹窗关闭
            },
        })
    });
    //调用init模型函数
    initGltfToMap(id, modelname, lng, lat);

}
/**
 * 调整界面的滑块渲染初始化
 * @param {*} params 根据params对象初始化滑块的值
 */
function initSliders(params) {
    layui.use(function () {
        var slider = layui.slider;
        //批量渲染
        for (let i = 0; i < sliderList.length; i++) {
            //第i个滑块对应第i个参数
            slider.render({
                value: params[adjustSelections[i]],
                max: 50,
                min: -50,
                elem: sliderList[i],
                change: function (value) {
                    //对每个滑块都加上监听：第几个滑块的value改变，就改变第几个参数（newParams[i]）
                    let newParams = curModelManager.getParams();
                    newParams[adjustSelections[i]] = value;
                    curModelManager.setParams(newParams);
                    adjustModel(curModelManager, newParams);
                }
            })
        }
    });
}

/**
 * 初始化3dtiles到地图上
 * @param {*} id 
 * @param {*} modelname
 * @param {*} lng 
 * @param {*} lat 
 */
function initGltfToMap(id, modelname, lng, lat) {
    var path = "http://127.0.0.1:8180/GLTF/" + id + "/scene_dense_mesh_refine_texture.gltf";
    var model = viewer.entities.add({
        id: id,
        name: modelname,
        position: Cesium.Cartesian3.fromDegrees(lng, lat, 50),
        model: {
            uri: path,
            scale: 10,
        }
    })
    //初始化每个模型的同时，创建对应的模型管理器，并设为当前操作的管理器
    curModelManager = new ModelManager(model, lng, lat);
    //放入字典（map）储存，id与ModelManager一一对应
    modelManagerDic.set(id, curModelManager);
    //动态渲染模型管理器界面
    addElementOfModelManager(id, modelname);
    //flyTo该模型
    viewer.flyTo(model);
}