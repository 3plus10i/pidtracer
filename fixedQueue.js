/**
 * 固定长度的循环队列实现
 * @param {number} maxSize 队列最大长度
 */
function FixedQueue(maxSize) {
    this.maxSize = maxSize;
    this.queue = new Array(maxSize);
    this.front = 0;  // 队列头部指针
    this.rear = -1;  // 队列尾部指针
    this.size = 0;   // 当前队列大小
    
    /**
     * 从尾部添加元素
     * @param {*} item 要添加的元素
     */
    this.push = function(item) {
        this.rear = (this.rear + 1) % this.maxSize;
        this.queue[this.rear] = item;
        
        if (this.size < this.maxSize) {
            this.size++;
        } else {
            this.front = (this.front + 1) % this.maxSize;
        }
    };
    
    /**
     * 从头部添加元素
     * @param {*} item 要添加的元素
     */
    this.pushFront = function(item) {
        this.front = (this.front - 1 + this.maxSize) % this.maxSize;
        this.queue[this.front] = item;
        
        if (this.size < this.maxSize) {
            this.size++;
        } else {
            this.rear = (this.rear - 1 + this.maxSize) % this.maxSize;
        }
    };
    
    /**
     * 获取队列中所有元素（按先进先出顺序）
     * @returns {Array} 队列内容数组
     */
    this.getAll = function() {
        const result = [];
        for (let i = 0; i < this.size; i++) {
            const index = (this.front + i) % this.maxSize;
            result.push(this.queue[index]);
        }
        return result;
    };
    
    /**
     * 清空队列
     * @param {*} defaultValue 清空后的默认值
     */
    this.clear = function(defaultValue) {
        this.front = 0;
        this.rear = -1;
        this.size = 0;
        if (defaultValue !== undefined) {
            for (let i = 0; i < this.maxSize; i++) {
                this.queue[i] = defaultValue;
            }
        }
    };
    
    /**
     * 获取队列当前大小
     * @returns {number} 队列元素数量
     */
    this.getSize = function() {
        return this.size;
    };
}