# Moonrail — La Centième Nuit

Moonrail est un roguelite tactique original dans lequel un train céleste transporte une aube vivante à travers un monde de fantasy nocturne. Les contrôleurs du ciel remontent les voies pour l’intercepter ; chaque tentative révèle de nouveaux passagers, plans d’atelier et fragments d’histoire.

Le jeu est gratuit, local et sans compte. Aucun achat ni serveur distant n’est nécessaire.

## Lancer le jeu

Double-cliquer sur **`Lancer Moonrail.vbs`**. Si Windows bloque le lanceur silencieux, utiliser **`LANCER_MOONRAIL.bat`**.

```powershell
python serve.py
```

## Boucle principale

1. Choisir une conductrice, son deck et son talent de conduite.
2. Choisir sa route parmi plusieurs arrêts avant le prochain contrôle céleste.
3. Lire les manœuvres annoncées par l’ennemi et affecter ses passagers à trois wagons persistants.
4. Gérer la **Lueur** : jouer une carte ou en chauffer une dans la chaudière pour produire un surcroît d’énergie. La pioche est automatique ; si la main dépasse sa limite, une carte doit être sacrifiée.
5. Faire progresser le Moonrail jusqu’à 10 avant que la Poursuite céleste atteigne 10.
6. Améliorer, fusionner et collectionner ses cartes pendant la tentative.
7. Après une défaite, ouvrir un prisme gacha dont la puissance dépend de l’avancement. La récompense de fin de run est uniquement le tirage gacha.
8. Repartir pour découvrir les 24 vérités, les routes cachées et trois fins.

## Contenu jouable

- plateau lisible à trois wagons, prédictions ennemies et course Progression/Poursuite ;
- économie de Lueur et chaudière limitée à une carte par départ ;
- 143 cartes jouables, 15 capacités et plusieurs archétypes de deck ;
- 6 conductrices avec portraits, decks, talents propres et conditions de déblocage différentes ;
- Spell Card personnelle débloquée après une progression terminée avec la conductrice, puis Last Word personnel très rare via gacha ;
- chaque conductrice existe aussi en boss, avec règle visible en combat, et le boss du personnage joué est exclu de la run ;
- cadence de quatre arrêts, packs homogènes de bonus/malus/pactes, routes météo, transmutation, oracle, boutique et réécriture rare du deck de départ ;
- combats, récompenses, atelier ramifié avec animation avant/après, fusion, malus de route, comptoir à prix variables et aiguillages secrets ;
- 6 plans de reconstruction, 24 vérités, plus de 20 défis de maîtrise et 3 fins ;
- album, progression de collection, roster futur en placeholders et déblocages horizontaux ;
- commandes clavier/souris, drag&drop en combat, tutoriel de première prise en main et manuel intégré ;
- nouveau mode unique centré sur le plateau à trois wagons ; l’ancien mode, le défi quotidien, la reprise de run sauvegardée et l’historique de runs dashboard ont été supprimés.

Le bouton **Centre de test complet** du dashboard ouvre un laboratoire gacha rituel : toutes les cartes, conductrices uniques et Last Words peuvent être débloqués réellement pour tester immédiatement le combat et les prochaines runs.

L’audit produit et la feuille de route de profondeur se trouvent dans [`AUDIT_PRODUIT_JOUEUR.md`](AUDIT_PRODUIT_JOUEUR.md).

## Validation

```powershell
python -m unittest discover -s tests -v
python tools/balance_ritual.py
```

Les tests valident les données, les assets, les règles fondamentales de la boucle Moonrail, la disparition du mode legacy exposé, le gacha rituel et les garde-fous d’interface. Le rapport d’équilibrage donne des métriques reproductibles sur les coûts, les statistiques et les decks de départ.

La direction produit détaillée se trouve dans [`REFONTE_CENTIEME_NUIT.md`](REFONTE_CENTIEME_NUIT.md).
