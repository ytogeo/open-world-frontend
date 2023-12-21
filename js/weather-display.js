/**
 * @file 这个文件用于实现天气相关粒子效果的展示
 */

let weatherManager = new Cesium.WeatherEffect(viewer); //新建天气管理器
let weatherSliderList = ["snow-size-slider", "snow-speed-slider"];

/**
 * 打开天气面板
 */
function weatherWinDisplay() {
    layer.open({
        title: "天气效果",
        type: 1,
        shade: 0,
        area: ["500px", "210px"],
        content: $("#weather-display"),
    });
}

/**
 * 降雪天气模拟
 */
let lastValueOfSnowSize = 10;
let lastValueOfSnowSpeed = 100;
function initSnow() {
    let snowSizeSlider = null;
    let snowSpeedSlider = null;
    /**
     * 降雪特效参数调整面板的滑块
     */
    layui.use(function () {
        var slider = layui.slider;
        snowSizeSlider = slider.render({
            value: 10,
            max: 20,
            min: 10,
            step: 1,
            elem: "#snow-size-slider",
            change: function (value) {
                //根据滑块获取雪花大小和速度
                let snowSize = (value / 1000).toFixed(3);
                let snowSpeed = (-lastValueOfSnowSpeed + 200).toFixed(1);
                lastValueOfSnowSize = value;
                myCreateSnow(snowSize, snowSpeed);
            },
        });
        snowSpeedSlider = slider.render({
            value: 100,
            max: 150,
            min: 50,
            step: 10,
            elem: "#snow-speed-slider",
            change: function (value) {
                //根据滑块获取雪花大小和速度
                let snowSize = (lastValueOfSnowSize / 1000).toFixed(3);
                let snowSpeed = (-value + 200).toFixed(1);
                lastValueOfSnowSpeed = value;
                myCreateSnow(snowSize, snowSpeed);
            },
        });
    });
    //打开降雪特效参数调整窗口
    layer.open({
        title: ["降雪效果", "height:30px;font-size:14px;line-height:30px;"],
        type: 1,
        shade: 0,
        offset: ["150px", "15px"],
        area: ["285px", "165px"],
        content: $("#snow-effect-manager"),
        success: function (layero, index) {
            //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
        },
        cancel: function (index, layero) {
            //关闭窗口时，移除下雪效果
            viewer.scene.postProcessStages.removeAll();
            layer.close(index);
        },
    });
    //创建下雪效果
    let snowSize = 0.01;
    let snowSpeed = (100).toFixed(1); //把整数转成带.0的小数，不然WebGL会报错
    myCreateSnow(snowSize, snowSpeed);
}
/**
 * 根据参数自定义下雪场景，使用Cesium的PostProcessStage
 * @param {*} snowSize
 * @param {*} snowSpeed
 */
function myCreateSnow(snowSize, snowSpeed) {
    //移除原有的雪花场景
    if (viewer.scene.postProcessStages._stages.length != 0) {
        viewer.scene.postProcessStages.removeAll();
    }
    //GLSL代码，自定义下雪效果
    let snowEffect =
        "uniform sampler2D colorTexture; varying vec2 v_textureCoordinates; float snow(vec2 uv,float scale) { float time = czm_frameNumber / " +
        snowSpeed +
        "; float w=smoothstep(1.,0.,-uv.y*(scale/10.));if(w<.1)return 0.; uv+=time/scale;uv.y+=time*2./scale;uv.x+=sin(uv.y+time*.5)/scale; uv*=scale;vec2 s=floor(uv),f=fract(uv),p;float k=3.,d; p=.5+.35*sin(11.*fract(sin((s+p+scale)*mat2(7,3,6,5))*5.))-f;d=length(p);k=min(d,k); k=smoothstep(0.,k,sin(f.x+f.y)*" +
        snowSize +
        "); return k*w; } void main(void){ vec2 resolution = czm_viewport.zw; vec2 uv=(gl_FragCoord.xy*2.-resolution.xy)/min(resolution.x,resolution.y); vec3 finalColor=vec3(0); float c = 0.0; c+=snow(uv,30.)*.0; c+=snow(uv,20.)*.0; c+=snow(uv,15.)*.0; c+=snow(uv,10.); c+=snow(uv,8.); c+=snow(uv,6.); c+=snow(uv,5.); finalColor=(vec3(c)); gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(finalColor,1), 0.5); } ";
    //将新的雪花效果添加到场景中
    let newSnowStage = viewer.scene.postProcessStages.add(
        new Cesium.PostProcessStage({
            fragmentShader: snowEffect,
        })
    );
}

