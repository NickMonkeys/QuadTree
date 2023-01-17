import QuadTreeNode from "./QuadTree";
import TestGrid from "./TestGrid";
import TestItem from "./TestItem";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TestMain extends cc.Component {
    public static isOpenTree = true;

    @property(cc.Node)
    layer: cc.Node = null;

    @property(cc.Prefab)
    item: cc.Prefab = null;

    @property(TestGrid)
    grid: TestGrid = null;

    rootNode: QuadTreeNode = null;
    itemArr: cc.Node[] = [];
    itemNum = 1000;

    start () {
        
        this.reset();
    }
    
    reset() {
        this.layer.destroyAllChildren();
        this.itemArr = [];
        this.rootNode = new QuadTreeNode(this.layer.getBoundingBoxToWorld());
        for (let index = 0; index < this.itemNum; index++) {
            const item = cc.instantiate(this.item);
            item.parent = this.layer;
            item.position = this.getRandomPos();
            item.getComponent(TestItem).init(index, this.rootNode, this.itemArr);
            
            this.itemArr.push(item);
            this.rootNode.insert(item);
        }
        this.grid.init(this.rootNode);
        cc.log('reset', this.rootNode)
        
    }

    getRandomPos() {
        let x = Math.random() * 800;
        let y = Math.random() * 800;

        x = Math.max(x, 0 + this.item.data.width / 2)
        x = Math.min(x, 800 - this.item.data.width / 2);
        y = Math.max(y, 0 + this.item.data.height / 2)
        y = Math.min(y, 800 - this.item.data.height / 2);

        return cc.v3(x,y);
    }

    update() {
        this.rootNode.refresh();
    }

    onClickOpen(toggle: cc.Toggle) {
        TestMain.isOpenTree = toggle.isChecked;
    }

    onEditChange(edit: cc.EditBox) {
        cc.log(edit.string);
        const num = Number(edit.string);
        if (!num || num == this.itemNum) {
            edit.string = this.itemNum + '';
        } else {
            this.itemNum = num;
            this.reset();
        }
    }
}
