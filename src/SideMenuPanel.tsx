import Constants from './Constants';

class SideMenuItem {
    id = '';
    title = '';
    row = 0;
    column = 0;
    rowCount = 0;
    columnCount = 0;
    minRowCount = 0;
    minColumnCount = 0;
}

export {SideMenuItem};

export default function SideMenuPanel(props: any) {
    const {
        id,
        title,
        description,
        imgSrc,
        onClick,
        minRowCount,
        minColumnCount,
        style
    } = props;

    const handleClick = (e: any) => {    
        onClick(e);
    };

    const handlePointerMove = (e: any) => {    
        let target = e.target;

        while (target) {
        if (target.className === Constants.Class_SideMenuPanel) {
            break;
        } else {
            target = target.parentElement;
        }
        }

        target.style.backgroundColor = 'cyan';
    };

    const handlePointerLeave = (e: any) => {
        let target = e.target;

        while (target) {
        if (target.className === Constants.Class_SideMenuPanel) {
            break;
        } else {
            target = target.parentElement;
        }
        }

        target.style.backgroundColor = 'white';
    };

    return (
        //@ts-ignore
        <div id={id} title={title} onClick={handleClick} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} className={Constants.Class_SideMenuPanel} minRowCount={minRowCount} minColumnCount={minColumnCount} style={style}>
            <img src={imgSrc} width='100px' height='100px' style={{position: 'absolute', left: '20px', top: '25px', cursor: 'inherit'}}></img>
            <h2 style={{position: 'absolute', left: '125px', wordWrap: 'break-word', cursor: 'inherit'}}>{title}</h2>
            <p style={{position: 'absolute', left: '125px', top: '35px', wordWrap: 'break-word', maxWidth: '260px', cursor: 'inherit'}}>{description}</p>
        </div>
    );
}

SideMenuPanel.defaultProps = {
    onClick: () => {}
};