/**
 * 降雨天气模拟
 */
let lastValueOfRainSize = 30;
let lastValueOfRainSpeed = 100;
let lastValueOfRainAngle = -3;
function initRain() {
    let rainSizeSlider = null;
    let rainSpeedSlider = null;
    let rainAngleSlider = null;
    /**
     * 降雨特效参数调整面板的滑块
     */
    layui.use(function () {
        var slider = layui.slider;
        rainSizeSlider = slider.render({
            value: 30,
            max: 50,
            min: 10,
            step: 1,
            elem: "#rain-size-slider",
            change: function (value) {
                //根据滑块获取参数
                let rainSize = (value / 100).toFixed(3);
                let rainSpeed = (-lastValueOfRainSpeed + 200).toFixed(1);
                let rainAngle = lastValueOfRainAngle / 10.0;
                lastValueOfRainSize = value;
                myCreateRain(rainSize, rainSpeed, rainAngle);
            },
        });
        rainSpeedSlider = slider.render({
            value: 100,
            max: 150,
            min: 50,
            step: 10,
            elem: "#rain-speed-slider",
            change: function (value) {
                //根据滑块获取参数
                let rainSize = (lastValueOfRainSize / 100).toFixed(3);
                let rainSpeed = (-value + 200).toFixed(1);
                let rainAngle = lastValueOfRainAngle / 10.0;
                lastValueOfRainSpeed = value;
                myCreateRain(rainSize, rainSpeed, rainAngle);
            },
        });
        rainAngleSlider = slider.render({
            value: -3,
            max: 5,
            min: -5,
            step: 1,
            elem: "#rain-angle-slider",
            change: function (value) {
                if (value == 0) {
                    return;
                }
                //根据滑块获取参数
                let rainSize = (lastValueOfRainSize / 100).toFixed(3);
                let rainSpeed = (-lastValueOfRainSpeed + 200).toFixed(1);
                let rainAngle = value / 10.0;
                lastValueOfRainAngle = value;
                myCreateRain(rainSize, rainSpeed, rainAngle);
            },
        });
    });
    //打开降雪特效参数调整窗口
    layer.open({
        title: ["降雨效果", "height:30px;font-size:14px;line-height:30px;"],
        type: 1,
        shade: 0,
        offset: ["150px", "15px"],
        area: ["285px", "205px"],
        content: $("#rain-effect-manager"),
        success: function (layero, index) {
            //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
        },
        cancel: function (index, layero) {
            //关闭窗口时，移除下雨效果
            viewer.scene.postProcessStages.removeAll();
            layer.close(index);
        },
    });
    //创建下雨效果
    let rainSize = 0.3;
    let rainSpeed = (60).toFixed(1);
    let rainAngle = -0.3;
    myCreateRain(rainSize, rainSpeed, rainAngle);
}

/**
 * 自定义下雨效果
 * @param {*} rainSize 雨滴大小
 * @param {*} rainSpeed 降雨速度
 * @param {*} rainAngle 雨滴倾斜角度（风速）
 */
