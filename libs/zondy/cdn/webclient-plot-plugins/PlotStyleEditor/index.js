
/* ========================================================================
 * ZUI: draggable.js
 * http://openzui.com
 * ========================================================================
 * Copyright (c) 2014-2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */

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

/* ========================================================================
 * ZUI: tree.js [1.4.0+]
 * http://openzui.com
 * ========================================================================
 * Copyright (c) 2016 cnezsoft.com; Licensed MIT
 * ======================================================================== */

(function ($) {
  "use strict";

  var name = "zui.tree"; // modal name
  var globalId = 0;

  // The tree modal class
  var Tree = function (element, options) {
    this.name = name;
    this.$ = $(element);

    this.getOptions(options);
    this._init();
  };

  var DETAULT_ACTIONS = {
    sort: {
      template:
        '<a class="sort-handler" href="javascript:;"><i class="icon icon-move"></i></a>',
    },
    add: {
      template: '<a href="javascript:;"><i class="icon icon-plus"></i></a>',
    },
    edit: {
      template: '<a href="javascript:;"><i class="icon icon-pencil"></i></a>',
    },
    delete: {
      template: '<a href="javascript:;"><i class="icon icon-trash"></i></a>',
    },
  };

  function formatActions(actions, parentActions) {
    if (actions === false) return actions;
    if (!actions) return parentActions;

    if (actions === true) {
      actions = { add: true, delete: true, edit: true, sort: true };
    } else if (typeof actions === "string") {
      actions = actions.split(",");
    }
    var _actions;
    if (Array.isArray(actions)) {
      _actions = {};
      $.each(actions, function (idx, action) {
        if ($.isPlainObject(action)) {
          _actions[action.action] = action;
        } else {
          _actions[action] = true;
        }
      });
      actions = _actions;
    }
    if ($.isPlainObject(actions)) {
      _actions = {};
      $.each(actions, function (name, action) {
        if (action) {
          _actions[name] = $.extend(
            { type: name },
            DETAULT_ACTIONS[name],
            $.isPlainObject(action) ? action : null
          );
        } else {
          _actions[name] = false;
        }
      });
      actions = _actions;
    }
    return parentActions ? $.extend(true, {}, parentActions, actions) : actions;
  }

  function createActionEle(action, name, template) {
    name = name || action.type;
    return $(template || action.template)
      .addClass("tree-action")
      .attr(
        $.extend({ "data-type": name, title: action.title || "" }, action.attr)
      )
      .data("action", action);
  }

  // default options
  Tree.DEFAULTS = {
    animate: null,
    initialState: "normal", // 'normal' | 'preserve' | 'expand' | 'collapse', 'active',
    toggleTemplate:
      '<i class="list-toggle fa-regular fa-square-minus icon"></i>',

    // sortable: false, //
  };

  Tree.prototype.add = function (
    rootEle,
    items,
    expand,
    disabledAnimate,
    notStore
  ) {
    var $e = $(rootEle),
      $ul,
      options = this.options;
    if ($e.is("li")) {
      $ul = $e.children("ul");
      if (!$ul.length) {
        $ul = $("<ul/>");
        $e.append($ul);
        this._initList($ul, $e);
      }
    } else {
      $ul = $e;
    }

    if ($ul) {
      var that = this;
      if (!Array.isArray(items)) {
        items = [items];
      }
      $.each(items, function (idx, item) {
        var $li = $("<li/>").data(item).appendTo($ul);
        if (item.id !== undefined) $li.attr("data-id", item.id);
        var $wrapper = options.itemWrapper
          ? $(
              options.itemWrapper === true
                ? '<div class="tree-item-wrapper"/>'
                : options.itemWrapper
            ).appendTo($li)
          : $li;
        if (item.html) {
          $wrapper.html(item.html);
        } else if (typeof that.options.itemCreator === "function") {
          var itemContent = that.options.itemCreator($li, item);
          if (itemContent !== true && itemContent !== false)
            $wrapper.html(itemContent);
        } else if (item.url) {
          $wrapper.append(
            $("<a/>", { href: item.url }).text(item.title || item.name)
          );
        } else {
          $wrapper.append($("<span/>").text(item.title || item.name));
        }
        that._initItem($li, item.idx || idx, $ul, item);
        if (item.children && item.children.length) {
          that.add($li, item.children);
        }
      });
      this._initList($ul);
      if (expand && !$ul.hasClass("tree")) {
        that.expand($ul.parent("li"), disabledAnimate, notStore);
      }
    }
  };

  Tree.prototype.reload = function (data) {
    var that = this;

    if (data) {
      that.$.empty();
      that.add(that.$, data);
    }

    if (that.isPreserve) {
      if (that.store.time) {
        that.$.find("li:not(.tree-action-item)").each(function () {
          var $li = $(this);
          that[that.store[$li.data("id")] ? "expand" : "collapse"](
            $li,
            true,
            true
          );
        });
      }
    }
  };

  Tree.prototype._initList = function ($list, $parentItem, idx, data) {
    var that = this;
    if (!$list.hasClass("tree")) {
      $parentItem = ($parentItem || $list.closest("li")).addClass("has-list");
      if (!$parentItem.find(".list-toggle").length) {
        $parentItem.prepend(this.options.toggleTemplate);
      }
      idx = idx || $parentItem.data("idx");
    } else {
      idx = 0;
      $parentItem = null;
    }
    $list.removeClass("has-active-item");
    var $children = $list
      .attr("data-idx", idx || 0)
      .children("li:not(.tree-action-item)")
      .each(function (index) {
        that._initItem($(this), index + 1, $list);
      });
    if ($children.length === 1 && !$children.find("ul").length) {
      $children.addClass("tree-single-item");
    }
    data = data || ($parentItem ? $parentItem.data() : null);
    var actions = formatActions(data ? data.actions : null, this.actions);
    if (actions) {
      if (actions.add && actions.add.templateInList !== false) {
        var $actionItem = $list.children("li.tree-action-item");
        if (!$actionItem.length) {
          $('<li class="tree-action-item"/>')
            .append(
              createActionEle(actions.add, "add", actions.add.templateInList)
            )
            .appendTo($list);
        } else {
          $actionItem.detach().appendTo($list);
        }
      }
      if (actions.sort) {
        $list.sortable(
          $.extend(
            {
              dragCssClass: "tree-drag-holder",
              trigger: ".sort-handler",
              selector: "li:not(.tree-action-item)",
              finish: function (e) {
                that.callEvent("action", {
                  action: actions.sort,
                  $list: $list,
                  target: e.target,
                  item: data,
                });
              },
            },
            actions.sort.options,
            $.isPlainObject(this.options.sortable)
              ? this.options.sortable
              : null
          )
        );
      }
    }
    if ($parentItem && ($parentItem.hasClass("open") || (data && data.open))) {
      $parentItem.addClass("open in");
    }
  };

  Tree.prototype._initItem = function ($item, idx, $parentList, data) {
    if (idx === undefined) {
      var $pre = $item.prev("li");
      idx = $pre.length ? $pre.data("idx") + 1 : 1;
    }
    $parentList = $parentList || $item.closest("ul");
    $item.attr("data-idx", idx).removeClass("tree-single-item");
    if (!$item.data("id")) {
      var id = idx;
      if (!$parentList.hasClass("tree")) {
        id = $parentList.parent("li").data("id") + "-" + id;
      }
      $item.attr("data-id", id);
    }
    if ($item.hasClass("active")) {
      $parentList.parent("li").addClass("has-active-item");
    }
    data = data || $item.data();
    var actions = formatActions(data.actions, this.actions);
    if (actions) {
      var $actions = $item.find(".tree-actions");
      if (!$actions.length) {
        $actions = $('<div class="tree-actions"/>').appendTo(
          this.options.itemWrapper ? $item.find(".tree-item-wrapper") : $item
        );
        $.each(actions, function (actionName, action) {
          if (action) $actions.append(createActionEle(action, actionName));
        });
      }
    }

    var $children = $item.children("ul");
    if ($children.length) {
      this._initList($children, $item, idx, data);
    }
  };

  Tree.prototype._init = function () {
    var options = this.options,
      that = this;
    this.actions = formatActions(options.actions);

    this.$.addClass("tree");
    if (options.animate) this.$.addClass("tree-animate");

    this._initList(this.$);

    var initialState = options.initialState;
    var isPreserveEnable = $.zui && $.zui.store && $.zui.store.enable;
    if (isPreserveEnable) {
      this.selector =
        name +
        "::" +
        (options.name || "") +
        "#" +
        (this.$.attr("id") || globalId++);
      this.store = $.zui.store[options.name ? "get" : "pageGet"](
        this.selector,
        {}
      );
    }
    if (initialState === "preserve") {
      if (isPreserveEnable) this.isPreserve = true;
      else this.options.initialState = initialState = "normal";
    }

    // init data
    this.reload(options.data);
    if (isPreserveEnable) this.isPreserve = true;

    if (initialState === "expand") {
      this.expand();
    } else if (initialState === "collapse") {
      this.collapse();
    } else if (initialState === "active") {
      this.expandSelect(".active");
    }

    // Bind event
    this.$.on("click", '.list-toggle,a[href="#"],.tree-toggle', function (e) {
      var $this = $(this);
      var $li = $this.parent("li");
      that.callEvent("hit", { target: $li, item: $li.data() });
      that.toggle($li);
      if ($this.is("a")) e.preventDefault();
    }).on("click", ".tree-action", function () {
      var $action = $(this);
      var action = $action.data();
      if (action.action) action = action.action;
      if (action.type === "sort") return;
      var $li = $action.closest("li:not(.tree-action-item)");
      that.callEvent("action", {
        action: action,
        target: this,
        $item: $li,
        item: $li.data(),
      });
    });
  };

  Tree.prototype.preserve = function ($li, id, expand) {
    if (!this.isPreserve) return;
    if ($li) {
      id = id || $li.data("id");
      expand = expand === undefined ? $li.hasClass("open") : false;
      if (expand) this.store[id] = expand;
      else delete this.store[id];
      this.store.time = new Date().getTime();
      $.zui.store[this.options.name ? "set" : "pageSet"](
        this.selector,
        this.store
      );
    } else {
      var that = this;
      this.store = {};
      this.$.find("li").each(function () {
        that.preserve($(this));
      });
    }
  };

  Tree.prototype.expandSelect = function (selector) {
    this.show(selector, true);
  };

  Tree.prototype.expand = function ($li, disabledAnimate, notStore) {
    if ($li) {
      $li.addClass("open");
      if (!disabledAnimate && this.options.animate) {
        setTimeout(function () {
          $li.addClass("in");
        }, 10);
      } else {
        $li.addClass("in");
      }
    } else {
      $li = this.$.find("li.has-list").addClass("open in");
    }
    if (!notStore) this.preserve($li);
    this.callEvent("expand", $li, this);
  };

  Tree.prototype.show = function ($lis, disabledAnimate, notStore) {
    var that = this;
    if (!($lis instanceof $)) {
      $lis = that.$.find("li").filter($lis);
    }
    $lis.each(function () {
      var $li = $(this);
      that.expand($li, disabledAnimate, notStore);
      if ($li) {
        var $ul = $li.parent("ul");
        while ($ul && $ul.length && !$ul.hasClass("tree")) {
          var $parentLi = $ul.parent("li");
          if ($parentLi.length) {
            that.expand($parentLi, disabledAnimate, notStore);
            $ul = $parentLi.parent("ul");
          } else {
            $ul = false;
          }
        }
      }
    });
  };

  Tree.prototype.collapse = function ($li, disabledAnimate, notStore) {
    if ($li) {
      if (!disabledAnimate && this.options.animate) {
        $li.removeClass("in");
        setTimeout(function () {
          $li.removeClass("open");
        }, 300);
      } else {
        $li.removeClass("open in");
      }
    } else {
      $li = this.$.find("li.has-list").removeClass("open in");
    }
    if (!notStore) this.preserve($li);
    this.callEvent("collapse", $li, this);
  };

  Tree.prototype.toggle = function ($li) {
    var collapse =
      ($li && $li.hasClass("open")) ||
      $li === false ||
      ($li === undefined && this.$.find("li.has-list.open").length);
    this[collapse ? "collapse" : "expand"]($li);
  };

  // Get and init options
  Tree.prototype.getOptions = function (options) {
    this.options = $.extend({}, Tree.DEFAULTS, this.$.data(), options);
    if (this.options.animate === null && this.$.hasClass("tree-animate")) {
      this.options.animate = true;
    }
  };

  Tree.prototype.toData = function ($ul, filter) {
    if (typeof $ul === "function") {
      filter = $ul;
      $ul = null;
    }
    $ul = $ul || this.$;
    var that = this;
    return $ul
      .children("li:not(.tree-action-item)")
      .map(function () {
        var $li = $(this);
        var data = $li.data();
        delete data["zui.droppable"];
        var $children = $li.children("ul");
        if ($children.length) data.children = that.toData($children);
        return typeof filter === "function" ? filter(data, $li) : data;
      })
      .get();
  };

  // Call event helper
  Tree.prototype.callEvent = function (name, params) {
    var result;
    if (typeof this.options[name] === "function") {
      result = this.options[name](params, this);
    }
    this.$.trigger($.Event(name + "." + this.name, params));
    return result;
  };

  // Extense jquery element
  $.fn.tree = function (option, params) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data(name);
      var options = typeof option == "object" && option;

      if (!data) $this.data(name, (data = new Tree(this, options)));

      if (typeof option == "string") data[option](params);
    });
  };

  $.fn.tree.Constructor = Tree;

  // Auto call tree after document load complete
  $(function () {
    $('[data-ride="tree"]').tree();
  });
})(jQuery);


