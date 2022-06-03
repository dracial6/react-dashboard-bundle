import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Constants from './Constants';
import close from "./resources/closePanel.png";
import "./resources/DragMove.css";
import Contants from "./Constants";
export default function DragMove(props) {
    const { id, title, onLoad, onPointerDown, onPointerUp, onPointerEnter, onPointerLeave, row, rowCount, column, columnCount, minRowCount, minColumnCount, priority, style, children } = props;
    const handlePointerDown = (e) => {
        onPointerDown(e);
    };
    const handlePointerUp = (e) => {
        onPointerUp(e);
    };
    const handlePointerEnter = (e) => {
        onPointerEnter(e);
    };
    const handlePointerLeave = (e) => {
        onPointerLeave(e);
    };
    return (
    //@ts-ignore
    _jsxs("div", Object.assign({ id: id, onLoad: onLoad, onPointerDown: handlePointerDown, onPointerUp: handlePointerUp, onMouseEnter: handlePointerEnter, onMouseLeave: handlePointerLeave, className: Constants.Class_DragMoveTag, row: row, column: column, rowCount: rowCount, columnCount: columnCount, minRowCount: minRowCount, minColumnCount: minColumnCount, priority: priority, style: style }, { children: [_jsx("div", Object.assign({ className: 'closed', style: { position: 'absolute', left: '0px', top: '0px', width: '100%', backgroundColor: 'rgb(133, 193, 233)', zIndex: 1 } }, { children: _jsx("p", Object.assign({ style: { height: '15px', marginLeft: '15px', marginTop: '5px', fontWeight: 'bold' } }, { children: title })) })), _jsx("div", Object.assign({ style: { visibility: 'hidden', width: 'inherit', height: 'inherit', zIndex: 2, boxShadow: '0 0 0 3px black inset' } }, { children: _jsx("img", { id: Contants.ID_CloseButton, src: close, alt: "close", width: '10px', height: '10px', style: { position: 'absolute', cursor: 'pointer', right: '0%', top: '2px', width: '20px', height: '20px', marginTop: '3px', marginRight: '15px' } }) })), children] })));
}
DragMove.defaultProps = {
    onLoad: () => { },
    onPointerDown: () => { },
    onPointerUp: () => { },
    onPointerEnter: () => { },
    onPointerLeave: () => { }
};
