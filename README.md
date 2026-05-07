<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Nexus AI Backend
**An enterprise-grade AI backend template.** It leverages NestJS's powerful dependency injection to maintain a strict separation of concerns between core business logic and external AI model providers.

<p align="center">
  <img src="https://img.shields.io/badge/License-Apache%202.0-blue.svg" alt="License" />
  <img src="https://img.shields.io/badge/NestJS-11.x-red.svg" alt="NestJS Version" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue.svg" alt="TypeScript" />
</p>

## Description
This project is a scalable AI-driven backend architecture. It focuses on:
- **Clean Architecture:** Decoupling AI providers from business logic.
- **Real-time Interaction:** Streaming LLM responses via SSE (Server-Sent Events).
- **Scalability:** Built with NestJS for high-performance Node.js environments.

## Project setup
```bash
$ npm install
```

## Compile and run the project
```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests
```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e
```

## License
This project is [Apache License 2.0](LICENSE) licensed. (NestJS framework is MIT licensed)
