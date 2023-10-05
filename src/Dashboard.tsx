import React, { RefObject } from "react";
import ReactDOM from "react-dom";
import offEdit from "./resources/offEdit.png";
import onEdit from "./resources/onEdit.png";
import leftArrow from "./resources/leftArrow.png";
import "./resources/Dashboard.css";
import DragMove from "./DragMove";
import Constants from "./Constants";
import SideMenuPanel, { SideMenuItem } from "./SideMenuPanel";
import Contants from "./Constants";

class Dashboard extends React.Component {
  state = {
    isEditMode: false,
    editPosition: { x: window.innerWidth - 120, y: window.innerHeight - 120 },
    sideMenuWidth: 20,
    sideMenuButtonsHeight: 170,
    title: "",
    minRowCount: 0,
    minColumnCount: 0,
  };

  private _init = false;
  componentDidMount() {
    if (!this._init) {
      this._init = true;
      window.onpointermove = this.onMouseMove;
      window.addEventListener("resize", this.onResize);

      this._mainTag = document.getElementById(Constants.ID_Main) as HTMLElement;
      this._editTag = document.getElementById(
        Constants.ID_Edit
      ) as HTMLImageElement;
      this._backgroundTag = document.getElementById(
        Constants.ID_Background
      )! as HTMLImageElement;
      this._sideMenuTag = document.getElementById(
        Constants.ID_SideMenu
      ) as HTMLElement;
      this._sideMenuButtonsTag = document.getElementById(
        Constants.ID_SideMenuButtons
      ) as HTMLElement;
      this._sideMenuRowCount = document.getElementById(
        Constants.ID_SideMenuRowCount
      ) as HTMLInputElement;
      this._sideMenuColumnCount = document.getElementById(
        Constants.ID_SideMenuColumnCount
      ) as HTMLInputElement;
      this._sideMenuSearch = document.getElementById(
        Constants.ID_SideMenuSearch
      ) as HTMLInputElement;
    }
  }

  private _cachedRowColMap = new Map();
  private _sideMenuCallBackMap = new Map<string, (e: SideMenuItem) => {}>();

  private _components: JSX.Element[] = [];
  private _sideMenuPanels: JSX.Element[] = [];

  private _selectedSideMenuItem = new SideMenuItem();
  private _selectedSideMenuCallBack = (e: SideMenuItem) => {};
  private _currentMovingTag?: HTMLElement;
  private _currentResizingTag?: HTMLElement;
  private _currentResizeFlag?: number;
  private _currentOpenedTag?: Element;
  private _mainTag!: HTMLElement;
  private _editTag!: HTMLImageElement;
  private _backgroundTag!: HTMLElement;
  private _sideMenuTag!: HTMLElement;
  private _sideMenuButtonsTag!: HTMLElement;
  private _sideMenuRowCount!: HTMLInputElement;
  private _sideMenuColumnCount!: HTMLInputElement;
  private _sideMenuSearch!: HTMLInputElement;

  private _newTag?: HTMLElement | null;

  private getTagKey = (name: string, row: string, column: string) => {
    return name + "/" + row + "/" + column;
  };

  private alignContent = () => {
    const dragMoveTags = document.getElementsByClassName(
      Constants.Class_DragMoveTag
    );
    const arr = [...dragMoveTags];
    let priorityTag;
    for (let i = 0; i < arr.length; i++) {
      const tag = arr[i];
      if (tag.getAttribute(Constants.Att_Priority) === "1") {
        priorityTag = tag;
        arr.splice(i, 1);
        break;
      }
    }

    if (!priorityTag) return;

    const priorityBounds = priorityTag.getBoundingClientRect();
    const priorityRow = parseInt(priorityTag.getAttribute(Constants.Att_Row)!);
    const priorityRowCount = parseInt(
      priorityTag.getAttribute(Constants.Att_RowCount)!
    );
    const priorityColumn = parseInt(
      priorityTag.getAttribute(Constants.Att_Column)!
    );
    const priorityColumnCount = parseInt(
      priorityTag.getAttribute(Constants.Att_ColumnCount)!
    );
    const overedTags = [];

    for (const tag of arr) {
      const tagBounds = tag.getBoundingClientRect();
      if (
        this.containsBounds(
          priorityBounds.left,
          priorityBounds.top,
          priorityBounds.width,
          priorityBounds.height,
          tagBounds.left,
          tagBounds.top,
          tagBounds.width,
          tagBounds.height
        )
      ) {
        if (tag !== this._currentMovingTag) {
          // 없으면 이동 중 정렬시 오류 발생
          const row = tag.getAttribute(Constants.Att_Row)!;
          const rowCount = parseInt(tag.getAttribute(Constants.Att_RowCount)!);
          const column = tag.getAttribute(Constants.Att_Column)!;
          const columnCount = parseInt(
            tag.getAttribute(Constants.Att_ColumnCount)!
          );
          if (parseInt(row) + rowCount <= priorityRow) continue;
          if (parseInt(column) + columnCount <= priorityColumn) continue;
          if (parseInt(column) >= priorityColumn + priorityColumnCount)
            continue;

          overedTags.push(tag);
          const tagKey = tag.id
            ? tag.id
            : this.getTagKey(tag.className, row, column);
          if (this._cachedRowColMap.has(tagKey) === false) {
            this._cachedRowColMap.set(tagKey, [row, column]);
            tag.id = tagKey;
          }
        }
      }
    }

    if (overedTags.length === 0) {
      priorityTag.setAttribute(Constants.Att_Priority, "0");
      return;
    }

    overedTags.sort((a, b) => {
      const aRow = parseInt(a.getAttribute(Constants.Att_Row)!);
      const bRow = parseInt(b.getAttribute(Constants.Att_Row)!);

      if (aRow < bRow) return 1;
      else if (aRow === bRow) return 0;
      else return -1;
    });

    for (const tag of overedTags) {
      priorityTag.setAttribute(Constants.Att_Priority, "0");
      tag.setAttribute(Constants.Att_Priority, "1");
      tag.setAttribute(
        Constants.Att_Row,
        (priorityRow + priorityRowCount).toString()
      );
      (tag as HTMLElement).style.top =
        this.getRowY(priorityRow + priorityRowCount) + "px";
      this.alignContent();
      tag.setAttribute(Constants.Att_Priority, "0");
    }
  };

