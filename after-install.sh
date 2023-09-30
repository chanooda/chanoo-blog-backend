cd /home/ubuntu/blog-backend
docker build -t blog-backend -f ./Dockerfile .
docker run -dit -p 4000:4000 --name blog-backend blog-backend