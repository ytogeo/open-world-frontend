/**
 * @file 该文件用于实现消防模拟功能
 */
let handlerForFire = null;
let fireTruck = null;
let warnLine = null;
class FireTruck {
    entity = null;
    speed = 0.7;
    position = null;
    cameraX = 0;
    cameraY = 1;
    //方向
    direction = {
        moveForward: false,
        moveBackward: false,
        moveRight: false,
        moveLeft: false,
    }
    hpr = null;
    constructor(model, coor, hpr) {
        this.entity = viewer.entities.add(model);
        this.position = coor;
        this.hpr = hpr;
    }
    waterEffect = new Cesium.ParticleSystem({
        image: '../image/circular_particle.png',
        startColor: new Cesium.Color(0.27, 0.5, 0.7, 0.0),
        endColor: new Cesium.Color(0.27, 0.5, 0.7, 0.90),
        startScale: 1,
        endScale: 1,
        //设定粒子寿命可能持续时间的最小限值(以秒为单位)，在此限值之上将随机选择粒子的实际寿命。
        minimumParticleLife: 1,
        maximumParticleLife: 1,
        minimumSpeed: 40,
        maximumSpeed: 100,
        imageSize: new Cesium.Cartesian2(5, 5),
        // Particles per second.
        emissionRate: 2000,
        lifetime: 50.0,
        //cesium内置的发射器：锥形发射器
        emitter: new Cesium.ConeEmitter(Cesium.Math.toRadians(0.0)),
        updateCallback: applyGravity, //回调：重力效果
    });
    /**
     * 根据按键的keyCode，改变对应方向的状态
     * @param {*} keycode 
     * @param {*} value 
     */
    switchDirectionState(keycode, value) {
        switch (keycode) {
            case 87: //W
                this.direction.moveForward = value;
                break;
            case 83: //S
                this.direction.moveBackward = value;
                break;
            case 65: //A
                this.direction.moveLeft = value;
                break;
            case 68: //D 
                this.direction.moveRight = value;
                break;
            case 13: //回车键，消防车灭火
                //修改一下位置，因为这个坑爹模型……
                var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(this.entity.position.getValue());
                let effectLocation = new Cesium.Cartesian3();
                let newlng = cartographic.longitude - 0.0000005;
                let newlat = cartographic.latitude - 0.0000005;
                effectLocation = Cesium.Cartesian3.fromRadians(newlng, newlat, cartographic.height);
                //设置粒子效果的位置
                this.waterEffect.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(effectLocation);
                //设置粒子效果的方向
                let heading = getHeading(effectLocation, fireLocation);
                let pitch = getPitch(effectLocation, fireLocation);
                this.waterEffect.emitterModelMatrix = computeEmitterModelMatrix(heading * (180 / Math.PI) + 90, pitch * (180 / Math.PI), 0);
                //添加粒子效果
                viewer.scene.primitives.add(this.waterEffect);
                //喷水开始后15秒，灭火结束
                setTimeout(() => {
                    layer.msg("火已扑灭！消防模拟结束。")
                    viewer.scene.primitives.remove(this.waterEffect);
                    viewer.scene.primitives.remove(fireEffect);
                    viewer.entities.remove(warnLine);
                    document.getElementById("fire-simulate-text").innerHTML = "操作提示：消防模拟结束。";
                }, 15000);
            default:
                break;
        }
    }

