const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 读取景点数据
function getAttractionsData() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'attractions.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取景点数据失败:', error);
        return { attractions: [] };
    }
}

// API路由
app.get('/api/v1/attractions', (req, res) => {
    try {
        const data = getAttractionsData();
        res.json({ code: 200, data: data, msg: 'success' });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '获取景点数据失败' });
    }
});

app.get('/api/v1/attractions/:id', (req, res) => {
    try {
        const { id } = req.params;
        const data = getAttractionsData();
        const attraction = data.attractions.find(a => a.id === id);
        if (attraction) {
            res.json({ code: 200, data: attraction, msg: 'success' });
        } else {
            res.status(404).json({ code: 404, msg: '景点不存在' });
        }
    } catch (error) {
        res.status(500).json({ code: 500, msg: '获取景点详情失败' });
    }
});

app.post('/api/v1/search', (req, res) => {
    try {
        const { keyword } = req.body;
        const data = getAttractionsData();
        const results = data.attractions.filter(attraction => {
            return attraction.name.includes(keyword) ||
                attraction.description.includes(keyword) ||
                attraction.address.includes(keyword);
        });
        res.json({ code: 200, data: { results }, msg: 'success' });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '搜索失败' });
    }
});

// 基于用户兴趣和历史行为的智能推荐系统
app.post('/api/v1/agent/recommendation', (req, res) => {
    try {
        const { interests = [], limit = 8, travel_style = 'balanced' } = req.body;
        const data = getAttractionsData();

        // 1. 计算景点匹配度得分
        const scoredAttractions = data.attractions.map(attraction => {
            let score = 0;

            // 兴趣匹配度 - 基础得分
            if (interests && interests.length > 0) {
                const matchedCategories = attraction.category.filter(cat => interests.includes(cat));
                score += matchedCategories.length * 40; // 每个匹配兴趣加40分

                // 兴趣权重调整
                const interestWeights = {
                    'history': 1.3,
                    'nature': 1.2,
                    'food': 1.4,
                    'city': 1.1,
                    'photo': 1.3,
                    'family': 1.2,
                    'free': 1.1,
                    'student': 1.1
                };

                matchedCategories.forEach(cat => {
                    if (interestWeights[cat]) {
                        score *= interestWeights[cat];
                    }
                });
            }

            // 2. 景点质量得分
            score += (attraction.rating || 4) * 20; // 评分1-5分，转换为20-100分
            score += (attraction.popularity || 50) / 2; // 热度1-100，转换为0.5-50分

            // 3. 旅行风格适配
            const styleAdjustments = {
                'balanced': (attraction) => {
                    // 平衡型：兼顾热门度和多样性
                    return 1;
                },
                'adventure': (attraction) => {
                    // 冒险型：偏好自然景观和小众景点
                    return attraction.category.includes('nature') ? 1.3 : 0.9;
                },
                'cultural': (attraction) => {
                    // 文化型：偏好历史人文景点
                    return attraction.category.includes('history') ? 1.4 : 0.8;
                },
                'leisure': (attraction) => {
                    // 休闲型：偏好城市休闲和美食
                    return (attraction.category.includes('city') || attraction.category.includes('food')) ? 1.3 : 0.9;
                },
                'budget': (attraction) => {
                    // 经济型：偏好免费和优惠景点
                    return (attraction.ticketPrice === '免费' || attraction.category.includes('student')) ? 1.4 : 0.8;
                }
            };

            const styleAdjustment = styleAdjustments[travel_style] || styleAdjustments['balanced'];
            score *= styleAdjustment(attraction);

            // 4. 多样性调整 - 避免推荐过于相似的景点
            // 这里简化处理，实际可以使用更复杂的多样性算法

            return { attraction, score };
        });

        // 5. 按得分排序并选择Top N
        const topAttractions = scoredAttractions
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        // 6. 生成推荐理由
        const recommendations = topAttractions.map(item => {
            const { attraction, score } = item;

            // 生成个性化推荐理由
            let reason = '';
            if (interests && interests.length > 0) {
                const matchedInterests = attraction.category.filter(cat => interests.includes(cat));
                if (matchedInterests.length > 0) {
                    const interestNames = {
                        'history': '历史人文',
                        'nature': '自然景观',
                        'food': '美食街区',
                        'city': '城市休闲',
                        'photo': '拍照打卡',
                        'family': '亲子友好',
                        'free': '免费景点',
                        'student': '学生优惠'
                    };
                    const matchedInterestNames = matchedInterests.map(interest => interestNames[interest] || interest);
                    reason = `根据您对${matchedInterestNames.join('、')}的兴趣推荐`;
                } else {
                    reason = '推荐给您的热门景点';
                }
            } else {
                reason = '南京热门景点推荐';
            }

            // 附加景点特色
            if (attraction.ticketPrice === '免费') {
                reason += '，免费开放';
            } else if (attraction.category.includes('student')) {
                reason += '，学生可享优惠';
            }

            if (attraction.rating >= 4.8) {
                reason += '，评分极高';
            }

            return {
                ...attraction,
                reason,
                match_score: Math.round(score)
            };
        });

        res.json({
            code: 200,
            data: {
                recommendations,
                travel_style,
                total_matched: scoredAttractions.length
            },
            msg: 'success'
        });
    } catch (error) {
        console.error('获取推荐失败:', error);
        res.status(500).json({ code: 500, msg: '获取推荐失败' });
    }
});

