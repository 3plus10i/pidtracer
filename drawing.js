class DrawingManager {
    constructor(graphArea, trailCanvas, coordinateCanvas) {
        this.graphArea = graphArea;
        this.trailCanvas = trailCanvas;
        this.coordinateCanvas = coordinateCanvas;
        this.trailCtx = trailCanvas.getContext('2d');
        this.coordCtx = coordinateCanvas.getContext('2d');
        
        // 添加传递函数相关变量
        this.pGain = 0.5;
        this.iGain = 0.02;
        this.dGain = 0.2;
        
        // 添加采样率计算相关属性
        this.lastFrameTime = 0;
        this.currentSampleRate = 0;
        this.sampleRateFilter = 0; // 平滑过滤值
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
     * 更新PID参数值，用于显示传递函数
     */
    updatePIDParams(pGain, iGain, dGain) {
        this.pGain = pGain;
        this.iGain = iGain;
        this.dGain = dGain;
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
        const mirrorMode = Constants.CONTROL.MIRROR_MODE;
        
        this.coordCtx.clearRect(0, 0, width, height);

        // 确定起始线位置
        const startLineX = mirrorMode ? (width - beginOffset) : beginOffset;

        // 绘制起始竖线
        this.coordCtx.strokeStyle = Constants.COLORS.GRID_LINE;
        this.coordCtx.lineWidth = 1;
        this.coordCtx.beginPath();
        this.coordCtx.moveTo(startLineX, 0);
        this.coordCtx.lineTo(startLineX, height);
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
        
        // 垂直线 - 根据镜像模式调整
        if (mirrorMode) {
            // 镜像模式：从右向左均匀绘制
            for (let i = 0; i * xTickStep <= width; i++) {
                const x = width - i * xTickStep;
                this.coordCtx.beginPath();
                this.coordCtx.moveTo(x, 0);
                this.coordCtx.lineTo(x, height);
                this.coordCtx.stroke();
            }
        } else {
            // 标准模式：从左向右均匀绘制
            for (let x = 0; x < width; x += xTickStep) {
                this.coordCtx.beginPath();
                this.coordCtx.moveTo(x, 0);
                this.coordCtx.lineTo(x, height);
                this.coordCtx.stroke();
            }
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
        
        // X轴刻度，每5格显示一个数字
        const xTickCount = Math.floor(width / xTickStep);
        
        if (mirrorMode) {
            // 镜像模式：从右向左递增
            for (let i = 0; i < xTickCount; i += 5) {
                const x = width - (beginOffset + i * xTickStep);
                if (x < (width - beginOffset)) {  // 只显示起始线左侧的刻度
                    this.coordCtx.fillText(i.toString(), x, height / 2 + 5);
                }
            }
        } else {
            // 标准模式：从左向右递增
            for (let i = 0; i < xTickCount; i += 5) {
                const x = beginOffset + i * xTickStep;
                if (x > beginOffset) {  // 只显示起始线右侧的刻度
                    this.coordCtx.fillText(i.toString(), x, height / 2 + 5);
                }
            }
        }
        
        // 添加Y轴刻度标记（位置）
        this.coordCtx.textAlign = mirrorMode ? 'left' : 'right';
        this.coordCtx.textBaseline = 'middle';
        
        const midY = height / 2;
        const textPadding = 5;
        
        // 绘制y=0刻度
        const zeroLabelX = mirrorMode ? (startLineX + textPadding) : (startLineX - textPadding);
        this.coordCtx.fillText('0', zeroLabelX, midY);
        
        // 向上正值刻度
        for (let i = 1; i <= Math.floor(midY / yTickStep); i++) {
            const y = midY - i * yTickStep;
            if (i % 2 === 0) {  // 每隔2格显示一个数字
                const value = i * yTickStep;
                this.coordCtx.fillText(value.toString(), zeroLabelX, y);
            }
        }
        
        // 向下负值刻度
        for (let i = 1; i <= Math.floor((height - midY) / yTickStep); i++) {
            const y = midY + i * yTickStep;
            if (i % 2 === 0) {  // 每隔2格显示一个数字
                const value = -i * yTickStep;
                this.coordCtx.fillText(value.toString(), zeroLabelX, y);
            }
        }
        
        // 在绘制完坐标系后，添加传递函数显示
        this.drawTransferFunction();
    }
    
    /**
     * 绘制传递函数
     */
    drawTransferFunction() {
        const ctx = this.coordCtx;
        const width = this.coordinateCanvas.width;
        const mirrorMode = Constants.CONTROL.MIRROR_MODE;
        
        // 设置字体和样式
        ctx.font = '12px Arial';
        ctx.textAlign = mirrorMode ? 'left' : 'right';
        ctx.textBaseline = 'top';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        
        // 格式化参数值，保留三位小数
        const pValue = this.pGain.toFixed(3);
        const iValue = this.iGain.toFixed(3);
        const dValue = this.dGain.toFixed(3);
        
        // 绘制传递函数文本
        const padding = 10;
        const xPos = mirrorMode ? padding : width - padding;
        ctx.fillText(`G(s) = ${pValue} + ${iValue}/s + ${dValue}·s`, xPos, padding);
        
        // 在传递函数下方显示采样率
        if (this.currentDisplayText) {
            ctx.fillText(this.currentDisplayText, xPos, padding + 20);
        }
    }
    
    /**
     * 更新采样率计算
     * @param {number} currentTime - 当前时间戳
     */
    updateSampleRate(currentTime) {
        // 计算并显示采样率
        const now = currentTime;
        if (this.lastFrameTime) {
            const instantRate = 1000 / (now - this.lastFrameTime); // 瞬时采样率(Hz)
            
            // 使用低通滤波器平滑采样率显示
            this.sampleRateFilter = this.sampleRateFilter * 0.95 + instantRate * 0.05;
            
            // 显示真实采样率或设定的固定采样率
            if (Constants.CONTROL.FIXED_SAMPLE_TIME) {
                this.currentSampleRate = Constants.CONTROL.SAMPLE_RATE;
                this.currentDisplayText = `f = ${this.currentSampleRate} Hz`;
            } else {
                this.currentSampleRate = Math.round(this.sampleRateFilter);
                this.currentDisplayText = `f = ${this.currentSampleRate} Hz`;
            }
            
            // 每次更新采样率后，需要重绘传递函数区域
            this.updateInfoDisplay();
        }
        this.lastFrameTime = now;
    }
    
    /**
     * 更新信息显示区域（传递函数和采样率）
     */
    updateInfoDisplay() {
        const ctx = this.coordCtx;
        const width = this.coordinateCanvas.width;
        const infoWidth = 200; // 信息区域宽度
        const infoHeight = 50; // 信息区域高度
        const mirrorMode = Constants.CONTROL.MIRROR_MODE;
        
        // 根据镜像模式决定清除区域位置
        if (mirrorMode) {
            // 镜像模式 - 清除左上角
            ctx.clearRect(0, 0, infoWidth, infoHeight);
        } else {
            // 标准模式 - 清除右上角
            ctx.clearRect(width - infoWidth, 0, infoWidth, infoHeight);
        }
        
        // 重新绘制传递函数和采样率
        this.drawTransferFunction();
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
        const mirrorMode = Constants.CONTROL.MIRROR_MODE;
        
        this.trailCtx.clearRect(0, 0, width, height);
        this.trailCtx.lineWidth = 2;
        
        // 绘制直接跟随轨迹
        this.trailCtx.beginPath();
        this.trailCtx.strokeStyle = Constants.COLORS.DIRECT_TRAIL;
        
        let firstPoint = true;
        for (let i = 0; i < directYItems.length; i++) {
            let x;
            if (mirrorMode) {
                // 镜像模式：从右向左绘制
                x = width - beginOffset - i;
            } else {
                // 标准模式：从左向右绘制
                x = beginOffset + i;
            }
            
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
            let x;
            if (mirrorMode) {
                // 镜像模式：从右向左绘制
                x = width - beginOffset - i;
            } else {
                // 标准模式：从左向右绘制
                x = beginOffset + i;
            }
            
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