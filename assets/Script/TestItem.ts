import QuadTreeNode from "./QuadTree";
import TestMain from "./TestIMain";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TestItem extends cc.Component {
    @property(cc.Label)
    eId: cc.Label = null;

    @property(cc.Label)
    eIds: cc.Label = null;

    @property
    speed: number = 10;

    direction = cc.v2(1,0)
    id: number = null;
    root: QuadTreeNode
    arr: cc.Node[];

    protected start(): void {
        this.direction.rotateSelf(Math.random() * 2 * Math.PI);
    }

    init(id: number, root: QuadTreeNode, arr: cc.Node[]) {
        this.id = id;
        this.root = root;
        this.arr = arr;
        this.eId.string = 'id: ' + id;
        this.node.name = '' + id;
    }

    check(nodes: cc.Node[]) {

    }

    update (dt) {
        let x = this.node.x + this.speed * this.direction.x;
        let y = this.node.y + this.speed * this.direction.y;
        if (x < 0 + this.node.width / 2 || x >= 800 - this.node.width / 2) {
            this.direction.x *= -1;
        }
        if (y < 0 + this.node.height / 2 || y >= 800 - this.node.height / 2) {
            this.direction.y *= -1;
        }
        x = Math.max(x, 0 + this.node.width / 2)
        x = Math.min(x, 800 - this.node.width / 2);
        y = Math.max(y, 0 + this.node.height / 2)
        y = Math.min(y, 800 - this.node.height / 2);
        this.node.x = x;
        this.node.y = y;

        if(TestMain.isOpenTree) {
            this.treeUpdate();
        } else {
            this.normalUpdate();
        }

    }
    
    normalUpdate() {
        let is = false;
        for (let i = 0; i < this.arr.length; i++) {
            const ele = this.arr[i];
            if (ele.uuid == this.node.uuid) {
                continue;
            }
            const rect1 = ele.getBoundingBoxToWorld();
            const rect2 = this.node.getBoundingBoxToWorld();
            if (rect1.intersects(rect2)) {
                is = true;
                break;
            }
        }
        if (is) {
            this.node.color = cc.color(255, 0, 0);
        } else {
            this.node.color = cc.color(255, 255, 255);
        }
    }
    
    treeUpdate() {
        const QuadTreeNode = this.root;
        if (QuadTreeNode) {
            const rect = this.node.getBoundingBoxToWorld();
            const nodes = QuadTreeNode.retrieve(rect);
            const arr: cc.Node[] = [];
            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i].uuid == this.node.uuid) {
                    continue;
                }
                const _rect = nodes[i].getBoundingBoxToWorld();
                if (rect.intersects(_rect)) {
                    arr.push(nodes[i]);
                    // break;
                }
            }
            if (arr.length) {
                this.node.color = cc.color(255, 0, 0);
                // this.eIds.string = arr.map(v=>v.name).join(', ')
            } else {
                this.node.color = cc.color(255, 255, 255);
                // this.eIds.string = '';
            }
        }
    }
}
