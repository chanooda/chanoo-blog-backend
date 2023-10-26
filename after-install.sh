cd /home/ubuntu/blog-backend
docker stop blog-backend
docker rm blog-backend
docker image rm blog-backend
docker build -t blog-backend .
docker rm --force blog-backend
docker run -dit -p 4000:4000 --name blog-backend blog-backend