  private rollBackContents = (bounds: DOMRect) => {
    if (this._cachedRowColMap.size > 0) {
      const dragMoveTags = document.getElementsByClassName(
        Constants.Class_DragMoveTag
      );
      for (const pair of this._cachedRowColMap) {
        const tag = document.getElementById(pair[0]);
        if (tag) {
          const tagBounds = tag.getBoundingClientRect();
          if (
            !this.containsBounds(
              bounds.left,
              bounds.top,
              bounds.width,
              bounds.height,
              tagBounds.left,
              tagBounds.top,
              tagBounds.width,
              tagBounds.height
            )
          ) {
            const row = pair[1][0];
            const column = pair[1][1];
            const columnX = this.getColumnX(column);
            const rowY = this.getRowY(row);

            let isAlreadyOccupied = false;
            for (const tag2 of dragMoveTags) {
              if (tag === tag2) continue;
              const tag2Bounds = tag2.getBoundingClientRect();
              if (
                this.containsBounds(
                  tag2Bounds.left,
                  tag2Bounds.top,
                  tag2Bounds.width,
                  tag2Bounds.height,
                  columnX,
                  rowY,
                  tagBounds.width,
                  tagBounds.height
                )
              ) {
                isAlreadyOccupied = true;
                break;
              }
            }

            if (isAlreadyOccupied) {
              continue;
            }

            tag.setAttribute(Constants.Att_Row, row);
            tag.setAttribute(Constants.Att_Column, column);
            tag.style.left = columnX + "px";
            tag.style.top = rowY + "px";
            this._cachedRowColMap.delete(pair[0]);
          }
        }
      }
    }
  };

  private getColumnX = (column: number) => {
    return (
      (Constants.PanelSize.width + Constants.PanelGap) * column -
      Constants.PanelGap +
      Constants.LeftMargin
    );
  };

  private getColumn = (x: number) => {
    return parseInt(
      (
        (x + window.scrollX - Constants.PanelGap) /
        (Constants.PanelSize.width + Constants.PanelGap)
      ).toFixed()
    );
  };

  private getRowY = (row: number) => {
    return (
      (Constants.PanelSize.height + Constants.PanelGap) * row -
      Constants.PanelGap +
      Constants.TopMargin
    );
  };

  private getRow = (y: number) => {
    return parseInt(
      (
        (y + window.scrollY - Constants.PanelGap) /
        (Constants.PanelSize.height + Constants.PanelGap)
      ).toFixed()
    );
  };

  private containsBounds = (
    targetX: number,
    targetY: number,
    targetWidth: number,
    targetHeight: number,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    if (
      targetX > x + width ||
      targetX + targetWidth < x ||
      targetY > y + height ||
      targetY + targetHeight < y
    ) {
      return false;
    }

    return true;
  };

  private get zoomRate(): number {
    return (
      1 /
      (Math.round(((window.outerWidth - 8) / window.innerWidth) * 100) / 100)
    );
  }

