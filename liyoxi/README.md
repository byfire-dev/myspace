# 狸有戏课程报名 H5

公开地址：`https://myspace.byfire.ai/liyoxi`。页面使用正式品牌 Logo、品牌配色、片场概念图及用户提供的完整个人微信二维码原图。

入口可带 `?source=official_account`（公众号）或 `?source=website`（官网）；未设置时为直接访问。导航保留来源。13 门课程可多选，也可让顾问推荐。

报名需手机号和明确同意联系；称呼、课程意向选填。不显示价格，不承诺收入或就业，不把预约复听描述为免费。成功页只在真实接口保存后出现；未提交访问成功页会展示咨询页。

前端会话存储用于草稿、课程选择、幂等请求编号及回执。提交成功即清除联系方式草稿。报名服务和管理说明见 `ops/liyoxi/README.md`。

## 发布

本目录与报名服务共同按功能分支提交版本发布，不通过整站静态同步发布。`ops/` 与 `liyoxi/` 已从原整站同步排除，以避免源码公开或覆盖独立服务。发布操作不合并主分支。

1. 通过本地验证后提交功能分支、推送并创建 PR。
2. `git archive --format=tar -o liyoxi-release.tar COMMIT_SHA liyoxi ops/liyoxi`。
3. 上传服务器，解压到 `/opt/liyoxi/releases/COMMIT_SHA`。
4. 以 root 运行 `bash /opt/liyoxi/releases/COMMIT_SHA/ops/liyoxi/deploy-release.sh COMMIT_SHA`。
5. 验证公开 HTTPS、图片、真实报名落库与管理鉴权；通过 CLI 按编号删除上线测试记录。

脚本备份现有 Nginx 配置、旧版本指针及 unit 到 `/var/backups/myspace/`；失败恢复路由及旧服务。报名数据库和凭证独立保留，不属于发布包。后续人工回滚使用备份的 `previous-release.txt`、`site.conf`、`locations.conf`、`service.unit` 恢复对应版本，执行 `nginx -t` 后 reload。首次发布没有旧服务时停用新服务并恢复原 Nginx 配置；不删除报名数据库。

二维码是原始图片，实际微信内识别及添加操作需在手机微信中完成。顾问后台不自动发送通知，顾问通过受保护的记录页查看并跟进。
