/**
 * @file 天际线分析
 * 实现思路：利用Cesium的边缘检测和后期处理效果的叠加。即在地图上检测此视角下的地形边缘，叠加标价效果层，叠加针对边缘实例和前一个边缘效果层的标记进行颜色处理和纹理处理。
 */
let skylineStage = null;

function displaySkylineWindow() {
    layer.open({
        title: ['天际线分析', 'height:30px;font-size:14px;line-height:30px;'],
        type: 1,
        shade: 0,
        area: ["280px", "120px"],
        offset: ['100px', '15px'],
        content: $("#skyline-analysis"),
        success: function (layero, index) {
            layero[0].childNodes[2].childNodes[0].style.top = "-8px";
            layero[0].childNodes[2].childNodes[0].style.right = "-5px";
        },
        cancel: function () {
            stopSkyline();
        }
    })
}

/**
 * 开启天际线
 */
function initSkyline() {
    var edgeDetection = Cesium.PostProcessStageLibrary.createEdgeDetectionStage();
    let edgeEffect = 'uniform sampler2D colorTexture;' +
        'uniform sampler2D depthTexture;' +
        'varying vec2 v_textureCoordinates;' +
        'void main(void)' +
        '{' +
        'float depth = czm_readDepth(depthTexture, v_textureCoordinates);' +
        'vec4 color = texture2D(colorTexture, v_textureCoordinates);' +
        'if(depth<1.0 - 0.000001){' +
        'gl_FragColor = color;' +
        '}' +
        'else{' +
        'gl_FragColor = vec4(1.0,0.0,0.0,1.0);' +
        '}' +
        '}';
    let skylineEffect = 'uniform sampler2D colorTexture;' +
        'uniform sampler2D redTexture;' +
        'uniform sampler2D silhouetteTexture;' +

        'varying vec2 v_textureCoordinates;' +

        'void main(void)' +
        '{' +
        'vec4 redcolor=texture2D(redTexture, v_textureCoordinates);' +
        'vec4 silhouetteColor = texture2D(silhouetteTexture, v_textureCoordinates);' +
        'vec4 color = texture2D(colorTexture, v_textureCoordinates);' +
        'if(redcolor.r == 1.0){' +
        'gl_FragColor = mix(color, vec4(1.0,0.0,0.0,1.0), silhouetteColor.a);' +
        '}' +
        'else{' +
        'gl_FragColor = color;' +
        '}' +
        '}';

    var postProccessStage = new Cesium.PostProcessStage({
        name: 'czm_skylinetemp',
        fragmentShader: edgeEffect,
    });

    var postProccessStage1 = new Cesium.PostProcessStage({
        name: 'czm_skylinetemp1',
        fragmentShader: skylineEffect,
        uniforms: {
            redTexture: postProccessStage.name,
            silhouetteTexture: edgeDetection.name
        }
    });

    skylineStage = viewer.scene.postProcessStages.add(new Cesium.PostProcessStageComposite({
        stages: [edgeDetection, postProccessStage, postProccessStage1],
        inputPreviousStageTexture: false,
        uniforms: edgeDetection.uniforms
    }));
}
/**
 * 移除天际线
 */
function stopSkyline() {
    viewer.scene.postProcessStages.remove(skylineStage);
}