  private get newUID(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private onTagMouseDown = (e: any) => {
    if (e.target.id === Constants.ID_CloseButton) {
      let target = e.target;

      while (target) {
        if (target.className === Constants.Class_DragMoveTag) {
          break;
        } else {
          target = target.parentElement;
        }
      }

      // for (let i = 0; i < this._components.length; i++) {
      //   if (this._components[i].key === target.id) {
      //     this._components.splice(i, 1);
      //     break;
      //   }
      // }

      this._mainTag.removeChild(target);
    } else if (this.state.isEditMode) {
      let target = e.target;

      while (target) {
        if (target.className === Constants.Class_DragMoveTag) {
          break;
        } else {
          target = target.parentElement;
        }
      }

      if (!target) return;

      if (!target.style.cursor || target.style.cursor === "default") {
        this._currentMovingTag = target;
        this._currentMovingTag!.style.cursor = "move";
      } else if (target.style.cursor !== "move") {
        this._currentResizingTag = target;
      }

      target.setPointerCapture(e.pointerId);
    }
  };

  private onTagMouseUp = (e: any) => {
    if (this.state.isEditMode) {
      if (this._currentMovingTag) {
        this._currentMovingTag.releasePointerCapture(e.pointerId);

        const bounds = this._currentMovingTag.getBoundingClientRect();
        const row = this.getRow(bounds.top);
        const column = this.getColumn(bounds.left);
        this._currentMovingTag.setAttribute(Constants.Att_Row, row.toString());
        this._currentMovingTag.setAttribute(
          Constants.Att_Column,
          column.toString()
        );
        this._currentMovingTag.style.left = this.getColumnX(column) + "px";
        this._currentMovingTag.style.top = this.getRowY(row) + "px";

        const root = this._mainTag.parentElement!;
        root.style.width = "99.9vw";
        root.style.height = "99.9vh";
        this._backgroundTag.style.width = "99.9vw";
        this._backgroundTag.style.height = "99.9vh";
        //- (1800 / window.innerWidth) 스크롤 계산
        const maxWidth = Math.max(
          document.body.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.clientWidth,
          document.documentElement.scrollWidth,
          document.documentElement.offsetWidth
        );
        this._backgroundTag.style.width =
          99.9 * (maxWidth / window.innerWidth) + "vw";
        const maxHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        this._backgroundTag.style.height =
          99.9 * (maxHeight / window.innerHeight) + "vh";

        root.style.width = this._backgroundTag.style.width;
        root.style.height = this._backgroundTag.style.height;

        this._currentMovingTag.style.cursor = "default";
        this._currentMovingTag = undefined;

        this._cachedRowColMap.clear();

        if (
          this._selectedSideMenuItem.id.length > 0 &&
          this._selectedSideMenuCallBack
        ) {
          this._selectedSideMenuCallBack(this._selectedSideMenuItem);
          this._selectedSideMenuItem = new SideMenuItem();
        }
      } else if (this._currentResizingTag) {
        this._currentResizingTag.releasePointerCapture(e.pointerId);

        const bounds = this._currentResizingTag.getBoundingClientRect();
        const row = this.getRow(bounds.top);
        const column = this.getColumn(bounds.left);
        const endRow = this.getRow(bounds.top + bounds.height);
        const endColumn = this.getColumn(bounds.left + bounds.width);
        this._currentResizingTag.setAttribute(
          Constants.Att_Row,
          row.toString()
        );
        this._currentResizingTag.setAttribute(
          Constants.Att_Column,
          column.toString()
        );
        this._currentResizingTag.setAttribute(
          Constants.Att_RowCount,
          (endRow - row).toString()
        );
        this._currentResizingTag.setAttribute(
          Constants.Att_ColumnCount,
          (endColumn - column).toString()
        );
        const x = this.getColumnX(column);
        const y = this.getRowY(row);
        const width = this.getColumnX(endColumn) - x - Constants.PanelGap;
        const height = this.getRowY(endRow) - y - Constants.PanelGap;
        this._currentResizingTag.style.left = x + "px";
        this._currentResizingTag.style.top = y + "px";
        if (width > 0) this._currentResizingTag.style.width = width + "px";
        if (height > 0) this._currentResizingTag.style.height = height + "px";

        this._currentResizingTag = undefined;
      }
    }
  };

  private onTagMouseEnter = (e: any) => {
    if (this.state.isEditMode) {
      const dragMoveTags = document.getElementsByClassName(
        Constants.Class_DragMoveTag
      );
      let target;
      for (const tag of dragMoveTags) {
        const tagBounds = tag.getBoundingClientRect();
        if (
          this.containsBounds(
            tagBounds.left + window.scrollX,
            tagBounds.top + window.scrollY,
            tagBounds.width,
            tagBounds.height,
            e.pageX,
            e.pageY,
            1,
            1
          )
        ) {
          target = tag;
          break;
        }
      }

      if (target) {
        (target.children[1] as HTMLElement).style.visibility = "inherit";
        target.children[0].className = "opened";
        this._currentOpenedTag = target;
      }
    }
  };

  private onTagMouseLeave = (e: any) => {
    if (this._currentOpenedTag) {
      (this._currentOpenedTag.children[1] as HTMLElement).style.visibility =
        "hidden";
      (this._currentOpenedTag as HTMLElement).style.cursor = "";
      this._currentOpenedTag.children[0].className = "closed";
      this._currentOpenedTag = undefined;
    }
  };

  private onSideMenuPanelClick = (e: any) => {
    let target = e.target;

    while (target) {
      if (target.className === Constants.Class_SideMenuPanel) {
        break;
      } else {
        target = target.parentElement;
      }
    }

    this._selectedSideMenuItem = new SideMenuItem();
    this._selectedSideMenuItem.id = target.id + this.newUID;
    this._selectedSideMenuItem.title = target.getAttribute(Contants.Att_Title);
    this._selectedSideMenuItem.minRowCount = parseInt(
      target.getAttribute(Contants.Att_MinRowCount)
    );
    this._selectedSideMenuItem.minColumnCount = parseInt(
      target.getAttribute(Contants.Att_MinColumnCount)
    );

    const bounds =
      this._sideMenuButtonsTag.parentElement!.getBoundingClientRect();
    this._sideMenuButtonsTag.style.top =
      bounds.height - this.state.sideMenuButtonsHeight + "px";
    this._selectedSideMenuCallBack = this._sideMenuCallBackMap.get(target.id)!;

    this._sideMenuRowCount.min =
      this._selectedSideMenuItem.minRowCount.toString();
    this._sideMenuRowCount.value = this._sideMenuRowCount.min;
    this._sideMenuColumnCount.min =
      this._selectedSideMenuItem.minColumnCount.toString();
    this._sideMenuColumnCount.value = this._sideMenuColumnCount.min;

    this.setState({
      title: this._selectedSideMenuItem.title,
      minRowCount: this._selectedSideMenuItem.minRowCount,
      minColumnCount: this._selectedSideMenuItem.minColumnCount,
    });
  };

  private onAddSideMenuClick(event: any) {
    this._sideMenuTag.style.left = "100vw";
    this._sideMenuButtonsTag.style.top = "100%";

    this._selectedSideMenuItem.rowCount = parseInt(
      this._sideMenuRowCount.value
    );
    this._selectedSideMenuItem.columnCount = parseInt(
      this._sideMenuColumnCount.value
    );

    const width = this.getColumnX(this._selectedSideMenuItem.columnCount);
    const height = this.getRowY(this._selectedSideMenuItem.rowCount);

    const onLoad = () => {
      this._newTag = document.getElementById(
        this._selectedSideMenuItem.id + "DragMove"
      );
    };

    this.registerElement(
      "div",
      this._selectedSideMenuItem.id,
      this._selectedSideMenuItem.title,
      this.getColumn(event.pageX - width / 2),
      this.getRow(event.pageY - height / 2),
      this._selectedSideMenuItem.rowCount,
      this._selectedSideMenuItem.columnCount,
      this._selectedSideMenuItem.minRowCount,
      this._selectedSideMenuItem.minColumnCount,
      onLoad
    );
  }

  private onCancelSideMenuClick = (e: any) => {
    if (this._currentMovingTag) {
      // for (let i = 0; i < this._components.length; i++) {
      //   if (this._components[i].key === this._currentMovingTag.id) {
      //     this._components.splice(i, 1);
      //     break;
      //   }
      // }

      this._mainTag.removeChild(this._currentMovingTag);
      this._currentMovingTag = undefined;
    }

    this._sideMenuButtonsTag.style.top = "100%";
    this._selectedSideMenuItem = new SideMenuItem();
  };

  private autoScroll(e: any): number[] {
    let autoScrollX = 0;
    let autoScrollY = 0;

    if (
      e.pageX >=
      window.innerWidth + window.scrollX - (window.scrollbars.visible ? 16 : 0)
    ) {
      autoScrollX =
        e.pageX -
        window.innerWidth -
        window.scrollX +
        (window.scrollbars.visible ? 16 : 0);
    } else if (window.scrollX > 0 && e.pageX <= window.scrollX) {
      autoScrollX = e.pageX - window.scrollX;
    }

    if (e.pageY >= window.innerHeight + window.scrollY) {
      autoScrollY = e.pageY - window.innerHeight - window.scrollY;
    } else if (window.scrollY > 0 && e.pageY <= window.scrollY) {
      autoScrollY = e.pageY - window.scrollY;
    }

    if (autoScrollX !== 0 || autoScrollY !== 0) {
      window.scrollTo(
        window.scrollX + autoScrollX,
        window.scrollY + autoScrollY
      );
      let currentWidth = this.state.editPosition.x;
      if (autoScrollX > 0) {
        currentWidth = window.innerWidth - 120;
        this.setState({
          editPosition: {
            x: window.innerWidth - 120,
            y: this.state.editPosition.y,
          },
        });

        const root = this._mainTag.parentElement!;
        root.style.width = "99.9vw";
        this._backgroundTag.style.width = "99.9vw";
        const maxWidth = Math.max(
          document.body.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.clientWidth,
          document.documentElement.scrollWidth,
          document.documentElement.offsetWidth
        );
        this._backgroundTag.style.width =
          99.9 * (maxWidth / window.innerWidth) + "vw";
        root.style.width = this._backgroundTag.style.width;
      }

      if (autoScrollY > 0) {
        this.setState({
          editPosition: {
            x: currentWidth,
            y: window.innerHeight - 120,
          },
        });

        const root = this._mainTag.parentElement!;
        root.style.height = "99.9vh";
        this._backgroundTag.style.height = "99.9vh";
        const maxHeight = Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.clientHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight
        );
        this._backgroundTag.style.height =
          99.9 * (maxHeight / window.innerHeight) + "vh";
        root.style.height = this._backgroundTag.style.height;
      }
    }

    return [autoScrollX, autoScrollY];
  }

