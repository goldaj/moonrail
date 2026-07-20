import json
import struct
import unittest
from collections import Counter
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class RitualProductTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.cards = json.loads((ROOT / "data" / "ritual_cards.json").read_text(encoding="utf-8"))
        cls.story = json.loads((ROOT / "data" / "ritual_story.json").read_text(encoding="utf-8"))
        cls.source = (ROOT / "app" / "ritual.js").read_text(encoding="utf-8")
        cls.html = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "app" / "styles.css").read_text(encoding="utf-8")

    def test_legacy_mode_is_removed_from_product_surface_and_repo(self):
        self.assertFalse((ROOT / "app" / "game.js").exists())
        self.assertFalse((ROOT / "game").exists())
        self.assertFalse((ROOT / "sim").exists())
        for legacy_json in ("cards.json", "conductors.json", "enemies.json", "companions.json", "relics.json", "gacha_pools.json"):
            self.assertFalse((ROOT / "data" / legacy_json).exists())
        self.assertNotIn('script src="game.js"', self.html)
        for removed_action in ('ritual-continue', 'data-action="history"', 'data-action="daily"', 'data-action="interface-tour"'):
            self.assertNotIn(removed_action, self.html)
        for removed_handler in ("showRunJournal", "showDailySeed", "chooseSalvage"):
            self.assertNotIn(removed_handler, self.source)

    def test_ritual_card_pool_is_large_ratioed_and_well_formed(self):
        counts = Counter(card["rarity"] for card in self.cards)
        self.assertGreaterEqual(len(self.cards), 304)
        self.assertGreater(counts["common"], counts["uncommon"])
        self.assertGreater(counts["uncommon"], counts["rare"])
        self.assertGreater(counts["rare"], counts["unique"])
        self.assertGreater(counts["unique"], counts["secret"])
        self.assertEqual(len({card["id"] for card in self.cards}), len(self.cards))
        valid_sigils = {
            "airborne", "reach", "thorns", "brittle", "fecund", "deathless",
            "many_lived", "bifurcated", "bone_digger", "sprinter", "guardian",
            "pyre", "hoard", "omen_break", "destiny", "echo",
        }
        for card in self.cards:
            self.assertGreaterEqual(card["attack"], 0)
            self.assertGreaterEqual(card["health"], 0)
            self.assertFalse(card["blood"] and card["bones"])
            self.assertTrue(set(card["sigils"]).issubset(valid_sigils), card["id"])
        zero_cost = [card for card in self.cards if card.get("lumen") == 0]
        self.assertGreaterEqual(len(zero_cost), 10)
        self.assertTrue(any(card["attack"] == 0 for card in self.cards))
        self.assertTrue(any(card["health"] == 0 for card in self.cards))
        self.assertTrue(any(card["attack"] == 0 and card.get("lumen") == 0 for card in self.cards))
        self.assertTrue(any(card["health"] == 0 and card.get("lumen") == 0 for card in self.cards))
        self.assertTrue(any(card["attack"] == 0 and card["health"] == 0 and card.get("lumen") == 0 for card in self.cards))
        self.assertEqual(next(card for card in self.cards if card["id"] == "glass_decoy").get("lumen"), 0)
        for new_card_id in (
            "murmur_platform_mouse",
            "archive_sparrow",
            "ticket_slug",
            "platform_imp",
            "soot_lantern_newt",
            "quiet_bell_crab",
            "oath_komainu",
            "marginalia_kitsune",
            "moonrail_index_miko",
            "stoke_jury_tanuki",
            "archive_engine_oni",
            "unread_station_dragon",
            "ash_prayer_crane",
            "prayer_diagnosis_moth",
            "orbit_margin_ofuda",
            "consent_valve_kappa",
            "royal_fuse_wisp",
            "ceiling_breach_tengu",
            "late_banner_oni",
            "scarred_sky_slug",
            "living_reflection_leech",
            "brake_light_frog",
            "return_spark_ticket",
            "cinder_route_pin",
        ):
            self.assertIn(new_card_id, {card["id"] for card in self.cards})
        new_technical_cards = [
            card for card in self.cards
            if card["id"] in {
                "ash_prayer_crane", "prayer_diagnosis_moth", "consent_valve_kappa",
                "royal_fuse_wisp", "late_banner_oni", "scarred_sky_slug",
                "brake_light_frog", "return_spark_ticket", "cinder_route_pin",
            }
        ]
        self.assertEqual(len(new_technical_cards), 9)
        self.assertTrue(all(card.get("lumen") == 0 for card in new_technical_cards))
        self.assertTrue(all(card["attack"] <= 1 for card in new_technical_cards))
        for boss_id in ("controleur", "mecano", "rinka", "eir", "kaguya", "vespera"):
            self.assertIn(f"boss_{boss_id}_technique", {card["id"] for card in self.cards})

    def test_core_board_uses_three_wagons_lumen_auto_draw_and_drag_drop(self):
        self.assertIn("lanes: 3", self.source)
        self.assertIn("progressGoal: 10", self.source)
        self.assertIn("baseLumen: 3", self.source)
        self.assertIn("maxHand: 4", self.source)
        self.assertIn("BALANCE.maxHand", self.source)
        self.assertIn("sacrificeHandCard", self.source)
        self.assertIn("turnDraw: 3", self.source)
        self.assertIn("drawRitualCards(BALANCE.openingHand)", self.source)
        self.assertIn("discardHandForNewTurn", self.source)
        self.assertIn("drawRitualCards(BALANCE.turnDraw)", self.source)
        self.assertIn('draggable="true"', self.source)
        self.assertIn("function handleDragStart", self.source)
        self.assertIn("function handleDrop", self.source)
        self.assertIn("function handlePointerDown", self.source)
        self.assertIn("function finishRitualPointerDrag", self.source)
        self.assertIn("document.addEventListener('pointermove', handlePointerMove)", self.source)
        self.assertIn("setTimeout(() => { suppressNextClick = false; }, 140)", self.source)
        self.assertIn(".ritual-drag-ghost", self.css)
        self.assertIn("#screen-ritual-battle .player-board{min-height:112px}", self.css)
        self.assertIn("#screen-ritual-battle .ritual-slot.empty.player{min-height:100%}", self.css)
        self.assertIn("combat-life-bars", self.source + self.css)
        self.assertIn("health-fill enemy", self.source)
        self.assertIn('id="ritual-combat-feed"', self.html)
        self.assertIn("function pushCombatEvent", self.source)
        self.assertIn("function combatFeedMarkup", self.source)
        self.assertIn("combat-action-feed", self.css)
        self.assertIn("@keyframes combatFeedIn", self.css)
        self.assertIn("pushCombatEvent('start', 'Départ du convoi'", self.source)
        self.assertIn("pushCombatEvent('summon'", self.source)
        self.assertIn("pushCombatEvent('draw', 'Nouvelle main'", self.source)
        self.assertIn('id="feedback-layer"', self.html)
        self.assertIn("function announceFeedback", self.source)
        self.assertIn("function pulseElement", self.source)
        self.assertIn("function pulseDeckCounter", self.source)
        self.assertIn("pulseElement('#ritual-teeth'", self.source)
        self.assertIn("pulseDeckCounter('gain')", self.source)
        self.assertIn("event-announcement", self.source + self.css)
        self.assertIn("event-card-preview", self.source + self.css)
        self.assertIn(".event-announcement.gacha", self.css)
        self.assertIn(".attention-pulse", self.css)
        for feedback_call in (
            "announceFeedback('gain'",
            "announceFeedback('upgrade'",
            "announceFeedback('merge'",
            "announceFeedback('loss'",
            "announceFeedback('gacha'",
        ):
            self.assertIn(feedback_call, self.source)
        self.assertIn("hpChip?.classList.toggle('hidden', !!run?.battle)", self.source)
        self.assertIn("battle.fx = null;", self.source)
        self.assertIn("stokeButton.disabled = battle.resolving || battle.selectedHand === null", self.source)
        self.assertIn("battle.burned ||= []", self.source)
        self.assertNotIn("battle.resolving || battle.stokedThisTurn || battle.selectedHand", self.source)
        self.assertIn("function resolveZeroHealthArrival", self.source)
        self.assertIn("se brise en effet instantané", self.source)
        self.assertIn("if (!unit.hp) { resolveZeroHealthArrival(unit, lane); killUnit(unit, lane, 'player'); }", self.source)
        self.assertIn("data-ritual-player-slot", self.source)
        self.assertIn("function selectedPlacementCard", self.source)
        self.assertIn("function placementPreviewMarkup", self.source)
        self.assertIn("placement-preview", self.source + self.css)
        self.assertIn("placement-ready", self.source + self.css)
        self.assertIn("placement-blocked", self.source + self.css)
        self.assertIn("@keyframes placementReadyPulse", self.css)
        self.assertIn("Les wagons affichent où la poser", self.source)
        self.assertIn("function battleCoachMarkup", self.source)
        self.assertIn("innerHTML = battleCoachMarkup(selected)", self.source)
        self.assertIn("battle-coach", self.source + self.css)
        self.assertIn("data-coach-state", self.source)
        self.assertIn("@keyframes battleCoachIn", self.css)
        self.assertIn("Passe UI lisible 6.0", self.css)
        self.assertIn("#screen-ritual-battle .ritual-hint", self.css)
        self.assertIn("display:block!important", self.css)
        self.assertIn("#screen-ritual-battle .battle-coach.selected .coach-instruction", self.css)
        self.assertIn("@keyframes laneDangerPulse", self.css)
        self.assertIn("@keyframes slotInviteLift", self.css)
        self.assertIn("Passe UI lisible 6.1", self.css)
        self.assertIn("@keyframes gaugePanelSheen", self.css)
        self.assertIn("@keyframes gaugeShine", self.css)
        self.assertIn("@keyframes lumenOrbSweep", self.css)
        self.assertIn("prefers-reduced-motion", self.css)
        self.assertIn("Carte prête à poser", self.source)
        self.assertIn('id="ritual-lane-readout"', self.html)
        self.assertIn("function laneSignalFor", self.source)
        self.assertIn("function lanePlacementSignal", self.source)
        self.assertIn("function laneReadoutMarkup", self.source)
        self.assertIn("innerHTML = laneReadoutMarkup(battle)", self.source)
        self.assertIn("lane-signal", self.source + self.css)
        self.assertIn("lane-signal.preview", self.css)
        self.assertIn("DANGER", self.source)
        self.assertIn("OUVERTURE", self.source)
        self.assertIn("RENFORT", self.source)
        self.assertIn("@keyframes laneSignalIn", self.css)
        self.assertIn("@keyframes lanePreviewPulse", self.css)
        self.assertIn('aria-pressed="${battle.selectedHand === index}"', self.source)
        self.assertIn("SÉLECTION", self.css)
        self.assertIn("@keyframes selectedCardGlow", self.css)
        self.assertIn('data-action="ritual-stoke"', self.html)
        self.assertNotIn('data-ritual-draw="offering"', self.html)

    def test_guardian_selection_previews_starter_deck_before_run(self):
        self.assertIn("function guardianDeckForStart", self.source)
        self.assertIn("function showGuardianDeckPreview", self.source)
        self.assertIn("guardian-start-deck", self.source + self.css)
        self.assertIn("grid-template-columns:repeat(5", self.css)
        self.assertIn("guardian-preview-toolbar", self.source + self.css)
        self.assertIn("pendingGuardian && startRitual(pendingGuardian)", self.source)
        self.assertIn("if (button.dataset.ritualGuardian) return showGuardianDeckPreview", self.source)
        self.assertIn('data-action="ritual-confirm-guardian"', self.source)

    def test_guardians_unlock_spell_cards_and_last_words_with_correct_gates(self):
        self.assertIn("const GUARDIAN_UNLOCKS", self.source)
        self.assertIn("unlockedSpellCards", self.source)
        self.assertIn("characterClears", self.source)
        self.assertIn("starterOverrides", self.source)
        self.assertIn("profile.unlockedSpellCards.includes(guardian)", self.source)
        self.assertIn("guardian === 'vespera'", self.source)
        self.assertIn("profile.unlockedSpellCards.push(guardianId)", self.source)
        signature_cards = [card for card in self.cards if card.get("tribe") == "signature"]
        self.assertEqual(len(signature_cards), 12)
        owners = {}
        for card in signature_cards:
            owners.setdefault(card.get("owner"), []).append(card)
            self.assertIn("À l’arrivée", card["text"])
        self.assertEqual(set(owners), {"controleur", "mecano", "rinka", "eir", "kaguya", "vespera"})
        for owner, owned_cards in owners.items():
            self.assertEqual(len(owned_cards), 2, owner)
            self.assertEqual(sum(card["name"].startswith("Last Word") for card in owned_cards), 1)
        public_text = " ".join(card["text"].lower() for card in signature_cards)
        for secret_name in ("frontière interdite", "rouage absent", "centième pétale", "souffle retenu", "porte du palais", "lune voleuse"):
            self.assertNotIn(secret_name, public_text)

    def test_bosses_are_playable_guardians_with_visible_rule_feedback(self):
        hunter_ids = [hunter["id"] for hunter in self.story["hunters"]]
        self.assertEqual(hunter_ids, ["controleur", "mecano", "rinka", "eir", "kaguya", "vespera"])
        self.assertTrue(all("ruleKey" in hunter for hunter in self.story["hunters"]))
        self.assertIn("function availableHunters", self.source)
        self.assertIn("hunter.id !== run?.guardianId", self.source)
        self.assertIn("triggerBossRule", self.source)
        self.assertIn("boss-rule-banner", self.source + self.css)
        self.assertIn("const BOSS_DIALOGUES", self.source)
        self.assertIn("const BOSS_DIALOGUE_MATRIX", self.source)
        self.assertIn("const BOSS_DIALOGUE_VARIANTS", self.source)
        self.assertIn("function bossDialoguePair", self.source)
        self.assertIn("function conditionalBossDialogue", self.source)
        self.assertIn("function recordBossDialogue", self.source)
        self.assertIn("function completedDialoguePairs", self.source)
        self.assertIn("profile.dialogueArchive", self.source)
        self.assertIn("white_route_memory", self.source)
        self.assertIn("name_vs_vespera", self.source)
        self.assertIn("twelve_archive_before", self.source)
        self.assertIn("red_thread_without_knot_before", self.source)
        self.assertIn("black_manifest_before", self.source)
        self.assertIn("memory_paper_copper_before", self.source)
        self.assertIn("memory_afterfever_after", self.source)
        self.assertIn("item.memory", self.source)
        self.assertIn("function showBossIntroModal", self.source)
        self.assertIn("function showBossOutroDialogue", self.source)
        self.assertIn("boss-rule-spotlight", self.source + self.css)
        self.assertIn("targeted-lane", self.source + self.css)
        self.assertIn("targets:lanes", self.source)
        self.assertNotIn("attackPower", self.source)
        for rule in ("seal_tax", "gear_summon", "ember_duel", "mist_return", "sky_drop", "mirror_copy"):
            self.assertIn(rule, self.source + json.dumps(self.story))

    def test_route_types_shop_prices_teeth_and_meta_progression_exist(self):
        for route_type in ("cleanse", "transform", "scout", "thread", "pact", "weather", "meta"):
            self.assertIn(f"type:'{route_type}'", self.source)
        for function_name in ("resolveCleanseRoute", "showTransformChoice", "resolveScoutRoute", "showRouteSecretEvent", "showPactChoice", "showWeatherChoice", "showStarterRewrite"):
            self.assertIn(f"function {function_name}", self.source)
        self.assertIn("gainTeeth", self.source)
        self.assertIn("lifetimeTeeth", self.source)
        self.assertIn("function shopPrice", self.source)
        self.assertIn("profile.starterOverrides", self.source)
        self.assertIn("profile.metaRewrites", self.source)
        self.assertIn("const ROUTE_FAMILIES", self.source)
        self.assertIn("CONTRAINTE", self.source)
        self.assertIn("3 malus purs", self.source)
        self.assertIn("AIGUILLAGE · CHOIX", self.source)
        self.assertIn("function routeChoiceLabel", self.source)
        for function_name in ("createRouteGraph", "reachableRouteNodes", "inspectRouteNode", "advanceRouteGraph", "routeGraphMarkup"):
            self.assertIn(f"function {function_name}", self.source)
        self.assertIn('id="ritual-route-map"', self.html)
        self.assertIn("ritual-map-main", self.html + self.css)
        self.assertIn("route-map-node", self.source + self.css)
        self.assertIn("route-map-links line.planned", self.css)
        self.assertIn("SWITCH_CHOICES", self.source)
        self.assertIn("function chooseSecretSwitch", self.source)
        self.assertIn("data-ritual-switch", self.source)
        self.assertIn("shouldOfferSecretSwitch", self.source)
        self.assertIn("step > 0", self.source)
        self.assertIn("nextPathBias", self.source)
        self.assertIn("? shuffle(['scout','upgrade','reward','shop','cleanse','transform','weather','pact','malus','secret'])", self.source)
        self.assertIn("routeSecretCandidates().length", self.source)
        self.assertIn("SECRET VIVANT", self.source)
        self.assertIn("Dossier vivant", self.source)
        self.assertIn("Trois leviers, aucune voie sûre", self.source)
        self.assertIn(".switch-grid", self.css)
        self.assertIn("Revenez à l'aiguillage impossible, puis suivez le Fil blanc.", json.dumps(self.story, ensure_ascii=False))
        self.assertNotIn("id === 'white_route' && profile.secretVisits >= 2", self.source)
        self.assertIn("duel_archive", self.source)
        self.assertIn("moonrail_confessional", self.source)
        self.assertIn('id="ritual-run-murmur"', self.html)
        self.assertIn("const RUN_MURMURS", self.source)
        self.assertIn("const RUN_MURMUR_REACTIONS", self.source)
        self.assertIn("function createRunMurmur", self.source)
        self.assertIn("function runMurmurProgress", self.source)
        self.assertIn("function runMurmurReaction", self.source)
        self.assertIn("function resolveRunMurmurReward", self.source)
        self.assertIn("function runMurmurMarkup", self.source)
        self.assertIn("function runMurmurReportMarkup", self.source)
        self.assertIn("function routeMurmurHint", self.source)
        self.assertIn("function routeMurmurHintMarkup", self.source)
        self.assertIn("function murmurPreferredRouteTypes", self.source)
        self.assertIn("const murmurRouteTypes = murmurPreferredRouteTypes()", self.source)
        self.assertIn("ritualRandom() < .42", self.source)
        self.assertIn("nextRunMurmur", self.source)
        self.assertIn("resolvedMurmurs", self.source)
        self.assertIn("function forceRunMurmur", self.source)
        self.assertIn("function murmurArchiveMarkup", self.source)
        self.assertIn("data-ritual-lab-murmur", self.source)
        self.assertIn("button.dataset.ritualLabMurmur", self.source)
        self.assertIn("MURMURE DE CETTE RUN", self.source)
        self.assertIn("Si une phrase manque", self.source)
        self.assertIn("La chaudière tousse", self.source)
        self.assertIn("Murmures de run", self.source)
        self.assertIn("markTruthReady('hundred_reflects')", self.source)
        self.assertIn("run.murmur = createRunMurmur()", self.source)
        self.assertIn("resolveRunMurmurReward()", self.source)
        self.assertIn("routeMurmurHintMarkup(node)", self.source)
        self.assertIn(".run-murmur-card", self.css)
        self.assertIn(".run-murmur-card q", self.css)
        self.assertIn(".run-murmur-report", self.css)
        self.assertIn(".route-murmur-hint", self.css)
        self.assertIn(".murmur-lab-grid", self.css)
        self.assertIn(".murmur-archive-card", self.css)
        self.assertIn("@keyframes routeMurmurPulse", self.css)
        self.assertIn("@keyframes runMurmurIn", self.css)
        self.assertIn("moonrail_confessional", self.source)
        self.assertIn("ROUTE_ART_INDEX", self.source)
        self.assertIn("route-events-sheet-v1.png", self.source + self.css)
        self.assertIn("class=\"route-art\"", self.source)
        self.assertIn("function routeImpactTags", self.source)
        self.assertIn("routeImpactMarkup(node)", self.source)
        self.assertIn("route-impact-list", self.source + self.css)
        self.assertIn("function choiceImpactMarkup", self.source)
        self.assertIn("choice-impact-list", self.source + self.css)
        self.assertIn("function cardRewardInsight", self.source)
        self.assertIn("reward-card-insight", self.source + self.css)
        for helper_name in ("malusImpactTags", "pactImpactTags", "weatherImpactTags", "switchImpactTags"):
            self.assertIn(helper_name, self.source)
        self.assertIn("Indice plutôt que jackpot", self.source)
        self.assertIn(".ritual-path-choices{flex:0 0 auto", self.css)
        self.assertIn(".ritual-path-card{height:78px;min-height:78px", self.css)
        self.assertIn("visible pour anticiper, pas encore sélectionnable", self.source)

    def test_former_placeholder_mechanics_are_runtime_backed(self):
        for token in (
            "WEATHER_CHOICES", "PACT_CHOICES", "destiny", "applyTribeSetBonus",
            "bossLoot", "chooseUpgradePath", "showStarterRewrite", "IMPLEMENTED_MECHANICS",
        ):
            self.assertIn(token, self.source)
        self.assertIn("MÉCANIQUE JOUABLE", self.source)
        self.assertNotIn("MÉCANIQUE FUTURE", self.source)

    def test_gacha_is_animated_random_and_run_end_has_no_manual_card_choice(self):
        self.assertIn("function showRitualGachaLab()", self.source)
        self.assertIn("function confirmQaProgressReset()", self.source)
        self.assertIn("function resetQaProgressToStart()", self.source)
        self.assertIn("function rollRitualGacha", self.source)
        self.assertIn("function openRunEndGacha", self.source)
        self.assertIn("function showRitualGachaAnimation", self.source)
        self.assertIn("function nextPaint()", self.source)
        self.assertIn("await nextPaint();", self.source)
        self.assertIn("await wait(1550);", self.source)
        self.assertIn("run.endGachaTaken = true", self.source)
        self.assertIn("gachaRewardRevealMarkup", self.source)
        self.assertIn("data-action=\"ritual-open-run-gacha\"", self.source)
        self.assertIn("Chaque fin de run ouvre un vrai tirage aléatoire", self.source)
        self.assertIn("data-action='ritual-qa-reset'", self.source)
        self.assertIn("data-action=\"ritual-confirm-qa-reset\"", self.source)
        self.assertIn("profile = normalizeProfile(structuredClone(DEFAULT_PROFILE))", self.source)
        self.assertIn("localStorage.removeItem(PROFILE_KEY)", self.source)
        self.assertIn("localStorage.removeItem(RUN_KEY)", self.source)
        self.assertIn(".gacha-lab-actions .qa-reset-button", self.css)
        self.assertIn("GACHA_TIERS", self.source)
        self.assertIn("return fresh;", self.source)
        self.assertIn("Le gacha ne crée plus de doublons", self.source)
        self.assertIn("!profile.unlockedCards.includes(card.id)", self.source)
        self.assertIn("gachaUnlockedCards", self.source)
        self.assertIn("forceUnlock:true", self.source)
        self.assertIn("function applyRitualLabProgressUnlock", self.source)
        self.assertIn("Scénarios QA · progression secrète", self.source)
        self.assertIn("kind:'thread'", self.source)
        self.assertIn("kind:'memory'", self.source)
        self.assertIn("kind:'route'", self.source)
        self.assertIn("kind:'archive'", self.source)
        self.assertIn("kind:'verdict'", self.source)
        self.assertIn("kind:'constellation'", self.source)
        self.assertIn("QA PROGRESSION SECRÈTE", self.source)
        self.assertIn("guardianPortraitMarkup(reward.guardian", self.source)
        self.assertIn("gacha-guardian-card", self.source + self.css)
        self.assertIn("gacha-guardian-art", self.source + self.css)
        self.assertNotIn("id !== 'vespera'", self.source)
        self.assertNotIn("Spell Card à débloquer d'abord", self.source)
        self.assertNotIn("Doublon converti", self.source)
        self.assertNotIn("function chooseRunEndGacha", self.source)
        self.assertNotIn("runEndGachaOptions", self.source)
        self.assertNotIn("data-ritual-end-gacha", self.source)

    def test_card_type_tutorials_and_utf8_text_are_protected(self):
        for token in (
            "seenCardTypeTutorials", "pendingCardTypeTutorials", "CARD_TYPE_TUTORIALS",
            "function queueCardTypeTutorial", "function showPendingCardTypeTutorial",
            "ritual-card-type-tutorial-close", "card-type-tutorial-modal",
        ):
            self.assertIn(token, self.source + self.css)
        for token in (
            "NOUVEAUX TYPES DE CARTES",
            "card-type-briefing-grid",
            "card-type-briefing-modal",
            "profile.pendingCardTypeTutorials = profile.pendingCardTypeTutorials.filter",
        ):
            self.assertIn(token, self.source + self.css)
        for token in ("zero_cost", "zero_attack", "zero_health", "zero_trinity", "last_word"):
            self.assertIn(token, self.source)
        visible_files = [
            self.source,
            self.html,
            self.css,
            json.dumps(self.cards, ensure_ascii=False),
            json.dumps(self.story, ensure_ascii=False),
        ]
        bad_tokens = (
            "\u00c3", "\u00c2", "\ufffd",
            "?" + " l?", "p" + "?tale",
            "front" + "iere", "cent" + "ieme", "ce matin" + "-la",
        )
        re = __import__("re")
        for text in visible_files:
            for bad in bad_tokens:
                self.assertNotIn(bad, text)
            visible_text = re.sub(r'\b(?:href|src)=["\'][^"\']+["\']', "", text)
            self.assertIsNone(
                re.search(r"(?<=[^\W\d_])\?(?=[^\W\d_])", visible_text),
                "A visible text still contains a replacement question mark between letters.",
            )

    def test_rewards_start_from_current_deck_and_not_global_unlock_pool(self):
        self.assertIn("function rewardPool()", self.source)
        self.assertIn("const sourceDeck = run?.deck?.length ? run.deck : []", self.source)
        self.assertIn("const gachaPool = (profile.gachaUnlockedCards || [])", self.source)
        self.assertIn("return [...deckPool, ...gachaPool]", self.source)
        self.assertIn("card && card.tribe !== 'signature' && card.rarity !== 'unique'", self.source)
        self.assertNotIn("const pool = profile.unlockedCards.map(getCard)", self.source)
        self.assertNotIn("order.slice(0, unlockedCount)", self.source)

    def test_collection_observatory_milestones_and_story_depth_exist(self):
        self.assertGreaterEqual(len(self.story["truths"]), 64)
        self.assertGreaterEqual(sum(1 for truth in self.story["truths"] if "condition" in truth), 10)
        for truth_id in ("dialogue_scars", "white_thread_oath", "moonrail_witness", "last_bell_family", "six_answers", "hundred_reflects", "three_private_oaths", "dawn_refusal", "first_dialogue_echo", "archive_room_unlocked", "first_false_thread", "three_false_threads", "red_thread_without_knot_truth", "first_living_dossier", "three_living_dossiers", "black_lantern_manifest_truth", "first_relationship_memory", "three_relationship_memories", "orbit_apology_truth", "first_secret_verdict", "three_secret_verdicts", "player_seat_verdict_truth", "broken_morning_verdict_truth"):
            self.assertIn(truth_id, {truth["id"] for truth in self.story["truths"]})
        self.assertIn("const MILESTONES", self.source)
        self.assertGreaterEqual(self.source.count("id:'"), 60)
        self.assertIn("function showObservatory()", self.source)
        self.assertIn("function showCollectionHub()", self.source)
        self.assertIn("function showNightAlbum()", self.source)
        self.assertIn("function showAlbumCardZoom(id)", self.source)
        self.assertIn("guardianEndingHook", self.source)
        self.assertIn("ritual-catalogue", self.source)
        self.assertIn('data-action="ritual-night-album"', self.source)
        self.assertIn("data-ritual-album-card", self.source)
        self.assertIn("night-album-modal", self.source + self.css)
        self.assertIn("['secret','unique'].includes(rarity) && !seen", self.source)
        self.assertIn("['secret','unique'].includes(item.rarity) || item.seen > 0", self.source)
        self.assertIn("function observatoryGuidanceItems", self.source)
        self.assertIn("function observatoryGuidanceMarkup", self.source)
        self.assertIn("function collectionRaritySummaryMarkup", self.source)
        self.assertIn("COMPLÉTION DES CARTES", self.source)
        self.assertIn("collection-rarity-summary", self.source + self.css)
        self.assertIn("PISTES ACTIVES", self.source)
        self.assertIn("observatory-guidance", self.source + self.css)
        self.assertIn("truthConditionMet", self.source)
        self.assertIn("has_truth", json.dumps(self.story, ensure_ascii=False))
        self.assertIn("all_truths", json.dumps(self.story, ensure_ascii=False))
        self.assertIn("white_thread_loom", self.source + json.dumps(self.cards, ensure_ascii=False))
        self.assertIn("amahina_first_refusal", self.source + json.dumps(self.cards, ensure_ascii=False))
        self.assertNotIn("Rien n’est affiché avant d’avoir réellement été découvert", self.source)
        self.assertNotIn("${profile.truths.length} vérités · ${profile.constellations.length}", self.source)
        self.assertNotIn('<section class="catalogue-shelf"><h3>Album de la nuit</h3>', self.source)
        self.assertNotIn('data-action="collection"', self.html)
        self.assertNotIn("Collection & équipe", self.html)
        self.assertNotIn("Paramètres & accessibilité", self.html)
        self.assertIn('<span>Observatoire<small>Avancement</small></span>', self.html)
        self.assertIn('<span>Codex des Cent Lunes<small>Personnages · histoire</small></span>', self.html)
        self.assertIn('<button class="secondary-button large observatory-button" data-action="codex"', self.html)
        self.assertIn('<button class="secondary-button large observatory-button" data-action="ritual-rulebook"', self.html)
        self.assertNotIn("Explorer l'observatoire", self.html)
        self.assertNotIn("Objets, énigmes et vérités cachées", self.html)
        self.assertNotIn("Univers · personnages · créatures", self.html)
        self.assertIn("constellations", self.story)
        self.assertGreaterEqual(len(self.story["constellations"]), 6)
        for constellation in self.story["constellations"]:
            self.assertIn("truths", constellation)
            self.assertIn("reward", constellation)
            self.assertTrue(all(any(truth["id"] == truth_id for truth in self.story["truths"]) for truth_id in constellation["truths"]))
            self.assertTrue(any(card["id"] == constellation["reward"] for card in self.cards))
        self.assertIn("function constellationProgress", self.source)
        self.assertIn("function claimConstellation", self.source)
        self.assertIn("data-ritual-constellation", self.source)
        self.assertIn("truth-relics-sheet-v1.png", self.source + self.css)
        self.assertIn("dialogueArchives", self.story)
        self.assertGreaterEqual(len(self.story["dialogueArchives"]), 6)
        for archive in self.story["dialogueArchives"]:
            self.assertIn("reward", archive)
            self.assertTrue("pairs" in archive or "minPairs" in archive)
            self.assertTrue(any(card["id"] == archive["reward"] for card in self.cards))
        self.assertIn("function dialogueArchiveProgress", self.source)
        self.assertIn("function claimDialogueArchive", self.source)
        self.assertIn("data-ritual-dialogue-archive", self.source)
        self.assertIn("dialogue-archives-sheet-v1.png", self.source + self.css)
        self.assertIn("function cardProgressUnlockedForGacha", self.source)
        self.assertTrue(any(card.get("unlockArchive") for card in self.cards))
        for reward_id in ("archive_oath_ticket", "diagnostic_ember_vial", "moon_tide_shell", "witness_carriage_key", "thirtieth_dialogue_mask"):
            self.assertIn(reward_id, {card["id"] for card in self.cards})
        self.assertIn("relationshipMemories", self.story)
        self.assertGreaterEqual(len(self.story["relationshipMemories"]), 15)
        for memory in self.story["relationshipMemories"]:
            self.assertIn("requirements", memory)
            self.assertIn("reward", memory)
            self.assertTrue(any(card["id"] == memory["reward"] for card in self.cards))
        self.assertIn("function relationshipMemoryProgress", self.source)
        self.assertIn("function claimRelationshipMemory", self.source)
        self.assertIn("data-ritual-relationship-memory", self.source)
        self.assertIn("relationship-memories-sheet-v1.png", self.source + self.css)
        self.assertTrue(any(card.get("unlockMemory") for card in self.cards))
        for reward_id in ("platform_talisman_fox", "afterfever_mist_oni", "orbit_apology_dragon", "clean_knife_moon", "astrolabe_gear_kitsune", "manual_fire_tanuki"):
            self.assertIn(reward_id, {card["id"] for card in self.cards})
        for memory_id in (
            "ash_prayer_truce", "diagnosis_of_prayer", "margin_orbit_liturgy",
            "engine_heart_chart", "royal_fuse_test", "ceiling_sun_compact",
            "late_rebellion_banner", "scarred_sky_protocol", "living_reflection_sample",
        ):
            self.assertIn(memory_id, {memory["id"] for memory in self.story["relationshipMemories"]})
        for narrative_feature in (
            "GUARDIAN_STORY_ARCS", "RELATIONSHIP_REPRISES", "dialogueVariantPriority",
            "relationshipRepriseDialogue", "guardianArcMarkup", "showCodexPortraitZoom",
        ):
            self.assertIn(narrative_feature, self.source)
        self.assertIn("['DÉSIR', arc.want, true]", self.source)
        self.assertIn("['FAUTE', arc.wound, progress.wound]", self.source)
        self.assertIn("].filter(([, text, revealed]) => text && revealed)", self.source)
        self.assertIn("data-ritual-codex-portrait", self.source)
        self.assertIn("portrait-zoom-layer", self.source + self.css)
        self.assertNotIn("DÉSIR VISIBLE", self.source)
        self.assertNotIn("FAUTE ANCIENNE", self.source)
        self.assertNotIn("Une technique personnelle dort encore dans sa fin", self.source)
        self.assertIn("secretThreads", self.story)
        self.assertGreaterEqual(len(self.story["secretThreads"]), 6)
        for thread in self.story["secretThreads"]:
            self.assertIn("requirements", thread)
            self.assertIn("reward", thread)
            self.assertTrue(any(card["id"] == thread["reward"] for card in self.cards))
        self.assertIn("function secretThreadProgress", self.source)
        self.assertIn("function claimSecretThread", self.source)
        self.assertIn("data-ritual-secret-thread", self.source)
        self.assertIn("secret-threads-sheet-v1.png", self.source + self.css)
        self.assertTrue(any(card.get("unlockThread") for card in self.cards))
        for reward_id in ("red_thread_snail", "fox_clock_inquisitor", "black_manifest_conductor", "tide_burn_miko", "silent_thirteenth_seat", "dawn_paradox_yurei"):
            self.assertIn(reward_id, {card["id"] for card in self.cards})
        self.assertIn("routeSecrets", self.story)
        self.assertGreaterEqual(len(self.story["routeSecrets"]), 6)
        for route_secret in self.story["routeSecrets"]:
            self.assertIn("thread", route_secret)
            self.assertIn("reward", route_secret)
            self.assertTrue(any(card["id"] == route_secret["reward"] for card in self.cards))
        self.assertIn("function showRouteSecretEvent", self.source)
        self.assertIn("function chooseRouteSecret", self.source)
        self.assertIn("function routeSecretMarkup", self.source)
        self.assertIn("data-ritual-route-secret-choice", self.source)
        self.assertIn("route-secret-events-sheet-v1.png", self.source + self.css)
        self.assertTrue(any(card.get("unlockRouteSecret") for card in self.cards))
        for reward_id in ("living_dossier_doll", "witness_thread_miko", "oracle_of_crossed_indices", "cabinet_that_remembers_you", "second_knot_komainu", "player_seat_lantern"):
            self.assertIn(reward_id, {card["id"] for card in self.cards})
        self.assertIn("secretVerdicts", self.story)
        self.assertGreaterEqual(len(self.story["secretVerdicts"]), 4)
        for verdict in self.story["secretVerdicts"]:
            self.assertIn("requirements", verdict)
            self.assertIn("reward", verdict)
            self.assertTrue(any(card["id"] == verdict["reward"] for card in self.cards))
        self.assertIn("function secretVerdictProgress", self.source)
        self.assertIn("function claimSecretVerdict", self.source)
        self.assertIn("data-ritual-secret-verdict", self.source)
        self.assertIn("secret-verdicts-sheet-v1.png", self.source + self.css)
        self.assertTrue(any(card.get("unlockVerdict") for card in self.cards))
        for reward_id in ("verdict_witness_miko", "verdict_player_seat_lantern", "verdict_broken_morning_shell", "verdict_unread_trial_gavel"):
            self.assertIn(reward_id, {card["id"] for card in self.cards})

    def test_assets_are_valid_pngs_and_aspect_ratio_is_preserved(self):
        expected_minimums = {
            "codex-daily-life-sheet-v1.png": (1500, 1000),
            "ritual-table-v1.png": (1400, 800),
            "ritual-creatures-sheet-v1.png": (1200, 800),
            "cards-common-sheet.png": (1200, 1200),
            "cards-uncommon-sheet.png": (1700, 850),
            "cards-rare-sheet.png": (1600, 850),
            "cards-mechanics-sheet-v1.png": (1400, 1100),
            "cards-enemy-spells-sheet-v1.png": (1700, 850),
            "cards-secret-unique-sheet-v1.png": (1200, 1200),
            "cards-signatures-sheet-v1.png": (1500, 1000),
            "cards-starter-core-sheet-v1.png": (1200, 1200),
            "cards-starter-expanded-sheet-v1.png": (1200, 1200),
            "cards-common-folklore-sheet-v1.png": (1200, 1200),
            "cards-common-motion-sheet-v1.png": (1200, 1200),
            "cards-common-lowstat-sheet-v1.png": (1200, 1200),
            "cards-uncommon-folklore-sheet-v1.png": (1200, 1200),
            "cards-rare-myth-sheet-v1.png": (1200, 1200),
            "cards-secret-lore-sheet-v1.png": (1200, 1200),
            "heroes-moonrail-sheet-v1.png": (1200, 800),
            "route-events-sheet-v1.png": (1000, 1000),
            "lore-events-sheet-v1.png": (1200, 1200),
            "truth-relics-sheet-v1.png": (1200, 1200),
            "dialogue-archives-sheet-v1.png": (1200, 1200),
            "secret-threads-sheet-v1.png": (1200, 1200),
            "route-secret-events-sheet-v1.png": (1200, 1200),
            "relationship-memories-sheet-v1.png": (1200, 1200),
            "secret-verdicts-sheet-v1.png": (1200, 1200),
            "cards-relations-techniques-sheet-v1.png": (1200, 1200),
        }
        for filename, minimum in expected_minimums.items():
            path = ROOT / "assets" / filename
            self.assertTrue(path.exists())
            with path.open("rb") as handle:
                self.assertEqual(handle.read(8), b"\x89PNG\r\n\x1a\n")
                handle.read(8)
                width, height = struct.unpack(">II", handle.read(8))
            self.assertGreaterEqual(width, minimum[0])
            self.assertGreaterEqual(height, minimum[1])
            self.assertIn(filename, self.css + self.source)
        self.assertIn("background-size:300% auto", self.source)
        self.assertIn("background-size:${cols * 100}% auto", self.source)
        self.assertIn("function cardArtSheet", self.source)
        self.assertIn("cards-mechanics-sheet-v1.png", self.source)
        self.assertIn("cards-enemy-spells-sheet-v1.png", self.source)
        self.assertIn("cards-secret-unique-sheet-v1.png", self.source)
        self.assertIn("LORE_ROUTE_ART_INDEX", self.source)
        self.assertIn("dialogueArchiveStyle", self.source)
        self.assertIn("secretThreadStyle", self.source)
        self.assertIn("routeSecretEventStyle", self.source)
        self.assertIn("relationshipMemoryStyle", self.source)
        self.assertIn("secretVerdictStyle", self.source)
        self.assertIn("cards-starter-core-sheet-v1.png", self.source + self.css)
        self.assertIn("cards-starter-expanded-sheet-v1.png", self.source + self.css)
        self.assertIn("cards-common-folklore-sheet-v1.png", self.source + self.css)
        self.assertIn("cards-common-motion-sheet-v1.png", self.source + self.css)
        self.assertIn("cards-common-lowstat-sheet-v1.png", self.source + self.css)
        self.assertIn("cards-uncommon-folklore-sheet-v1.png", self.source + self.css)
        self.assertIn("cards-rare-myth-sheet-v1.png", self.source + self.css)
        self.assertIn("cards-secret-lore-sheet-v1.png", self.source + self.css)
        self.assertIn("const CARD_SPECIFIC_ART", self.source)
        self.assertIn("moon_hare: ['cards-starter-core-sheet-v1.png', 0]", self.source)
        self.assertIn("paper_crane: ['cards-starter-core-sheet-v1.png', 1]", self.source)
        self.assertIn("shrine_fox: ['cards-starter-core-sheet-v1.png', 2]", self.source)
        self.assertIn("dew_fox: ['cards-common-folklore-sheet-v1.png', 0]", self.source)
        self.assertIn("ribbon_crow: ['cards-common-folklore-sheet-v1.png', 15]", self.source)
        self.assertIn("steam_tanuki: ['cards-common-motion-sheet-v1.png', 0]", self.source)
        self.assertIn("cloud_calf: ['cards-common-motion-sheet-v1.png', 15]", self.source)
        self.assertIn("ember_grub: ['cards-common-lowstat-sheet-v1.png', 0]", self.source)
        self.assertIn("mist_boar: ['cards-common-lowstat-sheet-v1.png', 15]", self.source)
        self.assertIn("furnace_kitsune: ['cards-uncommon-folklore-sheet-v1.png', 0]", self.source)
        self.assertIn("mirror_kappa: ['cards-uncommon-folklore-sheet-v1.png', 15]", self.source)
        self.assertIn("red_thread_doll: ['cards-rare-myth-sheet-v1.png', 0]", self.source)
        self.assertIn("forgotten_driver_glove: ['cards-rare-myth-sheet-v1.png', 15]", self.source)
        self.assertIn("dawn_spark: ['cards-secret-lore-sheet-v1.png', 0]", self.source)
        self.assertIn("verdict_player_seat_lantern: ['cards-secret-lore-sheet-v1.png', 14]", self.source)
        self.assertIn("skull_mochi: ['cards-starter-expanded-sheet-v1.png', 0]", self.source)
        self.assertIn("moonless_bodyguard: ['cards-starter-expanded-sheet-v1.png', 15]", self.source)
        self.assertIn("return spriteSheetStyle(sheet.file, sheet.cols, sheet.rows, card?.art, true)", self.source)
        self.assertNotIn("function semanticCardArtStyle", self.source)
        self.assertNotIn("background-image:url('data:image/svg+xml", self.source)

    def test_keyboard_help_tutorial_and_responsive_layout_remain_available_in_run(self):
        self.assertIn("function handleKey(event)", self.source)
        self.assertIn("event.code === 'Space'", self.source)
        self.assertIn("function showRitualRulebook()", self.source)
        self.assertIn("PREMIER DÉPART · 60 SECONDES", self.source)
        self.assertIn("@media(max-width:620px)", self.css)
        self.assertIn("width:min(1580px", self.css)
        self.assertIn(".ritual-battle-screen{overflow:auto", self.css)
        self.assertIn(".ritual-row{grid-template-columns:repeat(3", self.css)
        self.assertIn("deck-modal-hint", self.source + self.css)
        self.assertIn("La Vie affichée persiste entre les combats", self.source)
        self.assertIn("deck-modal:not(.guardian-preview-modal)", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(128px,1fr))", self.css)
        self.assertIn("function showCardZoom", self.source)
        self.assertIn("data-card-id", self.source)
        self.assertIn("ritual-card-zoom-confirm", self.source)
        self.assertIn(".card-zoom-layer", self.css)
        self.assertIn(".card-zoom-panel", self.css)
        self.assertIn("Passe UI lisible 6.4", self.css)
        self.assertIn("function resetRitualViewportScroll", self.source)
        self.assertIn("app.scrollLeft = 0", self.source)
        self.assertIn("resetRitualViewportScroll();", self.source)
        self.assertIn("#modal-layer .guardian-modal .ritual-guardian-grid", self.css)
        self.assertIn("grid-template-columns:repeat(3,minmax(245px,1fr))", self.css)
        self.assertIn("#modal-layer .guardian-start-deck", self.css)
        self.assertIn("#modal-layer .gacha-lab-dashboard", self.css)
        self.assertIn("overflow-x:hidden!important", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fill,minmax(126px,1fr))", self.css)
        self.assertIn("Passe UI lisible 6.5", self.css)
        self.assertIn("#app .card-zoom-layer .card-zoom-card .ritual-card-art", self.css)
        self.assertIn(".card-zoom-layer .card-zoom-card .ritual-card-art", self.css)
        self.assertIn("Correctif portée DOM", self.css)
        self.assertIn("height:260px!important", self.css)
        self.assertIn("-webkit-line-clamp:unset!important", self.css)
        self.assertIn("function cardZoomRole", self.source)
        self.assertIn("function cardZoomTips", self.source)
        self.assertIn("Lecture rapide", self.source)
        self.assertIn("À surveiller", self.source)
        self.assertIn(".card-zoom-explain", self.css)
        self.assertIn("le survol reste léger", self.css)
        self.assertIn("@keyframes gaugeFill", self.css)
        self.assertIn("font-size:13px", self.css)
        self.assertIn("Passe UI lisible 6.6", self.css)
        self.assertIn("grid-template-columns:46px minmax(0,1fr) auto", self.css)
        self.assertIn("#modal-layer .ritual-modal .salvage-grid", self.css)
        self.assertIn("font-size:clamp(14px,1.03vw,16px)!important", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(250px,1fr))", self.css)
        self.assertIn("Passe UI lisible 6.7", self.css)
        self.assertIn("contraste de premier plan", self.css)
        self.assertIn("#modal-layer.open", self.css)
        self.assertIn("backdrop-filter:blur(6px) saturate(1.05)!important", self.css)
        self.assertIn("Passe UI lisible 6.8", self.css)
        self.assertIn("main de combat lisible", self.css)
        self.assertIn("height:clamp(150px,20vh,168px)!important", self.css)
        self.assertIn("font-size:clamp(8.6px,.7vw,10px)!important", self.css)
        self.assertIn("Passe UI lisible 6.9", self.css)
        self.assertIn("le combat doit tenir en 768p sans couper la main", self.css)
        self.assertIn("height:calc(100vh - 84px)!important", self.css)
        self.assertIn("#screen-ritual-battle .combat-action-feed", self.css)
        self.assertIn("Passe UI lisible 6.10", self.css)
        self.assertIn("contrôles bas sans chevauchement", self.css)
        self.assertIn("grid-template-columns:144px 82px minmax(0,1fr)", self.css)
        self.assertIn("Passe UI lisible 6.11", self.css)
        self.assertIn("collection et labo gacha au format dashboard lisible", self.css)
        self.assertIn("width:min(1240px,calc(100vw - 44px))!important", self.css)
        self.assertIn("#modal-layer .collection-modal .planned-roster-grid", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(320px,1fr))!important", self.css)
        self.assertIn("font-size:11.2px!important", self.css)
        self.assertIn("Passe UI lisible 6.12", self.css)
        self.assertIn("observatoire lisible comme un carnet d'enquête", self.css)
        self.assertIn("#modal-layer .observatory-modal .observatory-progress.quiet", self.css)
        self.assertIn("#modal-layer .observatory-modal .night-album-entry", self.css)
        self.assertIn(".collection-rarity-summary header small{color:#ffd078;font-size:10px", self.css)
        self.assertIn("font-size:10.8px!important", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(380px,1fr))!important", self.css)
        self.assertIn("Passe UI lisible 6.13", self.css)
        self.assertIn("les badges collection restent dans leur cadre", self.css)
        self.assertIn("overflow-wrap:anywhere!important", self.css)
        self.assertIn("#modal-layer .observatory-modal .observatory-guidance.empty header", self.css)
        self.assertIn("Passe UI lisible 6.14", self.css)
        self.assertIn("preview du deck de départ réellement lisible avant validation", self.css)
        self.assertIn("#modal-layer .guardian-preview-modal.deck-modal", self.css)
        self.assertIn("grid-template-columns:300px minmax(0,1fr)!important", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(136px,1fr))!important", self.css)
        self.assertIn("font-size:8.8px!important", self.css)
        self.assertIn("Passe UI lisible 6.15", self.css)
        self.assertIn("ateliers entre combats sans cartes coupées", self.css)
        self.assertIn("#modal-layer .upgrade-modal .ritual-upgrade-list", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(128px,1fr))!important", self.css)
        self.assertIn("font-size:8.2px!important", self.css)
        self.assertIn("#modal-layer .transform-modal .ritual-transform-grid", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(340px,1fr))!important", self.css)
        self.assertIn("Passe UI lisible 6.16", self.css)
        self.assertIn("aide, codex et paramètres comme vrais écrans de joueur", self.css)
        self.assertIn("#modal-layer .ritual-settings-modal", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(320px,1fr))!important", self.css)
        self.assertIn("codex-lead", self.source + self.css)
        self.assertIn("Verrou final Codex 10.0", self.css)
        self.assertIn("#modal-layer .codex-lore-modal .codex-character-entry>p{grid-column:1/-1!important", self.css)
        self.assertIn("#modal-layer .codex-lore-modal .guardian-arc-progress{grid-column:1/-1!important", self.css)
        self.assertIn("#modal-layer .codex-lore-modal .guardian-arc-progress article.locked{display:none!important}", self.css)
        self.assertIn("#modal-layer .codex-lore-modal .codex-character-heading>mark{font-size:12px!important", self.css)
        self.assertIn("Repères de conduite", self.source)
        self.assertIn("Contrôles essentiels", self.source)
        self.assertIn("Ouvrir le manuel", self.source)
        self.assertIn("Passe UI lisible 6.17", self.css)
        self.assertIn("manuel et codex visibles sans rangée coupée en 768p", self.css)
        self.assertIn("#modal-layer .rulebook-modal:not(.codex-lore-modal) .rulebook-grid", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(235px,1fr))!important", self.css)
        self.assertIn("grid-template-columns:repeat(auto-fit,minmax(300px,1fr))!important", self.css)
        self.assertIn("Passe UI lisible 6.18", self.css)
        self.assertIn("choix de cartes entre deux combats", self.css)
        self.assertIn("#modal-layer .reward-modal .reward-card-option::after", self.css)
        self.assertIn("Prendre cette carte", self.css)
        self.assertIn("#modal-layer .upgrade-modal .ritual-upgrade-list>button.ritual-card .ritual-card-frame", self.css)
        self.assertIn("grid-auto-flow:column!important", self.css)
        self.assertIn("Valider cet", self.css)
        self.assertIn("Déclenche des combos", self.source)
        self.assertIn("coût variable", self.source)
        self.assertIn('id="screen-ritual-battle"', self.html)
        self.assertIn('id="screen-ritual-map"', self.html)
        self.assertIn("Passe produit 7.0", self.css)
        self.assertIn("Garde de cascade 7.0", self.css)
        self.assertIn("guardian-portrait", self.source + self.css)
        self.assertIn("aspect-ratio:1/1!important", self.css)

    def test_product_pass_8_persistent_deck_gacha_observatory_and_route_rules(self):
        self.assertIn("stopsPerControl: 5", self.source)
        self.assertIn("const MINIBOSS_ENCOUNTERS", self.source)
        self.assertIn("run.hunterOrder = shuffle", self.source)
        self.assertIn("type:'miniboss'", self.source)
        self.assertIn("isCurrent ? '' : 'disabled'", self.source)
        self.assertNotIn("function routePathTo", self.source)
        self.assertIn("function markRunCardDead", self.source)
        self.assertIn("function finalizeRunDeckAfterBattle", self.source)
        self.assertIn("function confirmLaneOverwrite", self.source)
        self.assertIn("Une carte morte quitte la run", self.source)
        self.assertIn("function cardAshCost", self.source)
        self.assertIn("Cartes de Cendres", self.source)
        self.assertIn("+1 Puissance ou +2 Vie", self.source)
        self.assertIn("run.cardInstanceMods[uid].tuned = true", self.source)
        self.assertIn("run.victoryEnding", self.source)
        self.assertIn("ritual-open-run-gacha", self.source)
        self.assertIn("Spell Cards personnelles", self.source)
        self.assertIn("Last Words très rares", self.source)
        self.assertIn("addRunCard(reward.target)", self.source)
        self.assertIn("addRunCard(spellId)", self.source)
        self.assertIn("function completedDialogueMarkup", self.source)
        self.assertIn("function showCompletedDialogue", self.source)
        self.assertIn("Uniquement les face-à-face déjà terminés", self.source)
        self.assertIn("if (!claimed) return ''", self.source)
        self.assertIn("if (!found) return ''", self.source)
        self.assertIn("OBSERVATOIRE MASQUÉ", self.source)
        self.assertIn("codex-daily-life-sheet-v1.png", self.source)
        self.assertIn("Garde narrative 8.6", self.css)
        self.assertIn("Garde zoom 8.8", self.css)
        self.assertNotIn("background-size:400% auto!important", self.css)
        self.assertTrue((ROOT / "DOSSIER_PRODUIT_PRIVE_MOONRAIL.md").exists())

    def test_product_pass_9_signatures_recap_and_instance_safe_workshops(self):
        self.assertIn("function isReturningSignature", self.source)
        self.assertIn("state.returnsNextCombat = isReturningSignature", self.source)
        self.assertIn("state.dead && (state.returnsNextCombat || isReturningSignature", self.source)
        self.assertIn("Spell Cards et Last Words constituent l’unique exception", self.source)
        self.assertIn("BRISÉE · REVIENT AU PROCHAIN COMBAT", self.source)
        self.assertIn("function progressionSnapshot", self.source)
        self.assertIn("run.progressionBaseline = progressionSnapshot()", self.source)
        self.assertIn("function progressionDiff", self.source)
        self.assertIn("function showRunProgressRecap", self.source)
        self.assertIn("Voir tout ce qui a été débloqué", self.source)
        self.assertIn("ritual-complete-run-recap", self.source)
        self.assertIn("ritual-lab-run-recap", self.source)
        self.assertIn("collection-card-insert", self.css)
        self.assertIn("run-progress-recap-modal", self.source + self.css)
        self.assertIn("function replaceRunCardInstance", self.source)
        self.assertIn("function chooseForge", self.source)
        self.assertIn("data-ritual-forge", self.source)
        self.assertIn("slot:${option.slotIndex}", self.source)
        self.assertNotIn("run.deck = run.deck.map(id => id === option.old ? option.next : id)", self.source)
        self.assertIn("Garde de lisibilité 9.0", self.css)
        self.assertIn("grid-template-columns:auto minmax(0,1fr) auto!important", self.css)
        self.assertIn("-webkit-line-clamp:3!important", self.css)
        self.assertIn("font-size:9px!important", self.css)
        self.assertIn("Garde de lisibilite 9.1", self.css)
        self.assertIn(".route-map-node>small", self.css)
        self.assertIn("width:calc(100% - 6px)!important", self.css)
        self.assertIn("Garde d'ergonomie 9.2", self.css)
        self.assertIn("width:min(1660px,calc(100vw - 48px))!important", self.css)
        self.assertIn("Garde de carte 9.3", self.css)
        self.assertIn("top:8px!important", self.css)
        self.assertIn("Garde de lecture 9.4", self.css)
        self.assertIn("filter:grayscale(1) brightness(.58)!important", self.css)
        self.assertIn("Garde de composition 9.5", self.css)
        self.assertIn(".forecast-row .ritual-card-stats", self.css)
        self.assertIn("Garde de main 9.6", self.css)
        self.assertIn("height:30px!important", self.css)
        self.assertIn("height:35px!important", self.css)
        self.assertIn("font-size:9.6px!important", self.css)
        self.assertIn('styles.css?v=ui-9-6', self.html)
        self.assertIn("battle-toast", self.source + self.css)
        smoke = (ROOT / "tools" / "ui_smoke.cjs").read_text(encoding="utf-8")
        self.assertIn("item.size < 8.8", smoke)
        self.assertIn("report.interactiveOverflow", smoke)
        self.assertIn("report.layoutWaste", smoke)
        self.assertIn("report.cardOverlap", smoke)
        self.assertIn("report.criticalOverlap", smoke)
        self.assertIn("report.combatCardReadability", smoke)
        self.assertIn("copyHeight < 25", smoke)
        self.assertIn("async function clickDom", smoke)
        self.assertIn("find(visible)", smoke)
        self.assertIn("label.includes('run_progress_recap') ? 940 : 420", smoke)
        self.assertIn("waitUntil:'load'", smoke)
        self.assertIn("MOONRAIL_SMOKE_SCREENSHOTS", smoke)
        self.assertIn("animations:'disabled'", smoke)
        self.assertIn("timeout:12000", smoke)
        self.assertIn('[data-action="ritual-new"]', smoke)
        self.assertIn("night_album", smoke)
        self.assertIn("battle_toast_feedback", smoke)


if __name__ == "__main__":
    unittest.main()
