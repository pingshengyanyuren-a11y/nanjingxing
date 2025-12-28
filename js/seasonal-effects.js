/**
 * SeasonalEffects V3 - 南京四季背景粒子系统（精美SVG版）
 * 使用精心设计的SVG路径绘制高质量粒子
 */
class SeasonalEffects {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.maxParticles = 50;
        this.isActive = false;
        this.isEnabled = true;
        this.currentSeason = 'spring';
        this.animationId = null;
        this.svgImages = {};

        // 堆积系统配置
        this.accumulatedParticles = []; // 堆积的粒子
        this.maxAccumulated = 80; // 最大堆积数量
        this.accumulationZone = 60; // 底部堆积区域高度

        this.initCanvas();
        this.loadSVGImages();
        window.addEventListener('resize', () => this.resize());
    }

    initCanvas() {
        this.canvas.id = 'seasonal-effects-canvas';
        this.canvas.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            pointer-events: none; z-index: 5; opacity: 0;
            transition: opacity 1.5s ease-in-out;
        `;
        document.body.prepend(this.canvas);
        this.resize();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // 预加载SVG为Image对象
    loadSVGImages() {
        const svgData = {
            spring: [
                // 樱花瓣1 - 经典心形
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="sg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFD0DC"/><stop offset="100%" style="stop-color:#FFB6C1"/></linearGradient></defs><path fill="url(#sg1)" d="M25 45 C10 30 0 20 10 10 C20 0 25 10 25 15 C25 10 30 0 40 10 C50 20 40 30 25 45Z"/></svg>`,
                // 樱花瓣2 - 圆润花瓣
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFC0CB"/><stop offset="100%" style="stop-color:#FF69B4"/></linearGradient></defs><ellipse fill="url(#sg2)" cx="25" cy="25" rx="20" ry="12" transform="rotate(-30 25 25)"/></svg>`,
                // 樱花瓣3 - 水滴形
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><radialGradient id="sg3" cx="30%" cy="30%"><stop offset="0%" style="stop-color:#FFEEF2"/><stop offset="100%" style="stop-color:#FFB7C5"/></radialGradient></defs><path fill="url(#sg3)" d="M25 5 Q40 25 25 45 Q10 25 25 5Z"/></svg>`,
                // 樱花瓣4 - 不规则花瓣
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="sg4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFDDE6"/><stop offset="100%" style="stop-color:#FFA0B4"/></linearGradient></defs><path fill="url(#sg4)" d="M25 8 C35 12 42 20 40 32 C38 42 28 46 20 42 C12 38 8 28 12 18 C16 10 22 6 25 8Z"/></svg>`
            ],
            summer: [
                // 绿叶1 - 柳叶
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#90EE90"/><stop offset="100%" style="stop-color:#228B22"/></linearGradient></defs><path fill="url(#lg1)" d="M25 5 Q38 25 25 45 Q12 25 25 5Z"/><line x1="25" y1="10" x2="25" y2="40" stroke="#2E8B57" stroke-width="1"/></svg>`,
                // 绿叶2 - 椭圆叶
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#7CFC00"/><stop offset="100%" style="stop-color:#32CD32"/></linearGradient></defs><ellipse fill="url(#lg2)" cx="25" cy="25" rx="12" ry="20"/><line x1="25" y1="8" x2="25" y2="42" stroke="#006400" stroke-width="1.5"/><path d="M25 15 Q18 20 15 25" stroke="#006400" stroke-width="0.8" fill="none"/><path d="M25 15 Q32 20 35 25" stroke="#006400" stroke-width="0.8" fill="none"/><path d="M25 25 Q20 30 17 35" stroke="#006400" stroke-width="0.8" fill="none"/><path d="M25 25 Q30 30 33 35" stroke="#006400" stroke-width="0.8" fill="none"/></svg>`,
                // 绿叶3 - 心形叶
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="lg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#98FB98"/><stop offset="100%" style="stop-color:#3CB371"/></linearGradient></defs><path fill="url(#lg3)" d="M25 10 C15 10 10 20 10 28 C10 38 25 45 25 45 C25 45 40 38 40 28 C40 20 35 10 25 10Z"/></svg>`,
                // 绿叶4 - 银杏叶
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="lg4" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" style="stop-color:#ADFF2F"/><stop offset="100%" style="stop-color:#6B8E23"/></linearGradient></defs><path fill="url(#lg4)" d="M25 45 L25 30 Q10 25 8 15 Q15 5 25 10 Q35 5 42 15 Q40 25 25 30Z"/></svg>`
            ],
            autumn: [
                // 枫叶1 - 经典五角
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="ag1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FF4500"/><stop offset="100%" style="stop-color:#8B0000"/></linearGradient></defs><path fill="url(#ag1)" d="M25 5 L28 15 L40 10 L32 20 L45 25 L32 28 L38 40 L25 32 L12 40 L18 28 L5 25 L18 20 L10 10 L22 15 Z"/></svg>`,
                // 枫叶2 - 深红枫叶
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><radialGradient id="ag2" cx="50%" cy="50%"><stop offset="0%" style="stop-color:#FF6347"/><stop offset="100%" style="stop-color:#B22222"/></radialGradient></defs><path fill="url(#ag2)" d="M25 5 L30 18 L45 12 L35 25 L48 30 L35 35 L42 48 L25 38 L8 48 L15 35 L2 30 L15 25 L5 12 L20 18 Z"/><line x1="25" y1="38" x2="25" y2="48" stroke="#8B4513" stroke-width="2"/></svg>`,
                // 枫叶3 - 橙黄枫叶
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="ag3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFA500"/><stop offset="50%" style="stop-color:#FF8C00"/><stop offset="100%" style="stop-color:#DC143C"/></linearGradient></defs><path fill="url(#ag3)" d="M25 3 L28 12 L38 8 L33 18 L45 22 L34 26 L40 38 L25 30 L10 38 L16 26 L5 22 L17 18 L12 8 L22 12 Z"/></svg>`,
                // 落叶 - 褐色卷曲
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="ag4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#CD853F"/><stop offset="100%" style="stop-color:#8B4513"/></linearGradient></defs><path fill="url(#ag4)" d="M15 10 Q25 5 35 12 Q42 22 38 35 Q30 45 20 42 Q10 38 8 25 Q8 15 15 10Z"/><path d="M20 15 Q28 25 22 38" stroke="#654321" stroke-width="1" fill="none"/></svg>`
            ],
            winter: [
                // 雪花1 - 六角晶体
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><defs><linearGradient id="wg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FFFFFF"/><stop offset="100%" style="stop-color:#E0FFFF"/></linearGradient></defs><g fill="none" stroke="url(#wg1)" stroke-width="2" stroke-linecap="round"><line x1="25" y1="5" x2="25" y2="45"/><line x1="25" y1="5" x2="20" y2="12"/><line x1="25" y1="5" x2="30" y2="12"/><line x1="25" y1="45" x2="20" y2="38"/><line x1="25" y1="45" x2="30" y2="38"/><line x1="7" y1="15" x2="43" y2="35"/><line x1="7" y1="15" x2="14" y2="12"/><line x1="7" y1="15" x2="10" y2="22"/><line x1="43" y1="35" x2="36" y2="38"/><line x1="43" y1="35" x2="40" y2="28"/><line x1="7" y1="35" x2="43" y2="15"/><line x1="7" y1="35" x2="10" y2="28"/><line x1="7" y1="35" x2="14" y2="38"/><line x1="43" y1="15" x2="36" y2="12"/><line x1="43" y1="15" x2="40" y2="22"/></g></svg>`,
                // 雪花2 - 简约雪花
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><circle cx="25" cy="25" r="8" fill="rgba(255,255,255,0.9)"/><g stroke="white" stroke-width="2"><line x1="25" y1="5" x2="25" y2="45"/><line x1="5" y1="25" x2="45" y2="25"/><line x1="10" y1="10" x2="40" y2="40"/><line x1="40" y1="10" x2="10" y2="40"/></g></svg>`,
                // 雪花3 - 星形雪花
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><polygon fill="rgba(255,255,255,0.85)" points="25,2 28,20 45,15 32,25 45,35 28,30 25,48 22,30 5,35 18,25 5,15 22,20"/></svg>`,
                // 雪点
                `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><circle cx="25" cy="25" r="12" fill="rgba(255,255,255,0.7)"/><circle cx="25" cy="25" r="6" fill="rgba(255,255,255,0.9)"/></svg>`
            ]
        };

        // 将SVG转换为Image对象
        for (const season in svgData) {
            this.svgImages[season] = svgData[season].map(svg => {
                const img = new Image();
                img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
                return img;
            });
        }
    }

    setSeason(season) {
        if (this.currentSeason === season) return;
        this.currentSeason = season;
        console.log(`切换季节效果为: ${season}`);
        this.particles = [];
        this.accumulatedParticles = []; // 切换季节时清除堆积
        if (this.isActive) this.initParticles();
    }

    toggle() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) this.stop();
        else if (this.isActive) this.start();
        return this.isEnabled;
    }

    start() {
        if (!this.isEnabled || this.isActive) return;
        this.isActive = true;
        this.canvas.style.opacity = '1';
        this.initParticles();
        this.animate();
    }

    stop() {
        this.isActive = false;
        this.canvas.style.opacity = '0';
    }

    initParticles() {
        this.particles = [];
        const images = this.svgImages[this.currentSeason];
        for (let i = 0; i < this.maxParticles; i++) {
            const img = images[Math.floor(Math.random() * images.length)];
            this.particles.push(new Particle(this.canvas.width, this.canvas.height, this.currentSeason, img));
        }
    }

    animate() {
        if (!this.isActive) {
            cancelAnimationFrame(this.animationId);
            return;
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const landingY = this.canvas.height - this.accumulationZone;

        // 更新并绘制飘落的粒子
        this.particles.forEach(p => {
            const landed = p.update(this.canvas.width, this.canvas.height, landingY);

            if (landed) {
                // 粒子落地，添加到堆积数组
                this.addAccumulatedParticle(p);
                // 重置粒子从顶部重新飘落
                p.reset(this.canvas.width, this.canvas.height);
            }

            p.draw(this.ctx);
        });

        // 更新并绘制堆积的粒子
        this.accumulatedParticles.forEach((ap, index) => {
            ap.update();
            ap.draw(this.ctx);
        });

        // 移除已完全消失的堆积粒子
        this.accumulatedParticles = this.accumulatedParticles.filter(ap => ap.opacity > 0);

        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 添加堆积粒子
    addAccumulatedParticle(fallingParticle) {
        // 创建堆积粒子（使用落地位置）
        const accumulated = new AccumulatedParticle(
            fallingParticle.x,
            this.canvas.height - Math.random() * this.accumulationZone * 0.8,
            fallingParticle.image,
            fallingParticle.size * (0.8 + Math.random() * 0.4), // 略微随机大小
            fallingParticle.rotation
        );

        this.accumulatedParticles.push(accumulated);

        // 如果超过最大数量，让最早的粒子开始消失
        if (this.accumulatedParticles.length > this.maxAccumulated) {
            // 让前10%的粒子开始淡出
            const fadeCount = Math.ceil(this.maxAccumulated * 0.1);
            for (let i = 0; i < fadeCount && i < this.accumulatedParticles.length; i++) {
                this.accumulatedParticles[i].startFading();
            }
        }
    }
}

class Particle {
    constructor(canvasWidth, canvasHeight, season, image) {
        this.image = image;
        this.season = season;
        this.reset(canvasWidth, canvasHeight, true);
    }

    reset(canvasWidth, canvasHeight, initial = false) {
        this.x = Math.random() * canvasWidth;
        this.y = initial ? Math.random() * canvasHeight : -50;
        this.size = Math.random() * 20 + 20; // 20-40px
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1.5 + 0.8;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 2 - 1;
        this.opacity = Math.random() * 0.3 + 0.6;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.02 + 0.01;

        // 季节特性微调
        if (this.season === 'spring') {
            this.speedY = Math.random() * 1 + 0.5;
            this.speedX = Math.random() * 1.2;
        } else if (this.season === 'autumn') {
            this.rotationSpeed = Math.random() * 3 - 1.5;
            this.speedY = Math.random() * 0.8 + 0.4;
        } else if (this.season === 'winter') {
            this.size = Math.random() * 15 + 15;
            this.speedX = Math.random() * 0.3 - 0.15;
            this.opacity = Math.random() * 0.4 + 0.5;
        }
    }

    update(canvasWidth, canvasHeight, landingY) {
        this.wobble += this.wobbleSpeed;
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.wobble) * 0.8;
        this.rotation += this.rotationSpeed;

        // 检查是否落地
        if (landingY && this.y > landingY) {
            return true; // 触发落地
        }

        if (this.y > canvasHeight + 50) {
            this.reset(canvasWidth, canvasHeight);
        }
        return false;
    }

    draw(ctx) {
        if (!this.image || !this.image.complete) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

class AccumulatedParticle {
    constructor(x, y, image, size, rotation) {
        this.x = x;
        this.y = y;
        this.image = image;
        this.size = size;
        this.rotation = rotation;
        this.opacity = Math.random() * 0.3 + 0.5;
        this.isFading = false;
        this.fadeSpeed = 0.005;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.01;
    }

    startFading() {
        this.isFading = true;
    }

    update() {
        if (this.isFading) {
            this.opacity -= this.fadeSpeed;
        }

        // 落地后也有很轻微的左右摆动，显得更有活性
        this.wobble += this.wobbleSpeed;
        this.x += Math.sin(this.wobble) * 0.1;
    }

    draw(ctx) {
        if (!this.image || !this.image.complete || this.opacity <= 0) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 180);
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(this.image, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

window.SeasonalEffects = SeasonalEffects;
