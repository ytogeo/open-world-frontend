(function(global){
// Leaflet draw 汉化扩展插件
var L = global.L
if(!L) return;
var drawLocal =  {
	// format: {
	// 	numeric: {
	// 		delimiters: {
	// 			thousands: ',',
	// 			decimal: '.'
	// 		}
	// 	}
	// },
	draw: {
		toolbar: {
			// #TODO: this should be reorganized where actions are nested in actions
			// ex: actions.undo  or actions.cancel
			actions: {
				title: '取消绘制',
				text: '取消'
			},
			finish: {
				title: '结束绘制',
				text: '结束'
			},
			undo: {
				title: '删除最后一个点',
				text: '删除最后点'
			},
			buttons: {
				polyline: '绘制线',
				polygon: '绘制面',
				rectangle: '绘制矩形',
				circle: '绘制圆',
				marker: '绘制标注',
				circlemarker: '绘制圆点'
			}
		},
		handlers: {
			circle: {
				tooltip: {
					start: '单击并拖动以绘制圆'
				},
				radius: '半径'
			},
			circlemarker: {
				tooltip: {
					start: '单击地图放置圆形标记'
				}
			},
			marker: {
				tooltip: {
					start: '单击地图以放置标记'
				}
			},
			polygon: {
				tooltip: {
					start: '单击以开始绘制形状',
					cont: '单击以继续绘制形状',
					end: '单击第一个点以关闭此形状'
				}
			},
			polyline: {
				error: '<strong>错误:</strong> 性质边界不能交叉',
				tooltip: {
					start: '开始绘制线',
					cont: '单击继续绘制线',
					end: '单击最后点完成线'
				}
			},
			rectangle: {
				tooltip: {
					start: '单击并拖动以绘制矩形'
				}
			},
			simpleshape: {
				tooltip: {
					end: '释放鼠标以完成绘图'
				}
			}
		}
	},
	edit: {
		toolbar: {
			actions: {
				save: {
					title: '保存修改',
					text: '保存'
				},
				cancel: {
					title: '取消编辑，撤销所有修改',
					text: '取消'
				},
				clearAll: {
					title: '清空所有图层',
					text: '清空'
				}
			},
			buttons: {
				edit: '编辑图层',
				editDisabled: '没有图层可编辑',
				remove: '删除图层',
				removeDisabled: '没有图层可删除'
			}
		},
		handlers: {
			edit: {
				tooltip: {
					text: '拖动控制柄或标记以编辑要素',
					subtext: '单击“取消”可撤消更改'
				}
			},
			remove: {
				tooltip: {
					text: '单击移除要素'
				}
			}
		}
	}
};
L.drawLocal = Object.assign(L.drawLocal,drawLocal)
// 替换默认图标

var htmlstr= `<div>
<svg
   class="icon"
   viewBox="0 0 1024 1024"
   version="1.1"
   p-id="2817"
   width="20"
   height="20"
   id="svg6"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <defs
	 id="defs10" />
  <sodipodi:namedview
	 id="namedview8"
	 pagecolor="#ffffff"
	 bordercolor="#666666"
	 borderopacity="1.0"
	 inkscape:pageshadow="2"
	 inkscape:pageopacity="0.0"
	 inkscape:pagecheckerboard="0"
	 showgrid="false"
	 inkscape:zoom="4.155"
	 inkscape:cx="100"
	 inkscape:cy="61.371841"
	 inkscape:window-width="1920"
	 inkscape:window-height="1017"
	 inkscape:window-x="-8"
	 inkscape:window-y="-8"
	 inkscape:window-maximized="1"
	 inkscape:current-layer="svg6" />
  <path
	 d="M513.133312 65.326844c-247.538793 0-448.208115 200.669322-448.208115 448.207092 0 247.538793 200.670346 448.208115 448.208115 448.208115 247.538793 0 448.208115-200.670346 448.208115-448.208115C961.341427 265.995143 760.673128 65.326844 513.133312 65.326844zM513.132288 902.649188c-214.901465 0-389.113205-174.212764-389.113205-389.114229 0-214.902488 174.21174-389.115252 389.113205-389.115252 214.903511 0 389.115252 174.212764 389.115252 389.115252C902.24754 728.436424 728.0358 902.649188 513.132288 902.649188z"
	 fill="#CCCCCC"
	 id="path2"
	 style="fill:#1296db;fill-opacity:1;opacity:0.56270096" />
  <path
	 d="m 514.98169,511.68659 m -270.05131,0 a 270.05131,281.14156 0 1 0 540.10262,0 270.05131,281.14156 0 1 0 -540.10262,0 z"
	 fill="#cccccc"
	 p-id="2819"
	 data-spm-anchor-id="a313x.7781069.0.i0"
	 class="selected"
	 id="path4"
	 style="stroke-width:0.79959;fill:#1296db;fill-opacity:1" />
</svg>
</div>`

if(L.icon){
	var i =new L.DivIcon({
		iconSize: new L.Point(8, 8),
		className:"",
		html:htmlstr
	})

	var touch = new L.DivIcon({
		iconSize: new L.Point(20, 20),
		className:"",
		html:htmlstr
	})

	try{
		L.Draw.Polyline.prototype.options.icon = i
		L.Draw.Polyline.prototype.options.touchIcon = touch
	
		L.Edit.SimpleShape.prototype.options.moveIcon = i
		L.Edit.SimpleShape.prototype.options.resizeIcon = i
		L.Edit.SimpleShape.prototype.options.touchMoveIcon = i
		L.Edit.SimpleShape.prototype.options.touchResizeIcon = i
		
		L.Edit.PolyVerticesEdit.prototype.options.icon = i
		L.Edit.PolyVerticesEdit.prototype.options.touchIcon = touch
	}
	catch(err){
		console.error('err: ', err);
	}


}

})(window)