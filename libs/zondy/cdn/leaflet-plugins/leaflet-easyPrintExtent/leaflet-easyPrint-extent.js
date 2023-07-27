(function(global){
// leaflet-easyPrint 汉化插件
var L = global.L
if(!L) return;
	try{
		L.Control.EasyPrint.prototype.options.defaultSizeTitles.Current = "当前视图"
		L.Control.EasyPrint.prototype.options.defaultSizeTitles.A4Landscape = "A4 横向"
		L.Control.EasyPrint.prototype.options.defaultSizeTitles.A4Portrait = "A4 纵向"
		L.Control.EasyPrint.prototype.options.title = "打印地图"
	}
	catch(err){
		console.error('err: ', err);
	}
}
)(window)