    /**
     * 在每一帧中监听direction改变，从而更新小车的位置
     */
    listenToDirectionState(direction) {
        let leftOrRight = null;
        if (direction.moveForward) {
            if (direction.moveLeft) {
                //前进左转
                this.hpr.heading -= Cesium.Math.toRadians(2);
            } else if (direction.moveRight) {
                //前进右转
                this.hpr.heading += Cesium.Math.toRadians(2);
            }
            this.moveCarByState('forward');
        } else if (direction.moveBackward) {
            if (direction.moveLeft) {
                //后退左转
                this.hpr.heading -= Cesium.Math.toRadians(2);
            } else if (direction.moveRight) {
                //后退右转
                this.hpr.heading += Cesium.Math.toRadians(2);
            }
            this.moveCarByState('backward');
        }

    }
    moveCarByState(forwardOrBackword) {
        //速度向量
        let speedVector = null;
        if (forwardOrBackword == 'forward') {
            //向前
            speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_Y, this.speed, new Cesium.Cartesian3());
        } else {
            //向后
            speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_Y, -this.speed, new Cesium.Cartesian3());
        }
        // 根据速度计算出下一个位置的坐标
        let fixedFrameTransforms = Cesium.Transforms.localFrameToFixedFrameGenerator('east', 'north');
        let modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(this.position, this.hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms);
        //计算结果将赋值到this.position
        Cesium.Matrix4.multiplyByPoint(modelMatrix, speedVector, this.position);
        //贴地
        this.position = viewer.scene.clampToHeight(this.position, [this.entity]);
        //修改一下高度，因为这个坑爹模型……
        var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(this.position);
        let newHeight = cartographic.height - 1.1;
        this.position = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, newHeight);
        //设置位置
        this.entity.position = this.position;
        //设置姿态
        this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(this.position, this.hpr);
        //摄像机位置调整
        this.cameraTrackingCar();
        //喷水跟随
        var cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(this.entity.position.getValue());
        let effectLocation = new Cesium.Cartesian3();
        let newlng = cartographic.longitude - 0.0000005;
        let newlat = cartographic.latitude - 0.0000005;
        effectLocation = Cesium.Cartesian3.fromRadians(newlng, newlat, cartographic.height);
        //设置粒子效果的位置
        this.waterEffect.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(effectLocation);
        //设置粒子效果的方向
        let heading = getHeading(effectLocation, fireLocation);
        let pitch = getPitch(effectLocation, fireLocation);
        this.waterEffect.emitterModelMatrix = computeEmitterModelMatrix(heading * (180 / Math.PI) + 90, pitch * (180 / Math.PI), 0);
    }
    /**
     * 令摄像机跟踪小车，有参考
     * @param {*} leftOrRight 
     */
    cameraTrackingCar() {
        //视角变换
        function getModelMatrix(entity) {
            //模型位置
            let position = entity.position.getValue();
            //模型姿态
            let orientation = entity.orientation.getValue();
            //计算变换矩阵
            let result = Cesium.Matrix4.fromRotationTranslation(
                Cesium.Matrix3.fromQuaternion(orientation, new Cesium.Matrix3()),
                position,
                new Cesium.Matrix4()
            );
            return result;
        }
        let scratch = getModelMatrix(this.entity);
        // 获取计算绕某轴旋转的3X3变换矩阵
        let rotationM = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(90));
        // 由于这个模型的坐标系有点问题，还需要再次旋转一个90度……
        scratch = Cesium.Matrix4.multiplyByMatrix3(scratch, rotationM, new Cesium.Matrix4());
        let transformX = 80; //距离运动点的距离（后方）
        let transformZ = 30; //距离运动点的高度（上方）
        let transformY = 0; //距离运动点的高度（侧方）
        //设置摄像机位置
        viewer.camera.lookAtTransform(
            scratch, //模型的变换矩阵
            new Cesium.Cartesian3(-transformX, transformY, transformZ)
        );
    }
    active() {
        /**
         * 监听时回调要采用箭头函数，而不能是匿名函数，否则this指向会出错
         * 箭头函数的this是词法作用域，会从外层作用域继承this的值，因此this的指向是正确的。
         */
        //监听键盘：按下WASD按键时，改变direction（将对应方向设为true）
        $(document).keydown((e) => {
            this.switchDirectionState(e.keyCode, true)
        });
        //监听键盘：松开WASD按键时，改变direction（将对应方向设为false）
        $(document).keyup((e) => {
            this.switchDirectionState(e.keyCode, false)
        });
        //设置每一秒都会执行回调函数的内容
        viewer.clock.onTick.addEventListener((clock) => {
            //监听小车运动状态（direction），从而更新小车位置
            this.listenToDirectionState(this.direction);
        });
    }
    inactive() {
        //注销监听
        $(document).off('keydown');
        $(document).off('keyup');
        viewer.clock.onTick._listeners[2] = null;
        //移除小车
        viewer.entities.remove(this.entity);
        //视角解锁
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
        viewer.scene.primitives.remove(this.waterEffect); //移除水粒子
    }
}