// 自定义随机数生成器，基于种子生成可重复的随机序列
function createRandom(seed) {
    // 使用简单的线性同余生成器
    let x = seed;
    return function () {
        x = (x * 1664525 + 1013904223) % 2 ** 32;
        return x / 2 ** 32;
    };
}

// 为景点添加模拟地理位置（纬度和经度）
function getAttractionLocation(attraction) {
    // 基于景点ID生成模拟地理位置，确保相同景点始终返回相同位置
    const seed = parseInt(attraction.id);
    const random = createRandom(seed);

    // 南京大致坐标范围：北纬31.9°-32.1°，东经118.7°-119.0°
    const lat = 31.9 + random() * 0.2;
    const lng = 118.7 + random() * 0.3;

    return { lat, lng };
}

// 计算两个景点之间的距离（使用Haversine公式模拟真实距离）
function calculateDistance(attraction1, attraction2) {
    const loc1 = getAttractionLocation(attraction1);
    const loc2 = getAttractionLocation(attraction2);

    const R = 6371; // 地球半径（公里）
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // 距离（公里）

    return Math.round(distance * 10) / 10; // 保留一位小数
}

// 优化行程路线，将景点按距离排序
function optimizeRoute(attractions) {
    if (attractions.length <= 1) return attractions;

    const optimized = [attractions[0]];
    const remaining = [...attractions.slice(1)];

    while (remaining.length > 0) {
        let closestIndex = 0;
        let closestDistance = calculateDistance(optimized[optimized.length - 1], remaining[0]);

        for (let i = 1; i < remaining.length; i++) {
            const distance = calculateDistance(optimized[optimized.length - 1], remaining[i]);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = i;
            }
        }

        optimized.push(remaining[closestIndex]);
        remaining.splice(closestIndex, 1);
    }

    return optimized;
}

// 基于用户兴趣计算景点权重
function calculateAttractionWeight(attraction, interests) {
    if (!interests || interests.length === 0) return 1;

    let weight = 1;
    const categoryWeights = {
        'history': 1.5,
        'nature': 1.5,
        'food': 1.5,
        'city': 1.2,
        'free': 1.1,
        'student': 1.1,
        'family': 1.3,
        'photo': 1.4
    };

    // 根据景点分类计算权重
    for (const category of attraction.category) {
        if (interests.includes(category)) {
            weight *= categoryWeights[category] || 1.2;
        }
    }

    return weight;
}

