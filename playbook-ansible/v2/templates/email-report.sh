#! /bin/bash

exec >> /var/log/email-report.log 2>&1

period=${1:-1} # in days

date=$(date -Idate -d"1 day ago")
subject="Consultations du ${date}"

db="localhost/db_deploy"
query_selector="{'createdAt':{\$gt:new Date(Date.now() - ${period} * 24*60*60 * 1000)}}"
query_projection="{_id:0,__v:0}"
content=$(mongo --quiet $db --eval "db.consultations.find($query_selector,$query_projection).pretty()" | perl -pe 's/"//g ; s/^[\t\s]*/ / ; s/\n+/\\n /g')

echo "=================================="
echo "Subject: $subject"
echo -e "Content: $content"

if [ -n "$content" ] ; then
  curl -v --request POST \
     --url https://api.sendgrid.com/v3/mail/send \
     --header "authorization: Bearer {{ sendgridapikey }}" \
     --header 'Content-Type: application/json' \
     --data '{"personalizations": [{"to": [{"email": "consultation@etalab.gouv.fr"}], "from": {"email": "consultation@etalab.gouv.fr"},"subject":"'"${subject}"'", "content": [{"type": "text/plain", "value": "'"${content}"'"}]}'
fi

