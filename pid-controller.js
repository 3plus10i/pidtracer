class PIDController {
    constructor(pGain, iGain, dGain) {
        this.pGain = pGain;
        this.iGain = iGain;
        this.dGain = dGain;
        
        this.lastError = 0;
        this.integral = 0;
        this.lastTime = 0;
        this.fixedDeltaTime = 1.0 / Constants.CONTROL.SAMPLE_RATE; // 固定采样时间(秒)
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
        // 根据配置选择固定采样时间或实际时间差
        let deltaTime;
        if (Constants.CONTROL.FIXED_SAMPLE_TIME) {
            deltaTime = this.fixedDeltaTime;
        } else {
            // 计算实际时间差（秒）
            deltaTime = (currentTime - this.lastTime) / 1000;
            
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
        }
        
        // 计算误差
        const error = setpoint - processVariable;
        
        // 计算各个控制分量
        const pTerm = this.pGain * error;
        
        // 计算积分项
        this.integral += error * deltaTime;
        
        // 限制积分项大小，防止积分饱和
        this.integral = Math.max(-Constants.PID.MAX_INTEGRAL, 
                           Math.min(Constants.PID.MAX_INTEGRAL, this.integral));
        const iTerm = this.iGain * this.integral;
        
        // 计算微分项
        const derivative = (error - this.lastError) / deltaTime;
        const dTerm = this.dGain * derivative;
        
        // 计算PID输出
        const output = pTerm + iTerm + dTerm;
        
        // 保存当前误差用于下一次微分计算
        this.lastError = error;
        this.lastTime = currentTime;
        
        return {
            output: output,
            error: error,
            pTerm: pTerm,
            iTerm: iTerm,
            dTerm: dTerm,
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