FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package.json pnpm-lock.yaml* ./

# 安装pnpm
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建
RUN pnpm build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm

# 只复制生产依赖
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 8080

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动
CMD ["node", "dist/server.js"]