function displayFireSimulateWindow() {
    if (car != null) {
        return;
    }
    layui.use("layer", function () {
        var layer = layui.layer;
        layer.open({
            title: ['消防模拟', 'height:30px;font-size:13.5px;line-height:30px;'],
            type: 1,
            shade: 0,
            offset: ['100px', '15px'],
            area: ["350px", "110px"],
            content: $("#fire-simulate"),
            move: false,
            success: function (layero, index) {
                //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
                layero[0].childNodes[2].childNodes[0].style.top = "-8px";
                layero[0].childNodes[2].childNodes[0].style.right = "-5px";
                //展示提示文本
                displayHintTextOfFire();
                handlerForFire = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
                handlerForFire.setInputAction(chooseFireLocation, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            },
            cancel: function () {
                clearFireSimulate();
            }
        });
    });
}

/**
 * 令div跟随鼠标移动，形成tooltip效果：展示缓冲区分析的操作提示文本
 */
function showTooltipForFire(evt) {
    var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop;
    textDiv.style.left = evt.clientX + scrollleft + 10 + "px";
    textDiv.style.top = evt.clientY + scrolltop + 10 + "px";
    textDiv.style.display = "block";
    textDiv.innerHTML = "左键点击，选择火灾发生位置";
}

function hideTooltipForFire(evt) {
    textDiv.style.display = "none";
    textDiv.innerHTML = "提示文本";
}

function displayHintTextOfFire() {
    //鼠标移动到地图上时，显示提示文本
    mapDiv.addEventListener('mousemove', showTooltipForFire);
    //鼠标移出地图时，隐藏提示文本
    mapDiv.addEventListener('mouseout', hideTooltipForFire);
}

function showTooltipForTruck(evt) {
    var scrollleft = document.documentElement.scrollLeft || document.body.scrollLeft;
    var scrolltop = document.documentElement.scrollTop || document.body.scrollTop;
    textDiv.style.left = evt.clientX + scrollleft + 10 + "px";
    textDiv.style.top = evt.clientY + scrolltop + 10 + "px";
    textDiv.style.display = "block";
    textDiv.innerHTML = "左键点击，选择消防车起点位置";
}

function hideTooltipForTruck(evt) {
    textDiv.style.display = "none";
    textDiv.innerHTML = "提示文本";
}

function displayHintTextOfTruck() {
    textDiv.innerHTML = "左键点击，选择消防车起点位置";
    //鼠标移动到地图上时，显示提示文本
    mapDiv.addEventListener('mousemove', showTooltipForTruck);
    //鼠标移出地图时，隐藏提示文本
    mapDiv.addEventListener('mouseout', hideTooltipForTruck);
}
/**
 * 鼠标点击选择火灾发生位置
 * @param {*} e 
 */
let fireLocation = null;

function chooseFireLocation(e) {
    let coor = viewer.scene.pickPosition(e.position);
    fireLocation = coor;
    //修改提示文本
    document.getElementById("fire-simulate-text").innerHTML = "操作提示：左键点击，选择消防车起点位置。";
    displayHintTextOfTruck();
    mapDiv.removeEventListener('mousemove', showTooltipForFire);
    mapDiv.removeEventListener('mouseout', hideTooltipForFire);
    //移除点击事件
    handlerForFire.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    handlerForFire.setInputAction(chooseFireTruckLocation, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //添加火灾效果
    initFireEffect();
}
/**
 * 鼠标点击，选择消防车起点位置
 * @param {*} e 
 */
let fireTruckLocation = null;

function chooseFireTruckLocation(e) {
    let coor = viewer.scene.pickPosition(e.position);
    fireTruckLocation = coor;
    //注销鼠标各项事件
    //调用此函数时若鼠标仍在地图内，textDiv不会消失，则需额外移除提示文本
    textDiv.style.display = "none";
    textDiv.innerHTML = "提示文本";
    //注销提示的toolTip事件
    mapDiv.removeEventListener('mousemove', showTooltipForTruck);
    mapDiv.removeEventListener('mouseout', hideTooltipForTruck);
    //移除点击事件
    handlerForFire.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    initFireTruck();
}
/**
 * 计算p1p2连线的heading角
 * @param {*} p1 
 * @param {*} p2 
 * @returns 
 */
function getHeading(pointA, pointB) {
    //建立以点A为原点，X轴为east,Y轴为north,Z轴朝上的坐标系
    const transform = Cesium.Transforms.eastNorthUpToFixedFrame(pointA);
    //向量AB
    const positionvector = Cesium.Cartesian3.subtract(pointB, pointA, new Cesium.Cartesian3());
    //因此将AB向量转换为A原点坐标系中的向量，需乘以transform的逆矩阵。
    const vector = Cesium.Matrix4.multiplyByPointAsVector(Cesium.Matrix4.inverse(transform, new Cesium.Matrix4()), positionvector, new Cesium.Cartesian3());
    //归一化
    const direction = Cesium.Cartesian3.normalize(vector, new Cesium.Cartesian3());
    //heading
    const heading = Math.atan2(direction.y, direction.x) - Cesium.Math.PI_OVER_TWO;
    return Cesium.Math.TWO_PI - Cesium.Math.zeroToTwoPi(heading);
}

/**
 * 计算起点的切线与水平方向的夹角
 * @param {*} pointA 
 * @param {*} pointB 
 * @returns pitch
 */
function getPitch(pointA, pointB) {
    //将坐标转为经纬度
    let cartographicA = Cesium.Cartographic.fromCartesian(pointA);
    let cartographicB = Cesium.Cartographic.fromCartesian(pointB);
    //计算两点的高差
    let y0 = cartographicB.height - cartographicA.height;
    //水平方向的距离
    let distance = Cesium.Cartesian3.distance(pointA, pointB);
    let x0 = Math.sqrt(distance * distance - y0 * y0);
    let a = Math.atan(2 * y0, x0);
    let pitch = 90 * (Math.PI / 180) - a * (180 / Math.PI);
    return pitch;
}
/**
 * 计算粒子系统发射器的4x4变换矩阵
 * @returns {Cesium.Matrix4} 粒子系统发射器的4x4变换矩阵
 */
function computeEmitterModelMatrix(heading, pitch, roll) {
    let hpr = Cesium.HeadingPitchRoll.fromDegrees(heading, pitch, roll);
    let trs = new Cesium.TranslationRotationScale();
    trs.translation = Cesium.Cartesian3.fromElements(2.5, 4, 1);
    trs.rotation = Cesium.Quaternion.fromHeadingPitchRoll(hpr);
    let result = Cesium.Matrix4.fromTranslationRotationScale(trs);
    return result
}
/**
 * 初始化火灾效果
 */
let fireEffect = null;

function initFireEffect() {
    //添加粒子效果
    fireEffect = new Cesium.ParticleSystem({
        image: '../image/fire.png',
        startColor: Cesium.Color.RED.withAlpha(0.7),
        endColor: Cesium.Color.YELLOW.withAlpha(0.3),
        startScale: 0,
        endScale: 3,
        //设定粒子寿命可能持续时间的最小限值(以秒为单位)，在此限值之上将随机选择粒子的实际寿命。
        minimumParticleLife: 1,
        maximumParticleLife: 6,
        minimumSpeed: 1,
        maximumSpeed: 4,
        imageSize: new Cesium.Cartesian2(55, 55),
        // Particles per second.
        emissionRate: 4,
        lifetime: 160.0,
        //cesium内置的发射器，圆形发射器，因此参数是一个半径值
        emitter: new Cesium.CircleEmitter(5.0),
        //设置火灾位置
        modelMatrix: Cesium.Transforms.eastNorthUpToFixedFrame(fireLocation),
        //在粒子系统局部坐标系中变换粒子系统发射器的4x4变换矩阵。
        emitterModelMatrix: computeEmitterModelMatrix(0, 0, 0)
    })
    viewer.scene.primitives.add(fireEffect);

}
/**
 * 初始化消防车
 */


function initFireTruck() {
    let hpr = new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(180), //将小车的头部朝向设置为正南方向
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(0)
    )
    //创建消防车模型
    let fireTruckModel = {
        id: 'fire truck',
        position: fireTruckLocation,
        orientation: Cesium.Transforms.headingPitchRollQuaternion(
            fireTruckLocation,
            hpr,
        ),
        model: {
            uri: "data/fire_truck.glb",
            scale: 1,
        },
    }
    //创建漫游用的小车
    fireTruck = new FireTruck(fireTruckModel, fireTruckLocation, hpr);
    fireTruck.active();
    viewer.flyTo(fireTruck.entity);
    //添加警戒连线、提示文字等效果
    initFireScene();
}

function applyGravity(p, dt) {
    var gravityScratch = new Cesium.Cartesian3();
    var position = p.position;
    Cesium.Cartesian3.normalize(position, gravityScratch);
    Cesium.Cartesian3.multiplyByScalar(gravityScratch, -25.8 * dt, gravityScratch);
    p.velocity = Cesium.Cartesian3.add(p.velocity, gravityScratch, p.velocity);
}

/**
 * 为火灾模拟添加警戒连线、提示文字等效果
 */
function initFireScene() {
    warnLine = viewer.entities.add({
        polyline: {
            positions: new Cesium.CallbackProperty(() => {
                return [fireLocation, fireTruck.entity.position.getValue()]; //使用CallbackProperty实时更新
            }, false),
            width: 2,
            material: Cesium.Color.RED,
        }
    })
    //计算距离，添加提示文字
    //将坐标转为经纬度
    let cartographicA = Cesium.Cartographic.fromCartesian(fireTruckLocation);
    let cartographicB = Cesium.Cartographic.fromCartesian(fireLocation);
    //计算两点的高差
    let y0 = cartographicB.height - cartographicA.height;
    //水平方向的距离
    let interval = setInterval(() => {
        //更新提示文字
        let distance = Cesium.Cartesian3.distance(fireTruck.entity.position.getValue(), fireLocation);
        let x0 = Math.sqrt(distance * distance - y0 * y0);
        document.getElementById("fire-simulate-text").innerHTML = "操作提示：使用WASD，操作消防车，前往灭火。<br>距离火场还有" + x0.toFixed(2) + "米。";
        if (x0 < 50) {
            layer.msg("已到达火场附近！");
            document.getElementById("fire-simulate-text").innerHTML = "操作提示：按下回车键，开始灭火。";
            clearInterval(interval); //清除定时器
        }
    }, 100)

}
/**
 * 清除消防模拟效果
 */
function clearFireSimulate() {
    //移除相关特效
    viewer.scene.primitives.remove(fireEffect); //火粒子
    viewer.entities.remove(warnLine); //警戒线实体
    fireEffect = null;
    warnLine = null;
    //注销鼠标各项事件
    //调用此函数时若鼠标仍在地图内，textDiv不会消失，则需额外移除提示文本
    textDiv.style.display = "none";
    textDiv.innerHTML = "提示文本";
    //注销提示的toolTip事件
    mapDiv.removeEventListener('mousemove', showTooltipForFire);
    mapDiv.removeEventListener('mouseout', hideTooltipForFire);
    mapDiv.removeEventListener('mousemove', showTooltipForTruck);
    mapDiv.removeEventListener('mouseout', hideTooltipForTruck);
    //移除点击事件
    handlerForFire.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //修改摄像头位置（初始）
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 2000.0),
        orientation: {
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0
        }
    });
    //更新提示文字
    document.getElementById("fire-simulate-text").innerHTML = "操作提示：左键点击场景，选择火灾发生位置。";
    //注销小车
    if (fireTruck == null) {
        return;
    }
    fireTruck.inactive();
    fireTruck = null;
}