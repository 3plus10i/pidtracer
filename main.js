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
    
    // 删除传递函数显示元素引用
    
    // 更新坐标标签
    function updateCoordinateLabels() {
        const height = graphArea.offsetHeight;
        const width = graphArea.offsetWidth;
        const centerY = height / 2;
        const beginOffset = Constants.GRAPH.BEGIN_OFFSET;
        const mirrorMode = Constants.CONTROL.MIRROR_MODE;
        
        // 计算相对于中心的坐标值
        const directYValue = Math.round((centerY - directY) * 2) / 2; // 精确到0.5
        const pidYValue = Math.round((centerY - pidY) * 2) / 2;
        
        // 更新标签文本 - 固定1位小数
        directLabel.textContent = directYValue.toFixed(1);
        pidLabel.textContent = pidYValue.toFixed(1);
        
        // 更新标签位置 - Y坐标
        directLabel.style.top = directY + 'px';
        pidLabel.style.top = pidY + 'px';
        
        // 更新标签位置 - X坐标（根据镜像模式）
        if (mirrorMode) {
            // 镜像模式 - 标签显示在右侧
            directLabel.style.left = (width - beginOffset + 10) + 'px';
            pidLabel.style.left = (width - beginOffset + 10) + 'px';
            directLabel.style.right = 'auto';
            pidLabel.style.right = 'auto';
        } else {
            // 标准模式 - 标签显示在左侧
            directLabel.style.left = (beginOffset - 10) + 'px';
            pidLabel.style.left = (beginOffset - 10) + 'px';
            directLabel.style.right = 'auto';
            pidLabel.style.right = 'auto';
        }
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
    
    // 删除updateTransferFunction函数，交由drawing.js中的逻辑处理
    
    // 按钮元素
    const resetBtn = document.getElementById('resetBtn');
    const clearBtn = document.getElementById('clearBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const screenshotBtn = document.getElementById('screenshotBtn');
    const helpBtn = document.getElementById('helpBtn');
    
    // 获取镜像按钮元素
    const mirrorBtn = document.getElementById('mirrorBtn');
    
    // 弹窗元素
    const helpModal = document.getElementById('helpModal');
    const closeBtn = document.querySelector('.close-btn');
    
    // 初始化位置
    let cursorY = graphArea.offsetHeight / 2;
    let directY = graphArea.offsetHeight / 2;
    let pidY = graphArea.offsetHeight / 2;
    let pidVelocity = 0; // 添加速度变量
    
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
    let isTracking = false;
    
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
        
        // 更新传递函数显示
        drawingManager.updatePIDParams(pGain, iGain, dGain);
        drawingManager.resizeCanvases(); // 重绘画布以更新传递函数
    });
    
    iGainSlider.addEventListener('input', function() {
        iGain = parseFloat(this.value);
        syncInputs('slider', iGainInput, iGain);
        pidController.updateParameters(pGain, iGain, dGain);
        
        // 更新传递函数显示
        drawingManager.updatePIDParams(pGain, iGain, dGain);
        drawingManager.resizeCanvases();
    });
    
    dGainSlider.addEventListener('input', function() {
        dGain = parseFloat(this.value);
        syncInputs('slider', dGainInput, dGain);
        pidController.updateParameters(pGain, iGain, dGain);
        
        // 更新传递函数显示
        drawingManager.updatePIDParams(pGain, iGain, dGain);
        drawingManager.resizeCanvases();
    });
    
    // 输入框事件监听
    pGainInput.addEventListener('change', function() {
        pGain = parseFloat(this.value);
        syncInputs('input', pGainSlider, pGain);
        pidController.updateParameters(pGain, iGain, dGain);
        
        // 更新传递函数显示
        drawingManager.updatePIDParams(pGain, iGain, dGain);
        drawingManager.resizeCanvases();
    });
    
    iGainInput.addEventListener('change', function() {
        iGain = parseFloat(this.value);
        syncInputs('input', iGainSlider, iGain);
        pidController.updateParameters(pGain, iGain, dGain);
        
        // 更新传递函数显示
        drawingManager.updatePIDParams(pGain, iGain, dGain);
        drawingManager.resizeCanvases();
    });
    
    dGainInput.addEventListener('change', function() {
        dGain = parseFloat(this.value);
        syncInputs('input', dGainSlider, dGain);
        pidController.updateParameters(pGain, iGain, dGain);
        
        // 更新传递函数显示
        drawingManager.updatePIDParams(pGain, iGain, dGain);
        drawingManager.resizeCanvases();
    });
    
    // 重置按钮
    resetBtn.addEventListener('click', function() {
        resetParameters();
    });
    
    // 清除轨迹按钮
    clearBtn.addEventListener('click', function() {
        clearTrails();
    });
    
    // 抽取重置参数功能为函数以便重用
    function resetParameters() {
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
        
        // 重置速度
        pidVelocity = 0;
        
        // 更新传递函数显示
        drawingManager.updatePIDParams(pGain, iGain, dGain);
        drawingManager.resizeCanvases();
    }
    
    // 抽取清除轨迹功能为函数以便重用
    function clearTrails() {
        const defaultValue = graphArea.offsetHeight / 2;
        directYQueue.clear(defaultValue);
        pidYQueue.clear(defaultValue);
        timeQueue.clear(0);
        
        // 重置速度
        pidVelocity = 0;
        
        // 清除画布
        drawingManager.drawTrail(directYQueue.getAll(), pidYQueue.getAll());
    }
    
    // 触摸事件处理
    graphArea.addEventListener('touchstart', function(e) {
        isTracking = true;
        graphArea.style.cursor = 'crosshair';
        handleTouch(e);
    });
    
    graphArea.addEventListener('touchmove', handleTouch);
    
    graphArea.addEventListener('touchend', function() {
        isTracking = false;
        graphArea.style.cursor = 'default';
    });
    
    function handleTouch(e) {
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
    
    // 鼠标事件处理
    graphArea.addEventListener('mousedown', function(e) {
        isTracking = true;
        graphArea.style.cursor = 'crosshair';
        
        // 立即更新跟踪点位置，不等待mousemove
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
    
    graphArea.addEventListener('mouseup', function() {
        isTracking = false;
        graphArea.style.cursor = 'default';
    });
    
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
    
    // 当鼠标离开区域时停止跟踪
    graphArea.addEventListener('mouseleave', function() {
        isTracking = false;
        graphArea.style.cursor = 'default';
    });
    
    // 模拟函数 - PID控制
    function simulateStep(currentTime) {
        // 使用PID控制器计算输出
        const result = pidController.compute(directY, pidY, currentTime);
        
        if (result.skip) return;
        
        if (Constants.CONTROL.ACCELERATION_CONTROL) {
            // 加速度控制模式：PID输出作为加速度
            const acceleration = result.output * Constants.CONTROL.ANIMATION_SPEED;
            
            // 更新速度
            pidVelocity += acceleration * result.deltaTime;
            
            // 应用阻尼/摩擦力 (模拟空气阻力)
            pidVelocity *= (1 - Constants.CONTROL.DAMPING_FACTOR);
            
            // 限制最大速度
            pidVelocity = Math.max(-Constants.CONTROL.MAX_VELOCITY, 
                         Math.min(Constants.CONTROL.MAX_VELOCITY, pidVelocity));
            
            // 根据速度更新位置
            pidY += pidVelocity * result.deltaTime;
        } else {
            // 原始速度控制模式
            pidY += result.output * result.deltaTime * Constants.CONTROL.ANIMATION_SPEED;
        }
        
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
        if (isPaused) {
            pauseBtn.textContent = Constants.BUTTONS.PAUSE_CONTENT_1;
            pauseBtn.classList.add('resume-btn');
        } else {
            pauseBtn.textContent = Constants.BUTTONS.PAUSE_CONTENT_0;
            pauseBtn.classList.remove('resume-btn');
        }
        
        if (!isPaused) {
            pidController.lastTime = performance.now();
            requestAnimationFrame(animate);
        }
    });
    
    // 镜像模式切换按钮
    mirrorBtn.addEventListener('click', function() {
        toggleMirrorMode();
    });
    
    // 添加一个专门更新圆点位置的函数
    function updateDotsPosition() {
        const width = graphArea.offsetWidth;
        const beginOffset = Constants.GRAPH.BEGIN_OFFSET;
        
        if (Constants.CONTROL.MIRROR_MODE) {
            // 镜像模式：点放在右侧
            directDot.style.left = (width - beginOffset) + 'px';
            pidDot.style.left = (width - beginOffset) + 'px';
        } else {
            // 标准模式：点放在左侧
            directDot.style.left = beginOffset + 'px';
            pidDot.style.left = beginOffset + 'px';
        }
    }
    
    // 镜像模式切换函数
    function toggleMirrorMode() {
        // 翻转镜像模式标志
        Constants.CONTROL.MIRROR_MODE = !Constants.CONTROL.MIRROR_MODE;
        
        // 更新按钮文本
        mirrorBtn.textContent = Constants.BUTTONS.MIRROR_CONTENT_0;
        
        // 更新点的位置
        updateDotsPosition();
        
        // 更新坐标标签位置
        updateCoordinateLabels();
        
        // 不清除轨迹，只重新绘制
        drawingManager.resizeCanvases();
        drawingManager.drawTrail(directYQueue.getAll(), pidYQueue.getAll());
    }
    
    // 键盘快捷键
    document.addEventListener('keydown', function(e) {
        if (e.key.toLowerCase() === 'p') {
            isPaused = !isPaused;
            if (isPaused) {
                pauseBtn.textContent = Constants.BUTTONS.PAUSE_CONTENT_1;
                pauseBtn.classList.add('resume-btn');
            } else {
                pauseBtn.textContent = Constants.BUTTONS.PAUSE_CONTENT_0;
                pauseBtn.classList.remove('resume-btn');
            }
            
            if (!isPaused) {
                pidController.lastTime = performance.now();
                requestAnimationFrame(animate);
            }
            e.preventDefault();
        } else if (e.key.toLowerCase() === 's') {
            takeScreenshot();
            e.preventDefault();
        } else if (e.key.toLowerCase() === 'r') {
            // 重置参数快捷键
            resetParameters();
            e.preventDefault();
        } else if (e.key.toLowerCase() === 'c') {
            // 清除轨迹快捷键
            clearTrails();
            e.preventDefault();
        } else if (e.key.toLowerCase() === 'm') {
            // 镜像模式快捷键
            toggleMirrorMode();
            e.preventDefault();
        }
    });
    
    // 截图功能
    function takeScreenshot() {
        // 暂停动画
        isPaused = true;
        pauseBtn.textContent = Constants.BUTTONS.PAUSE_CONTENT_1;
        pauseBtn.classList.add('resume-btn');
        
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
    
    // 添加采样率控制相关变量
    let lastSampleTime = 0;
    const sampleInterval = 1000 / Constants.CONTROL.SAMPLE_RATE; // 毫秒
    
    // 动画循环
    function animate(currentTime) {
        if (!isPaused) {
            // 检查是否需要进行采样和控制计算
            const timeElapsed = currentTime - lastSampleTime;
            
            if (Constants.CONTROL.FIXED_SAMPLE_TIME) {
                // 按固定采样率计算
                if (timeElapsed >= sampleInterval) {
                    lastSampleTime = currentTime - (timeElapsed % sampleInterval); // 保持精确的采样间隔
                    simulateStep(currentTime);
                }
            } else {
                // 按帧率计算
                simulateStep(currentTime);
            }
            
            // 绘制始终按帧率进行
            drawingManager.drawTrail(directYQueue.getAll(), pidYQueue.getAll());
            
            // 每帧更新采样率显示
            drawingManager.updateSampleRate(currentTime);
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
        
        // 设置初始点位置 - 移除此处的直接设置
        // directDot.style.left = beginOffset + 'px';
        // pidDot.style.left = beginOffset + 'px';
        updateDotsPosition(); // 使用新函数设置位置
        
        directDot.style.top = directY + 'px';
        pidDot.style.top = pidY + 'px';
        
        // 初始化坐标标签
        updateCoordinateLabels();
        
        // 删除单独的初始化传递函数调用
        // 保留传递函数参数更新
        drawingManager.updatePIDParams(pGain, iGain, dGain);
        
        // 设置初始鼠标指针样式
        graphArea.style.cursor = 'crosshair';
        
        // 更新按钮文本，显示快捷键信息
        resetBtn.textContent = Constants.BUTTONS.RESET_CONTENT;
        clearBtn.textContent = Constants.BUTTONS.CLEAR_CONTENT;
        pauseBtn.textContent = Constants.BUTTONS.PAUSE_CONTENT_0;
        mirrorBtn.textContent = Constants.BUTTONS.MIRROR_CONTENT_0;
        
        // 重置速度
        pidVelocity = 0;
        
        // 启动动画
        pidController.lastTime = performance.now();
        requestAnimationFrame(animate);
    }
    
    // 监听窗口大小变化
    window.addEventListener('resize', function() {
        drawingManager.resizeCanvases();
        updateDotsPosition(); // 在窗口大小变化时更新圆点位置
    });
    
    // 初始化应用
    init();
});
