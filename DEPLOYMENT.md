# 南京旅游攻略网站部署文档

## 项目概述
这是一个南京旅游攻略网站，提供景点介绍、美食推荐、行程规划等功能。

## 技术栈
- Node.js + Express
- SQLite数据库
- OpenAI API（通过硅基流动）

## 部署方式

### 方式一：直接部署到云服务器（推荐）

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
