/// <reference types="react" />
declare class SideMenuItem {
    id: string;
    title: string;
    row: number;
    column: number;
    rowCount: number;
    columnCount: number;
    minRowCount: number;
    minColumnCount: number;
}
export { SideMenuItem };
declare function SideMenuPanel(props: any): JSX.Element;
declare namespace SideMenuPanel {
    var defaultProps: {
        onClick: () => void;
    };
}
export default SideMenuPanel;
