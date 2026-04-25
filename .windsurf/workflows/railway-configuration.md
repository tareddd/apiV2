---
description: Guide complet pour trouver et configurer l'URL Railway
---

# Comment trouver et configurer votre URL Railway

## Étape 1 : Trouver votre vraie URL Railway

### 1. Allez sur votre dashboard Railway
- Ouvrez le fichier `lien railway.txt` dans votre projet
- Copiez-collez les liens dans votre navigateur
- Vous verrez 2 services : "bot" et "APIV2"

### 2. Trouvez l'URL du service API
- Cliquez sur le service "APIV2" 
- Regardez en haut de la page, vous verrez une URL comme :
  ```
  https://votre-nom-app-production-xxxx.up.railway.app
  ```
- **Copiez cette URL complète**

### 3. Trouvez l'URL du service bot (si besoin)
- Cliquez sur le service "bot"
- Notez aussi son URL (généralement similaire)

## Étape 2 : Mettre à jour les variables Railway

### Pour le service BOT :
1. Sur la page du service "bot", cliquez sur l'onglet "Variables"
2. Cliquez sur "New Variable"
3. Ajoutez ces variables :

```
API_URL=https://VOTRE-URL-API-ICI.up.railway.app
DISCORD_REDIRECT_URI=https://VOTRE-URL-API-ICI.up.railway.app/auth/callback
```

### Pour le service API :
1. Sur la page du service "APIV2", cliquez sur l'onglet "Variables"  
2. Vérifiez que ces variables existent :
```
DISCORD_CLIENT_ID=1497380885102723206
DISCORD_CLIENT_SECRET=1em4W6DWpt85oQ5ZbryoiTHFuP80TEYp
DISCORD_REDIRECT_URI=https://VOTRE-URL-API-ICI.up.railway.app/auth/callback
SESSION_SECRET=fn_private_session_secret_2024
OWNERS=1413490405445734400
API_SECRET=undecteproownerprod__SDGD325
```

## Étape 3 : Redémarrer les services

1. **Service API** : Cliquez sur "Redeploy" sur le service APIV2
2. **Service Bot** : Cliquez sur "Redeploy" sur le service bot
3. Attendez 2-3 minutes que les services redémarrent

## Étape 4 : Tester

1. Testez une commande Discord comme `/bansite [id]`
2. Le bot devrait maintenant contacter l'API Railway correctement
3. Les commandes devraient fonctionner sans erreur

## Exemple concret

Si votre URL Railway est : `https://myapi-production-abc123.up.railway.app`

Alors vous devez ajouter dans les variables du bot :
```
API_URL=https://myapi-production-abc123.up.railway.app
DISCORD_REDIRECT_URI=https://myapi-production-abc123.up.railway.app/auth/callback
```

## Problèmes courants

- **Erreur 404** : L'URL est incorrecte, vérifiez que vous avez copié la bonne URL
- **Erreur 401** : Le secret API ne correspond pas, vérifiez `API_SECRET`
- **Bot ne répond pas** : Le bot n'a pas redémarré, cliquez sur "Redeploy"

Une fois configuré correctement, toutes vos commandes Discord devraient fonctionner !
