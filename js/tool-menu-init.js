/**
 * @file 工具菜单栏相关
 */
let isMenuShow = false;

/**
 * 实现工具菜单栏的显示与隐藏的函数
 * @returns void
 */
function switchMenuDisplay() {
    var menu = document.getElementById("tool-menu");
    var menuIcon = document.getElementById("menu-display-state");
    if (!isMenuShow) {
        //改变高度，实现折叠动画
        menu.classList.add("tool-menu-active");
        //修改图标
        menuIcon.classList.remove("layui-icon-down");
        menuIcon.classList.add("layui-icon-up");
        isMenuShow = true;
        return;
    }
    menu.classList.remove("tool-menu-active");
    menuIcon.classList.add("layui-icon-down");
    menuIcon.classList.remove("layui-icon-up");
    isMenuShow = false;
}

function basicToolSelect(){
    layer.open({
        title: "基础工具箱",
        type: 1,
        shade: 0,
        area:["470px","300px"],
        content: $("#basic-tool-box"),
    })
}
function analysisToolSelect(){
    layer.open({
        title: "空间分析工具箱",
        type: 1,
        shade: 0,
        area:["470px","300px"],
        content: $("#analysis-tool-box"),
    })
}