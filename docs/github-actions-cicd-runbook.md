# GitHub Actions CI/CD runbook

This runbook captures the working CI/CD pattern used by `byfire-dev/myspace`.

The final successful design is:

1. Push to `master`.
2. GitHub Actions sends an email notification.
3. GitHub Actions deploys the pushed commit automatically by SSH and `rsync`.
4. `workflow_dispatch` remains available for manual redeployment of a branch, tag, or commit SHA.

## Recommended workflow shape

Use one workflow file:

`/.github/workflows/deploy-myspace.yml`

Use these triggers:

```yaml
on:
  push:
    branches:
      - master
  workflow_dispatch:
    inputs:
      deploy_ref:
        description: "Branch, tag, or commit SHA to deploy"
        required: true
        default: "master"
```

Use two jobs:

- `notify`: runs only on `push`, sends an email with commit and workflow run link.
- `deploy`: runs on `push` and `workflow_dispatch`, publishes files to the server.

For checkout, deploy the exact pushed commit on push, and deploy the selected ref on manual runs:

```yaml
with:
  ref: ${{ github.event_name == 'workflow_dispatch' && inputs.deploy_ref || github.sha }}
```

## GitHub configuration

Repository secrets for email:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM` optional
- `SMTP_STARTTLS` optional

Production environment secret:

- `DEPLOY_SSH_KEY`

Production environment variables:

- `DEPLOY_HOST`
- `DEPLOY_PORT`
- `DEPLOY_USER`
- `DEPLOY_PATH`

Important distinction:

- Put private keys and passwords in `secrets`.
- Put non-sensitive host, port, user, and path values in `variables`.
- `DEPLOY_SSH_KEY` must not be stored as an environment variable.

## SMTP settings

Common examples:

Microsoft 365 / Outlook:

```text
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_STARTTLS=true
SMTP_USERNAME=<email address>
SMTP_PASSWORD=<app password or SMTP password>
SMTP_FROM=<email address>
```

Gmail:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_STARTTLS=true
SMTP_USERNAME=<gmail address>
SMTP_PASSWORD=<Google app password>
SMTP_FROM=<gmail address>
```

Tencent Exmail:

```text
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=465
SMTP_STARTTLS=false
SMTP_USERNAME=<email address>
SMTP_PASSWORD=<client authorization code>
SMTP_FROM=<email address>
```

In most providers, `SMTP_PASSWORD` is not the web login password. Use an app password, authorization code, or SMTP-specific password.

## Alibaba Cloud Linux 3 server setup

Use `useradd`, not Debian/Ubuntu-style `adduser --disabled-password --gecos`.

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

Copy the private key printed by `cat "$KEY_FILE"` into GitHub as `DEPLOY_SSH_KEY`.

Then remove temporary key files from the server:

```bash
rm -f "$KEY_FILE" "$KEY_FILE.pub"
```

Only the public key should remain on the server in:

```text
/home/deploy/.ssh/authorized_keys
```

## Why generate the key in `/tmp`

Do not generate this deploy key at the default SSH path unless you have a strong reason.

The deploy key is a temporary automation identity:

- It should not overwrite an existing `~/.ssh/id_ed25519`.
- It should not be confused with a user's normal SSH identity.
- The private key should be copied to GitHub Secrets and then deleted from the server.
- The public key stays in the deploy user's `authorized_keys`.

## Private repository approval limitation

For private repositories, GitHub `Environment` pages may not show `Required reviewers` depending on the GitHub plan. In that case, do not rely on environment approval as the deployment gate.

Working alternatives:

- Push auto-deploys directly.
- Push sends email, and deployment is done by `workflow_dispatch`.

This repository currently uses push auto-deploy.

## Common problems and fixes

### GitHub email link opens 404

If the repository is private, GitHub may show 404 when the browser is not signed in to an account with access.

Fix:

- Open the link in a browser already signed into the correct GitHub account.
- Or open it in the GitHub mobile app with the correct account.

### Workflow says `No jobs were run`

This can happen when the workflow YAML is not parsed as a valid Actions workflow.

One real cause encountered here:

- A Python multiline string inside `run: |` had unindented lines.
- GitHub treated the workflow incorrectly, resulting in zero jobs.

Fix:

- Keep every line inside `run: |` indented.
- Prefer `"\n".join([...])` for long email bodies inside embedded Python.
- Check remote workflow recognition with:

```bash
gh workflow view deploy-myspace.yml --repo byfire-dev/myspace --yaml
```

### `workflow_dispatch` is missing

If `gh workflow run` says the workflow does not have a `workflow_dispatch` trigger, GitHub may still be reading a broken or stale workflow.

Fix:

1. Repair YAML.
2. Push the fix.
3. Confirm GitHub can display the trigger:

```bash
gh workflow view deploy-myspace.yml --repo byfire-dev/myspace --yaml
gh workflow run deploy-myspace.yml --repo byfire-dev/myspace --ref master
```

### Deployment runs without waiting for approval

If the repo is private and `Required reviewers` is not available or not enabled, environment approval will not pause deployment.

Fix:

- Use `workflow_dispatch` as the approval step, or accept push auto-deploy.

### SSH key or path problems

Check:

- `DEPLOY_SSH_KEY` is in environment secrets, not variables.
- `DEPLOY_HOST`, `DEPLOY_PORT`, `DEPLOY_USER`, and `DEPLOY_PATH` are available as environment variables.
- The public key is in `/home/<deploy-user>/.ssh/authorized_keys`.
- `authorized_keys` is mode `600`.
- `.ssh` directory is mode `700`.
- Deploy user owns `DEPLOY_PATH`.
- `rsync` is installed on the server.

## Useful verification commands

List recent runs:

```bash
gh run list --repo byfire-dev/myspace --limit 5
```

Inspect a run:

```bash
gh run view <run-id> --repo byfire-dev/myspace --json status,conclusion,url,jobs
```

Show failed logs:

```bash
gh run view <run-id> --repo byfire-dev/myspace --log-failed
```

Trigger a manual redeploy:

```bash
gh workflow run deploy-myspace.yml --repo byfire-dev/myspace --ref master -f deploy_ref=master
```

Verify the workflow file as GitHub sees it:

```bash
gh workflow view deploy-myspace.yml --repo byfire-dev/myspace --yaml
```

## Current proven status

The successful push auto-deploy pattern was verified with:

```text
Send approval email: success
Deploy site: success
Publish static files: success
```

Last known successful deployment workflow:

```text
Notify and deploy myspace
```
