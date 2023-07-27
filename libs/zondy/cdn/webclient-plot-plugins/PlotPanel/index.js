(function (global) {
  (function ($, document) {
    "use strict";

    var NAME = "zui.draggable",
      DEFAULTS = {
        // selector: '',
        container: "body",
        move: true,
        // mouseButton: -1 // 0, 1, 2, -1, all, left,  right, middle
      };

    var MOUSE_BUTTON_CODES = {
      all: -1,
      left: 0,
      middle: 1,
      right: 2,
    };

    var idIncrementer = 0;

    var Draggable = function (element, options) {
      var that = this;
      that.$ = $(element);
      that.id = idIncrementer++;
      that.options = $.extend({}, DEFAULTS, that.$.data(), options);
      that.init();
    };

    Draggable.DEFAULTS = DEFAULTS;
    Draggable.NAME = NAME;

    Draggable.prototype.init = function () {
      var that = this,
        $root = that.$,
        BEFORE = "before",
        DRAG = "drag",
        FINISH = "finish",
        eventSuffix = "." + NAME + "." + that.id,
        mouseDownEvent = "mousedown" + eventSuffix,
        mouseUpEvent = "mouseup" + eventSuffix,
        mouseMoveEvent = "mousemove" + eventSuffix,
        setting = that.options,
        selector = setting.selector,
        handle = setting.handle,
        $ele = $root,
        isMoveFunc = typeof setting.move === "function",
        startPos,
        cPos,
        startOffset,
        mousePos,
        moved;

      var mouseMove = function (event) {
        var mX = event.pageX,
          mY = event.pageY;
        moved = true;
        var dragPos = {
          left: mX - startOffset.x,
          top: mY - startOffset.y,
        };

        $ele.removeClass("drag-ready").addClass("dragging");
        if (setting.move) {
          if (isMoveFunc) {
            setting.move(dragPos, $ele);
          } else {
            $ele.css(dragPos);
          }
        }

        setting[DRAG] &&
          setting[DRAG]({
            event: event,
            element: $ele,
            startOffset: startOffset,
            pos: dragPos,
            offset: {
              x: mX - startPos.x,
              y: mY - startPos.y,
            },
            smallOffset: {
              x: mX - mousePos.x,
              y: mY - mousePos.y,
            },
          });
        mousePos.x = mX;
        mousePos.y = mY;

        if (setting.stopPropagation) {
          event.stopPropagation();
        }
      };

      var mouseUp = function (event) {
        $(document).off(eventSuffix);
        if (!moved) {
          $ele.removeClass("drag-ready");
          return;
        }
        var endPos = {
          left: event.pageX - startOffset.x,
          top: event.pageY - startOffset.y,
        };
        $ele.removeClass("drag-ready dragging");
        if (setting.move) {
          if (isMoveFunc) {
            setting.move(endPos, $ele);
          } else {
            $ele.css(endPos);
          }
        }

        setting[FINISH] &&
          setting[FINISH]({
            event: event,
            element: $ele,
            startOffset: startOffset,
            pos: endPos,
            offset: {
              x: event.pageX - startPos.x,
              y: event.pageY - startPos.y,
            },
            smallOffset: {
              x: event.pageX - mousePos.x,
              y: event.pageY - mousePos.y,
            },
          });
        event.preventDefault();
        if (setting.stopPropagation) {
          event.stopPropagation();
        }
      };

      function getMouseButtonCode(mouseButton) {
        if (typeof mouseButton !== "number") {
          mouseButton = MOUSE_BUTTON_CODES[mouseButton];
        }
        if (mouseButton === undefined || mouseButton === null) mouseButton = -1;
        return mouseButton;
      }

      var mouseDown = function (event) {
        var mouseButton = getMouseButtonCode(setting.mouseButton);
        if (mouseButton > -1 && event.button !== mouseButton) {
          return;
        }

        var $mouseDownEle = $(this);
        if (selector) {
          $ele = handle ? $mouseDownEle.closest(selector) : $mouseDownEle;
        }

        if (setting[BEFORE]) {
          var isSure = setting[BEFORE]({
            event: event,
            element: $ele,
          });
          if (isSure === false) return;
        }

        var $container = $(setting.container),
          pos = $ele.offset();
        cPos = $container.offset();
        startPos = {
          x: event.pageX,
          y: event.pageY,
        };
        startOffset = {
          x: event.pageX - pos.left + cPos.left,
          y: event.pageY - pos.top + cPos.top,
        };
        mousePos = $.extend({}, startPos);
        moved = false;

        $ele.addClass("drag-ready");
        event.preventDefault();

        if (setting.stopPropagation) {
          event.stopPropagation();
        }

        $(document).on(mouseMoveEvent, mouseMove).on(mouseUpEvent, mouseUp);
      };

      if (handle) {
        $root.on(mouseDownEvent, handle, mouseDown);
      } else if (selector) {
        $root.on(mouseDownEvent, selector, mouseDown);
      } else {
        $root.on(mouseDownEvent, mouseDown);
      }
    };

    Draggable.prototype.destroy = function () {
      var eventSuffix = "." + NAME + "." + this.id;
      this.$.off(eventSuffix);
      $(document).off(eventSuffix);
      this.$.data(NAME, null);
    };

    $.fn.draggable = function (option) {
      return this.each(function () {
        var $this = $(this);
        var data = $this.data(NAME);
        var options = typeof option == "object" && option;

        if (!data) $this.data(NAME, (data = new Draggable(this, options)));
        if (typeof option == "string") data[option]();
      });
    };

    $.fn.draggable.Constructor = Draggable;
  })(jQuery, document);

  class PlotPanel {
    constructor(container, options) {
      this.options = options || {};
      if (container instanceof HTMLElement) {
        this.container = container;
      } else if (document.getElementById(container)) {
        this.container = document.getElementById(container);
      } else {
        this.container = null;
      }

      if (!this.container) return;
      this._initParentContainer();
    }

    getBody(){
        if(this.contentContainer) return this.contentContainer;
    }
    clearBody(){
        if(!this.contentContainer) return;
        const contentContainer = this.contentContainer;
        if (contentContainer) {
          let { firstChild } = contentContainer;
          while (firstChild) {
            firstChild.parentElement.removeChild(firstChild);
            firstChild = contentContainer.firstChild;
          }
        }  
    }

    _initParentContainer() {
      this.container.style.display = "inline";
      const styleEditorContainer = document.createElement("div");
      const header = document.createElement("div");
      const body = document.createElement("div");

      styleEditorContainer.setAttribute("class", "plot-panel-container panel ");
      styleEditorContainer.style.border = "none";

      header.setAttribute("class", "panel-heading");
      body.setAttribute("class", "panel-body");

      const {titleText="面板",titleIconClass="fas fa-edit",panelWidth=320} = this.options
      styleEditorContainer.style.width=panelWidth+'px'
      
      const title = document.createElement("span");
      title.setAttribute("class", titleIconClass);
      title.innerText = " "+titleText;

      header.appendChild(title);

      styleEditorContainer.appendChild(header);
      styleEditorContainer.appendChild(body);

      this.container.appendChild(styleEditorContainer);

      this.panelContainer = styleEditorContainer;
      this.contentContainer = body;

      $(".plot-panel-container").draggable({
        container: `#${this.container.getAttribute("id")}`,
        handle: ".panel-heading",
      });
    }
  }
  if (!global.webclientPlot) {
    global.webclientPlot = {};
  }
  global.webclientPlot["PlotPanel"] = PlotPanel;
})(window);
