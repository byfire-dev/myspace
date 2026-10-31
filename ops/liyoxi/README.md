# 狸有戏报名接收服务

Node.js 内置 HTTP + SQLite，无 npm 依赖。Node 22.13+（本地 22.17）与服务器 Node 25.8 可运行。只监听 `127.0.0.1:8797`，数据库放在网页目录之外：`/var/lib/liyoxi/enrollments.sqlite`。SQLite 使用 WAL 与 FULL synchronous；服务日志不记录手机号、称呼、请求体或 Basic 凭证。

## API 契约

`POST /liyoxi/api/enrollments`，`Content-Type: application/json`，必须带允许的 `Origin`。默认只允许 `https://myspace.byfire.ai`。JSON 示例（不要用示例手机号进行真实外呼）：

```json
{"requestId":"b640e579-2247-4aa7-aea9-3e37818b1eb1","phone":"13800000000","name":"称呼","courseIds":[1,3],"source":"official_account","consent":true,"website":""}
```

- `requestId` 为浏览器生成的 UUID，同一次提交的网络重试必须复用，修改内容后应生成新 UUID。
- `phone` 必须符合 `^1[3-9]\d{9}$`；`name` 可省略，trim 后最多 50 个字符。
- `courseIds` 为 1–13 的数字数组，去重排序后保存；空数组表示请顾问推荐。
- `source` 仅支持 `official_account`、`website`、`direct`。
- `consent` 必须为布尔 `true`。前端应明确说明联系方式用于跟进本次课程咨询并让用户主动勾选。
- `website` 为隐藏的蜜罐字段，可省略或空字符串；有值时拒绝请求。
- 请求体上限 8 KB，字段类型错误、额外字段、非法 JSON 都会拒绝。
- 首次保存返回 HTTP 201，完全相同的规范化内容重试返回 200；响应为 `{ "ok": true, "registrationId": "UUID", "createdAt": "ISO8601 UTC" }`。
- 同一 requestId 改为其他内容返回 409。其他错误返回正确的 4xx/5xx 与 `{ "ok": false, "error": { "code": "...", "message": "..." } }`。前端只能在成功状态码且成功字段完整时显示提交成功。
- IP 限流为每 15 分钟 60 次报名请求；429 响应附 `Retry-After`。服务重启会重置内存限流计数。
- `GET /liyoxi/api/health` 无需 Origin 和鉴权，健康时仅返回 `{ "ok": true }`，失败返回 500，不泄露报名数量或数据库路径。

## 首次部署

版本目录布局为 `/opt/liyoxi/releases/<sha>/{public,ops/liyoxi}`，`/opt/liyoxi/current` 指向当前发布版本。后端文件位于 `current/ops/liyoxi/`，文件归 root 所有、服务用户只读。先上传完整版本并建立 current 软链接，再在服务器管理员终端运行：

```sh
sudo useradd --system --user-group --home /var/lib/liyoxi --shell /sbin/nologin liyoxi
sudo install -d -m 0755 /opt/liyoxi
sudo install -d -m 0700 /etc/liyoxi
sudo install -d -o liyoxi -g liyoxi -m 0700 /var/lib/liyoxi
sudo /usr/bin/node /opt/liyoxi/current/ops/liyoxi/create-admin-env.mjs
sudo install -m 0644 /opt/liyoxi/current/ops/liyoxi/liyoxi-enrollment.service /etc/systemd/system/liyoxi-enrollment.service
sudo systemctl daemon-reload
sudo systemctl enable --now liyoxi-enrollment
```

`useradd` 只在账号不存在时执行。凭证生成器默认拒绝覆盖已有文件。新密码只写入 root 可读的 `/etc/liyoxi/admin-credentials.txt`（0600），服务读取同样为 0600 的 `/etc/liyoxi/liyoxi.env`。环境文件只含 scrypt 密码哈希。管理员在自己的安全 SSH 会话中读取凭证，不要把密码贴进聊天、日志或代码仓库。需要轮换时加 `--rotate` 并重启服务；轮换会重写该环境文件的默认配置，先保留自行增加的配置。

所有必需凭证未配置时，服务启动失败，不存在默认公开后台。

在现有 `myspace.byfire.ai` HTTPS Nginx server 中加入以下 location（静态 `/liyoxi/` 的配置由网站部署负责）：

```nginx
location ^~ /liyoxi/api/ {
    client_max_body_size 8k;
    proxy_pass http://127.0.0.1:8797;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_connect_timeout 3s;
    proxy_read_timeout 20s;
    access_log off;
}
location = /liyoxi/admin { return 308 /liyoxi/admin/; }
location ^~ /liyoxi/admin/ {
    proxy_pass http://127.0.0.1:8797;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 20s;
    access_log off;
}
```

必须覆盖客户端提供的真实 IP 头，不能直接透传。不要把 8797 绑定到公网。Basic 后台只能通过 HTTPS 使用。调整配置后先 `sudo nginx -t` 再 reload，并验证 HTTPS 的 API 健康检查和未登录后台 401。首次上线前提交一条标记明确的测试意向，确认后台可见和 CSV 导出，再按报名编号删除测试数据。

## 查看与导出

受 HTTP Basic 保护的只读后台：`https://myspace.byfire.ai/liyoxi/admin/`；显示最新 200 条，CSV 可导出全部。后台及 CSV 均显示课程中文全称（含编号）、中文来源和北京时间（Asia/Shanghai），共用 `constants.mjs` 的映射与格式化方法；数据库和 API 的 `createdAt` 仍为 UTC ISO8601。后台对 HTML 转义，CSV 对公式开头加单引号。后台无公开写入或删除接口；报名条目中不存储 IP。

安全服务器命令行导出、删除指定记录：

```sh
sudo -u liyoxi /usr/bin/node /opt/liyoxi/current/ops/liyoxi/cli.mjs export --output /var/lib/liyoxi/enrollments-export.csv
sudo -u liyoxi /usr/bin/node /opt/liyoxi/current/ops/liyoxi/cli.mjs delete --id REGISTRATION_UUID
```

CSV 文件权限 0600，默认拒绝覆盖已有输出；CLI 不向标准输出打印报名内容。`delete` 只删指定报名编号并输出删除数量，适用于清理 E2E 数据和处理删除请求。此操作删除在线数据库记录；外部导出文件和历史备份须由管理员另行管理。数据库与导出文件包含联系方式，应限制服务器与后台访问，按实际业务需要制定保留期限；本服务不作任何未经核实的合规认证声明。

## 本地验证与配置

```sh
node --test ops/liyoxi/server.test.mjs
```

环境变量：`LIYOXI_ADMIN_USER`、`LIYOXI_ADMIN_PASSWORD_HASH` 必填；`LIYOXI_PORT` 默认 8797；`LIYOXI_DB_PATH` 默认上述路径；`LIYOXI_ALLOWED_ORIGINS` 以英文逗号分隔，可为本地端到端验证额外加入 `http://127.0.0.1:8796`，线上保持精确域名。

测试覆盖输入与类型校验、持续保存并重启后幂等、同编号内容冲突、Origin 校验、8 KB 限制（包含 chunked 请求）、正确错误状态、限流、后台鉴权、HTML/CSV 转义、CLI 导出删除，以及凭证生成不输出密码。
