#!/bin/bash
echo "# deploiement.consultation" >> README.md
git init
git add .
git commit -m "first commit"
git remote add origin git@github.com:consultation-gouv/deploiement.consultation.git
git push -u origin master
