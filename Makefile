all: stop image deploy

image:
	cd infra && docker-compose build

deploy:
	cd infra && docker-compose up -d

stop:
	cd infra && docker-compose down

restart:
	cd infra && docker-compose down && docker-compose up -d

clean:
	docker system prune -f
