// 导航栏滚动效果
window.addEventListener('scroll', function () {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('bg-sky-blue', 'bg-opacity-95', 'shadow-md');
    } else {
        navbar.classList.remove('shadow-md');
    }
});

// 移动端菜单切换
document.getElementById('menu-toggle').addEventListener('click', function () {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// 轮播图状态变量
let currentSlide = 0;
let slides = [];
let dots = [];
let totalSlides = 0;
let slideInterval;
let isPlaying = true;

function showSlide(index) {
    if (!slides || slides.length === 0) return;

    // 确保索引在有效范围内
    if (index >= totalSlides) index = 0;
    if (index < 0) index = totalSlides - 1;

    // 为当前幻灯片添加出场动画
    slides[currentSlide].classList.remove('opacity-100', 'translate-x-0');
    slides[currentSlide].classList.add('opacity-0', 'translate-x-full');

    // 为新幻灯片设置初始位置
    slides[index].classList.remove('opacity-0', 'translate-x-full');
    slides[index].classList.add('opacity-100', 'translate-x-0');

    currentSlide = index;

    // 更新指示器
    dots.forEach((dot, i) => {
        if (i === index) {
            dot.classList.remove('bg-white/50');
            dot.classList.add('bg-white');
        } else {
            dot.classList.remove('bg-white');
            dot.classList.add('bg-white/50');
        }
    });
}

// 切换到下一张幻灯片
function nextSlide() {
    let nextIndex = (currentSlide + 1) % totalSlides;
    showSlide(nextIndex);
    resetAutoSlide(); // 重置自动轮播
}

// 切换到上一张幻灯片
function prevSlide() {
    let prevIndex = (currentSlide - 1 + totalSlides) % totalSlides;
    showSlide(prevIndex);
    resetAutoSlide(); // 重置自动轮播
}

// 开始自动轮播
function startAutoSlide() {
    if (!isPlaying) {
        slideInterval = setInterval(() => {
            nextSlide();
        }, 5000);
        isPlaying = true;
    }
}

// 停止自动轮播
function stopAutoSlide() {
    if (isPlaying) {
        clearInterval(slideInterval);
        isPlaying = false;
    }
}

// 重置自动轮播计时器
function resetAutoSlide() {
    if (isPlaying) {
        clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            nextSlide();
        }, 5000);
    }
}

// 切换播放/暂停状态
function togglePlayPause() {
    const playPauseBtn = document.getElementById('play-pause');
    if (!playPauseBtn) return;
    const icon = playPauseBtn.querySelector('i');

    if (isPlaying) {
        stopAutoSlide();
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
    } else {
        isPlaying = false; // 先强制为false以便startAutoSlide生效
        startAutoSlide();
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
    }
}



// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;

        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
            document.getElementById('mobile-menu').classList.add('hidden');
        }
    });
});

// 笔记点赞收藏功能
document.querySelectorAll('.fa-heart-o').forEach(heart => {
    heart.addEventListener('click', function () {
        this.classList.toggle('fa-heart-o');
        this.classList.toggle('fa-heart');
        this.classList.toggle('text-palace-red');
        const count = this.nextElementSibling;
        count.textContent = this.classList.contains('fa-heart')
            ? parseInt(count.textContent) + 1
            : parseInt(count.textContent) - 1;
    });
});

document.querySelectorAll('.fa-bookmark-o').forEach(bookmark => {
    bookmark.addEventListener('click', function () {
        this.classList.toggle('fa-bookmark-o');
        this.classList.toggle('fa-bookmark');
        this.classList.toggle('text-stone-blue');
        const count = this.nextElementSibling;
        count.textContent = this.classList.contains('fa-bookmark')
            ? parseInt(count.textContent) + 1
            : parseInt(count.textContent) - 1;
    });
});