  private onMouseMove = (e: any) => {
    if (this.state.isEditMode) {
      const currentZoomRate = this.zoomRate;

      if (this._newTag) {
        const width = this.getColumnX(this._selectedSideMenuItem.columnCount);
        const height = this.getRowY(this._selectedSideMenuItem.rowCount);
        this._newTag.setAttribute(
          Constants.Att_RowCount,
          this._sideMenuRowCount.value
        );
        this._newTag.setAttribute(
          Constants.Att_ColumnCount,
          this._sideMenuColumnCount.value
        );
        this._newTag.style.position = "absolute";
        this._newTag.style.left = e.pageX - width / 2 + "px";
        this._newTag.style.top = e.pageY - height / 2 + "px";
        this._newTag.style.width = width - Constants.LeftMargin + "px";
        this._newTag.style.height = height - Constants.LeftMargin + "px";

        this._currentMovingTag = this._newTag;
        this._currentMovingTag.style.cursor = "move";
        this._currentMovingTag.setPointerCapture(e.pointerId);
      }

      if (this._currentMovingTag) {
        if (e.preventDefault) e.preventDefault();
        const result = this.autoScroll(e);
        const bounds = this._currentMovingTag.getBoundingClientRect();
        this._currentMovingTag.style.left =
          bounds.left +
          window.scrollX +
          e.movementX * currentZoomRate +
          result[0] +
          "px";
        this._currentMovingTag.style.top =
          bounds.top +
          window.scrollY +
          e.movementY * currentZoomRate +
          result[1] +
          "px";
        this._currentMovingTag.setAttribute(
          Constants.Att_Row,
          this.getRow(bounds.top + e.movementY * currentZoomRate).toString()
        );
        this._currentMovingTag.setAttribute(
          Constants.Att_Column,
          this.getColumn(bounds.left + e.movementX * currentZoomRate).toString()
        );
        this._currentMovingTag.setAttribute(Constants.Att_Priority, "1");
        this.alignContent();
        this.rollBackContents(bounds);
        this._newTag = undefined;
      } else if (this._currentResizingTag) {
        if (e.preventDefault) e.preventDefault();
        const result = this.autoScroll(e);
        const bounds = this._currentResizingTag.getBoundingClientRect();
        const row = this.getRow(bounds.top + e.movementY * currentZoomRate);
        const column = this.getColumn(
          bounds.left + e.movementX * currentZoomRate
        );
        const endRow = this.getRow(
          bounds.top + bounds.height + e.movementY * currentZoomRate
        );
        const endColumn = this.getColumn(
          bounds.left + bounds.width + e.movementX * currentZoomRate
        );

        if (
          parseInt(
            this._currentResizingTag.getAttribute(Constants.Att_MinRowCount)!
          ) >
            endRow - row ||
          parseInt(
            this._currentResizingTag.getAttribute(Constants.Att_MinColumnCount)!
          ) >
            endColumn - column
        ) {
          return;
        }

        switch (this._currentResizingTag.style.cursor) {
          case "nwse-resize":
            if (this._currentResizeFlag === 0) {
              this._currentResizingTag.style.left =
                bounds.left +
                window.scrollX +
                e.movementX * currentZoomRate +
                result[0] +
                "px";
              this._currentResizingTag.style.top =
                bounds.top +
                window.scrollY +
                e.movementY * currentZoomRate +
                result[1] +
                "px";
              this._currentResizingTag.style.width =
                bounds.width - e.movementX * currentZoomRate - result[0] + "px";
              this._currentResizingTag.style.height =
                bounds.height -
                e.movementY * currentZoomRate -
                result[1] +
                "px";
            } else {
              this._currentResizingTag.style.width =
                bounds.width + e.movementX * currentZoomRate + result[0] + "px";
              this._currentResizingTag.style.height =
                bounds.height +
                e.movementY * currentZoomRate +
                result[1] +
                "px";
            }
            break;
          case "nesw-resize":
            if (this._currentResizeFlag === 0) {
              this._currentResizingTag.style.top =
                bounds.top +
                window.scrollY +
                e.movementY * currentZoomRate +
                result[1] +
                "px";
              this._currentResizingTag.style.height =
                bounds.height -
                e.movementY * currentZoomRate -
                result[1] +
                "px";
              this._currentResizingTag.style.width =
                bounds.width + e.movementX * currentZoomRate + result[0] + "px";
            } else {
              this._currentResizingTag.style.left =
                bounds.left +
                window.scrollX +
                e.movementX * currentZoomRate +
                result[0] +
                "px";
              this._currentResizingTag.style.width =
                bounds.width - e.movementX * currentZoomRate - result[0] + "px";
              this._currentResizingTag.style.height =
                bounds.height +
                e.movementY * currentZoomRate +
                result[1] +
                "px";
            }
            break;
          case "ns-resize":
            if (this._currentResizeFlag === 0) {
              this._currentResizingTag.style.top =
                bounds.top +
                window.scrollY +
                e.movementY * currentZoomRate +
                result[1] +
                "px";
              this._currentResizingTag.style.height =
                bounds.height -
                e.movementY * currentZoomRate -
                result[1] +
                "px";
            } else {
              this._currentResizingTag.style.height =
                bounds.height +
                e.movementY * currentZoomRate +
                result[1] +
                "px";
            }
            break;
          case "ew-resize":
            if (this._currentResizeFlag === 0) {
              this._currentResizingTag.style.left =
                bounds.left +
                window.scrollX +
                e.movementX * currentZoomRate +
                result[0] +
                "px";
              this._currentResizingTag.style.width =
                bounds.width - e.movementX * currentZoomRate - result[0] + "px";
            } else {
              this._currentResizingTag.style.width =
                bounds.width + e.movementX * currentZoomRate + result[0] + "px";
            }
            break;
          default:
            break;
        }

        this._currentResizingTag.setAttribute(
          Constants.Att_Row,
          row.toString()
        );
        this._currentResizingTag.setAttribute(
          Constants.Att_Column,
          column.toString()
        );
        this._currentResizingTag.setAttribute(
          Constants.Att_RowCount,
          (endRow - row).toString()
        );
        this._currentResizingTag.setAttribute(
          Constants.Att_ColumnCount,
          (endColumn - column).toString()
        );
        this._currentResizingTag.setAttribute(Constants.Att_Priority, "1");
        this.alignContent();
        this.rollBackContents(bounds);
      } else if (this._currentOpenedTag) {
        const tagBounds = this._currentOpenedTag.getBoundingClientRect();

        let cursor = "";
        const resizePointSize = Constants.ResizePointSize * this.zoomRate;
        if (
          tagBounds.left + window.scrollX + resizePointSize > e.pageX &&
          tagBounds.top + window.scrollY + resizePointSize > e.pageY
        ) {
          this._currentResizeFlag = 0;
          cursor = "nwse-resize";
        } else if (
          tagBounds.left + window.scrollX + tagBounds.width - resizePointSize <
            e.pageX &&
          tagBounds.top + window.scrollY + tagBounds.height - resizePointSize <
            e.pageY
        ) {
          this._currentResizeFlag = 1;
          cursor = "nwse-resize";
        } else if (
          tagBounds.left + window.scrollX + tagBounds.width - resizePointSize <
            e.pageX &&
          tagBounds.top + window.scrollY + resizePointSize > e.pageY
        ) {
          this._currentResizeFlag = 0;
          cursor = "nesw-resize";
        } else if (
          tagBounds.left + window.scrollX + resizePointSize > e.pageX &&
          tagBounds.top + window.scrollY + tagBounds.height - resizePointSize <
            e.pageY
        ) {
          this._currentResizeFlag = 1;
          cursor = "nesw-resize";
        } else if (tagBounds.top + window.scrollY + resizePointSize > e.pageY) {
          this._currentResizeFlag = 0;
          cursor = "ns-resize";
        } else if (
          tagBounds.top + window.scrollY + tagBounds.height - resizePointSize <
          e.pageY
        ) {
          this._currentResizeFlag = 1;
          cursor = "ns-resize";
        } else if (
          tagBounds.left + window.scrollX + resizePointSize >
          e.pageX
        ) {
          this._currentResizeFlag = 0;
          cursor = "ew-resize";
        } else if (
          tagBounds.left + window.scrollX + tagBounds.width - resizePointSize <
          e.pageX
        ) {
          this._currentResizeFlag = 1;
          cursor = "ew-resize";
        } else {
          cursor = "default";
        }

        (this._currentOpenedTag as HTMLElement).style.cursor = cursor;
      }
    }
  };

