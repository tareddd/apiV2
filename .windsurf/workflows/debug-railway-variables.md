---
description: Guide pour vérifier et corriger les variables Railway
---

# Debug des variables Railway

## Problème actuel
Le bot retourne "Erreur interne du bot" même avec la bonne URL Railway.

## Vérification des variables requises

### Variables qui doivent être dans le service BOT :
1. **API_URL** = `https://apiv2-production-7a99.up.railway.app`
2. **DISCORD_TOKEN** = `MTQ5NzM4MDg4NTEwMjcyMzIwNg.G6_3T3.d6EaAijjSiEzVKjAOfwRgtF7Pld1EuClpEhS2Y`
3. **API_SECRET** = `undecteproownerprod__SDGD325`
4. **DISCORD_CLIENT_ID** = `1497380885102723206`
5. **DISCORD_CLIENT_SECRET** = `1em4W6DWpt85oQ5ZbryoiTHFuP80TEYp`
6. **DISCORD_REDIRECT_URI** = `https://apiv2-production-7a99.up.railway.app/auth/callback`
7. **SESSION_SECRET** = `fn_private_session_secret_2024`
8. **OWNERS** = `1413490405445734400`

### Variables qui doivent être dans le service API :
1. **DISCORD_CLIENT_ID** = `1497380885102723206`
2. **DISCORD_CLIENT_SECRET** = `1em4W6DWpt85oQ5ZbryoiTHFuP80TEYp`
3. **DISCORD_REDIRECT_URI** = `https://apiv2-production-7a99.up.railway.app/auth/callback`
4. **SESSION_SECRET** = `fn_private_session_secret_2024`
5. **OWNERS** = `1413490405445734400`
6. **API_SECRET** = `undecteproownerprod__SDGD325`

## Étapes pour corriger

### 1. Service BOT
1. Allez sur : https://railway.com/project/074ccc9f-cf1a-45b8-ab94-a9bc56e503d9/service/49c9b50d-7bfe-46d3-ba81-8afb0162f9b1/variables
2. Vérifiez que TOUTES les variables ci-dessus sont présentes
3. Si une variable manque, cliquez "New Variable" et ajoutez-la
4. Cliquez "Redeploy"

### 2. Service API
1. Allez sur : https://railway.com/project/074ccc9f-cf1a-45b8-ab94-a9bc56e503d9/service/c96fea79-20fc-4bc4-a8a8-2538b158f04b/variables
2. Vérifiez que TOUTES les variables ci-dessus sont présentes
3. Cliquez "Redeploy"

### 3. Attendre le déploiement
- Attendez 2-3 minutes que les services redémarrent
- Testez une commande Discord

## Problèmes courants
- **Variable manquante** : Le bot ne peut pas se connecter à l'API
- **API_SECRET différent** : L'authentification échoue
- **URL incorrecte** : Le bot contacte la mauvaise API

## Test final
Une fois les variables vérifiées, testez :
- `/bansite [id]` - devrait fonctionner
- `/unlock [id]` - devrait fonctionner

Si ça ne fonctionne toujours pas, regardez les logs du bot pour voir l'erreur exacte.
