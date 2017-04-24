## Minimal requirement in target SERVER to use ansible on it !
#### In your target SERVER with minimal installation of Debian Jessie
- install sudo package
- install ssh
- granted ssh access for root user
- add your ssh public key in root/.ssh/authorized_key file

## After the deployment
- Add manually the images directory in /home/[user]/consultation-app/public/images
- Restore the existent mongo dump in the new mongodb database of instance 
