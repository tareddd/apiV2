---
description: Implémenter l'endpoint unlock pour déblocage après paiement
---

# Comment implémenter l'endpoint /api/unlock/{id}

## Étapes pour créer l'endpoint unlock

### 1. Localiser le fichier serveur principal
- Chercher dans le dossier `api/` le fichier principal (généralement `server.js` ou `index.js`)
- C'est là que les routes API sont définies

### 2. Ajouter la route POST /api/unlock/:id
```javascript
// Ajouter ce code dans les routes de votre serveur
app.post('/api/unlock/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { by } = req.body; // L'admin qui a fait l'action
    
    // Logique de déblocage :
    // 1. Vérifier que l'utilisateur existe
    // 2. Mettre à jour son statut pour autoriser le téléchargement
    // 3. Logger l'action pour audit
    // 4. Retourner une réponse de succès
    
    // Exemple d'implémentation :
    const user = await getUserById(id); // Fonction à implémenter
    if (!user) {
      return res.json({ success: false, error: 'Utilisateur non trouvé' });
    }
    
    // Marquer l'utilisateur comme débloqué pour les téléchargements payants
    await markUserAsUnlocked(id); // Fonction à implémenter
    
    console.log(`Utilisateur ${id} débloqué par ${by}`);
    
    res.json({ 
      success: true, 
      message: `Accès débloqué pour l'utilisateur ${id}` 
    });
    
  } catch (error) {
    console.error('Erreur unlock:', error);
    res.json({ 
      success: false, 
      error: 'Erreur lors du déblocage' 
    });
  }
});
```

### 3. Créer les fonctions de base de données
- `getUserById(id)` - Récupérer un utilisateur par son ID Discord
- `markUserAsUnlocked(id)` - Marquer l'utilisateur comme pouvant télécharger

### 4. Mettre à jour la logique de téléchargement
Dans la logique de téléchargement, vérifier si l'utilisateur est débloqué :
```javascript
// Dans la fonction de vérification avant téléchargement
if (product.isPaid && !user.isUnlocked) {
  return res.json({ 
    success: false, 
    error: 'Produit payant - paiement requis' 
  });
}
```

### 5. Tester l'endpoint
- Redémarrer le serveur API
- Tester avec curl ou Postman :
  ```bash
  curl -X POST http://localhost:3000/api/unlock/1413490405445734400 \
    -H "Content-Type: application/json" \
    -d '{"by": "Admin#1234"}'
  ```

### 6. Intégration avec le bot Discord
La commande `/unlock [id]` du bot devrait maintenant fonctionner correctement.

## Notes importantes
- L'endpoint doit être protégé (seuls les admins devraient pouvoir l'utiliser)
- Logger toutes les actions de déblocage pour audit
- Penser à ajouter une validation pour s'assurer que l'ID Discord est valide