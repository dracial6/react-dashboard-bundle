import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Constants from './Constants';
class SideMenuItem {
    constructor() {
        this.id = '';
        this.title = '';
        this.row = 0;
        this.column = 0;
        this.rowCount = 0;
        this.columnCount = 0;
        this.minRowCount = 0;
        this.minColumnCount = 0;
    }
}
export { SideMenuItem };
export default function SideMenuPanel(props) {
    const { id, title, description, imgSrc, onClick, minRowCount, minColumnCount, style } = props;
    const handleClick = (e) => {
        onClick(e);
    };
    const handlePointerMove = (e) => {
        let target = e.target;
        while (target) {
            if (target.className === Constants.Class_SideMenuPanel) {
                break;
            }
            else {
                target = target.parentElement;
            }
        }
        target.style.backgroundColor = 'cyan';
    };
    const handlePointerLeave = (e) => {
        let target = e.target;
        while (target) {
            if (target.className === Constants.Class_SideMenuPanel) {
                break;
            }
            else {
                target = target.parentElement;
            }
        }
        target.style.backgroundColor = 'white';
    };
    return (
    //@ts-ignore
    _jsxs("div", Object.assign({ id: id, title: title, onClick: handleClick, onPointerMove: handlePointerMove, onPointerLeave: handlePointerLeave, className: Constants.Class_SideMenuPanel, minRowCount: minRowCount, minColumnCount: minColumnCount, style: style }, { children: [_jsx("img", { src: imgSrc, width: '100px', height: '100px', style: { position: 'absolute', left: '20px', top: '25px', cursor: 'inherit' } }), _jsx("h2", Object.assign({ style: { position: 'absolute', left: '125px', wordWrap: 'break-word', cursor: 'inherit' } }, { children: title })), _jsx("p", Object.assign({ style: { position: 'absolute', left: '125px', top: '35px', wordWrap: 'break-word', maxWidth: '260px', cursor: 'inherit' } }, { children: description }))] })));
}
SideMenuPanel.defaultProps = {
    onClick: () => { }
};