// 搜索功能
document.addEventListener('DOMContentLoaded', function () {
    // 全局变量
    let allAttractions = [];
    let allNotes = [];
    let allFavorites = []; // 新增：存储所有的收藏ID
    let allFood = [];
    let map = null;
    let markers = [];
    let geocoder = null;

    function initMap() {
        // 创建地图容器
        const mapContainer = document.getElementById('attractions-map');
        const mapLoading = document.getElementById('map-loading');

        if (mapContainer) {
            try {
                // 初始化腾讯地图
                map = new qq.maps.Map(mapContainer, {
                    center: new qq.maps.LatLng(32.0603, 118.7969), // 南京坐标
                    zoom: 12,
                    mapTypeId: qq.maps.MapTypeId.ROADMAP,
                    zoomControlOptions: {
                        position: qq.maps.ControlPosition.RIGHT_BOTTOM
                    },
                    scaleControl: true,
                    scaleControlOptions: {
                        position: qq.maps.ControlPosition.BOTTOM_LEFT
                    }
                });

                // 初始化地理编码器
                geocoder = new qq.maps.Geocoder();

                // 地图加载完成后隐藏加载动画
                qq.maps.event.addListener(map, 'tilesloaded', function () {
                    if (mapLoading) {
                        mapLoading.style.opacity = '0';
                        setTimeout(() => {
                            mapLoading.style.display = 'none';
                        }, 500);
                    }
                    mapContainer.style.opacity = '1';
                });

                // 为所有景点添加标记
                addAllMarkers();

                console.log('地图初始化成功');
            } catch (error) {
                console.error('地图初始化失败:', error);
                let checkQQ = (typeof qq === 'undefined') ? 'Tencent Map SDK not loaded' : 'SDK Loaded';
                if (mapLoading) {
                    mapLoading.innerHTML = `
                        <div class="text-center">
                            <i class="fa fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
                            <p class="text-gray-600 text-lg font-medium">地图加载失败</p>
                            <p class="text-xs text-red-400 mt-2">Error: ${error.message}</p>
                            <p class="text-xs text-gray-400">Status: ${checkQQ}</p>
                            <p class="text-sm text-gray-500 mt-2">请检查网络或刷新重试</p>
                        </div>
                    `;
                }
            }
        }
    }

    // 等待地图SDK加载
    function waitForMap(retryCount = 0) {
        if (typeof qq !== 'undefined' && qq.maps) {
            initMap();
        } else {
            if (retryCount < 20) { // 最多等待10秒
                console.log(`等待地图SDK加载... (${retryCount + 1}/20)`);
                setTimeout(() => waitForMap(retryCount + 1), 500);
            } else {
                console.error('地图SDK加载超时');
                const mapLoading = document.getElementById('map-loading');
                if (mapLoading) {
                    mapLoading.innerHTML = `
                        <div class="text-center">
                            <i class="fa fa-ban text-5xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600 text-lg font-medium">地图服务连接失败</p>
                            <p class="text-xs text-red-400 mt-2">Error: SDK Load Timeout</p>
                            <p class="text-sm text-gray-500 mt-2">您的网络可能无法访问腾讯地图服务</p>
                        </div>
                    `;
                }
            }
        }
    }

    // 为所有景点添加标记
    function addAllMarkers() {
        if (!map || !allAttractions || allAttractions.length === 0) return;

        // 清除现有标记
        clearMarkers();

        // 为每个景点创建单独的地理编码请求
        allAttractions.forEach(attraction => {
            // 创建独立的地理编码器实例以避免回调冲突
            const tempGeocoder = new qq.maps.Geocoder({
                complete: function (result) {
                    if (result.detail.location) {
                        const location = result.detail.location;

                        // 创建标记
                        const marker = new qq.maps.Marker({
                            position: location,
                            map: map,
                            title: attraction.name,
                            icon: getMarkerIcon(attraction.category[0]) // 使用第一个分类作为图标颜色
                        });

                        // 创建信息窗口
                        const infoWindow = new qq.maps.InfoWindow({
                            content: `
                                <div style="padding: 10px; min-width: 200px;">
                                    <h4 style="margin: 0 0 5px 0; color: #3D5A80; font-weight: bold;">${attraction.name}</h4>
                                    <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">${attraction.description.substring(0, 50)}...</p>
                                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                                        <span><i class="fa fa-star text-yellow-400"></i> ${attraction.rating}</span>
                                        <span>${attraction.ticketPrice}</span>
                                    </div>
                                    <a href="attraction-detail.html?id=${attraction.id}" style="display: block; margin-top: 8px; text-align: center; color: #C41E3A; font-weight: bold; text-decoration: none;">查看详情</a>
                                </div>
                            `
                        });

                        // 点击标记显示信息窗口
                        qq.maps.event.addListener(marker, 'click', function () {
                            infoWindow.open();
                            infoWindow.setPosition(location);
                        });

                        // 保存标记
                        markers.push({
                            marker: marker,
                            infoWindow: infoWindow,
                            attractionId: attraction.id
                        });
                    }
                }
            });

            // 执行地理编码
            tempGeocoder.getLocation(attraction.address + ', 南京');
        });
    }

    // 获取标记图标
    function getMarkerIcon(category) {
        // 暂时返回null使用默认图标，防止API URL错误导致地图崩溃
        return null;
    }

    // 清除所有标记
    function clearMarkers() {
        markers.forEach(item => {
            item.marker.setMap(null);
            item.infoWindow.close();
        });
        markers = [];
    }

    // 在地图上定位指定景点
    window.locateOnMap = function (attractionName, attractionId = null) {
        if (!map) {
            // 如果地图容器存在但未初始化，尝试重新初始化
            const mapContainer = document.getElementById('attractions-map');
            if (mapContainer) {
                initMap();
                // 延迟一下等待地图加载
                setTimeout(() => locateOnMap(attractionName, attractionId), 1000);
                // 滚动到地图
                mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            } else {
                alert('地图组件未加载，无法定位');
                return;
            }
        }

        // 滚动到地图位置
        const mapElement = document.getElementById('attractions-map');
        if (mapElement) {
            mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // 查找对应景点
        const attraction = allAttractions.find(att => att.name === attractionName || att.id === attractionId);
        if (!attraction) return;

        // 使用地理编码获取景点坐标以定位
        const locateGeocoder = new qq.maps.Geocoder({
            complete: function (result) {
                if (result.detail.location) {
                    const location = result.detail.location;

                    // 缩放到该位置
                    map.setCenter(location);
                    map.setZoom(15);

                    // 查找对应标记并打开信息窗口
                    const markerItem = markers.find(item => item.attractionId === attraction.id);
                    if (markerItem) {
                        markerItem.infoWindow.open();
                        markerItem.infoWindow.setPosition(location);

                        // 闪烁标记以吸引注意
                        const originalIcon = markerItem.marker.getIcon();
                        let blinkCount = 0;
                        const blinkInterval = setInterval(() => {
                            blinkCount++;
                            if (blinkCount > 6) {
                                clearInterval(blinkInterval);
                                markerItem.marker.setIcon(originalIcon);
                                return;
                            }
                            // 简单的闪烁效果
                            markerItem.marker.setVisible(blinkCount % 2 === 0);
                        }, 300);
                    } else {
                        // 如果没有现有标记，创建一个临时标记
                        const tempMarker = new qq.maps.Marker({
                            position: location,
                            map: map,
                            title: attraction.name
                        });
                        const tempInfo = new qq.maps.InfoWindow({
                            content: `<div style="padding:10px;">${attraction.name}</div>`,
                            map: map,
                            position: location
                        });
                        tempInfo.open();
                    }
                }
            },
            error: function () {
                alert('无法定位该景点位置，请稍后重试。');
            }
        });

        locateGeocoder.getLocation(attraction.address + ', 南京');
    }

    // 加载所有景点数据
    async function loadAllData() {
        try {
            // 加载景点数据
            const attractionsResponse = await fetch('./data/attractions.json');
            const attractionsData = await attractionsResponse.json();
            allAttractions = attractionsData.attractions;

            // 加载笔记数据 (从SQLite数据库API)
            const notesResponse = await fetch('/api/v1/notes');
            const notesResult = await notesResponse.json();
            if (notesResult.code === 200) {
                allNotes = notesResult.data.notes;
            } else {
                console.error('加载笔记失败:', notesResult.msg);
                allNotes = [];
            }

            // 加载收藏数据 (已迁移到统一Collections API)
            try {
                // 目前首页只关心景点类型的收藏，用于初始渲染爱心图标
                const favoritesResponse = await fetch('/api/v1/collections?type=attraction');
                const favoritesResult = await favoritesResponse.json();
                if (favoritesResult.code === 200) {
                    // allFavorites 存储的是 attraction_id 列表，以便快速查找
                    allFavorites = favoritesResult.data.map(item => item.target_id);
                } else {
                    console.error('加载收藏失败:', favoritesResult.msg);
                    allFavorites = [];
                }
            } catch (error) {
                console.error('加载收藏出错:', error);
                allFavorites = [];
            }

            // 初始化轮播图
            renderCarousel(allAttractions);

            // 初始化热门景点 TOP10
            renderTop10(allAttractions);

            // 初始化景点列表
            renderAttractions(allAttractions);

            // 初始化笔记列表
            console.log("Debug: notes data loaded", allNotes);
            renderNotes(allNotes);

            // 初始化地图 (改用通过轮询等待SDK加载)
            waitForMap();

            // 确保所有跳转链接都正确添加
            ensureAllLinks();

            // 数据加载完成后立即设置搜索功能
            setupSearch();
            // 加载美食数据
            fetch('data/food.json')
                .then(response => response.json())
                .then(data => {
                    allFood = data.food || [];
                    renderFood(allFood);
                    // 初始化AI美食顾问
                    setupAIFoodConsultant();
                })
                .catch(error => console.error('Error loading food data:', error));

        } catch (error) {
            console.error('加载数据失败:', error);
        }
    }

    // 设置AI美食顾问交互
    function setupAIFoodConsultant() {
        const askBtn = document.getElementById('ask-ai-btn');
        const questionInput = document.getElementById('ai-food-question');
        const responseArea = document.getElementById('ai-response-area');
        const responseContent = document.getElementById('ai-response-content');
        const loadingDiv = document.getElementById('ai-loading');

        if (!askBtn || !questionInput) return;

        askBtn.addEventListener('click', async () => {
            const question = questionInput.value.trim();
            if (!question) {
                alert('请先输入您的问题，例如：想找夫子庙附近的好吃的');
                return;
            }

            // UI状态切换：显示加载，隐藏结果，禁用按钮
            loadingDiv.classList.remove('hidden');
            responseArea.classList.add('hidden');
            askBtn.disabled = true;
            askBtn.classList.add('opacity-50', 'cursor-not-allowed');
            askBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 思考中...';

            try {
                const response = await fetch('/api/v1/ai/food-ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ question: question })
                });

                const result = await response.json();

                if (result.code === 200) {
                    // 显示结果区域
                    responseArea.classList.remove('hidden');

                    // 简单处理Markdown
                    let formattedAnswer = result.data.answer
                        .replace(/\n/g, '<br>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                    // 打字机效果
                    responseContent.innerHTML = ''; // 清空
                    let i = 0;
                    // 使用简单的HTML标签分割，保证标签被作为一个整体处理
                    // 这是一个简化的打字机实现
                    const typeWriter = () => {
                        if (i < formattedAnswer.length) {
                            // 检查是否是HTML标签的开始
                            if (formattedAnswer.substring(i).startsWith('<')) {
                                const tagEnd = formattedAnswer.indexOf('>', i);
                                if (tagEnd !== -1) {
                                    responseContent.innerHTML += formattedAnswer.substring(i, tagEnd + 1);
                                    i = tagEnd + 1;
                                    setTimeout(typeWriter, 10);
                                    return;
                                }
                            }
                            responseContent.innerHTML += formattedAnswer.charAt(i);
                            i++;
                            setTimeout(typeWriter, 15); // 打字速度
                        }
                    };
                    typeWriter();

                    // 在回答结束后，添加"收藏攻略"按钮
                    // 需要等待typeWriter完成，这里简单处理，延时或者直接追加
                    setTimeout(() => {
                        const actionArea = document.createElement('div');
                        actionArea.className = 'mt-4 flex justify-end items-center gap-3 border-t border-gray-100 pt-3';
                        actionArea.innerHTML = `
                            <button id="save-food-guide-btn" class="text-xs bg-stone-blue/10 text-stone-blue hover:bg-stone-blue hover:text-white px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                                <i class="fa fa-heart-o"></i> 收藏此攻略
                            </button>
                            <button class="text-xs text-gray-400 hover:text-stone-blue transition-colors gap-1 inline-flex items-center">
                                <i class="fa fa-thumbs-o-up"></i> 有帮助
                            </button>
                        `;

                        const responseContainer = document.querySelector('#ai-response-area .flex-1');
                        // 移除已有的action button (如果有)
                        const existingAction = responseContainer.querySelector('.mt-2.text-right');
                        if (existingAction) existingAction.remove();

                        responseContainer.appendChild(actionArea);

                        // 绑定收藏事件
                        document.getElementById('save-food-guide-btn').addEventListener('click', async function () {
                            try {
                                this.disabled = true;
                                this.innerHTML = '<i class="fa fa-spinner fa-spin"></i> 保存中...';

                                const response = await fetch('/api/v1/collections', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        type: 'food',
                                        content: {
                                            question: question,
                                            answer: result.data.answer,
                                            timestamp: Date.now()
                                        }
                                    })
                                });

                                const res = await response.json();
                                if (res.code === 200) {
                                    this.innerHTML = '<i class="fa fa-heart"></i> 已收藏';
                                    this.classList.remove('bg-stone-blue/10', 'text-stone-blue');
                                    this.classList.add('bg-palace-red', 'text-white');
                                } else {
                                    throw new Error(res.msg);
                                }
                            } catch (e) {
                                console.error('收藏攻略失败:', e);
                                alert('收藏失败，请重试');
                                this.innerHTML = '<i class="fa fa-heart-o"></i> 收藏此攻略';
                                this.disabled = false;
                            }
                        });

                    }, formattedAnswer.length * 15 + 500); // 粗略估算打字机结束时间

                } else {
                    alert('AI 暂时有些累了，请稍后再试：' + result.msg);
                }
            } catch (error) {
                console.error('AI请求出错:', error);
                alert('网络连接出现问题，请检查网络后重试');
            } finally {
                // UI状态恢复
                loadingDiv.classList.add('hidden');
                askBtn.disabled = false;
                askBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                askBtn.innerHTML = '<i class="fa fa-paper-plane"></i> 开始咨询';
            }
        });
    }

    // 渲染轮播图
    function renderCarousel(attractions) {
        const carousel = document.getElementById('carousel');
        const dotsContainer = document.getElementById('carousel-dots');
        if (!carousel || !dotsContainer) return;

        // 筛选要显示的轮播景点 (基于原始列表中的重点景点)
        const carouselIds = ['18', '3', '1', '5', '2'];
        const items = carouselIds.map(id => attractions.find(a => a.id === id)).filter(Boolean);

        // 如果没有匹配的，取前5个
        const displayItems = items.length > 0 ? items : attractions.slice(0, 5);

        // 为轮播图景点准备诗意描述
        const poeticDescriptions = {
            '18': '梧桐掩映，公馆静谧，漫步民国风华里的旧时光',
            '3': '画舫浅波，灯影摇红，夜游才是秦淮的正确打开方式',
            '1': '青山环抱，陵寝巍峨，钟山脚下览六朝烟云',
            '5': '萌宠成群，欢声笑语，在城市森林中邂逅自然野趣',
            '2': '六朝古都遗韵，民国风华犹存，在这里触摸南京的文化脉络'
        };

        carousel.innerHTML = displayItems.map((item, index) => `
            <a href="attraction-detail.html?id=${item.id}" class="carousel-item absolute inset-0 bg-cover bg-center transition-all duration-1500 ease-in-out ${index === 0 ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-full'} block"
                style="background-image: url('${item.image}'); background-position: center ${index === 4 ? '30%' : (index === 0 ? '40%' : '50%')};">
                <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/30"></div>
                <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div class="text-center text-white px-4 max-w-4xl">
                        <h2 class="text-4xl md:text-6xl lg:text-7xl font-kai mb-6 text-shadow ${index === 0 ? 'animate-fade-in-down' : ''} leading-tight">
                            ${item.name}</h2>
                        <p class="text-lg md:text-xl lg:text-3xl mx-auto text-shadow ${index === 0 ? 'animate-fade-in-up' : ''} max-w-2xl leading-relaxed">
                            ${poeticDescriptions[item.id] || item.description.split('。')[0]}</p>
                        <span class="inline-block mt-8 md:mt-10 px-8 py-3 md:px-12 md:py-4 bg-palace-red text-white rounded-full hover:bg-stone-blue transition-all duration-500 font-bold ${index === 0 ? 'animate-zoom-in' : ''} text-base md:text-lg transform hover:scale-105 shadow-xl pointer-events-auto">
                            探索景点 <i class="fa fa-arrow-right ml-2"></i>
                        </span>
                    </div>
                </div>
            </a>
        `).join('');

        dotsContainer.innerHTML = displayItems.map((_, index) => `
            <button class="carousel-dot w-4 h-4 md:w-5 md:h-5 rounded-full ${index === 0 ? 'bg-white' : 'bg-white/50'} transition-all duration-500 hover:scale-150"
                data-index="${index}"></button>
        `).join('');

        // 重新初始化轮播逻辑
        setupCarouselEvents();
    }

    // 设置轮播图事件 (在渲染后调用)
    function setupCarouselEvents() {
        const carousel = document.getElementById('carousel');
        if (!carousel) return;

        // 更新幻灯片和指示器引用
        slides = document.querySelectorAll('.carousel-item');
        dots = document.querySelectorAll('.carousel-dot');
        totalSlides = slides.length;
        currentSlide = 0;

        if (totalSlides === 0) return;

        // 重新绑定点点击事件
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                showSlide(index);
                resetAutoSlide();
            });
        });

        // 添加左右箭头控制
        const nextSlideBtn = document.getElementById('next-slide');
        const prevSlideBtn = document.getElementById('prev-slide');
        if (nextSlideBtn && prevSlideBtn) {
            nextSlideBtn.onclick = nextSlide;
            prevSlideBtn.onclick = prevSlide;
        }

        // 添加暂停/播放按钮控制
        const playPauseBtn = document.getElementById('play-pause');
        if (playPauseBtn) {
            playPauseBtn.onclick = togglePlayPause;
        }

        // 鼠标悬停暂停
        carousel.onmouseenter = stopAutoSlide;
        carousel.onmouseleave = startAutoSlide;

        // 启动自动轮播 (如果之前是播放状态)
        if (isPlaying) {
            isPlaying = false; // 先设为false以让start生效
            startAutoSlide();
        }
    }

    // 渲染热门景点 TOP10
    function renderTop10(attractions) {
        const container = document.getElementById('top10-container');
        if (!container) return;

        // 根据流行度排序取前10
        const top10 = [...attractions]
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 10);

        container.innerHTML = top10.map((item, index) => {
            const isHot = index < 3;
            const rank = index + 1;

            // 处理标签逻辑 (历史人文/自然景观/免费/美食)
            let tag1 = item.category.includes('history') ? '历史人文' : (item.category.includes('nature') ? '自然景观' : '城市文化');
            let tag2 = item.ticketPrice === '免费' || item.ticketPrice.includes('免费') ? '免费' :
                (item.category.includes('photo') ? '出片神地' : (item.category.includes('student') ? '学生优惠' : '超高人气'));

            // 提取简短描述（取描述的第一句话）
            let shortDesc = item.description.split('。')[0] + '。';
            if (shortDesc.length > 50) {
                shortDesc = shortDesc.substring(0, 48) + '...';
            }

            return `
                <a href="attraction-detail.html?id=${item.id}"
                    class="block bg-gradient-to-br from-light-beige to-white rounded-xl p-6 text-center shadow-lg hover:shadow-2xl transition-all duration-500 card-hover transform hover:-translate-y-2 relative overflow-hidden group">
                    <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${isHot ? 'from-palace-red to-stone-blue' : 'from-stone-blue to-palace-red'}"></div>
                    <div class="w-14 h-14 rounded-full ${isHot ? 'bg-palace-red' : 'bg-stone-blue'} flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        ${rank}</div>
                    <h3 class="font-bold text-xl text-stone-blue mb-2 group-hover:text-palace-red transition-colors duration-300">
                        ${item.name}</h3>
                    <p class="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed min-h-[2.5rem]">${shortDesc}</p>
                    <div class="text-sm text-gray-600 font-semibold mb-4">
                        <i class="fa fa-ticket text-palace-red mr-1"></i>
                        ${item.ticketPrice.includes('元') ? item.ticketPrice.split('/')[0] : (item.ticketPrice.includes('免费') ? '免费开放' : '详见详情')}
                    </div>
                    <div class="flex justify-center space-x-2 flex-wrap">
                        <span class="text-xs ${isHot ? 'bg-palace-red/10 text-palace-red' : 'bg-blue-100 text-blue-600'} px-3 py-1 rounded-full mb-1">${tag1}</span>
                        <span class="text-xs ${tag2 === '免费' ? 'bg-green-100 text-green-600' : (tag2 === '出片神地' ? 'bg-purple-100 text-purple-600' : 'bg-yellow-100 text-yellow-600')} px-3 py-1 rounded-full mb-1">${tag2}</span>
                    </div>
                </a>
            `;
        }).join('');
    }

    // 渲染笔记列表
    function renderNotes(notes) {
        const container = document.getElementById('notes-container');
        if (container) {
            // 检查当前页面是否是首页
            const isHomePage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';

            // 如果是首页，筛选出风景相关的笔记（排除美食攻略），然后显示前6篇
            let displayNotes;
            if (isHomePage) {
                // 风景相关分类：景点攻略、季节攻略、免费景点、本地人攻略、路线规划、新手攻略
                const landscapeCategories = ['景点攻略', '季节攻略', '免费景点', '本地人攻略', '路线规划', '新手攻略', '避坑指南'];
                // 先筛选出风景相关的笔记，再取前6篇
                const landscapeNotes = notes.filter(note => landscapeCategories.includes(note.category));
                displayNotes = landscapeNotes.slice(0, 6);
            } else {
                displayNotes = notes;
            }

            container.innerHTML = displayNotes.map(note => {
                return `
                    <div class="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 card-hover">
                        <div class="h-56 bg-cover bg-center transition-transform duration-500 hover:scale-105" style="background-image: url('${note.image}'); background-position: center 40%;"></div>
                        <div class="p-6">
                            <span class="inline-block px-3 py-1 bg-purple-100 text-purple-600 text-xs rounded-full mb-4">${note.category}</span>
                            <h3 class="text-xl font-bold text-stone-blue mb-3">${note.title}</h3>
                            <p class="text-gray-600 mb-4 line-clamp-3">${note.content}</p>
                            <div class="flex justify-between items-center mb-4">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 rounded-full bg-stone-blue flex items-center justify-center text-white mr-3">
                                        <i class="fa fa-user"></i>
                                    </div>
                                    <div>
                                        <span class="text-sm font-medium text-daiwa-gray">${note.author}</span>
                                        <div class="text-xs text-gray-500">${note.date}</div>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-4">
                                    <button class="flex items-center text-gray-400 hover:text-palace-red transition-colors">
                                        <i class="fa fa-heart-o mr-1"></i> <span>${note.likes.toLocaleString()}</span>
                                    </button>
                                    <button class="flex items-center text-gray-400 hover:text-stone-blue transition-colors">
                                        <i class="fa fa-bookmark-o mr-1"></i> <span>${note.bookmarks.toLocaleString()}</span>
                                    </button>
                                </div>
                            </div>
                            <a href="${note.url}" target="_blank" 
                               class="inline-block w-full py-2 text-center bg-light-beige text-stone-blue rounded-lg hover:bg-palace-red hover:text-white transition-colors font-bold">
                                查看原文 <i class="fa fa-external-link ml-1"></i>
                            </a>
                        </div>
                    </div>
                `;
            }).join('');

            // 如果是首页，添加"查看更多"链接
            if (isHomePage && notes.length > 6) {
                container.innerHTML += `
                    <div class="col-span-full text-center py-12">
                        <a href="notes.html" class="inline-block px-10 py-3 bg-palace-red text-white rounded-full hover:bg-stone-blue transition-all duration-300 font-bold transform hover:scale-105 shadow-lg hover:shadow-xl">
                            查看更多笔记 <i class="fa fa-long-arrow-right ml-2"></i>
                        </a>
                    </div>
                `;
            }
        }
    }

    // 渲染美食列表
    function renderFood(foods) {
        const container = document.getElementById('food-container');
        if (container && foods.length > 0) {
            container.innerHTML = '';

            foods.forEach(food => {
                const card = document.createElement('div');
                card.className = 'bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 card-hover transform hover:-translate-y-2';

                card.innerHTML = `
                    <div class="h-56 bg-cover bg-center transition-transform duration-500 hover:scale-105" style="background-image: url('${food.image}')"></div>
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-xl font-bold text-stone-blue">${food.name}</h3>
                            <span class="text-sm bg-warm-yellow/20 text-warm-yellow px-2 py-1 rounded-full font-bold">${food.tag}</span>
                        </div>
                        <p class="text-gray-600 mb-4 line-clamp-3 text-sm">${food.description}</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <i class="fa fa-star text-yellow-400 mr-1"></i>
                                <span class="font-medium">${food.rating}</span>
                            </div>
                            <div class="text-palace-red font-bold">
                                ${food.price}
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    }

    // 渲染景点列表
    function renderAttractions(attractions) {
        const container = document.getElementById('attractions-container');
        if (container) {
            container.innerHTML = '';

            // 移除可能存在的旧"查看更多"按钮容器
            const existingBtnContainer = document.getElementById('attractions-more-btn-container');
            if (existingBtnContainer) {
                existingBtnContainer.remove();
            }

            // 获取收藏列表 (使用全局变量 allFavorites)
            const favorites = allFavorites || [];

            if (attractions.length > 0) {
                attractions.forEach((attraction, index) => {
                    // 检查景点是否已收藏
                    const isFavorite = favorites.includes(attraction.id.toString());

                    // 是否隐藏（超过6个的默认隐藏）
                    const isHidden = index >= 6;

                    const card = document.createElement('div');
                    card.className = `bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 card-hover ${isHidden ? 'hidden extra-attraction' : ''}`;
                    card.setAttribute('data-category', attraction.category.join(' '));
                    card.setAttribute('data-attraction-id', attraction.id);

                    card.innerHTML = `
                        <div class="h-56 bg-cover bg-center transition-transform duration-500 hover:scale-105" style="background-image: url('${attraction.image}')"></div>
                        <div class="p-6">
                            <div class="flex items-center mb-4">
                                <div class="w-10 h-10 rounded-full bg-palace-red flex items-center justify-center text-white mr-3">
                                    <i class="fa fa-university"></i>
                                </div>
                                <h3 class="text-xl font-bold text-stone-blue">${attraction.name}</h3>
                            </div>
                            <p class="text-gray-600 mb-4 line-clamp-3">${attraction.description.substring(0, 120)}...</p>
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center">
                                    <div class="flex items-center mr-4">
                                        <i class="fa fa-star text-yellow-400 mr-1"></i>
                                        <span class="font-medium">${attraction.rating}</span>
                                    </div>
                                    <div>
                                        <i class="fa fa-ticket mr-1"></i>
                                        <span>${attraction.ticketPrice}</span>
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    ${attraction.category.map(cat => {
                        const catMap = {
                            'history': { text: '历史人文', bg: 'bg-palace-red/10', textColor: 'text-palace-red' },
                            'nature': { text: '自然景观', bg: 'bg-green-100', textColor: 'text-green-600' },
                            'city': { text: '城市休闲', bg: 'bg-blue-100', textColor: 'text-blue-600' },
                            'food': { text: '美食街区', bg: 'bg-yellow-100', textColor: 'text-yellow-600' },
                            'free': { text: '免费', bg: 'bg-green-100', textColor: 'text-green-600' },
                            'student': { text: '学生优惠', bg: 'bg-purple-100', textColor: 'text-purple-600' },
                            'family': { text: '亲子友好', bg: 'bg-pink-100', textColor: 'text-pink-600' },
                            'photo': { text: '拍照打卡', bg: 'bg-orange-100', textColor: 'text-orange-600' }
                        };
                        const catInfo = catMap[cat] || { text: cat, bg: 'bg-gray-100', textColor: 'text-gray-600' };
                        return `<span class="text-xs ${catInfo.bg} ${catInfo.textColor} px-2 py-1 rounded-full">${catInfo.text}</span>`;
                    }).join('')}
                                </div>
                            </div>
                            <div class="flex space-x-3">
                                <a href="attraction-detail.html?id=${attraction.id}" class="flex-1 py-2 text-center bg-light-beige text-stone-blue rounded-lg hover:bg-palace-red hover:text-white transition-colors font-bold">
                                    查看详情 <i class="fa fa-arrow-right ml-1"></i>
                                </a>
                                <button class="px-4 py-2 bg-stone-blue text-white rounded-lg hover:bg-palace-red transition-colors font-bold" onclick="window.locateOnMap('${attraction.name}', '${attraction.id}')">
                                    <i class="fa fa-map-marker mr-1"></i> 地图
                                </button>
                                <button class="px-4 py-2 bg-palace-red text-white rounded-lg hover:bg-stone-blue transition-colors font-bold" onclick="window.toggleFavorite('${attraction.id}', this)">
                                    <i class="fa ${isFavorite ? 'fa-heart' : 'fa-heart-o'} mr-1"></i> 收藏
                                </button>
                            </div>
                        </div>
                    `;
                    container.appendChild(card);
                });

                // 如果景点数量超过6个，添加"展开/收起"按钮
                if (attractions.length > 6) {
                    const btnContainer = document.createElement('div');
                    btnContainer.id = 'attractions-more-btn-container';
                    btnContainer.className = 'col-span-full text-center mt-12';
                    btnContainer.innerHTML = `
                        <button id="toggle-attractions-btn" class="px-10 py-3 bg-white border-2 border-stone-blue text-stone-blue rounded-full hover:bg-stone-blue hover:text-white transition-all duration-300 font-bold transform hover:scale-105 shadow-md">
                            展开所有景点 <i class="fa fa-angle-down ml-2"></i>
                        </button>
                    `;

                    // 将按钮容器插入到景点容器之后
                    container.parentNode.insertBefore(btnContainer, container.nextSibling);

                    // 添加点击事件
                    document.getElementById('toggle-attractions-btn').addEventListener('click', function () {
                        const extraAttractions = document.querySelectorAll('.extra-attraction');
                        const isExpanded = !extraAttractions[0].classList.contains('hidden');

                        if (isExpanded) {
                            // 收起
                            extraAttractions.forEach(el => el.classList.add('hidden'));
                            this.innerHTML = '展开所有景点 <i class="fa fa-angle-down ml-2"></i>';
                            // 滚动到景点区域顶部
                            document.getElementById('attractions').scrollIntoView({ behavior: 'smooth' });
                        } else {
                            // 展开
                            extraAttractions.forEach(el => el.classList.remove('hidden'));
                            this.innerHTML = '收起景点列表 <i class="fa fa-angle-up ml-2"></i>';
                        }
                    });
                }
            } else {
                container.innerHTML = `
                    <div class="col-span-full text-center py-12">
                        <i class="fa fa-search text-4xl text-gray-400 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">未找到匹配的景点</h3>
                        <p class="text-gray-600">请尝试其他关键词</p>
                    </div>
                `;
            }
        }
    }



    // 收藏景点功能 - 对接后端API (Collections)
    window.toggleFavorite = async function (attractionId, buttonElement) {
        if (!attractionId) return;

        // 检查当前状态
        const icon = buttonElement.querySelector('i');
        const isFavorite = icon.classList.contains('fa-heart');
        const attractionIdStr = attractionId.toString();

        // 乐观UI更新
        if (isFavorite) {
            icon.classList.remove('fa-heart');
            icon.classList.add('fa-heart-o');
            allFavorites = allFavorites.filter(id => id !== attractionIdStr);
        } else {
            icon.classList.remove('fa-heart-o');
            icon.classList.add('fa-heart');
            if (!allFavorites.includes(attractionIdStr)) {
                allFavorites.push(attractionIdStr);
            }
        }

        try {
            let response;
            if (isFavorite) {
                // 取消收藏 (需要指定 type=attraction)
                response = await fetch(`/api/v1/collections/target/${attractionId}?type=attraction`, {
                    method: 'DELETE'
                });
            } else {
                // 添加收藏
                response = await fetch('/api/v1/collections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'attraction',
                        target_id: attractionIdStr,
                        content: null // 景点详情已在数据库，只需存ID
                    })
                });
            }

            const result = await response.json();
            if (result.code !== 200) {
                throw new Error(result.msg);
            }

        } catch (error) {
            console.error('收藏操作失败:', error);
            alert('操作失败，请重试');
            // 回滚UI
            if (isFavorite) {
                icon.classList.add('fa-heart');
                icon.classList.remove('fa-heart-o');
                if (!allFavorites.includes(attractionIdStr)) allFavorites.push(attractionIdStr);
            } else {
                icon.classList.add('fa-heart-o');
                icon.classList.remove('fa-heart');
                allFavorites = allFavorites.filter(id => id !== attractionIdStr);
            }
        }
    };



    // 笔记筛选功能
    const noteFilterButtons = document.querySelectorAll('.filter-btn');

    if (noteFilterButtons.length > 0) {
        noteFilterButtons.forEach(button => {
            button.addEventListener('click', function () {
                // 移除所有按钮的激活状态
                noteFilterButtons.forEach(btn => {
                    btn.classList.remove('bg-palace-red', 'text-white');
                    btn.classList.add('bg-white', 'text-daiwa-gray');
                });

                // 为当前按钮添加激活状态
                this.classList.remove('bg-white', 'text-daiwa-gray');
                this.classList.add('bg-palace-red', 'text-white');

                const filterType = this.getAttribute('data-filter');

                // 筛选笔记
                let filteredNotes;
                if (filterType === 'all') {
                    filteredNotes = allNotes;
                } else {
                    filteredNotes = allNotes.filter(note => note.category === filterType);
                }

                // 重新渲染笔记
                renderNotes(filteredNotes);
            });
        });
    }

    // 笔记排序功能
    const sortNotesSelect = document.getElementById('sort-notes');

    if (sortNotesSelect) {
        sortNotesSelect.addEventListener('change', function () {
            const sortBy = this.value;
            // 获取当前激活的筛选按钮
            const activeFilterBtn = document.querySelector('.filter-btn.bg-palace-red');
            let baseNotes = allNotes;

            // 如果有激活的筛选按钮，使用筛选后的笔记作为排序基础
            if (activeFilterBtn) {
                const filterType = activeFilterBtn.getAttribute('data-filter');
                if (filterType !== 'all') {
                    baseNotes = allNotes.filter(note => note.category === filterType);
                }
            }

            let sortedNotes = [...baseNotes];

            // 根据选择的排序方式排序
            switch (sortBy) {
                case 'likes':
                    sortedNotes.sort((a, b) => b.likes - a.likes);
                    break;
                case 'bookmarks':
                    sortedNotes.sort((a, b) => b.bookmarks - a.bookmarks);
                    break;
                case 'newest':
                    sortedNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
                    break;
                default:
                    // 默认顺序，按ID排序
                    sortedNotes.sort((a, b) => a.id - b.id);
            }

            // 重新渲染笔记
            renderNotes(sortedNotes);
        });
    }

    // 景点分类筛选功能
    const attractionFilterButtons = document.querySelectorAll('#attractions .filter-btn');

    attractionFilterButtons.forEach(button => {
        button.addEventListener('click', function () {
            // 移除所有景点筛选按钮的激活状态
            attractionFilterButtons.forEach(btn => {
                btn.classList.remove('bg-palace-red', 'text-white');
                btn.classList.add('bg-white', 'text-daiwa-gray');
            });

            // 为当前按钮添加激活状态
            this.classList.remove('bg-white', 'text-daiwa-gray');
            this.classList.add('bg-palace-red', 'text-white');

            const filterType = this.getAttribute('data-filter');

            // 筛选景点
            let filteredAttractions;
            if (filterType === 'all') {
                filteredAttractions = allAttractions;
            } else {
                filteredAttractions = allAttractions.filter(attraction => {
                    return attraction.category.includes(filterType);
                });
            }

            // 更新景点列表
            renderAttractions(filteredAttractions);
        });
    });

    // 实时搜索功能
    function setupSearch() {
        const searchInputs = [
            { input: document.getElementById('search-input'), results: document.getElementById('search-results') },
            { input: document.getElementById('mobile-search-input'), results: document.getElementById('mobile-search-results') }
        ];

        searchInputs.forEach(({ input, results }) => {
            if (input && results) {
                input.addEventListener('input', function () {
                    const keyword = this.value.trim();
                    if (keyword.length > 0) {
                        performSearch(keyword, results);
                    } else {
                        results.classList.add('hidden');
                    }
                });

                // 点击外部关闭搜索结果
                document.addEventListener('click', function (e) {
                    if (!input.contains(e.target) && !results.contains(e.target)) {
                        results.classList.add('hidden');
                    }
                });
            }
        });
    }

    // 执行搜索
    function performSearch(keyword, resultsContainer) {
        // 搜索景点
        const matchedAttractions = allAttractions.filter(attraction => {
            return attraction.name.toLowerCase().includes(keyword.toLowerCase()) ||
                attraction.description.toLowerCase().includes(keyword.toLowerCase());
        });

        // 搜索笔记
        const matchedNotes = allNotes.filter(note => {
            return note.title.toLowerCase().includes(keyword.toLowerCase()) ||
                note.content.toLowerCase().includes(keyword.toLowerCase());
        }).map(note => ({ type: 'note', ...note }));

        // 合并搜索结果
        const results = [
            ...matchedAttractions.map(attraction => ({ type: 'attraction', ...attraction })),
            ...matchedNotes
        ];

        // 显示搜索结果
        displaySearchResults(results, resultsContainer, keyword);
    }

    // 显示搜索结果
    function displaySearchResults(results, container, keyword) {
        if (results.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-600">
                    <i class="fa fa-search text-2xl mb-2"></i>
                    <p>未找到匹配结果</p>
                </div>
            `;
            container.classList.remove('hidden');
            return;
        }

        container.innerHTML = results.map(result => {
            if (result.type === 'attraction') {
                return `
                    <div class="p-4 hover:bg-light-beige transition-colors cursor-pointer" onclick="searchResultClick('attraction', '${result.id}')">
                        <div class="flex items-center">
                            <div class="w-12 h-12 bg-cover bg-center rounded-lg mr-3" style="background-image: url('${result.image}')"></div>
                            <div class="flex-1">
                                <h4 class="font-bold text-stone-blue">${highlightKeyword(result.name, keyword)}</h4>
                                <p class="text-sm text-gray-600 line-clamp-2">${highlightKeyword(result.description.substring(0, 80), keyword)}...</p>
                                <div class="flex items-center mt-1">
                                    <i class="fa fa-star text-yellow-400 text-xs mr-1"></i>
                                    <span class="text-xs text-gray-500">${result.rating}</span>
                                    <span class="mx-2 text-gray-300">|</span>
                                    <span class="text-xs text-gray-500">${result.ticketPrice}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="p-4 hover:bg-light-beige transition-colors cursor-pointer" onclick="searchResultClick('note', '${result.id}')">
                        <div class="flex items-start">
                            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                <i class="fa fa-file-text-o text-purple-600"></i>
                            </div>
                            <div class="flex-1">
                                <div class="flex items-center mb-1">
                                    <span class="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mr-2">${result.category}</span>
                                </div>
                                <h4 class="font-bold text-stone-blue">${highlightKeyword(result.title, keyword)}</h4>
                                <p class="text-sm text-gray-600 line-clamp-2">${highlightKeyword(result.content.substring(0, 80), keyword)}...</p>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        container.classList.remove('hidden');
    }

    // 高亮关键词
    function highlightKeyword(text, keyword) {
        if (!keyword) return text;
        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.replace(regex, '<span class="bg-yellow-200 font-medium">$1</span>');
    }

    // 搜索结果点击处理
    window.searchResultClick = function (type, idOrElement) {
        if (type === 'attraction') {
            // 跳转到景点详情页
            window.location.href = `attraction-detail.html?id=${idOrElement}`;
        } else {
            // 滚动到对应笔记
            const noteElement = typeof idOrElement === 'string' ? document.getElementById(idOrElement) : idOrElement;
            if (noteElement) {
                noteElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // 高亮显示
                noteElement.classList.add('ring-2', 'ring-palace-red');
                setTimeout(() => {
                    noteElement.classList.remove('ring-2', 'ring-palace-red');
                }, 2000);
            }
        }

        // 关闭搜索结果
        document.querySelectorAll('#search-results, #mobile-search-results').forEach(el => {
            el.classList.add('hidden');
        });
    }

    // 确保所有跳转链接都正确添加
    function ensureAllLinks() {
        // 获取所有链接
        const allLinks = document.querySelectorAll('a');

        allLinks.forEach(link => {
            const href = link.getAttribute('href');

            // 确保外部链接在新窗口中打开
            if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }

            // 确保内部链接正确
            if (href && href.startsWith('#')) {
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    // 移动端菜单切换
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // 初始化数据加载
    loadAllData();

    // 自定义规划表单处理
    const customRouteForm = document.getElementById('custom-route-form');

    if (customRouteForm) {
        customRouteForm.addEventListener('submit', function (e) {
            e.preventDefault();

            // 获取表单数据
            const days = document.getElementById('days').value;
            const budget = document.getElementById('budget').value;
            const specialNeeds = document.getElementById('special-needs').value;

            // 获取选中的兴趣标签
            const selectedInterests = [];
            document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
                selectedInterests.push(checkbox.value);
            });

            // 生成示例行程
            generateSampleRoute(days, budget, selectedInterests, specialNeeds);
        });

        // 重置表单功能
        const resetButton = document.getElementById('reset-form');
        if (resetButton) {
            resetButton.addEventListener('click', function () {
                customRouteForm.reset();

                // 取消所有选中的复选框
                document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                });

                // 清空生成的行程
                const sampleRoutesContainer = document.getElementById('sample-routes');
                if (sampleRoutesContainer) {
                    sampleRoutesContainer.innerHTML = `
                        <h3 class="text-2xl font-bold mb-8 text-center text-stone-blue">示例行程</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <!-- 路线1：经典3日游 -->
                            <div class="bg-white rounded-xl overflow-hidden shadow-lg card-hover">
                                <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-palace-red/10 to-white">
                                    <h3 class="text-2xl font-bold flex items-center text-stone-blue">
                                        <span class="w-10 h-10 rounded-full bg-palace-red text-white flex items-center justify-center mr-3 text-lg">3</span>
                                        南京经典3日游
                                    </h3>
                                    <p class="text-gray-500 mt-2">覆盖核心景点，感受六朝古都魅力</p>
                                </div>
                                <div class="p-6">
                                    <!-- 第一天 -->
                                    <div class="mb-6">
                                        <h4 class="font-bold text-lg text-palace-red mb-3 flex items-center">
                                            <i class="fa fa-calendar-check-o mr-2"></i> Day 1：历史文化线
                                        </h4>
                                        <ul class="space-y-3">
                                            <li class="flex items-start">
                                                <span class="text-palace-red mr-3 mt-1"><i class="fa fa-map-marker"></i></span>
                                                <div>
                                                    <strong>上午：</strong>中山陵（免费，需预约）→ 音乐台（10元）喂白鸽
                                                </div>
                                            </li>
                                            <li class="flex items-start">
                                                <span class="text-palace-red mr-3 mt-1"><i class="fa fa-cutlery"></i></span>
                                                <div>
                                                    <strong>中午：</strong>陵园路梧桐餐厅（美龄粥必点）
                                                </div>
                                            </li>
                                            <li class="flex items-start">
                                                <span class="text-palace-red mr-3 mt-1"><i class="fa fa-map-marker"></i></span>
                                                <div>
                                                    <strong>下午：</strong>明孝陵（70元）→ 石象路拍照
                                                </div>
                                            </li>
                                            <li class="flex items-start">
                                                <span class="text-palace-red mr-3 mt-1"><i class="fa fa-moon-o"></i></span>
                                                <div>
                                                    <strong>晚上：</strong>新街口商圈晚餐+逛街
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="p-6 bg-light-beige flex justify-between items-center rounded-b-xl">
                                    <div>
                                        <span class="text-gray-500">预算参考：</span>
                                        <span class="font-bold text-palace-red text-lg">¥600-800/人</span>
                                    </div>
                                    <a href="#" class="text-stone-blue hover:text-palace-red transition-colors font-bold flex items-center">
                                        下载完整行程 <i class="fa fa-download ml-1"></i>
                                    </a>
                                </div>
                            </div>
                            
                            <!-- 路线2：文艺小众2日游 -->
                            <div class="bg-white rounded-xl overflow-hidden shadow-lg card-hover">
                                <div class="p-6 border-b border-gray-100 bg-gradient-to-r from-stone-blue/10 to-white">
                                    <h3 class="text-2xl font-bold flex items-center text-stone-blue">
                                        <span class="w-10 h-10 rounded-full bg-stone-blue text-white flex items-center justify-center mr-3 text-lg">2</span>
                                        文艺小众2日游
                                    </h3>
                                    <p class="text-gray-500 mt-2">避开人潮，发现南京的文艺一面</p>
                                </div>
                                <div class="p-6">
                                    <!-- 第一天 -->
                                    <div class="mb-6">
                                        <h4 class="font-bold text-lg text-stone-blue mb-3 flex items-center">
                                            <i class="fa fa-calendar-check-o mr-2"></i> Day 1：老城烟火线
                                        </h4>
                                        <ul class="space-y-3">
                                            <li class="flex items-start">
                                                <span class="text-stone-blue mr-3 mt-1"><i class="fa fa-map-marker"></i></span>
                                                <div>
                                                    <strong>上午：</strong>老门东三条营 → 芥子园（30元）
                                                </div>
                                            </li>
                                            <li class="flex items-start">
                                                <span class="text-stone-blue mr-3 mt-1"><i class="fa fa-cutlery"></i></span>
                                                <div>
                                                    <strong>中午：</strong>老门东"小潘记鸭血粉丝"
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="p-6 bg-light-beige flex justify-between items-center rounded-b-xl">
                                    <div>
                                        <span class="text-gray-500">预算参考：</span>
                                        <span class="font-bold text-stone-blue text-lg">¥400-600/人</span>
                                    </div>
                                    <a href="#" class="text-stone-blue hover:text-palace-red transition-colors font-bold flex items-center">
                                        下载完整行程 <i class="fa fa-download ml-1"></i>
                                    </a>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
        }
    }

    // 生成示例行程函数
    // 保存当前行程参数，用于重新生成
    let currentTripParams = null;

    async function generateSampleRoute(days, budget, interests, specialNeeds) {
        // 保存当前行程参数
        currentTripParams = {
            days: days,
            budget: budget,
            interests: interests,
            specialNeeds: specialNeeds
        };

        // 创建行程容器
        const sampleRoutesContainer = document.getElementById('sample-routes');

        // 清空之前的行程
        sampleRoutesContainer.innerHTML = `
            <h3 class="text-2xl font-bold mb-6 text-center text-stone-blue">AI为您定制的专属行程</h3>
            <div class="flex flex-col gap-10 w-full mx-auto" id="generated-route-container">
                <div class="bg-white rounded-lg overflow-hidden shadow-lg p-10 text-center">
                    <div class="mb-6 relative h-20">
                        <i class="fa fa-spinner fa-spin text-stone-blue text-5xl absolute top-0 left-1/2 transform -translate-x-1/2 transition-all duration-500" id="loading-icon-spinner"></i>
                        <i class="fa fa-check-circle text-green-500 text-5xl absolute top-0 left-1/2 transform -translate-x-1/2 opacity-0 transition-all duration-500" id="loading-icon-check"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-4 text-stone-blue" id="ai-loading-text">AI正在分析您的偏好...</h3>
                    <div class="w-2/3 mx-auto bg-gray-100 rounded-full h-2 mb-4 overflow-hidden">
                        <div class="bg-stone-blue h-full rounded-full transition-all duration-300" style="width: 0%" id="ai-loading-bar"></div>
                    </div>
                    <p class="text-gray-500 text-sm" id="ai-thought-log">开始读取数千条南京旅游数据...</p>
                </div>
            </div>
        `;

        // 模拟思考过程
        let progress = 0;
        const thinkingSteps = [
            "正在分析您的偏好...",
            "正在检索热门景点...",
            "正在寻找地道美食...",
            "正在计算最优路线...",
            "正在生成详细行程..."
        ];

        const loadingInterval = setInterval(() => {
            progress += Math.random() * 5;
            if (progress > 95) progress = 95;

            const bar = document.getElementById('ai-loading-bar');
            const text = document.getElementById('ai-loading-text');
            const log = document.getElementById('ai-thought-log');

            if (bar) bar.style.width = `${progress}%`;

            const stepIndex = Math.floor((progress / 100) * thinkingSteps.length);
            if (text && thinkingSteps[stepIndex]) {
                text.innerText = thinkingSteps[stepIndex];
                if (progress > 20 && progress < 40) log.innerText = "已定位到夫子庙、中山陵等热门区域...";
                if (progress > 40 && progress < 60) log.innerText = "发现几家评价极高的鸭血粉丝汤店...";
                if (progress > 60 && progress < 80) log.innerText = "正在优化第二天下午的交通方案...";
                if (progress > 80) log.innerText = "最后整理中...";
            }
        }, 800);

        try {
            // 调用后端AI路线规划API，使用Node.js服务器地址
            // 添加随机参数确保每次请求都能获得新的行程结果
            const apiUrl = 'http://localhost:3000/api/v1/agent/trip-planning?timestamp=' + Date.now();
            console.log('调用API:', apiUrl);
            console.log('请求参数:', { days, budget, interests, specialNeeds });

            // 设置30秒超时
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 增加到300秒(5分钟)防止大模型响应慢

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    days: days,
                    budget: budget,
                    interests: interests,
                    special_needs: specialNeeds,
                    // 添加随机种子参数，确保AI生成不同的行程
                    random_seed: Math.random().toString(36).substring(2, 15)
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            console.log('API响应状态:', response.status);
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            console.log('API返回结果:', result);

            if (result.code === 200 && result.data) {
                console.log('AI生成的行程数据:', result.data);
                // 生成行程内容


                const routeContainer = document.getElementById('generated-route-container');

                // 确保 createRouteContentFromAPI 和 addTripButtonsEventListeners 能接收到完整数据
                // 这里将按钮事件绑定移到innerHTML赋值之后
                const routeContent = createRouteContentFromAPI(result.data);
                routeContainer.innerHTML = routeContent;

                // 添加按钮事件监听器 - 必须在DOM更新后进行
                addTripButtonsEventListeners(result.data);

                // console.log('生成的行程HTML:', routeContent);
            } else {
                throw new Error(result.msg || '生成行程失败');
            }
        } catch (error) {
            console.error('生成行程失败:', error);
            console.error('错误堆栈:', error.stack);
            const routeContainer = document.getElementById('generated-route-container');
            routeContainer.innerHTML = `
                <div class="bg-white rounded-lg overflow-hidden shadow-lg p-6 text-center">
                    <i class="fa fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">生成行程失败</h3>
                    <p class="text-gray-600">${error.message || '请稍后重试或检查网络连接'}</p>
                    <p class="text-sm text-gray-500 mt-2">详细错误信息已记录在浏览器控制台，请按F12查看</p>
                    <button class="mt-4 px-6 py-2 bg-palace-red text-white rounded-full hover:bg-stone-blue transition-all duration-300 font-bold" onclick="location.reload()">
                        重试
                    </button>
                </div>
            `;
        }
    }

    // 创建行程内容（从API数据）
    function createRouteContentFromAPI(tripData) {
        console.log('开始生成行程HTML，tripData:', tripData);

        // 检查tripData是否有效
        if (!tripData) {
            console.error('tripData为空');
            return '<div class="text-center py-10 text-red-500">行程数据无效</div>';
        }

        // 检查daily_itineraries是否存在
        if (!tripData.daily_itineraries || !Array.isArray(tripData.daily_itineraries)) {
            console.error('daily_itineraries不存在或不是数组');
            return '<div class="text-center py-10 text-red-500">行程数据格式错误</div>';
        }

        // 时间段具体时间
        const timeSchedule = {
            morning: '09:00-12:00',
            noon: '12:00-13:30',
            afternoon: '14:00-17:30',
            evening: '18:00-20:30'
        };

        // 活动类型图标映射
        const activityTypeIcons = {
            'food': 'fa-cutlery',
            'view': 'fa-eye',
            'culture': 'fa-university',
            'leisure': 'fa-coffee',
            'shopping': 'fa-shopping-bag',
            'rest': 'fa-bed',
            'default': 'fa-map-marker'
        };

        // 活动类型颜色映射
        const activityTypeColors = {
            'food': 'bg-yellow-100 text-yellow-800',
            'view': 'bg-blue-100 text-blue-800',
            'culture': 'bg-red-100 text-red-800',
            'leisure': 'bg-green-100 text-green-800',
            'shopping': 'bg-purple-100 text-purple-800',
            'rest': 'bg-gray-100 text-gray-800',
            'default': 'bg-stone-blue-100 text-stone-blue-800'
        };

        // 交通方式建议
        const getTransportation = (activity) => {
            const transportOptions = [
                '建议乘坐地铁，方便快捷',
                '推荐共享单车，沿途欣赏风景',
                '建议打车前往，节省时间',
                '可以乘坐公交，体验当地生活',
                '步行前往，距离较近'
            ];
            return transportOptions[Math.floor(Math.random() * transportOptions.length)];
        };

        let content = `
            <!-- AI行程专门框框 -->
            <div class="bg-gradient-to-br from-white to-light-beige rounded-2xl overflow-hidden shadow-xl border-2 border-dashed border-stone-blue/30">
                <!-- 行程头部 -->
                <div class="p-8 bg-gradient-to-r from-stone-blue to-palace-red text-white">
                    <div class="flex items-center justify-between flex-wrap gap-4 mb-4">
                        <h3 class="text-3xl font-bold">${tripData.theme || 'AI专属行程'}</h3>
                        <div class="flex flex-wrap items-center gap-3">
                            <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                <i class="fa fa-robot mr-2"></i> AI生成
                            </div>
                            <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                <i class="fa fa-clock-o mr-2"></i> ${tripData.days || 1}日游
                            </div>
                            <div class="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                                <i class="fa fa-map mr-2"></i> ${tripData.mode || '灵活型'}行程
                            </div>
                        </div>
                    </div>
                    <p class="text-white/90">基于您的兴趣和需求，AI为您量身定制的南京之旅</p>
                    ${tripData.interests && tripData.interests.length > 0 ? `
                        <div class="mt-4 flex flex-wrap gap-2">
                            ${tripData.interests.map(interest => {
            const interestMap = {
                'history': '历史人文',
                'nature': '自然景观',
                'food': '美食餐饮',
                'city': '城市休闲',
                'free': '免费景点',
                'student': '学生优惠',
                'family': '亲子友好',
                'photo': '拍照打卡'
            };
            return `<span class="bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-sm">${interestMap[interest] || interest}</span>`;
        }).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <!-- 行程概览 -->
                <div class="p-8 bg-white border-b border-gray-100">
                    <h4 class="text-xl font-bold text-stone-blue mb-6">行程概览</h4>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div class="bg-light-beige p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div class="text-sm text-gray-500 mb-2">预算范围</div>
                            <div class="font-bold text-palace-red text-xl leading-tight">${getBudgetLabel(tripData.budget || 'medium')}</div>
                        </div>
                        <div class="bg-light-beige p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div class="text-sm text-gray-500 mb-2">兴趣标签</div>
                            <div class="font-bold text-stone-blue text-xl leading-tight">${tripData.interests && tripData.interests.length > 0 ? tripData.interests.slice(0, 2).join(', ') : '未选择'}</div>
                        </div>
                        <div class="bg-light-beige p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div class="text-sm text-gray-500 mb-2">总预算</div>
                            <div class="font-bold text-palace-red text-xl leading-tight">${tripData.total_budget || '¥600-1000/人'}</div>
                        </div>
                        <div class="bg-light-beige p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                            <div class="text-sm text-gray-500 mb-2">生成时间</div>
                            <div class="font-bold text-stone-blue text-xl leading-tight">${new Date(tripData.generation_time || Date.now()).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
                
                <!-- 每日行程 -->
                <div class="p-6">
        `;

        // 根据天数生成行程
        if (tripData.daily_itineraries.length === 0) {
            content += `
                <div class="text-center py-10 text-gray-500">
                    <i class="fa fa-info-circle text-4xl mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">暂无行程安排</h3>
                    <p>请尝试调整您的需求，重新生成行程</p>
                </div>
            `;
        } else {
            tripData.daily_itineraries.forEach((itinerary, index) => {
                // 每日主题色
                const themeColors = ['from-palace-red', 'from-stone-blue', 'from-grass-green', 'from-warm-yellow', 'from-sky-blue'];
                const themeColor = themeColors[index % themeColors.length];

                content += `
                    <!-- 每日行程卡片 -->
                    <div class="mb-12 bg-white rounded-xl overflow-hidden shadow-lg border-l-4 border-stone-blue">
                        <!-- 每日主题 -->
                        <div class="p-5 bg-gradient-to-r ${themeColor} to-white">
                            <h4 class="text-2xl font-bold text-stone-blue flex items-center">
                                <div class="w-10 h-10 rounded-full bg-stone-blue text-white flex items-center justify-center mr-3">
                                    ${index + 1}
                                </div>
                                ${itinerary.title || `第${index + 1}天行程`}
                            </h4>
                            <p class="text-sm text-gray-600 mt-1">${itinerary.mode} | ${itinerary.activities.length}个活动</p>
                        </div>
                        
                        <!-- 每日活动时间线 -->
                        <div class="p-6 md:p-8">
                            <!-- 活动列表 -->
                            <div class="flex flex-col gap-8">
                `;

                // 检查activities是否存在
                if (!itinerary.activities || !Array.isArray(itinerary.activities)) {
                    content += `
                        <div class="text-center py-8 text-gray-500">
                            <p>当日暂无活动安排</p>
                        </div>
                    `;
                } else {
                    // 生成每个活动
                    itinerary.activities.forEach((activity, activityIndex) => {
                        const timeRange = timeSchedule[activity.time] || '全天';
                        const transportation = getTransportation(activity);
                        const activityIcon = activityTypeIcons[activity.type] || activityTypeIcons['default'];
                        const activityColor = activityTypeColors[activity.type] || activityTypeColors['default'];

                        let activityContent = `
                            <!-- 活动卡片 -->
                            <div class="flex flex-col w-full bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group relative">
                                <!-- 时间线节点 -->
                                <div class="w-12 h-12 rounded-full bg-stone-blue text-white flex items-center justify-center z-10 shadow-md self-center -mt-6 group-hover:bg-palace-red transition-colors duration-300">
                                    <i class="fa ${activityIcon} text-lg"></i>
                                </div>
                                
                                <!-- 活动内容 -->
                                <div class="flex-1 bg-white rounded-xl p-6">
                                    <!-- 活动时间和类型 -->
                                    <div class="flex flex-wrap items-center justify-between mb-4 gap-3">
                                        <div class="flex items-center gap-3">
                                            <div class="text-base font-semibold text-stone-blue">
                                                ${activity.time === 'morning' ? '上午' : activity.time === 'noon' ? '中午' : activity.time === 'afternoon' ? '下午' : '晚上'}
                                                <span class="text-sm text-gray-500 ml-2">${timeRange}</span>
                                            </div>
                                            ${activity.type ? `
                                                <span class="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full ${activityColor} shadow-sm">
                                                    <i class="fa ${activityIcon}" style="font-size: 10px;"></i>
                                                    ${activity.type === 'food' ? '餐饮' : activity.type === 'view' ? '观光' : activity.type === 'culture' ? '文化' : activity.type === 'leisure' ? '休闲' : activity.type === 'shopping' ? '购物' : activity.type === 'rest' ? '休息' : '活动'}
                                                </span>
                                            ` : ''}
                                        </div>
                                    </div>
                        `;

                        if (activity.attraction) {
                            activityContent += `
                                            <!-- 景点信息 -->
                                    <div class="mb-4">
                                        <h5 class="font-bold text-2xl text-stone-blue mb-2 leading-tight">${activity.attraction.name || '未知景点'}</h5>
                                        <p class="text-gray-600 mb-4 leading-relaxed">${activity.attraction.description ? activity.attraction.description.substring(0, 150) + '...' : '暂无描述'}</p>
                                        
                                        <!-- 景点详情 -->
                                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-sm bg-light-beige p-4 rounded-lg">
                                            <div class="flex items-center gap-2 text-gray-700">
                                                <i class="fa fa-clock-o text-palace-red text-lg"></i>
                                                <div>
                                                    <div class="text-xs text-gray-500 mb-0.5">开放时间</div>
                                                    <div class="font-medium">${activity.attraction.openingHours || '未知'}</div>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-2 text-gray-700">
                                                <i class="fa fa-map-marker text-palace-red text-lg"></i>
                                                <div>
                                                    <div class="text-xs text-gray-500 mb-0.5">地址</div>
                                                    <div class="font-medium">${activity.attraction.address ? activity.attraction.address.substring(0, 25) + '...' : '未知'}</div>
                                                </div>
                                            </div>
                                            <div class="flex items-center gap-2 text-gray-700">
                                                <i class="fa fa-ticket text-palace-red text-lg"></i>
                                                <div>
                                                    <div class="text-xs text-gray-500 mb-0.5">门票</div>
                                                    <div class="font-medium">${activity.attraction.ticketPrice || '未知'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- 交通建议 -->
                                        <div class="bg-blue-50 p-4 rounded-lg mb-5 border-l-4 border-blue-400">
                                            <div class="flex items-start gap-3">
                                                <i class="fa fa-bus text-blue-600 text-xl mt-0.5"></i>
                                                <div>
                                                    <div class="text-sm font-medium text-blue-800 mb-1">交通建议</div>
                                                    <div class="text-gray-700">${transportation}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- 地图按钮 -->
                                        <button class="text-palace-red hover:text-stone-blue font-medium text-sm flex items-center gap-2 map-btn p-2 bg-palace-red/5 rounded-lg hover:bg-palace-red/10 transition-all duration-300" data-attraction-name="${activity.attraction.name || ''}">
                                            <i class="fa fa-map-o"></i> 在地图上查看位置
                                        </button>
                            `;
                        } else {
                            activityContent += `
                                            <!-- 活动信息 -->
                                    <div class="mb-4">
                                        <h5 class="font-bold text-2xl text-stone-blue mb-2 leading-tight">${activity.description || '暂无活动描述'}</h5>
                                        ${activity.location ? `
                                            <div class="flex items-center gap-3 text-base text-gray-700 mb-4">
                                                <i class="fa fa-map-marker text-palace-red text-lg"></i>
                                                <span>${activity.location}</span>
                                            </div>
                                        ` : ''}
                                        
                                        <!-- 交通建议 -->
                                        <div class="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                            <div class="flex items-start gap-3">
                                                <i class="fa fa-bus text-blue-600 text-xl mt-0.5"></i>
                                                <div>
                                                    <div class="text-sm font-medium text-blue-800 mb-1">交通建议</div>
                                                    <div class="text-gray-700">${transportation}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            `;
                        }

                        // 添加活动提示
                        if (activity.tips && Array.isArray(activity.tips)) {
                            activityContent += `
                                    <!-- 活动提示 -->
                                    <div class="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-5 rounded-r-lg shadow-sm">
                                        <div class="text-base font-medium text-yellow-800 mb-3 flex items-center gap-2">
                                            <i class="fa fa-lightbulb-o text-yellow-600 text-lg"></i>
                                            小贴士
                                        </div>
                                        <ul class="list-disc pl-6 space-y-2 text-base text-yellow-700 leading-relaxed">
                                            ${activity.tips.map(tip => `<li>${tip}</li>`).join('')}
                                        </ul>
                                    </div>
                            `;
                        }

                        activityContent += `
                                </div>
                            </div>
                        `;

                        content += activityContent;
                    });
                }

                content += `
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        // 添加总预算和提示
        content += `
                <!-- 行程总结 -->
                <div class="bg-white rounded-xl overflow-hidden shadow-lg border-t-4 border-palace-red mt-10 p-8">
                    <h4 class="text-2xl font-bold text-stone-blue mb-6">行程总结</h4>
                    
                    <!-- 预算信息 -->
                    <div class="bg-light-beige p-5 rounded-lg mb-6 shadow-sm">
                        <div class="flex flex-col md:flex-row justify-between items-center gap-3">
                            <div class="text-lg text-gray-700 font-medium">总预算参考</div>
                            <div class="font-bold text-3xl text-palace-red">${tripData.total_budget || '¥600-1000/人'}</div>
                        </div>
                    </div>
                    
                    <!-- AI小贴士 -->
                    <div class="mb-8">
                        <div class="text-lg font-medium text-stone-blue flex items-center gap-2 mb-4">
                            <i class="fa fa-lightbulb-o text-palace-red text-xl"></i>
                            AI为您准备的小贴士
                        </div>
                        <ul class="list-disc pl-6 space-y-3 text-gray-700 text-base leading-relaxed">
                            ${tripData.tips && Array.isArray(tripData.tips) ? tripData.tips.map(tip => `<li>${tip}</li>`).join('') : '<li>暂无小贴士</li>'}
                        </ul>
                    </div>
                    
                <!-- 操作按钮 -->
                <div class="flex flex-wrap gap-4 justify-center md:justify-start">
                    <button id="view-route-map-btn" class="px-8 py-3 bg-stone-blue text-white rounded-full hover:bg-stone-700 transition-all duration-300 font-bold transform hover:scale-105 shadow-lg flex items-center gap-2">
                         <i class="fa fa-map"></i> 查看全程地图路线
                    </button>
                    <button id="save-trip-btn" class="px-10 py-4 bg-stone-blue text-white rounded-full hover:bg-palace-red transition-all duration-300 font-bold transform hover:scale-105 shadow-lg hover:shadow-xl text-base">
                        <i class="fa fa-heart mr-2"></i> 收藏此行程
                    </button>
                    <button id="export-trip-btn" class="px-10 py-4 bg-palace-red text-white rounded-full hover:bg-stone-blue transition-all duration-300 font-bold transform hover:scale-105 shadow-lg hover:shadow-xl text-base">
                            <i class="fa fa-download mr-2"></i>
                            导出行程
                        </button>
                        <button id="regenerate-trip-btn" class="px-10 py-4 bg-stone-blue text-white rounded-full hover:bg-palace-red transition-all duration-300 font-bold transform hover:scale-105 shadow-lg hover:shadow-xl text-base">
                            <i class="fa fa-refresh mr-2"></i>
                            重新生成
                        </button>
                        <button id="share-trip-btn" class="px-10 py-4 bg-white text-stone-blue border-2 border-stone-blue rounded-full hover:bg-stone-blue hover:text-white transition-all duration-300 font-bold transform hover:scale-105 shadow-lg hover:shadow-xl text-base">
                            <i class="fa fa-share-alt mr-2"></i>
                            生成分享海报
                        </button>
                    </div>
                </div>
            </div>
        `;

        console.log('行程HTML生成完成，长度:', content.length);
        return content;
    }

    // 获取预算标签的中文描述
    function getBudgetLabel(budgetValue) {
        switch (budgetValue) {
            case 'low': return '经济型 (¥0-500/人)';
            case 'medium': return '舒适型 (¥500-1000/人)';
            case 'high': return '豪华型 (¥1000+/人)';
            default: return '未指定';
        }
    }

    // 添加行程按钮事件监听器
    function addTripButtonsEventListeners(tripData) {
        // 收藏行程按钮
        const saveTripBtn = document.getElementById('save-trip-btn');
        if (saveTripBtn) {
            saveTripBtn.addEventListener('click', async function () {
                try {
                    this.disabled = true;
                    this.innerHTML = '<i class="fa fa-spinner fa-spin mr-1"></i> 保存中...';

                    const response = await fetch('/api/v1/collections', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'plan',
                            content: tripData
                        })
                    });

                    const result = await response.json();
                    if (result.code === 200) {
                        this.innerHTML = '<i class="fa fa-check mr-1"></i> 已保存到收藏';
                        this.classList.remove('bg-stone-blue', 'text-white');
                        this.classList.add('bg-green-500', 'text-white');
                    } else {
                        throw new Error(result.msg);
                    }
                } catch (error) {
                    console.error('保存行程失败:', error);
                    alert('保存行程失败，请重试');
                    this.innerHTML = '<i class="fa fa-heart mr-1"></i> 收藏此行程';
                    this.disabled = false;
                }
            });
        }

        // 查看全程地图按钮
        const viewRouteMapBtn = document.getElementById('view-route-map-btn');
        if (viewRouteMapBtn) {
            viewRouteMapBtn.onclick = function (e) {
                e.preventDefault();
                showTripRouteOnMap(tripData);
            };
        }

        // 导出行程按钮
        const exportBtn = document.getElementById('export-trip-btn');
        if (exportBtn) {
            // 先移除之前的事件监听器，避免累积
            exportBtn.onclick = null;
            exportBtn.onclick = function (event) {
                // 阻止默认行为和冒泡
                event.preventDefault();
                event.stopPropagation();
                exportTrip(tripData);
            };
        }

        // 重新生成按钮
        const regenerateBtn = document.getElementById('regenerate-trip-btn');
        if (regenerateBtn) {
            // 先移除之前的事件监听器，避免累积
            regenerateBtn.onclick = null;
            regenerateBtn.onclick = function (event) {
                // 阻止默认行为和冒泡
                event.preventDefault();
                event.stopPropagation();
                regenerateTrip();
            };
        }

        // 分享海报按钮
        const shareBtn = document.getElementById('share-trip-btn');
        if (shareBtn) {
            // 先移除之前的事件监听器，避免累积
            shareBtn.onclick = null;
            shareBtn.onclick = function (event) {
                // 阻止默认行为和冒泡
                event.preventDefault();
                event.stopPropagation();
                generatePoster();
            };
        }

        // 地图查看按钮 (针对每个活动的小地图按钮)
        const mapBtns = document.querySelectorAll('.map-btn');
        mapBtns.forEach(btn => {
            // 先移除之前的事件监听器，避免累积
            btn.onclick = null;
            btn.onclick = function (event) {
                // 阻止默认行为和冒泡
                event.preventDefault();
                event.stopPropagation();
                const attractionName = this.getAttribute('data-attraction-name');
                if (attractionName) {
                    showLocationModal(attractionName);
                }
            };
        });
    }

    // 生成分享海报并下载
    function generatePoster() {
        const routeContainer = document.getElementById('generated-route-container');
        if (!routeContainer) return;

        // 显示加载提示
        const loadingToast = document.createElement('div');
        loadingToast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-8 py-4 rounded-lg z-50 flex items-center shadow-2xl';
        loadingToast.innerHTML = '<i class="fa fa-spinner fa-spin mr-3 text-2xl"></i> <span class="text-lg">正在生成精美长图...</span>';
        document.body.appendChild(loadingToast);

        // 1. 克隆节点以避免影响当前显示
        const clone = routeContainer.cloneNode(true);
        clone.style.width = '800px'; // 固定宽度以确保排版一致
        clone.style.margin = '0 auto';
        clone.style.padding = '40px';
        clone.style.backgroundColor = '#F5F2E9'; // 浅米色背景
        clone.classList.remove('w-full', 'max-w-7xl'); // 移除响应式宽度

        // 移除操作按钮区域
        const btnContainer = clone.querySelector('.flex.flex-wrap.gap-4');
        if (btnContainer) btnContainer.remove();

        // 2. 添加底部海报页脚 (二维码)
        const footer = document.createElement('div');
        footer.className = 'mt-10 pt-8 border-t-2 border-dashed border-stone-blue/30 flex justify-between items-center bg-white p-6 rounded-xl shadow-inner';
        footer.innerHTML = `
            <div>
                <h4 class="text-2xl font-kai font-bold text-stone-blue mb-2">金陵札记</h4>
                <p class="text-gray-500 text-sm">您的南京私人定制伴侣</p>
                <p class="text-palace-red font-bold mt-2 text-xs">jinlingzhaji.com</p>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-right hidden sm:block">
                    <p class="text-xs text-gray-400">长按识别二维码</p>
                    <p class="text-xs text-gray-400">查看详细互动行程</p>
                </div>
                <div id="poster-qrcode" class="bg-white p-2 rounded shadow-sm"></div>
            </div>
        `;
        clone.querySelector('.bg-white.rounded-xl.overflow-hidden.shadow-lg.border-t-4').appendChild(footer);

        // 创建临时容器放置克隆节点
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.appendChild(clone);
        document.body.appendChild(tempContainer);

        // 生成二维码
        // 使用当前页面URL或主页URL
        // 确保QRCode库已加载
        if (typeof QRCode !== 'undefined') {
            new QRCode(footer.querySelector('#poster-qrcode'), {
                text: window.location.href,
                width: 80,
                height: 80,
                colorDark: "#3D5A80",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        } else {
            console.warn("QRCode library not loaded");
            footer.querySelector('#poster-qrcode').innerHTML = "WebApp";
        }

        // 稍微延迟等待二维码渲染和图片加载
        setTimeout(() => {
            if (typeof html2canvas !== 'undefined') {
                html2canvas(clone, {
                    useCORS: true, // 允许跨域图片
                    scale: 2, // 2倍清晰度
                    backgroundColor: '#F5F5F0',
                    logging: false
                }).then(canvas => {
                    // 转换为图片并下载 (使用Blob URL以支持大文件)
                    canvas.toBlob(function (blob) {
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.download = `南京行_专属行程_${new Date().toLocaleDateString().replace(/\//g, '-')}.jpg`;
                        link.href = url;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);

                        // 延迟释放URL对象
                        setTimeout(() => {
                            URL.revokeObjectURL(url);
                        }, 100);

                        // 清理
                        document.body.removeChild(tempContainer);
                        document.body.removeChild(loadingToast);

                        // 成功提示
                        const successToast = document.createElement('div');
                        successToast.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-stone-blue/90 text-white px-8 py-4 rounded-lg z-50 shadow-2xl fade-out-up';
                        successToast.innerHTML = '<i class="fa fa-check-circle mr-2 text-green-400 text-xl"></i> <span class="font-bold">海报生成成功！</span>';
                        document.body.appendChild(successToast);
                        setTimeout(() => successToast.remove(), 2000);
                    }, 'image/jpeg', 0.9);
                }).catch(err => {
                    console.error('海报生成失败:', err);
                    document.body.removeChild(tempContainer);
                    document.body.removeChild(loadingToast);
                    alert('海报生成失败，请重试');
                });
            } else {
                console.error("html2canvas library not loaded");
                alert("组件加载失败，请刷新重试");
                document.body.removeChild(tempContainer);
                document.body.removeChild(loadingToast);
            }
        }, 800);
    }

    // 导出行程功能
    function exportTrip(tripData) {
        try {
            // 检查tripData是否有效
            if (!tripData) {
                alert('行程数据无效，无法导出！');
                return;
            }

            // 将行程数据转换为CSV格式
            const csv = convertTripToCSV(tripData);

            // 创建Blob对象
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

            // 创建下载链接
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `南京行程_${new Date().toISOString().split('T')[0]}.csv`;

            // 触发下载
            document.body.appendChild(a);
            a.click();

            // 清理
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // 显示下载成功提示
            alert('行程已成功导出为Excel可打开的CSV文件！');
        } catch (error) {
            console.error('导出行程失败:', error);
            alert('导出行程失败，请查看控制台获取详细信息！');
        }
    }

    // 将行程数据转换为CSV格式
    function convertTripToCSV(tripData) {
        let csv = '\uFEFF'; // 添加BOM头部，解决Excel打开中文乱码问题

        try {
            // CSV转义辅助函数
            const escapeCSV = (field) => {
                if (field === null || field === undefined) return '';
                const stringField = String(field);
                // 如果包含逗号、双引号或换行符，需要用双引号包围，并将内部双引号转义
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return `"${stringField.replace(/"/g, '""')}"`;
                }
                return stringField;
            };

            // 添加行程基本信息
            csv += '行程基本信息\n';
            csv += `总预算,${escapeCSV(tripData.total_budget || '未指定')}\n`;
            csv += `天数,${escapeCSV(tripData.days || '未指定')}\n`;
            csv += `主题,${escapeCSV(tripData.theme || 'AI专属行程')}\n`;
            csv += `生成时间,${escapeCSV(new Date().toLocaleDateString())}\n`;
            csv += '\n';

            // 添加AI小贴士
            csv += 'AI小贴士\n';
            csv += '序号,内容\n';
            if (tripData.tips && Array.isArray(tripData.tips)) {
                tripData.tips.forEach((tip, index) => {
                    csv += `${index + 1},${escapeCSV(tip)}\n`;
                });
            }
            csv += '\n';

            // 添加每日行程
            csv += '每日行程详细安排\n';
            csv += '日期/天数,时间段,活动类型,活动名称,详细描述,地点/地址,门票/价格,交通建议,备注提示\n';

            const timeSchedule = {
                morning: '09:00-12:00 (上午)',
                noon: '12:00-13:30 (中午)',
                afternoon: '14:00-17:30 (下午)',
                evening: '18:00-20:30 (晚上)'
            };

            const typeMap = {
                'food': '餐饮美食',
                'view': '观光游览',
                'culture': '历史文化',
                'leisure': '休闲娱乐',
                'shopping': '购物消费',
                'rest': '休息调整',
                'default': '其他活动'
            };

            if (tripData.daily_itineraries && Array.isArray(tripData.daily_itineraries)) {
                tripData.daily_itineraries.forEach((day, dayIndex) => {
                    const dayTitle = day.title || `第${dayIndex + 1}天`;

                    if (day.activities && Array.isArray(day.activities)) {
                        day.activities.forEach(activity => {
                            // 提取数据
                            const timeSlot = timeSchedule[activity.time] || activity.time || '全天';
                            const type = typeMap[activity.type] || '普通活动';

                            // 名称
                            let name = activity.description || '未命名活动';
                            if (activity.attraction) {
                                name = activity.attraction.name;
                            }

                            // 描述
                            let description = '';
                            if (activity.attraction && activity.attraction.description) {
                                description = activity.attraction.description;
                            } else if (activity.description && activity.description !== name) {
                                description = activity.description;
                            }

                            // 地点
                            let location = activity.location || '';
                            if (activity.attraction && activity.attraction.address) {
                                location = activity.attraction.address;
                            }

                            // 价格
                            let price = activity.price || '';
                            if (activity.attraction && activity.attraction.ticketPrice) {
                                price = activity.attraction.ticketPrice;
                            }

                            // 交通
                            let transport = '建议查询地图';
                            if (activity.type === 'transport') {
                                transport = activity.name; // 如果是交通类活动，名称既是交通方式
                            } else {
                                const transportOptions = [
                                    '建议乘坐地铁，方便快捷',
                                    '推荐共享单车，沿途欣赏风景',
                                    '建议打车前往，节省时间',
                                    '可以乘坐公交，体验当地生活',
                                    '步行前往，距离较近'
                                ];
                                // 简单随机或固定建议，保持与页面显示一致的逻辑
                                transport = transportOptions[Math.floor(Math.random() * transportOptions.length)];
                            }

                            // 提示
                            let tips = '';
                            if (activity.tips && Array.isArray(activity.tips)) {
                                tips = activity.tips.join('; ');
                            }

                            // 写入一行
                            csv += `${escapeCSV(dayTitle)},${escapeCSV(timeSlot)},${escapeCSV(type)},${escapeCSV(name)},${escapeCSV(description)},${escapeCSV(location)},${escapeCSV(price)},${escapeCSV(transport)},${escapeCSV(tips)}\n`;
                        });
                    }
                });
            }
        } catch (error) {
            console.error('转换行程数据为CSV失败:', error);
            csv += `转换失败,${error.message}\n`;
        }

        return csv;
    }

    // 重新生成行程功能
    function regenerateTrip() {
        if (!currentTripParams) {
            alert('无法获取当前行程参数，请重新生成行程！');
            return;
        }

        // 使用保存的参数重新生成行程
        generateSampleRoute(
            currentTripParams.days,
            currentTripParams.budget,
            currentTripParams.interests,
            currentTripParams.specialNeeds
        );
    }

    // 分享行程功能
    function shareTrip(tripData) {
        // 这里实现简单的分享功能，将行程链接复制到剪贴板
        // 实际项目中可以实现更复杂的分享功能，如生成分享链接、分享到社交媒体等
        const shareUrl = window.location.href;

        // 复制到剪贴板
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                alert('行程链接已复制到剪贴板！');
            })
            .catch(err => {
                console.error('复制失败:', err);
                alert('复制失败，请手动复制链接！');
            });
    }

    /* =========================================
       地图弹窗功能 - Modal Map Implementation
       ========================================= */
    let modalMap = null;
    let modalMarker = null;

    // 显示地图弹窗
    function showLocationModal(locationName) {
        const modal = document.getElementById('location-map-modal');
        if (!modal) return;

        // 显示弹窗
        modal.classList.remove('hidden');
        // 使用setTimeout确保display:block生效后再添加opacity，并在渲染后初始化地图
        setTimeout(() => {
            modal.classList.remove('opacity-0');

            // 延迟初始化地图，避免布局问题
            if (!modalMap) {
                initModalMap(locationName);
            } else {
                // 如果地图已存在，搜索新地点
                searchOnModalMap(locationName);
            }
        }, 50);
    }

    // 初始化弹窗地图
    function initModalMap(locationName) {
        const mapContainer = document.getElementById('modal-map-container');
        if (!mapContainer || typeof qq === 'undefined') return;

        // 移除"加载中"占位符
        mapContainer.innerHTML = '';

        // 初始化地图
        modalMap = new qq.maps.Map(mapContainer, {
            center: new qq.maps.LatLng(32.060255, 118.796877), // 默认南京中心
            zoom: 14,
            zoomControl: true,
            mapTypeControl: false
        });

        // 立即搜索
        searchOnModalMap(locationName);
    }

    // 在弹窗地图上搜索
    function searchOnModalMap(keyword) {
        if (!modalMap || typeof qq === 'undefined') return;

        // 更新标题
        const titleEl = document.getElementById('modal-map-title');
        if (titleEl) titleEl.innerText = keyword + ' - 位置详情';

        // 清除旧标记
        if (modalMarker) {
            modalMarker.setMap(null);
        }

        // 调用腾讯地图搜索服务
        const searchService = new qq.maps.SearchService({
            complete: function (results) {
                if (results.type === "POI_LIST" && results.detail.pois.length > 0) {
                    const poi = results.detail.pois[0];
                    const location = poi.latLng;

                    // 移动中心点
                    modalMap.panTo(location);
                    modalMap.zoomTo(16);

                    // 添加新标记
                    modalMarker = new qq.maps.Marker({
                        position: location,
                        map: modalMap,
                        animation: qq.maps.MarkerAnimation.DROP
                    });

                    // 添加信息窗口
                    const infoWin = new qq.maps.InfoWindow({
                        map: modalMap
                    });
                    infoWin.open();
                    infoWin.setContent(`<div style="padding:5px;font-weight:bold;">${poi.name}</div><div style="font-size:12px;color:#666;">${poi.address}</div>`);
                    infoWin.setPosition(location);

                    // 更新底部地址
                    const footerInfo = document.querySelector('#location-map-modal .p-3 span i.fa-location-arrow');
                    if (footerInfo && footerInfo.parentNode) footerInfo.parentNode.innerHTML = `<i class="fa fa-location-arrow text-palace-red"></i> ${poi.address}`;

                } else {
                    console.warn('未搜到地点:', keyword);
                }
            }
        });

        // 设置搜索范围为南京
        searchService.setLocation("南京");
        searchService.search(keyword);
    }

    // 关闭弹窗
    function closeLocationModal() {
        const modal = document.getElementById('location-map-modal');
        if (!modal) return;

        modal.classList.add('opacity-0');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }

    // 绑定关闭按钮事件（因为是动态添加的内容，可能需要直接绑定或者在全局绑定）
    // 这里直接绑定，因为脚本是在DOM加载后执行的
    const closeBtn = document.getElementById('close-map-modal');
    const modal = document.getElementById('location-map-modal');



    // 在地图上展示完整行程路线




    if (closeBtn) {
        closeBtn.addEventListener('click', closeLocationModal);
    }

    // 点击背景关闭
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeLocationModal();
            }
        });
    }

    // ==========================================
    // V2 Map Logic - Enhanced with Tabs & Labels
    // ==========================================

    // Global variable for V2 map data
    let currentMapTripDataV2 = null;
    let routeOverlaysV2 = [];

    function showTripRouteOnMap(tripData) {
        currentMapTripDataV2 = tripData;
        const modal = document.getElementById('location-map-modal');
        if (!modal) return;

        // 1. Show Modal
        modal.classList.remove('hidden');
        setTimeout(() => {
            modal.classList.remove('opacity-0');
            // Init Map
            if (typeof initModalMap === 'function') {
                // If initModalMap is defined in parent scope
                if (typeof modalMap === 'undefined' || !modalMap) {
                    initModalMap();
                }
            } else {
                console.error("initModalMap not found");
            }

            // 2. Generate Tabs
            const tabsContainer = document.getElementById('map-date-tabs');
            if (tabsContainer) {
                let tabsHtml = `<button onclick="window.filterMapByDayV2('all')" class="px-3 py-1 bg-stone-blue text-white rounded text-sm hover:shadow-md transition-all">全部</button>`;
                tripData.daily_itineraries.forEach((day, idx) => {
                    tabsHtml += `<button onclick="window.filterMapByDayV2(${idx})" class="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-stone-blue hover:text-white transition-all">Day ${day.day}</button>`;
                });
                tabsContainer.innerHTML = tabsHtml;
            }

            // Default View All
            window.filterMapByDayV2('all');

        }, 50);
    }

    // Global Filter Function
    window.filterMapByDayV2 = function (dayIndex) {
        // Ensure modalMap is accessible
        if (typeof modalMap === 'undefined' || !modalMap) return;
        if (!currentMapTripDataV2) return;

        // Update Tab Styles
        const tabs = document.querySelectorAll('#map-date-tabs button');
        tabs.forEach(btn => {
            const isSelected = (dayIndex === 'all' && btn.innerText === '全部') || btn.innerText === `Day ${parseInt(dayIndex) + 1}`;
            if (isSelected) {
                btn.classList.remove('bg-gray-200', 'text-gray-700');
                btn.classList.add('bg-stone-blue', 'text-white');
            } else {
                btn.classList.add('bg-gray-200', 'text-gray-700');
                btn.classList.remove('bg-stone-blue', 'text-white');
            }
        });

        // Clear Old Overlays
        if (typeof modalMarker !== 'undefined' && modalMarker) modalMarker.setMap(null);
        routeOverlaysV2.forEach(overlay => overlay.setMap(null));
        routeOverlaysV2 = [];

        const path = [];
        const latLngBounds = new qq.maps.LatLngBounds();

        // Filter Data
        let daysToShow = [];
        if (dayIndex === 'all') {
            daysToShow = currentMapTripDataV2.daily_itineraries;
        } else {
            daysToShow = [currentMapTripDataV2.daily_itineraries[dayIndex]];
        }

        // Set Title
        const titleEl = document.getElementById('modal-map-title');
        if (titleEl) {
            titleEl.innerText = currentMapTripDataV2.theme + (dayIndex === 'all' ? ' - 全程路线' : ` - Day ${parseInt(dayIndex) + 1} 路线`);
        }

        daysToShow.forEach((day, dIdx) => {
            const dayPath = [];
            // Unique Color per Day
            const dayColors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
            // Ensure consistent color mapping even when filtering single day
            const globalDayIndex = dayIndex === 'all' ? dIdx : dayIndex;
            const dayColor = dayColors[globalDayIndex % dayColors.length];

            day.activities.forEach(activity => {
                if (activity.lat && activity.lng) {
                    const latLng = new qq.maps.LatLng(activity.lat, activity.lng);
                    dayPath.push(latLng);
                    path.push(latLng);
                    latLngBounds.extend(latLng);

                    // Add Marker
                    const isFood = activity.type === 'food';
                    const marker = new qq.maps.Marker({
                        position: latLng,
                        map: modalMap,
                        title: activity.attraction ? activity.attraction.name : activity.description,
                    });

                    // Custom Label
                    const labelStyle = {
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: "bold",
                        backgroundColor: isFood ? "#ef4444" : dayColor,
                        borderRadius: "4px",
                        padding: "2px 6px",
                        border: "1px solid #fff",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                    };

                    const label = new qq.maps.Label({
                        position: latLng,
                        map: modalMap,
                        content: isFood ? "美食" : (activity.attraction?.name || "景点"),
                        style: labelStyle,
                        offset: new qq.maps.Size(-20, -45)
                    });

                    // InfoWindow
                    const infoWin = new qq.maps.InfoWindow({ map: modalMap });
                    qq.maps.event.addListener(marker, 'click', function () {
                        infoWin.open();
                        infoWin.setContent(`
                            <div style="padding:10px;min-width:220px;">
                                <div style="font-weight:bold;font-size:16px;color:#2c3e50;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:4px;">
                                    ${activity.attraction ? activity.attraction.name : activity.description.split('：')[0]}
                                </div>
                                <div style="font-size:13px;color:#666;margin-bottom:4px;">
                                    <span style="color:${dayColor};font-weight:bold;">Day ${day.day}</span> 
                                    <span style="margin:0 5px;">|</span>
                                    <i class="fa fa-clock-o"></i> ${activity.time}
                                </div>
                                <div style="font-size:12px;color:#888;background:#f9f9f9;padding:5px;border-radius:4px;">
                                    <i class="fa fa-map-marker text-red-400"></i> ${activity.location || '地址信息加载中'}
                                </div>
                            </div>
                        `);
                        infoWin.setPosition(latLng);
                    });

                    routeOverlaysV2.push(marker);
                    routeOverlaysV2.push(label);
                    routeOverlaysV2.push(infoWin);
                }
            });

            // Draw Polyline
            if (dayPath.length > 1) {
                const polyline = new qq.maps.Polyline({
                    path: dayPath,
                    strokeColor: dayColor,
                    strokeWeight: 6,
                    strokeDashStyle: 'solid',
                    map: modalMap
                });
                routeOverlaysV2.push(polyline);

                // Add Transport Labels (Midpoints)
                for (let i = 0; i < dayPath.length - 1; i++) {
                    const p1 = dayPath[i];
                    const p2 = dayPath[i + 1];
                    const midLat = (p1.getLat() + p2.getLat()) / 2;
                    const midLng = (p1.getLng() + p2.getLng()) / 2;

                    // Only add if distance is significant > 0.005 deg (~500m) to avoid clutter
                    if (Math.abs(p1.getLat() - p2.getLat()) > 0.005 || Math.abs(p1.getLng() - p2.getLng()) > 0.005) {
                        const transportLabel = new qq.maps.Label({
                            position: new qq.maps.LatLng(midLat, midLng),
                            map: modalMap,
                            content: `<div style='background:rgba(255,255,255,0.9);padding:2px 6px;border-radius:12px;border:1px solid #ccc;font-size:10px;color:#555;box-shadow:0 1px 2px rgba(0,0,0,0.1);'><i class='fa fa-arrow-down'></i> 交通</div>`,
                            style: { border: "none", backgroundColor: "transparent" },
                            offset: new qq.maps.Size(-25, -12)
                        });
                        routeOverlaysV2.push(transportLabel);
                    }
                }
            }
        });

        if (path.length > 0) {
            modalMap.fitBounds(latLngBounds);
        } else {
            alert("未找到有效的地图坐标点");
        }
    };
    // --- 悬浮音乐播放器逻辑 ---
    initMusicPlayer();

    function initMusicPlayer() {
        const playerContainer = document.getElementById('music-player-container');
        if (!playerContainer) return;

        const bgMusic = document.getElementById('bg-music');
        const musicDisc = document.getElementById('music-disc');
        const playPauseBtn = document.getElementById('btn-play-pause');
        const prevBtn = document.getElementById('btn-prev');
        const nextBtn = document.getElementById('btn-next');
        const songNameDisplay = document.getElementById('current-song-name');

        // 播放列表
        const playlist = [
            { name: "青花瓷 - 周杰伦", src: "music/周杰伦 - 青花瓷.mp3", season: "spring" },
            { name: "兰亭序 - 周杰伦", src: "music/周杰伦-兰亭序.mp3", season: "autumn" },
            { name: "稻香 - 周杰伦", src: "music/稻香-周杰伦.mp3", season: "summer" },
            { name: "起风了 - 买辣椒也用券", src: "music/买辣椒也用券 - 起风了.mp3", season: "spring" },
            { name: "消愁 - 毛不易", src: "music/木头 - 消愁（Cover 毛不易）.mp3", season: "autumn" },
            { name: "花雨落 - 任然", src: "music/任然 - 花雨落.mp3", season: "spring" },
            { name: "指纹 - 杜宣达", src: "music/杜宣达 - 指纹.mp3", season: "autumn" },
            { name: "冬眠 - 司南", src: "music/冬眠-司南#iXvj6.mp3", season: "winter" }
        ];

        // 初始化动效系统
        const seasonalEffects = new SeasonalEffects();

        let currentSongIndex = 0;
        let isMusicPlaying = false;

        // 默认开启列表循环播放
        // bgMusic.loop = false; // 确保由ended事件控制切换

        // 加载歌曲
        function loadSong(index) {
            const song = playlist[index];
            bgMusic.src = song.src;
            songNameDisplay.textContent = song.name;

            // 设置对应的动效季节
            if (song.season) {
                seasonalEffects.setSeason(song.season);
            }

            // 保存当前歌曲索引
            localStorage.setItem('music_current_index', index);
        }

        // 播放
        function playMusic() {
            bgMusic.play().then(() => {
                isMusicPlaying = true;
                musicDisc.classList.add('playing');
                playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
                // 启动动效
                if (seasonalEffects.isEnabled) {
                    seasonalEffects.start();
                }
                localStorage.setItem('music_playing', 'true');
            }).catch(e => {
                console.error("播放失败:", e);
                isMusicPlaying = false;
                localStorage.setItem('music_playing', 'false');
            });
        }

        // 暂停
        function pauseMusic() {
            bgMusic.pause();
            isMusicPlaying = false;
            musicDisc.classList.remove('playing');
            playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
            localStorage.setItem('music_playing', 'false');
        }

        // 记录播放进度
        bgMusic.addEventListener('timeupdate', () => {
            if (isMusicPlaying) {
                localStorage.setItem('music_current_time', bgMusic.currentTime);
            }
        });

        // 初始化状态恢复
        const savedIndex = localStorage.getItem('music_current_index');
        const savedTime = localStorage.getItem('music_current_time');
        const wasPlaying = localStorage.getItem('music_playing') === 'true';
        const effectsEnabled = localStorage.getItem('effects_enabled');

        // 恢复动效开关状态
        if (effectsEnabled === 'false') {
            seasonalEffects.isEnabled = false;
            const toggleBtn = document.getElementById('btn-toggle-effects');
            if (toggleBtn) {
                toggleBtn.style.background = 'rgba(128,128,128,0.3)';
                toggleBtn.title = '开启粒子效果';
            }
        }

        if (savedIndex !== null) {
            currentSongIndex = parseInt(savedIndex);
        }

        loadSong(currentSongIndex);

        // 等待音频元数据加载完成后再设置进度
        const onMetadataLoaded = () => {
            if (savedTime !== null && savedTime !== 'NaN') {
                bgMusic.currentTime = parseFloat(savedTime);
            }

            // 如果之前正在播放，添加等待播放的视觉提示
            if (wasPlaying) {
                musicDisc.classList.add('waiting-to-play');
                // 更新播放按钮图标为播放状态提示
                playPauseBtn.innerHTML = '<i class="fa fa-play"></i>';
                // 尝试自动播放（可能会因浏览器限制失败）
                bgMusic.play().then(() => {
                    // 自动播放成功
                    isMusicPlaying = true;
                    musicDisc.classList.remove('waiting-to-play');
                    musicDisc.classList.add('playing');
                    playPauseBtn.innerHTML = '<i class="fa fa-pause"></i>';
                    if (seasonalEffects.isEnabled) {
                        seasonalEffects.start();
                    }
                }).catch(() => {
                    // 自动播放失败，保持等待状态，等待用户点击
                    console.log('等待用户交互后继续播放...');
                });
            }
        };

        // 如果元数据已加载，直接执行；否则等待
        if (bgMusic.readyState >= 1) {
            onMetadataLoaded();
        } else {
            bgMusic.addEventListener('loadedmetadata', onMetadataLoaded, { once: true });
        }

        // 唱片点击：如果在等待状态则恢复播放，否则切换播放/暂停
        musicDisc.addEventListener('click', () => {
            if (musicDisc.classList.contains('waiting-to-play')) {
                // 从等待状态恢复播放
                musicDisc.classList.remove('waiting-to-play');
                playMusic();
            } else if (isMusicPlaying) {
                pauseMusic();
            } else {
                playMusic();
            }
        });

        // 播放按钮事件
        playPauseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // 如果处于等待状态，先移除
            if (musicDisc.classList.contains('waiting-to-play')) {
                musicDisc.classList.remove('waiting-to-play');
            }
            if (isMusicPlaying) {
                pauseMusic();
            } else {
                playMusic();
            }
        });

        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentSongIndex = (currentSongIndex - 1 + playlist.length) % playlist.length;
            loadSong(currentSongIndex);
            if (isMusicPlaying) playMusic();
        });

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            currentSongIndex = (currentSongIndex + 1) % playlist.length;
            loadSong(currentSongIndex);
            if (isMusicPlaying) playMusic();
        });

        // 自动下一首
        bgMusic.addEventListener('ended', () => {
            currentSongIndex = (currentSongIndex + 1) % playlist.length;
            loadSong(currentSongIndex);
            playMusic();
        });

        // 错误处理
        bgMusic.addEventListener('error', (e) => {
            console.error("音频加载错误，尝试下一首", e);
            // 避免死循环
            setTimeout(() => {
                currentSongIndex = (currentSongIndex + 1) % playlist.length;
                loadSong(currentSongIndex);
                if (isMusicPlaying) playMusic();
            }, 1000);
        });

        // 动效开关按钮
        const toggleEffectsBtn = document.getElementById('btn-toggle-effects');
        if (toggleEffectsBtn) {
            toggleEffectsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const enabled = seasonalEffects.toggle();
                localStorage.setItem('effects_enabled', enabled);
                if (enabled) {
                    toggleEffectsBtn.style.background = 'rgba(255,182,193,0.3)';
                    toggleEffectsBtn.title = '关闭粒子效果';
                } else {
                    toggleEffectsBtn.style.background = 'rgba(128,128,128,0.3)';
                    toggleEffectsBtn.title = '开启粒子效果';
                }
            });
        }
    }
});