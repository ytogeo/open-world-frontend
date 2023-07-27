
export default class Popup {
  constructor(option) {
    this.viewer = option.viewer;
    this.Cesium = option.Cesium;
    this.id = option.id;
    this.showMaxHeight = option.showMaxHeight ? option.showMaxHeight : 50000000;
    let Cesium = this.Cesium;
    this.position = Cesium.Cartesian3.fromDegrees(option.position.lon,option.position.lat); //必须有，且是经纬度坐标

    this.offset = option.offset ? option.offset : {x: 0,y: 0};
    //dom节点或者html
    if (typeof option.domEl === 'string') {
      let div = document.createElement('div');
      div.innerHTML = option.domEl;
      this.domEl = div;
    } else {
      this.domEl = option.domEl;
    }
    option.viewer.cesiumWidget.container.appendChild(this.domEl); //将字符串模板生成的内容添加到DOM上
    this.addPostRender();
  }

  //添加场景事件
  addPostRender() {
    this.viewer.scene.postRender.addEventListener(this.postRender, this);
  }

  //场景渲染事件 实时更新窗口的位置 使其与笛卡尔坐标一致
  postRender() {
    let Cesium = this.Cesium;
    if (!this.domEl) {
      return;
    }
    // const canvasHeight = this.viewer.scene.canvas.height;
    const canvasHeight = document.body.clientHeight;
    const windowPosition = new Cesium.Cartesian2();
    Cesium.SceneTransforms.wgs84ToWindowCoordinates(
      this.viewer.scene,
      this.position,
      windowPosition
    );
    let {x,y} = this.offset;
    this.domEl.style.left = (windowPosition.x ) + x + 'px';
    this.domEl.style.bottom =
        ((canvasHeight - windowPosition.y) ) + y + 'px';

    const cameraPosition = this.viewer.camera.position;
    let height = this.viewer.scene.globe.ellipsoid.cartesianToCartographic(cameraPosition).height;
    height += this.viewer.scene.globe.ellipsoid.maximumRadius;
    if ((!(Cesium.Cartesian3.distance(cameraPosition,this.position) > height)) && this.viewer.camera.positionCartographic.height < this.showMaxHeight) {
      this.domEl.style.display = 'block';
    } else {
      this.domEl.style.display = 'none';
    }
  }
  //关闭
  close() {
    if (this.domEl) {
      this.domEl.remove();
    }
    this.viewer.scene.postRender.removeEventListener(this.postRender, this); //移除事件监听
  }
}

window.Popup = Popup;
