// PID跟踪器主控制模块
document.addEventListener('DOMContentLoaded', function() {
    // 获取DOM元素
    const graphArea = document.getElementById('graphArea');
    const trailCanvas = document.getElementById('trailCanvas');
    const coordinateCanvas = document.getElementById('coordinateCanvas');
    const directDot = document.getElementById('directDot');
    const pidDot = document.getElementById('pidDot');
    const directLabel = document.getElementById('directLabel');
    const pidLabel = document.getElementById('pidLabel');
    
    // 更新坐标标签
    function updateCoordinateLabels() {
        const height = graphArea.offsetHeight;
        const centerY = height / 2;
        
        // 计算相对于中心的坐标值
        const directYValue = Math.round((centerY - directY) * 2) / 2; // 精确到0.5
        const pidYValue = Math.round((centerY - pidY) * 2) / 2;
        
        // 更新标签文本 - 固定1位小数
        directLabel.textContent = directYValue.toFixed(1);
        pidLabel.textContent = pidYValue.toFixed(1);
        
        // 更新标签位置
        directLabel.style.top = directY + 'px';
        pidLabel.style.top = pidY + 'px';
    }
    
    // 参数控制元素
    const pGainSlider = document.getElementById('pGain');
    const iGainSlider = document.getElementById('iGain');
    const dGainSlider = document.getElementById('dGain');
    const pGainInput = document.getElementById('pGainInput');
    const iGainInput = document.getElementById('iGainInput');
    const dGainInput = document.getElementById('dGainInput');
    
    // 设置滑块和输入框的范围
    function setupRangeControls() {
        // 设置P参数范围
        pGainSlider.min = Constants.PID.P_RANGE.min;
        pGainSlider.max = Constants.PID.P_RANGE.max;
        pGainSlider.step = Constants.PID.P_RANGE.step;
        pGainInput.min = Constants.PID.P_RANGE.min;
        pGainInput.max = Constants.PID.P_RANGE.max;
        pGainInput.step = Constants.PID.P_RANGE.step;
        
        // 设置I参数范围
        iGainSlider.min = Constants.PID.I_RANGE.min;
        iGainSlider.max = Constants.PID.I_RANGE.max;
        iGainSlider.step = Constants.PID.I_RANGE.step;
        iGainInput.min = Constants.PID.I_RANGE.min;
        iGainInput.max = Constants.PID.I_RANGE.max;
        iGainInput.step = Constants.PID.I_RANGE.step;
        
        // 设置D参数范围
        dGainSlider.min = Constants.PID.D_RANGE.min;
        dGainSlider.max = Constants.PID.D_RANGE.max;
        dGainSlider.step = Constants.PID.D_RANGE.step;
        dGainInput.min = Constants.PID.D_RANGE.min;
        dGainInput.max = Constants.PID.D_RANGE.max;
        dGainInput.step = Constants.PID.D_RANGE.step;
    }
    
    // 按钮元素
    const resetBtn = document.getElementById('resetBtn');
    const clearBtn = document.getElementById('clearBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const screenshotBtn = document.getElementById('screenshotBtn');
    const helpBtn = document.getElementById('helpBtn');
    
    // 弹窗元素
    const helpModal = document.getElementById('helpModal');
    const closeBtn = document.querySelector('.close-btn');
    
    // 初始化位置
    let cursorY = graphArea.offsetHeight / 2;
    let directY = graphArea.offsetHeight / 2;
    let pidY = graphArea.offsetHeight / 2;
    
    // 获取常量
    const beginOffset = Constants.GRAPH.BEGIN_OFFSET;
    
    // 初始化PID控制参数
    let pGain = Constants.PID.DEFAULT_P_GAIN;
    let iGain = Constants.PID.DEFAULT_I_GAIN;
    let dGain = Constants.PID.DEFAULT_D_GAIN;
    
    // 初始化PID控制器
    const pidController = new PIDController(pGain, iGain, dGain);
    
    // 初始化绘图管理器
    const drawingManager = new DrawingManager(graphArea, trailCanvas, coordinateCanvas);
    
    // 轨迹数据队列
    const maxTrailLength = Constants.GRAPH.MAX_TRAIL_LENGTH;
    const directYQueue = new FixedQueue(maxTrailLength);
    const pidYQueue = new FixedQueue(maxTrailLength);
    const timeQueue = new FixedQueue(maxTrailLength);
    
    // 暂停状态
    let isPaused = false;
    
    // 鼠标跟踪状态
    let isTracking = true;
    
    // 更新队列数据
    function updateQueues(directY, pidY, currentTime) {
        directYQueue.pushFront(directY);
        pidYQueue.pushFront(pidY);
        timeQueue.pushFront(currentTime);
        
        // 更新坐标标签
        updateCoordinateLabels();
    }
    
    // 同步滑块和输入框
    function syncInputs(source, target, value) {
        if (source === 'slider') {
            target.value = value;
        } else {
            // 确保输入值在范围内
            const min = parseFloat(target.min);
            const max = parseFloat(target.max);
            const clampedValue = Math.max(min, Math.min(max, value));
            target.value = clampedValue;
        }
    }
    
    // 滑块事件监听
    pGainSlider.addEventListener('input', function() {
        pGain = parseFloat(this.value);
        syncInputs('slider', pGainInput, pGain);
        pidController.updateParameters(pGain, iGain, dGain);
    });
    
    iGainSlider.addEventListener('input', function() {
        iGain = parseFloat(this.value);
        syncInputs('slider', iGainInput, iGain);
        pidController.updateParameters(pGain, iGain, dGain);
    });
    
    dGainSlider.addEventListener('input', function() {
        dGain = parseFloat(this.value);
        syncInputs('slider', dGainInput, dGain);
        pidController.updateParameters(pGain, iGain, dGain);
    });
    
    // 输入框事件监听
    pGainInput.addEventListener('change', function() {
        pGain = parseFloat(this.value);
        syncInputs('input', pGainSlider, pGain);
        pidController.updateParameters(pGain, iGain, dGain);
    });
    
    iGainInput.addEventListener('change', function() {
        iGain = parseFloat(this.value);
        syncInputs('input', iGainSlider, iGain);
        pidController.updateParameters(pGain, iGain, dGain);
    });
    
    dGainInput.addEventListener('change', function() {
        dGain = parseFloat(this.value);
        syncInputs('input', dGainSlider, dGain);
        pidController.updateParameters(pGain, iGain, dGain);
    });
    
    // 重置按钮
    resetBtn.addEventListener('click', function() {
        pGain = Constants.PID.DEFAULT_P_GAIN;
        iGain = Constants.PID.DEFAULT_I_GAIN;
        dGain = Constants.PID.DEFAULT_D_GAIN;
        
        pGainSlider.value = pGain;
        iGainSlider.value = iGain;
        dGainSlider.value = dGain;
        
        pGainInput.value = pGain;
        iGainInput.value = iGain;
        dGainInput.value = dGain;
        
        // 重置PID控制器
        pidController.reset();
        pidController.updateParameters(pGain, iGain, dGain);
    });
    
    // 清除轨迹按钮
    clearBtn.addEventListener('click', function() {
        const defaultValue = graphArea.offsetHeight / 2;
        directYQueue.clear(defaultValue);
        pidYQueue.clear(defaultValue);
        timeQueue.clear(0);
        
        // 清除画布
        drawingManager.drawTrail(directYQueue.getAll(), pidYQueue.getAll());
    });
    
    // 触摸事件处理
    graphArea.addEventListener('touchstart', handleTouch);
    graphArea.addEventListener('touchmove', handleTouch);
    
    function handleTouch(e) {
        if (!isTracking) return; // 如果未跟踪，则跳过更新
        
        e.preventDefault(); // 防止滚动
        
        if (e.touches.length > 0) {
            const rect = graphArea.getBoundingClientRect();
            cursorY = e.touches[0].clientY - rect.top;
            
            // 确保光标在区域内
            cursorY = Math.max(0, Math.min(graphArea.offsetHeight, cursorY));
            
            // 更新直接跟随点位置
            directY = cursorY;
            directDot.style.top = directY + 'px';
            
            // 更新坐标标签
            updateCoordinateLabels();
        }
    }
    
    // 添加触摸点击事件 - 切换跟踪状态
    graphArea.addEventListener('touchend', function(e) {
        // 检测是否是轻触（tap）而不是滑动
        if (e.changedTouches.length === 1) {
            // 切换跟踪状态
            isTracking = !isTracking;
            
            // 更新鼠标指针样式以给出视觉反馈
            graphArea.style.cursor = isTracking ? 'crosshair' : 'default';
        }
    });
    
    // 鼠标移动事件
    graphArea.addEventListener('mousemove', function(e) {
        if (!isTracking) return; // 如果未跟踪，则跳过更新
        
        const rect = graphArea.getBoundingClientRect();
        cursorY = e.clientY - rect.top;
        
        // 确保光标在区域内
        cursorY = Math.max(0, Math.min(graphArea.offsetHeight, cursorY));
        
        // 更新直接跟随点位置
        directY = cursorY;
        directDot.style.top = directY + 'px';
        
        // 更新坐标标签
        updateCoordinateLabels();
    });
    
    // 当鼠标离开区域时停止更新
    graphArea.addEventListener('mouseleave', function() {
        // 不更新光标位置，保持最后位置
    });
    
    // 添加鼠标点击事件 - 切换跟踪状态
    graphArea.addEventListener('click', function(e) {
        // 切换跟踪状态
        isTracking = !isTracking;
        
        // 更新鼠标指针样式以给出视觉反馈
        graphArea.style.cursor = isTracking ? 'crosshair' : 'default';
        
        // 如果重新开始跟踪，立即更新目标位置
        if (isTracking) {
            const rect = graphArea.getBoundingClientRect();
            cursorY = e.clientY - rect.top;
            
            // 确保光标在区域内
            cursorY = Math.max(0, Math.min(graphArea.offsetHeight, cursorY));
            
            // 更新直接跟随点位置
            directY = cursorY;
            directDot.style.top = directY + 'px';
            
            // 更新坐标标签
            updateCoordinateLabels();
        }
    });
    
    // 模拟函数 - PID控制
    function simulateStep(currentTime) {
        // 使用PID控制器计算输出
        const result = pidController.compute(directY, pidY, currentTime);
        
        if (result.skip) return;
        
        // 更新PID控制点位置
        pidY += result.output * result.deltaTime * Constants.CONTROL.ANIMATION_SPEED;
        
        // 确保点不会超出边界
        pidY = Math.max(0, Math.min(graphArea.offsetHeight, pidY));
        
        // 更新PID控制点位置
        pidDot.style.top = pidY + 'px';
        
        // 更新轨迹数据
        updateQueues(directY, pidY, currentTime);
    }
    
    // 暂停/继续按钮
    pauseBtn.addEventListener('click', function() {
        isPaused = !isPaused;
        pauseBtn.textContent = isPaused ? Constants.BUTTONS.PAUSE_CONTENT_1 : Constants.BUTTONS.PAUSE_CONTENT_0;
        if (!isPaused) {
            pidController.lastTime = performance.now();
            requestAnimationFrame(animate);
        }
    });
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 'p') {
            isPaused = !isPaused;
            pauseBtn.textContent = isPaused ? Constants.BUTTONS.PAUSE_CONTENT_1 : Constants.BUTTONS.PAUSE_CONTENT_0;
            if (!isPaused) {
                pidController.lastTime = performance.now();
                requestAnimationFrame(animate);
            }
            e.preventDefault();
        } else if (e.key.toLowerCase() === 's') {
            takeScreenshot();
            e.preventDefault();
        }
    });
    
    // 截图功能
    function takeScreenshot() {
        // 暂停动画
        isPaused = true;
        pauseBtn.textContent = Constants.BUTTONS.PAUSE_CONTENT_1;
        
        // 获取图片URL
        const imageUrl = drawingManager.takeScreenshot();
        
        // 创建下载链接
        const link = document.createElement('a');
        link.download = 'pid-tracer-' + new Date().toISOString().replace(/[:.]/g, '-') + '.png';
        link.href = imageUrl;
        link.click();
    }
    
    // 截图按钮事件
    screenshotBtn.addEventListener('click', takeScreenshot);
    
    // 说明按钮点击事件
    helpBtn.addEventListener('click', function() {
        helpModal.classList.add('show');
    });
    
    // 关闭按钮点击事件
    closeBtn.addEventListener('click', function() {
        helpModal.classList.remove('show');
    });
    
    // 点击弹窗外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === helpModal) {
            helpModal.classList.remove('show');
        }
    });
    
    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && helpModal.classList.contains('show')) {
            helpModal.classList.remove('show');
        }
    });
    
    // 动画循环
    function animate(currentTime) {
        if (!isPaused) {
            simulateStep(currentTime);
            drawingManager.drawTrail(directYQueue.getAll(), pidYQueue.getAll());
        }
        requestAnimationFrame(animate);
    }
    
    // 初始化
    function init() {
        // 设置滑块和输入框范围
        setupRangeControls();
        
        // 设置初始控制参数值
        pGainSlider.value = Constants.PID.DEFAULT_P_GAIN;
        iGainSlider.value = Constants.PID.DEFAULT_I_GAIN;
        dGainSlider.value = Constants.PID.DEFAULT_D_GAIN;
        pGainInput.value = Constants.PID.DEFAULT_P_GAIN;
        iGainInput.value = Constants.PID.DEFAULT_I_GAIN;
        dGainInput.value = Constants.PID.DEFAULT_D_GAIN;
        
        // 设置画布尺寸
        drawingManager.resizeCanvases();
        
        // 设置初始点位置
        directDot.style.left = beginOffset + 'px';
        pidDot.style.left = beginOffset + 'px';
        directDot.style.top = directY + 'px';
        pidDot.style.top = pidY + 'px';
        
        // 初始化坐标标签
        updateCoordinateLabels();
        
        // 设置初始鼠标指针样式
        graphArea.style.cursor = 'crosshair';
        
        // 启动动画
        pidController.lastTime = performance.now();
        requestAnimationFrame(animate);
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        drawingManager.resizeCanvases();
    });
    
    // 初始化应用
    init();
});
