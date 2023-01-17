

import QuadTreeNode from "./QuadTree";

const {ccclass, property} = cc._decorator;

@ccclass
export default class TestGrid extends cc.Component {

    @property(cc.Prefab)
    eGrid: cc.Prefab = null;

    root: QuadTreeNode = null;
    map: {[id: number]: cc.Node} = {};

    init (root: QuadTreeNode) {
        this.root = root;
    }

    createGridNode(tree: QuadTreeNode) {
        const node = cc.instantiate(this.eGrid);
        node.parent = this.node;
        node.getChildByName('hor').width = tree.bounds.width;
        node.getChildByName('ver').height = tree.bounds.height;

        let x = tree.bounds.x + tree.bounds.width / 2;
        let y = tree.bounds.y + tree.bounds.height / 2;
        node.setPosition(this.node.convertToNodeSpaceAR(cc.v2(x, y)));

        return node;
    }

    protected lateUpdate(dt: number): void {
        this.refreshGrid(this.root);
    }

    refreshGrid(node: QuadTreeNode) {
        if (!this.map[node.id]) {
            this.map[node.id] = this.createGridNode(node);
        }
        this.map[node.id].opacity = node.isValid && node.children.length ? 255 : 1;

        for (let i = 0; i < node.children.length; i++) {
            const sub = node.children[i];
            this.refreshGrid(sub);
        }
    }

}
