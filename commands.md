## Main used commands
turbo run build --filter=@repo/shared-types

turbo run dev --filter=backend

npm install -d @types/express --workspace apps/payment

## start docker-composer
docker compose -f docker-compose.dev.yml up

## rebuild image and container
docker compose -f docker-compose.dev.yml up -d --build web

## restart nginx 
docker compose -f docker-compose.dev.yml exec -it nginx nginx -s reload

npx shadcn@latest add button

## verify volume content
docker run --rm -it -v nanithefuck_web_dist:/data alpine sh

### clean cache
docker builder prune
- build cache
- imagens não usadas
- containers parados

docker compose down -v
- volumes do compose (cache de deps, db, etc.)

### clean dangling images
docker image prune

### clean all
docker system prune -a


### generate certbots certificate
#### comment nginx-http (port 80) redirect "return 301 https://$host$request_uri;"
#### then run nginx-http from docker-compose.prod.yml
    
#### check listen port 80 from inside the vm
sudo ss -tulnp

#### check if tcp port 80 is acessable from outside
nc -vz <public_ip> 80
nc -vz nanithefuck.com.br 80

#### allow right permissions on certbot folder
chmod -R 755 ./certbot/www

sudo docker run -it --rm --name certbot_2 \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  -v "./certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d nanithefuck.com.br \
  -d www.nanithefuck.com.br \
  --email contato@nanithefuck.com.br \
  --agree-tos \
  --no-eff-email


#### once certificates are generated successfully config cron certificate renew 
sudo crontab -e

0 0,12 * * * docker run -it --rm -v "/etc/letsencrypt:/etc/letsencrypt" -v "/var/lib/letsencrypt:/var/lib/letsencrypt" -v "/root/nanithefuck/certbot/www:/var/www/certbot" certbot/certbot renew --quiet

sudo systemctl status cron

ssh -L 27017:localhost:27017 root@<ip>
