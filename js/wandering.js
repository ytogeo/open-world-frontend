/**
 * @file 该文件用于实现漫游功能
 */

class Car {
    entity = null;
    speed = 0.2;
    position = Cesium.Cartesian3.fromDegrees(114.612846, 30.461900);
    cameraX = 0;
    cameraY = 1;
    //方向
    direction = {
        moveForward: false,
        moveBackward: false,
        moveRight: false,
        moveLeft: false,
    }
    hpr = new Cesium.HeadingPitchRoll(
        Cesium.Math.toRadians(90), //将小车的头部朝向设置为正南方向
        Cesium.Math.toRadians(0),
        Cesium.Math.toRadians(0)
    );
    constructor(model) {
        this.entity = viewer.entities.add(model);
    }
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
            speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, this.speed, new Cesium.Cartesian3());
        } else {
            //向后
            speedVector = Cesium.Cartesian3.multiplyByScalar(Cesium.Cartesian3.UNIT_X, -this.speed, new Cesium.Cartesian3());
        }
        // 根据速度计算出下一个位置的坐标
        let fixedFrameTransforms = Cesium.Transforms.localFrameToFixedFrameGenerator('east', 'north');
        let modelMatrix = Cesium.Transforms.headingPitchRollToFixedFrame(this.position, this.hpr, Cesium.Ellipsoid.WGS84, fixedFrameTransforms);
        //计算结果将赋值到this.position
        Cesium.Matrix4.multiplyByPoint(modelMatrix, speedVector, this.position);
        //设置位置
        this.entity.position = this.position;
        //设置姿态
        this.entity.orientation = Cesium.Transforms.headingPitchRollQuaternion(this.position, this.hpr);
        //摄像机位置调整
        this.cameraTrackingCar();
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
        let transformX = 100; //距离运动点的距离（后方）
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
        viewer.clock.onTick._listeners = [];
        //移除小车
        viewer.entities.remove(this.entity);
        //视角解锁
        viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY)
    }
}


//创建一个小车模型
let carModel = {
    id: 'a model car',
    position: Cesium.Cartesian3.fromDegrees(114.612846, 30.461900),
    orientation: Cesium.Transforms.headingPitchRollQuaternion(
        Cesium.Cartesian3.fromDegrees(114.612846, 30.461900),
        new Cesium.HeadingPitchRoll(
            Cesium.Math.toRadians(90), //将小车的头部朝向设置为正南方向
            Cesium.Math.toRadians(0),
            Cesium.Math.toRadians(0)
        )
    ),
    model: {
        uri: "data/CesiumTruck.glb",
        scale: 1,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND //贴地
    }
}
let car = null;
/**
 * 激活漫游功能
 */
function activeWandering() {
    if (car != null) {
        return;
    }
    layui.use("layer", function () {
        var layer = layui.layer;
        layer.open({
            title: ['沉浸漫游', 'height:30px;font-size:13.5px;line-height:30px;'],
            type: 1,
            shade: 0,
            offset: ['100px', '15px'],
            area: ["350px", "100px"],
            content: $("#wandering"),
            move: false,
            success: function (layero, index) {
                //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
                layero[0].childNodes[2].childNodes[0].style.top = "-8px";
                layero[0].childNodes[2].childNodes[0].style.right = "-5px";
                car = new Car(carModel);
                car.active();
                viewer.flyTo(car.entity);
            },
            cancel: function () {
                inactiveWandering();
            }
        });
    });
}

function inactiveWandering() {
    car.inactive();
    car = null;
    //修改摄像头位置（初始）
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 2000.0),
        orientation: {
            pitch: Cesium.Math.toRadians(-90.0),
            roll: 0
        }
    });
}