# Rhex 项目协作规则

## 回复语言
- 始终使用简体中文回复用户。
- 代码、命令、路径、镜像名、标识符等技术内容保持原文，不要翻译。

## 文件修改
- 所有文件修改必须使用 `apply_patch`。
- 不要用 `sed -i`、`perl -i`、`ed`、`echo > file`、`printf > file`、`cat <<EOF > file` 等 shell 写文件方式修改内容。
- 优先做外科式最小改动，不要因为局部改动而整文件重写。

## Docker 镜像
- 生产服务器默认按 `linux/amd64` 处理。
- 构建并推送 GHCR `latest` 镜像时，不要直接使用本机默认 `docker build` 后 `docker push`，因为 Apple Silicon 本机可能默认产出 `linux/arm64`。
- 正确命令：

```bash
docker buildx build --platform linux/amd64 -t ghcr.io/momofa/rhex-custom:latest --push .
```

- 推送后必须验证镜像平台：

```bash
docker buildx imagetools inspect ghcr.io/momofa/rhex-custom:latest
```

- 验证结果中运行镜像 manifest 必须包含：

```txt
Platform: linux/amd64
```

- `Platform: unknown/unknown` 通常是 buildx 的 attestation manifest，不是运行镜像本体，可以忽略。

## Git 操作
- 提交前先执行 `git status --short`。
- 只暂存本次明确修改的文件，不要误提交未跟踪目录，例如 `?? tools/`。
- Git 提交信息使用英文 conventional commit，例如：

```txt
fix: prevent logo flash during initial load
```

## 本地校验
- 首选 TypeScript 校验：

```bash
./node_modules/.bin/tsc --noEmit --pretty false
```

- 当前项目 `pnpm lint` 可能因为 lockfile/config 环境问题失败，不要直接判定为本次改动导致。
- Docker `buildx build --push` 成功通常代表生产构建已通过。

## 首屏 Header / LOGO 闪动问题
- 如果强刷时 Header 或 LOGO 闪现，优先检查：
  1. `/src/app/layout.tsx` 里的 `<body>` 是否服务端初始 `visibility: hidden`。
  2. `data-root-init` 是否从 `pending` 切到 `ready`。
  3. `/src/components/theme-provider.tsx` 是否在初始化完成后移除 `document.body` 的 `visibility` 和 `overflow` 内联样式。
  4. `/src/components/site-header.tsx` 的 LOGO 文案是否包含 `shrink-0 whitespace-nowrap`。
- 这类问题的根因通常是服务端 HTML 在 CSS/主题初始化完成前被浏览器绘制一帧。

## 插件加载模式
- Rhex 是系统先提供扩展点，插件运行时按需扫描、缓存并挂到 `slots`、`surfaces`、`hooks`、`routes`、`APIs`。
- 不要理解为插件先于系统启动。
