(function (global) {
  const $ = global.$ || global.jquery;

  const iconBoxWidth = 220;
  const iconsize = 42;

  $.sidebarMenu = function (menu) {
    var animationSpeed = 300;

    $(menu).on("click", "li a", function (e) {
      var $this = $(this);
      var checkElement = $this.next();
      var child_i;
      if (checkElement.is(".treeview-menu") && checkElement.is(":visible")) {
        checkElement.slideUp(animationSpeed, function () {
          checkElement.removeClass("menu-open");
        });
        checkElement.parent("li").removeClass("active");
        child_i = findTitleElement(checkElement.parent("li"));
        child_i.removeClass("fa-folder-open");
        child_i.addClass("fa-folder");
      } else if (
        checkElement.is(".treeview-menu") &&
        !checkElement.is(":visible")
      ) {
        //Get the parent menu
        var parent = $this.parents("ul").first();
        //Close all open menus within the parent
        var ul = parent.find("ul:visible").slideUp(animationSpeed);
        //Remove the menu-open class from the parent
        ul.removeClass("menu-open");
        //Get the parent li
        var parent_li = $this.parent("li");
        child_i = findTitleElement(parent_li);
        //Open the target menu and add the menu-open class
        checkElement.slideDown(animationSpeed, function () {
          //Add the class active to the parent li
          checkElement.addClass("menu-open");
          parent
            .find("li.active")
            .find("i")
            .first()
            .removeClass("fa-folder-open")
            .addClass("fa-folder");
          parent.find("li.active").removeClass("active");
          parent_li.addClass("active");
          // 同级目录只显示一个
          child_i.removeClass("fa-folder");
          child_i.addClass("fa-folder-open");
        });
      }
      //if this isn't a link, prevent the page from being redirected
      if (checkElement.is(".treeview-menu")) {
        e.preventDefault();
      }
    });
  };

  function findTitleElement(li) {
    return li.find("a").first().find("i").first();
  }

  class PlotMenu {
    constructor(symbolManager, drawFunc, options) {
      this.symbolManager = symbolManager;
      this.drawFunc = drawFunc || function(){};
      this.options = options || {};

      const iconBar = this.initSymbolNode(symbolManager._symbols);
      document.getElementById("side").appendChild(iconBar);
      $.sidebarMenu($(".sidebar-menu"));
    }
    initSymbolNode(symbolNode) {
      if (!symbolNode) return null;
      const ul = document.createElement("ul");
      const head = document.createElement("li");
      const group = document.createElement("div");
      const icon1 = document.createElement("i");
      const icon2 = document.createElement("i");
      const icon3 = document.createElement("i");
      const titleIcon = this.options.plotMenuTitleIcon || "fa-list-ul";
      head.setAttribute("class", "header");
      icon1.setAttribute("class", ` fas ${titleIcon}`);
      icon1.innerText = " " + symbolNode.name;
      // icon2.setAttribute("class", `fa-solid fa-upload `);
      // icon3.setAttribute("class", `fa-solid fa-download`);
      //  head title
      head.appendChild(icon1);
      // group
      // group.appendChild(icon2);
      // icon2.style.marginRight = "10px";
      // icon2.style.cursor = "pointer";
      // icon2.setAttribute("title", "导入");
      // icon3.setAttribute("title", "导出");
      // icon3.style.cursor = "pointer";
      // // group.appendChild(icon3);
      group.style.display = "flex";
      head.appendChild(group);

      // ul
      ul.appendChild(head);
      ul.setAttribute("class", "sidebar-menu");
      this.applyStyleAttribute(ul, this.options.plotMenuTitleStyle);

      this.initSymbolChildNodes(symbolNode, ul, 1);
      return ul;
    }

    // eslint-disable-next-line class-methods-use-this
    // eslint-disable-next-line consistent-return
    initSymbolChildNodes(symbolNode, element, floor) {
      if (symbolNode.children && symbolNode.children.length > 0) {
        symbolNode.children
          .filter((s) => s.children)
          .forEach((item) => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            const i1 = document.createElement("i");
            const i2 = document.createElement("i");
            const span = document.createElement("span");
            const ulTree = document.createElement("ul");
            li.setAttribute("class", "treeview");
            a.href = "#";

            const viewIcon = this.switchViewIcon(floor) || "fa-map-marker";
            i1.setAttribute("class", `fa ${viewIcon}`);

            span.innerText = item.name;
            span.style.marginLeft = "5px";
            i2.setAttribute("class", "fa fa-angle-left pull-right");
            ulTree.setAttribute("class", "treeview-menu");
            a.appendChild(i1);
            a.appendChild(span);
            a.appendChild(i2);
            li.appendChild(a);
            li.appendChild(ulTree);

            element.appendChild(li);
            li.onclick = () => {
              if (ulTree.children.length === 0) {
                this.lazyLoadSvg(ulTree, item.children, this.symbolManager);
              }
            };
            this.initSymbolChildNodes(item, ulTree, floor + 1);
          });
      }
    }

    lazyLoadSvg(parentElement, childrens, symbolManager) {
      const divItemBox = document.createElement("div");
      const divItemContent = document.createElement("div");
      const divItemUl = document.createElement("div");
      const padding = this.getItemBoxPaddingWidth();
      divItemBox.setAttribute("class", "itemBox");
      divItemContent.setAttribute("class", "itemBox-content");
      divItemUl.setAttribute("class", "itemBox-ul");
      divItemUl.style.padding = `0 ${padding}px`;
      divItemUl.style.width =
        (this.options.iconBoxWidth || iconBoxWidth) + "px";

      childrens.forEach((item) => {
        const domDiv = document.createElement("div");
        const _iconSize = this.options.iconsize || iconsize;
        domDiv.setAttribute("class", "itemlistLiStyle");
        domDiv.setAttribute("key", item.name);
        domDiv.setAttribute("title", item.name);
        domDiv.setAttribute("symbolId", item.id);
        domDiv.style.width = _iconSize + "px";
        domDiv.style.height = _iconSize + "px";
        domDiv.style.display = "flex";
        domDiv.style.alignItems = "center";
        domDiv.style.justifyContent = "center";

        const iconDom = symbolManager.getImageByID(item.id);
        iconDom.setAttribute("symbolId", item.id);
        iconDom.style.width = _iconSize * 0.8 + "px";
        iconDom.style.height = _iconSize * 0.8 + "px";

        domDiv.appendChild(iconDom);
        divItemUl.appendChild(domDiv);
      });

      divItemUl.onclick = (e) => {
        if (e && e.target) {
          const target = e.target;
          if (
            (target.getAttribute("class") &&
              target.getAttribute("class").includes("itemlistLiStyle")) ||
            target.localName === "img"
          ) {
            const id = target.getAttribute("symbolId");
            if (id) {
              this.drawFunc(id);
            }
          }
        }
      };

      divItemContent.appendChild(divItemUl);
      divItemBox.appendChild(divItemContent);
      parentElement.appendChild(divItemBox);
    }

    // eslint-disable-next-line class-methods-use-this
    getItemBoxPaddingWidth() {
      const boxWidth = this.options.iconBoxWidth || iconBoxWidth;
      const s = boxWidth % (this.options.iconsize || iconsize);
      return s / 2;
    }

    applyStyleAttribute(ele, styleObj) {
      if (ele && styleObj) {
        const keys = Object.keys(styleObj);
        keys.forEach((t) => {
          ele.style[t] = styleObj[t];
        });
      }
    }

    switchViewIcon(index) {
      let str = "fa-regular fa-folder";
      switch (index) {
        case 2: {
          str = "fa-regular fa-folder";
          break;
        }
        case 3: {
          str = "fa-regular fa-folder";
          break;
        }
        default:
          break;
      }
      return str;
    }
  }

  if (!window.webclientPlot) {
    window.webclientPlot = {};
  }
  window.webclientPlot["PlotMenu"] = PlotMenu;
})(window);
