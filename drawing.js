class DrawingManager {
    constructor(graphArea, trailCanvas, coordinateCanvas) {
        this.graphArea = graphArea;
        this.trailCanvas = trailCanvas;
        this.coordinateCanvas = coordinateCanvas;
        this.trailCtx = trailCanvas.getContext('2d');
        this.coordCtx = coordinateCanvas.getContext('2d');
    }
    
    /**
     * 设置画布大小
     */
    resizeCanvases() {
        const width = this.graphArea.offsetWidth;
        const height = this.graphArea.offsetHeight;
        
        this.trailCanvas.width = width;
        this.trailCanvas.height = height;
        this.coordinateCanvas.width = width;
        this.coordinateCanvas.height = height;
        
        this.drawCoordinate();
    }
    
    /**
     * 绘制坐标系
     */
    drawCoordinate() {
        const width = this.coordinateCanvas.width;
        const height = this.coordinateCanvas.height;
        const beginOffset = Constants.GRAPH.BEGIN_OFFSET;
        const xTickStep = Constants.GRAPH.X_TICK_STEP;
        const yTickStep = Constants.GRAPH.Y_TICK_STEP;
        
        this.coordCtx.clearRect(0, 0, width, height);

        // 绘制起始竖线
        this.coordCtx.strokeStyle = Constants.COLORS.GRID_LINE;
        this.coordCtx.lineWidth = 1;
        this.coordCtx.beginPath();
        this.coordCtx.moveTo(beginOffset, 0);
        this.coordCtx.lineTo(beginOffset, height);
        this.coordCtx.stroke();
        
        // 绘制网格
        this.coordCtx.strokeStyle = Constants.COLORS.GRID_LINE;
        this.coordCtx.lineWidth = 1;
        
        // 水平线
        for (let y = 0; y < height; y += yTickStep) {
            this.coordCtx.beginPath();
            this.coordCtx.moveTo(0, y);
            this.coordCtx.lineTo(width, y);
            this.coordCtx.stroke();
        }
        
        // 垂直线
        for (let x = 0; x < width; x += xTickStep) {
            this.coordCtx.beginPath();
            this.coordCtx.moveTo(x, 0);
            this.coordCtx.lineTo(x, height);
            this.coordCtx.stroke();
        }
        
        // 中心线
        this.coordCtx.strokeStyle = Constants.COLORS.CENTER_LINE;
        this.coordCtx.beginPath();
        this.coordCtx.moveTo(0, height / 2);
        this.coordCtx.lineTo(width, height / 2);
        this.coordCtx.stroke();
        
        // 添加X轴刻度标记（时间）
        this.coordCtx.fillStyle = Constants.COLORS.LABEL_TEXT;
        this.coordCtx.font = '10px Arial';
        this.coordCtx.textAlign = 'center';
        this.coordCtx.textBaseline = 'top';
        
        // X轴刻度，从0开始，每5格显示一个数字
        for (let i = 0; i < Math.floor(width / xTickStep); i += 5) {
            const x = beginOffset + i * xTickStep;
            if (x > beginOffset) {  // 只显示圆点右侧的刻度
                this.coordCtx.fillText(i.toString(), x, height / 2 + 5);
            }
        }
        
        // 添加Y轴刻度标记（位置）
        this.coordCtx.textAlign = 'right';
        this.coordCtx.textBaseline = 'middle';
        
        // Y轴中心点为0，向上为正，向下为负
        const midY = height / 2;
        
        // 绘制y=0刻度
        this.coordCtx.fillText('0', beginOffset - 5, midY);
        
        // 向上正值刻度
        for (let i = 1; i <= Math.floor(midY / yTickStep); i++) {
            const y = midY - i * yTickStep;
            if (i % 2 === 0) {  // 每隔2格显示一个数字
                const value = i * yTickStep;
                this.coordCtx.fillText(value.toString(), beginOffset - 5, y);
            }
        }
        
        // 向下负值刻度
        for (let i = 1; i <= Math.floor((height - midY) / yTickStep); i++) {
            const y = midY + i * yTickStep;
            if (i % 2 === 0) {  // 每隔2格显示一个数字
                const value = -i * yTickStep;
                this.coordCtx.fillText(value.toString(), beginOffset - 5, y);
            }
        }
    }
    
    /**
     * 绘制轨迹
     * @param {Array} directYItems - 直接控制点Y坐标数组
     * @param {Array} pidYItems - PID控制点Y坐标数组
     */
    drawTrail(directYItems, pidYItems) {
        const width = this.trailCanvas.width;
        const height = this.trailCanvas.height;
        const beginOffset = Constants.GRAPH.BEGIN_OFFSET;
        
        this.trailCtx.clearRect(0, 0, width, height);
        this.trailCtx.lineWidth = 2;
        
        // 绘制直接跟随轨迹
        this.trailCtx.beginPath();
        this.trailCtx.strokeStyle = Constants.COLORS.DIRECT_TRAIL;
        
        let firstPoint = true;
        for (let i = 0; i < directYItems.length; i++) {
            const x = beginOffset + i;
            const y = directYItems[i];
            
            if (firstPoint) {
                this.trailCtx.moveTo(x, y);
                firstPoint = false;
            } else {
                this.trailCtx.lineTo(x, y);
            }
        }
        this.trailCtx.stroke();
        
        // 绘制PID控制轨迹
        this.trailCtx.beginPath();
        this.trailCtx.strokeStyle = Constants.COLORS.PID_TRAIL;
        
        firstPoint = true;
        for (let i = 0; i < pidYItems.length; i++) {
            const x = beginOffset + i;
            const y = pidYItems[i];
            
            if (firstPoint) {
                this.trailCtx.moveTo(x, y);
                firstPoint = false;
            } else {
                this.trailCtx.lineTo(x, y);
            }
        }
        this.trailCtx.stroke();
    }
    
    /**
     * 创建截图
     * @returns {string} 图片的data URL
     */
    takeScreenshot() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.trailCanvas.width;
        tempCanvas.height = this.trailCanvas.height;
        const ctx = tempCanvas.getContext('2d');
        
        // 绘制背景
        ctx.fillStyle = Constants.COLORS.BACKGROUND;
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // 绘制坐标和轨迹
        ctx.drawImage(this.coordinateCanvas, 0, 0);
        ctx.drawImage(this.trailCanvas, 0, 0);
        
        return tempCanvas.toDataURL('image/png');
    }
}