  private onEditClick = () => {
    this.setState({ isEditMode: !this.state.isEditMode });
    this._backgroundTag.style.visibility = !this.state.isEditMode
      ? "inherit"
      : "hidden";
    this._sideMenuTag.style.visibility = !this.state.isEditMode
      ? "inherit"
      : "hidden";
    this._editTag.src = !this.state.isEditMode ? onEdit : offEdit;

    if (this.state.isEditMode) {
      const dragMoveTags = document.getElementsByClassName(
        Constants.Class_DragMoveTag
      );

      for (const tag of dragMoveTags) {
        (tag as HTMLElement).style.cursor = "";
      }

      if (this._currentOpenedTag) {
        (this._currentOpenedTag.children[1] as HTMLElement).style.visibility =
          "hidden";
        this._currentOpenedTag.className = "closed";
        this._currentOpenedTag = undefined;
      }
    }
  };

  private onEditEnter = () => {
    this._editTag.src = this.state.isEditMode ? offEdit : onEdit;
  };

  private onEditLeave = () => {
    this._editTag.src = this.state.isEditMode ? onEdit : offEdit;
  };

  private onArrowClick = () => {
    this._sideMenuTag.style.left =
      this._sideMenuTag.style.left === "100vw"
        ? 100 - this.state.sideMenuWidth + "vw"
        : "100vw";
  };