// 生成行程主题
function generateTripTheme(interests) {
    if (!interests || interests.length === 0) {
        const themes = [
            '南京经典之旅',
            '六朝古都探索',
            '南京文化体验',
            '金陵风光之旅'
        ];
        return themes[Math.floor(Math.random() * themes.length)];
    }

    // 根据兴趣生成主题
    const themeMap = {
        'history': ['历史文化探索', '六朝古都深度游', '民国风情之旅', '博物馆奇妙日'],
        'nature': ['自然风光欣赏', '生态之旅', '山水画卷', '绿色南京'],
        'food': ['美食寻味之旅', '南京美食地图', '小吃探索', '地道南京菜'],
        'city': ['城市地标之旅', '现代南京', '都市休闲', '城市建筑欣赏'],
        'photo': ['摄影天堂', '南京光影之旅', '网红打卡', '视觉盛宴'],
        'family': ['亲子欢乐游', '家庭温馨之旅', '儿童友好行程', '欢乐家庭日'],
        'free': ['免费景点之旅', '经济实惠游', '零花费探索', '性价比之选'],
        'student': ['学生特惠游', '青春活力之旅', '文化学习之旅', '预算友好行程']
    };

    // 优先使用用户兴趣对应的主题
    for (const interest of interests) {
        if (themeMap[interest]) {
            const themes = themeMap[interest];
            return themes[Math.floor(Math.random() * themes.length)];
        }
    }

    // 默认主题
    return '南京特色之旅';
}

// 生成每日行程主题
function generateDailyTheme(day, interests) {
    const baseThemes = [
        '探索与发现',
        '文化与历史',
        '自然与生态',
        '美食与休闲',
        '城市与现代',
        '艺术与创意',
        '放松与享受'
    ];

    // 结合兴趣生成每日主题
    if (interests && interests.length > 0) {
        const interestThemes = {
            'history': ['历史印记', '文化溯源', '古迹探索', '时光之旅'],
            'nature': ['山水之美', '绿色氧吧', '自然探索', '生态体验'],
            'food': ['味蕾之旅', '美食发现', '小吃天堂', '厨艺体验'],
            'photo': ['光影之美', '视觉盛宴', '摄影打卡', '艺术欣赏']
        };

        for (const interest of interests) {
            if (interestThemes[interest]) {
                const themes = interestThemes[interest];
                return themes[Math.floor(Math.random() * themes.length)];
            }
        }
    }

    return baseThemes[day % baseThemes.length];
}

