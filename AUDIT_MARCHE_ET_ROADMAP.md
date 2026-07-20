# Audit marché et roadmap produit — Moonrail

> Ce document décrit l’ancienne direction « deckbuilder gacha ». La refonte active est désormais **La Centième Nuit** et sa référence produit est [`REFONTE_CENTIEME_NUIT.md`](REFONTE_CENTIEME_NUIT.md).

## Verdict

Moonrail possède maintenant la largeur de contenu et les boucles de collection nécessaires à une démo client convaincante. Son principal risque n’est plus le manque de fonctionnalités : c’est la profondeur d’équilibrage, la variété structurelle des runs et la quantité de feedbacks de jeu. La prochaine phase doit donc consolider le « game feel » et la rejouabilité au lieu d’empiler des menus.

## Comparaison avec les références du marché

| Référence | Force observée | Réponse Moonrail | Écart restant |
|---|---|---|---|
| Slay the Spire / Slay the Spire 2 | identité forte des personnages, cartes propres, actes, événements et ennemis renouvelés | 6 gardiennes, Spell Cards personnelles, 3 actes | biomes et événements doivent modifier davantage les règles de run |
| Wildfrost | compagnons très incarnés, compteurs lisibles, village et progression méta | compagnons, ultimes, intentions exactes, collection | manque un hub évolutif et des relations entre personnages |
| Balatro | objets uniques, collection exhaustive, Stakes et défis à contraintes fortes | cartes uniques, 11 Lunes, codex et pourcentage de collection | les Lunes doivent imposer des règles qualitatives, pas seulement des valeurs |
| Monster Train | clans combinables, combats multi-unités, équipement et défis | 10 types de cartes, équipements, postures, 1–3 ennemis | manque une seconde couche de composition comparable aux clans |

Sources officielles :

- https://www.megacrit.com/news/2026-02-19-release-date-trailer/
- https://www.wildfrostgame.com/
- https://www.playbalatro.com/faq
- https://www.themonstertrain.com/clans
- https://www.themonstertrain.com/challenges
- https://store.steampowered.com/app/2742830/Monster_Train_2/

## Roadmap métier priorisée

### P0 — rendre chaque action satisfaisante

1. Ajouter hit-stop, shake léger, projectiles, impacts élémentaires et sons propres aux 10 familles de cartes.
2. Faire une passe d’équilibrage instrumentée sur 500 à 1 000 simulations par gardienne et par Lune.
   La simulation heuristique actuelle gagne 84,8 % des runs de base : ce signal suggère de durcir le début de progression après des tests humains, sans surcorriger uniquement pour le bot.
3. Ajouter une reprise guidée après défaite : cause principale, trois conseils contextuels et bouton de nouvelle run préconfigurée.
4. Tester systématiquement les résolutions 1366×768, 1920×1080 et mobile paysage.

### P1 — transformer la rejouabilité

5. Donner une règle mondiale à chaque acte : forêt qui pousse, nébuleuse qui dérègle les coûts, palais qui altère les cartes uniques.
6. Remplacer les bonus numériques des Lunes clés par des modificateurs : ennemis évolués, routes cachées, shops limités, boss remixés.
7. Ajouter des « contrats de convoi » : objectifs de run optionnels avec récompenses de collection exclusives.
8. Ajouter trois écoles secondaires combinables à chaque gardienne pour créer de vrais hybrides de build.
9. Créer des mini-boss rares et des rencontres secrètes déclenchées par deck, relique ou compagnon.

### P1 — renforcer la collection sans pay-to-win

10. Ajouter une page d’album avec sets, anecdotes, variantes cosmétiques et récompenses à 25/50/75/100 %.
11. Introduire une wishlist de gacha qui améliore légèrement le ciblage sans garantir les mythiques.
12. Donner aux doublons maxés une seconde utilité : skins, animations de carte, cadres et effets de train.
13. Ajouter des quêtes de maîtrise propres aux gardiennes et aux Spell Cards ennemies.

### P2 — créer une identité durable

14. Construire un hub-train évolutif où les personnages débloqués apparaissent et dialoguent.
15. Ajouter des liens entre gardienne et compagnon qui ouvrent des cartes duo.
16. Proposer un mode draft rapide, un mode défi hebdomadaire et des seeds communautaires.
17. Ajouter un journal narratif à embranchements dont certaines fins exigent une collection ou un trajet précis.
18. Préparer localisation, navigation manette complète, remappage et audit WCAG détaillé.

## Décision recommandée

Pour la prochaine passe, investir d’abord dans **le feedback audiovisuel**, **les règles propres aux actes** et **les modificateurs qualitatifs de difficulté**. Ce trio augmentera davantage l’envie de rejouer que cent cartes supplémentaires : il rendra les 86 cartes actuelles plus expressives et chaque run plus mémorable.
