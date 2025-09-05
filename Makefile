.PHONY: install

install:
	cp .env.example .env
	cd frontend && npm install
	cd backend && go mod tidy

up:
	docker compose -f docker-compose.yml up --build

down:
	docker compose -f docker-compose.yml down --remove-orphans