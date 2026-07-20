# État des user stories — La Centième Nuit

| Priorité | User story | Statut |
|---:|---|---|
| P0 | Comprendre immédiatement comment gagner et perdre | Fait — course Progression/Poursuite visible |
| P0 | Comprendre un premier tour en moins d’une minute | Fait — tutoriel contextualisé en quatre actions |
| P0 | Planifier autour de trois wagons persistants | Fait |
| P0 | Voir les manœuvres ennemies avant leur arrivée | Fait |
| P0 | Arbitrer entre jouer et chauffer une carte pour produire de la Lueur | Fait |
| P0 | Reprendre une sauvegarde ancienne ou actuelle sans casser la partie | Fait — migration automatique |
| P0 | Voir des portraits cohérents sans image étirée | Fait — planche dédiée et cadrage sans déformation |
| P1 | Connaître le prochain contrôle céleste et préparer son deck | Fait — cadence de quatre arrêts |
| P1 | Choisir entre combat, carte, réglage, fusion, comptoir et secret | Fait |
| P1 | Apprendre d’une défaite sans accumuler de puissance automatique | Fait — plans de reconstruction horizontaux |
| P1 | Découvrir de nouveaux systèmes et secrets en rejouant | Fait — observatoire et vérités |
| P1 | Atteindre plusieurs fins avec des conditions différentes | Fait — 3 fins |
| P1 | Collectionner les créatures et suivre l’album | Fait |
| P1 | Jouer plusieurs personnages réellement distincts | Fait — 6 conductrices |
| P1 | Contrôler l’équilibrage par des métriques reproductibles | Fait — configuration centralisée et rapport local |
| P2 | Jouer au clavier, à la souris et sur petit écran | Fait |
| P2 | Retrouver le mode historique | Fait — Chroniques classiques |

## Validation attendue

- données JSON et assets validés ;
- syntaxe JavaScript validée ;
- boucle testée : route → pioche → affectation ou chauffe → départ → prédiction → récompense ;
- coûts, efficacité des cartes et decks de départ audités par `tools/balance_ritual.py` ;
- parcours visuel vérifié dans le navigateur à 1280 × 720.