  private _searchFuncMap = new Map<string, Function>();

  private onSearchInput = async () => {
    this._searchFuncMap.clear();
    if (this._sideMenuPanels.length === 0) return;

    const uid = this.newUID;

    const doSearch = () => {
      if (
        this._searchFuncMap.size > 0 &&
        this._searchFuncMap.keys().next().value === uid
      ) {
        const sideMenuPanelTags = document.getElementsByClassName(
          Constants.Class_SideMenuPanel
        );
        const sideMenuLineTags = document.getElementsByTagName("hr");

        let visibleCount = 0;

        for (let i = 0; i < sideMenuPanelTags.length; i++) {
          const panel = sideMenuPanelTags[i] as HTMLElement;

          if (panel.nodeName === "hr") continue;

          const line = sideMenuLineTags[i + 1] as HTMLElement;

          if (
            panel.getAttribute("title")!.includes(this._sideMenuSearch.value)
          ) {
            panel.style.visibility = "inherit";
            panel.style.top = 160 * visibleCount + "px";
            line.style.visibility = "inherit";
            line.style.top = 160 * (visibleCount + 1) + "px";
            visibleCount++;
          } else {
            panel.style.visibility = "hidden";
            line.style.visibility = "hidden";
          }
        }
      }
    };

    this._searchFuncMap.set(uid, doSearch);

    await setTimeout(doSearch, 1000);
  };

