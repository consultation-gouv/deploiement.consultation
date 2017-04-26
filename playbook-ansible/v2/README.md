## Minimal requirement in target SERVER to use ansible on it !
#### In your target SERVER with minimal installation of Debian Jessie
- install sudo package
- install ssh package
- granted ssh access for root user
- add your ssh public key in root/.ssh/authorized_key file

## After the deployment
- Go to the monitoring web interface to disable monitoring for node-platform
- Stop pm2 task for node-platform
- Restore the existent mongo dump in the new mongodb database of instance
- Then resart node-platform's pm2 task and monitoring to this one
