import React from "react";
import Constants from './Constants';
import close from "./resources/closePanel.png";
import "./resources/DragMove.css";
import Contants from "./Constants";

export default function DragMove(props: any) {
    const {
        id,
        title,
        onLoad,
        onPointerDown,
        onPointerUp,
        onPointerEnter,
        onPointerLeave,
        row,
        rowCount,
        column,
        columnCount,
        minRowCount,
        minColumnCount,
        priority,
        style,
        children
    } = props;

    const handlePointerDown = (e: any) => {
        onPointerDown(e);
    };
    
    const handlePointerUp = (e: any) => {    
        onPointerUp(e);
    };

    const handlePointerEnter = (e: any) => {
        onPointerEnter(e);
    };

    const handlePointerLeave = (e: any) => {
        onPointerLeave(e);
    };

    return (
        //@ts-ignore
        <div id={id} onLoad={onLoad} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp} onMouseEnter={handlePointerEnter} onMouseLeave={handlePointerLeave} className={Constants.Class_DragMoveTag} row={row} column={column} rowCount={rowCount} columnCount={columnCount} minRowCount={minRowCount} minColumnCount={minColumnCount} priority={priority}
          style={style}>
            <div className='closed' style={{position: 'absolute', left: '0px', top: '0px', width: '100%', backgroundColor: 'rgb(133, 193, 233)', zIndex: 1}}>
                <p style={{height: '15px', marginLeft: '15px', marginTop: '5px', fontWeight: 'bold'}}>{title}</p>
            </div>
            <div style={{visibility: 'hidden', width: 'inherit', height: 'inherit', zIndex: 2, boxShadow: '0 0 0 3px black inset'}}>
                <img id={Contants.ID_CloseButton} src={close} alt="close" width='10px' height='10px' style={{position: 'absolute', cursor: 'pointer', right: '0%', top: '2px', width: '20px', height: '20px', marginTop: '3px', marginRight: '15px'}} />
            </div>
            {children}
        </div>
    );
}

DragMove.defaultProps = {
    onLoad: () => {},
    onPointerDown: () => {},
    onPointerUp: () => {},
    onPointerEnter: () => {},
    onPointerLeave: () => {}
};