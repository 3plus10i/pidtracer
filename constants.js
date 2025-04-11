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
        DEFAULT_P_GAIN: 3,
        DEFAULT_I_GAIN: 2,
        DEFAULT_D_GAIN: 0.2,
        
        // 滑块范围配置
        P_RANGE: {min: 0, max: 10, step: 0.1},
        I_RANGE: {min: 0, max: 10, step: 0.1},
        D_RANGE: {min: 0, max: 1, step: 0.01},
        
        // 积分限制
        MAX_INTEGRAL: 1000
    },

    // 按钮区域
    BUTTONS: {
        PAUSE_CONTENT_0: '暂停(P)',
        PAUSE_CONTENT_1: '继续(P)',
        RESET_CONTENT: '重置参数(R)',
        CLEAR_CONTENT: '清除轨迹(C)',
    },
    
    // 控制与交互配置
    CONTROL: {
        ANIMATION_SPEED: 10, // PID控制点移动速度因子
        FIXED_SAMPLE_TIME: true, // 是否使用固定采样时间
        SAMPLE_RATE: 60, // 固定采样率(Hz)
        ACCELERATION_CONTROL: true, // 使用加速度控制模式
        MAX_VELOCITY: 800, // 最大速度限制
        DAMPING_FACTOR: 0.0, // 阻尼系数/摩擦力(空气阻力)
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