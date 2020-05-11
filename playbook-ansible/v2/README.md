# Server setup so ansible can be used

## Packages

```shell
apt install sudo ssh python3
```

## SSH access

Add your ssh public key to `/root/.ssh/authorized_key`.

# Deploying

With <env> being the target environment (see `./inventory`):

```shell
ANSIBLE_STDOUT_CALLBACK=actionable ansible-playbook -e mongosupass=... -e mongogppass=... -e sendgriduser=... -e sendgridpass=... -e sendgridapikey=... -e monitpass=... -e xapikey=... --limit <env>
```
