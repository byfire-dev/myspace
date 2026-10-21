# myspace.byfire.ai 证书维护

本目录保存该域名的 acme.sh 续期服务、定时器和 Nginx 恢复脚本。静态网站发布不应覆盖服务器的证书目录。

## 维护范围与背景

- 证书客户端：服务器 `/root/.acme.sh/acme.sh`，使用 Let's Encrypt、TLS-ALPN-01 和 `ec-256` 密钥。
- Nginx 使用独立目录 `/etc/nginx/ssl/myspace.byfire.ai/` 中的 `fullchain.pem` 与 `privkey.pem`。
- HTTP 挑战路径在源站能返回内容，但公网访问曾返回 Beaver ICP 拦截页面，因此继续使用已采用的 TLS-ALPN-01。
- TLS-ALPN-01 需要临时释放 443 端口。**验证期间，同一个 Nginx 承载的其他站点也会短暂中断**；安排维护时应计入这些站点。
- 2026-10-22 迁移备份目录：`/var/backups/myspace/tls-20261022-0108`。备份可能包含私钥，仅限服务器管理员读取，不应提交到仓库或复制到网站目录。
- 此次已确认 acme.sh 仅管理该域名，原 root 每六小时运行的 acme.sh cron 已备份移除。后续如增加证书，应重新设计调度，避免绕过本服务直接运行并发续期。

本文记录维护方式；签发命令执行、timer 启用和公网恢复情况需以实际日志及握手结果确认。

## 安装文件与权限

以下命令由服务器 root 在可信的仓库副本目录执行；不包含安装或升级 acme.sh：

```bash
install -m 755 ops/tls/myspace-tls-hooks.sh /usr/local/sbin/myspace-tls-hooks
install -m 644 ops/tls/myspace-tls-renew.service /etc/systemd/system/myspace-tls-renew.service
install -m 644 ops/tls/myspace-tls-renew.timer /etc/systemd/system/myspace-tls-renew.timer
install -d -m 700 /etc/nginx/ssl/myspace.byfire.ai
systemctl daemon-reload
```

初次签发前不预建空证书文件：prehook 遇到已存在但不完整的证书对会停止操作。不要在证书文件仍为空时让 Nginx 指向它们。服务使用固定的 `--ecc`；如以后更换证书密钥类型，需同时更新服务与安装命令。

## 首次迁移与钩子配置

acme.sh 3.1.5 的 `--renew` 会读取已保存的域名钩子；不能用 `--renew --pre-hook ... --post-hook ...` 来更新它们。此次首次迁移通过同一个 systemd 服务临时执行 `--issue`，保存钩子并保留超时恢复保障。

1. 备份 Nginx 配置、原证书及两个客户端的相关配置；保留现有可启动的 Nginx 配置。
2. 首次操作期间先停止新 timer，避免同时触发。确认原 acme cron 已按实际管理范围迁移。
3. 在 `/run/systemd/system/myspace-tls-renew.service.d/bootstrap.conf` 写入：

```ini
[Service]
ExecStart=
ExecStart=/usr/bin/flock --nonblock --conflict-exit-code 75 /run/lock/myspace-tls-renew.lock /root/.acme.sh/acme.sh --home /root/.acme.sh --issue --alpn -d myspace.byfire.ai --keylength ec-256 --server letsencrypt --pre-hook "/usr/local/sbin/myspace-tls-hooks pre" --post-hook "/usr/local/sbin/myspace-tls-hooks post"
```

4. 执行 `systemctl daemon-reload`，再 `systemctl start myspace-tls-renew.service`。查看服务状态和日志；不要为重试绕过该服务手动停 Nginx。首次或失败重试都不要盲目添加 `--force`。
5. 成功获得证书后，用官方安装入口保存复制目标和重新加载命令：

```bash
touch /etc/nginx/ssl/myspace.byfire.ai/fullchain.pem /etc/nginx/ssl/myspace.byfire.ai/privkey.pem
chown root:root /etc/nginx/ssl/myspace.byfire.ai/fullchain.pem /etc/nginx/ssl/myspace.byfire.ai/privkey.pem
chmod 644 /etc/nginx/ssl/myspace.byfire.ai/fullchain.pem
chmod 600 /etc/nginx/ssl/myspace.byfire.ai/privkey.pem
/root/.acme.sh/acme.sh --home /root/.acme.sh --install-cert -d myspace.byfire.ai --ecc \
  --key-file /etc/nginx/ssl/myspace.byfire.ai/privkey.pem \
  --fullchain-file /etc/nginx/ssl/myspace.byfire.ai/fullchain.pem \
  --reloadcmd '/usr/local/sbin/myspace-tls-hooks reload'
```

6. 仅修改该域名的 Nginx `ssl_certificate` 和 `ssl_certificate_key`，分别指向上述 `fullchain.pem` 与 `privkey.pem`。执行 `nginx -t` 后重新加载，检查实际握手返回的新证书。不要继续将 acme.sh 文件手工覆盖到 Certbot 的 `archive`。
7. 仅将该域名失效的 `/etc/letsencrypt/renewal/myspace.byfire.ai.conf` 移到受保护的备份目录。先确认实际证书配置名称；保留旧 `live`、`archive` 和其他域名配置，**不要禁用全局 Certbot 服务或 timer**。
8. 无论首次签发成功或失败，完成本次诊断后清除临时 bootstrap，恢复常规续期入口：

