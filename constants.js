// 常量和默认配置值管理
const Constants = {
    // 图形区域配置
    GRAPH: {
        BEGIN_OFFSET: 50,      // 起始位置偏移量（左侧）
        X_TICK_STEP: 50,       // x轴刻度间隔
        Y_TICK_STEP: 40,       // y轴刻度间隔
        MAX_TRAIL_LENGTH: 1000 // 轨迹最大长度
    },
    
    // PID控制器默认参数
    PID: {
        DEFAULT_P_GAIN: 0.5,
        DEFAULT_I_GAIN: 0.02,
        DEFAULT_D_GAIN: 0.01,
        
        // 滑块范围配置
        P_RANGE: {min: 0, max: 3, step: 0.001},
        I_RANGE: {min: 0, max: 1.0, step: 0.001},
        D_RANGE: {min: 0, max: 0.1, step: 0.001},
        
        // 积分限制
        MAX_INTEGRAL: 1000
    },

    // 按钮区域
    BUTTONS: {
        PAUSE_CONTENT_0: '暂停(P)',
        PAUSE_CONTENT_1: '继续(P)',

    },
    
    // 控制与交互配置
    CONTROL: {
        ANIMATION_SPEED: 10, // PID控制点移动速度因子
    },
    
    // 颜色配置
    COLORS: {
        DIRECT_TRAIL: 'rgba(234, 67, 53, 0.7)',
        PID_TRAIL: 'rgba(66, 133, 244, 0.7)',
        GRID_LINE: '#eee',
        CENTER_LINE: '#ccc',
        LABEL_TEXT: '#999',
        BACKGROUND: 'white'
    }
};