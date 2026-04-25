# Discord Ban System

## Installation

```bash
cd discord-ban-system
npm install
```

## Configuration

Édite le fichier `.env` :
```
DISCORD_TOKEN=ton_token_bot_discord
API_PORT=3000
API_SECRET=une_cle_secrete_api
```

## Lancer le serveur + site

```bash
npm start
```

## Lancer le bot Discord

```bash
npm run bot
```

## Commandes Discord

| Commande | Description |
|---|---|
| `/bansite [id]` | Bannit l'utilisateur du site |
| `/unbansite [id]` | Débannit l'utilisateur |
| `/ratelimited [id]` | Bloque l'accès pendant 48h |
| `/unrate [id]` | Retire le ratelimit |

## Endpoints API

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/check/:id` | Non | Vérifie l'accès d'un user |
| POST | `/api/ban/:id` | Oui | Bannit un user |
| POST | `/api/unban/:id` | Oui | Débannit un user |
| POST | `/api/ratelimit/:id` | Oui | Ratelimite 48h |
| POST | `/api/unratelimit/:id` | Oui | Retire le ratelimit |
| GET | `/api/bans` | Oui | Liste des bannis |

Auth = header `Authorization: Bearer <API_SECRET>`
