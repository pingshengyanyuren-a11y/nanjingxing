# 南京旅游攻略网站

一个基于Node.js和Express开发的南京旅游攻略网站，为用户提供南京景点介绍、美食推荐、行程规划等功能。

## 功能特点

- 📍 **景点推荐**：提供南京热门景点的详细介绍、评分、地址等信息
- 🍜 **美食指南**：推荐南京特色美食和餐厅
- 📅 **智能行程规划**：基于AI的个性化行程推荐
- 📝 **旅行笔记**：用户可以记录和分享旅行心得
- 📱 **响应式设计**：适配各种设备

## 技术栈

- **后端**：Node.js + Express
- **数据库**：SQLite
- **AI集成**：OpenAI API（通过硅基流动）
- **前端**：HTML5 + CSS3 + JavaScript

## 快速开始

### 环境要求

- Node.js 18+
- npm 8+

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/pingshengyanyuren-a11y/nanjingxing.git
cd nanjingxing
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
```

4. 启动开发服务器
```bash
npm start
```

5. 访问网站
```
http://localhost:3001/index.html
```

## 项目结构

```
├── css/              # 样式文件
├── data/             # 数据文件
│   ├── attractions.json  # 景点数据
│   ├── food.json         # 美食数据
│   └── notes.db          # SQLite数据库
├── images/           # 图片资源
├── js/               # JavaScript文件
├── music/            # 音乐文件
├── server.js         # 服务器入口
├── package.json      # 项目配置
└── .env.example      # 环境变量模板
```

## API接口

### 景点相关
- `GET /api/v1/attractions` - 获取所有景点
- `GET /api/v1/attractions/:id` - 获取景点详情

### 智能推荐
- `POST /api/v1/agent/recommendation` - 获取个性化推荐
- `POST /api/v1/agent/trip-planning` - 生成行程规划

### 搜索功能
- `POST /api/v1/search` - 搜索景点

### 笔记功能
- `GET /api/v1/notes` - 获取所有笔记
- `POST /api/v1/notes` - 创建笔记
- `PUT /api/v1/notes/:id` - 更新笔记
- `DELETE /api/v1/notes/:id` - 删除笔记

## 部署

详见 [DEPLOYMENT.md](DEPLOYMENT.md) 文件。

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

ISC
