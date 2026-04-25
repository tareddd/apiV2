---
description: Guide pour corriger l'erreur "Non autorisé"
---

# Correction de l'erreur "Non autorisé"

## Problème identifié
Le bot peut contacter l'API mais reçoit "Non autorisé", ce qui signifie un problème d'authentification.

## Causes possibles

### 1. API_SECRET différent entre bot et API
Le bot et l'API doivent avoir exactement le même `API_SECRET`.

**Dans le service BOT :**
```
API_SECRET=undecteproownerprod__SDGD325
```

**Dans le service API :**
```
API_SECRET=undecteproownerprod__SDGD325
```

### 2. OWNERS manquant ou incorrect
Votre ID Discord doit être dans la variable OWNERS.

**Dans les deux services :**
```
OWNERS=1413490405445734400
```

## Actions à faire

### Étape 1 : Vérifier API_SECRET
1. Allez sur le service bot : https://railway.com/project/074ccc9f-cf1a-45b8-ab94-a9bc56e503d9/service/49c9b50d-7bfe-46d3-ba81-8afb0162f9b1/variables
2. Vérifiez que `API_SECRET=undecteproownerprod__SDGD325` est exact
3. Allez sur le service API : https://railway.com/project/074ccc9f-cf1a-45b8-ab94-a9bc56e503d9/service/c96fea79-20fc-4bc4-a8a8-2538b158f04b/variables
4. Vérifiez que `API_SECRET=undecteproownerprod__SDGD325` est identique

### Étape 2 : Vérifier OWNERS
Assurez-vous que `OWNERS=1413490405445734400` est dans les deux services.

### Étape 3 : Redémarrer
1. Cliquez "Redeploy" sur le service bot
2. Cliquez "Redeploy" sur le service API
3. Attendez 2-3 minutes

### Étape 4 : Tester
Testez une commande comme `/bansite [id]`

## Solution rapide
Si tout est correct, essayez de recréer les variables :
1. Supprimez `API_SECRET` des deux services
2. Recréez-la avec : `API_SECRET=undecteproownerprod__SDGD325`
3. Redémarrez les services

Une fois les secrets synchronisés, l'authentification fonctionnera !
