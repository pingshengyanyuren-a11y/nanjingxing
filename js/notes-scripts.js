// 导航栏滚动效果
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('bg-daiwa-gray', 'bg-opacity-95', 'shadow-md');
        navbar.classList.remove('bg-transparent');
    } else {
        navbar.classList.remove('bg-daiwa-gray', 'bg-opacity-95', 'shadow-md');
        navbar.classList.add('bg-transparent');
    }
});

// 移动端菜单切换
document.getElementById('menu-toggle').addEventListener('click', function() {
    const mobileMenu = document.getElementById('mobile-menu');
    mobileMenu.classList.toggle('hidden');
});

// 轮播图功能
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-item');
const dots = document.querySelectorAll('.carousel-dot');
const totalSlides = slides.length;

function showSlide(index) {
    slides.forEach(slide => {
        slide.classList.add('opacity-0');
        slide.classList.remove('opacity-100');
    });
    dots.forEach(dot => {
        dot.classList.remove('bg-opacity-100');
        dot.classList.add('bg-opacity-50');
    });
    
    slides[index].classList.remove('opacity-0');
    slides[index].classList.add('opacity-100');
    dots[index].classList.remove('bg-opacity-50');
    dots[index].classList.add('bg-opacity-100');
    
    currentSlide = index;
}

// 自动轮播
let slideInterval = setInterval(() => {
    let nextSlide = (currentSlide + 1) % totalSlides;
    showSlide(nextSlide);
}, 5000);

// 点击 dots 切换轮播
dots.forEach(dot => {
    dot.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        showSlide(index);
    });
});

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

// 笔记数据
let notes = [];
let filteredNotes = [];

// 从API获取笔记数据
async function fetchNotes() {
    try {
        const response = await fetch('/data/notes.json');
        const data = await response.json();
        notes = data.notes;
        filteredNotes = [...notes];
        renderNotes(filteredNotes);
    } catch (error) {
        console.error('获取笔记数据失败:', error);
    }
}

// 渲染笔记
function renderNotes(notesToRender) {
    const notesContainer = document.getElementById('notes-container');
    notesContainer.innerHTML = '';
    
    notesToRender.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2';
        noteCard.innerHTML = `
            <div class="relative overflow-hidden h-56">
                <img src="${note.image}" alt="${note.title}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110">
                <div class="absolute top-4 left-4 bg-palace-red text-white px-3 py-1 rounded-full text-sm font-semibold">${note.category}</div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold mb-3 text-stone-blue line-clamp-2">${note.title}</h3>
                <p class="text-gray-600 mb-4 line-clamp-3">${note.content}</p>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-sm text-gray-500">${note.author}</span>
                    <span class="text-sm text-gray-500">${note.date}</span>
                </div>
                <div class="flex justify-between items-center">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center">
                            <i class="fa fa-heart-o text-gray-400 hover:text-palace-red transition-colors cursor-pointer"></i>
                            <span class="ml-1 text-sm text-gray-600">${note.likes}</span>
                        </div>
                        <div class="flex items-center">
                            <i class="fa fa-bookmark-o text-gray-400 hover:text-stone-blue transition-colors cursor-pointer"></i>
                            <span class="ml-1 text-sm text-gray-600">${note.bookmarks}</span>
                        </div>
                    </div>
                    <a href="${note.url}" target="_blank" class="text-palace-red hover:text-stone-blue transition-colors text-sm font-semibold flex items-center">
                        查看原文 <i class="fa fa-arrow-right ml-1"></i>
                    </a>
                </div>
            </div>
        `;
        notesContainer.appendChild(noteCard);
    });
    
    // 重新绑定点赞收藏事件
    bindLikeBookmarkEvents();
}

// 绑定点赞收藏事件
function bindLikeBookmarkEvents() {
    document.querySelectorAll('.fa-heart-o').forEach(heart => {
        heart.addEventListener('click', function() {
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
        bookmark.addEventListener('click', function() {
            this.classList.toggle('fa-bookmark-o');
            this.classList.toggle('fa-bookmark');
            this.classList.toggle('text-stone-blue');
            const count = this.nextElementSibling;
            count.textContent = this.classList.contains('fa-bookmark') 
                ? parseInt(count.textContent) + 1 
                : parseInt(count.textContent) - 1;
        });
    });
}

// 筛选笔记
function filterNotes(category) {
    if (category === 'all') {
        filteredNotes = [...notes];
    } else {
        filteredNotes = notes.filter(note => note.category === category);
    }
    renderNotes(filteredNotes);
}

// 排序笔记
function sortNotes(sortBy) {
    switch (sortBy) {
        case 'likes':
            filteredNotes.sort((a, b) => b.likes - a.likes);
            break;
        case 'bookmarks':
            filteredNotes.sort((a, b) => b.bookmarks - a.bookmarks);
            break;
        case 'newest':
            filteredNotes.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        default:
            filteredNotes = [...notes];
            break;
    }
    renderNotes(filteredNotes);
}

// 搜索笔记
function searchNotes(keyword) {
    if (!keyword) {
        filteredNotes = [...notes];
        renderNotes(filteredNotes);
        return;
    }
    
    filteredNotes = notes.filter(note => 
        note.title.includes(keyword) || 
        note.content.includes(keyword) || 
        note.category.includes(keyword)
    );
    renderNotes(filteredNotes);
}

// 初始化
function init() {
    // 获取笔记数据
    fetchNotes();
    
    // 绑定筛选按钮事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有按钮的active类
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-palace-red', 'text-white');
                b.classList.add('bg-white', 'text-daiwa-gray');
            });
            // 添加当前按钮的active类
            this.classList.add('bg-palace-red', 'text-white');
            this.classList.remove('bg-white', 'text-daiwa-gray');
            // 筛选笔记
            filterNotes(this.dataset.filter);
        });
    });
    
    // 绑定排序事件
    document.getElementById('sort-notes').addEventListener('change', function() {
        sortNotes(this.value);
    });
    
    // 绑定搜索事件
    document.getElementById('search-input').addEventListener('input', function() {
        searchNotes(this.value);
    });
    
    document.getElementById('mobile-search-input').addEventListener('input', function() {
        searchNotes(this.value);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);