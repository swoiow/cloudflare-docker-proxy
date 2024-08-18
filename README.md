# Cloudflare Docker Registry Proxy

## 概述

本项目是一个基于Cloudflare Workers反代Docker上游的服务。它将请求路由到不同的Docker Registry，处理身份验证，并执行必要的重定向，特别是针对DockerHub Image。

## 特性

- 改动`BASE_DOMAIN`即可，在**设置**里面直接配置域名
- **代理请求**：根据主机名将请求路由到不同的 Docker 注册表。
- **身份验证处理**：在需要时管理身份验证，通过获取令牌来完成。
- **DockerHub 重定向**：自动重定向 DockerHub 图像的请求。
- **灵活路由**：支持各种 Docker 注册表端点，包括 DockerHub、Quay、GCR 等。

## 支持的上游

- Docker Hub (`docker.xxx.xxx`)
- Quay (`quay.xxx.xxx`)
- Google Container Registry (GCR) (`gcr.xxx.xxx`)
- Kubernetes GCR (`k8s-gcr.xxx.xxx`)
- Kubernetes Registry (`k8s.xxx.xxx`)
- GitHub Container Registry (GHCR) (`ghcr.xxx.xxx`)
- Cloudsmith (`cloudsmith.xxx.xxx`)
- Amazon ECR (`ecr.xxx.xxx`)

## 安装

要使用 Cloudflare Workers 部署此代理，请按照以下步骤操作：

1. **创建 Cloudflare Worker**：
   - 前往 [Cloudflare Workers Dashboard](https://workers.cloudflare.com/)。
   - 创建一个新的 Worker。

2. **部署 Worker**：
   - 使用 [Cloudflare Workers CLI (wrangler)](https://developers.cloudflare.com/workers/cli-wrangler) 部署 Worker。
   - 确保已安装 `wrangler`。如果没有，请使用 npm 安装：

     ```bash
     npm install -g wrangler
     ```

   - 使用以下命令进行 Cloudflare 身份验证：

     ```bash
     wrangler login
     ```

   - 在项目目录中创建一个 `wrangler.toml` 配置文件。例如：

     ```toml
     name = "docker-registry-proxy"
     type = "javascript"

     [env.production]
     workers_dev = true
     compatibility_date = "2024-08-18"

     [triggers]
     crons = []
     ```

   - 使用 `wrangler` 部署 Worker：

     ```bash
     wrangler publish
     ```

## 配置

在代码中，将 `BASE_DOMAIN` 常量更新为您的域名或子域名。`routes` 对象将主机名映射到上游 Docker 注册表的 URL。根据需要修改此对象。

## 使用

部署后，代理将根据主机名和路径路由请求。例如：

- 请求 `docker.xxx.me` 将路由到 Docker Hub。
- 请求 `gcr.xxx.me` 将路由到 Google Container Registry。

对于 DockerHub 图像，代理会自动在路径中插入 `library/`（如有需要）。

## 贡献

欢迎贡献！如果您有建议或改进，请遵循以下步骤：

1. Fork 该仓库。
2. 创建一个功能分支 (`git checkout -b feature/YourFeature`)。
3. 提交您的更改 (`git commit -am 'Add new feature'`)。
4. 推送到分支 (`git push origin feature/YourFeature`)。
5. 创建一个新的 Pull Request。

## 许可

本项目遵循 MIT 许可 - 详见 [LICENSE](LICENSE) 文件。

---

# English Version

## Overview

This project is a Cloudflare Workers-based proxy for Docker registries. It routes requests to various Docker registries, handles authentication, and performs necessary redirects, particularly for DockerHub images.

## Features

- **Proxying Requests**: Routes requests to different Docker registries based on the hostname.
- **Authentication Handling**: Manages authentication by fetching tokens when needed.
- **DockerHub Redirects**: Automatically redirects requests for DockerHub library images.
- **Flexible Routing**: Supports various Docker registry endpoints, including DockerHub, Quay, GCR, and more.

## Supported Registries

- Docker Hub (`docker.xxx.xxx`)
- Quay (`quay.xxx.xxx`)
- Google Container Registry (GCR) (`gcr.xxx.xxx`)
- Kubernetes GCR (`k8s-gcr.xxx.xxx`)
- Kubernetes Registry (`k8s.xxx.xxx`)
- GitHub Container Registry (GHCR) (`ghcr.xxx.xxx`)
- Cloudsmith (`cloudsmith.xxx.xxx`)
- Amazon ECR (`ecr.xxx.xxx`)

## Installation

To deploy this proxy using Cloudflare Workers, follow these steps:

1. **Create a Cloudflare Worker**:
   - Go to [Cloudflare Workers Dashboard](https://workers.cloudflare.com/).
   - Create a new Worker.

2. **Deploy the Worker**:
   - Use the [Cloudflare Workers CLI (wrangler)](https://developers.cloudflare.com/workers/cli-wrangler) to deploy the Worker.
   - Ensure you have `wrangler` installed. If not, install it using npm:

     ```bash
     npm install -g wrangler
     ```

   - Authenticate with Cloudflare:

     ```bash
     wrangler login
     ```

   - Create a `wrangler.toml` configuration file in your project directory. Example:

     ```toml
     name = "docker-registry-proxy"
     type = "javascript"

     [env.production]
     workers_dev = true
     compatibility_date = "2024-08-18"

     [triggers]
     crons = []
     ```

   - Deploy your Worker using `wrangler`:

     ```bash
     wrangler publish
     ```

## Configuration

In the code, update the `BASE_DOMAIN` constant to match your domain or subdomain. The `routes` object maps hostnames to upstream Docker registry URLs. Modify this object to fit your needs.

## Usage

Once deployed, the proxy will route requests based on the hostname and path. For example:

- Requests to `docker.xxx.xxx` will be routed to Docker Hub.
- Requests to `gcr.xxx.xxx` will be routed to Google Container Registry.

For DockerHub library images, the proxy will automatically insert `library/` into the path if needed.

## Contributing

Contributions are welcome! If you have suggestions or improvements, please follow these steps:

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/YourFeature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/YourFeature`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
