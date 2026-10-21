#!/usr/bin/env bash
# Run only on the server that terminates TLS for myspace.byfire.ai.
set -euo pipefail
marker=/run/myspace-tls-renew/nginx-was-active
certificate_dir=/etc/nginx/ssl/myspace.byfire.ai
previous=/run/myspace-tls-renew/previous

restore_nginx() {
    if [ -f "$marker" ]; then
        if ! /usr/sbin/nginx -t; then
            if [ -s "$previous/fullchain.pem" ] && [ -s "$previous/privkey.pem" ]; then
                echo 'Restoring the certificate pair saved before renewal.' >&2
                install -m 644 "$previous/fullchain.pem" "$certificate_dir/fullchain.pem"
                install -m 600 "$previous/privkey.pem" "$certificate_dir/privkey.pem"
            fi
            /usr/sbin/nginx -t
        fi
        /usr/bin/systemctl start nginx
        /usr/bin/systemctl is-active --quiet nginx
        rm -f -- "$marker"
    fi
}

case "${1:-}" in
    pre)
        /usr/sbin/nginx -t
        if /usr/bin/systemctl is-active --quiet nginx; then
            install -d -m 700 /run/myspace-tls-renew
            install -d -m 700 "$previous"
            if [ -e "$certificate_dir/fullchain.pem" ] || [ -e "$certificate_dir/privkey.pem" ]; then
                if [ ! -s "$certificate_dir/fullchain.pem" ] || [ ! -s "$certificate_dir/privkey.pem" ]; then
                    echo 'The installed certificate pair is incomplete; refusing renewal.' >&2
                    exit 1
                fi
                install -m 600 "$certificate_dir/fullchain.pem" "$previous/fullchain.pem"
                install -m 600 "$certificate_dir/privkey.pem" "$previous/privkey.pem"
            fi
            : > "$marker"
            /usr/bin/systemctl stop nginx
        fi
        ;;
    post)
        restore_nginx
        ;;
    recover)
        # Another renewal still owning the lock must retain port 443.
        /usr/bin/flock --nonblock --conflict-exit-code 75 \
            /run/lock/myspace-tls-renew.lock "$0" post || {
            result=$?
            [ "$result" -eq 75 ] || exit "$result"
        }
        ;;
    reload)
        /usr/sbin/nginx -t
        if /usr/bin/systemctl is-active --quiet nginx; then
            /usr/bin/systemctl reload nginx
        elif [ -f "$marker" ]; then
            restore_nginx
        else
            echo 'Nginx was stopped outside this renewal; refusing to start it implicitly.' >&2
            exit 1
        fi
        ;;
    *)
        echo 'Usage: myspace-tls-hooks pre|post|reload|recover' >&2
        exit 64
        ;;
esac
