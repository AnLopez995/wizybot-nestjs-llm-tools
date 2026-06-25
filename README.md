# Wizybot Technical Assessment

NestJS API that exposes a chatbot endpoint powered by **OpenAI Chat Completions with Function Calling**. The chatbot can search products from a CSV catalog and convert currencies using **Open Exchange Rates**.

## Important Note

This project uses **OpenAI Chat Completions with Function Calling**. It does **not** use the OpenAI Agent API, Assistants API, Responses API, or Agents SDK.

## Tech Stack

- NestJS
- TypeScript
- OpenAI Chat Completions API
- Function Calling
- Open Exchange Rates API
- Swagger
- CSV product catalog

## Requirements

- Node.js >= 20
- npm
- OpenAI API key
- Open Exchange Rates App ID

## Installation

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values.

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default `3000`). |
| `OPENAI_API_KEY` | OpenAI API key. |
| `OPENAI_MODEL` | Chat Completions model (default `gpt-4o-mini`). |
| `OPEN_EXCHANGE_RATES_APP_ID` | Open Exchange Rates app id. |
| `OPEN_EXCHANGE_RATES_BASE_URL` | Open Exchange Rates base URL. |
| `PRODUCTS_CSV_PATH` | Path to the CSV catalog (default `data/products_list.csv`). |

## Run

```bash
# development (watch mode)
npm run start:dev

# production
npm run build
npm run start:prod
```

## Swagger Documentation

Once running, open:

```
http://localhost:3000/docs
```

## Endpoint

```
POST /chat
```

### Request

```json
{
  "message": "I am looking for a phone"
}
```

### Response

```json
{
  "response": "..."
}
```

### Validation & status codes

- `message` is required, must be a non-empty string.
- `200 OK` — successful response.
- `400 Bad Request` — invalid input.
- `502 Bad Gateway` — external API failure (OpenAI or Open Exchange Rates).
- `500 Internal Server Error` — unexpected failure.

## cURL Examples

```bash
# 1. Looking for a phone
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" \
  -d '{"message":"I am looking for a phone"}'

# 2. Present for my dad
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" \
  -d '{"message":"I am looking for a present for my dad"}'

# 3. How much does a watch cost
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" \
  -d '{"message":"How much does a watch costs?"}'

# 4. Price of the watch in Euros
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" \
  -d '{"message":"What is the price of the watch in Euros"}'

# 5. Canadian Dollars for 350 Euros
curl -X POST http://localhost:3000/chat -H "Content-Type: application/json" \
  -d '{"message":"How many Canadian Dollars are 350 Euros"}'
```

## How It Works

1. `POST /chat` receives the user message.
2. `ChatbotService` builds the conversation (system prompt + user message) and calls OpenAI Chat Completions with two tools available.
3. If the model requests a tool call, the backend validates the arguments and runs the tool locally:
   - `searchProducts` — keyword scoring over the in-memory CSV catalog, returns the top 2 products.
   - `convertCurrencies` — fetches the latest USD-based rates from Open Exchange Rates and converts via the cross-rate.
4. Tool results are appended to the conversation; the loop repeats up to a maximum number of iterations to support multi-step flows (e.g. search then convert).
5. The final natural-language answer is returned as a string.

## Project Structure

```
src/
├── main.ts
├── app.module.ts
├── config/            # environment variable validation
├── chatbot/           # controller, orchestration service, DTOs, system prompt
├── openai/            # Chat Completions wrapper + tool schemas
├── products/          # CSV loading + keyword search
├── currency/          # Open Exchange Rates client + conversion
└── common/            # shared utilities
data/
└── products_list.csv  # product catalog
```

## Notes

- The product catalog is loaded into memory from `products_list.csv` at startup.
- Exchange rates are retrieved from Open Exchange Rates (USD-based on the free plan).
- Product prices and exchange rates are never invented by the model — they come from the tools only.
- Git commits are handled manually by the repository owner.