app.post('/api/v1/agent/trip-planning', async (req, res) => {
    try {
        const { days, budget, interests, special_needs: specialNeeds, random_seed: randomSeed } = req.body;
        const data = getAttractionsData();

        // 模拟AI思考时间
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 创建基于随机种子的随机数生成器
        const seed = randomSeed ? randomSeed : Date.now().toString();
        const seedNum = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = createRandom(seedNum);

        // 1. 景点筛选与评分
        // --------------------

        // 1.1 计算景点权重
        const scoredAttractions = data.attractions.map(attraction => {
            let score = 0;

            // 兴趣匹配得分
            if (interests && interests.length > 0) {
                const interestMatch = attraction.category.filter(cat => interests.includes(cat)).length;
                score += interestMatch * 30; // 每个匹配的兴趣加30分
            }

            // 评分得分
            score += (attraction.rating || 4) * 10; // 评分1-5分，转换为10-50分

            // 热度得分
            score += (attraction.popularity || 50) / 2; // 热度1-100，转换为0.5-50分

            // 预算匹配
            const priceStr = attraction.ticketPrice;
            const priceNum = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;

            // 处理预算
            const budgetNum = parseInt(budget);
            let budgetType = 'low'; // 默认为低预算

            if (!isNaN(budgetNum)) {
                // 如果预算是数字，根据预算金额调整
                if (budgetNum >= 1000) {
                    budgetType = 'high';
                } else if (budgetNum >= 600) {
                    budgetType = 'medium';
                }
            } else if (budget === 'medium') {
                budgetType = 'medium';
            } else if (budget === 'high') {
                budgetType = 'high';
            }

            // 根据预算类型调整得分
            if (attraction.ticketPrice === '免费') {
                score += 10; // 免费景点额外加分
            } else if (budgetType === 'high') {
                // 高预算，价格不影响得分
            } else if (budgetType === 'medium') {
                if (priceNum > 100) {
                    score -= (priceNum - 100) / 5; // 超过100元，每多5元减1分
                }
            } else {
                if (priceNum > 50) {
                    score -= (priceNum - 50) / 2; // 超过50元，每多2元减1分
                }
            }

            return {
                attraction,
                score,
                priceNum
            };
        });

        // 1.2 特殊需求处理
        let filteredAttractions = scoredAttractions.filter(item => {
            const attraction = item.attraction;

            // 处理特殊需求
            if (specialNeeds) {
                const needs = specialNeeds.toLowerCase();

                // 示例：处理"不爬山"需求
                if (needs.includes('不爬山') && attraction.category.includes('nature')) {
                    // 可以根据实际情况添加更复杂的逻辑
                    // 这里简化处理，假设所有自然景点都需要爬山
                    return false;
                }

                // 示例：处理"适合老人"需求
                if (needs.includes('适合老人') && attraction.category.includes('nature')) {
                    // 简化处理，假设自然景点不适合老人
                    return false;
                }
            }

            return true;
        });

        // 1.3 根据得分排序
        filteredAttractions.sort((a, b) => b.score - a.score);
        const topAttractions = filteredAttractions.map(item => item.attraction);



        // 3. 智能行程规划 (AI + Algo)
        // --------------------

        // 读取包含坐标的数据
        const attractionsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'attractions.json'), 'utf-8'));
        const foodData = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'food.json'), 'utf-8'));
        const allAttractions = attractionsData.attractions;
        const allFood = foodData.food;

        // 构建 Prompt 让 AI 选择
        // 性能优化：只发送评分最高的20个景点给AI，大幅减少Token消耗，提升生成速度 (<20s)
        const availableAttractionsList = topAttractions.slice(0, 25).map(a => `${a.id}:${a.name}`).join('\n');

        const systemPrompt = `你是一个专业的南京旅行规划师。
现有景点:
${availableAttractionsList}
及美食: 鸭血粉丝汤, 盐水鸭, 汤包, 梅花糕, 皮肚面。

用户: ${days}天, 偏好${interests.join(',')}, 预算${budget}。
请规划行程。
**必须返回纯JSON**，格式:
{
  "theme": "主题名称",
  "daily_itineraries": [
    {
      "day": 1,
      "title": "Day 1标题",
      "attraction_ids": ["ID1", "ID2"],
      "lunch": "推荐美食名",
      "dinner": "晚餐建议"
    }
  ],
  "tips": ["贴士1", "贴士2"]
}
规则：每天安排2-3个景点。`;

        // 调用 LLM
        const completion = await aiClient.chat.completions.create({
            model: "Qwen/Qwen2.5-7B-Instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: "请生成纯JSON行程。" }
            ],
            temperature: 0.7,
            max_tokens: 1024, // 限制输出长度，加速生成
        });

        let aiPlan = {};
        try {
            let raw = completion.choices[0].message.content.trim();
            if (raw.startsWith('```json')) raw = raw.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            else if (raw.startsWith('```')) raw = raw.replace(/^```\s*/, '').replace(/\s*```$/, '');
            aiPlan = JSON.parse(raw);
        } catch (e) {
            console.error('AI JSON解析失败:', e);
            // 简单的回退：如果AI失败，使用旧的随机逻辑的一部分或者直接报错
            throw new Error('AI生成格式错误，请重试');
        }

        // 4. 算法优化：贪心路径排序
        const calculateDistance = (p1, p2) => {
            const rad = Math.PI / 180;
            const R = 6371;
            const dLat = (p2.lat - p1.lat) * rad;
            const dLon = (p2.lng - p1.lng) * rad;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(p1.lat * rad) * Math.cos(p2.lat * rad) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
            return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        const optimizeDailyRoute = (ids) => {
            if (!ids || ids.length <= 1) return ids;
            let points = ids.map(id => allAttractions.find(a => a.id == id)).filter(Boolean);
            if (points.length === 0) return [];

            // 简单的逻辑：以最北的点开始（纬度最大）
            points.sort((a, b) => b.location.lat - a.location.lat);
            const start = points[0];

            const sorted = [start];
            const remaining = points.slice(1);

            while (remaining.length > 0) {
                const current = sorted[sorted.length - 1];
                let nearestIdx = -1;
                let minDst = Infinity;
                remaining.forEach((p, idx) => {
                    const d = calculateDistance(current.location, p.location);
                    if (d < minDst) { minDst = d; nearestIdx = idx; }
                });
                sorted.push(remaining[nearestIdx]);
                remaining.splice(nearestIdx, 1);
            }
            return sorted.map(a => a.id);
        };

        // 5. 构建响应
        const dailyItineraries = aiPlan.daily_itineraries.map(dayPlan => {
            // 确保ID是字符串
            const rawIds = (dayPlan.attraction_ids || []).map(String);
            const sortedIds = optimizeDailyRoute(rawIds);

            const activities = [];
            sortedIds.forEach((id, idx) => {
                const attraction = allAttractions.find(a => a.id == id);
                if (!attraction) return;

                activities.push({
                    time: idx < sortedIds.length / 2 ? 'morning' : 'afternoon',
                    attraction: attraction,
                    description: `智能推荐：游览${attraction.name}。${attraction.description.substring(0, 50)}...`,
                    tips: [`建议游玩${Math.ceil(attraction.popularity / 20)}小时`, `门票: ${attraction.ticketPrice}`],
                    type: 'view',
                    location: attraction.address,

                    // 关键：返回坐标供前端画线
                    lat: attraction.location.lat,
                    lng: attraction.location.lng
                });
            });

            // 插入午餐
            if (dayPlan.lunch) {
                // 尝试找到对应的美食坐标
                const foodItem = allFood.find(f => dayPlan.lunch.includes(f.name));
                const refLoc = activities[0] ? activities[0] : { lat: 32.06, lng: 118.79 };

                activities.splice(Math.ceil(activities.length / 2), 0, {
                    time: 'noon',
                    type: 'food',
                    description: `推荐午餐: ${dayPlan.lunch}`,
                    location: foodItem ? '特色美食' : '周边餐饮',
                    tips: ['地道风味'],
                    lat: foodItem ? foodItem.location.lat : refLoc.lat,
                    lng: foodItem ? foodItem.location.lng : refLoc.lng
                });
            }

            // 晚上
            activities.push({
                time: 'evening',
                type: 'leisure',
                description: dayPlan.dinner || '建议自由活动',
                location: '市区',
                tips: ['享受南京夜生活'],
                lat: 32.0210, // 夫子庙中心
                lng: 118.7885
            });

            return {
                day: dayPlan.day,
                title: dayPlan.title,
                formatted_date: `第${dayPlan.day}天`,
                mode: 'AI定制',
                activities: activities
            };
        });

        const tripData = {
            trip_id: `trip_${Date.now()}`,
            days: parseInt(days),
            budget: budget,
            interests: interests,
            daily_itineraries: dailyItineraries,
            total_budget: "AI计算中",
            theme: aiPlan.theme || "南京之旅",
            tips: aiPlan.tips || [],
            ai_generated: true
        };

        res.json({ code: 200, data: tripData, msg: 'success' });
    } catch (error) {
        console.error('AI生成行程失败:', error);
        console.error('错误堆栈:', error.stack);
        res.status(500).json({ code: 500, msg: 'AI生成行程失败' });
    }
});

