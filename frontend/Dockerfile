# 直接使用 nginx，不需要编译（dist 文件夹已在 Git 仓库中）
FROM nginx:alpine

# 复制已编译好的前端文件
COPY dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]