  private onResize = () => {
    this.setState({
      editPosition: {
        x: window.innerWidth - 120,
        y: window.innerHeight - 120,
      },
    });

    const zoomRate = this.zoomRate;
    this.setState({ sideMenuWidth: 20 / zoomRate });

    if (this.state.isEditMode) {
      if (this._sideMenuTag.style.left !== "100vw") {
        this._sideMenuTag.style.left = 100 - 20 / zoomRate + "vw";
      }

      if (this._sideMenuButtonsTag.style.top !== "100%") {
        const bounds =
          this._sideMenuButtonsTag.parentElement!.getBoundingClientRect();
        this._sideMenuButtonsTag.style.top =
          bounds.height - this.state.sideMenuButtonsHeight + "px";
      }
    }

    const root = this._mainTag.parentElement!;
    root.style.width = "99.9vw";
    root.style.height = "99.9vh";
    this._backgroundTag.style.width = "99.9vw";
    this._backgroundTag.style.height = "99.9vh";
    //- (1800 / window.innerWidth) 스크롤 계산
    const maxWidth = Math.max(
      document.body.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth
    );
    this._backgroundTag.style.width =
      99.9 * (maxWidth / window.innerWidth) + "vw";
    const maxHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    this._backgroundTag.style.height =
      99.9 * (maxHeight / window.innerHeight) + "vh";

    root.style.width = this._backgroundTag.style.width;
    root.style.height = this._backgroundTag.style.height;
  };