(function(global){
// @ts-ignore
const $ = global.jQuery;
// 样式编辑
class StyleEditor {
  constructor(container, styleArr, changeAction) {
    if (container instanceof HTMLElement) {
      this.mainContainer = container;
    } else {
      this.mainContainer = document.getElementById(container) || null;
    }
    this.styleArr = styleArr || null;
    this.changeAction = changeAction;
    // 缓存
    this._colorBarArr = [];
    this.init();
  }

  init() {
    if (!this.mainContainer || !this.styleArr) return;
    //  mian dom
    const { mainContainer } = this;
    this.styleArr.forEach((item) => {
      this.applyTypeDom(mainContainer, item);
    });
  }

  createBoolCheck(parentContainer, styleName, defaultvalue, checkLabels) {
    const textDom = document.createElement("span");
    const checkBox = document.createElement("input");
    checkBox.setAttribute("type", "checkbox");
    defaultvalue && checkBox.setAttribute("checked", "");

    textDom.style.marginLeft = "4px";
    textDom.innerText = defaultvalue ? checkLabels[0] : checkLabels[1];

    parentContainer.appendChild(checkBox);
    parentContainer.appendChild(textDom);

    checkBox.onclick = (e) => {
      this.changeAction(styleName, !!e.target.checked);
      textDom.innerText = e.target.checked ? checkLabels[0] : checkLabels[1];
    };
  }
  createColorBar(parentContainer, styleName, defaultColor, isOpacity = false) {
    const textDom = document.createElement("span");
    const colorBar = document.createElement("div");
    textDom.style.marginLeft = "4px";
    textDom.innerText = defaultColor;
    parentContainer.appendChild(colorBar);
    parentContainer.appendChild(textDom);
    colorBar.setAttribute("class", "color-picker");

    let dfValue = defaultColor;
    if (dfValue === "") {
      dfValue = null;
    }

    const pickr = Pickr.create({
      el: ".color-picker",
      theme: "nano", // or 'monolith', or 'nano'
      default: dfValue === "none" ? "rgba(0,0,0,0)" : dfValue,
      disabled: !dfValue,
      swatches: [
        "rgb(244, 67, 54)",
        "rgb(233, 30, 99)",
        "rgb(156, 39, 176)",
        "rgb(103, 58, 183)",
        "rgb(63, 81, 181)",
        "rgb(33, 150, 243)",
        "rgb(3, 169, 244)",
      ],
      components: {
        // Main components
        preview: true,
        opacity: !!isOpacity,
        hue: true,
        // Input / output Options
        interaction: {
          input: true,
          clear: true,
          save: true,
        },
      },
    });

    this._colorBarArr.push(pickr);

    const saveArr = document.querySelectorAll(".pcr-save");
    if (saveArr) {
      saveArr.forEach((v) => {
        v.setAttribute("value", "保存");
      });
    }

    const clearArr = document.querySelectorAll(".pcr-clear");
    if (clearArr) {
      clearArr.forEach((v) => {
        v.setAttribute("value", "清除");
      });
    }

    pickr.on("save", (color) => {
      if (textDom && color) {
        textDom.innerText = color.toHEXA();
        let e = color;
        if (color === "#00000000" || color === "rgba(0,0,0,0)") {
          e = "none";
        } else {
          e = color.toHEXA().toString();
        }
        this.changeAction(styleName, e);
      }
    });
    parentContainer.addEventListener("click", () => {
      pickr.show();
    });
  }

  createTextGroup(parentContainer, styleName, defaultValue) {
    const textArr = defaultValue.split(",");
    const arr = [];

    textArr.forEach((str, index) => {
      const { domItem, valueDom } = this.createBaseLiItem("文本" + (index + 1));
      parentContainer.appendChild(domItem);

      const input = this._createInput("text");
      input.value = textArr[index];
      valueDom.appendChild(input);
      arr.push(input);

      input.onblur = (e) => {
        // @ts-ignore
        let { value } = e.target;
        e.target.value = value;
        const v = arr.map((t) => t.value);
        this.changeAction(styleName, v.toString());
      };
    });
  }

  _createInput(type) {
    const input = document.createElement("input");
    input.setAttribute("type", type);
    input.setAttribute("class", "input-style");
    return input;
  }
  createTextLabel(parentContainer, defaultValue) {
    const input = this._createInput("text");
    input.setAttribute("readonly", "");
    input.value = defaultValue;
    parentContainer.appendChild(input);
  }
  createLabel(parentContainer, styleName, defaultValue) {
    const input = this._createInput("text");
    input.value = defaultValue;
    parentContainer.appendChild(input);

    input.onblur = (e) => {
      // @ts-ignore
      let { value } = e.target;
      this.changeAction(styleName, value);
      e.target.value = value;
    };
  }
  createIntNumberLabel(parentContainer, styleName, defaultValue, numLimits) {
    const input = this._createInput("number");
    parentContainer.appendChild(input);
    input.value = parseInt(defaultValue);

    input.onblur = (e) => {
      // @ts-ignore
      let { value } = e.target;

      if (value === "") {
        value = 0;
      }

      if (numLimits) {
        if (value >= numLimits[1]) {
          value = numLimits[1];
        } else if (value <= numLimits[0]) {
          value = numLimits[0];
        }
      }

      const t = parseInt(value.toString());
      e.target.value = t;
      this.changeAction(styleName, t);
    };
  }
  createFloatNumberLabel(parentContainer, styleName, defaultValue, numLimits) {
    const input = this._createInput("number");
    input.setAttribute("step", "0.01");
    parentContainer.appendChild(input);
    input.value = parseFloat(defaultValue);

    input.onblur = (e) => {
      // @ts-ignore
      let { value } = e.target;

      if (value === "") {
        value = 0;
      }

      value = Math.round(parseFloat(value.toString()) * 100) / 100;

      if (numLimits) {
        if (value > numLimits[1]) {
          value = numLimits[1];
        } else if (value <= numLimits[0]) {
          value = numLimits[0];
        }
      }

      this.changeAction(styleName, value);
      e.target.value = value;
    };
  }

  createMutiGroup(parentContainer, styleName, defaultValue, mutioptions) {
    const mutiGroup = document.createElement("select");
    const keys = Object.keys(mutioptions);
    let defaultVal;
    if (keys.indexOf(defaultValue) > -1) {
      defaultVal = defaultValue;
    } else {
      defaultVal = mutioptions.default || keys[0];
    }

    keys.forEach((key) => {
      if (key === "default") {
        return;
      }
      const opt = document.createElement("option");
      if (key === defaultVal) {
        opt.setAttribute("selected", "");
      }
      opt.setAttribute("value", key);
      opt.innerText = mutioptions[key];
      mutiGroup.appendChild(opt);
    });

    parentContainer.appendChild(mutiGroup);
    mutiGroup.onchange = (e) => {
      // @ts-ignore
      this.changeAction(styleName, e.target.value);
    };
  }
  createMutiGroupNumber(parentContainer, styleName, defaultValue, mutioptions) {
    const mutiGroup = document.createElement("select");
    const keys = Object.keys(mutioptions);
    let defaultVal;

    if (keys.indexOf(defaultValue.toString()) > -1) {
      defaultVal = defaultValue.toString();
    } else {
      defaultVal = mutioptions.default || keys[0];
    }

    keys.forEach((key) => {
      if (key === "default") {
        return;
      }
      const opt = document.createElement("option");
      if (key === defaultVal) {
        opt.setAttribute("selected", "");
      }
      opt.setAttribute("value", key);
      opt.innerText = mutioptions[key];
      mutiGroup.appendChild(opt);
    });

    parentContainer.appendChild(mutiGroup);
    mutiGroup.onchange = (e) => {
      // @ts-ignore
      this.changeAction(styleName, parseInt(e.target.value));
    };
  }
  createBaseLiItem(label) {
    const domItem = document.createElement("div");
    domItem.setAttribute("class", "base-li-item-style");
    const labelDom = document.createElement("div");
    const valueDom = document.createElement("div");

    labelDom.setAttribute("class", "key-item-style");
    labelDom.innerText = label;
    valueDom.setAttribute("class", "value-item-style");

    domItem.appendChild(labelDom);
    domItem.appendChild(valueDom);
    return { domItem, labelDom, valueDom };
  }
  applyTypeDom(parentContainer, item) {
    const {
      style,
      type,
      value,
      label,
      mutioptions,
      numLimits,
      checkLabels,
      isOpacity,
    } = item;

    if (style === "text") {
      this.createTextGroup(parentContainer, style, value);
      return;
    }
    const { domItem, valueDom } = this.createBaseLiItem(label);

    parentContainer.appendChild(domItem);

    switch (type) {
      case "color": {
        this.createColorBar(valueDom, style, value, isOpacity);

        break;
      }
      case "int-input": {
        this.createIntNumberLabel(valueDom, style, value, numLimits);
        break;
      }
      case "float-input": {
        this.createFloatNumberLabel(valueDom, style, value, numLimits);
        break;
      }
      case "label": {
        this.createLabel(valueDom, style, value);
        break;
      }
      case "textlabel": {
        this.createTextLabel(valueDom, value);
        break;
      }
      case "muliselect": {
        this.createMutiGroup(valueDom, style, value, mutioptions);
        break;
      }
      case "muliselectnumber": {
        this.createMutiGroupNumber(valueDom, style, value, mutioptions);
        break;
      }
      case "bool-check": {
        this.createBoolCheck(valueDom, style, value, checkLabels);
        break;
      }
      case "textgroup": {
        break;
      }
      default: {
        throw new Error("类型错误！");
      }
    }
  }

  destroyed() {
    this._colorBarArr.forEach((s) => {
      s && s.destroyAndRemove();
    });
    this._colorBarArr = null;
    if (this.mainContainer) {
      let firstChild = this.mainContainer.firstChild;
      while (firstChild) {
        firstChild.parentElement.removeChild(firstChild);
        firstChild = this.mainContainer.firstChild;
      }
    }
  }
}
// svgdom组
class SvgDomGroup {
  // svg dom
  constructor(parentDom, svgDom, keysArr, options) {
    const {
      svgBoxStyle,
      currentIndex,
      keyChangeAction,
      itemWidth,
      itemHeight,
    } = options;
    this.svgElementsDiv = document.createElement("div");
    this.currentItemIndex = currentIndex || 0;

    this.keysArr = keysArr;
    this.keyChangeAction = keyChangeAction;
    this.svgDom = svgDom || null;
    this.width = itemWidth || 28;
    this.height = itemHeight || 28;
    parentDom.appendChild(this.svgElementsDiv);

    this.svgElementsDiv.setAttribute("class", "svg-dom-container");
    this.svgElementsDiv.style = { ...svgBoxStyle };

    if (keysArr.length > 0) {
      keysArr.forEach((key, index) => {
        const itemDiv = document.createElement("div");
        itemDiv.setAttribute(
          "class",
          `svg-dom-item ${
            index === this.currentItemIndex ? "svg-dom-item-active" : ""
          }`
        );

        if (this.svgDom) {
          const cloneDom = this.getSvgDomByKey(
            this.svgDom,
            key,
            this.width,
            this.height
          );

          itemDiv.appendChild(cloneDom);
        }

        itemDiv.setAttribute("key", key);
        itemDiv.style.width = `${this.width}px`;
        itemDiv.style.height = `${this.height}px`;

        this.svgElementsDiv.appendChild(itemDiv);
        // 绑定事件
        itemDiv.onclick = () => {
          this.clickAction(key);
        };
      });
    }
  }

  clickAction(key) {
    if (key && this.keysArr.indexOf(key) > -1) {
      this.currentIndex = this.keysArr.indexOf(key);
      this.changeActiveDom(key, this.svgElementsDiv);
      this.keyChangeAction(this.currentIndex);
    }
  }

  changeActiveDom(key, svgElementDiv) {
    svgElementDiv.childNodes.forEach((s) => {
      if (s.nodeType === 1) {
        const classString = s.getAttribute("class");
        const keyString = s.getAttribute("key");
        if (new RegExp(/svg-dom-item-active/).test(classString)) {
          const t = classString.replace("svg-dom-item-active", "");
          s.setAttribute("class", t);
        }
        if (key === keyString) {
          s.setAttribute(
            "class",
            s.getAttribute("class") + " svg-dom-item-active"
          );
        }
      }
    });
  }

  _isHasIdDom(dom, keyArr) {
    if (keyArr.indexOf(dom.getAttribute("id")) > -1) {
      return true;
    } else if (
      dom.children &&
      dom.children.length !== 0 &&
      Array.from(dom.children).some((t) => this._isHasIdDom(t, keyArr))
    ) {
      return true;
    }
    return false;
  }

  getSvgDomByKey(svgDom, key, width, height) {
    const cloneDom = svgDom.cloneNode(true);
    const keyArr = key.split(",");

    const partArr = [];
    const joinArr = [];
    this._applySvgDomArray(cloneDom, partArr);

    if (keyArr.indexOf("irregular") <= -1) {
      const deleteArr = partArr.filter((s) => {
        if (this._isHasIdDom(s, keyArr)) {
          joinArr.push(s);
          return false;
        }
        return true;
      });

      deleteArr.forEach((t) => {
        t.parentElement.removeChild(t);
      });
    }

    const cloneDomWidth = parseInt(cloneDom.getAttribute("width"), 10);
    const cloneDomHeight = parseInt(cloneDom.getAttribute("height"), 10);

    cloneDom.setAttribute("width", width);
    cloneDom.setAttribute("height", height);

    joinArr.forEach((s) => {
      s.style.transformOrigin = "left top";
      s.style.transform = `scale(${width / cloneDomWidth},${
        height / cloneDomHeight
      })`;
    });

    return cloneDom;
  }

  _applySvgDomArray(dom, partArr) {
    dom.childNodes.forEach((item) => {
      if (item.nodeName === "g") {
        this._applySvgDomArray(item, partArr);
      } else if (item.nodeType === 1) {
        partArr.push(item);
      }
    });
  }

  _applyElementStyle(dom, styleObj) {
    if (!dom || !styleObj) return;
    const keys = Object.keys(styleObj);
    keys.forEach((s) => {
      dom.stylep[s] = styleObj[s];
    });
  }

  destroyed() {
    if (this.svgElementsDiv) {
      let firstChild = this.svgElementsDiv.firstChild;
      while (firstChild) {
        firstChild.parentElement.removeChild(firstChild);
        firstChild = this.svgElementsDiv.firstChild;
      }
    }
  }
}

// 事件处理器
class Observable {
  constructor() {}

  /**
   * 发送事件
   * @param { String } eventName 事件名称
   * @param { Object } options   事件参数
   * @returns Observable this对象
   */
  fire(eventName, options) {
    if (!this._eventListeners) {
      return this;
    }

    var listenersForEvent = this._eventListeners[eventName];
    if (!listenersForEvent) {
      return this;
    }

    for (let i = 0, len = listenersForEvent.length; i < len; i += 1) {
      listenersForEvent[i] && listenersForEvent[i].call(this, options || {});
    }

    this._eventListeners[eventName] = listenersForEvent.filter(function (
      value
    ) {
      return value !== false;
    });

    return this;
  }

  /**
   * 添加监听事件
   * @param {String} eventName 事件名称
   * @param {Function} handler 事件处理函数
   * @returns {Observable} this对象
   */
  on(eventName, handler) {
    if (!this._eventListeners) {
      this._eventListeners = {};
    }

    if (arguments.length === 1) {
      for (let prop in eventName) {
        this.on(prop, eventName[prop]);
      }
    } else {
      if (!this._eventListeners[eventName]) {
        this._eventListeners[eventName] = [];
      }
      this._eventListeners[eventName].push(handler);
    }

    return this;
  }

  /**
   * 添加事件监听,只触发一次
   * @param {String} eventName 事件名称
   * @param {Function} handler 事件处理函数
   * @returns {Observable} this对象
   */
  once(eventName, handler) {
    const _handler = function () {
      handler.apply(this, arguments);
      this.off(eventName, _handler);
    }.bind(this);

    this.on(eventName, _handler);

    return this;
  }

  /**
   * 移除事件监听
   * @param {String} eventName 事件名称
   * @param {Function} handler 事件处理函数
   * @returns {Observable} this对象
   */
  off(eventName, handler) {
    if (!this._eventListeners) {
      return this;
    }

    if (arguments.length === 0) {
      for (eventName in this._eventListeners) {
        this._removeEventListener(eventName);
      }
    } else if (arguments.length === 1 && typeof arguments[0] === "object") {
      for (var prop in eventName) {
        this._removeEventListener(prop, eventName[prop]);
      }
    } else {
      this._removeEventListener(eventName, handler);
    }
    return this;
  }

  _removeEventListener(eventName, handler) {
    if (!this._eventListeners[eventName]) {
      return;
    }
    var eventListener = this._eventListeners[eventName];
    if (handler) {
      eventListener[eventListener.indexOf(handler)] = false;
    } else {
      let k = eventListener.length;
      while (k--) {
        eventListener[k] = false;
      }
    }
  }
}

// 属性控件控制
const styleAttributes = {
  strokeStyle: {
    label: "笔画颜色",
    type: "color",
    groupId: 1,
    isOpacity: true,
  },
  strokeOpacity: {
    label: "笔画透明度",
    groupId: 1,
    type: "float-input",
    numLimits: [0, 1],
  },
  lineWidth: {
    label: "笔画线宽",
    type: "int-input",
    groupId: 1,
    numLimits: [0, 10000],
  },
  strokeDashArray: {
    label: "笔画样式",
    type: "muliselect",
    groupId: 1,
    mutioptions: {
      none: "直线",
      "10 10": "长虚线",
      "27 10 8 5": "线段曲线",
      default: "none",
    },
  },
  fillStyleType: {
    label: "填充类型",
    type: "muliselectnumber",
    groupId: 2,
    mutioptions: {
      0: "无填充",
      1: "实填充"
    },
  },
  fillStyle: {
    label: "填充颜色",
    type: "color",
    groupId: 2,
    isOpacity: true,
  },
  fillOpacity: {
    label: "填充透明度",
    groupId: 2,
    type: "float-input",
    numLimits: [0, 1],
  },
  text: {
    label: "文字",
    type: "textgroup",
    groupId: 3,
  },
  textColor: {
    label: "文本颜色",
    type: "color",
    groupId: 3,
    isOpacity: true,
  },
  symbolId: {
    label: "符号ID",
    type: "textlabel",
    groupId: 0,
  },
  symbolName: {
    label: "符号名称",
    type: "textlabel",
    groupId: 0,
  },
  show: {
    label: "显示",
    type: "bool-check",
    groupId: 4,
    checkLabels: ["是", "否"],
  },
  dimModHeight: {
    label: "模型高度",
    type: "int-input",
    groupId: 5,
    numLimits: [-Infinity, Infinity],
  },
  dimModAttitude: {
    label: "模型姿态",
    type: "muliselectnumber",
    groupId: 5,
    mutioptions: {
      0: "平躺",
      1: "直立",
    },
  },
  isOpenWall: {
    label: "开启墙",
    type: "bool-check",
    groupId: 6,
    checkLabels: ["是", "否"],
  },
  isWallGradColor: {
    label: "墙渐变",
    type: "bool-check",
    groupId: 6,
    checkLabels: ["是", "否"],
  },
  wallColor: {
    label: "墙颜色",
    type: "color",
    groupId: 6,
    isOpacity: true,
  },
  wallGradColor: {
    label: "墙渐变颜色",
    type: "color",
    groupId: 6,
    isOpacity: true,
  },
  classificationType: {
    label: "贴地模式",
    type: "muliselectnumber",
    groupId: 5,
    mutioptions: {
      0: "贴地",
      1: "地形贴地",
      2: "模型贴地",
      3: "不贴地",
    },
  },
  axis2_Y: {
    label: "轴线-Y",
    groupId: 4,
    type: "float-input",
    numLimits: [0, 1],
  },
  compareLine: {
    label: "衬线选项",
    type: "muliselectnumber",
    groupId: 7,
    mutioptions: {
      0: "无衬线",
      1: "内衬线",
      2: "外衬线",
      3: "双侧衬线",
    },
  },
  compareLineColor: {
    label: "衬线颜色",
    type: "color",
    groupId: 7,
    isOpacity: true,
  },
  compareLineWidth: {
    label: "衬线宽",
    type: "int-input",
    groupId: 7,
    numLimits: [0, 10000],
  },
};

const groupArr = [
  {
    id: 1,
    label: "笔画样式",
    key: "strokeStyle",
  },
  {
    id: 2,
    label: "填充样式",
    key: "fillStyle",
  },
  {
    id: 3,
    label: "扩展样式",
    key: null,
  },
];

const baseGroupArr = [
  {
    id: 0,
    label: "符号信息",
  },
  {
    id: 4,
    label: "基本属性",
  },
  {
    id: 5,
    label: "三维属性",
  },
  {
    id: 6,
    label: "墙体",
  },
  {
    id: 7,
    label: "衬线",
    key: null,
  },
];

class PlotStyleEditor extends Observable {
  constructor(container, baseAttrStyles, attrStyles, options) {
    super();
    this.options = options || {};
    this._svgDom = this.options.svgDom || document.createElement("svg");
    this.actionModArr = [];
    // eslint-disable-next-line no-console
    if (container instanceof HTMLElement) {
      this.container = container;
    } else if (document.getElementById(container)) {
      this.container = document.getElementById(container);
    } else {
      this.container = null;
    }
    if (!this.container) return;
    this._initParentContainer();

    if (baseAttrStyles && attrStyles) {
      this.init(baseAttrStyles, attrStyles);
    }
  }

  _initParentContainer() {
    this.container.style.display = "inline";
    const styleEditorContainer = document.createElement("div");
    const header = document.createElement("div");
    const body = document.createElement("div");

    styleEditorContainer.setAttribute("id", "mod-editor-box-style");
    styleEditorContainer.setAttribute("class", "panel");
    styleEditorContainer.style.border = "none";

    header.setAttribute("class", "panel-heading");
    body.setAttribute("class", "panel-body");

    const closeButton = document.createElement("span");
    const title = document.createElement("span");

    title.setAttribute("class", "modal-title fas fa-edit");
    title.innerText = " 属性编辑";

    closeButton.style.cursor = "pointer";
    closeButton.setAttribute("aria-hidden", "true");
    closeButton.setAttribute("class", "fa-regular fa-rectangle-xmark");

    closeButton.onclick = this.closeBox.bind(this);

    header.appendChild(title);
    header.appendChild(closeButton);

    styleEditorContainer.appendChild(header);
    styleEditorContainer.appendChild(body);

    this.container.appendChild(styleEditorContainer);

    this.panelContainer = styleEditorContainer;
    this.contentContainer = body;

    this.keyChangeAction = this.keyChangeAction.bind(this);
    this.changeAction = this.changeAction.bind(this);
    this.changeActionBase = this.changeActionBase.bind(this);
    this.currentIndex = 0;

    $("#mod-editor-box-style").draggable({
      container: `#${this.container.getAttribute("id")}`,
      handle: ".panel-heading",
    });
  }

  setAttrs(baseAttrStyles, attrStyles, options) {
    const container = this.container;
    if (!container) return;

    if (!this.contentContainer || !this.panelContainer) {
      this._initParentContainer();
    }
    this.init(baseAttrStyles, attrStyles, options);
  }

  init(baseAttrStyles, attrStyles, options) {
    const body = this.contentContainer;
    const opt = options || {};
    if (!body) return;
    this.svgDom = opt.svgDom || this.svgDom;
    // 清空内容层dom
    this.clearContent();
    this.attrKeys = Object.keys(attrStyles) || [];
    this.baseAttrStyles = baseAttrStyles || {};
    this.attrStyles = attrStyles || {};

    // tree节点
    const treeDom = this.createTreeDom();
    body.appendChild(treeDom);

    this.baseAttrStyles &&
      this.createList(
        baseGroupArr,
        treeDom,
        this.baseAttrStyles,
        this.changeActionBase
      );

    const groupDiv = this.createGroupLi("切换部件");
    treeDom.appendChild(groupDiv);
    const childsDiv = document.createElement("ul");
    groupDiv.appendChild(childsDiv);

    // eslint-disable-next-line no-new

    const svgListMod = new SvgDomGroup(childsDiv, this.svgDom, this.attrKeys, {
      keyChangeAction: this.keyChangeAction,
      currentIndex: this.currentIndex,
    });
    this.actionModArr.push(svgListMod);
    const attrObj = this.attrStyles[this.attrKeys[this.currentIndex]];

    attrObj && this.createList(groupArr, treeDom, attrObj, this.changeAction);

    $("#mod-tree-node-style").tree({
      initialState: "expand",
    });
  }

  createList(arr, treeDom, attrObj, action) {
    debugger
    const obj = JSON.parse(JSON.stringify(attrObj))
    if(obj.text){
      obj.textColor =  obj.fillStyle
      obj.fillStyle=null
      obj.strokeStyle= null
    }
    const _groupArr = arr.map((item) => ({
      ...item,
      styleArr: [],
    }));
    const keys = Object.keys(styleAttributes);
    const _attrArr = keys.map((val) => {
      const i = obj[val];

      if (typeof i !== "undefined") {
        return { style: val, value: i };
      }
      return false;
    });
    _attrArr.forEach((item) => {
      // @ts-ignore
      const sty = styleAttributes[item.style];
      if (!sty) return;
      const index = _groupArr.findIndex((s) => s.id === sty.groupId);
      if (index > -1) {
        _groupArr[index].styleArr.push(this._createStyleItem(item, sty));
      }
    });
    _groupArr.forEach((item) => {
      if (item.styleArr.length > 0) {
        // 验证是否满足样式key
        if (item.key && !this.options.isMoreItem) {
          const i = item.styleArr.findIndex((s) => s.style === item.key);
          if (i > -1) {
            const v = item.styleArr[i].value;
            if (typeof v === "undefined" || !v) {
              return;
            }
          }
        }
        this.createGroupItem(item, treeDom, action);
      }
    });
  }

  createTreeDom() {
    const treeDom = document.createElement("ul");
    treeDom.setAttribute("id", "mod-tree-node-style");
    treeDom.setAttribute("class", "tree");
    treeDom.setAttribute("data-animate", "true");
    treeDom.setAttribute("data-ride", "tree");
    return treeDom;
  }

  createGroupLi(label) {
    const groupDiv = document.createElement("li");
    const legend = document.createElement("a");
    groupDiv.setAttribute("class", "group-li-style");
    legend.innerText = label;
    groupDiv.appendChild(legend);
    return groupDiv;
  }
  createGroupItem(item, ulDom, action) {
    const groupDiv = this.createGroupLi(item.label);
    const childsDiv = document.createElement("ul");
    groupDiv.appendChild(childsDiv);

    ulDom.appendChild(groupDiv);

    // eslint-disable-next-line no-new
    const temp = new StyleEditor(childsDiv, item.styleArr, (type, value) => {
      // eslint-disable-next-line no-debugger
      action(type, value, this.attrKeys[this.currentIndex]);
    });
    this.actionModArr.push(temp);
  }

  _createStyleItem(styleName, styleObj) {
    return {
      ...styleName,
      ...styleObj,
    };
  }

  _setAttributes(type, value, currentStyles) {
    currentStyles[type] = value;
  }

  keyChangeAction(index) {
    this.currentIndex = index;
    this.init(this.baseAttrStyles, this.attrStyles);
  }

  clearContent() {
    if (!this.contentContainer) return;
    const contentContainer = this.contentContainer;
    if (contentContainer) {
      let { firstChild } = contentContainer;
      while (firstChild) {
        firstChild.parentElement.removeChild(firstChild);
        firstChild = contentContainer.firstChild;
      }
    }
  }
  clearPanel() {
    if (this.container && this.panelContainer) {
      this.container.removeChild(this.panelContainer);
    }
  }

  clearContainer() {
    this.actionModArr.forEach((s) => {
      s.destroyed();
    });

    this.clearContent();
    this.clearPanel();
    this.actionModArr = [];
    this.panelContainer = null;
    this.contentContainer = null;
  }

  closeBox() {
    if (this.container && this.panelContainer) {
      this.destroyed();
      this.fire("panel-close");
    }
  }
  changeActionBase(type, value) {
    this._setAttributes(type, value, this.baseAttrStyles);
    this.fire("attributes-change", {
      type,
      value,
    });
  }
  changeAction(type, value, key) {
    let currentType= type
    if(type === "textColor"){
      this._setAttributes(currentType, value, this.attrStyles[key]);
      currentType = 'fillStyle'
    }
    this._setAttributes(currentType, value, this.attrStyles[key]);
    this.fire("attributes-change", {
      type:currentType,
      value,
      key,
    });
  }

  destroyed() {
    this.clearContainer();
    // 去除外层dom
    this.container.style.display = "none";
  }
}
if (!window.webclientPlot) {
  window.webclientPlot = {};
}
window.webclientPlot["PlotStyleEditor"] = PlotStyleEditor;
})(window)

