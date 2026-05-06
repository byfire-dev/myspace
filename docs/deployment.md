# myspace deployment workflow

This repository uses GitHub Actions to notify and deploy the static site.

## Flow

1. A push to `master` starts `.github/workflows/deploy-myspace.yml`.
2. The workflow emails `lixm@byfire.ai` with the GitHub Actions run link.
3. The `deploy` job waits for approval on the `production` environment.
4. After approval, GitHub Actions syncs the repository files to the configured server directory by SSH and `rsync`.

## Required GitHub environment

Create an environment named `production` in the repository settings, then enable required reviewers and add yourself as the reviewer.

Path:

`Settings -> Environments -> New environment -> production`

## Required secrets and variables

Add these repository secrets, environment secrets, and environment variables in GitHub.

Repository secrets for email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM` optional, defaults to `SMTP_USERNAME`
- `SMTP_STARTTLS` optional, defaults to `true`

Production environment secrets for deployment:

- `DEPLOY_SSH_KEY`

Production environment variables for deployment:

- `DEPLOY_HOST`
- `DEPLOY_PORT` optional, defaults to `22`
- `DEPLOY_USER`
- `DEPLOY_PATH`

## Server setup

On Alibaba Cloud Linux 3, use `useradd` instead of the Debian/Ubuntu-style `adduser` flags.

Replace `DEPLOY_PATH` if your web root is different:

```bash
DEPLOY_USER=deploy
DEPLOY_PATH=/var/www/myspace
KEY_FILE=/tmp/myspace_deploy_key

sudo dnf install -y rsync openssh-server

sudo useradd -m -s /bin/bash "$DEPLOY_USER"
sudo passwd -l "$DEPLOY_USER"

sudo mkdir -p "$DEPLOY_PATH"
sudo chown -R "$DEPLOY_USER:$(id -gn "$DEPLOY_USER")" "$DEPLOY_PATH"

ssh-keygen -t ed25519 -C "github-actions-myspace-deploy" -f "$KEY_FILE" -N ""

sudo install -d -m 700 -o "$DEPLOY_USER" -g "$(id -gn "$DEPLOY_USER")" "/home/$DEPLOY_USER/.ssh"
sudo sh -c "cat '$KEY_FILE.pub' >> '/home/$DEPLOY_USER/.ssh/authorized_keys'"
sudo chown "$DEPLOY_USER:$(id -gn "$DEPLOY_USER")" "/home/$DEPLOY_USER/.ssh/authorized_keys"
sudo chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

cat "$KEY_FILE"
```

Copy the output from `cat "$KEY_FILE"` into the GitHub secret named `DEPLOY_SSH_KEY`, then remove the temporary key files from the server:

```bash
rm -f "$KEY_FILE" "$KEY_FILE.pub"
```

The workflow excludes `.git/` and `.github/`, then publishes all other files with `rsync --delete`.
