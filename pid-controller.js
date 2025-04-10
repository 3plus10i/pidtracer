class PIDController {
    constructor(pGain, iGain, dGain) {
        this.pGain = pGain;
        this.iGain = iGain;
        this.dGain = dGain;
        
        this.lastError = 0;
        this.integral = 0;
        this.lastTime = 0;
    }
    
    /**
     * 重置PID控制器状态
     */
    reset() {
        this.lastError = 0;
        this.integral = 0;
        this.lastTime = 0;
    }
    
    /**
     * 计算PID控制输出值
     * @param {number} setpoint - 目标值
     * @param {number} processVariable - 当前实际值
     * @param {number} currentTime - 当前时间（毫秒）
     * @returns {Object} - 包含输出值和计算状态的对象
     */
    compute(setpoint, processVariable, currentTime) {
        // 计算时间差（秒）
        const deltaTime = (currentTime - this.lastTime) / 1000;
        
        // 时间差异常时跳过计算
        if (deltaTime <= 0 || deltaTime > 0.1) {
            this.lastTime = currentTime;
            return {
                output: 0,
                error: 0,
                deltaTime: deltaTime,
                skip: true
            };
        }
        
        // 计算误差
        const error = setpoint - processVariable;
        
        // 计算积分项
        this.integral += error * deltaTime;
        
        // 限制积分项大小，防止积分饱和
        this.integral = Math.max(-Constants.PID.MAX_INTEGRAL, 
                           Math.min(Constants.PID.MAX_INTEGRAL, this.integral));
        
        // 计算微分项
        const derivative = (error - this.lastError) / deltaTime;
        
        // 计算PID输出
        const output = this.pGain * error + 
                       this.iGain * this.integral + 
                       this.dGain * derivative;
        
        // 保存当前误差用于下一次微分计算
        this.lastError = error;
        this.lastTime = currentTime;
        
        return {
            output: output,
            error: error,
            deltaTime: deltaTime,
            skip: false
        };
    }
    
    /**
     * 更新PID控制器参数
     * @param {number} pGain - 比例增益
     * @param {number} iGain - 积分增益
     * @param {number} dGain - 微分增益
     */
    updateParameters(pGain, iGain, dGain) {
        this.pGain = pGain;
        this.iGain = iGain;
        this.dGain = dGain;
    }
}