// 数据采集智能体API
app.post('/api/v1/agent/data-collection', (req, res) => {
    try {
        const { keywords, limit = 10, platforms = ['xiaohongshu', 'ctrip', 'tongcheng'] } = req.body;
        const taskId = `task_${Date.now()}`;

        // 模拟数据采集逻辑
        setTimeout(() => {
            console.log(`数据采集任务 ${taskId} 已完成`);
            console.log(`关键词: ${keywords}`);
            console.log(`平台: ${platforms.join(', ')}`);
            console.log(`限制: ${limit}`);
        }, 1000);

        // 返回模拟数据
        res.json({
            code: 200,
            data: {
                task_id: taskId,
                status: 'completed',
                message: '数据采集任务已创建',
                collected_attractions: [
                    {
                        id: `collected_${Date.now()}_1`,
                        name: '中山陵',
                        image: 'https://example.com/zhongshanling.jpg',
                        description: '中山陵是中国近代伟大的民主革命先行者孙中山先生的陵寝',
                        openingHours: '8:30-17:00',
                        ticketPrice: '免费',
                        transportation: '地铁2号线下马坊站',
                        address: '南京市玄武区石象路7号',
                        category: ['history', 'free'],
                        rating: 4.8,
                        popularity: 98,
                        source: 'xiaohongshu'
                    },
                    {
                        id: `collected_${Date.now()}_2`,
                        name: '南京博物院',
                        image: 'https://example.com/nanjinbowuguan.jpg',
                        description: '南京博物院是中国三大博物馆之一',
                        openingHours: '9:00-17:00',
                        ticketPrice: '免费',
                        transportation: '地铁2号线明故宫站',
                        address: '南京市玄武区中山东路321号',
                        category: ['history', 'free'],
                        rating: 4.9,
                        popularity: 99,
                        source: 'ctrip'
                    }
                ]
            },
            msg: 'success'
        });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '创建数据采集任务失败' });
    }
});

