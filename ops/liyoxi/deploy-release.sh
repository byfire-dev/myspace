#!/usr/bin/env bash
# Run as root after extracting `git archive SHA liyoxi ops/liyoxi` into the release.
set -Eeuo pipefail
release_id="${1:?Usage: deploy-release.sh FULL_COMMIT_SHA}"
[[ "$release_id" =~ ^[a-f0-9]{40}$ ]] || { echo 'Expected full commit SHA'; exit 1; }
[[ $(id -u) == 0 ]] || { echo 'Root is required'; exit 1; }
release="/opt/liyoxi/releases/$release_id"
[[ $(readlink -f "$release") == "$release" ]] || { echo 'Unexpected release path'; exit 1; }
test -f "$release/liyoxi/index.html"
test -f "$release/ops/liyoxi/server.mjs"
conf=/etc/nginx/conf.d/myspace.byfire.ai.conf
snippet=/etc/nginx/snippets/liyoxi-locations.conf
unit=/etc/systemd/system/liyoxi-enrollment.service
backup="/var/backups/myspace/liyoxi-$(date -u +%Y%m%dT%H%M%SZ)-${release_id:0:7}"
install -d -m 700 "$backup"
cp -a "$conf" "$backup/site.conf"
[[ ! -f "$snippet" ]] || cp -a "$snippet" "$backup/locations.conf"
[[ ! -f "$unit" ]] || cp -a "$unit" "$backup/service.unit"
old_release=$(readlink -f /opt/liyoxi/current 2>/dev/null || true)
printf '%s\n' "$old_release" > "$backup/previous-release.txt"
rollback() {
    trap - ERR
    set +e
    echo 'Release failed; restoring previous routing and service.' >&2
    cp -a "$backup/site.conf" "$conf"
    if [[ -f "$backup/locations.conf" ]]; then cp -a "$backup/locations.conf" "$snippet"; else rm -f -- "$snippet"; fi
    if [[ -n "$old_release" && -d "$old_release" && "$old_release" != /opt/liyoxi/current ]]; then
        ln -sfn "$old_release" /opt/liyoxi/current-rollback
        mv -Tf /opt/liyoxi/current-rollback /opt/liyoxi/current
    elif [[ -L /opt/liyoxi/current ]]; then
        unlink /opt/liyoxi/current
    fi
    if [[ -f "$backup/service.unit" ]]; then
        cp -a "$backup/service.unit" "$unit"
        systemctl daemon-reload
        systemctl restart liyoxi-enrollment || true
    else
        systemctl disable --now liyoxi-enrollment || true
        rm -f -- "$unit"
        systemctl daemon-reload
    fi
    nginx -t && systemctl reload nginx
    echo "Rollback files: $backup" >&2
    exit 1
}
trap rollback ERR
if ! id liyoxi >/dev/null 2>&1; then
    useradd --system --user-group --home /var/lib/liyoxi --shell /sbin/nologin liyoxi
fi
install -d -m 700 -o liyoxi -g liyoxi /var/lib/liyoxi
install -d -m 700 /etc/liyoxi
install -d -m 755 /etc/nginx/snippets
chown -R root:root "$release"
find "$release" -type d -exec chmod 755 {} +
find "$release" -type f -exec chmod 644 {} +
[[ -L "$release/public" ]] || ln -s liyoxi "$release/public"
ln -sfn "$release" /opt/liyoxi/current-next
mv -Tf /opt/liyoxi/current-next /opt/liyoxi/current
if [[ ! -f /etc/liyoxi/liyoxi.env ]]; then
    /usr/bin/node "$release/ops/liyoxi/create-admin-env.mjs"
fi
install -m 644 "$release/ops/liyoxi/liyoxi-enrollment.service" "$unit"
install -m 644 "$release/ops/liyoxi/nginx-locations.conf" "$snippet"
python3 - "$conf" <<'PY'
import sys
path = sys.argv[1]
with open(path) as f:
    text = f.read()
include = '    include /etc/nginx/snippets/liyoxi-locations.conf;'
if include not in text:
    ssl = text.index('listen 443')
    anchor = text.index('    root /var/www/myspace;', ssl)
    text = text[:anchor] + include + '\n\n' + text[anchor:]
    with open(path, 'w') as f:
        f.write(text)
PY
systemctl daemon-reload
systemctl enable liyoxi-enrollment
systemctl restart liyoxi-enrollment
healthy=false
for attempt in 1 2 3 4 5; do
    if curl --fail --silent --connect-timeout 3 --max-time 10 http://127.0.0.1:8797/liyoxi/api/health >/dev/null; then healthy=true; break; fi
    sleep 1
done
[[ "$healthy" == true ]]
nginx -t
systemctl reload nginx
curl --fail --silent --connect-timeout 3 --max-time 10 https://myspace.byfire.ai/liyoxi/api/health >/dev/null
curl --fail --silent --connect-timeout 3 --max-time 10 https://myspace.byfire.ai/liyoxi/ >/dev/null
curl --fail --silent --connect-timeout 3 --max-time 10 https://myspace.byfire.ai/liyoxi/assets/advisor-wechat.jpg >/dev/null
trap - ERR
printf 'Published %s\nBackup: %s\n' "$release_id" "$backup"
