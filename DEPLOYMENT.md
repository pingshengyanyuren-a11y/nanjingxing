# 南京旅游攻略网站部署文档

## 项目概述
这是一个南京旅游攻略网站，提供景点介绍、美食推荐、行程规划等功能。

## 技术栈
- Node.js + Express
- SQLite数据库
- OpenAI API（通过硅基流动）

## 部署方式

### 方式一：免费云平台部署（推荐，无需付费）

#### Zeabur部署（国内访问最快）⭐ 强烈推荐

**优点**：
- 完全免费（每月$5额度）
- 国内访问速度快
- 配置简单，GitHub自动部署
- 支持Node.js

**部署步骤**：

1. **注册账号**
   - 访问 https://zeabur.com
   - 使用GitHub账号登录

2. **创建项目**
   - 点击 "New Project"
   - 选择 "Import from GitHub"
   - 授权GitHub并选择仓库：`pingshengyanyuren-a11y/nanjingxing`

3. **配置服务**
   - Zeabur会自动检测Node.js项目
   - 点击服务进入配置页面

4. **设置环境变量**
   - 点击服务 → "Variables" 标签
   - 添加以下环境变量：
     ```
     PORT=3001
     OPENAI_API_KEY=你的API密钥
     OPENAI_BASE_URL=https://api.siliconflow.cn/v1
     ```

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成（约1-2分钟）
   - 部署完成后会获得类似 `https://nanjing-travel.zeabur.app` 的域名

**注意事项**：
- 免费额度每月$5，足够运行此项目
- 15分钟无访问会自动休眠，再次访问需要10-20秒启动
- 数据存储在内存中，休眠后数据会丢失（建议使用外部数据库）

#### Render部署（配置最简单）

**优点**：
- Web服务永久免费
- 配置简单，GitHub集成
- 支持自动部署

**部署步骤**：

1. **注册账号**
   - 访问 https://render.com
   - 使用GitHub账号登录

2. **创建Web服务**
   - 点击 "New +" → "Web Service"
   - 点击 "Connect" 连接GitHub仓库
   - 选择仓库：`pingshengyanyuren-a11y/nanjingxing`

3. **配置服务**
   - Name: `nanjing-travel`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`

4. **设置环境变量**
   - 在 "Environment" 部分添加：
     ```
     PORT=3001
     OPENAI_API_KEY=你的API密钥
     OPENAI_BASE_URL=https://api.siliconflow.cn/v1
     ```

5. **部署**
   - 点击 "Create Web Service"
   - 等待部署完成（约2-3分钟）
   - 访问：`https://nanjing-travel.onrender.com`

**注意事项**：
- 免费版会休眠，15分钟无访问后休眠，再次访问需要15秒启动
- 国内访问速度一般
- 每月750小时免费额度

#### Railway部署（功能强大）

**优点**：
- 每月$5免费额度
- 功能强大，支持数据库
- 界面友好

**部署步骤**：

1. **注册账号**
   - 访问 https://railway.app
   - 使用GitHub账号登录

2. **创建项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"
   - 选择仓库：`pingshengyanyuren-a11y/nanjingxing`

3. **配置服务**
   - Railway会自动检测Node.js项目
   - 点击服务进入配置页面

4. **设置环境变量**
   - 点击 "Variables" 标签
   - 添加：
     ```
     PORT=3001
     OPENAI_API_KEY=你的API密钥
     OPENAI_BASE_URL=https://api.siliconflow.cn/v1
     ```

5. **部署**
   - 点击 "Deploy"
   - 部署完成后会自动分配域名

**注意事项**：
- 免费额度每月$5，足够运行此项目
- 国内访问速度一般
- 支持添加PostgreSQL等数据库

### 方式二：直接部署到云服务器（需要付费）

#### 1. 准备工作
- 一台国内云服务器（阿里云、腾讯云、华为云等）
- 安装Node.js 18+和npm
- 配置安全组，开放3001端口

#### 2. 部署步骤
```bash
# 1. 克隆项目
git clone https://github.com/pingshengyanyuren-a11y/nanjingxing.git
cd nanjingxing

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑.env文件，配置API密钥等信息
vim .env

# 4. 启动服务
npm start

# 或者使用pm2管理进程（推荐）
npm install -g pm2
pm run build
pm run start:prod
```

#### 3. 配置反向代理（可选）
推荐使用Nginx配置域名访问：
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 方式二：Docker部署

#### 1. 准备工作
- 安装Docker和Docker Compose
- 配置安全组，开放3001端口

#### 2. 部署步骤
```bash
# 1. 克隆项目
git clone https://github.com/pingshengyanyuren-a11y/nanjingxing.git
cd nanjingxing

# 2. 配置环境变量
cp .env.example .env
# 编辑.env文件，配置API密钥等信息
vim .env

# 3. 构建并启动容器
docker-compose up -d
```

## 环境变量说明

| 变量名 | 描述 | 默认值 |
|--------|------|--------|
| PORT | 服务器端口 | 3001 |
| OPENAI_API_KEY | OpenAI API密钥 | - |
| OPENAI_BASE_URL | AI API基础URL | https://api.siliconflow.cn/v1 |

## 数据库管理

项目使用SQLite数据库，数据库文件位于`data/notes.db`。

## 维护命令

```bash
# 查看日志
npm run logs
# 或
docker-compose logs -f

# 重启服务
npm run restart
# 或
docker-compose restart

# 更新项目
git pull
npm install
npm run restart
# 或
docker-compose down
git pull
docker-compose up -d --build
```

## 故障排查

### 常见问题
1. **端口占用**：
   ```bash
   # 查看端口占用情况
   lsof -i :3001
   # 或
   netstat -tlnp | grep 3001
   ```

2. **依赖问题**：
   ```bash
   # 重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **AI API问题**：
   - 检查API密钥是否正确
   - 检查网络连接是否正常
   - 查看服务器日志获取详细错误信息

## 性能优化建议

1. 使用PM2管理进程，配置负载均衡
2. 配置Nginx或CDN缓存静态资源
3. 定期备份数据库
4. 监控服务器资源使用情况

## 安全建议

1. 不要将API密钥等敏感信息硬编码到代码中
2. 配置适当的安全组规则，限制访问IP
3. 定期更新依赖包，修复安全漏洞
4. 启用HTTPS，配置SSL证书