```bash
rm -f /run/systemd/system/myspace-tls-renew.service.d/bootstrap.conf
systemctl daemon-reload
systemctl cat myspace-tls-renew.service
```

确认有效 `ExecStart` 已恢复为 `--renew -d myspace.byfire.ai --ecc` 并显式包含 `--home /root/.acme.sh`，且证书、安装目标、钩子都已正确保存后再启用 timer：

```bash
systemctl enable --now myspace-tls-renew.timer
systemctl list-timers myspace-tls-renew.timer
```

## 后续运行与恢复机制

- timer 按**服务器本地时区**每天 03:00、15:00 检查，并增加最多 30 分钟随机延迟；`Persistent=true` 会补执行错过的检查。
- acme.sh 判断尚不需要续期时跳过，不执行停止 Nginx 的 prehook。不要在定时任务外层无条件停 Nginx。
- 所有入口显式使用 `--home /root/.acme.sh`，不能依赖 systemd 进程是否设置 `HOME`。否则可能使用错误的配置目录，另建账户和证书任务。
- 服务通过 `ACME_USE_IPV4_REQUESTS=1` 固定 ACME 出站请求使用 IPv4；本次证书下载在默认连接路径超时，显式 IPv4 下载成功。此设置不改变网站访客的连接协议。
- 服务使用 `/run/lock/myspace-tls-renew.lock` 互斥。跳过返回码 2、锁冲突返回码 75 均作为正常结束。
- prehook 先检查 Nginx 配置，备份现有目标证书对；仅在 Nginx 原本 active 时记录 marker 并停止。
- posthook 只恢复带 marker 的运行。若 Nginx 配置检查失败，会先尝试还原本轮保存的证书对，再检查并启动。它不会撤销其他 Nginx 配置变更。
- reload 钩子在 Nginx 运行时重新加载；若本轮续期已停止 Nginx，则恢复启动。它不会擅自启动原本被管理员停用的 Nginx。
- `TimeoutStartSec=180` 限制续期执行时间，`KillMode=control-group` 清理验证子进程。`ExecStopPost` 通过 `recover` 再获取同一把锁，避免在另一轮验证持锁时抢占 443。
- `/run/myspace-tls-renew/previous/` 与 marker 位于临时运行目录，不能替代持久备份。恢复失败时需根据日志人工处理。

## 日志、检查与应急

常规查看：

```bash
systemctl status myspace-tls-renew.service myspace-tls-renew.timer --no-pager
journalctl -u myspace-tls-renew.service -n 150 --no-pager
systemctl list-timers myspace-tls-renew.timer
openssl x509 -in /etc/nginx/ssl/myspace.byfire.ai/fullchain.pem -noout -subject -issuer -dates
```

磁盘证书有效不代表 Nginx 已提供新证书；还需从外部网络检查实际 HTTPS 握手、域名匹配与证书链。单纯源站回环检查不能证明公网访问已经恢复。

若续期卡住或 Nginx 没有恢复：

```bash
systemctl stop myspace-tls-renew.service
/usr/local/sbin/myspace-tls-hooks recover
nginx -t
systemctl status nginx --no-pager
journalctl -u myspace-tls-renew.service -u nginx -n 150 --no-pager
```

`recover` 遇到其他进程持锁时会跳过恢复；应先确认正在执行的任务，不能删除锁文件或直接调用 `post` 抢回端口。若证书回退仍无法通过 `nginx -t`，对照持久备份修复具体配置后再恢复服务。

需要主动触发常规续期检查时，使用 `systemctl start myspace-tls-renew.service`。正常跳过可保留服务运行日志；不要为了检查而强制重复签发。此操作仍可能在证书到期需续期时短暂中断同 Nginx 的站点。

## 2026-10-22 修复记录

- 原证书于北京时间 2026-10-21 22:52:58 到期；Certbot 的 manual renewal 缺少自动验证钩子，而 acme.sh 的 ALPN 续期缺少释放端口和安装路径配置。
- 新证书已加载，有效期至北京时间 2027-01-20 00:12:15。私钥与证书匹配，证书链验证通过；定时续期已启用，下次计划续期时间为北京时间 2026-12-21 00:12:15。
- 首次任务的证书已签发，但下载阶段超时；通过 IPv4 取回同一张已签发证书，未重复签发。初次服务缺少明确 home 导致临时目录错误，现已合并对应 CA 账户和域名资料并修正服务参数；原始资料保存在服务器受保护备份中。
- 源站使用域名进行 HTTPS 验证：首页返回 200；视频 Range 返回 206 和 1024 字节；未跳过证书校验。常规续期检查正确跳过，Nginx 主进程 PID 未改变。
- Codex 内置浏览器已直接加载 `https://myspace.byfire.ai/chenneng/`，显示正常页面，未绕过安全警告。当前机器命令行的部分网络路径仍会重置连接；未覆盖实体手机和所有运营商线路。

## 官方依据

- [acme.sh 安装证书与自动续期](https://github.com/acmesh-official/acme.sh)
- [acme.sh 3.1.5 源码：钩子、续期与安装顺序](https://github.com/acmesh-official/acme.sh/blob/3.1.5/acme.sh)
- [Let's Encrypt 验证方式与端口要求](https://letsencrypt.org/docs/challenge-types/)
