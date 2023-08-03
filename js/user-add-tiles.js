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
 * 动态渲染3DTiles管理器界面：添加
 * @param {*} id 
 * @param {*} tilesname 
 */
function addElementOfTilesManager(id, tilesname) {
    //获得container父容器
    let tilesManagerContainer = document.getElementById('tiles-list-container');
    //item父容器
    let tilesListItem = document.createElement('div');
    tilesListItem.setAttribute('class', 'model-list-item');
    //重要: 将item的id设为模型id，方便后续从子元素中获取到该父元素的id，从而从字典中获取到对应的模型管理器
    tilesListItem.setAttribute('id', id);
    //item子容器1：复选框
    let tilesListItemCheckbox = document.createElement('input');
    tilesListItemCheckbox.setAttribute('type', 'checkbox');
    tilesListItemCheckbox.setAttribute('name', 'visibility');
    tilesListItemCheckbox.setAttribute('title', '显隐性');
    tilesListItemCheckbox.setAttribute('onclick', 'checkBoxChangeTilesVisibility(this)');
    tilesListItemCheckbox.checked = true;
    //item子容器2：模型名称
    let tilesListItemName = document.createElement('label');
    tilesListItemName.setAttribute('for', 'modelName');
    tilesListItemName.innerHTML = tilesname;
    /*
     * item子容器3：模型操作
     */
    //模型操作父容器
    let tilesListItemOperation = document.createElement('div');
    tilesListItemOperation.setAttribute('class', 'model-operations');
    //模型操作子容器1：删除
    let tilesListItemDelete = document.createElement('a');
    tilesListItemDelete.setAttribute('herf', 'javascript:void(0)');
    tilesListItemDelete.setAttribute('style', 'color:#edffff;text-decoration: none;cursor: pointer;');
    tilesListItemDelete.setAttribute('title', '删除模型');
    tilesListItemDelete.setAttribute('onclick', 'deleteElementOfTilesManager(this)');
    tilesListItemDelete.innerHTML = '&#xd7;';
    //操作子容器添加到父容器
    tilesListItemOperation.appendChild(tilesListItemDelete);
    //item子容器添加到item父容器
    tilesListItem.appendChild(tilesListItemCheckbox);
    tilesListItem.appendChild(tilesListItemName);
    tilesListItem.appendChild(tilesListItemOperation);
    //item添加到container父容器
    tilesManagerContainer.appendChild(tilesListItem);
}
/**
 * 动态渲染3DTiles管理器界面：删除
 * @param {*} obj
 */
function deleteElementOfTilesManager(obj) {
    let id = obj.parentNode.parentNode.id;
    //从界面中删除3DTiles
    viewer.scene.primitives.remove(tilesManagerDic.get(id));
    //从字典中删除3DTiles管理器
    tilesManagerDic.delete(id);
    //从3DTiles管理器界面删除3DTilesitem
    obj.parentNode.parentNode.remove();
    layer.msg("删除成功");
}

/**
 * 
 * @param {*} obj 
 */
function checkBoxChangeTilesVisibility(obj) {
    //获取3DTilesid
    let id = obj.parentNode.id;
    tilesManagerDic.get(id).show = obj.checked;
}