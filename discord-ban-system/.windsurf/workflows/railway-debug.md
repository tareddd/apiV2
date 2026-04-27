---
description: Debug Railway API connection issues
---

# Debug Railway API - Application not found

## Problème
L'API Railway retourne `{"status":"error","code":404,"message":"Application not found"}` ce qui signifie que l'URL n'est pas correcte.

## Étapes pour résoudre

### 1. Vérifier l'URL Railway correcte
- Aller sur le dashboard Railway
- Copier l'URL exacte du service API
- L'URL devrait être quelque chose comme `https://votre-nom-app.up.railway.app`

### 2. Mettre à jour les variables d'environnement
Dans le fichier `.env` :
```
API_URL=https://URL-CORRECTE-Railway.app
DISCORD_REDIRECT_URI=https://URL-CORRECTE-Railway.app/auth/callback
```

### 3. Mettre à jour les variables Railway
- Aller sur les liens dans `lien railway.txt`
- Ajouter `API_URL=https://URL-CORRECTE-Railway.app` dans les variables du bot
- Mettre à jour `DISCORD_REDIRECT_URI` aussi

### 4. Tester l'API
```bash
curl https://URL-CORRECTE-Railway.app/api/bans
```

### 5. Redémarrer les services
- Redémarrer le service API sur Railway
- Redémarrer le service bot sur Railway
- Attendre 2-3 minutes

## Causes possibles
- URL Railway incorrecte
- Service API pas déployé
- Variables d'environnement pas synchronisées
- Service API en erreur ou crash

## Solution rapide
1. Vérifier l'URL exacte sur Railway dashboard
2. Mettre à jour `.env` avec la bonne URL
3. Push les changements
4. Redémarrer les services Railway
