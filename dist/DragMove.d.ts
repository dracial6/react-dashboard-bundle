/// <reference types="react" />
import "./resources/DragMove.css";
declare function DragMove(props: any): JSX.Element;
declare namespace DragMove {
    var defaultProps: {
        onLoad: () => void;
        onPointerDown: () => void;
        onPointerUp: () => void;
        onPointerEnter: () => void;
        onPointerLeave: () => void;
    };
}
export default DragMove;
