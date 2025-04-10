// 提示框功能
document.addEventListener('DOMContentLoaded', function() {
    // 创建tooltip元素
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);
    
    // 提示内容
    const tooltipContent = {
        'p-info': 'Kp: 增大可加快响应但可能增加超调，减小则响应缓慢',
        'i-info': 'Ki: 消除静态误差，但过大可能导致振荡',
        'd-info': 'Kd: 抑制超调，改善稳定性，但过大可能放大噪声'
    };
    
    // 获取所有信息图标
    const infoIcons = document.querySelectorAll('.info-icon');
    
    // 为每个图标添加鼠标事件
    infoIcons.forEach(icon => {
        // 鼠标进入显示提示
        icon.addEventListener('mouseenter', function(e) {
            const content = tooltipContent[this.id];
            if (!content) return;
            
            tooltip.textContent = content;
            tooltip.style.display = 'block';
            
            // 计算位置，确保提示框在视口内
            positionTooltip(e);
        });
        
        // 鼠标移动时更新位置
        icon.addEventListener('mousemove', positionTooltip);
        
        // 鼠标离开隐藏提示
        icon.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
        });
    });
    
    // 移动提示框到鼠标位置
    function positionTooltip(e) {
        const x = e.clientX;
        const y = e.clientY;
        
        // 获取提示框尺寸
        const tooltipWidth = tooltip.offsetWidth;
        const tooltipHeight = tooltip.offsetHeight;
        
        // 获取视口尺寸
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 计算位置，确保提示框不超出视口
        let left = x + 15; // 在光标右侧偏移15px
        let top = y + 15;  // 在光标下方偏移15px
        
        // 如果右侧空间不足，显示在左侧
        if (left + tooltipWidth > viewportWidth) {
            left = x - tooltipWidth - 15;
        }
        
        // 如果下方空间不足，显示在上方
        if (top + tooltipHeight > viewportHeight) {
            top = y - tooltipHeight - 15;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    }
});