// 内容审核智能体API
app.post('/api/v1/agent/content-review', (req, res) => {
    try {
        const { attractions } = req.body;

        // 模拟内容审核逻辑
        const approvedAttractions = [];
        const rejectedAttractions = [];

        attractions.forEach(attraction => {
            // 模拟审核规则
            const isApproved = Math.random() > 0.1; // 90%的通过率

            if (isApproved) {
                approvedAttractions.push({
                    ...attraction,
                    review_status: 'approved',
                    review_time: new Date().toISOString(),
                    review_comments: '信息完整，符合要求'
                });
            } else {
                rejectedAttractions.push({
                    ...attraction,
                    review_status: 'rejected',
                    review_time: new Date().toISOString(),
                    review_comments: '信息不完整，需要补充'
                });
            }
        });

        // 返回审核结果
        res.json({
            code: 200,
            data: {
                approved_attractions: approvedAttractions,
                rejected_attractions: rejectedAttractions,
                total_approved: approvedAttractions.length,
                total_rejected: rejectedAttractions.length,
                review_time: new Date().toISOString()
            },
            msg: 'success'
        });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '内容审核失败' });
    }
});

// 连接SQLite数据库
const dbPath = path.join(__dirname, 'data', 'notes.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('无法连接到SQLite数据库:', err.message);
    } else {
        console.log('已成功连接到SQLite数据库:', dbPath);

        // 初始化统一收藏表
        db.run(`CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL, -- 'attraction', 'plan', 'food'
            target_id TEXT,     -- 对于景点，存储景点ID
            content TEXT,       -- 对于行程和美食，存储JSON内容
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(type, target_id) ON CONFLICT IGNORE -- 对于景点避免重复收藏
        )`, (err) => {
            if (err) {
                console.error('创建Collections表失败:', err.message);
            } else {
                console.log('Collections表检查/创建成功');
            }
        });
    }
});

// 获取所有收藏API
app.get('/api/v1/collections', (req, res) => {
    const { type } = req.query;
    let sql = 'SELECT * FROM collections ORDER BY created_at DESC';
    let params = [];

    if (type) {
        sql = 'SELECT * FROM collections WHERE type = ? ORDER BY created_at DESC';
        params = [type];
    }

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('查询收藏失败:', err.message);
            res.status(500).json({ code: 500, msg: '获取收藏数据失败' });
            return;
        }
        res.json({
            code: 200,
            data: rows,
            msg: 'success'
        });
    });
});

// 添加收藏API
app.post('/api/v1/collections', (req, res) => {
    const { type, target_id, content } = req.body;

    if (!type) {
        return res.status(400).json({ code: 400, msg: '缺少type参数' });
    }

    const contentStr = typeof content === 'object' ? JSON.stringify(content) : content;

    // 对于景点，如果不提供 content，我们可以稍后在前端处理或者这里不存

    const sql = 'INSERT INTO collections (type, target_id, content) VALUES (?, ?, ?)';
    db.run(sql, [type, target_id || null, contentStr || null], function (err) {
        if (err) {
            console.error('添加收藏失败:', err.message);
            res.status(500).json({ code: 500, msg: '添加收藏失败' });
            return;
        }
        res.json({
            code: 200,
            msg: '收藏成功',
            data: { id: this.lastID, type, target_id }
        });
    });
});

