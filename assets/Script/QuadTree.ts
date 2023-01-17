
/**
 * 四叉树节点
 */
export default class QuadTreeNode {
    private static MAX_OBJ_NUM = 4;
    private static MAX_LEVEL = 4;
    private static id = 0;

    private level: number = -1; // 节点深度
    private objects: cc.Node[] = null; // 物体元素
    public children: QuadTreeNode[] = null; // 子节点
    public bounds: cc.Rect = null; // 节点代表点象限在屏幕中的区域
    public isValid = false; // 区域内是否有物体
    public id = -1;

    constructor(bounds: cc.Rect, level = 0) {
        this.objects = [];
        this.level = level;
        this.children = [];
        this.bounds = bounds;
        this.id = QuadTreeNode.id++;
    }

    // 获取物体所在象限[0~3]
    getIndex(rect: cc.Rect) {
        const bounds = this.bounds;
        const onTop = rect.y >= bounds.center.y;
        const onBottom = rect.y + rect.height <= bounds.center.y;
        const onLeft = rect.x + rect.width <= bounds.center.x;
        const onRight = rect.x >= bounds.center.x;
        if (onTop) {
            if (onRight) {
                return 0;
            }else if (onLeft) {
                return 1;
            }
        } else if (onBottom) {
            if (onLeft) {
                return 2;
            }else if (onRight) {
                return 3;
            }
        }
        // 到这里说明跨象限了，返回-1，放在父节点
        return -1;
    }

    // 象限切割
    split() {
        const bounds = this.bounds;
        const subW = bounds.width / 2;
        const subH = bounds.height / 2;
        const node0 = new QuadTreeNode(cc.rect(bounds.center.x, bounds.center.y, subW, subH), this.level + 1);
        const node1 = new QuadTreeNode(cc.rect(bounds.x, bounds.center.y, subW, subH), this.level + 1);
        const node2 = new QuadTreeNode(cc.rect(bounds.x, bounds.y, subW, subH), this.level + 1);
        const node3 = new QuadTreeNode(cc.rect(bounds.center.x, bounds.y, subW, subH), this.level + 1);
        this.children.push(node0, node1, node2, node3);
    }

    // 插入物体
    insert(obj: cc.Node) {
        const rect = obj.getBoundingBoxToWorld();
        // 有自节点的话插入子节点中
        if (this.children.length) {
            const idx = this.getIndex(rect);
            if (idx >= 0) {
                this.children[idx].insert(obj);
                return;
            }
        }

        // 放入当前节点
        this.objects.push(obj);
        obj['QuadTreeNode'] = this;

        // 判断是否需求切割象限
        if (!this.children.length && this.objects.length > QuadTreeNode.MAX_OBJ_NUM && this.level < QuadTreeNode.MAX_LEVEL) {
            this.split();

            const objects = [];
            this.objects.forEach((obj) => {
                const rect = obj.getBoundingBoxToWorld();
                const idx = this.getIndex(rect);
                if (idx < 0) {
                    objects.push(obj);
                } else {
                    this.children[idx].insert(obj);
                }
            });
            this.objects = objects;
        }
    }

    // 筛选出可能出现碰撞的物体(为了方便切割，参数使用Rect，返回结果将包含自己)
    retrieve(rect: cc.Rect) {
        let result: cc.Node[] = [];
        if (this.children.length) {
            const idx = this.getIndex(rect);
            if (idx >= 0) {
                // 递归添加所有子节点中的
                result = result.concat(this.children[idx].retrieve(rect));
            } else {
                // 将obj切割
                const arr = this.carve(rect);
                // 将切割的每一块进行筛选
                arr.forEach((_rect) => {
                    const idx = this.getIndex(_rect);
                    if (idx < 0) {
                        debugger
                    }
                    result = result.concat(this.children[idx].retrieve(_rect));
                });
            }
        }
        // 将当前节点上的全部添加
        result = result.concat(this.objects);
        return result;
    }

    // 将矩形向四个象限切割
    carve(rect: cc.Rect) {
        let rects: cc.Rect[] = [];
        this.children.forEach((node) => {
            if (node.bounds.intersects(rect)) {
                const re = node.bounds.intersection(cc.rect(), rect);
                rects.push(re);

            }
        });
        return rects;
    }

    // 判断举行是否在象限内
    isInner(rect: cc.Rect, bounds: cc.Rect) {
        return bounds.containsRect(rect);
    }

    refresh() {
        this.refreshObj(this);
        this.refreshValid();
    }

    // 动态刷新四叉树，找出离开原来象限的物体并重新插入
    refreshObj(root: QuadTreeNode) {
        root = root || this;

        const objs = this.objects;
        for (let i = objs.length - 1; i >= 0; i--) {
            const obj = objs[i];
            const rect = obj.getBoundingBoxToWorld();
            // 物体是否在这个象限
            if (!this.isInner(rect, this.bounds)) {
                if (root != this) {
                    root.insert(objs.splice(i, 1)[0]);
                }
            // 在当前象限，重新插入（当前象限有子象限的话这样会被插入到子象限）
            } else if (this.children.length) {
                this.insert(objs.splice(i, 1)[0]);
            }
        }

        // 递归所有子象限
        for (let i = 0; i < this.children.length; i++) {
            this.children[i].refreshObj(root);
        }
    }

    refreshValid() {
        if (this.children.length) {
            this.isValid = false;
            for (let i = 0; i < this.children.length; i++) {
                const node = this.children[i];
                const isValid = node.refreshValid();
                if (isValid) {
                    this.isValid = true;
                }
            }
            if (this.isValid) {
                return this.isValid;
            } else {
                this.children.length = 0;
            }
        }
        this.isValid = this.objects.length > 0;
        return this.isValid;
    }
}

/**
 * [参考1]https://blog.csdn.net/qq276592716/article/details/45999831
 */

/**
 * 1.属性
 *      当前节点的矩形
 *      当前节点的物体容器
 *      当前节点的四个子节点
 *      当前节点的等级
 * 2.插入物体
 *      有子节点的话，获取到新物体在当前节点的象限
 *      获取到这个象限的对应子节点，继续插入到这个子节点
 *      如果物体跨象限了，就放在当前节点，不继续向下插入
 *      如果当前节点物体数量到达上限，就切割当前节点（创建子节点）
 *      然后将当前节点的所有物体插入到子节点中
 * 
 * 3.获取一个物体的碰撞关系
 *      有子节点的话找到目标物体在哪个子节点中
 *      然后去子节点中寻找碰撞关系，依次递归
 *      如果出现跨象限的情况，那就切过物体，不同部分在不同象限继续递归
 *      然后依次将所在象限的物体添加的碰撞列表
 * 
 * 4.刷新
 *      判断当前节点的所有物体是否在其当前节点的区域中
 *      不在的话从当前节点取出来，重新从根节点插入
 *      在当前象限的话重新从当前节点插入
 *      对所有子节点所相同刷新操作
 *      
 */

// 参考资料:https://blog.csdn.net/qq276592716/article/details/45999831