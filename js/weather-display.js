/**
 * @file 这个文件用于实现天气相关粒子效果的展示
 */
function weatherWinDisplay(){
    layer.open({
        title: "天气效果",
        type: 1,
        shade: 0,
        area:["500px","210px"],
        content: $("#weather-display"),
    })
}