// 删除收藏API (通过ID)
app.delete('/api/v1/collections/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM collections WHERE id = ?';
    db.run(sql, [id], function (err) {
        if (err) {
            console.error('删除收藏失败:', err.message);
            res.status(500).json({ code: 500, msg: '删除收藏失败' });
            return;
        }
        res.json({
            code: 200,
            msg: '删除收藏成功',
            data: { changes: this.changes }
        });
    });
});

// 删除收藏API (通过TargetID，主要用于景点取消收藏)
app.delete('/api/v1/collections/target/:id', (req, res) => {
    const targetId = req.params.id;
    const type = req.query.type || 'attraction';
    const sql = 'DELETE FROM collections WHERE target_id = ? AND type = ?';
    db.run(sql, [targetId, type], function (err) {
        if (err) {
            console.error('删除收藏失败:', err.message);
            res.status(500).json({ code: 500, msg: '删除收藏失败' });
            return;
        }
        res.json({
            code: 200,
            msg: '删除收藏成功',
            data: { changes: this.changes }
        });
    });
});

// 获取笔记列表API
app.get('/api/v1/notes', (req, res) => {
    const sql = 'SELECT * FROM notes ORDER BY id DESC'; //按ID倒序排列，模拟最新发布
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('查询笔记失败:', err.message);
            res.status(500).json({ code: 500, msg: '获取笔记数据失败' });
            return;
        }
        // 确保数据格式与前端期望的一致 (前端期望 { notes: [...] })
        // 但根据之前的 fetch逻辑: const notesData = await notesResponse.json(); allNotes = notesData.notes;
        // 所以我们应该返回 { notes: rows } 结构，或者统一标准返回 { code: 200, data: { notes: rows } }
        // 让我们看看前端 scripts.js 的解析:
        // const notesData = await notesResponse.json();
        // allNotes = notesData.notes;
        // 所以JSON响应体应该包含一个 notes 属性。
        // 为了保持API风格一致 (code, data, msg)，建议:
        // res.json({ code: 200, data: { notes: rows }, msg: 'success' });
        // 但是前端代码目前是直接读取 .json 文件，结构是 { "notes": [...] }
        // 后面我会修改前端代码来适配标准API响应。

        // 既然我要改前端，那我就按照标准API格式返回：
        res.json({
            code: 200,
            data: { notes: rows },
            msg: 'success'
        });
    });
});

// 配置 SiliconFlow AI 客户端
const aiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-syargqzdjykedkptlpphveknthosgtyltbnzewjzhmmxgsbl',
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1'
});

// AI 美食问答 API
app.post('/api/v1/ai/food-ask', async (req, res) => {
    try {
        const { question } = req.body;

        if (!question) {
            return res.status(400).json({ code: 400, msg: '问题不能为空' });
        }

        // 构造系统提示词，打造"南京美食老饕"人设
        const systemPrompt = `你是一个地道的南京"老饕"（美食家），对南京的街头巷尾、苍蝇馆子、地道小吃如数家珍。
你的语言风格应该是：热情、接地气、带有南京特色（偶尔可以说句"阿要辣油啊"）。
请针对用户的问题推荐性价比高、味道正宗的美食。如果用户提到学生身份或低预算，重点推荐便宜好吃的。
回答要简洁明了，直接给出店名、推荐理由和大致人均消费。`;

        const completion = await aiClient.chat.completions.create({
            model: "Qwen/QwQ-32B", // 使用硅基流动提供的通义千问模型
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question }
            ],
            temperature: 0.7,
        });

        const answer = completion.choices[0].message.content;

        res.json({
            code: 200,
            data: {
                answer: answer
            },
            msg: 'success'
        });

    } catch (error) {
        console.error('AI请求失败:', error);
        res.status(500).json({ code: 500, msg: 'AI稍微开了个小差，请重试' });
    }
});

// 处理404
app.use((req, res) => {
    res.status(404).json({ code: 404, msg: 'API不存在' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`⚡️ Nanjing Travel Server V2 (Speed Optimized) is running on port ${PORT} ⚡️`);
    console.log('API URL: http://localhost:3000/api/v1/agent/trip-planning');
    console.log(`Server started at: ${new Date().toLocaleString()}`);
    console.log(`网站访问地址: http://localhost:${PORT}/index.html`);
});