function myCreateRain(rainSize, rainSpeed, rainAngle) {
    //移除原有的降雨场景
    if (viewer.scene.postProcessStages._stages.length != 0) {
        viewer.scene.postProcessStages.removeAll();
    }
    //GLSL代码，自定义下雨效果
    let rainEffect =
        "uniform sampler2D colorTexture;\n\
    varying vec2 v_textureCoordinates;\n\
    float hash(float x) {\n\
        return fract(sin(x * 133.3) * 13.13);\n\
    }\n\
    void main(void) {\n\
        float time = czm_frameNumber / " +
        rainSpeed +
        ";\n\
        vec2 resolution = czm_viewport.zw;\n\
        vec2 uv = (gl_FragCoord.xy * 2. - resolution.xy) / min(resolution.x, resolution.y);\n\
        vec3 c = vec3(.6, .7, .8);\n\
        float a =" +
        rainAngle +
        ";\n\
        float si = sin(a), co = cos(a);\n\
        uv *= mat2(co, -si, si, co);\n\
        uv *= length(uv + vec2(0, 4.9)) * " +
        rainSize +
        " + 1.;\n\
        float v = 1. - sin(hash(floor(uv.x * 100.)) * 2.);\n\
        float b = clamp(abs(sin(20. * time * v + uv.y * (5. / (2. + v)))) - .95, 0., 1.) * 20.;\n\
        c *= v * b;\n\
        gl_FragColor = mix(texture2D(colorTexture, v_textureCoordinates), vec4(c, 1), .5);\n\
    }\n\
    ";
    //将新的降雨效果添加到场景中
    let newRainStage = viewer.scene.postProcessStages.add(
        new Cesium.PostProcessStage({
            fragmentShader: rainEffect,
        })
    );
}

/**
 * 雾天天气模拟
 */
function initFog() {
    let snowSizeSlider = null;
    /**
     * 降雪特效参数调整面板的滑块
     */
    layui.use(function () {
        var slider = layui.slider;
        fogVisibilitySlider = slider.render({
            value: 10,
            max: 20,
            min: 10,
            step: 1,
            elem: "#fog-visibility-slider",
            change: function (value) {
                //根据滑块获取雪花大小和速度
                let fogVisibility = (value / 100).toFixed(2);
                myCreateFog(fogVisibility);
            },
        });
    });
    //打开降雪特效参数调整窗口
    layer.open({
        title: ["雾天效果", "height:30px;font-size:14px;line-height:30px;"],
        type: 1,
        shade: 0,
        offset: ["150px", "15px"],
        area: ["285px", "135px"],
        content: $("#fog-effect-manager"),
        success: function (layero, index) {
            //修改了title样式，但是closeBtn样式没有改变，所以通过获取子结点的方式手动调整×号位置
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
        },
        cancel: function (index, layero) {
            //关闭窗口时，移除起雾效果
            viewer.scene.postProcessStages.removeAll();
            layer.close(index);
        },
    });
    //创建下雪效果
    let fogVisibility = 0.1;
    myCreateFog(fogVisibility);
}
/**
 * 根据参数自定义雾天场景，使用Cesium的PostProcessStage
 * @param {*} snowSize
 */
function myCreateFog(fogVisibility) {
    let fogColor = Cesium.defaultValue(new Cesium.Color(0.8, 0.8, 0.8, 0.3), new Cesium.Color(0.8, 0.8, 0.8, 0.5));
    //移除原有的雾天场景
    if (viewer.scene.postProcessStages._stages.length != 0) {
        viewer.scene.postProcessStages.removeAll();
    }
    //GLSL代码，自定义雾天效果（颜色设置上fogColor要重新构建为vec4(,,,)的形式）
    let fogEffect =
        "uniform sampler2D colorTexture;\n\
    uniform sampler2D depthTexture;\n\
    varying vec2 v_textureCoordinates; \n\
    void main(void) \n\
    { \n\
       vec4 origcolor = texture2D(colorTexture, v_textureCoordinates); \n\
       float depth = czm_readDepth(depthTexture, v_textureCoordinates); \n\
       vec4 depthcolor = texture2D(depthTexture, v_textureCoordinates); \n\
       float f = " +
        fogVisibility +
        " * (depthcolor.r - 0.3) / 0.2; \n\
       if (f < 0.0) f = 0.0; \n\
       else if (f > 1.0) f = 1.0; \n\
       gl_FragColor = mix(origcolor,vec4(" +
        fogColor.red +
        "," +
        fogColor.green +
        "," +
        fogColor.blue +
        "," +
        fogColor.alpha +
        "), f); \n\
    }\n";
    //将新的雾天效果添加到场景中
    let newFogStage = viewer.scene.postProcessStages.add(
        new Cesium.PostProcessStage({
            fragmentShader: fogEffect,
        })
    );
}