  private onDashBoardLoad = () => {
    const dragMoveTags = document.getElementsByClassName(
      Constants.Class_DragMoveTag
    );
    for (const tag of dragMoveTags) {
      const left = this.getColumnX(
        parseInt(tag.getAttribute(Constants.Att_Column)!)
      );
      const top = this.getRowY(parseInt(tag.getAttribute(Constants.Att_Row)!));
      const tagElement = tag as HTMLElement;
      tagElement.style.position = "absolute";
      tagElement.style.backgroundColor = "white";
      tagElement.style.left = left + "px";
      tagElement.style.top = top + "px";
      tagElement.style.width =
        this.getColumnX(
          parseInt(tag.getAttribute(Constants.Att_Column)!) +
            parseInt(tag.getAttribute(Constants.Att_ColumnCount)!)
        ) -
        left -
        Constants.PanelGap +
        "px";
      tagElement.style.height =
        this.getRowY(
          parseInt(tag.getAttribute(Constants.Att_Row)!) +
            parseInt(tag.getAttribute(Constants.Att_RowCount)!)
        ) -
        top -
        Constants.PanelGap +
        "px";
    }

    const maxWidth = Math.max(
      document.body.scrollWidth,
      document.body.offsetWidth,
      document.documentElement.clientWidth,
      document.documentElement.scrollWidth,
      document.documentElement.offsetWidth
    );
    this._backgroundTag.style.width =
      99.9 * (maxWidth / window.innerWidth) + "vw"; // 100으로하면
    const maxHeight = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );
    this._backgroundTag.style.height =
      99.9 * (maxHeight / window.innerHeight) + "vh";
  };

  registerElement(
    elementType: string,
    id: string,
    title: string,
    row: number,
    column: number,
    rowCount: number,
    columnCount: number,
    minRowCount: number,
    minColumnCount: number,
    callBack?: () => void
  ): void {
    const element = React.createElement(elementType, {
      id: id,
      style: { position: "absolute", top: "0px", left: "0px" },
    });
    this._components.push(
      <DragMove
        key={id + "DragMove"}
        id={id + "DragMove"}
        title={title}
        onLoad={callBack ? callBack : () => {}}
        onPointerDown={this.onTagMouseDown}
        onPointerUp={this.onTagMouseUp}
        onPointerEnter={this.onTagMouseEnter}
        onPointerLeave={this.onTagMouseLeave}
        row={row}
        column={column}
        rowCount={rowCount}
        columnCount={columnCount}
        minRowCount={minRowCount}
        minColumnCount={minColumnCount}
        priority={0}
      >
        {element}
      </DragMove>
    );
    this.forceUpdate();
  }

  registerSideMenu(
    menuID: string,
    title: string,
    description: string,
    imgSrc: string,
    minRowCount: number,
    minColumnCount: number,
    callBack: (e: SideMenuItem) => {}
  ): void {
    this._sideMenuCallBackMap.set(menuID, callBack);
    this._sideMenuPanels.push(
      <SideMenuPanel
        id={menuID}
        title={title}
        description={description}
        imgSrc={imgSrc}
        onClick={this.onSideMenuPanelClick.bind(this)}
        minRowCount={minRowCount}
        minColumnCount={minColumnCount}
        style={{
          position: "absolute",
          width: "inherit",
          height: "160px",
          top: `${(160 * this._sideMenuPanels.length) / 2}px`,
          cursor: "pointer",
          border: "1",
          borderColor: "rgba(0,0,0,0.5)",
        }}
      ></SideMenuPanel>
    );
    this._sideMenuPanels.push(
      <hr
        style={{
          position: "absolute",
          top: `${(160 * (this._sideMenuPanels.length + 1)) / 2}px`,
          width: "inherit",
          zIndex: 3,
          marginTop: "0",
        }}
      ></hr>
    );
    this.forceUpdate();
  }

  getElementDatas(): SideMenuItem[] {
    const returnArr = [];
    const tags = document.getElementsByClassName(Constants.Class_DragMoveTag);

    for (const tag of tags) {
      const item = new SideMenuItem();
      item.id = tag.id;
      item.title = tag.getAttribute("title")!;
      item.row = parseInt(tag.getAttribute(Contants.Att_Row)!);
      item.column = parseInt(tag.getAttribute(Contants.Att_Column)!);
      item.rowCount = parseInt(tag.getAttribute(Contants.Att_RowCount)!);
      item.columnCount = parseInt(tag.getAttribute(Contants.Att_ColumnCount)!);
      item.minRowCount = parseInt(tag.getAttribute(Contants.Att_MinRowCount)!);
      item.minColumnCount = parseInt(
        tag.getAttribute(Contants.Att_MinColumnCount)!
      );
      returnArr.push(item);
    }

    return returnArr;
  }

  render() {
    return (
      <div
        id={Constants.ID_Main}
        className={Constants.Class_Header}
        onLoad={this.onDashBoardLoad.bind(this)}
      >
        <div
          id={Constants.ID_Background}
          style={{ visibility: "hidden" }}
        ></div>
        {this._components.map((value, key) => {
          return React.cloneElement(value, { key: key });
        })}
        <span>
          <img
            id={Constants.ID_Edit}
            src={offEdit}
            className="App-edit"
            alt="edit"
            width="100px"
            height="100px"
            onClick={this.onEditClick.bind(this)}
            onMouseEnter={this.onEditEnter.bind(this)}
            onMouseLeave={this.onEditLeave.bind(this)}
            style={{
              position: "fixed",
              left: `${this.state.editPosition.x}px`,
              top: `${this.state.editPosition.y}px`,
              cursor: "pointer",
              zIndex: 4,
            }}
          />
        </span>
        <div
          id={Constants.ID_SideMenu}
          style={{
            position: "fixed",
            transition: "left 500ms ease-out 0s",
            left: "100vw",
            top: "0",
            zIndex: 4,
            visibility: "hidden",
          }}
        >
          <img
            src={leftArrow}
            alt="leftArrow"
            width="40px"
            height="60px"
            onClick={this.onArrowClick.bind(this)}
            style={{
              cursor: "pointer",
              position: "absolute",
              top: "45vh",
              left: "-40px",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: `${this.state.sideMenuWidth}vw`,
              height: "100vh",
              backgroundColor: "white",
              boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.5)",
            }}
          >
            <h2 style={{ position: "absolute", left: "5px" }}>Search</h2>
            <input
              id={Constants.ID_SideMenuSearch}
              type="text"
              onInput={this.onSearchInput.bind(this)}
              style={{
                position: "absolute",
                left: "5px",
                top: "40px",
                width: "95%",
              }}
            ></input>
            <div
              style={{ position: "absolute", top: "70px", width: "inherit" }}
            >
              <hr
                style={{
                  position: "absolute",
                  width: "inherit",
                  zIndex: 3,
                  marginTop: "0",
                }}
              ></hr>
              {this._sideMenuPanels.map((value, key) => {
                return React.cloneElement(value, { key: key });
              })}
            </div>
            <div
              id={Constants.ID_SideMenuButtons}
              style={{
                position: "absolute",
                transition: "top 200ms ease-out 0s",
                width: "inherit",
                height: `${this.state.sideMenuButtonsHeight}px`,
                top: "100%",
                boxShadow: "0px 0px 10px 0px rgba(0,0,0,0.5)",
              }}
            >
              <h2 style={{ position: "absolute", left: "5px" }}>Info</h2>
              <p style={{ position: "absolute", left: "5px", top: "45px" }}>
                Title:{" "}
              </p>
              <p style={{ position: "absolute", left: "45px", top: "45px" }}>
                {this.state.title}
              </p>
              <p style={{ position: "absolute", left: "5px", top: "70px" }}>
                Minimum Row Count:{" "}
              </p>
              <p style={{ position: "absolute", left: "170px", top: "70px" }}>
                {this.state.minRowCount}
              </p>
              <p style={{ position: "absolute", left: "5px", top: "95px" }}>
                Minimum Column Count:{" "}
              </p>
              <p style={{ position: "absolute", left: "195px", top: "95px" }}>
                {this.state.minColumnCount}
              </p>
              <p
                style={{
                  position: "absolute",
                  fontSize: "15px",
                  right: "60px",
                  top: "10px",
                }}
              >
                Row Count
              </p>
              <input
                id={Constants.ID_SideMenuRowCount}
                style={{
                  position: "absolute",
                  width: "110px",
                  right: "20px",
                  top: "35px",
                }}
                type="number"
                min="1"
              ></input>
              <p
                style={{
                  position: "absolute",
                  fontSize: "15px",
                  right: "35px",
                  top: "65px",
                }}
              >
                Column Count
              </p>
              <input
                id={Constants.ID_SideMenuColumnCount}
                style={{
                  position: "absolute",
                  width: "110px",
                  right: "20px",
                  top: "90px",
                }}
                type="number"
                min="1"
              ></input>
              <input
                type="button"
                className="btnAdd"
                onPointerUp={this.onAddSideMenuClick.bind(this)}
                value="Add"
                style={{ position: "absolute", right: "70px", top: "140px" }}
              ></input>
              <input
                type="button"
                className="btnClose"
                onPointerUp={this.onCancelSideMenuClick.bind(this)}
                value="Cancel"
                style={{ position: "absolute", right: "-10px", top: "140px" }}
              ></input>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const DashboardRenderer = (container: HTMLElement) => {
  const ViewRef: RefObject<Dashboard> = React.createRef();
  ReactDOM.render(<Dashboard ref={ViewRef} />, container);
  return ViewRef.current;
};

export default DashboardRenderer;
