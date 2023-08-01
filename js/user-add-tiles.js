/**
 * @file 这个文件用于让用户自行上传3DTiles并加入到场景（用户自行添加的3DTiles仅作暂时展示，不保存在后端）
 */

let curTilePath = null;
let tilesManagerDic = new Map(); //3dtiles管理器字典，key是id，value是3dtiles的primitive实例
// 上传3DTiles绑定到元素
layui.use('upload', function () {
    var $ = layui.jquery,
        upload = layui.upload;
    //多图片上传
    upload.render({
        elem: '#add-tiles-data',
        url: myserver + '/upload-tiles',
        accept: 'file',
        multiple: true,
        //上传多文件，（因为设置了选择即上传）只执行一次choose，如果是done的话会执行多次；所以用choose取代done
        choose: function (obj) {
            $.post(myserver + '/create-tiles-folder', function (res) {
                //上传完毕
                layer.msg("上传成功！")
                addTilesToMap(res);
            });
        },
    });
});

function addTilesToMap(res) {
    curTilePath = "http://127.0.0.1:8180/TILES/" + res + "/tileset.json";
    var tileset = viewer.scene.primitives.add(
        new Cesium.Cesium3DTileset({
            url: curTilePath,
        })
    );
    //将3dtiles加入到管理器中
    tilesManagerDic.set(res, tileset);
    //动态渲染管理器界面
    addElementOfTilesManager(res, "model" + (tilesManagerDic.size));
    //调整3dtiles 配合depthTestAgainstTerrain = true 使之贴地
    var heightOffset = 16;
    tileset.readyPromise.then(function (tileset) {
        // Position tileset
        var boundingSphere = tileset.boundingSphere;
        var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
        var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
        var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
        var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
        tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
    });
    //Tiles加载完毕后，调用接口清除后台暂存的Tiles
    tileset.initialTilesLoaded.addEventListener(() => {
        $.post(myserver + '/remove-tiles-folder');
    })
}
/**
 *  3Dtiles管理器的显示（入口）
 */
function tilesManagerDisplay() {
    layer.open({
        title: ['3DTiles管理器', 'height:30px;font-size:13px;line-height:30px;'],
        type: 1,
        shade: 0,
        offset: ['100px', '15px'],
        area: ["190px", "250px"],
        content: $("#temp-3dtiles-manager"),
        success: function (layero, index) {
            //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
        },
    });
}
/**
 * 动态渲染模型管理器界面：添加
 * @param {*} id 
 * @param {*} modelname 
 */
function addElementOfTilesManager(id, modelname) {
    //获得container父容器
    let modelManagerContainer = document.getElementById('tiles-list-container');
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
    modelListItemCheckbox.setAttribute('onclick', 'checkBoxChangeTilesVisibility(this)');
    modelListItemCheckbox.checked = true;
    //item子容器2：模型名称
    let modelListItemName = document.createElement('label');
    modelListItemName.setAttribute('for', 'modelName');
    modelListItemName.innerHTML = modelname;
    /*
     * item子容器3：模型操作
     */
    //模型操作父容器
    let modelListItemOperation = document.createElement('div');
    modelListItemOperation.setAttribute('class', 'model-operations');
    //模型操作子容器1：删除
    let modelListItemDelete = document.createElement('a');
    modelListItemDelete.setAttribute('herf', 'javascript:void(0)');
    modelListItemDelete.setAttribute('style', 'color:#edffff;text-decoration: none;cursor: pointer;');
    modelListItemDelete.setAttribute('title', '删除模型');
    modelListItemDelete.setAttribute('onclick', 'deleteElementOfTilesManager(this)');
    modelListItemDelete.innerHTML = '&#xd7;';
    //操作子容器添加到父容器
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
function deleteElementOfTilesManager(obj) {
    console.log(tilesManagerDic)
    let id = obj.parentNode.parentNode.id;
    //从界面中删除模型
    viewer.scene.primitives.remove(tilesManagerDic.get(id));
    //从字典中删除模型管理器
    modelManagerDic.delete(id);
    //从模型管理器界面删除模型item
    obj.parentNode.parentNode.remove();
    layer.msg("删除成功");
}

/**
 * 
 * @param {*} obj 
 */
function checkBoxChangeTilesVisibility(obj) {
    //获取模型id
    let id = obj.parentNode.id;
    tilesManagerDic.get(id).show = obj.checked;
}