"""Audit reproductible de l'équilibrage du mode Moonrail.

Le script ne remplace pas les playtests : il détecte les cartes hors courbe et
compare les six decks de départ avec la même grille de valeur.
"""

from __future__ import annotations

import json
import re
import statistics
import sys
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CARD_PATH = ROOT / "data" / "ritual_cards.json"
ENGINE_PATH = ROOT / "app" / "ritual.js"

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

SIGIL_VALUE = {
    "airborne": 0.8,
    "reach": 0.35,
    "thorns": 0.65,
    "brittle": -0.7,
    "fecund": 1.25,
    "deathless": 1.15,
    "many_lived": 0.7,
    "bifurcated": 1.5,
    "bone_digger": 0.85,
    "sprinter": 0.25,
    "guardian": 0.45,
    "pyre": 0.55,
    "hoard": 0.60,
    "omen_break": 0.75,
    "destiny": 0.55,
    "echo": 1.25,
}


def lumen_cost(card: dict) -> int:
    return int(card.get("lumen", card.get("blood") or ((card.get("bones", 0) + 1) // 2)))


def card_value(card: dict) -> float:
    sigils = sum(SIGIL_VALUE.get(sigil, 0.0) for sigil in card.get("sigils", []))
    return card["attack"] * 1.55 + card["health"] * 0.72 + sigils


def starter_pools(source: str) -> dict[str, list[str]]:
    match = re.search(r"const STARTER_POOLS = \{(.*?)\n  \};", source, re.S)
    if not match:
        raise RuntimeError("STARTER_POOLS introuvable dans ritual.js")
    pools: dict[str, list[str]] = {}
    for name, values in re.findall(r"(\w+):\s*\[([^\]]+)\]", match.group(1)):
        pools[name] = re.findall(r"'([^']+)'", values)
    return pools


def main() -> int:
    cards = json.loads(CARD_PATH.read_text(encoding="utf-8"))
    by_id = {card["id"]: card for card in cards}
    pools = starter_pools(ENGINE_PATH.read_text(encoding="utf-8"))

    missing = sorted({card_id for pool in pools.values() for card_id in pool if card_id not in by_id})
    if missing:
        print("ERREUR — cartes absentes :", ", ".join(missing))
        return 1

    print("MOONRAIL — RAPPORT D'ÉQUILIBRAGE")
    print(f"{len(cards)} cartes · {len(pools)} decks · objectif 10 · 3 wagons · 3 Lueurs de base")
    print()
    print("DECKS DE DÉPART")
    deck_values = []
    for name, pool in pools.items():
        selected = [by_id[card_id] for card_id in pool]
        values = [card_value(card) for card in selected]
        costs = [lumen_cost(card) for card in selected]
        efficiencies = [value / max(cost, 1) for value, cost in zip(values, costs)]
        deck_values.append(statistics.mean(efficiencies))
        curve = Counter(costs)
        print(
            f"- {name:11} efficacité {statistics.mean(efficiencies):4.2f} · valeur {statistics.mean(values):4.2f} · coût {statistics.mean(costs):3.2f} "
            f"· courbe " + "/".join(f"{cost}:{curve[cost]}" for cost in sorted(curve))
        )

    spread = max(deck_values) - min(deck_values)
    print(f"Écart d'efficacité entre decks : {spread:.2f} (cible <= 0.75)")
    print()
    print("CARTES HORS COURBE")
    outliers = []
    by_bucket: dict[tuple[str, int], list[float]] = {}
    for card in cards:
        by_bucket.setdefault((card.get("rarity", "common"), lumen_cost(card)), []).append(card_value(card))
    for card in cards:
        if card.get("role") == "wound":
            continue
        cost = lumen_cost(card)
        values = by_bucket[(card.get("rarity", "common"), cost)]
        if len(values) < 3:
            continue
        mean = statistics.mean(values)
        deviation = card_value(card) - mean
        if abs(deviation) >= 1.8:
            outliers.append((abs(deviation), card["name"], cost, deviation))
    if not outliers:
        print("- aucune anomalie structurelle détectée")
    else:
        for _, name, cost, deviation in sorted(outliers, reverse=True):
            print(f"- {name} · ✦{cost} · écart {deviation:+.2f}")

    print()
    if spread <= 0.75:
        print("GARDE-FOU : OK — les decks de départ sont dans la même bande de puissance.")
    else:
        print("GARDE-FOU : À AJUSTER — l'écart des decks dépasse la cible.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
