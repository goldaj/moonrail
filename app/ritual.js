(() => {
  'use strict';

  const PROFILE_KEY = 'moonrail.ritual.profile.v1';
  const RUN_KEY = 'moonrail.ritual.run.v1';
  const BALANCE = Object.freeze({
    lanes: 3,
    progressGoal: 10,
    baseLumen: 3,
    stokeGain: 2,
    openingHand: 4,
    turnDraw: 3,
    maxHand: 4,
    stopsPerControl: 5,
    rewardChoices: 3
  });
  const ROUTE_GRAPH_VERSION = 2;
  const STARTER_POOLS = {
    controleur: ['moon_hare','moon_hare','paper_crane','shrine_fox','shrine_fox','bell_toad','wisp_scribe','bone_sparrow','cloud_oni','thorn_oracle'],
    mecano: ['paper_crane','paper_crane','clock_harpy','porcelain_golem','wisp_scribe','bone_sparrow','bone_sparrow','ink_tanuki','star_kappa','rail_cat'],
    rinka: ['cloud_oni','cloud_oni','lantern_moth','moon_hare','rail_cat','bone_sparrow','skull_mochi','thorn_oracle','rinka_ember','shrine_fox'],
    eir: ['dream_butterfly','wisp_scribe','wisp_scribe','paper_crane','bell_toad','bone_sparrow','grave_crow','thorn_oracle','eir_mist','star_kappa'],
    kaguya: ['star_kappa','star_kappa','clock_harpy','porcelain_golem','moon_stag','bone_sparrow','iron_wolf','shrine_fox','kaguya_astral','cloud_oni'],
    vespera: ['mimic_orb','dream_butterfly','lantern_moth','grave_crow','thorn_oracle','rail_cat','vespera_fallen','skull_mochi','porcelain_golem','wisp_scribe']
  };
  const GUARDIANS = {
    controleur: { name:'Ayame Tsukino', title:'Prêtresse des sceaux', perk:'Le premier passager affecté gagne +1 vie.', portrait:0, voice:'Ayame voit le Moonrail comme un sanctuaire mobile : sauver l’Étincelle vaut plus que comprendre les dieux.' },
    mecano: { name:'Kohana Brassfox', title:'Artificière kitsune', perk:'Commence chaque départ avec +1 Lueur.', portrait:1, voice:'Kohana traite la nuit comme une machine cassée. Si les dieux frappent, c’est qu’un rouage ment.' },
    rinka: { name:'Rinka Ashhorn', title:'Duelliste oni', perk:'La première carte chauffée fait avancer le train de 1.', portrait:2, voice:'Rinka veut provoquer le Tribunal en duel public. Elle ne fuit pas : elle choisit le terrain.' },
    eir: { name:'Eir du Croissant', title:'Sorcière de brume', perk:'Le premier passager détruit revient dans la pioche.', portrait:3, voice:'Eir pense que l’aube est malade. Elle conduit pour diagnostiquer le ciel, pas pour le sauver.' },
    kaguya: { name:'Kaguya Astra', title:'Dragonne astrale', perk:'Les cartes coûtant 3 Lueurs gagnent +1 attaque.', portrait:4, voice:'Kaguya reconnaît dans l’Étincelle une héritière perdue des astres dragons. Elle cache ce qu’elle sait.' },
    vespera: { name:'Lady Vespera', title:'Lune déchue', perk:'Commence poursuivie de 1, mais avec 5 Lueurs.', portrait:5, voice:'Vespera conduit pour prouver que même une lune déchue peut refuser l’ordre du ciel.' }
  };
  const GUARDIAN_STORY_ARCS = Object.freeze({
    controleur:{
      want:'Conduire Amahina jusqu’à un sanctuaire où aucun dieu ne pourra la reprendre.',
      wound:'Ayame a signé autrefois les sceaux qui autorisaient le Tribunal à recommencer le monde.',
      turn:'Elle comprend que la pureté de ses rites servait surtout à rendre la violence administrative invisible.',
      ending:'Elle transforme le Moonrail en sanctuaire sans autel : une protection qui ne possède pas ce qu’elle sauve.'
    },
    mecano:{
      want:'Prouver que la nuit est une panne réparable et que la chaudière peut survivre sans sacrifice.',
      wound:'Kohana a construit l’horloge qui effaçait les souvenirs entre deux mondes, en croyant stabiliser le ciel.',
      turn:'Chaque rouage démonté révèle une décision morale qu’elle avait cachée derrière un problème technique.',
      ending:'Elle laisse volontairement une machine inachevée, afin qu’Amahina puisse choisir elle-même la forme du matin.'
    },
    rinka:{
      want:'Forcer le Tribunal à reconnaître publiquement qu’une révolte peut gagner.',
      wound:'Rinka a survécu à la première rébellion en arrivant trop tard ; depuis, elle confond vitesse et courage.',
      turn:'Les autres conductrices lui apprennent qu’épargner, attendre ou demander de l’aide peuvent aussi être des actes offensifs.',
      ending:'Elle rengaine devant le dernier dieu et gagne un duel que le Tribunal ne sait pas comptabiliser.'
    },
    eir:{
      want:'Diagnostiquer la maladie du matin sans condamner la patiente cachée dans le train.',
      wound:'Eir a déjà soigné une aube précédente en effaçant son désir, puis a appelé cela une guérison.',
      turn:'Elle cesse de chercher un état normal et commence à demander à Amahina quel monde lui ferait moins mal.',
      ending:'Elle rédige le premier protocole céleste où le consentement du dieu soigné vaut davantage que la survie du cycle.'
    },
    kaguya:{
      want:'Rendre aux astres une orbite stable sans livrer l’Étincelle au palais.',
      wound:'Kaguya a maintenu la prison de Vespera et appelé cette immobilité équilibre cosmique.',
      turn:'Elle découvre qu’une orbite n’est juste que si l’astre peut la quitter.',
      ending:'Elle brise son propre palais pour fabriquer un ciel sans centre, où aucune lune n’est condamnée à servir de repère.'
    },
    vespera:{
      want:'Faire tomber le Tribunal et récupérer le nom qu’il a transformé en faute.',
      wound:'Vespera veut libérer Amahina, mais reconnaît en elle une couronne capable de légitimer sa vengeance.',
      turn:'Elle doit choisir entre posséder la victoire et laisser le matin appartenir à quelqu’un d’autre.',
      ending:'Elle rend la couronne à la vitre vide et devient la première lune à exister sans royaume ni exil.'
    }
  });
  const GUARDIAN_SIGNATURES = {
    controleur: { default:'spell_ayame_seal', awakening:'spell_ayame_boundary', label:'Sceau des Lunes Jumelles' },
    mecano: { default:'spell_kohana_gearfox', awakening:'spell_kohana_parade', label:'Renard d’Horlogerie' },
    rinka: { default:'spell_rinka_red_sun', awakening:'spell_rinka_petals', label:'Nodachi du Soleil Rouge' },
    eir: { default:'spell_eir_mist', awakening:'spell_eir_night', label:'Brume du Premier Croissant' },
    kaguya: { default:'spell_kaguya_orbit', awakening:'spell_kaguya_palace', label:'Orbite de la Dragonne' },
    vespera: { default:'spell_vespera_red_moon', awakening:'spell_vespera_hundred', label:'Lune Rouge Souveraine' }
  };
  const LAST_WORD_SECRET_NAMES = Object.freeze({
    spell_ayame_boundary:'frontière interdite',
    spell_kohana_parade:'rouage absent',
    spell_rinka_petals:'centième pétale',
    spell_eir_night:'souffle retenu',
    spell_kaguya_palace:'porte du palais',
    spell_vespera_hundred:'lune voleuse'
  });
  const GUARDIAN_UNLOCKS = {
    controleur: { kind:'starter', hint:'Débloquée dès le départ : la prêtresse a juré sur la première cloche du Moonrail.' },
    mecano: { kind:'starter', hint:'Débloquée dès le départ : la kitsune connaît déjà la chaudière mieux que vous.' },
    rinka: { kind:'clear', hint:'Une oni ne monte que dans un train ayant déjà vu plusieurs fausses aubes.' },
    eir: { kind:'boiler', hint:'Écoutez la voix sous les cendres. Quelques cartes chauffées suffisent à l’attirer.' },
    kaguya: { kind:'truths', hint:'Son palais n’apparaît qu’à celles et ceux qui ont compris un fragment de la vérité.' },
    vespera: { kind:'gacha', hint:'Aucune route ne la recrute. Seul un prisme souverain peut faire tomber la lune déchue.' }
  };
  const MALUS_CHOICES = [
    { id:'short_fuse', icon:'♨', name:'Chaudière jalouse', text:'Le prochain combat commence avec -1 Lueur.', apply:r => r.maluses.push({ id:'short_fuse', value:1 }) },
    { id:'watching_eye', icon:'◉', name:'Œil sur la vitre', text:'Le prochain combat commence avec +2 Poursuite.', apply:r => r.maluses.push({ id:'watching_eye', value:2 }) },
    { id:'heavy_hand', icon:'▤', name:'Main encombrée', text:'Votre limite de main baisse de 1 pour deux combats.', apply:r => r.maluses.push({ id:'heavy_hand', value:2 }) },
    { id:'toll_gate', icon:'♢', name:'Péage divin', text:'Perdez 2 jetons de voie ou subissez +1 Poursuite.', apply:r => { if (r.teeth >= 2) r.teeth -= 2; else r.maluses.push({ id:'watching_eye', value:1 }); } }
  ];
  const MALUS_ROUTE_IDS = Object.freeze({
    short_fuse:'omen_tax',
    watching_eye:'glass_toll',
    heavy_hand:'silent_carriage',
    toll_gate:'sleeping_court'
  });
  const SWITCH_CHOICES = [
    { id:'white_thread', icon:'?', name:'Fil blanc', text:'Gagnez +1 Présage stellaire et allumez une piste de secret. Aucun butin immédiat.', apply:r => { r.omens++; markTruthReady(r.secretVisits >= 2 ? 'white_route' : 'window_guest'); } },
    { id:'shard_siding', icon:'♢', name:'Quai des éclats', text:'Gagnez 3 éclats, mais le prochain combat commence avec +1 Poursuite.', apply:r => { gainTeeth(3, 'aiguillage des éclats'); r.maluses.push({ id:'watching_eye', value:1 }); } },
    { id:'silent_switch', icon:'⇆', name:'Aiguille silencieuse', text:'La prochaine carte des routes évite les combats si possible. Le prochain combat commence avec -1 Lueur.', apply:r => { r.nextPathBias = 'noncombat'; r.maluses.push({ id:'short_fuse', value:1 }); } }
  ];
  const RUN_MURMURS = [
    {
      id:'fresh_dialogue', icon:'§', title:'Une phrase manque aux archives',
      hint:'Brisez un contrôle céleste avec cette conductrice : si le dialogue est nouveau, le dernier wagon le classera.',
      reward:'Récompense : +1 Présage stellaire et +1 éclat de voie.',
      progress:base => ({ current:Math.max(0, completedDialoguePairs().length - (base.dialogues || 0)), goal:1, label:'dialogue complet neuf' })
    },
    {
      id:'living_dossier', icon:'※', title:'Un dossier vivant cherche un quai',
      hint:'Prenez une route de secret vivant si elle apparaît. Les preuves qui montent pendant une run comptent autrement.',
      reward:'Récompense : +1 Présage stellaire et +1 éclat de voie.',
      when:() => profile.truths.length >= 6 || (profile.routeSecrets || []).length > 0,
      progress:base => ({ current:Math.max(0, (profile.routeSecrets || []).length - (base.routeSecrets || 0)), goal:1, label:'dossier vivant croisé' })
    },
    {
      id:'white_switch', icon:'?', title:'Le Fil blanc touche l’aiguille',
      hint:'Cherchez un aiguillage impossible pendant cette tentative. Le Tribunal ne sait pas classer les détours répétés.',
      reward:'Récompense : +1 Présage stellaire et +1 éclat de voie.',
      when:() => profile.attempts >= 2,
      progress:base => ({ current:Math.max(0, (run?.secretVisits || 0) - (base.secretVisits || 0)), goal:1, label:'aiguillage impossible suivi' })
    },
    {
      id:'boiler_witness', icon:'♨', title:'La chaudière veut témoigner',
      hint:'Chauffez trois cartes pendant la run. Les cendres sont parfois plus honnêtes que les dieux.',
      reward:'Récompense : +1 Présage stellaire et +1 éclat de voie.',
      progress:base => ({ current:Math.max(0, (profile.lifetimeStokes || 0) - (base.stokes || 0)), goal:3, label:'cartes chauffées' })
    },
    {
      id:'shard_hoard', icon:'♢', title:'La voie réclame un prix exact',
      hint:'Gagnez quatre éclats de voie pendant cette tentative, puis regardez si le dernier wagon change de ton.',
      reward:'Récompense : +1 Présage stellaire et +1 éclat de voie.',
      progress:base => ({ current:Math.max(0, (run?.teeth || 0) - (base.teeth || 0)), goal:4, label:'éclats gagnés' })
    },
    {
      id:'clean_chain', icon:'☾', title:'Deux stations sans quitter le rêve',
      hint:'Remportez deux combats dans la même tentative. Les secrets aiment les trains qui ne ralentissent pas.',
      reward:'Récompense : +1 Présage stellaire et +1 éclat de voie.',
      progress:base => ({ current:Math.max(0, (run?.streak || 0) - (base.streak || 0)), goal:2, label:'victoires de suite' })
    }
  ];
  const RUN_MURMUR_REACTIONS = {
    controleur: {
      fresh_dialogue:'Si une phrase manque, c’est qu’un sceau l’a avalée.',
      living_dossier:'Une preuve qui marche seule mérite une prière séparée.',
      white_switch:'Le Fil blanc ne bénit rien. Il recoud une faute.',
      boiler_witness:'Même la cendre peut devenir ofuda si elle témoigne.',
      shard_hoard:'Les éclats gardent la forme exacte de ce qu’ils ont coupé.',
      clean_chain:'Deux stations sans rompre le cercle : voilà un rituel.'
    },
    mecano: {
      fresh_dialogue:'Une archive qui grince ? Parfait, je sais écouter les pannes.',
      living_dossier:'Si le dossier monte à bord, je lui facture le billet.',
      white_switch:'Un aiguillage impossible, c’est juste une machine mal interrogée.',
      boiler_witness:'La chaudière ment moins quand on lui donne à manger.',
      shard_hoard:'Quatre éclats ? Ça ressemble à une facture déguisée.',
      clean_chain:'Deux victoires de suite : le moteur commence à me croire.'
    },
    rinka: {
      fresh_dialogue:'Qu’ils parlent enfin. Je préfère les reproches qui saignent.',
      living_dossier:'Un dossier vivant ? Qu’il monte, je lui garde une place.',
      white_switch:'Un fil blanc dans un duel, c’est une ligne à couper.',
      boiler_witness:'La cendre témoigne mieux quand elle brûle encore.',
      shard_hoard:'Quatre éclats suffisent pour provoquer un dieu radin.',
      clean_chain:'Deux stations ? Trop peu. Mais c’est un début honnête.'
    },
    eir: {
      fresh_dialogue:'Une phrase manquante est un symptôme, pas un oubli.',
      living_dossier:'Les preuves vivantes respirent souvent par la plaie.',
      white_switch:'Le Fil blanc ressemble à une cicatrice qui refuse de fermer.',
      boiler_witness:'La chaudière tousse. Cette fois, je note le rythme.',
      shard_hoard:'Les éclats indiquent où la nuit se fracture le plus.',
      clean_chain:'Deux stations stables : le diagnostic gagne une marge.'
    },
    kaguya: {
      fresh_dialogue:'Les astres aussi cachent des lignes dans leurs procès.',
      living_dossier:'Une preuve mobile contredit la géométrie du Tribunal.',
      white_switch:'Le Fil blanc dessine une orbite que je n’ai pas autorisée.',
      boiler_witness:'Même une chaudière peut devenir constellation si elle insiste.',
      shard_hoard:'Quatre éclats : une petite couronne brisée en preuves.',
      clean_chain:'Deux stations alignées. La nuit retrouve presque une orbite.'
    },
    vespera: {
      fresh_dialogue:'Les phrases manquantes savent toujours qui les a détrônées.',
      living_dossier:'Un dossier vivant ? Qu’il apprenne à survivre au palais.',
      white_switch:'Le Fil blanc ferait une jolie laisse. Je le préfère rompu.',
      boiler_witness:'La chaudière garde une noblesse que le ciel a perdue.',
      shard_hoard:'Quatre éclats peuvent encore ressembler à une lune.',
      clean_chain:'Deux stations sans plier : voilà une rébellion polie.'
    }
  };
  const DEFAULT_PROFILE = {
    attempts: 0, clears: 0, hunterWins: 0, truths: [], endings: [], memories: [], constellations: [], dialogueArchive: [], dialogueRewards: [], relationshipMemories: [], secretThreads: [], routeSecrets: [], secretVerdicts: [], secretThreadHints: [], resolvedMurmurs: [],
    unlockedGuardians: ['controleur','mecano'], unlockedSpellCards: [], unlockedAwakenings: [], characterClears: {}, starterOverrides: {}, ritualGachaHistory: [], ritualPity: 0, gachaUnlockedCards: [],
    seenCardTypeTutorials: [], pendingCardTypeTutorials: [], cardTutorialScopeVersion: 'deck-v2',
    unlockedCards: ['moon_hare','paper_crane','shrine_fox','bell_toad','lantern_moth','ink_tanuki','clock_harpy','cloud_oni','porcelain_golem','star_kappa','wisp_scribe','rail_cat','thorn_oracle','bone_sparrow','skull_mochi','ember_ticket','mirror_mouse','omen_lantern'],
    lifetimeSacrifices: 0, lifetimeStokes: 0, lifetimeHandSacrifices: 0, secretVisits: 0, tutorialSeen: false, nextRunMurmur: null,
    discoveredCards: [], milestones: [], lessons: [], bestStreak: 0, lifetimeTeeth: 0, maxRunDepth: 0, metaRewrites: 0,
    lastOpeningRouteSignature: null
  };
  const SIGILS = {
    airborne: ['↑','Aérien','Ignore un obstacle sans Vigie.'], reach: ['⌁','Vigie','Intercepte les unités aériennes.'],
    thorns: ['✦','Réplique','Inflige 1 dégât à son attaquant.'], brittle: ['◇','Usage unique','Quitte le wagon après avoir agi.'],
    fecund: ['∞','Duplicateur','Ajoute une copie temporaire à la main.'], deathless: ['↺','Rappel','Revient dans votre main après sa destruction.'],
    many_lived: ['♨','Recyclage','Une carte chauffée retourne dans la pioche.'], bifurcated: ['⋔','Aiguillage','Agit sur les deux wagons voisins.'],
    bone_digger: ['✹','Dynamo','Fournit +1 Lueur au prochain départ.'], sprinter: ['→','Correspondance','Change de wagon après son action.'],
    guardian: ['♢','Renfort','Gagne 1 vie lorsqu’un ennemi arrive en face.'],
    pyre: ['♨','Brasier','Chauffée ou sacrifiée, ajoute +1 Progression.'],
    hoard: ['▣','Surplus','Gagne +1 Puissance si votre main est presque pleine.'],
    omen_break: ['◉','Contre-signe','À l’arrivée, réduit la Poursuite de 1.'],
    destiny: ['✧','Destin','Quand cette carte est piochée, elle révèle un petit effet immédiat.'],
    echo: ['↯','Écho','Si elle est défaussée non jouée au départ, +1 Lueur au prochain tour.']
  };
  const CARD_TYPE_TUTORIALS = {
    zero_cost: { icon:'✦0', title:'Cartes gratuites', text:'Certaines cartes coûtent 0 Lueur. Elles servent à occuper une voie, déclencher un combo ou préparer un sacrifice sans ralentir votre tour.' },
    zero_attack: { icon:'0⚔', title:'Cartes sans attaque', text:'Une carte à 0 Puissance n’est pas inutile : elle bloque, protège, déclenche des sigils ou achète le tour qui manque à votre deck.' },
    zero_health: { icon:'0♥', title:'Cartes sans défense', text:'Une carte à 0 Vie agit comme un effet instantané ou un leurre fragile. Elle peut déclencher son arrivée, puis disparaître aussitôt.' },
    zero_trinity: { icon:'0/0/0', title:'Cartes rituelles vides', text:'Les cartes 0/0/0 ne gagnent jamais par leurs stats. Elles existent pour les synergies : Destin, Brasier, Poursuite, main pleine et chaudière.' },
    bones: { icon:'✹', title:'Cartes de Cendres', text:'Les cartes de Cendres ne dépensent pas de Lueur. Chauffez ou perdez des passagers pour produire des Cendres, puis payez leur coût ✹.' },
    signature: { icon:'☾', title:'Spell Cards personnelles', text:'Une Spell Card est liée à une conductrice. Elle raconte son style de jeu et pousse son deck vers une stratégie plus identifiable.' },
    last_word: { icon:'✺', title:'Last Words', text:'Un Last Word est une seconde Spell Card très rare. Son effet visible est écrit, mais un effet secret reste caché jusqu’à ce que vous le déclenchiez.' },
    uncommon: { icon:'◇', title:'Cartes peu communes', text:'Les cartes peu communes commencent à orienter un deck. Elles restent simples à jouer, mais annoncent déjà un plan plus marqué que les cartes ordinaires.' },
    rare: { icon:'◆', title:'Cartes rares', text:'Les rares changent le plan d’une run. Elles sont plus puissantes, mais demandent souvent un deck déjà orienté.' },
    secret: { icon:'?', title:'Cartes secrètes', text:'Les cartes secrètes ne sont pas de simples upgrades : elles ouvrent des stratégies, indices ou fins que le jeu ne dévoile pas tout de suite.' },
    unique: { icon:'◇', title:'Cartes uniques', text:'Une carte unique ne se collectionne pas en doublon. Si vous la trouvez, c’est un nouveau morceau permanent du jeu qui s’ouvre.' }
  };
  const PATH_NODES = [
    { id:'battle', icon:'⚔', name:'Incident de voie', type:'combat', desc:'Affrontez un cortège mineur. La victoire donne une carte et un présage.' },
    { id:'bell_patrol', icon:'♬', name:'Patrouille des cloches', type:'combat', desc:'Une patrouille rapide verrouille les wagons. La victoire donne une carte et un présage.' },
    { id:'mirror_skirmish', icon:'◇', name:'Escarmouche du miroir', type:'combat', desc:'Des reflets hostiles copient les gestes du convoi. La victoire donne une carte et un présage.' },
    { id:'miniboss', icon:'♜', name:'Prévôt du Tribunal', type:'miniboss', desc:'Affrontez un officier renforcé. Combat difficile, 3 éclats et butin de meilleure qualité.' },
    { id:'grove', icon:'♧', name:'Bosquet des noms', type:'reward', desc:'Ajoutez une carte parmi trois propositions adaptées à votre collection.' },
    { id:'altar', icon:'☾', name:'Atelier de l’Aiguille', type:'upgrade', desc:'Réglez un exemplaire une fois : +1 Puissance ou +2 Vie.' },
    { id:'forge', icon:'⚙', name:'Atelier des doublons', type:'forge', desc:'Fusionnez deux exemplaires identiques ; sans doublon, recyclez la halte en éclats.' },
    { id:'moon_spring', icon:'♨', name:'Source de brume', type:'cleanse', desc:'Retirez une contrainte temporaire ; si vous n’en avez aucune, gagnez des éclats.' },
    { id:'mirror_swap', icon:'⇄', name:'Miroir de transmutation', type:'transform', desc:'Remplacez une carte par une carte de coût voisin : le deck ne grossit pas.' },
    { id:'star_oracle', icon:'✧', name:'Oracle des rails', type:'scout', desc:'Révélez la règle et une faiblesse du prochain boss, puis gagnez un Présage stellaire.' },
    { id:'duel_archive', icon:'§', name:'Archives des duels', type:'scout', desc:'Consultez une relation conductrice-boss encore incomplète et gagnez un Présage stellaire.' },
    { id:'moonrail_confessional', icon:'☷', name:'Confessionnal du Moonrail', type:'scout', desc:'Faites progresser une vérité personnelle de la conductrice et gagnez un Présage stellaire.' },
    { id:'living_dossier', icon:'※', name:'Dossier vivant', type:'thread', desc:'Suivez un secret de route : la récompense est une carte liée à cette preuve.' },
    { id:'double_pact', icon:'☍', name:'Pacte à double sceau', type:'pact', desc:'Choisissez un gain puissant et son prix clairement annoncé. Les deux s’appliquent.' },
    { id:'lunar_weather', icon:'☄', name:'Météo lunaire', type:'weather', desc:'Choisissez une règle climatique active pendant les deux prochains combats.' },
    { id:'starter_rewrite', icon:'∞', name:'Bureau du Billet Zéro', type:'meta', desc:'Rare : remplacez définitivement une carte de départ de cette conductrice.' },
    { id:'trader', icon:'♢', name:'Comptoir des éclats', type:'shop', desc:'Dépensez vos éclats ; chaque prix dépend de la puissance réelle de la carte.' },
    { id:'secret', icon:'?', name:'Aiguillage impossible', type:'secret', desc:'Manipulez la route, les ressources ou une piste secrète contre un risque explicite.' }
  ];
  const ROUTE_FAMILIES = Object.freeze({
    combat:{ label:'COMBAT', verb:'Affronter', tone:'danger', summary:'Combat court · carte après victoire' },
    miniboss:{ label:'MINIBOSS', verb:'Défier', tone:'boss', summary:'Combat renforcé · 3 éclats · butin rare' },
    reward:{ label:'RENFORT', verb:'Recruter', tone:'reward', summary:'+1 carte · choix parmi 3' },
    upgrade:{ label:'AMÉLIORATION', verb:'Améliorer', tone:'craft', summary:'1 carte renforcée · deck inchangé' },
    forge:{ label:'FUSION', verb:'Fusionner', tone:'craft', summary:'2 doublons → 1 carte renforcée' },
    cleanse:{ label:'REPOS', verb:'Nettoyer', tone:'safe', summary:'-1 malus · sinon +2 éclats' },
    transform:{ label:'TRANSFORMATION', verb:'Transformer', tone:'craft', summary:'1 carte remplacée · coût voisin' },
    scout:{ label:'OBSERVATION', verb:'Enquêter', tone:'lore', summary:'indice de boss · Présage stellaire' },
    thread:{ label:'SECRET VIVANT', verb:'Suivre', tone:'secret', summary:'preuve de lore · carte liée' },
    pact:{ label:'PACTE', verb:'Signer', tone:'risk', summary:'gain fort + prix explicite' },
    weather:{ label:'CLIMAT', verb:'Préparer', tone:'weather', summary:'règle visible · 2 combats' },
    meta:{ label:'MÉTA RARE', verb:'Graver', tone:'secret', summary:'deck de départ permanent' },
    malus:{ label:'CONTRAINTE', verb:'Accepter', tone:'danger', summary:'malus visible · aucun bonus caché' },
    shop:{ label:'BOUTIQUE', verb:'Acheter', tone:'reward', summary:'prix en éclats selon puissance' },
    secret:{ label:'AIGUILLAGE', verb:'Actionner', tone:'secret', summary:'trajectoire modifiée · risque' },
    hunt:{ label:'BOSS', verb:'Affronter', tone:'boss', summary:'règle spéciale · progression majeure' }
  });
  const ROUTE_ART_INDEX = Object.freeze({
    battle:0, bell_patrol:1, mirror_skirmish:2, miniboss:1, hunt:0,
    grove:3, echo_platform:4, broken_nursery:4,
    altar:5, needle_cache:5, forge:6,
    moon_spring:7, tea_siding:8,
    mirror_swap:9, memory_switch:9,
    star_oracle:10, quiet_siding:10, duel_archive:10, moonrail_confessional:10,
    living_dossier:0, red_string_cabinet:1, thirteenth_luggage_route:2,
    double_pact:11, mirror_pact:14, confessional_ticket:11,
    lunar_weather:12, rain_schedule:12, choir_tunnel:12,
    starter_rewrite:13,
    omen_tax:14, glass_toll:14, silent_carriage:14, sleeping_court:14,
    trader:13, paper_lantern_market:13,
    secret:15
  });
  const LORE_ROUTE_ART_INDEX = Object.freeze({
    secret:2,
    duel_archive:3,
    moonrail_confessional:4,
    broken_nursery:5,
    sleeping_court:6,
    starter_rewrite:7,
    confessional_ticket:9,
    choir_tunnel:15
  });
  const GACHA_TIERS = Object.freeze({
    crépusculaire: {
      label:'Crépusculaire',
      desc:'Récompense de début de progression : aucune unique, aucune signature scellée, aucun personnage.',
      rates:{ common:78, uncommon:20, rare:2, secret:0, unique:0 },
      pity:10, allowSecret:false, allowAwakening:false, allowGuardian:false
    },
    lunaire: {
      label:'Lunaire',
      desc:'La run a dépassé les premiers wagons : les rares deviennent crédibles, les secrets restent exceptionnels.',
      rates:{ common:56, uncommon:31, rare:12, secret:1, unique:0 },
      pity:8, allowSecret:true, allowAwakening:false, allowGuardian:false
    },
    stellaire: {
      label:'Stellaire',
      desc:'Très bonne avancée : certaines signatures scellées peuvent apparaître, mais restent protégées par le hasard.',
      rates:{ common:34, uncommon:36, rare:24, secret:6, unique:0 },
      pity:6, allowSecret:true, allowAwakening:true, allowGuardian:false
    },
    souverain: {
      label:'Souverain',
      desc:'Run profonde : personnages et grands secrets peuvent enfin tomber, sans doublons uniques.',
      rates:{ common:20, uncommon:32, rare:31, secret:14, unique:3 },
      pity:5, allowSecret:true, allowAwakening:true, allowGuardian:true
    }
  });
  const GACHA_RARITY_ORDER = ['common','uncommon','rare','secret','unique'];
  const ENCOUNTERS = [
    { id:'forest_guard', name:'Gardien de la Forêt Inversée', deck:['moon_hare','paper_crane','shrine_fox','lantern_moth'], pressure:1 },
    { id:'bell_procession', name:'Procession des Cloches Muettes', deck:['bell_toad','paper_crane','clock_harpy','wisp_scribe'], pressure:1 },
    { id:'porcelain_nest', name:'Nid de Porcelaine', deck:['porcelain_golem','bone_sparrow','star_kappa','clock_harpy'], pressure:2 },
    { id:'funeral_festival', name:'Festival Funéraire', deck:['skull_mochi','grave_crow','dream_butterfly','cloud_oni'], pressure:2 },
    { id:'mirror_pack', name:'Meute du Miroir Noir', deck:['ink_tanuki','mimic_orb','moon_stag','iron_wolf'], pressure:3 }
  ];
  const MINIBOSS_ENCOUNTERS = [
    { id:'red_lantern_bailiff', name:'Huissier de la Lanterne Rouge', deck:['scarlet_tengu','funeral_tiger','bone_librarian','clock_harpy'], pressure:2, miniboss:true, startPursuit:1 },
    { id:'porcelain_provost', name:'Prévôt de Porcelaine', deck:['porcelain_golem','silver_komainu','grave_tanuki','iron_wolf'], pressure:3, miniboss:true, startPursuit:2 },
    { id:'mirror_magistrate', name:'Magistrate du Miroir Fendu', deck:['mimic_orb','moon_stag','iron_wolf','dream_butterfly'], pressure:4, miniboss:true, startPursuit:2 }
  ];
  const HUNTER_DECKS = {
    controleur:['shrine_fox','thorn_oracle','moon_stag','wisp_scribe','porcelain_golem'],
    mecano:['paper_crane','clock_harpy','furnace_kitsune','porcelain_golem','archive_glutton'],
    rinka:['cloud_oni','rinka_ember','ember_ticket','iron_wolf','lantern_moth'],
    eir:['dream_butterfly','eir_mist','grave_crow','red_thread_doll','omen_lantern'],
    kaguya:['star_kappa','moon_stag','kaguya_astral','eclipse_librarian','sunless_conductor'],
    vespera:['mimic_orb','thorn_oracle','vespera_fallen','dream_butterfly','overfull_mimic']
  };
  const BOSS_DIALOGUES = {
    controleur: {
      before:'Ayame lève son sceau comme si elle bénissait le train. « Si tu mens à l’aube, je dois aussi mentir pour te vaincre. »',
      after:'Son papier sacré se déchire sans bruit. « Alors le Tribunal avait peur de toi pour une vraie raison. »'
    },
    mecano: {
      before:'Kohana pose l’oreille sur le rail. « Cette locomotive tousse comme une lune mal réparée. Laisse-moi ouvrir le capot. »',
      after:'La kitsune rit au milieu des engrenages. « Très bien. Je garde une vis de ce miracle pour plus tard. »'
    },
    rinka: {
      before:'Rinka frappe le quai de son sabre. « Pas de sermons. Trois wagons, une braise, et celle qui recule paie le saké. »',
      after:'La duelliste sourit malgré la suie. « Tu ne fuis pas. Tu choisis juste la route qui fait le plus mal. »'
    },
    eir: {
      before:'Eir souffle une brume pâle sur les vitres. « Le matin est malade. Si je t’arrête, je saurai au moins où il saigne. »',
      after:'La brume hésite avant de se retirer. « Ce n’est pas une fuite. C’est une opération à cœur ouvert. »'
    },
    kaguya: {
      before:'Kaguya incline ses cornes vers le ciel absent. « Les astres reconnaissent ce que tu caches dans la chaudière. Moi aussi. »',
      after:'Des orbites de lumière se brisent autour d’elle. « Garde l’Étincelle. Mais ne la laisse jamais prononcer son nom seule. »'
    },
    vespera: {
      before:'Vespera apparaît dans la vitre avant d’apparaître sur le quai. « Une lune déchue sait reconnaître une voleuse de cycle. »',
      after:'Son reflet reste debout une seconde de trop. « Si tu gagnes encore, même les dieux devront apprendre à perdre. »'
    }
  };
  const BOSS_DIALOGUE_MATRIX = {
    controleur: {
      controleur: { before:['Ayame reconnaît son propre sceau, mais pas la main qui le tient. « Tu es mon serment sans ma pitié. »','L’autre Ayame incline la tête. « Je suis la version que le Tribunal imprime quand tu refuses de rentrer. »'], after:['Ayame replie l’ofuda fissuré. « Alors mon serment peut encore choisir son autel. »','Le double sourit tristement. « C’est pour ce choix qu’ils ont peur de toi. »'] },
      mecano: { before:['Ayame garde la cloche contre son cœur. « Kohana, tes rouages ont toujours entendu les mensonges du ciel avant moi. »','Kohana fait tourner une clé dorée. « Et ton sceau les a toujours appelés prières. On compare nos erreurs ? »'], after:['Ayame laisse un talisman sur le quai. « Répare ce qui peut l’être. Je porterai le reste. »','Kohana le ramasse avec deux doigts. « Tu portes trop. Même pour une sainte de papier. »'] },
      rinka: { before:['Ayame trace un cercle de sel devant la voie. « Rinka, ta colère brûle les indices que j’essaie de lire. »','Rinka rit, sabre bas. « Alors lis vite. Ma braise n’a jamais su attendre les prêtresses. »'], after:['Ayame observe la cendre tourner en spirale. « Ta flamme protège quelqu’un, même quand elle mord. »','Rinka détourne les yeux. « Dis ça encore et je coupe la phrase en deux. »'] },
      eir: { before:['Ayame baisse la voix. « Eir, si l’aube est malade, pourquoi le Tribunal interdit-il le diagnostic ? »','Eir effleure la vitre. « Parce qu’un remède honnête commence par accuser les dieux. »'], after:['Ayame laisse la brume traverser son sceau. « Je prierai moins fort, pour entendre la plaie. »','Eir hoche la tête. « Voilà enfin une prière qui ressemble à un soin. »'] },
      kaguya: { before:['Ayame lève son ofuda vers les astres absents. « Princesse d’orbite, qui a déplacé la lune hors du registre ? »','Kaguya ferme ses ailes. « Celle qui a compris qu’un registre est une cage avec de belles marges. »'], after:['Ayame grave une orbite sur son talisman. « Les marges parlent. Je n’avais jamais osé les lire. »','Kaguya sourit. « Alors le ciel vient de perdre une secrétaire précieuse. »'] },
      vespera: { before:['Ayame serre le sceau du Tribunal jusqu’à se couper. « Vespera, tu portes la faute que tout le monde prononce à demi-mot. »','Vespera apparaît dans le reflet. « Et toi, tu portes le couteau propre qui devait la signer. »'], after:['Ayame essuie le sang du papier sacré. « Le couteau peut encore couper la corde, pas la gorge. »','Vespera laisse un rire tomber dans la vitre. « Voilà une hérésie qui mérite d’être collectionnée. »'] }
    },
    mecano: {
      controleur: { before:['Kohana tape sur le pupitre. « Ayame, si ton sceau grince, c’est qu’on l’a monté à l’envers. »','Ayame ne baisse pas le talisman. « Les prières ne se démontent pas avec une clé anglaise. »'], after:['Kohana range une vis sacrée dans sa manche. « Mauvaise nouvelle : si. Très bonne nouvelle : ça se remonte mieux. »','Ayame murmure. « Alors répare doucement. Certaines prières saignent. »'] },
      mecano: { before:['Kohana fixe son double kitsune. « Oh non. Le Tribunal a copié ma meilleure panne. »','L’autre Kohana sourit toutes dents dehors. « Copiée ? Je suis le prototype qui n’a jamais demandé pardon. »'], after:['Kohana lance une rondelle dans la chaudière. « Le prototype manque d’âme. Et de graisse. »','Le double ricane. « L’âme est une pièce que tu voles à chaque run. »'] },
      rinka: { before:['Kohana ajuste ses lunettes. « Rinka, si tu frappes encore le moteur, je te facture le dieu et le quai. »','Rinka pose son sabre sur l’épaule. « Facture-moi quand tu m’auras rattrapée, renarde. »'], after:['Kohana compte les dents d’engrenage arrachées. « Tu casses vite, mais tu casses juste. Ça m’agace. »','Rinka sourit. « Garde l’agacement. Ça chauffe mieux que ton charbon. »'] },
      eir: { before:['Kohana écoute la brume dans les pistons. « Eir, ta médecine fait caler mes miracles. »','Eir répond sans colère. « Tes miracles toussent parce qu’ils tournent avec une enfant dans le foyer. »'], after:['Kohana baisse la pression d’un cran. « Je peux construire un cœur moins cruel. Donne-moi juste un plan. »','Eir ferme son carnet. « Le plan commence par admettre que la locomotive a peur. »'] },
      kaguya: { before:['Kohana pointe une clé vers le ciel. « Kaguya, tes satellites dérèglent tous mes cadrans. »','Kaguya sourit au-dessus des rails. « Les cadrans mentent quand ils prétendent mesurer le désir d’une étoile. »'], after:['Kohana griffonne une orbite en marge. « D’accord. Pas une panne : une trajectoire vivante. »','Kaguya incline les cornes. « Tu viens d’inventer la mécanique de la désobéissance. »'] },
      vespera: { before:['Kohana tapote la vitre où Vespera apparaît. « Une lune déchue dans le circuit ? J’appelle ça une surcharge royale. »','Vespera rit. « Appelle-moi plutôt le fusible que les dieux ont arraché pour garder le noir. »'], after:['Kohana récupère un éclat de reflet. « Ce fusible peut rallumer plus qu’un phare. »','Vespera répond depuis trois vitres. « Ou brûler le Tribunal jusqu’à l’os. Choisis bien, mécanicienne. »'] }
    },
    rinka: {
      controleur: { before:['Rinka dégaine avant que le sceau ne s’ouvre. « Ayame, si tu veux juger ma route, monte dedans. »','Ayame garde la ligne blanche du regard. « Un jugement sans écoute n’est qu’une exécution polie. »'], after:['Rinka plante son sabre dans le quai. « Tu écoutes mieux quand tu perds. »','Ayame sourit à peine. « Et toi, tu protèges mieux quand tu prétends attaquer. »'] },
      mecano: { before:['Rinka cogne la pointe de sa lame contre le rail. « Kohana, combien de coups avant que ton moteur avoue ? »','Kohana grimace. « Un de moins que le nombre nécessaire pour te faire lire le manuel. »'], after:['Rinka souffle sur sa braise. « Ton moteur tient. Je respecte ça. »','Kohana lève un boulon noirci. « Ton respect a la subtilité d’un incendie criminel. »'] },
      rinka: { before:['Rinka rit face à sa copie. « Enfin quelqu’un qui comprend que parler est une perte de carburant. »','L’autre Rinka embrase son sabre. « Faux. J’aime entendre la peur craquer avant le duel. »'], after:['Rinka essuie sa joue brûlée. « Je ne suis pas ta peur. Je suis ce qui reste après. »','Le double recule dans les étincelles. « Alors brûle assez fort pour nous deux. »'] },
      eir: { before:['Rinka abaisse un peu sa lame. « Eir, tu regardes ma flamme comme une maladie. »','Eir ajuste son masque. « Je la regarde comme une fièvre qui refuse de mourir seule. »'], after:['Rinka détourne la tête. « Si tu soignes ça, il restera quoi de moi ? »','Eir répond doucement. « Quelqu’un qui n’a plus besoin de souffrir pour éclairer. »'] },
      kaguya: { before:['Rinka sourit vers les orbites. « Kaguya, descends. Les étoiles n’ont pas le monopole du feu. »','Kaguya replie une aile. « Le tien brûle vers le haut. C’est pour cela qu’ils veulent l’éteindre. »'], after:['Rinka lève son sabre comme une torche. « Alors je brûlerai les plafonds. »','Kaguya murmure. « Attention : certains plafonds sont des cieux qui supplient. »'] },
      vespera: { before:['Rinka regarde le reflet lunaire sans reculer. « Vespera, tu sens la défaite avant même le premier coup. »','Vespera sourit dans la vitre. « Parce que je connais la saveur des rébellions qui gagnent trop tard. »'], after:['Rinka essuie la buée d’un revers de manche. « Trop tard reste mieux que jamais. »','Vespera laisse une ombre sur le verre. « Tu parles comme une fin qui ne veut pas rester écrite. »'] }
    },
    eir: {
      controleur: { before:['Eir ouvre son carnet. « Ayame, ton sceau accélère le pouls du train. Qui t’a appris à appeler ça justice ? »','Ayame serre les lèvres. « Ceux qui avaient trop peur d’appeler ça peur. »'], after:['Eir note un silence nouveau. « Le symptôme diminue quand tu doutes. »','Ayame baisse le sceau. « Alors le doute est peut-être la première médecine du Tribunal. »'] },
      mecano: { before:['Eir pose la main sur la chaudière. « Kohana, tu as réparé autour de la blessure sans jamais la regarder. »','Kohana se crispe. « Parce que certaines blessures explosent quand on retire le boulon. »'], after:['Eir referme doucement la trappe. « Celle-ci chante quand on lui laisse de l’air. »','Kohana avale sa plaisanterie. « Je construirai une soupape qui ne ressemble pas à une cage. »'] },
      rinka: { before:['Eir traverse la braise sans lever la voix. « Rinka, ce duel est une douleur qui a appris à courir. »','Rinka ricane. « Et toi, une brume qui croit pouvoir attraper le feu. »'], after:['Eir garde un charbon dans une fiole. « Même le feu laisse un échantillon. »','Rinka détourne le regard. « Ne le montre à personne. Surtout pas à moi. »'] },
      eir: { before:['Eir observe son double à travers la brume. « Tu es le diagnostic que j’ai refusé d’écrire. »','L’autre Eir répond sans visage. « Et toi, le remède qui s’attache trop aux patients. »'], after:['Eir ferme le carnet sur une page blanche. « Un remède sans attachement devient une arme. »','Le double s’efface. « Voilà pourquoi ils ne t’ont jamais promue. »'] },
      kaguya: { before:['Eir regarde les constellations déboîtées. « Kaguya, le ciel présente une fracture ancienne. »','Kaguya baisse une orbite lumineuse. « Elle date du jour où l’aube a crié et où personne n’a ausculté. »'], after:['Eir range une poussière d’étoile. « Je peux suivre la fracture jusqu’au Tribunal. »','Kaguya répond. « Suis-la, mais n’oublie pas : une fracture cicatrisée de travers devient une loi. »'] },
      vespera: { before:['Eir reconnaît la pâleur du reflet. « Vespera, tu n’es pas tombée : on t’a retiré la gravité. »','Vespera sourit sans joie. « Enfin quelqu’un diagnostique la chute comme un crime. »'], after:['Eir écrit “lune survivante” au lieu de “lune déchue”. « Les mots aussi soignent. »','Vespera ferme les yeux. « Ou réveillent une douleur qui sait enfin qui accuser. »'] }
    },
    kaguya: {
      controleur: { before:['Kaguya déploie une orbite devant le sceau. « Ayame, les lois célestes ont des marges. Pourquoi les remplis-tu de chaînes ? »','Ayame répond bas. « Parce que les marges vides attirent les dieux affamés. »'], after:['Kaguya efface une marge du ciel. « Alors écrivons-y une fuite. »','Ayame regarde le trou blanc. « Une fuite peut-elle devenir une prière ? »'] },
      mecano: { before:['Kaguya observe les rouages de Kohana. « Renarde, tu transformes les étoiles en pièces détachées. »','Kohana hausse les épaules. « Et toi, tu transformes les pièces détachées en destin. On est quittes. »'], after:['Kaguya ramasse une lune miniature. « Ton bricolage sait surprendre les orbites. »','Kohana sourit. « Les orbites sont juste des rails qui n’ont jamais rencontré ma boîte à outils. »'] },
      rinka: { before:['Kaguya descend d’un cercle de lumière. « Rinka, ta braise appelle le soleil par provocation. »','Rinka fait flamber le quai. « Si le soleil répond, je lui apprends les bonnes manières. »'], after:['Kaguya retient une étincelle entre deux doigts. « Ton feu peut guider l’aube sans la dévorer. »','Rinka ricane. « L’aube n’a qu’à courir vite. »'] },
      eir: { before:['Kaguya tend une aile blessée vers la brume. « Eir, dis-moi si le ciel peut guérir après avoir menti aussi longtemps. »','Eir observe la lumière. « Oui. Mais il devra accepter une cicatrice visible. »'], after:['Kaguya referme son aile. « Les palais détestent les cicatrices. »','Eir range son aiguille. « Les vivants les gardent quand même. »'] },
      kaguya: { before:['Kaguya fait face à son reflet orbital. « Tu es mon palais sans mes fenêtres. »','L’autre Kaguya répond depuis une constellation close. « Et toi, la princesse qui a confondu liberté et chute contrôlée. »'], after:['Kaguya brise une orbite de sa paume. « Une chute contrôlée reste un choix. »','Le double incline les cornes. « Alors choisis plus bas que le ciel ne l’autorise. »'] },
      vespera: { before:['Kaguya fixe la lune déchue. « Vespera, ton absence tire encore sur mes marées. »','Vespera effleure la vitre. « Parce que ton palais a bâti ses jardins sur mon ombre. »'], after:['Kaguya laisse tomber une couronne de lumière. « Je ne savais pas que le jardin était une tombe. »','Vespera répond froidement. « Maintenant tu sais où planter la révolte. »'] }
    },
    vespera: {
      controleur: { before:['Vespera rit devant le sceau d’Ayame. « Tu apportes la serrure à celle qui a mangé la clé. »','Ayame tient bon. « Une clé avalée peut encore blesser de l’intérieur. »'], after:['Vespera touche son flanc comme si la clé tournait. « Tu apprends vite, prêtresse. »','Ayame répond. « Non. Je me souviens lentement. »'] },
      mecano: { before:['Vespera traverse les vitres une à une. « Kohana, tes machines veulent toujours savoir pourquoi je suis tombée. »','Kohana ouvre son coffre d’outils. « Les bonnes machines commencent par accuser la gravité. »'], after:['Vespera sourit au reflet d’une clé. « Accuse plus haut. »','Kohana ferme le coffre. « Je comptais bien démonter le haut. »'] },
      rinka: { before:['Vespera regarde la braise de Rinka. « Ton feu cherche une bannière. Fais attention : les lunes mortes en vendent beaucoup. »','Rinka crache une étincelle. « Je n’achète pas. Je prends. »'], after:['Vespera applaudit sans bruit. « Voilà pourquoi la nuit t’aime : tu ne négocies jamais avec les cages. »','Rinka range sa lame. « Même pas avec les jolies. »'] },
      eir: { before:['Vespera sourit à la brume. « Eir, si tu trouves ma blessure, tu trouveras le premier mensonge du Tribunal. »','Eir répond. « Alors reste immobile une seconde. Les mensonges ont souvent peur du stéthoscope. »'], after:['Vespera laisse un reflet sur la page d’Eir. « Garde-le. Il saignera quand une déesse mentira. »','Eir ferme le carnet. « Je préfère quand les preuves respirent encore. »'] },
      kaguya: { before:['Vespera lève les yeux vers Kaguya. « Princesse, ton orbite était ma cellule dorée. »','Kaguya pâlit. « Je croyais garder le ciel stable. »'], after:['Vespera fissure la lumière du bout des doigts. « La stabilité est le nom poli d’une trahison réussie. »','Kaguya incline la tête. « Alors je dois apprendre des mots moins polis. »'] },
      vespera: { before:['Vespera contemple sa propre ombre couronnée. « Tu es la part de moi qui croit encore mériter l’exil. »','L’autre Vespera sourit avec la lune entière. « Et toi, celle qui confond pardon et conquête. »'], after:['Vespera laisse tomber une couronne de verre. « Je ne veux ni l’un ni l’autre. Je veux la porte. »','Le double disparaît dans la vitre. « Alors vole autre chose que la nuit. »'] }
    }
  };
  const RELATIONSHIP_REPRISES = Object.freeze({
    'controleur|mecano':{
      before:{ controleur:'Ayame ne bénit pas la clé que Kohana lui tend. « Cette fois, dis-moi quelle prière je dois démonter moi-même. »', mecano:'Kohana garde la clé ouverte dans sa paume. « Celle qui appelle obéissance le bruit d’une serrure. Je reste pendant que tu l’ouvres. »' },
      after:{ controleur:'Ayame ramasse une vis et un morceau d’ofuda. « Le sanctuaire tiendra avec les deux, ou il ne mérite pas de tenir. »', mecano:'Kohana noue le papier autour de la vis. « Voilà enfin un plan qui admet ce qu’il protège. »' }
    },
    'controleur|rinka':{
      before:{ controleur:'Ayame efface le cercle de sel devant Rinka. « Je ne te demanderai plus d’éteindre ta colère. Seulement de me dire qui elle garde au chaud. »', rinka:'Rinka baisse sa lame d’un doigt. « Pose la question après le duel. Si je réponds avant, je risque de frapper moins juste. »' },
      after:{ controleur:'Ayame regarde la cendre rester hors du sceau. « Je peux protéger une flamme sans la mettre en reliquaire. »', rinka:'Rinka rengaine lentement. « Et moi, je peux te laisser approcher sans appeler ça une reddition. »' }
    },
    'controleur|eir':{
      before:{ controleur:'Ayame tend son poignet à Eir. « Le sceau accélère encore quand Amahina parle. Mesure-moi avant que je transforme la peur en devoir. »', eir:'Eir prend le pouls sans douceur inutile. « D’accord. Mais tu écouteras le diagnostic même s’il innocente ce que tu voulais condamner. »' },
      after:{ controleur:'Ayame déchire la prescription qui ordonnait le silence. « Une prière peut reconnaître qu’elle était un symptôme. »', eir:'Eir conserve seulement la moitié blanche de la feuille. « Alors elle peut commencer à devenir un soin. »' }
    },
    'controleur|kaguya':{
      before:{ controleur:'Ayame montre à Kaguya une marge sans sceau. « J’ai trouvé l’endroit où ton orbite quitte le registre. Est-ce une erreur ou une porte ? »', kaguya:'Kaguya replie ses ailes pour regarder de près. « Une porte, si tu acceptes de ne pas inscrire ce qu’il y a derrière. »' },
      after:{ controleur:'Ayame laisse la marge vide. « Le Tribunal ne saura pas quel nom poursuivre. »', kaguya:'Kaguya trace autour un ciel sans centre. « Et pour une fois, l’absence sera une protection plutôt qu’une cage. »' }
    },
    'controleur|vespera':{
      before:{ controleur:'Ayame pose le couteau propre entre elles. « Je sais désormais ce qu’il a signé. Je ne te demanderai pas de pardonner la main. »', vespera:'Vespera touche le manche sans le prendre. « Alors utilise-la pour ouvrir quelque chose, pas pour rendre ta culpabilité élégante. »' },
      after:{ controleur:'Ayame coupe le ruban du verdict et laisse la lame au sol. « Le geste peut finir avant de devenir une absolution. »', vespera:'Vespera franchit la coupure. « Bien. Les portes ont davantage besoin de précision que les gorges. »' }
    },
    'mecano|rinka':{
      before:{ mecano:'Kohana dessine une marque rouge sur la chaudière. « Tu peux frapper partout sauf ici. Ce n’est pas une règle : c’est l’endroit où elle a peur. »', rinka:'Rinka pose deux doigts sur la marque. « Je n’ai jamais eu besoin d’un manuel pour reconnaître un cœur. Juste qu’on me le montre. »' },
      after:{ mecano:'Kohana constate que la marque est intacte. « Tu as donc lu le schéma. »', rinka:'Rinka souffle sur sa lame. « Non. J’ai entendu la machine reculer. C’était plus clair. »' }
    },
    'mecano|eir':{
      before:{ mecano:'Kohana ouvre la plaque du foyer devant Eir. « J’ai retiré trois sécurités. Pas pour aller plus vite : pour qu’elle puisse dire non. »', eir:'Eir écoute la chaudière respirer. « Alors remets-en une quatrième : celle qui t’empêche de décider à sa place. »' },
      after:{ mecano:'Kohana laisse un emplacement vide dans le mécanisme. « Cette pièce appartient à Amahina. Je ne la fabriquerai pas sans elle. »', eir:'Eir referme son carnet. « C’est la première absence de ton moteur qui ressemble à de la santé. »' }
    },
    'mecano|kaguya':{
      before:{ mecano:'Kohana pose l’astrolabe sur une caisse à outils. « Tes étoiles tournent mieux depuis qu’elles ont admis avoir des boulons. »', kaguya:'Kaguya corrige une orbite à la craie. « Et tes boulons depuis qu’ils ont admis désirer une direction. »' },
      after:{ mecano:'Kohana laisse l’astrolabe volontairement imprécis. « Un degré de jeu. Pour qu’une étoile puisse changer d’avis. »', kaguya:'Kaguya fait dévier une lune miniature. « C’est peu. C’est aussi la première liberté mesurable. »' }
    },
    'mecano|vespera':{
      before:{ mecano:'Kohana tient un fusible noir devant le reflet. « J’ai compris pourquoi le Tribunal t’a arrachée du circuit : tu empêchais la nuit de rester rentable. »', vespera:'Vespera sourit sans vanité. « Ne me transforme pas en pièce héroïque. J’ai aussi aimé tenir l’interrupteur. »' },
      after:{ mecano:'Kohana range le fusible au lieu de l’installer. « Alors personne ne possédera seule le prochain courant. »', vespera:'Vespera efface sa couronne dans le verre. « Voilà une machine assez insolente pour survivre à sa mécanicienne. »' }
    },
    'rinka|eir':{
      before:{ rinka:'Rinka ouvre sa paume brûlée. « Elle chauffe avant que je mente. Tu peux regarder, pas prescrire. »', eir:'Eir ne sort pas l’aiguille. « Je compterai les battements. Le choix de ralentir restera le tien. »' },
      after:{ rinka:'Rinka referme la main sans étouffer la braise. « Elle ne criait pas. Elle demandait de l’air. »', eir:'Eir sourit à peine. « Tu vois ? Un diagnostic n’est pas toujours une condamnation. »' }
    },
    'rinka|kaguya':{
      before:{ rinka:'Rinka pointe le sabre vers le plafond du ciel. « Indique-moi seulement lequel porte le poids. Les autres, je les laisse tranquilles. »', kaguya:'Kaguya déplace une étoile. « Celui-ci. Mais frappe pour ouvrir, pas pour prouver que tu peux détruire. »' },
      after:{ rinka:'Rinka contemple la brèche sans l’élargir. « Une ouverture suffit. Je déteste quand tu as raison avec élégance. »', kaguya:'Kaguya passe la première sous le plafond fissuré. « Je déteste avoir eu besoin de ton manque d’élégance. »' }
    },
    'rinka|vespera':{
      before:{ rinka:'Rinka refuse la bannière que Vespera déroule. « Je combats avec toi. Pas sous ta lune. »', vespera:'Vespera replie le tissu sans sourire. « C’est précisément la réponse que mon ancienne cour interdisait. »' },
      after:{ rinka:'Rinka plante la bannière à l’envers dans le quai. « Elle indique une sortie, pas un royaume. »', vespera:'Vespera regarde le tissu brûler par le bas. « Alors peut-être que cette rébellion arrivera assez tôt. »' }
    },
    'eir|kaguya':{
      before:{ eir:'Eir montre à Kaguya le tracé d’une cicatrice céleste. « Elle ne suit aucune orbite. C’est peut-être pour cela qu’elle guérit. »', kaguya:'Kaguya renonce à corriger la courbe. « Mon palais aurait appelé cela une erreur. Je commence à préférer les erreurs vivantes. »' },
      after:{ eir:'Eir ajoute la cicatrice au schéma sans légende. « Le prochain médecin devra demander avant de la lisser. »', kaguya:'Kaguya scelle le compas. « Et la prochaine princesse avant d’appeler stabilité ce qu’elle immobilise. »' }
    },
    'eir|vespera':{
      before:{ eir:'Eir pose une lame de verre sous le reflet de Vespera. « Cette fois, je ne prélève rien. Dis-moi seulement où le mensonge fait encore mal. »', vespera:'Vespera indique sa couronne absente. « Ici. Mais la douleur n’est pas une invitation à me remettre sur le trône. »' },
      after:{ eir:'Eir brise la lame de prélèvement. « La preuve restera vivante et donc libre de me contredire. »', vespera:'Vespera laisse son reflet quitter la vitre. « Enfin un dossier qui n’appelle pas sa cage une archive. »' }
    },
    'kaguya|vespera':{
      before:{ kaguya:'Kaguya retire sa couronne avant de parler. « Je ne peux pas défaire ton exil. Je peux cesser d’en tirer mon équilibre. »', vespera:'Vespera ne ramasse pas la couronne. « Commence par laisser le ciel vaciller sans demander aux prisonnières de le soutenir. »' },
      after:{ kaguya:'Kaguya regarde ses orbites trembler sans intervenir. « Le palais ne tombe pas. Il apprend seulement qu’il n’est pas le monde. »', vespera:'Vespera ouvre une fenêtre dans la lumière. « Garde cette peur. Elle est plus honnête que tes anciennes excuses. »' }
    }
  });
  const BOSS_DIALOGUE_VARIANTS = [
    { id:'name_vs_vespera', truth:'name', stage:'before', boss:'vespera', playerLine:'{player} entend le vrai nom vibrer dans la chaudière. « Amahina n’est pas ton trophée, Vespera. Ni le leur. »', bossLine:'{boss} cesse de sourire. « Tu as trouvé son nom. Alors tu as aussi trouvé la dette que je refuse de payer. »' },
    { id:'white_route_memory', truth:'white_route', stage:'before', playerLine:'{player} suit du regard un fil blanc invisible aux autres. « La carte a parlé avant ton jugement. »', bossLine:'{boss} baisse la voix. « Alors tu as vu la marge où le Tribunal enterre ses remords. »' },
    { id:'no_blood_mercy', truth:'no_blood', stage:'after', playerLine:'{player} regarde les wagons intacts. « Cette victoire n’a pas eu besoin de sang. C’est donc possible. »', bossLine:'{boss} recule comme si cette douceur était plus dangereuse qu’une lame. « Le Tribunal appelle ça une anomalie. Moi, j’appelle ça une preuve. »' },
    { id:'five_teeth_overflow', truth:'five_teeth', stage:'after', playerLine:'{player} sent le train avancer entre deux secondes. « La voie s’ouvre quand on dépasse l’horaire au lieu de le suivre. »', bossLine:'{boss} serre les dents. « Ne répète pas ça trop fort. Les horloges du ciel mordent les vérités rapides. »' },
    { id:'veteran_hunter_warning', minHunterWins:3, stage:'before', playerLine:'{player} reconnaît maintenant la peur derrière la règle spéciale. « Vous ne venez plus pour arrêter le train. Vous venez vérifier ce que je sais. »', bossLine:'{boss} garde le silence une seconde de trop. « Continue, et tu sauras pourquoi nous tremblons quand l’aube rit. »' },
    { id:'sealed_signature_after', truth:'sealed_signature', stage:'after', playerLine:'{player} entend sa signature gratter sous le billet. « Même mes fins laissent une écriture différente. »', bossLine:'{boss} détourne les yeux. « Les signatures personnelles sont interdites depuis le premier monde raté. »' },
    { id:'three_private_oaths_before', truth:'three_private_oaths', stage:'before', playerLine:'{player} voit trois serments se recoudre sous les rails. « Vous nous avez séparées parce qu’ensemble nous formions une phrase. »', bossLine:'{boss} répond trop vite. « Une phrase peut devenir une arme si quelqu’un apprend à la lire. »' },
    { id:'player_seat_before', truth:'player_seat', stage:'before', playerLine:'{player} regarde le siège vide de l’observatoire dans le reflet du boss. « Il y a quelqu’un d’autre dans cette run. »', bossLine:'{boss} pâlit. « Ne parle jamais au siège chaud. Les dieux ont perdu un monde en lui répondant. »' },
    { id:'dawn_refusal_after', truth:'dawn_refusal', stage:'after', playerLine:'{player} entend Amahina refuser son propre sacrifice. « On ne sauvera pas l’aube contre son consentement. »', bossLine:'{boss} baisse enfin son arme. « Alors vous avez compris la seule loi que le Tribunal ne pouvait pas écrire. »' },
    { id:'twelve_archive_before', truth:'twelve_dialogue_echoes', stage:'before', playerLine:'{player} connaît maintenant douze façons dont le Tribunal ment. « Ce dialogue aussi finira dans le tiroir des excuses. »', bossLine:'{boss} serre sa règle comme une lettre jamais envoyée. « Alors choisis bien ce que tu archives. Certaines phrases mordent encore. »' },
    { id:'archive_room_after', truth:'archive_room_unlocked', stage:'after', playerLine:'{player} entend un tiroir s’ouvrir sous l’observatoire. « La salle classe vos silences mieux que vos défaites. »', bossLine:'{boss} recule sans colère. « Si tu lis tout, tu découvriras que nous avons obéi pour ne pas supplier. »' },
    { id:'first_false_thread_before', truth:'first_false_thread', stage:'before', playerLine:'{player} tient un dossier dont les preuves se contredisent. « Même vos mensonges ont commencé à se corriger entre eux. »', bossLine:'{boss} regarde les fils rouges. « Une fausse piste qui survit à trois lectures n’est plus fausse. Elle devient dangereuse. »' },
    { id:'red_thread_without_knot_before', truth:'red_thread_without_knot_truth', stage:'before', playerLine:'{player} remarque le fil rouge qui ne s’attache à personne. « Vous n’avez pas coupé nos liens. Vous avez empêché qu’ils se nouent. »', bossLine:'{boss} répond sans triomphe. « Un lien noué trop tôt aurait étranglé la première révolte. Voilà l’excuse. Pas le pardon. »' },
    { id:'fox_clock_parenthesis_after', truth:'fox_clock_parenthesis_truth', stage:'after', playerLine:'{player} entend une treizième heure rire dans les engrenages. « Le greffier-renard a laissé une marge dans votre verdict. »', bossLine:'{boss} serre les dents. « Cette marge devait rester illisible. Kohana n’était pas censée reconnaître l’écriture. »' },
    { id:'black_manifest_before', truth:'black_ticket_manifest_truth', stage:'before', playerLine:'{player} voit son nom apparaître sur un billet qui n’a jamais été vendu. « Le train m’attendait avant ma première run. »', bossLine:'{boss} baisse la règle spéciale. « Le Moonrail ne choisit pas ses sauveurs. Il collectionne ceux qui reviennent malgré l’incompréhension. »' },
    { id:'three_threads_after', truth:'three_false_threads', stage:'after', playerLine:'{player} referme trois dossiers incompatibles. « Trois mensonges ont formé une seule carte. »', bossLine:'{boss} laisse tomber son alibi. « Alors tu sais maintenant que le Tribunal n’a pas falsifié l’histoire une fois, mais après chaque fin. »' },
    { id:'memory_paper_copper_before', memory:'paper_copper_afterplatform', player:'controleur', boss:'mecano', stage:'before', playerLine:'Ayame ne lève pas son sceau. « Kohana, cette fois je ne viens pas vérifier les clous. Je viens vérifier la serrure. »', bossLine:'Kohana sourit moins fort que d’habitude. « Enfin. La serrure criait ton nom depuis trois cycles. »' },
    { id:'memory_afterfever_after', memory:'afterfever_diagnosis', player:'rinka', boss:'eir', stage:'after', playerLine:'Rinka garde sa braise fermée. « Tu peux regarder. Mais tu ne l’éteins pas. »', bossLine:'Eir range son carnet. « Alors je noterai seulement quand elle te demande de l’aide. »' },
    { id:'memory_orbit_apology_before', memory:'orbit_apology', player:'kaguya', boss:'vespera', stage:'before', playerLine:'Kaguya baisse les yeux. « Je ne te demanderai pas de trouver ma peur belle. »', bossLine:'Vespera répond sans sourire. « Bien. Une prison polie reste une prison. Continue. »' },
    { id:'memory_clean_knife_after', memory:'clean_knife_mercy', player:'controleur', boss:'vespera', stage:'after', playerLine:'Ayame essuie le couteau sans le cacher. « Il a coupé une corde, pas une gorge. »', bossLine:'Vespera effleure la lame. « Alors il vient d’apprendre une hérésie rare. »' },
    { id:'memory_gear_orbit_before', memory:'gear_orbit_blueprint', player:'mecano', boss:'kaguya', stage:'before', playerLine:'Kohana déplie un plan couvert d’orbites et de boulons. « Je crois que ton ciel a besoin d’une clé de douze. »', bossLine:'Kaguya rit doucement. « Et ta clé vient de demander la permission aux étoiles. Progrès inquiétant. »' },
    { id:'memory_manual_fire_after', memory:'manual_fire_clause', player:'rinka', boss:'mecano', stage:'after', playerLine:'Rinka pointe le manuel du sabre. « J’ai pas lu. J’ai suivi la ligne qui disait de ne pas frapper le cœur. »', bossLine:'Kohana cache son sourire. « C’était la seule phrase importante. Évidemment tu l’as trouvée. »' },
    { id:'memory_ash_prayer_before', memory:'ash_prayer_truce', pair:['controleur','rinka'], stage:'before', lines:{ controleur:'Ayame ouvre sa paume au-dessus de la cendre. « Je ne bénirai pas ta flamme. Je peux en revanche lui demander qui elle protège. »', rinka:'Rinka laisse la braise répondre avant elle. « C’est déjà plus honnête que de l’appeler impure. »' } },
    { id:'memory_prayer_diagnosis_before', memory:'diagnosis_of_prayer', pair:['controleur','eir'], stage:'before', lines:{ controleur:'Ayame a écrit peur sous son propre sceau. « Le mot reste lisible. C’est donc qu’il fait partie du rituel. »', eir:'Eir vérifie le pouls du papier. « Oui. Et cette fois, nous ne le traiterons pas par le silence. »' } },
    { id:'memory_margin_orbit_after', memory:'margin_orbit_liturgy', pair:['controleur','kaguya'], stage:'after', lines:{ controleur:'Ayame garde la marge blanche au lieu de la remplir. « Une absence peut être consacrée sans être possédée. »', kaguya:'Kaguya dévie l’orbite autour du vide. « Alors ce sanctuaire possède enfin une sortie. »' } },
    { id:'memory_engine_heart_before', memory:'engine_heart_chart', pair:['mecano','eir'], stage:'before', lines:{ mecano:'Kohana montre la valve neuve. « Elle peut me couper le moteur si elle refuse le départ. »', eir:'Eir écoute le mécanisme. « Parfait. Une machine capable de dire non vient peut-être de devenir une patiente. »' } },
    { id:'memory_royal_fuse_after', memory:'royal_fuse_test', pair:['mecano','vespera'], stage:'after', lines:{ mecano:'Kohana retire le fusible avant qu’il ne devienne un trône. « Le circuit survivra sans propriétaire unique. »', vespera:'Vespera observe le noir revenir par choix. « Alors ta panne vient de réussir là où mon règne a échoué. »' } },
    { id:'memory_ceiling_sun_before', memory:'ceiling_sun_compact', pair:['rinka','kaguya'], stage:'before', lines:{ rinka:'Rinka désigne une seule poutre du ciel. « Celle-là porte la cage. Je laisse les étoiles tranquilles. »', kaguya:'Kaguya déplace ses constellations hors de la frappe. « Et moi, je cesse de protéger la poutre parce qu’elle se trouve au-dessus de nous. »' } },
    { id:'memory_late_banner_after', memory:'late_rebellion_banner', pair:['rinka','vespera'], stage:'after', lines:{ rinka:'Rinka rend la bannière sans s’agenouiller. « On a gagné ensemble. Ça ne fait de toi ni ma reine ni ma dette. »', vespera:'Vespera la laisse tomber. « Non. Cela fait de moi quelqu’un qui doit apprendre à partager même la victoire. »' } },
    { id:'memory_scarred_sky_before', memory:'scarred_sky_protocol', pair:['eir','kaguya'], stage:'before', lines:{ eir:'Eir entoure la cicatrice sans la corriger. « Le protocole exige désormais une question avant le compas. »', kaguya:'Kaguya ferme l’instrument. « Le ciel répond qu’il préfère sa courbe à mon ancienne perfection. »' } },
    { id:'memory_living_reflection_after', memory:'living_reflection_sample', pair:['eir','vespera'], stage:'after', lines:{ eir:'Eir ouvre le flacon et n’essaie pas de rappeler le reflet. « Une preuve vivante doit pouvoir quitter le dossier. »', vespera:'Vespera disparaît du verre sans l’emporter. « Et revenir seulement quand le mensonge mérite un témoin. »' } }
  ];
  const ENDINGS = {
    false_dawn: { title:'FIN I · L’AUBE DE PAPIER', text:'Le train atteint l’est. Le soleil se lève, trop plat, trop blanc. Dans la vitre, Ayame voit la nuit continuer derrière le décor.' },
    revolt: { title:'FIN II · LE PROCÈS DES REFLETS', text:'L’Étincelle prononce enfin son nom. Les dieux ne chassaient pas une voleuse : ils poursuivaient leur propre aube en fuite.' },
    true_dawn: { title:'FIN III · LE MATIN QUI CHOISIT', text:'Vous refusez le Tribunal et brisez l’horloge du ciel. Pour la première fois, l’aube arrive parce qu’elle le veut.' }
  };
  const MILESTONES = [
    { id:'first_night', name:'Monter dans le train', text:'Commencer une tentative.', reward:'grave_crow', check:p => p.attempts >= 1 },
    { id:'three_nights', name:'Une habitude inquiétante', text:'Commencer 3 tentatives.', reward:'iron_wolf', check:p => p.attempts >= 3 },
    { id:'seven_nights', name:'Sept nuits sans matin', text:'Commencer 7 tentatives.', reward:'furnace_kitsune', check:p => p.attempts >= 7 },
    { id:'twelve_nights', name:'La cloche vous reconnaît', text:'Commencer 12 tentatives.', reward:'archive_glutton', check:p => p.attempts >= 12 },
    { id:'ten_stokes', name:'La chaudière connaît votre main', text:'Chauffer 10 cartes.', reward:'dream_butterfly', check:p => p.lifetimeStokes >= 10 },
    { id:'thirty_stokes', name:'Feu sous la peau', text:'Chauffer 30 cartes.', reward:'red_thread_doll', check:p => p.lifetimeStokes >= 30 },
    { id:'hand_sacrifices', name:'Main allégée', text:'Sacrifier 12 cartes par surcharge de main.', reward:'overfull_mimic', check:p => p.lifetimeHandSacrifices >= 12 },
    { id:'first_hunter', name:'Un dieu peut tomber', text:'Vaincre un dieu chasseur.', reward:'moon_stag', check:p => p.hunterWins >= 1 },
    { id:'three_hunters', name:'Ils apprennent votre nom', text:'Vaincre 3 dieux chasseurs.', reward:'mimic_orb', check:p => p.hunterWins >= 3 },
    { id:'six_hunters', name:'Tribunal fissuré', text:'Vaincre 6 dieux chasseurs au total.', reward:'eclipse_librarian', check:p => p.hunterWins >= 6 },
    { id:'twelve_hunters', name:'Fauteuils vides', text:'Vaincre 12 dieux chasseurs au total.', reward:'sunless_conductor', check:p => p.hunterWins >= 12 },
    { id:'first_dawn', name:'Le soleil de papier', text:'Atteindre une première aube.', reward:'rinka_ember', check:p => p.clears >= 1 },
    { id:'second_dawn', name:'Refuser la première fin', text:'Atteindre deux aubes.', reward:'eir_mist', check:p => p.clears >= 2 },
    { id:'third_dawn_mastery', name:'Troisième matin menteur', text:'Atteindre trois aubes.', reward:'kaguya_astral', check:p => p.clears >= 3 },
    { id:'first_spell_clear', name:'Une signature gravée', text:'Finir une progression avec au moins une conductrice.', reward:'dawn_spark', check:p => Object.values(p.characterClears || {}).some(value => value >= 1) },
    { id:'two_spell_clears', name:'Deux volontés, deux fins', text:'Finir une progression avec deux conductrices différentes.', reward:'centipede_train', check:p => Object.values(p.characterClears || {}).filter(value => value >= 1).length >= 2 },
    { id:'truth_seeker', name:'Cartographe des mensonges', text:'Découvrir 8 vérités.', reward:'eclipse_librarian', check:p => p.truths.length >= 8 },
    { id:'deep_truths', name:'Sous la carte sous la carte', text:'Découvrir 16 vérités.', reward:'sunless_conductor', check:p => p.truths.length >= 16 },
    { id:'collector', name:'Bestiaire nocturne', text:'Observer 20 créatures différentes.', reward:'kaguya_astral', check:p => p.discoveredCards.filter(id => cardMap[id]?.rarity !== 'offering').length >= 20 },
    { id:'deep_collector', name:'Album impossible', text:'Observer 60 cartes différentes.', reward:'vespera_fallen', check:p => p.discoveredCards.filter(id => cardMap[id]?.rarity !== 'offering').length >= 60 },
    { id:'teeth_wallet', name:'Bourse de voie', text:'Gagner 35 éclats au total.', reward:'mimic_orb', check:p => (p.lifetimeTeeth || 0) >= 35 },
    { id:'long_run', name:'Plus loin que le plan', text:'Atteindre une profondeur de run de 12 arrêts.', reward:'moon_stag', check:p => (p.maxRunDepth || 0) >= 12 },
    { id:'rewritten_ticket', name:'Billet retouché', text:'Réécrire une carte de deck de départ.', reward:'dawn_spark', check:p => (p.metaRewrites || 0) >= 1 }
  ];
  const SALVAGE_LESSONS = [
    { id:'light_axle', name:'Essieu de lumière', text:'Débloque un passager mobile pour les prochaines runs.', reward:'moon_hare' },
    { id:'night_schedule', name:'Horaire nocturne', text:'Débloque un passager qui prépare la Lueur suivante.', reward:'wisp_scribe' },
    { id:'mist_brake', name:'Frein de brume', text:'Débloque un défenseur capable d’intercepter les airs.', reward:'bell_toad' },
    { id:'porcelain_coupler', name:'Attelage de porcelaine', text:'Débloque un gardien très résistant.', reward:'porcelain_golem' },
    { id:'echo_whistle', name:'Sifflet d’écho', text:'Débloque un passager qui revient après sa destruction.', reward:'dream_butterfly' },
    { id:'double_switch', name:'Double aiguillage', text:'Débloque une carte agissant sur deux wagons.', reward:'moon_stag' }
  ];
  const PLANNED_GUARDIANS = [
    ['Suzuha Emberwing','Tengu','tempo aérien et esquives'],['Mirei Deepbell','Sirène','contrôle sonore des voies'],['Nox Amaranthe','Vampire','PV contre puissance'],
    ['Tama Gearheart','Tanuki automate','copies instables'],['Yori Mossback','Kappa','barrières et bulles'],['Hina Snowtail','Kitsune polaire','gel du prochain départ'],
    ['Kaede Stormhoof','Kirin','impacts multiples'],['Momo Candycloud','Esprit mochi','invocations nombreuses'],['Ibara Thornmoon','Dryade','ripostes et épines'],
    ['Reika Voidscale','Dragonne du vide','cartes bannies'],['Fuu Paperwing','Tsukumogami','talismans à coût nul'],['Chiyo Brassbell','Oni musicienne','rythme des wagons'],
    ['Lune-7','Automate céleste','programmation de pioche'],['Astra Noctiluca','Fée abyssale','Lueur différée'],['Kuroe Mirrorpaw','Bakeneko','vol de capacités'],
    ['Shion Dreamveil','Baku','cauchemars utiles'],['Nao Sunshard','Phénix','destruction et retour'],['Tsuyu Palehorn','Yōkai cerf','déplacement entre wagons']
  ].map(([name, species, archetype], index) => ({ id:`planned-guardian-${index + 1}`, name, species, archetype }));
  const IMPLEMENTED_MECHANICS = [
    ['Météo lunaire','route jouable : deux combats sous climat spécial, avec effet visible en combat'],
    ['Pactes doubles','route jouable : trois pactes cohérents, chacun avec gain immédiat et contrainte assumée'],
    ['Cartes blessure','cartes jouables négatives/mixtes ajoutées au pool, exploitables par Brasier et Surplus'],
    ['Réglage de l’Aiguille','atelier jouable : chaque exemplaire reçoit une seule fois +1 Puissance ou +2 Vie'],
    ['Set bonus tribaux','bonus actif en combat si trois passagers du même peuple occupent les wagons'],
    ['Secrets de deck','vérités débloquées par compositions étranges et routes secrètes'],
    ['Boss spell loot','chaque boss-conductrice peut laisser une technique jouable dans les récompenses rares'],
    ['Cartes destin','cartes à effet au tirage : elles se révèlent au moment où elles entrent en main']
  ].map(([name, text], index) => ({ id:`implemented-mechanic-${index + 1}`, name, text }));

  let cards = [];
  let cardMap = {};
  let story = null;
  let profile = normalizeProfile(load(PROFILE_KEY, DEFAULT_PROFILE));
  let run = load(RUN_KEY, null);
  let pendingGuardian = null;
  let pendingCardZoomAction = null;
  let ritualPointerDrag = null;
  let suppressNextClick = false;
  let routeViewportFocusTimer = null;
  let ritualReady = false;

  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? structuredClone(fallback); }
    catch { return structuredClone(fallback); }
  }

  function normalizeProfile(raw) {
    const result = { ...structuredClone(DEFAULT_PROFILE), ...(raw || {}) };
    for (const key of ['truths','endings','memories','constellations','dialogueArchive','dialogueRewards','relationshipMemories','secretThreads','routeSecrets','secretVerdicts','secretThreadHints','resolvedMurmurs','unlockedGuardians','unlockedSpellCards','unlockedAwakenings','ritualGachaHistory','unlockedCards','gachaUnlockedCards','seenCardTypeTutorials','pendingCardTypeTutorials','discoveredCards','milestones','lessons']) if (!Array.isArray(result[key])) result[key] = [];
    if (!result.characterClears || Array.isArray(result.characterClears) || typeof result.characterClears !== 'object') result.characterClears = {};
    if (!result.starterOverrides || Array.isArray(result.starterOverrides) || typeof result.starterOverrides !== 'object') result.starterOverrides = {};
    for (const guardian of ['controleur','mecano']) if (!result.unlockedGuardians.includes(guardian)) result.unlockedGuardians.push(guardian);
    for (const guardian of result.unlockedAwakenings) if (!result.unlockedSpellCards.includes(guardian)) result.unlockedSpellCards.push(guardian);
    for (const item of result.ritualGachaHistory || []) {
      const match = String(item.reward || '').match(/^card:(.+)$/);
      if (match && result.unlockedCards.includes(match[1]) && !result.gachaUnlockedCards.includes(match[1])) result.gachaUnlockedCards.push(match[1]);
    }
    if (result.cardTutorialScopeVersion !== 'deck-v2') {
      result.seenCardTypeTutorials = [];
      result.pendingCardTypeTutorials = [];
      result.cardTutorialScopeVersion = 'deck-v2';
    }
    if (result.nextRunMurmur && !RUN_MURMURS.some(murmur => murmur.id === result.nextRunMurmur)) result.nextRunMurmur = null;
    return result;
  }

  const PROGRESSION_SNAPSHOT_BUCKETS = [
    'unlockedCards','unlockedGuardians','unlockedSpellCards','unlockedAwakenings','truths','endings',
    'dialogueRewards','relationshipMemories','secretThreads','routeSecrets','secretVerdicts','constellations',
    'resolvedMurmurs','milestones'
  ];

  function progressionSnapshot() {
    return Object.fromEntries(PROGRESSION_SNAPSHOT_BUCKETS.map(key => [key, [...new Set(profile[key] || [])]]));
  }

  function progressionDiff(before = {}, after = progressionSnapshot()) {
    return Object.fromEntries(PROGRESSION_SNAPSHOT_BUCKETS.map(key => {
      const previous = new Set(before[key] || []);
      return [key, (after[key] || []).filter(id => !previous.has(id))];
    }));
  }

  function persist() {
    if (ritualReady) { refreshGuardianUnlocks(); refreshMilestones(); }
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    if (run) localStorage.setItem(RUN_KEY, JSON.stringify(run)); else localStorage.removeItem(RUN_KEY);
    renderRitualProfile();
  }

  function clearMoonrailStorage() {
    const keys = [];
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key && key.startsWith('moonrail.')) keys.push(key);
    }
    for (const key of keys) localStorage.removeItem(key);
  }

  function refreshGuardianUnlocks() {
    const unlock = id => { if (!profile.unlockedGuardians.includes(id)) profile.unlockedGuardians.push(id); };
    unlock('controleur'); unlock('mecano');
    if (profile.clears >= 2) unlock('rinka');
    if (profile.lifetimeStokes >= 50) unlock('eir');
    if (profile.truths.length >= 10) unlock('kaguya');
  }

  function refreshMilestones() {
    for (const milestone of MILESTONES) {
      if (profile.milestones.includes(milestone.id) || !milestone.check(profile)) continue;
      profile.milestones.push(milestone.id);
      if (milestone.reward && !profile.unlockedCards.includes(milestone.reward)) {
        profile.unlockedCards.push(milestone.reward);
        if (!profile.discoveredCards.includes(milestone.reward)) profile.discoveredCards.push(milestone.reward);
        queueCardTypeTutorial(milestone.reward);
      }
    }
  }

  function ritualRandom() {
    if (!run) return Math.random();
    run.rngState = (Math.imul((run.rngState ?? run.seed) >>> 0, 1664525) + 1013904223) >>> 0;
    return run.rngState / 4294967296;
  }

  function shuffle(list) {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(ritualRandom() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }

  function runMurmurSnapshot() {
    return {
      dialogues: completedDialoguePairs().length,
      routeSecrets: (profile.routeSecrets || []).length,
      secretVisits: run?.secretVisits || 0,
      stokes: profile.lifetimeStokes || 0,
      teeth: run?.teeth || 0,
      streak: run?.streak || 0
    };
  }

  function eligibleRunMurmurs() {
    return RUN_MURMURS.filter(murmur => !murmur.when || murmur.when());
  }

  function createRunMurmur() {
    if (profile.nextRunMurmur && RUN_MURMURS.some(murmur => murmur.id === profile.nextRunMurmur)) {
      const forced = profile.nextRunMurmur;
      profile.nextRunMurmur = null;
      return { id:forced, base:runMurmurSnapshot(), claimed:false };
    }
    const candidates = eligibleRunMurmurs();
    const murmur = candidates[Math.floor(ritualRandom() * candidates.length)] || RUN_MURMURS[0];
    return { id:murmur.id, base:runMurmurSnapshot(), claimed:false };
  }

  function currentRunMurmur() {
    if (!run) return null;
    if (!run.murmur || !RUN_MURMURS.some(item => item.id === run.murmur.id)) run.murmur = createRunMurmur();
    run.murmur.base ||= runMurmurSnapshot();
    return RUN_MURMURS.find(item => item.id === run.murmur.id) || RUN_MURMURS[0];
  }

  function runMurmurProgress() {
    const murmur = currentRunMurmur();
    if (!murmur) return null;
    const progress = murmur.progress(run.murmur.base || {});
    const current = Math.min(progress.goal, Math.max(0, progress.current || 0));
    return { ...progress, current, complete:current >= progress.goal, ratio:progress.goal ? current / progress.goal : 0 };
  }

  function runMurmurReaction(murmurId = currentRunMurmur()?.id, guardianId = run?.guardianId) {
    return RUN_MURMUR_REACTIONS[guardianId]?.[murmurId] || '';
  }

  function resolveRunMurmurReward() {
    const murmur = currentRunMurmur();
    const progress = runMurmurProgress();
    if (!run || !murmur || !progress?.complete || run.murmur.claimed) return;
    run.murmur.claimed = true;
    run.omens++;
    gainTeeth(1, 'murmure de run résolu');
    if (!profile.resolvedMurmurs.includes(murmur.id)) profile.resolvedMurmurs.push(murmur.id);
    if (profile.resolvedMurmurs.length >= RUN_MURMURS.length) markTruthReady('hundred_reflects');
    announceFeedback('secret', 'Murmure accompli', `${murmur.title} · +1 Présage stellaire, +1 éclat.`);
    pulseElement('#ritual-run-murmur', 'gain');
    markTruthReady('moonrail_witness');
  }

  function runMurmurMarkup() {
    const murmur = currentRunMurmur();
    const progress = runMurmurProgress();
    if (!murmur || !progress) return '';
    const state = run.murmur.claimed ? 'claimed' : progress.complete ? 'ready' : 'active';
    const status = run.murmur.claimed ? 'MURMURE RÉSOLU' : progress.complete ? 'PRÊT À S’INSCRIRE' : `${progress.current}/${progress.goal} ${progress.label}`;
    return `<button class="run-murmur-card ${state}" data-action="ritual-run-murmur-detail" type="button">
      <i>${esc(murmur.icon)}</i>
      <div><small>MURMURE</small><strong>${esc(murmur.title)}</strong></div>
      <b class="run-murmur-progress" style="--murmur-progress:${Math.round(progress.ratio * 100)}%"><span></span></b>
      <mark>${esc(status)}</mark>
    </button>`;
  }

  function showRunMurmurDetail() {
    const murmur = currentRunMurmur();
    const progress = runMurmurProgress();
    if (!murmur || !progress) return ritualToast('Aucun murmure ne traverse cette run.');
    const status = run.murmur.claimed ? 'Murmure résolu' : progress.complete ? 'Prêt à s’inscrire' : `${progress.current}/${progress.goal} ${progress.label}`;
    const reaction = runMurmurReaction(murmur.id);
    openRitualModal(`<span class="kicker">MURMURE</span><h2>${esc(murmur.title)}</h2><div class="run-murmur-detail">
      <i>${esc(murmur.icon)}</i>
      <section><small>Ce que la nuit demande</small><p>${esc(murmur.hint)}</p></section>
      ${reaction ? `<section><small>Voix de la conductrice</small><q>${esc(reaction)}</q></section>` : ''}
      <section><small>Avancement</small><strong>${esc(status)}</strong><b class="run-murmur-progress detail" style="--murmur-progress:${Math.round(progress.ratio * 100)}%"><span></span></b></section>
      <section><small>Récompense si accompli</small><p>${esc(murmur.reward)}</p></section>
    </div><div class="modal-actions"><button class="primary-button" data-action="ritual-modal-close">Retour à la carte</button></div>`, 'run-murmur-detail-modal story-modal');
  }

  function renderRitualProfile() {
    $('#ritual-attempts') && ($('#ritual-attempts').textContent = profile.attempts);
    $('#ritual-truths') && ($('#ritual-truths').textContent = `${profile.truths.length}/${truthTotal()}`);
    $('#ritual-clears') && ($('#ritual-clears').textContent = profile.clears);
    $('#deck-count') && ($('#deck-count').textContent = run?.deck?.length || profile.unlockedCards.length);
    $('#hud-tickets') && ($('#hud-tickets').textContent = run ? run.teeth : profile.truths.length);
    $('#hud-act') && ($('#hud-act').textContent = run ? `${run.act + 1}-${run.step + 1}` : `${profile.clears} aubes`);
    $('#hud-omens') && ($('#hud-omens').textContent = run?.omens || 0);
    $('#hud-omens-chip')?.classList.toggle('hidden', !run);
    $('#run-abandon-button')?.classList.toggle('hidden', !run);
  }

  function truthTotal() { return story?.truths?.length || 24; }

  function resetRitualViewportScroll() {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
    const app = $('#app');
    const layer = $('#modal-layer');
    if (app) app.scrollLeft = 0;
    if (layer) layer.scrollLeft = 0;
  }

  function showRitualScreen(id) {
    resetRitualViewportScroll();
    document.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === `screen-${id}`));
    $('#topbar')?.classList.toggle('hidden', id === 'menu');
    renderRitualProfile();
  }

  function openRitualModal(html, extraClass = '') {
    resetRitualViewportScroll();
    const layer = $('#modal-layer');
    layer.innerHTML = `<div class="modal ritual-modal ${extraClass}">${html}</div>`;
    resetRitualViewportScroll();
    layer.classList.add('open');
  }

  function closeRitualModal() {
    const layer = $('#modal-layer');
    layer.classList.remove('open');
    resetRitualViewportScroll();
    setTimeout(() => { if (!layer.classList.contains('open')) { layer.innerHTML = ''; resetRitualViewportScroll(); } }, 220);
    setTimeout(() => { if (!layer.classList.contains('open')) showPendingCardTypeTutorial(); }, 260);
  }

  function ritualToast(message) {
    const toast = $('#toast');
    toast.classList.toggle('battle-toast', $('#screen-ritual-battle')?.classList.contains('active'));
    toast.textContent = message; toast.classList.add('show');
    clearTimeout(ritualToast.timer); ritualToast.timer = setTimeout(() => toast.classList.remove('show'), 2300);
  }

  function feedbackIcon(kind) {
    return ({ gain:'✦', loss:'!', merge:'⇄', upgrade:'◇', gacha:'◈', rule:'※', secret:'✧' })[kind] || '•';
  }

  function announceFeedback(kind, title, text = '', card = null) {
    const layer = $('#feedback-layer');
    if (!layer || !title) return;
    const preview = card ? `<div class="event-card-preview"><i class="event-card-art" style="${cardArtStyle(card)}"></i><div><small>${esc(card.rarity || 'carte')}</small><strong>${esc(card.name || 'Carte')}</strong><span>${esc(card.text || '')}</span></div></div>` : '';
    const item = document.createElement('article');
    item.className = `event-announcement ${esc(kind)}`;
    item.innerHTML = `<i>${feedbackIcon(kind)}</i><div class="event-announcement-copy"><b>${esc(title)}</b><span>${esc(text)}</span></div>${preview}`;
    layer.prepend(item);
    requestAnimationFrame(() => item.classList.add('visible'));
    while (layer.children.length > 4) layer.lastElementChild?.remove();
    setTimeout(() => {
      item.classList.remove('visible');
      setTimeout(() => item.remove(), 260);
    }, 3600);
  }

  function clearFeedback() {
    $('#feedback-layer')?.replaceChildren();
  }

  function pulseElement(selector, tone = 'gain') {
    const element = $(selector);
    if (!element) return;
    element.classList.remove('attention-pulse', 'gain', 'loss');
    void element.offsetWidth;
    element.classList.add('attention-pulse', tone === 'loss' ? 'loss' : 'gain');
    setTimeout(() => element.classList.remove('attention-pulse', 'gain', 'loss'), 920);
  }

  function pulseDeckCounter(tone = 'gain') {
    pulseElement('#deck-count', tone);
  }

  function combatEventIcon(type) {
    return ({
      start:'☾', summon:'✦', stoke:'♨', burn:'◇', attack:'⚔', progress:'➜',
      pursuit:'!', defeat:'✹', draw:'▤', rule:'※', secret:'✧', shield:'◆'
    })[type] || '•';
  }

  function pushCombatEvent(type, title, text = '', lane = null) {
    const battle = run?.battle;
    if (!battle || !title) return;
    battle.timeline ||= [];
    battle.eventSeq = (battle.eventSeq || 0) + 1;
    battle.timeline.unshift({
      id:battle.eventSeq,
      type,
      title:String(title),
      text:String(text || ''),
      lane:Number.isInteger(lane) ? lane : null,
      at:Date.now()
    });
    battle.timeline = battle.timeline.slice(0, 5);
  }

  function combatFeedMarkup(battle) {
    const events = (battle?.timeline || []).slice(0, 4);
    if (!events.length) {
      return `<article class="combat-feed-empty"><i>☾</i><div><b>Journal de combat</b><span>Les invocations, attaques et règles de boss apparaîtront ici.</span></div></article>`;
    }
    return events.map((event, index) => `<article class="combat-feed-item type-${esc(event.type)} ${index === 0 ? 'newest' : ''}">
      <i>${combatEventIcon(event.type)}</i>
      <div><b>${esc(event.title)}</b><span>${esc(event.text)}</span>${Number.isInteger(event.lane) ? `<small>Wagon ${event.lane + 1}</small>` : ''}</div>
    </article>`).join('');
  }

  function gainTeeth(amount, reason = 'Éclats récupérés') {
    if (!run || amount <= 0) return;
    run.teeth += amount;
    profile.lifetimeTeeth = (profile.lifetimeTeeth || 0) + amount;
    run.lastTeethGain = { amount, reason, at: Date.now() };
    pulseElement('#hud-tickets', 'gain');
    ritualToast(`+${amount} éclat${amount > 1 ? 's' : ''} · ${reason}`);
  }

  function guardianPortraitStyle(guardianId) {
    const guardian = GUARDIANS[guardianId];
    if (!guardian) return '';
    const col = guardian.portrait % 3, row = Math.floor(guardian.portrait / 3);
    return `--portrait-x:${col * 50}%;--portrait-y:${row * 100}%;background-image:url('../assets/heroes-moonrail-sheet-v1.png');background-size:300% auto;background-position:var(--portrait-x) var(--portrait-y);background-repeat:no-repeat`;
  }

  function guardianPortraitMarkup(guardianId, className = 'ritual-guardian-art') {
    return `<span class="guardian-portrait ${className}" data-guardian-portrait="${esc(guardianId)}" style="${guardianPortraitStyle(guardianId)}"></span>`;
  }

  function codexDailyPortraitMarkup(guardianId) {
    const guardian = GUARDIANS[guardianId];
    if (!guardian) return '';
    return `<button class="codex-daily-portrait" data-ritual-codex-portrait="${esc(guardianId)}" aria-label="Voir l’artwork de ${esc(guardian.name)} en grand" style="${spriteSheetStyle('codex-daily-life-sheet-v1.png', 3, 2, guardian.portrait)}"><span>Voir l’artwork</span></button>`;
  }

  function guardianLockedHintMarkup(guardianId) {
    const hint = GUARDIAN_UNLOCKS[guardianId]?.hint || 'Une condition de déblocage est cachée dans le lore.';
    const counters = {
      rinka: `fausses aubes vues : ${Number(profile.clears || 0)}/?`,
      eir: `Cartes chauffées : ${Number(profile.lifetimeStokes || 0)}/?`,
      kaguya: `Vérités : ${Number(profile.truths?.length || 0)}/?`
    };
    return `${esc(hint)}${counters[guardianId] ? `<span class="guardian-unlock-counter">${esc(counters[guardianId])}</span>` : ''}`;
  }

  function beginRitual() {
    if (!ritualReady) return ritualToast('Le rituel charge encore ses cartes.');
    const first = profile.attempts === 0;
    openRitualModal(`<span class="kicker">${first ? 'PROLOGUE' : 'UNE AUTRE NUIT'}</span><h2>${first ? 'Le matin n’est pas venu' : 'Le train se souvient de vous'}</h2>
      <p>${first ? esc(story.premise) : 'La voie a changé, les dieux aussi. Une carte porte encore la marque de votre dernière mort.'}</p>
      <div class="story-vow"><small>VOTRE BUT</small><strong>${esc(story.surface_goal)}</strong></div>
      <div class="modal-actions"><button class="primary-button large" data-action="ritual-choose-guardian">Choisir qui conduit <b>→</b></button></div>`, 'story-modal');
  }

  function showGuardianChoice() {
    refreshGuardianUnlocks();
    const options = Object.entries(GUARDIANS).map(([id, guardian]) => {
      const unlocked = profile.unlockedGuardians.includes(id);
      const signature = GUARDIAN_SIGNATURES[id];
      const spellUnlocked = profile.unlockedSpellCards.includes(id);
      const awakened = profile.unlockedAwakenings.includes(id);
      const spell = unlocked ? `${spellUnlocked ? `<span class="guardian-spell"><b>Signature gravée</b>${esc(signature.label)}</span>` : ''}${awakened ? `<span class="guardian-spell lastword"><b>Second nom éveillé</b>${esc(getCard(signature.awakening)?.name || 'Révélé')}</span>` : ''}<span class="guardian-lore">${esc(guardian.voice)}</span>` : '';
      return `<button class="ritual-guardian ${unlocked ? '' : 'locked'}" data-ritual-guardian="${id}" ${unlocked ? '' : 'disabled'}>${guardianPortraitMarkup(id)}<small>${unlocked ? esc(guardian.title) : 'SOUVENIR VERROUILLÉ'}</small><strong>${unlocked ? esc(guardian.name) : '???'}</strong><em>${unlocked ? esc(guardian.perk) : guardianLockedHintMarkup(id)}</em>${spell}</button>`;
    }).join('');
    openRitualModal(`<span class="kicker">QUI GARDE L’ÉTINCELLE ?</span><h2>Choisissez votre conductrice</h2><div class="ritual-guardian-grid">${options}</div><div class="modal-actions"><button class="text-button" data-action="ritual-modal-close">Retour</button></div>`, 'guardian-modal');
  }

  function starterDeckForGuardian(guardianId) {
    const overrides = profile.starterOverrides?.[guardianId] || {};
    const legacyApplied = new Set();
    return (STARTER_POOLS[guardianId] || []).map((id, index) => {
      if (overrides[`slot:${index}`]) return overrides[`slot:${index}`];
      if (overrides[id] && !legacyApplied.has(id)) {
        legacyApplied.add(id);
        return overrides[id];
      }
      return id;
    });
  }

  function guardianDeckForStart(guardianId) {
    const signature = GUARDIAN_SIGNATURES[guardianId] || {};
    return [
      ...(profile.unlockedSpellCards.includes(guardianId) && signature.default ? [signature.default] : []),
      ...starterDeckForGuardian(guardianId),
      ...(profile.unlockedAwakenings.includes(guardianId) && signature.awakening ? [signature.awakening] : [])
    ].filter(Boolean);
  }

  function showGuardianDeckPreview(guardianId) {
    if (!profile.unlockedGuardians.includes(guardianId)) return;
    pendingGuardian = guardianId;
    const guardian = GUARDIANS[guardianId];
    const signature = GUARDIAN_SIGNATURES[guardianId] || {};
    const deck = guardianDeckForStart(guardianId);
    const counts = deck.reduce((acc, id) => ({ ...acc, [id]: (acc[id] || 0) + 1 }), {});
    const spellUnlocked = profile.unlockedSpellCards.includes(guardianId);
    const awakened = profile.unlockedAwakenings.includes(guardianId);
    const spell = spellUnlocked ? getCard(signature.default) : null;
    const awakening = awakened ? getCard(signature.awakening) : null;
    const secretSummaries = [
      spell ? `<span><b>Signature</b> ${esc(spell.name)}</span>` : '',
      awakening ? `<span><b>Second nom</b> ${esc(awakening.name)}</span>` : ''
    ].filter(Boolean).join('');
    const cardsMarkup = Object.entries(counts).map(([id, count]) => {
      const card = getCard(id);
      return card ? `<article class="guardian-deck-card">${ritualCardDisplayMarkup(card)}<b>×${count}</b></article>` : '';
    }).join('');
    openRitualModal(`<div class="guardian-preview-title"><span class="kicker">CONFIRMER LA CONDUCTRICE</span><h2>${esc(guardian.name)}</h2></div>
      <div class="guardian-preview-layout"><aside>${guardianPortraitMarkup(guardianId)}<small>${esc(guardian.title)}</small><strong>${esc(guardian.perk)}</strong><p>${esc(guardian.voice)}</p></aside>
      <section><div class="guardian-preview-toolbar"><div class="guardian-deck-summary"><span><b>${deck.length}</b> cartes de départ</span>${secretSummaries}</div><div class="modal-actions sticky-actions"><button class="secondary-button" data-action="ritual-choose-guardian">Revenir</button><button class="primary-button large" data-action="ritual-confirm-guardian">Lancer la run <b>→</b></button></div></div><div class="ritual-deck-grid guardian-start-deck">${cardsMarkup}</div></section></div>`, 'guardian-preview-modal deck-modal');
  }

  async function startRitual(guardianId) {
    if (!profile.unlockedGuardians.includes(guardianId)) return;
    const seed = Date.now();
    const deck = guardianDeckForStart(guardianId);
    for (const id of deck) if (!profile.discoveredCards.includes(id)) profile.discoveredCards.push(id);
    run = {
      id: `night-${seed}`, seed, rngState: seed >>> 0, guardianId, act: 0, daysLeft: BALANCE.stopsPerControl, step: 0,
      deck, cardMods: {}, teeth: 0, omens: 0, battle: null, pathChoices: [], pendingAfterReward: null, maluses: [], endGachaTaken:false,
      secretVisits: 0, stokes: 0, streak: 0, startedAt: new Date().toISOString()
    };
    run.progressionBaseline = progressionSnapshot();
    run.hunterOrder = shuffle((story?.hunters || []).filter(hunter => hunter.id !== guardianId).map(hunter => hunter.id));
    ensureRunCardStates();
    run.murmur = createRunMurmur();
    profile.attempts++;
    pendingGuardian = null;
    createRouteGraph();
    closeRitualModal();
    persist();
    await showRitualTravelAnimation(-1, 0, {
      label:'Départ du quai zéro',
      text:'Le Moonrail s’arrache à la gare avant que la carte ne consente à se dessiner.'
    });
    startBattle(false, false, true);
    queueCurrentDeckTutorials();
    if (!$('#modal-layer')?.classList.contains('open')) showPendingCardTypeTutorial();
  }

  function availableHunters() {
    const candidates = (story?.hunters || []).filter(hunter => hunter.id !== run?.guardianId);
    if (!Array.isArray(run?.hunterOrder) || !run.hunterOrder.length) return candidates;
    const byId = new Map(candidates.map(hunter => [hunter.id, hunter]));
    return run.hunterOrder.map(id => byId.get(id)).filter(Boolean);
  }

  function hunterForAct() {
    const hunters = availableHunters();
    return hunters[Math.min(run?.act || 0, Math.max(0, hunters.length - 1))] || story.hunters[0];
  }

  function buildPathChoices({ step = run?.step || 0, daysLeft = run?.daysLeft || BALANCE.stopsPerControl, pathBias = null, forceCombat = false } = {}) {
    if (!run) return [];
    const visible = PATH_NODES.filter(node => {
      if (node.type === 'miniboss') return false;
      if (node.id === 'secret') return profile.attempts >= 2;
      if (node.type === 'meta') return profile.attempts >= 3 && step >= 2 && ritualRandom() < .12;
      if (node.type === 'thread') return profile.truths.length >= 6 && step >= 1 && routeSecretCandidates().length;
      return true;
    });
    const byType = type => visible.filter(node => node.type === type);
    const nonCombatTypes = ['reward','upgrade','forge','shop','cleanse','transform','scout','thread','weather','pact','secret','meta'];
    const pickOne = (pool, used) => shuffle(pool).find(node => node && !used.has(node.id));
    const choices = [];
    const used = new Set();
    const addNode = node => {
      if (!node || used.has(node.id) || choices.length >= BALANCE.rewardChoices) return false;
      choices.push(node); used.add(node.id); return true;
    };
    const mustOfferCombat = pathBias === 'noncombat' ? false : forceCombat || step === 0 || daysLeft <= 1;
    const shouldOfferCombat = pathBias === 'noncombat' ? false : mustOfferCombat || ritualRandom() < .7;
    if (shouldOfferCombat) addNode(pickOne(byType('combat'), used));
    if (forceCombat && pathBias !== 'noncombat' && ritualRandom() < .34) addNode(pickOne(byType('combat'), used));
    const shouldOfferSecretSwitch = step > 0 && byType('secret').length && ritualRandom() < (pathBias === 'noncombat' ? .28 : .18);
    if (shouldOfferSecretSwitch) addNode(pickOne(byType('secret'), used));
    const murmurRouteTypes = murmurPreferredRouteTypes().filter(type => pathBias === 'noncombat' ? type !== 'combat' : true);
    if (!run.murmur?.claimed && step > 0 && murmurRouteTypes.length && ritualRandom() < .42) {
      for (const type of murmurRouteTypes) if (addNode(pickOne(byType(type), used))) break;
    }
    const roll = ritualRandom();
    const priorityTypes = pathBias === 'noncombat'
      ? shuffle(['scout','upgrade','reward','shop','cleanse','transform','weather','pact','secret'])
      : roll < .18
      ? ['pact','scout','thread','weather','cleanse','transform']
      : roll < .36
        ? ['pact','weather','shop','transform','scout','thread']
        : roll < .62
          ? ['upgrade','forge','transform','shop','cleanse']
          : ['reward','scout','thread','weather','shop','secret','cleanse'];
    for (const type of priorityTypes) addNode(pickOne(byType(type), used));
    while (choices.length < BALANCE.rewardChoices) {
      const type = nonCombatTypes[Math.floor(ritualRandom() * nonCombatTypes.length)];
      if (!addNode(pickOne(byType(type), used))) break;
    }
    while (choices.length < BALANCE.rewardChoices) addNode(pickOne(visible, used) || pickOne(byType('combat'), used));
    return shuffle(choices).slice(0, BALANCE.rewardChoices);
  }

  function generatePathChoices() {
    if (!run) return;
    const pathBias = run.nextPathBias;
    run.nextPathBias = null;
    run.pathChoices = buildPathChoices({ step:run.step, daysLeft:run.daysLeft, pathBias });
    run.pathPack = run.pathChoices.some(node => node.type === 'combat') && run.pathChoices.some(node => node.type !== 'combat') ? 'mixed' : run.pathChoices[0]?.type || 'bonus';
  }

  function routeGraphUid(act, row, col) {
    return `ligne-${act + 1}-etape-${row + 1}-voie-${col + 1}`;
  }

  function constraintRouteNodes() {
    return shuffle(MALUS_CHOICES).slice(0, 2).map(option => ({
      id:MALUS_ROUTE_IDS[option.id] || `constraint-${option.id}`,
      icon:option.icon,
      name:option.name,
      type:'malus',
      desc:option.text,
      constraintId:option.id
    }));
  }

  function connectRouteRows(current, next, { constraintGate = false, constraintEntryCol = null } = {}) {
    if (!current.length || !next.length) return;
    if (next.length === 1) {
      for (const node of current) node.connections = [next[0].uid];
      return;
    }
    if (current.length === 1) {
      current[0].connections = next.map(node => node.uid);
      return;
    }
    if (constraintGate) {
      const constraints = next.filter(node => node.type === 'malus');
      const safeRoutes = next.filter(node => node.type !== 'malus');
      for (const node of current) {
        node.connections = (node.col === constraintEntryCol ? constraints : safeRoutes).map(target => target.uid);
      }
      return;
    }
    const mirrored = ritualRandom() < .5;
    for (const node of current) {
      const col = mirrored ? current.length - 1 - node.col : node.col;
      const columns = col === 0 ? [0, 1] : col === current.length - 1 ? [1, 2] : ritualRandom() < .5 ? [0, 1] : [1, 2];
      const targets = columns.map(index => next[index]).filter(Boolean);
      node.connections = targets.map(target => target.uid);
    }
  }

  function routeGraphSignature(rows) {
    return rows.map(row => row.map(node => node.id).join(',')).join('|');
  }

  function routeGraphInvariantErrors(graph) {
    const errors = [];
    const rows = graph?.rows || [];
    const minibossRows = rows.filter(row => row.length === 1 && row[0]?.type === 'miniboss');
    if (minibossRows.length !== 1) errors.push('un unique miniboss obligatoire est requis');
    const constraintRow = rows[graph?.constraintRow] || [];
    const constraintNodes = constraintRow.filter(node => node.type === 'malus');
    const safeNodes = constraintRow.filter(node => node.type !== 'malus');
    if (constraintNodes.length < 2 || safeNodes.length !== 1) errors.push('la bifurcation de contraintes doit contenir deux malus et une voie extérieure');
    const previousRow = rows[(graph?.constraintRow ?? 0) - 1] || [];
    const constraintUids = new Set(constraintNodes.map(node => node.uid));
    for (const node of previousRow) {
      const destinations = (node.connections || []).filter(uid => constraintUids.has(uid));
      if (node.col === graph.constraintEntryCol && (destinations.length < 2 || destinations.length !== (node.connections || []).length)) errors.push(`l’embranchement ${node.uid} ne mène pas exclusivement à plusieurs contraintes`);
      if (node.col !== graph.constraintEntryCol && destinations.length) errors.push(`l’embranchement ${node.uid} entre dans le corridor négatif sans l’avoir choisi`);
    }
    const combatOffers = rows.flat().filter(node => node.type === 'combat').length;
    if (combatOffers < 2) errors.push('la ligne doit proposer au moins deux combats normaux');
    return errors;
  }

  function buildRouteRows(pathBias) {
    const constraintRow = ritualRandom() < .5 ? 1 : 2;
    const minibossRow = constraintRow + 2;
    const constraintEntryCol = Math.floor(ritualRandom() * BALANCE.rewardChoices);
    const rows = [];
    for (let row = 0; row < BALANCE.stopsPerControl; row++) {
      if (row === constraintRow) {
        const safeNode = buildPathChoices({
          step:run.step + row,
          daysLeft:BALANCE.stopsPerControl - row,
          pathBias:'noncombat'
        }).find(node => !['pact','secret'].includes(node.type)) || PATH_NODES.find(node => node.id === 'grove');
        const gateChoices = shuffle([...constraintRouteNodes(), safeNode]);
        rows.push(gateChoices.map((node, col) => ({ ...node, uid:routeGraphUid(run.act, row, col), row, col, connections:[] })));
        continue;
      }
      if (row === minibossRow) {
        const node = PATH_NODES.find(candidate => candidate.type === 'miniboss');
        rows.push([{ ...node, uid:routeGraphUid(run.act, row, 1), row, col:1, connections:[] }]);
        continue;
      }
      const choices = buildPathChoices({
        step:run.step + row,
        daysLeft:BALANCE.stopsPerControl - row,
        pathBias:row === 0 ? pathBias : null,
        forceCombat:true
      });
      rows.push(choices.map((node, col) => ({ ...node, uid:routeGraphUid(run.act, row, col), row, col, connections:[] })));
    }
    for (let row = 0; row < rows.length - 1; row++) {
      connectRouteRows(rows[row], rows[row + 1], { constraintGate:row + 1 === constraintRow, constraintEntryCol });
    }
    return { rows, constraintRow, minibossRow, constraintEntryCol };
  }

  function createRouteGraph() {
    if (!run) return;
    const pathBias = run.nextPathBias;
    run.nextPathBias = null;
    let layout = null;
    let signature = '';
    for (let attempt = 0; attempt < 4; attempt++) {
      layout = buildRouteRows(pathBias);
      signature = routeGraphSignature(layout.rows);
      if (run.act !== 0 || signature !== profile.lastOpeningRouteSignature) break;
    }
    if (run.act === 0 && signature === profile.lastOpeningRouteSignature && layout.rows[0]?.length > 1) {
      const descriptors = layout.rows[0].map(({ uid, row, col, connections, ...descriptor }) => descriptor);
      descriptors.push(descriptors.shift());
      layout.rows[0] = layout.rows[0].map((node, index) => ({
        ...descriptors[index], uid:node.uid, row:node.row, col:node.col, connections:node.connections
      }));
      signature = routeGraphSignature(layout.rows);
    }
    const { rows, constraintRow, minibossRow, constraintEntryCol } = layout;
    if (run.act === 0) profile.lastOpeningRouteSignature = signature;
    const hunter = hunterForAct();
    const boss = {
      uid:`ligne-${run.act + 1}-controle-celeste`, id:'hunt', icon:'☀', name:hunter.name, type:'hunt',
      desc:`Contrôle céleste : ${hunter.rule}`, row:rows.length, col:1, connections:[]
    };
    for (const node of rows.at(-1) || []) node.connections = [boss.uid];
    const graph = { version:ROUTE_GRAPH_VERSION, signature, act:run.act, rows, boss, constraintRow, constraintEntryCol, minibossRow, currentRow:0, previousNodeId:null, visited:[] };
    const invariantErrors = routeGraphInvariantErrors(graph);
    if (invariantErrors.length) throw new Error(`Carte de route invalide : ${invariantErrors.join(' · ')}`);
    run.routeGraph = graph;
    syncPathChoicesFromGraph();
    run.routePreviewId = null;
  }

  function ensureRouteGraph() {
    if (!run) return null;
    if (!run.routeGraph || run.routeGraph.version !== ROUTE_GRAPH_VERSION || run.routeGraph.act !== run.act || !Array.isArray(run.routeGraph.rows)) createRouteGraph();
    const expectedRow = clamp(BALANCE.stopsPerControl - Math.max(0, run.daysLeft), 0, BALANCE.stopsPerControl);
    if (run.routeGraph.currentRow < expectedRow) run.routeGraph.currentRow = expectedRow;
    syncPathChoicesFromGraph();
    return run.routeGraph;
  }

  function routeGraphNodes(graph = run?.routeGraph) {
    if (!graph) return [];
    return [...graph.rows.flat(), graph.boss].filter(Boolean);
  }

  function routeGraphNode(uid) {
    return routeGraphNodes().find(node => node.uid === uid) || null;
  }

  function reachableRouteNodes() {
    const graph = run?.routeGraph;
    if (!graph || graph.currentRow >= graph.rows.length) return graph?.boss ? [graph.boss] : [];
    const row = graph.rows[graph.currentRow] || [];
    if (!graph.previousNodeId) return row;
    const previous = routeGraphNode(graph.previousNodeId);
    const allowed = new Set(previous?.connections || []);
    return row.filter(node => allowed.has(node.uid));
  }

  function syncPathChoicesFromGraph() {
    const graph = run?.routeGraph;
    if (!graph) return;
    const reachable = reachableRouteNodes();
    run.pathChoices = graph.currentRow >= graph.rows.length
      ? []
      : reachable.map(node => ({ ...node, routeUid:node.uid }));
    run.pathPack = run.pathChoices.some(node => node.type === 'combat') && run.pathChoices.some(node => node.type !== 'combat') ? 'mixed' : run.pathChoices[0]?.type || 'boss';
  }

  function inspectRouteNode(uid) {
    const node = routeGraphNode(uid);
    const reachable = reachableRouteNodes();
    if (!node || !reachable.some(candidate => candidate.uid === uid)) {
      return ritualToast('La suite reste visible, mais le Moonrail choisit un seul embranchement à la fois.');
    }
    return showRouteNodeDetail(uid);
  }

  function advanceRouteGraph() {
    const graph = run?.routeGraph;
    if (!graph || graph.currentRow >= graph.rows.length) return;
    const chosen = routeGraphNode(run.selectedRouteNodeId)
      || reachableRouteNodes().find(node => node.id === run.selectedPathId);
    if (chosen) {
      if (!graph.visited.includes(chosen.uid)) graph.visited.push(chosen.uid);
      graph.previousNodeId = chosen.uid;
    }
    graph.currentRow++;
    run.selectedRouteNodeId = null;
    syncPathChoicesFromGraph();
    run.routePreviewId = null;
  }

  function routeNodePosition(node) {
    const x = [18, 50, 82][node?.col] ?? 50;
    const rows = Math.max(1, BALANCE.stopsPerControl);
    const y = node?.type === 'hunt' ? 6 : 88 - (Number(node?.row || 0) * (63 / Math.max(1, rows - 1)));
    return { x, y };
  }

  function routeGraphMarkup() {
    const graph = run?.routeGraph;
    if (!graph) return '';
    const nodes = routeGraphNodes(graph);
    const nodeMap = new Map(nodes.map(node => [node.uid, node]));
    const visited = new Set(graph.visited || []);
    const reachable = new Set(reachableRouteNodes().map(node => node.uid));
    const lines = [];
    for (const node of nodes) {
      const from = routeNodePosition(node);
      for (const targetUid of node.connections || []) {
        const target = nodeMap.get(targetUid);
        if (!target) continue;
        const to = routeNodePosition(target);
        const classes = [
          visited.has(node.uid) && (visited.has(targetUid) || targetUid === graph.previousNodeId) ? 'visited' : '',
          node.uid === graph.previousNodeId && reachable.has(targetUid) ? 'available' : ''
        ].filter(Boolean).join(' ');
        lines.push(`<line class="${classes}" x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`);
      }
    }
    const nodeButtons = nodes.map(node => {
      const position = routeNodePosition(node);
      const isPast = node.row < graph.currentRow;
      const isCurrent = node.row === graph.currentRow && reachable.has(node.uid);
      const family = ROUTE_FAMILIES[node.type] || ROUTE_FAMILIES.secret;
      const classes = [
        'route-map-node', `type-${node.type}`, `tone-${family.tone}`,
        visited.has(node.uid) ? 'visited' : isPast ? 'skipped' : isCurrent ? 'current' : 'future',
        run.routePreviewId === node.uid ? 'previewed' : ''
      ].filter(Boolean).join(' ');
      const status = visited.has(node.uid) ? 'déjà visité' : isCurrent ? 'accessible maintenant' : 'visible pour anticiper, pas encore sélectionnable';
      return `<button class="${classes}" data-ritual-route-node="${esc(node.uid)}" style="--node-x:${position.x}%;--node-y:${position.y}%" ${isCurrent ? '' : 'disabled'} aria-label="${esc(`${node.name}, ${family.label}, ${status}`)}"><span>${node.icon}</span><small>${esc(family.label)}</small></button>`;
    }).join('');
    const trainY = graph.currentRow >= graph.rows.length ? 11 : 94 - (graph.currentRow * (63 / Math.max(1, BALANCE.stopsPerControl - 1)));
    return `<svg class="route-map-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines.join('')}</svg>${nodeButtons}<span class="route-map-train" style="--train-y:${trainY}%">🚂</span>`;
  }

  function focusRouteViewportOnPlayer() {
    const viewport = $('#ritual-route-viewport');
    const train = viewport?.querySelector('.route-map-train');
    if (!viewport || !train) return;
    requestAnimationFrame(() => {
      const target = train.offsetTop + train.offsetHeight / 2 - viewport.clientHeight * .72;
      const maximum = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
      viewport.scrollTo({ top:clamp(target, 0, maximum), behavior:'auto' });
    });
  }

  function scheduleRouteViewportFocus() {
    if (!$('#screen-ritual-map')?.classList.contains('active')) return;
    clearTimeout(routeViewportFocusTimer);
    routeViewportFocusTimer = setTimeout(focusRouteViewportOnPlayer, 90);
  }

  function handleRouteViewportKey(event) {
    const viewport = event.currentTarget;
    const page = Math.max(120, viewport.clientHeight * .78);
    const targets = {
      ArrowUp:viewport.scrollTop - 48,
      ArrowDown:viewport.scrollTop + 48,
      PageUp:viewport.scrollTop - page,
      PageDown:viewport.scrollTop + page,
      Home:0,
      End:viewport.scrollHeight
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    viewport.scrollTo({ top:targets[event.key], behavior:event.repeat ? 'auto' : 'smooth' });
  }

  function routeDetailMarkup(nodeOverride = null) {
    const graph = run?.routeGraph;
    if (!graph) return '';
    const reachable = reachableRouteNodes();
    const node = nodeOverride || routeGraphNode(run.routePreviewId);
    if (!node) return '';
    const family = ROUTE_FAMILIES[node.type] || ROUTE_FAMILIES.secret;
    const isCurrent = node.row === graph.currentRow && reachable.some(candidate => candidate.uid === node.uid);
    const wallet = node.type === 'shop' ? ` Vous possédez ${run.teeth} éclat${run.teeth > 1 ? 's' : ''}.` : '';
    const state = isCurrent
      ? 'PROCHAIN ARRÊT · DÉCISION ACTIVE'
      : 'APERÇU DE LA LIGNE · CHOIX FUTUR';
    const murmurHint = routeMurmurHintMarkup(node);
    return `<article class="route-choice-summary route-detail-card type-${node.type} tone-${family.tone}">
      <span class="route-art" style="${routeArtStyle(node)}" aria-hidden="true"></span>
      <div class="route-choice-summary-content">
        <header><i>${node.icon}</i><div><small>${esc(state)}</small><h3>${esc(node.name)}</h3></div></header>
        <p class="route-choice-description">${esc(node.desc + wallet)}</p>
        <div class="route-choice-facts">
          <section class="route-family-summary"><small>TYPE D’ARRÊT</small><b>${esc(family.label)}</b><span>${esc(family.summary)}</span></section>
          <section class="route-impact-summary"><small>EFFETS ANNONCÉS</small>${routeImpactMarkup(node)}</section>
        </div>
        ${murmurHint ? `<div class="route-choice-murmur"><small>LIEN AVEC LE MURMURE</small>${murmurHint}</div>` : ''}
      </div>
    </article>`;
  }

  function showRouteNodeDetail(uid) {
    const node = routeGraphNode(uid);
    const reachable = reachableRouteNodes();
    if (!node || !reachable.some(candidate => candidate.uid === uid)) {
      return ritualToast('La suite reste visible, mais le Moonrail choisit un seul embranchement à la fois.');
    }
    openRitualModal(`<span class="kicker">PROCHAIN ARRÊT</span><h2>Confirmer cette voie ?</h2>${routeDetailMarkup(node)}<div class="modal-actions route-choice-actions"><button class="secondary-button" data-action="ritual-modal-close">Retour à la carte</button><button class="primary-button large" data-ritual-path="${esc(node.id)}">Prendre cette voie <b>→</b></button></div>`, 'route-choice-modal');
  }

  function showRitualMap() {
    if (!run) return beginRitual();
    ensureRouteGraph();
    showRitualScreen('ritual-map');
    const hunter = hunterForAct();
    $('#ritual-days-left').textContent = Math.max(0, run.daysLeft);
    $('#ritual-cycle-label').textContent = run.daysLeft === 1 ? 'ARRÊT' : 'ARRÊTS';
    $('#hunter-name').textContent = hunter.name;
    $('#hunter-rule').textContent = hunter.rule;
    $('#hunter-advice').textContent = hunter.advice;
    $('#hunter-portrait').style.cssText = `background-image:url('../assets/enemies-major-sheet-v2.png');background-size:300% auto;background-position:${(hunter.portrait % 3) * 50}% ${Math.floor(hunter.portrait / 3) * 100}%;background-repeat:no-repeat`;
    const murmurPanel = $('#ritual-run-murmur');
    if (murmurPanel) {
      murmurPanel.innerHTML = runMurmurMarkup();
      resolveRunMurmurReward();
      renderRitualProfile();
      murmurPanel.innerHTML = runMurmurMarkup();
    }
    const routeMap = $('#ritual-route-map');
    if (routeMap) {
      routeMap.innerHTML = routeGraphMarkup();
      focusRouteViewportOnPlayer();
    }
    const routeChoices = $('#ritual-path-choices');
    if (routeChoices) routeChoices.innerHTML = '';
    persist();
  }

  function routeChoiceLabel(node) {
    const family = ROUTE_FAMILIES[node?.type] || ROUTE_FAMILIES.secret;
    return `${family.label} · ${family.verb.toUpperCase()}`;
  }

  function routeImpactTags(node) {
    if (!node) return [];
    if (node.type === 'malus') return malusImpactTags(MALUS_CHOICES.find(option => option.id === node.constraintId));
    const teeth = run?.teeth || 0;
    const malusCount = run?.maluses?.length || 0;
    const labels = {
      combat:['combat court', 'butin après victoire'],
      miniboss:['combat renforcé', '3 éclats + butin amélioré'],
      hunt:['boss', 'règle spéciale visible'],
      reward:['+1 carte', 'deck plus large'],
      upgrade:['modifier une carte', '+stats ou sigil'],
      forge:['fusion si doublon', 'sinon +2 éclats'],
      shop:[`${teeth} éclat${teeth > 1 ? 's' : ''}`, 'prix par puissance'],
      cleanse:[malusCount ? '-1 malus' : '+2 éclats', 'halte sûre'],
      transform:['remplacer 1 carte', 'coût proche'],
      scout:['indice boss', '+1 Présage stellaire'],
      thread:['secret de route', 'carte + preuve'],
      weather:['2 combats', 'règle climatique'],
      pact:['gain immédiat', 'prix annoncé'],
      meta:['rare permanent', 'deck de départ'],
      secret:['levier risqué', 'piste possible']
    };
    return labels[node.type] || ['choix de route', 'effet immédiat'];
  }

  function routeImpactMarkup(node) {
    const tags = routeImpactTags(node);
    if (!tags.length) return '';
    return `<ul class="route-impact-list">${tags.map(tag => `<li>${esc(tag)}</li>`).join('')}</ul>`;
  }

  function routeMurmurHint(node) {
    const murmur = currentRunMurmur();
    if (!node || !murmur || run?.murmur?.claimed) return null;
    const id = murmur.id;
    if (id === 'fresh_dialogue') {
      if (node.type === 'hunt') return { level:'strong', text:'dialogue neuf possible' };
      if (node.type === 'scout') return { level:'soft', text:'prépare le prochain boss' };
    }
    if (id === 'living_dossier') {
      if (node.type === 'thread') return { level:'strong', text:'dossier vivant' };
      if (node.type === 'secret') return { level:'soft', text:'piste de secret' };
    }
    if (id === 'white_switch' && node.type === 'secret') return { level:'strong', text:'fil blanc possible' };
    if (id === 'boiler_witness' && ['combat','miniboss','hunt'].includes(node.type)) return { level:'strong', text:'chauffez en combat' };
    if (id === 'shard_hoard') {
      if (['combat','hunt','forge','cleanse'].includes(node.type)) return { level:'strong', text:'éclats possibles' };
      if (node.type === 'secret') return { level:'soft', text:'prix ou éclats' };
    }
    if (id === 'clean_chain' && ['combat','miniboss','hunt'].includes(node.type)) return { level:'strong', text:'suite de victoires' };
    return null;
  }

  function routeMurmurHintMarkup(node) {
    const hint = routeMurmurHint(node);
    return hint ? `<em class="route-murmur-hint ${esc(hint.level)}">✧ ${esc(hint.text)}</em>` : '';
  }

  function murmurPreferredRouteTypes(murmurId = currentRunMurmur()?.id) {
    return ({
      fresh_dialogue:['scout'],
      living_dossier:['thread','secret'],
      white_switch:['secret'],
      boiler_witness:['combat'],
      shard_hoard:['combat','forge','cleanse','secret'],
      clean_chain:['combat']
    })[murmurId] || [];
  }

  function choiceImpactMarkup(items, tone = '') {
    const clean = (items || []).filter(Boolean);
    if (!clean.length) return '';
    return `<ul class="choice-impact-list ${esc(tone)}">${clean.map(item => `<li>${esc(item)}</li>`).join('')}</ul>`;
  }

  function cardRewardInsight(card) {
    const cost = cardLumenCost(card, null);
    const sigil = card?.sigils?.[0] ? SIGILS[card.sigils[0]] : null;
    if (cost === 0) return { title:'Carte gratuite', detail:'Déclenche des combos ou allège un tour sans consommer de Lueur.' };
    if (Number(card?.attack || 0) <= 0) return { title:'Outil défensif', detail:'Elle sert surtout à bloquer, préparer une synergie ou gagner du temps.' };
    if (Number(card?.health || 0) <= 0) return { title:'Impact fragile', detail:'Elle doit être jouée au bon moment : son intérêt vient de son effet.' };
    if (sigil) return { title:`Sigil - ${sigil[1]}`, detail:sigil[2] };
    if (Number(card?.attack || 0) >= 3) return { title:'Pression Moonrail', detail:'Bonne option pour avancer vite si une voie se libère.' };
    if (Number(card?.health || 0) >= 5) return { title:'Ancre de wagon', detail:'Stabilise une voie contre les ennemis et les boss.' };
    return { title:'Tempo fiable', detail:'Carte simple à poser, utile quand le deck doit rester lisible.' };
  }

  function malusImpactTags(option) {
    return ({
      short_fuse:['prochain combat', '-1 Lueur de départ'],
      watching_eye:['prochain combat', '+2 Poursuite'],
      heavy_hand:['2 combats', 'limite main -1'],
      toll_gate:['coût variable', '-2 éclats ou +1 Poursuite']
    })[option?.id] || ['malus temporaire', 'prix immédiat'];
  }

  function pactImpactTags(option) {
    return ({
      bright_debt:['gain +4 éclats', 'prix +2 Poursuite'],
      ember_bargain:['gain carte rare', 'prix -1 Lueur'],
      thin_hand:['upgrade commune', 'prix main -1']
    })[option?.id] || ['gain lisible', 'prix lisible'];
  }

  function weatherImpactTags(choice) {
    return ({
      moon_rain:['2 combats', '-1 Poursuite possible'],
      ember_wind:['2 combats', 'chauffer buffe la prochaine carte'],
      glass_snow:['2 combats', 'ennemis plus lents mais +1 Vie']
    })[choice?.id] || ['2 combats', 'règle visible'];
  }

  function switchImpactTags(choice) {
    return ({
      white_thread:['secret', 'allume une piste'],
      shard_siding:['gain +3 éclats', 'prix +1 Poursuite'],
      silent_switch:['routes non-combat', 'prix -1 Lueur']
    })[choice?.id] || ['choix de trajectoire', 'prix lisible'];
  }

  function rewardChoiceMarkup(card) {
    const insight = cardRewardInsight(card);
    const cost = cardResourceCost(card, null);
    return `<button class="reward-card-option" data-ritual-reward="${esc(card.id)}">${ritualCardDisplayMarkup(card)}<div class="reward-card-insight"><span>${esc(card.rarity)} · ${cost.icon}${cost.amount}</span><b>${esc(insight.title)}</b><small>${esc(insight.detail)}</small></div></button>`;
  }

  function choosePath(id) {
    if (!run || run.battle) return;
    if (id === 'hunt') {
      closeRitualModal();
      run.selectedRouteNodeId = run.routeGraph?.boss?.uid || null;
      return startBattle(true);
    }
    const node = run.pathChoices.find(choice => choice.id === id);
    if (!node) return;
    closeRitualModal();
    run.selectedPathId = id;
    run.selectedRouteNodeId = node.routeUid || node.uid || null;
    if (node.type === 'combat') return startBattle(false);
    if (node.type === 'miniboss') return startBattle(false, true);
    if (node.type === 'reward') return showCardReward('complete');
    if (node.type === 'upgrade') return showUpgradeChoice();
    if (node.type === 'forge') return resolveForge();
    if (node.type === 'cleanse') return resolveCleanseRoute();
    if (node.type === 'transform') return showTransformChoice();
    if (node.type === 'scout') return resolveScoutRoute();
    if (node.type === 'thread') return showRouteSecretEvent();
    if (node.type === 'pact') return showPactChoice();
    if (node.type === 'weather') return showWeatherChoice();
    if (node.type === 'meta') return showStarterRewrite();
    if (node.type === 'malus') return applyRouteConstraint(node);
    if (node.type === 'shop') return showRitualShop();
    if (node.type === 'secret') return resolveSecretPath();
  }

  function allCards() { return { ...cardMap, ...Object.fromEntries(profile.memories.map(card => [card.id, card])) }; }
  function cardIdOf(ref) { return ref && typeof ref === 'object' ? ref.cardId : ref; }
  function getCard(ref) { return allCards()[cardIdOf(ref)]; }
  function effectiveCard(ref) {
    const id = cardIdOf(ref);
    const base = getCard(id);
    if (!base) return null;
    const mod = run?.cardMods?.[id] || {};
    const state = runCardState(ref);
    const instanceMod = state ? run?.cardInstanceMods?.[state.uid] || {} : {};
    return { ...base, attack: base.attack + (mod.attack || 0) + (instanceMod.attack || 0), health: base.health + (mod.health || 0) + (instanceMod.health || 0), sigils:[...(base.sigils || []), ...(mod.sigils || []), ...(instanceMod.sigils || [])] };
  }

  function createRunCardState(cardId) {
    run.cardUidCounter = Number(run.cardUidCounter || 0) + 1;
    return { uid:`${run.id || 'run'}-card-${run.cardUidCounter}`, cardId, hp:null, dead:false };
  }

  function ensureRunCardStates() {
    if (!run) return [];
    if (run.battle && Array.isArray(run.cardStates) && run.cardStates.length) return run.cardStates;
    const existing = Array.isArray(run.cardStates) ? run.cardStates.filter(state => state && !state.dead && getCard(state.cardId)) : [];
    const pools = new Map();
    existing.forEach(state => {
      if (!pools.has(state.cardId)) pools.set(state.cardId, []);
      pools.get(state.cardId).push(state);
    });
    run.cardStates = (run.deck || []).map(cardId => pools.get(cardId)?.shift() || createRunCardState(cardId));
    return run.cardStates;
  }

  function runCardState(ref) {
    const uid = ref && typeof ref === 'object' ? ref.runUid : null;
    return uid ? run?.cardStates?.find(state => state.uid === uid) || null : null;
  }

  function runBattleRef(state) {
    return { cardId:state.cardId, runUid:state.uid };
  }

  function syncRunCardHealth(unit) {
    if (!unit?.runUid) return;
    const state = run?.cardStates?.find(item => item.uid === unit.runUid);
    if (state && !state.dead) state.hp = clamp(unit.hp, 0, Math.max(0, unit.maxHp));
  }

  function reviveRunCard(ref, hp = 1) {
    const state = runCardState(ref);
    if (state) { state.dead = false; state.returnsNextCombat = false; state.hp = Math.max(1, hp); }
  }

  function isReturningSignature(ref) {
    return getCard(ref)?.tribe === 'signature';
  }

  function markRunCardDead(ref, reason = 'perdue en combat') {
    const state = runCardState(ref);
    if (!state || state.dead) return null;
    state.dead = true;
    state.hp = 0;
    const card = getCard(state.cardId);
    state.returnsNextCombat = isReturningSignature(state.cardId);
    run.battle && (run.battle.casualties ||= []).push({ uid:state.uid, cardId:state.cardId, reason, returnsNextCombat:state.returnsNextCombat });
    if (state.returnsNextCombat) {
      announceFeedback('signature', 'Signature brisée pour ce combat', `${card?.name || 'La signature'} se reformera à pleine Vie avant le prochain contrôle.`, card);
    } else {
      announceFeedback('loss', 'Carte perdue pour cette run', `${card?.name || 'Un passager'} ne reviendra pas dans les prochains combats.`, card);
    }
    return card;
  }

  function addRunCard(cardId) {
    if (!run || !getCard(cardId)) return null;
    run.deck.push(cardId);
    run.cardStates ||= [];
    const state = createRunCardState(cardId);
    run.cardStates.push(state);
    queueCardTypeTutorial(cardId);
    return state;
  }

  function replaceRunCardInstance(oldId, nextId) {
    if (!run || !getCard(nextId)) return null;
    const state = ensureRunCardStates().find(item => !item.dead && item.cardId === oldId);
    if (!state) return null;
    if (run.cardInstanceMods) delete run.cardInstanceMods[state.uid];
    state.cardId = nextId;
    state.hp = null;
    state.dead = false;
    state.returnsNextCombat = false;
    run.deck = run.cardStates.filter(item => !item.dead).map(item => item.cardId);
    queueCardTypeTutorial(nextId);
    return state;
  }

  function grantCardToProfile(cardId, addToRun = false) {
    const card = getCard(cardId);
    if (!card) return null;
    if (!profile.unlockedCards.includes(card.id)) profile.unlockedCards.push(card.id);
    if (!profile.gachaUnlockedCards.includes(card.id)) profile.gachaUnlockedCards.push(card.id);
    if (!profile.discoveredCards.includes(card.id)) profile.discoveredCards.push(card.id);
    if (addToRun && run?.deck) addRunCard(card.id);
    queueCardTypeTutorial(card.id);
    return card;
  }

  function rewardPool() {
    const sourceDeck = run?.deck?.length ? run.deck : [];
    const deckPool = sourceDeck
      .map(id => effectiveCard(id) || getCard(id))
      .filter(card => card && card.tribe !== 'signature' && card.rarity !== 'unique');
    const gachaPool = (profile.gachaUnlockedCards || [])
      .filter(id => !sourceDeck.includes(id))
      .map(getCard)
      .filter(card => card && card.tribe !== 'signature' && card.rarity !== 'unique');
    return [...deckPool, ...gachaPool];
  }

  const CARD_ART_SHEETS = Object.freeze({
    signature: { file:'cards-signatures-sheet-v1.png', cols:6, rows:2 },
    boss: { file:'cards-enemy-spells-sheet-v1.png', cols:6, rows:3, indexOffset:-1, wrap:false },
    secret: { file:'cards-secret-unique-sheet-v1.png', cols:4, rows:4 },
    mechanics: { file:'cards-mechanics-sheet-v1.png', cols:5, rows:4 },
    common: { file:'cards-common-sheet.png', cols:4, rows:4 },
    uncommon: { file:'cards-uncommon-sheet.png', cols:5, rows:2 },
    rare: { file:'cards-rare-sheet.png', cols:4, rows:2 },
    default: { file:'ritual-creatures-sheet-v1.png', cols:5, rows:4 }
  });

  function cardArtSheet(card) {
    const id = String(card?.id || '');
    const cost = card?.lumen ?? card?.blood ?? (card?.bones ? Math.ceil(card.bones / 2) : 0);
    const isSignature = card?.tribe === 'signature' || id.startsWith('spell_') || id.startsWith('last_');
    const isMechanicalOddity = card?.role === 'wound'
      || Number(card?.attack ?? 0) <= 0
      || Number(card?.health ?? 0) <= 0
      || Number(cost ?? 0) <= 0;
    if (isSignature) return CARD_ART_SHEETS.signature;
    if (id.startsWith('boss_')) return CARD_ART_SHEETS.boss;
    if (card?.rarity === 'unique' || card?.rarity === 'secret') return CARD_ART_SHEETS.secret;
    if (isMechanicalOddity) return CARD_ART_SHEETS.mechanics;
    if (card?.rarity === 'common') return CARD_ART_SHEETS.common;
    if (card?.rarity === 'uncommon') return CARD_ART_SHEETS.uncommon;
    if (card?.rarity === 'rare') return CARD_ART_SHEETS.rare;
    return CARD_ART_SHEETS.default;
  }


  function spriteSheetStyle(file, cols, rows, index, wrap = false) {
    const total = cols * rows;
    const raw = Number(index ?? 0);
    const normalized = Number.isFinite(raw) ? Math.trunc(raw) : 0;
    const safe = wrap ? ((normalized % total) + total) % total : clamp(normalized, 0, total - 1);
    const x = safe % cols, y = Math.floor(safe / cols);
    const posX = cols === 1 ? 0 : (x * 100) / (cols - 1);
    const posY = rows === 1 ? 0 : (y * 100) / (rows - 1);
    return `background-image:url('../assets/${file}');background-size:${cols * 100}% auto;background-position:${posX}% ${posY}%;background-repeat:no-repeat`;
  }

  const CARD_SPECIFIC_ART = Object.freeze({
    moon_hare: ['cards-starter-core-sheet-v1.png', 0],
    paper_crane: ['cards-starter-core-sheet-v1.png', 1],
    shrine_fox: ['cards-starter-core-sheet-v1.png', 2],
    bell_toad: ['cards-starter-core-sheet-v1.png', 3],
    wisp_scribe: ['cards-starter-core-sheet-v1.png', 4],
    bone_sparrow: ['cards-starter-core-sheet-v1.png', 5],
    cloud_oni: ['cards-starter-core-sheet-v1.png', 6],
    thorn_oracle: ['cards-starter-core-sheet-v1.png', 7],
    lantern_moth: ['cards-starter-core-sheet-v1.png', 8],
    ink_tanuki: ['cards-starter-core-sheet-v1.png', 9],
    clock_harpy: ['cards-starter-core-sheet-v1.png', 10],
    porcelain_golem: ['cards-starter-core-sheet-v1.png', 11],
    star_kappa: ['cards-starter-core-sheet-v1.png', 12],
    rail_cat: ['cards-starter-core-sheet-v1.png', 13],
    omen_lantern: ['cards-starter-core-sheet-v1.png', 15],
    dew_fox: ['cards-common-folklore-sheet-v1.png', 0],
    cinder_moth: ['cards-common-folklore-sheet-v1.png', 1],
    tin_komainu: ['cards-common-folklore-sheet-v1.png', 2],
    mist_newt: ['cards-common-folklore-sheet-v1.png', 3],
    paper_badger: ['cards-common-folklore-sheet-v1.png', 4],
    bell_cricket: ['cards-common-folklore-sheet-v1.png', 5],
    ash_ticket: ['cards-common-folklore-sheet-v1.png', 6],
    mirror_slug: ['cards-common-folklore-sheet-v1.png', 7],
    lantern_rat: ['cards-common-folklore-sheet-v1.png', 8],
    copper_finch: ['cards-common-folklore-sheet-v1.png', 9],
    ink_monk: ['cards-common-folklore-sheet-v1.png', 10],
    bone_chime: ['cards-common-folklore-sheet-v1.png', 11],
    dew_kappa: ['cards-common-folklore-sheet-v1.png', 12],
    coal_sprite: ['cards-common-folklore-sheet-v1.png', 13],
    sleepy_oni: ['cards-common-folklore-sheet-v1.png', 14],
    ribbon_crow: ['cards-common-folklore-sheet-v1.png', 15],
    steam_tanuki: ['cards-common-motion-sheet-v1.png', 0],
    white_cicada: ['cards-common-motion-sheet-v1.png', 1],
    needle_imp: ['cards-common-motion-sheet-v1.png', 2],
    moon_shrimp: ['cards-common-motion-sheet-v1.png', 3],
    wax_hare: ['cards-common-motion-sheet-v1.png', 4],
    rust_beetle: ['cards-common-motion-sheet-v1.png', 5],
    grave_pebble: ['cards-common-motion-sheet-v1.png', 6],
    starling_mask: ['cards-common-motion-sheet-v1.png', 7],
    rain_tengu: ['cards-common-motion-sheet-v1.png', 8],
    lotus_wisp: ['cards-common-motion-sheet-v1.png', 9],
    porcelain_pup: ['cards-common-motion-sheet-v1.png', 10],
    thistle_mouse: ['cards-common-motion-sheet-v1.png', 11],
    paper_eel: ['cards-common-motion-sheet-v1.png', 12],
    soot_mirror: ['cards-common-motion-sheet-v1.png', 13],
    bell_maggot: ['cards-common-motion-sheet-v1.png', 14],
    cloud_calf: ['cards-common-motion-sheet-v1.png', 15],
    ember_grub: ['cards-common-lowstat-sheet-v1.png', 0],
    clock_mouse: ['cards-common-lowstat-sheet-v1.png', 1],
    bone_fan: ['cards-common-lowstat-sheet-v1.png', 2],
    dew_mirrorling: ['cards-common-lowstat-sheet-v1.png', 3],
    red_leaf_spirit: ['cards-common-lowstat-sheet-v1.png', 4],
    iron_mochi: ['cards-common-lowstat-sheet-v1.png', 5],
    lantern_snail: ['cards-common-lowstat-sheet-v1.png', 6],
    thread_fox: ['cards-common-lowstat-sheet-v1.png', 7],
    smoke_kodama: ['cards-common-lowstat-sheet-v1.png', 8],
    cracked_ticket: ['cards-common-lowstat-sheet-v1.png', 9],
    drowned_bell: ['cards-common-lowstat-sheet-v1.png', 10],
    moon_ferret: ['cards-common-lowstat-sheet-v1.png', 11],
    gear_minnow: ['cards-common-lowstat-sheet-v1.png', 12],
    ashen_mask: ['cards-common-lowstat-sheet-v1.png', 13],
    grave_firefly: ['cards-common-lowstat-sheet-v1.png', 14],
    mist_boar: ['cards-common-lowstat-sheet-v1.png', 15],
    furnace_kitsune: ['cards-uncommon-folklore-sheet-v1.png', 0],
    archive_glutton: ['cards-uncommon-folklore-sheet-v1.png', 1],
    silver_komainu: ['cards-uncommon-folklore-sheet-v1.png', 2],
    scarlet_tengu: ['cards-uncommon-folklore-sheet-v1.png', 3],
    mist_historian: ['cards-uncommon-folklore-sheet-v1.png', 4],
    gearfold_crane: ['cards-uncommon-folklore-sheet-v1.png', 5],
    funeral_tiger: ['cards-uncommon-folklore-sheet-v1.png', 6],
    lantern_mermaid: ['cards-uncommon-folklore-sheet-v1.png', 7],
    ink_baku: ['cards-uncommon-folklore-sheet-v1.png', 8],
    brass_yuki: ['cards-uncommon-folklore-sheet-v1.png', 9],
    thorn_kirin: ['cards-uncommon-folklore-sheet-v1.png', 10],
    paper_choir: ['cards-uncommon-folklore-sheet-v1.png', 11],
    bone_librarian: ['cards-uncommon-folklore-sheet-v1.png', 12],
    moon_komuso: ['cards-uncommon-folklore-sheet-v1.png', 13],
    cinder_oni: ['cards-uncommon-folklore-sheet-v1.png', 14],
    mirror_kappa: ['cards-uncommon-folklore-sheet-v1.png', 15],
    red_thread_doll: ['cards-rare-myth-sheet-v1.png', 0],
    overfull_mimic: ['cards-rare-myth-sheet-v1.png', 1],
    astral_foundry: ['cards-rare-myth-sheet-v1.png', 2],
    nameless_miko: ['cards-rare-myth-sheet-v1.png', 3],
    black_sun_moth: ['cards-rare-myth-sheet-v1.png', 4],
    dragon_sleep_bell: ['cards-rare-myth-sheet-v1.png', 5],
    mirror_procession: ['cards-rare-myth-sheet-v1.png', 6],
    bone_star_whale: ['cards-rare-myth-sheet-v1.png', 7],
    eclipse_nue: ['cards-rare-myth-sheet-v1.png', 8],
    oracle_of_unwritten_station: ['cards-rare-myth-sheet-v1.png', 9],
    zero_hour_shrine: ['cards-rare-myth-sheet-v1.png', 10],
    last_carriage_bell: ['cards-rare-myth-sheet-v1.png', 11],
    tribunal_stenographer: ['cards-rare-myth-sheet-v1.png', 12],
    amahina_whisper: ['cards-rare-myth-sheet-v1.png', 13],
    court_keykeeper: ['cards-rare-myth-sheet-v1.png', 14],
    forgotten_driver_glove: ['cards-rare-myth-sheet-v1.png', 15],
    dawn_spark: ['cards-secret-lore-sheet-v1.png', 0],
    centipede_train: ['cards-secret-lore-sheet-v1.png', 1],
    sunless_conductor: ['cards-secret-lore-sheet-v1.png', 2],
    amahina_first_refusal: ['cards-secret-lore-sheet-v1.png', 3],
    tribunal_molt_angel: ['cards-secret-lore-sheet-v1.png', 4],
    dawn_shell_oracle: ['cards-secret-lore-sheet-v1.png', 5],
    thirtieth_dialogue_mask: ['cards-secret-lore-sheet-v1.png', 6],
    dawn_paradox_yurei: ['cards-secret-lore-sheet-v1.png', 7],
    player_seat_lantern: ['cards-secret-lore-sheet-v1.png', 8],
    white_thread_loom: ['cards-secret-lore-sheet-v1.png', 9],
    seat_that_draws_back: ['cards-secret-lore-sheet-v1.png', 10],
    witness_carriage_key: ['cards-secret-lore-sheet-v1.png', 11],
    silent_thirteenth_seat: ['cards-secret-lore-sheet-v1.png', 12],
    cabinet_that_remembers_you: ['cards-secret-lore-sheet-v1.png', 13],
    verdict_player_seat_lantern: ['cards-secret-lore-sheet-v1.png', 14],
    skull_mochi: ['cards-starter-expanded-sheet-v1.png', 0],
    ember_ticket: ['cards-starter-expanded-sheet-v1.png', 1],
    mirror_mouse: ['cards-starter-expanded-sheet-v1.png', 2],
    rinka_ember: ['cards-starter-expanded-sheet-v1.png', 3],
    dream_butterfly: ['cards-starter-expanded-sheet-v1.png', 4],
    grave_crow: ['cards-starter-expanded-sheet-v1.png', 5],
    eir_mist: ['cards-starter-expanded-sheet-v1.png', 6],
    moon_stag: ['cards-starter-expanded-sheet-v1.png', 7],
    iron_wolf: ['cards-starter-expanded-sheet-v1.png', 8],
    kaguya_astral: ['cards-starter-expanded-sheet-v1.png', 9],
    mimic_orb: ['cards-starter-expanded-sheet-v1.png', 10],
    vespera_fallen: ['cards-starter-expanded-sheet-v1.png', 11],
    hundred_moon_tiger: ['cards-starter-expanded-sheet-v1.png', 12],
    eclipse_librarian: ['cards-starter-expanded-sheet-v1.png', 13],
    hollow_komainu_mask: ['cards-starter-expanded-sheet-v1.png', 14],
    moonless_bodyguard: ['cards-starter-expanded-sheet-v1.png', 15],
    ash_prayer_crane: ['cards-relations-techniques-sheet-v1.png', 0],
    prayer_diagnosis_moth: ['cards-relations-techniques-sheet-v1.png', 1],
    orbit_margin_ofuda: ['cards-relations-techniques-sheet-v1.png', 2],
    consent_valve_kappa: ['cards-relations-techniques-sheet-v1.png', 3],
    royal_fuse_wisp: ['cards-relations-techniques-sheet-v1.png', 4],
    ceiling_breach_tengu: ['cards-relations-techniques-sheet-v1.png', 5],
    late_banner_oni: ['cards-relations-techniques-sheet-v1.png', 6],
    scarred_sky_slug: ['cards-relations-techniques-sheet-v1.png', 7],
    living_reflection_leech: ['cards-relations-techniques-sheet-v1.png', 8],
    brake_light_frog: ['cards-relations-techniques-sheet-v1.png', 9],
    return_spark_ticket: ['cards-relations-techniques-sheet-v1.png', 10],
    cinder_route_pin: ['cards-relations-techniques-sheet-v1.png', 11]
  });

  function cardArtStyle(card) {
    const specific = CARD_SPECIFIC_ART[card?.id];
    if (specific) return spriteSheetStyle(specific[0], 4, 4, specific[1], false);
    const sheet = cardArtSheet(card);
    const index = Number(card?.art ?? 0) + Number(sheet.indexOffset || 0);
    return spriteSheetStyle(sheet.file, sheet.cols, sheet.rows, index, sheet.wrap !== false);
  }

  function routeArtStyle(node) {
    if (node?.type === 'thread') return routeSecretEventStyle(ROUTE_ART_INDEX[node?.id] ?? 0);
    if (Object.hasOwn(LORE_ROUTE_ART_INDEX, node?.id)) return spriteSheetStyle('lore-events-sheet-v1.png', 4, 4, LORE_ROUTE_ART_INDEX[node.id]);
    return spriteSheetStyle('route-events-sheet-v1.png', 4, 4, ROUTE_ART_INDEX[node?.id] ?? ROUTE_ART_INDEX[node?.type] ?? 0);
  }

  function truthRelicStyle(index) {
    return spriteSheetStyle('truth-relics-sheet-v1.png', 4, 4, index ?? 0);
  }

  function dialogueArchiveStyle(index) {
    return spriteSheetStyle('dialogue-archives-sheet-v1.png', 4, 4, index ?? 0);
  }

  function secretThreadStyle(index) {
    return spriteSheetStyle('secret-threads-sheet-v1.png', 4, 4, index ?? 0);
  }

  function routeSecretEventStyle(index) {
    return spriteSheetStyle('route-secret-events-sheet-v1.png', 4, 4, index ?? 0);
  }

  function relationshipMemoryStyle(index) {
    return spriteSheetStyle('relationship-memories-sheet-v1.png', 4, 4, index ?? 0);
  }

  function secretVerdictStyle(index) {
    return spriteSheetStyle('secret-verdicts-sheet-v1.png', 4, 4, index ?? 0);
  }

  function costMarkup(card) {
    const ashes = cardAshCost(card);
    if (ashes > 0) return `<span class="ritual-cost ashes" title="Coût en Cendres">✹${ashes}</span>`;
    return `<span class="ritual-cost lumen" title="Coût en Lueur">✦${cardLumenCost(card)}</span>`;
  }

  function cardAshCost(card) {
    return Number(card?.bones || 0) > 0 ? Math.ceil(Number(card.bones) / 2) : 0;
  }

  function cardLumenCost(card, battle = run?.battle) {
    const base = cardAshCost(card) ? 0 : card.lumen ?? (card.blood || 0);
    const inspectionTax = battle?.encounter?.ruleKey === 'seal_tax' && !battle.firstCardPlayed ? 1 : 0;
    return Math.max(0, base + inspectionTax);
  }

  function cardResourceCost(card, battle = run?.battle) {
    const ashes = cardAshCost(card);
    return ashes ? { type:'ashes', amount:ashes, icon:'✹', label:'Cendre' } : { type:'lumen', amount:cardLumenCost(card, battle), icon:'✦', label:'Lueur' };
  }

  function cardAffordable(card, battle = run?.battle) {
    const cost = cardResourceCost(card, battle);
    const available = cost.type === 'ashes' ? Number(battle?.ashes || 0) : Number(battle?.lumen || 0);
    return { ...cost, available, affordable:available >= cost.amount, missing:Math.max(0, cost.amount - available) };
  }

  function baseLumenForRun() {
    const shortFuse = run?.maluses?.find(malus => malus.id === 'short_fuse');
    return Math.max(1, (run?.guardianId === 'mecano' ? BALANCE.baseLumen + 1 : run?.guardianId === 'vespera' ? BALANCE.baseLumen + 2 : BALANCE.baseLumen) - (shortFuse ? 1 : 0));
  }

  function currentHandLimit() {
    return BALANCE.maxHand - (run?.maluses?.some(malus => malus.id === 'heavy_hand') ? 1 : 0);
  }

  function cardTypeTutorialKeys(card) {
    if (!card) return [];
    const keys = [];
    const cost = cardLumenCost(card, null);
    if (cost === 0 && cardAshCost(card) === 0) keys.push('zero_cost');
    if (Number(card.attack || 0) === 0) keys.push('zero_attack');
    if (Number(card.health || 0) === 0) keys.push('zero_health');
    if (cost === 0 && cardAshCost(card) === 0 && Number(card.attack || 0) === 0 && Number(card.health || 0) === 0) keys.push('zero_trinity');
    if (Number(card.bones || 0) > 0) keys.push('bones');
    if (card.tribe === 'signature') keys.push(String(card.name || '').startsWith('Last Word') ? 'last_word' : 'signature');
    if (card.rarity === 'uncommon') keys.push('uncommon');
    if (card.rarity === 'rare') keys.push('rare');
    if (card.rarity === 'secret') keys.push('secret');
    if (card.rarity === 'unique') keys.push('unique');
    for (const sigil of card.sigils || []) if (SIGILS[sigil]) keys.push(`sigil_${sigil}`);
    return [...new Set(keys)].filter(key => cardTutorialInfo(key));
  }

  function cardTutorialInfo(key) {
    if (CARD_TYPE_TUTORIALS[key]) return CARD_TYPE_TUTORIALS[key];
    if (String(key || '').startsWith('sigil_')) {
      const sigilId = key.slice(6);
      const sigil = SIGILS[sigilId];
      if (sigil) return { icon:sigil[0], title:`Sigil — ${sigil[1]}`, text:sigil[2] };
    }
    return null;
  }

  function currentRunTutorialKeys() {
    if (!run?.deck?.length) return [];
    return [...new Set(run.deck.flatMap(id => cardTypeTutorialKeys(effectiveCard(id) || getCard(id))))];
  }

  function queueTutorialKeys(keys) {
    profile.seenCardTypeTutorials ||= [];
    profile.pendingCardTypeTutorials ||= [];
    for (const key of keys.filter(key => cardTutorialInfo(key))) {
      if (profile.seenCardTypeTutorials.includes(key) || profile.pendingCardTypeTutorials.includes(key)) continue;
      profile.pendingCardTypeTutorials.push(key);
    }
  }

  function queueCurrentDeckTutorials() {
    profile.pendingCardTypeTutorials ||= [];
    const available = currentRunTutorialKeys();
    if (!available.length) {
      profile.pendingCardTypeTutorials = [];
      return;
    }
    profile.pendingCardTypeTutorials = profile.pendingCardTypeTutorials.filter(key => available.includes(key));
    queueTutorialKeys(available);
  }

  function queueCardTypeTutorial(cardOrId) {
    const card = typeof cardOrId === 'string' ? getCard(cardOrId) : cardOrId;
    if (!card || !run?.deck?.includes(card.id)) return;
    queueCurrentDeckTutorials();
  }

  function showPendingCardTypeTutorial() {
    if ($('#modal-layer')?.classList.contains('open')) return false;
    profile.pendingCardTypeTutorials ||= [];
    queueCurrentDeckTutorials();
    const keys = [...new Set(profile.pendingCardTypeTutorials.filter(key => cardTutorialInfo(key)))];
    if (!keys.length) {
      profile.pendingCardTypeTutorials = [];
      persist();
      return false;
    }
    profile.pendingCardTypeTutorials = profile.pendingCardTypeTutorials.filter(key => !keys.includes(key));
    profile.seenCardTypeTutorials = [...new Set([...(profile.seenCardTypeTutorials || []), ...keys])];
    persist();
    if (keys.length === 1) {
      const tutorial = cardTutorialInfo(keys[0]);
      openRitualModal(`<span class="kicker">NOUVEAU TYPE DE CARTE</span><h2><i class="tutorial-type-icon">${esc(tutorial.icon)}</i>${esc(tutorial.title)}</h2><p>${esc(tutorial.text)}</p><div class="modal-actions"><button class="primary-button" data-action="ritual-card-type-tutorial-close">Compris</button></div>`, 'card-type-tutorial-modal tutorial-modal');
      return true;
    }
    const tutorials = keys.map(key => {
      const tutorial = cardTutorialInfo(key);
      return `<article><i>${esc(tutorial.icon)}</i><div><strong>${esc(tutorial.title)}</strong><span>${esc(tutorial.text)}</span></div></article>`;
    }).join('');
    openRitualModal(`<span class="kicker">NOUVEAUX TYPES DE CARTES</span><h2>Briefing rapide avant de jouer</h2><p>Plusieurs mécaniques viennent d’entrer dans votre collection. Elles sont regroupées ici pour éviter de couper la partie par une série de popups.</p><div class="card-type-briefing-grid">${tutorials}</div><div class="modal-actions"><button class="primary-button" data-action="ritual-card-type-tutorial-close">Compris, reprendre la run</button></div>`, 'card-type-tutorial-modal tutorial-modal card-type-briefing-modal');
    return true;
  }

  function decayCombatMaluses() {
    if (!run?.maluses) return;
    run.maluses = run.maluses.map(malus => malus.id === 'heavy_hand' ? { ...malus, value: malus.value - 1 } : malus).filter(malus => malus.id !== 'short_fuse' && malus.value !== 0);
  }

  function sigilMarkup(sigils, compact = false) {
    return (sigils || []).map(id => { const info = SIGILS[id] || ['?','Inconnu','']; return `<span class="ritual-sigil" title="${esc(info[1])} · ${esc(info[2])}">${info[0]}${compact ? '' : `<small>${esc(info[1])}</small>`}</span>`; }).join('');
  }

  function ritualCardShell(tag, card, attrs = '', unit = null) {
    if (!card) return '';
    const health = unit ? unit.hp : card.health;
    const details = `Coût ${cardLumenCost(card, null)} Lueur · ${card.attack} Puissance · ${health} Vie · ${card.tribe || 'créature'} · ${card.rarity}. ${card.text}`;
    return `<${tag} class="ritual-card rarity-${card.rarity}" data-card-id="${esc(card.id)}" data-card-detail="${esc(details)}" ${attrs}><div class="ritual-card-frame">${costMarkup(card)}<div class="ritual-card-art" style="${cardArtStyle(card)}"></div><strong>${esc(card.name)}</strong><div class="ritual-card-sigils">${sigilMarkup(card.sigils, true)}</div><p>${esc(card.text)}</p><div class="ritual-card-stats"><b class="attack" title="Puissance">${card.attack}</b><span>PUISS. / VIE</span><b class="health" title="Vie">${health}</b></div></div></${tag}>`;
  }

  function ritualCardMarkup(card, attrs = '', unit = null) {
    return ritualCardShell('button', card, attrs, unit);
  }

  function ritualCardDisplayMarkup(card, attrs = '', unit = null) {
    return ritualCardShell('div', card, attrs, unit);
  }

  function cardZoomActionFor(cardElement) {
    const owner = cardElement.closest('button') || cardElement.parentElement?.querySelector('button[data-ritual-buy]');
    const data = owner?.dataset || cardElement.dataset;
    if (!data) return null;
    if (data.ritualHand !== undefined) return { kind:'hand', value:Number(data.ritualHand), label:'Sélectionner cette carte' };
    if (data.ritualReward) return { kind:'reward', value:data.ritualReward, label:'Prendre cette carte' };
    if (data.ritualUpgrade) return { kind:'upgrade', value:data.ritualUpgrade, label:'Améliorer cette carte' };
    if (data.ritualBuy) return { kind:'buy', value:data.ritualBuy, label:owner?.disabled ? 'Pas assez d’éclats' : 'Acheter cette carte', disabled:!!owner?.disabled };
    if (data.ritualSacrificeHand !== undefined) return { kind:'sacrificeHand', value:Number(data.ritualSacrificeHand), label:'Sacrifier cette carte' };
    if (data.ritualLabUnlock) return { kind:'labUnlock', value:data.ritualLabUnlock, label:'Forcer ce gain QA' };
    if (data.ritualTransform !== undefined) return { kind:'transform', value:Number(data.ritualTransform), label:'Choisir cette transformation' };
    if (data.ritualRewrite !== undefined) return { kind:'rewrite', value:Number(data.ritualRewrite), label:'Graver cette réécriture' };
    return null;
  }

  function cardZoomRole(card) {
    const id = String(card?.id || '');
    const sigils = card?.sigils || [];
    const cost = cardLumenCost(card, null);
    if (card?.tribe === 'signature' || id.startsWith('spell_') || id.startsWith('last_')) return 'Spell Card personnelle : elle exprime le style d’une conductrice et sert souvent de pivot de deck.';
    if (card?.rarity === 'unique' || card?.rarity === 'secret') return 'Carte de collection majeure : elle débloque une stratégie rare, parfois liée à un secret ou à une fin.';
    if (card?.attack <= 0 && card?.health <= 0) return 'Pièce rituelle vide : elle ne gagne pas par les stats, mais par son timing, son coût ou ses sigils.';
    if (cost <= 0) return 'Carte gratuite : elle sert à déclencher un combo, occuper une voie ou préparer un sacrifice sans dépenser de Lueur.';
    if (card?.attack <= 0) return 'Défenseur utilitaire : elle bloque, temporise ou déclenche ses sigils plutôt que d’infliger des dégâts.';
    if (card?.health <= 0) return 'Effet fragile : elle agit comme une carte instantanée ou un leurre qui disparaît vite.';
    if (sigils.includes('airborne')) return 'Pression aérienne : elle contourne beaucoup d’obstacles, sauf les unités avec Vigie.';
    if (sigils.includes('guardian') || sigils.includes('thorns') || card?.health >= 5) return 'Ancre défensive : elle stabilise une voie et achète le temps nécessaire au train.';
    if (sigils.includes('deathless') || sigils.includes('bone_digger') || sigils.includes('echo')) return 'Moteur de ressources : elle rend les tours suivants plus forts si vous construisez autour.';
    if (sigils.includes('bifurcated') || sigils.includes('sprinter')) return 'Contrôle de voies : elle récompense les placements précis et les changements de ligne.';
    return 'Carte de tempo : elle apporte surtout des stats fiables et un timing simple à lire.';
  }

  function cardZoomTips(card) {
    const tips = [];
    const id = String(card?.id || '');
    const cost = cardLumenCost(card, null);
    if (cost <= 0) tips.push('Coût 0 : jouable même quand la Lueur est basse.');
    if (card?.attack <= 0) tips.push('0 Puissance : ne cherchez pas le dégât brut, cherchez le blocage ou le combo.');
    if (card?.health <= 0) tips.push('0 Vie : effet très fragile, souvent meilleur quand il est joué au bon moment.');
    if (card?.sigils?.includes('brittle')) tips.push('Usage unique : prévoyez qu’elle quitte vite le plateau.');
    if (card?.sigils?.includes('destiny')) tips.push('Destin : son intérêt commence parfois dès la pioche.');
    if (card?.sigils?.includes('pyre')) tips.push('Brasier : elle peut transformer une perte en progression.');
    if (card?.tribe === 'signature' || id.startsWith('spell_') || id.startsWith('last_')) tips.push('Signature : son effet est pensé pour renforcer l’identité de la conductrice.');
    if (card?.rarity === 'unique' || card?.rarity === 'secret') tips.push('Spéciale : elle ne doit pas être lue comme une simple carte de stats.');
    if (!tips.length) tips.push('Simple à jouer : posez-la sur une voie où ses stats auront un impact immédiat.');
    return tips;
  }

  function showCardZoom(cardElement) {
    const id = cardElement?.dataset?.cardId;
    const card = (run ? effectiveCard(id) : null) || getCard(id);
    if (!card || document.querySelector('.card-zoom-layer')) return;
    pendingCardZoomAction = cardZoomActionFor(cardElement);
    const sigils = (card.sigils || []).map(id => {
      const info = SIGILS[id] || ['?','Inconnu',''];
      return `<li><b>${info[0]} ${esc(info[1])}</b><span>${esc(info[2])}</span></li>`;
    }).join('');
    const action = pendingCardZoomAction
      ? `<button class="primary-button large" data-action="ritual-card-zoom-confirm" ${pendingCardZoomAction.disabled ? 'disabled' : ''}>${esc(pendingCardZoomAction.label)}</button>`
      : '';
    const tips = cardZoomTips(card).map(tip => `<li>${esc(tip)}</li>`).join('');
    const role = cardZoomRole(card);
    const layer = document.createElement('div');
    layer.className = 'card-zoom-layer';
    layer.innerHTML = `<button class="card-zoom-backdrop" data-action="ritual-card-zoom-close" aria-label="Fermer l’aperçu"></button><section class="card-zoom-panel rarity-${card.rarity}"><button class="card-zoom-close" data-action="ritual-card-zoom-close">×</button><div class="card-zoom-card">${ritualCardDisplayMarkup(card)}</div><aside><span class="kicker">APERÇU DE CARTE</span><h2>${esc(card.name)}</h2><div class="card-zoom-meta"><span>✦ ${cardLumenCost(card, null)} Lueur</span><span>⚔ ${card.attack} Puissance</span><span>♥ ${card.health} Vie</span><span>${esc(card.rarity)}</span><span>${esc(card.tribe || 'créature')}</span></div><p class="card-zoom-main-text">${esc(card.text)}</p><div class="card-zoom-explain"><section><h3>Lecture rapide</h3><p>${esc(role)}</p></section><section><h3>À surveiller</h3><ul>${tips}</ul></section></div>${sigils ? `<h3 class="card-zoom-section-title">Sigils détaillés</h3><ul class="card-zoom-sigils">${sigils}</ul>` : '<p class="memory-note">Aucun sigil : cette carte gagne surtout par ses statistiques et son timing.</p>'}<div class="modal-actions">${action}<button class="secondary-button" data-action="ritual-card-zoom-close">Fermer</button></div></aside></section>`;
    document.body.appendChild(layer);
    requestAnimationFrame(() => layer.classList.add('visible'));
  }

  function closeCardZoom() {
    document.querySelector('.card-zoom-layer')?.remove();
    pendingCardZoomAction = null;
  }

  function confirmCardZoomAction() {
    const action = pendingCardZoomAction;
    document.querySelector('.card-zoom-layer')?.remove();
    pendingCardZoomAction = null;
    if (!action || action.disabled) return;
    if (action.kind === 'hand') return selectHand(action.value);
    if (action.kind === 'reward') return takeReward(action.value);
    if (action.kind === 'upgrade') return upgradeCard(action.value);
    if (action.kind === 'buy') return buyRitualCard(action.value);
    if (action.kind === 'sacrificeHand') return sacrificeHandCard(action.value);
    if (action.kind === 'labUnlock') return applyRitualLabUnlock(action.value);
    if (action.kind === 'transform') return chooseTransform(action.value);
    if (action.kind === 'rewrite') return chooseStarterRewrite(action.value);
  }

  function showCardReward(after = 'complete', premium = false) {
    if (!run) return;
    const source = rewardPool();
    const stronger = source.filter(card => ['uncommon','rare','secret'].includes(card.rarity));
    const pool = shuffle(premium && stronger.length >= BALANCE.rewardChoices ? stronger : source).slice(0, BALANCE.rewardChoices);
    run.pendingAfterReward = after;
    run.rewardChoices = pool.map(card => card.id);
    persist();
    openRitualModal(`<span class="kicker">${premium ? 'BUTIN DU PRÉVÔT' : 'LE BOSQUET VOUS A REMARQUÉ'}</span><h2>${premium ? 'Une carte renforcée échappe au Tribunal' : 'Une créature accepte de monter'}</h2><p>Choisissez une carte. Refuser garde votre deck plus précis.</p><div class="ritual-reward-grid">${pool.map(rewardChoiceMarkup).join('')}</div><div class="modal-actions"><button class="text-button" data-action="ritual-skip-reward">Ne rien prendre</button></div>`, 'reward-modal');
  }

  function takeReward(id) {
    if (!run?.rewardChoices?.includes(id)) return;
    addRunCard(id);
    const card = getCard(id);
    if (!profile.discoveredCards.includes(id)) profile.discoveredCards.push(id);
    queueCardTypeTutorial(id);
    pulseDeckCounter('gain');
    announceFeedback('gain', 'Carte ajoutée au deck', card?.name || 'Une carte monte à bord.', card);
    finishPendingReward();
  }

  function finishPendingReward() {
    const after = run?.pendingAfterReward;
    if (run) { run.pendingAfterReward = null; run.rewardChoices = null; }
    closeRitualModal();
    if (after === 'opening') return showRitualMap();
    if (after === 'boss') advanceAfterHunter(); else completeNode();
  }

  function showUpgradeChoice() {
    const states = ensureRunCardStates().filter(state => !state.dead).slice(0, 24);
    const available = states.filter(state => !run.cardInstanceMods?.[state.uid]?.tuned);
    const cardsMarkup = states.map(state => {
      const tuned = !!run.cardInstanceMods?.[state.uid]?.tuned;
      const ref = runBattleRef(state);
      return `<div class="upgrade-card-choice ${tuned ? 'already-tuned' : ''}">${ritualCardMarkup(effectiveCard(ref), tuned ? 'disabled aria-disabled="true"' : `data-ritual-upgrade="${state.uid}" title="Régler cet exemplaire une seule fois"`)}${tuned ? '<small>RÉGLAGE DÉJÀ UTILISÉ</small>' : '<small>RÉGLAGE DISPONIBLE</small>'}</div>`;
    }).join('');
    openRitualModal(`<span class="kicker">ATELIER DE L’AIGUILLE</span><h2>Réglez un passager</h2><p>Chaque carte ne peut être réglée qu’une seule fois pendant la run. Choisissez +1 Puissance ou +2 Vie.</p>${available.length ? `<div class="ritual-upgrade-list">${cardsMarkup}</div>` : '<div class="empty-workshop"><b>✓</b><strong>Tout le deck a déjà été réglé</strong><span>Cette halte ne peut plus modifier vos cartes.</span></div>'}<div class="modal-actions"><button class="text-button" data-action="ritual-complete-event">${available.length ? 'Ne rien modifier' : 'Reprendre les rails'}</button></div>`, 'upgrade-modal');
  }

  function upgradeCard(id) {
    const state = ensureRunCardStates().find(item => item.uid === id && !item.dead);
    if (!state || run.cardInstanceMods?.[id]?.tuned) return ritualToast('Cet exemplaire a déjà reçu son unique réglage de la run.');
    run.pendingUpgrade = id;
    const ref = runBattleRef(state);
    const card = effectiveCard(ref);
    openRitualModal(`<span class="kicker">ATELIER DE L’AIGUILLE</span><h2>Choisir son unique réglage</h2><p>${esc(getCard(state.cardId).name)} ne pourra plus revenir dans cet atelier pendant cette run.</p><div class="ritual-event-card">${ritualCardDisplayMarkup(card)}</div><div class="salvage-grid upgrade-branch-grid"><button data-ritual-upgrade-path="attack"><i>⚔</i><small>RÉGLAGE OFFENSIF</small><strong>+1 Puissance</strong><span>Un gain mesuré pour accélérer une voie sans écraser l’équilibrage.</span><b>Appliquer ce réglage →</b></button><button data-ritual-upgrade-path="health"><i>◇</i><small>RÉGLAGE DÉFENSIF</small><strong>+2 Vie</strong><span>Augmente les chances de survivre aux prochains combats.</span><b>Appliquer ce réglage →</b></button></div>`, 'upgrade-modal');
  }

  function chooseUpgradePath(path) {
    const uid = run?.pendingUpgrade;
    const state = ensureRunCardStates().find(item => item.uid === uid && !item.dead);
    if (!state || run.cardInstanceMods?.[uid]?.tuned || !['attack','health'].includes(path)) return;
    const ref = runBattleRef(state);
    const before = effectiveCard(ref);
    run.cardInstanceMods ||= {};
    run.cardInstanceMods[uid] ||= {};
    if (path === 'attack') run.cardInstanceMods[uid].attack = (run.cardInstanceMods[uid].attack || 0) + 1;
    else run.cardInstanceMods[uid].health = (run.cardInstanceMods[uid].health || 0) + 2;
    run.cardInstanceMods[uid].tuned = true;
    run.pendingUpgrade = null;
    const after = effectiveCard(ref);
    persist();
    announceFeedback('upgrade', 'Carte améliorée', `${after.name} change pour cette run.`, after);
    openCardChangeModal('ATELIER DE L’AIGUILLE', 'Réglage terminé', `${getCard(state.cardId).name} gagne ${path === 'attack' ? '+1 Puissance' : '+2 Vie'}. Cet exemplaire ne peut plus être réglé pendant cette run.`, before, after);
  }

  function openCardChangeModal(kicker, title, text, before, after, action = 'ritual-complete-event') {
    openRitualModal(`<span class="kicker">${esc(kicker)}</span><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="card-change-row"><div><small>AVANT</small>${ritualCardDisplayMarkup(before)}</div><b>→</b><div><small>APRÈS</small>${ritualCardDisplayMarkup(after)}</div></div><div class="modal-actions"><button class="primary-button" data-action="${action}">Continuer</button></div>`, 'card-change-modal');
  }

  function applyRouteConstraint(node) {
    const malus = MALUS_CHOICES.find(option => option.id === node?.constraintId);
    if (!run || !malus) return ritualToast('Cette contrainte de voie est illisible.');
    malus?.apply(run);
    persist();
    announceFeedback('loss', 'Malus accepté', malus?.text || 'La voie a réclamé son prix.');
    openRitualModal(`<span class="kicker">CONTRAINTE DE VOIE</span><h2>${esc(malus.name)}</h2><p>${esc(malus.text)}</p><div class="malus-impact-card"><i>${malus.icon || '◉'}</i><strong>La voie est scellée</strong><span>Le Tribunal a refermé les autres rails. Le prochain combat portera la marque de ce passage.</span></div><div class="modal-actions"><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`, 'malus-modal');
  }

  function resolveCleanseRoute() {
    if (!run) return;
    const removed = run.maluses?.shift();
    if (!removed) gainTeeth(2, 'source de brume');
    persist();
    announceFeedback(removed ? 'upgrade' : 'gain', removed ? 'Malus nettoyé' : '+2 éclats', removed ? 'La prochaine rencontre respire mieux.' : 'La source laisse des ressources sur les rails.');
    openRitualModal(`<span class="kicker">SOURCE DE BRUME</span><h2>${removed ? 'Un mauvais sceau se dissout' : 'La voie vous paie le silence'}</h2><p>${removed ? 'Le prochain combat respire mieux : un malus temporaire a été retiré.' : 'Aucun malus à nettoyer. La source laisse deux éclats sur les rails.'}</p><div class="malus-impact-card cleanse"><i>${removed ? '✦' : '♢'}</i><strong>${removed ? 'Malus retiré' : '+2 éclats'}</strong><span>Les haltes de respiration rendent les détours moins punitifs sans casser le rythme roguelite.</span></div><div class="modal-actions"><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`, 'ritual-event-modal');
  }

  function transformTargets() {
    return [...new Set(run?.deck || [])]
      .filter(id => getCard(id) && getCard(id).tribe !== 'signature' && getCard(id).rarity !== 'unique')
      .slice(0, 9);
  }

  function showTransformChoice() {
    const targets = transformTargets();
    if (!targets.length) return resolveCleanseRoute();
    run.transformOptions = targets.slice(0, BALANCE.rewardChoices).map(id => {
      const oldCard = getCard(id);
      const pool = rewardPool().filter(card => card.id !== id && card.rarity !== 'unique' && card.tribe !== 'signature' && Math.abs(cardLumenCost(card, null) - cardLumenCost(oldCard, null)) <= 1);
      return { old:id, next:(shuffle(pool)[0] || shuffle(rewardPool())[0])?.id };
    }).filter(option => option.next);
    openRitualModal(`<span class="kicker">MIROIR DE TRANSMUTATION</span><h2>Remplacer une carte de la run</h2><p>Choisissez une paire : la carte de gauche quitte le deck courant, celle de droite monte à bord.</p><div class="ritual-transform-grid">${run.transformOptions.map((option, index) => `<button data-ritual-transform="${index}"><div>${ritualCardDisplayMarkup(effectiveCard(option.old) || getCard(option.old))}</div><b>→</b><div>${ritualCardDisplayMarkup(getCard(option.next))}</div></button>`).join('')}</div><div class="modal-actions"><button class="text-button" data-action="ritual-complete-event">Ne rien changer</button></div>`, 'transform-modal');
  }

  function chooseTransform(index) {
    const option = run?.transformOptions?.[index];
    if (!option) return;
    if (!replaceRunCardInstance(option.old, option.next)) return ritualToast('Cet exemplaire n’est plus disponible pour la transmutation.');
    if (!profile.discoveredCards.includes(option.next)) profile.discoveredCards.push(option.next);
    queueCardTypeTutorial(option.next);
    run.transformOptions = null;
    persist();
    announceFeedback('merge', 'Carte transformée', `${getCard(option.old).name} devient ${getCard(option.next).name}.`, getCard(option.next));
    openCardChangeModal('MIROIR DE TRANSMUTATION', 'Le reflet devient passager', `${getCard(option.old).name} quitte cette run. ${getCard(option.next).name} rejoint le convoi.`, getCard(option.old), getCard(option.next));
  }

  function routeSecretCandidates() {
    if (!story?.routeSecrets) return [];
    return story.routeSecrets.filter(event => {
      if (profile.routeSecrets.includes(event.id)) return false;
      const thread = story.secretThreads?.find(item => item.id === event.thread);
      const progress = thread ? secretThreadProgress(thread) : null;
      return profile.truths.length >= 6 || (progress?.found || 0) > 0 || completedDialoguePairs().length >= 3;
    });
  }

  function routeSecretMissingTruth(thread) {
    const progress = thread ? secretThreadProgress(thread) : null;
    const missingTruth = progress?.requirements?.find(req => req.kind === 'truth' && !profile.truths.includes(req.id));
    return missingTruth?.id || null;
  }

  function showRouteSecretEvent() {
    const options = shuffle(routeSecretCandidates()).slice(0, BALANCE.rewardChoices);
    if (!options.length) return resolveScoutRoute();
    run.routeSecretChoices = options.map(option => option.id);
    const cards = options.map(option => {
      const thread = story.secretThreads?.find(item => item.id === option.thread);
      const progress = thread ? secretThreadProgress(thread) : null;
      const reward = getCard(option.reward);
      const status = progress ? `${progress.found}/${progress.required} preuves du fil lié` : 'dossier autonome';
      return `<button data-ritual-route-secret-choice="${esc(option.id)}">
        <i style="${routeSecretEventStyle(option.art ?? 0)}"></i>
        <small>${esc(option.tier || 'dossier vivant')}</small>
        <strong>${esc(option.title)}</strong>
        <span>${esc(option.hint)} · ${esc(status)}</span>
        ${reward ? `<b>Récompense : ${esc(reward.name)}</b>` : '<b>Indice permanent</b>'}
      </button>`;
    }).join('');
    openRitualModal(`<span class="kicker">DOSSIER VIVANT</span><h2>Un secret est monté dans le wagon</h2><p>Ces haltes ne remplacent pas l'observatoire : elles croisent les preuves pendant la run. Choisissez le dossier à suivre ; il donnera une carte et pourra débloquer une piste de second degré.</p><div class="salvage-grid route-secret-grid">${cards}</div>`, 'route-secret-modal story-modal');
  }

  function chooseRouteSecret(id) {
    if (!run?.routeSecretChoices?.includes(id)) return;
    const event = story?.routeSecrets?.find(item => item.id === id);
    if (!event) return;
    if (!profile.routeSecrets.includes(id)) profile.routeSecrets.push(id);
    if (!profile.secretThreadHints.includes(id)) profile.secretThreadHints.push(id);
    run.routeSecretChoices = null;
    const reward = grantCardToProfile(event.reward, true);
    const linkedThread = story.secretThreads?.find(item => item.id === event.thread);
    const missingTruth = routeSecretMissingTruth(linkedThread);
    if (missingTruth) markTruthReady(missingTruth);
    let threadReward = null;
    let threadResolved = false;
    if (linkedThread && !profile.secretThreads.includes(linkedThread.id) && secretThreadProgress(linkedThread).complete) {
      profile.secretThreads.push(linkedThread.id);
      threadResolved = true;
      threadReward = grantCardToProfile(linkedThread.reward, true);
    }
    run.omens++;
    persist();
    const threadLine = threadResolved
      ? `Le fil lié est complet : ${linkedThread.title} est résolu directement pendant la run.`
      : missingTruth
        ? `Une vérité liée s'est allumée dans l'observatoire : ${story.truths.find(truth => truth.id === missingTruth)?.title || missingTruth}.`
        : 'Le dossier est archivé comme preuve de route. Il comptera pour les secrets de second degré.';
    const rewardMarkup = [reward, threadReward].filter(Boolean).map(card => `<div class="ritual-event-card">${ritualCardDisplayMarkup(card)}</div>`).join('');
    if (reward) announceFeedback('gain', 'Secret converti en carte', event.title, reward);
    if (threadReward) announceFeedback('gain', 'Fil résolu en route', linkedThread?.title || 'Un fil secret répond.', threadReward);
    if (reward || threadReward) pulseDeckCounter('gain');
    openRitualModal(`<span class="kicker">DOSSIER ARCHIVÉ EN ROUTE</span><h2>${esc(event.title)}</h2><p>${esc(event.lore)}</p><div class="lore-unlock-recap"><small>DÉBLOQUÉ MAINTENANT</small><strong>${esc(event.title)}</strong><span>Le dossier est consultable dans l’Observatoire et compte comme preuve pour ses fils contradictoires.</span></div><div class="malus-impact-card scout"><i>※</i><strong>${esc(threadLine)}</strong><span>+1 Présage stellaire. Tous les trois Présages, votre score de prisme de fin de run gagne deux profondeurs virtuelles.</span></div>${rewardMarkup}<div class="modal-actions"><button class="secondary-button" data-action="ritual-observatory">Voir l'observatoire</button><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`, 'route-secret-modal story-modal');
  }

  function resolveScoutRoute() {
    const hunter = hunterForAct();
    run.scoutedHunter = hunter.id;
    run.omens++;
    const archive = run.selectedPathId === 'duel_archive';
    const confessional = run.selectedPathId === 'moonrail_confessional';
    const truthHint = confessional && profile.truths.length >= 22 ? 'last_bell_family' : archive && profile.hunterWins >= 6 ? 'dialogue_scars' : profile.truths.length >= 8 ? 'twelve_truths' : 'window_guest';
    markTruthReady(truthHint);
    persist();
    const scoutTitle = confessional ? 'Le train vous pose une question' : archive ? 'Une ancienne conversation change de sens' : 'Le prochain contrôle est lu dans la fumée';
    const scoutKicker = confessional ? 'CONFESSIONNAL DU MOONRAIL' : archive ? 'ARCHIVES DES DUELS' : 'ORACLE DES RAILS';
    const scoutText = confessional ? 'Le Moonrail compare votre conductrice aux autres réponses survivantes du cycle.' : archive ? 'Le Moonrail conserve les répliques que les boss n’osent dire qu’à certaines conductrices.' : hunter.advice;
    announceFeedback('rule', '+1 Présage stellaire', scoutText);
    openRitualModal(`<span class="kicker">${scoutKicker}</span><h2>${scoutTitle}</h2><p><strong>${esc(hunter.name)}</strong> : ${esc(hunter.rule)}</p><div class="lore-unlock-recap"><small>CE QUE VOUS VENEZ D’OBTENIR</small><strong>1 Présage stellaire + 1 piste d’Observatoire</strong><span>Le Présage améliore le potentiel du prisme de fin de run ; la piste rendra une vérité examinable lorsque sa condition sera complète.</span></div><div class="malus-impact-card scout"><i>${confessional ? '☷' : archive ? '§' : '✧'}</i><strong>${esc(scoutText)}</strong><span>Tous les trois Présages, le score du gacha gagne deux profondeurs virtuelles.</span></div><div class="modal-actions"><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`, 'ritual-event-modal');
  }

  const PACT_CHOICES = [
    { id:'bright_debt', icon:'✦', name:'Dette lumineuse', text:'Gagnez 4 éclats maintenant. Le prochain combat commence avec +2 Poursuite.', apply:r => { gainTeeth(4, 'pacte lumineux'); r.maluses.push({ id:'watching_eye', value:2 }); } },
    { id:'ember_bargain', icon:'♨', name:'Marché des braises', text:'Ajoutez une carte rare au deck. Le prochain combat commence avec -1 Lueur.', apply:r => { const card = shuffle(rewardPool().filter(c => c.rarity === 'rare'))[0]; if (card) addRunCard(card.id); r.maluses.push({ id:'short_fuse', value:1 }); } },
    { id:'thin_hand', icon:'▤', name:'Main allégée', text:'Transformez une carte commune en uncommon. Votre limite de main baisse pendant deux combats.', apply:r => { r.maluses.push({ id:'heavy_hand', value:2 }); const common = r.deck.find(id => getCard(id)?.rarity === 'common'); const next = shuffle(rewardPool().filter(c => c.rarity === 'uncommon'))[0]; if (common && next) replaceRunCardInstance(common, next.id); } }
  ];

  function showPactChoice() {
    const options = shuffle(PACT_CHOICES).slice(0, BALANCE.rewardChoices);
    run.pactChoices = options.map(option => option.id);
    openRitualModal(`<span class="kicker">PACTE À DOUBLE SCEAU</span><h2>Choisissez un contrat, pas un cadeau</h2><p>Les trois choix sont des pactes : ils ont tous un gain clair et un prix explicite. Ce n’est jamais mélangé avec une halte de bonus pur.</p><div class="salvage-grid pact-grid">${options.map(option => `<button data-ritual-pact="${option.id}"><i>${option.icon}</i><small>PACTE</small><strong>${esc(option.name)}</strong><span>${esc(option.text)}</span>${choiceImpactMarkup(pactImpactTags(option), 'mixed')}<b>Signer ce sceau →</b></button>`).join('')}</div>`, 'pact-modal');
  }

  function choosePact(id) {
    if (!run?.pactChoices?.includes(id)) return;
    const pact = PACT_CHOICES.find(option => option.id === id);
    const deckBefore = run.deck.length;
    pact?.apply(run);
    run.pactChoices = null;
    persist();
    if (run.deck.length !== deckBefore) pulseDeckCounter(run.deck.length > deckBefore ? 'gain' : 'loss');
    announceFeedback('merge', 'Pacte signé', pact?.text || 'Gain et prix appliqués.');
    openRitualModal(`<span class="kicker">PACTE SIGNÉ</span><h2>${esc(pact?.name || 'Contrat scellé')}</h2><p>${esc(pact?.text || '')}</p><div class="malus-impact-card pact"><i>${pact?.icon || '☍'}</i><strong>Gain + prix appliqués</strong><span>La lisibilité prime : le pacte est une route à part, pas un bonus mélangé à un malus.</span></div><div class="modal-actions"><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`, 'pact-modal');
  }

  const WEATHER_CHOICES = [
    { id:'moon_rain', icon:'☔', name:'Pluie de lune', text:'Pendant 2 combats, votre première carte piochée réduit la Poursuite de 1.' },
    { id:'ember_wind', icon:'♨', name:'Vent de braise', text:'Pendant 2 combats, chauffer une carte ajoute aussi +1 Puissance à votre prochain passager joué.' },
    { id:'glass_snow', icon:'◇', name:'Neige de verre', text:'Pendant 2 combats, les ennemis annoncés apparaissent plus lentement, mais gagnent +1 Vie.' }
  ];

  function showWeatherChoice() {
    run.weatherChoices = WEATHER_CHOICES.map(choice => choice.id);
    openRitualModal(`<span class="kicker">MÉTÉO LUNAIRE</span><h2>Changer le climat des deux prochains combats</h2><div class="salvage-grid weather-grid">${WEATHER_CHOICES.map(choice => `<button data-ritual-weather="${choice.id}"><i>${choice.icon}</i><small>CLIMAT · 2 COMBATS</small><strong>${esc(choice.name)}</strong><span>${esc(choice.text)}</span>${choiceImpactMarkup(weatherImpactTags(choice), 'gain')}<b>Choisir ce climat →</b></button>`).join('')}</div>`, 'weather-modal');
  }

  function chooseWeather(id) {
    if (!run?.weatherChoices?.includes(id)) return;
    const choice = WEATHER_CHOICES.find(item => item.id === id);
    run.weather = { id, value:2 };
    run.weatherChoices = null;
    persist();
    announceFeedback('rule', 'Climat fixé', `${choice.name} durera 2 combats.`);
    openRitualModal(`<span class="kicker">CLIMAT FIXÉ</span><h2>${esc(choice.name)}</h2><p>${esc(choice.text)}</p><div class="modal-actions"><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`, 'weather-modal');
  }

  function showStarterRewrite() {
    const guardianId = run.guardianId;
    const baseDeck = starterDeckForGuardian(guardianId);
    const base = baseDeck.map((old, slotIndex) => ({ old, slotIndex })).filter((option, index, list) => list.findIndex(item => item.old === option.old) === index);
    const candidates = [...new Set(run.deck)].filter(id => {
      const card = getCard(id);
      return card && card.tribe !== 'signature' && ['common','uncommon','rare'].includes(card.rarity) && !baseDeck.includes(id);
    });
    if (!base.length || !candidates.length) return resolveScoutRoute();
    run.rewriteOptions = shuffle(base).slice(0, BALANCE.rewardChoices).map((option, index) => ({ ...option, next:candidates[index % candidates.length] }));
    openRitualModal(`<span class="kicker">BUREAU DU BILLET ZÉRO</span><h2>Réécriture permanente rare</h2><p>Cette halte remplace exactement un exemplaire du deck de départ de ${esc(GUARDIANS[guardianId].name)}. Les autres doublons restent inchangés.</p><div class="ritual-transform-grid meta-rewrite-grid">${run.rewriteOptions.map((option, index) => `<button data-ritual-rewrite="${index}"><div>${ritualCardDisplayMarkup(getCard(option.old))}</div><b>⇢</b><div>${ritualCardDisplayMarkup(getCard(option.next))}</div><small>1 exemplaire · permanent pour cette conductrice</small></button>`).join('')}</div><div class="modal-actions"><button class="text-button" data-action="ritual-complete-event">Refuser</button></div>`, 'meta-modal');
  }

  function chooseStarterRewrite(index) {
    const option = run?.rewriteOptions?.[index];
    if (!option) return;
    profile.starterOverrides[run.guardianId] ||= {};
    profile.starterOverrides[run.guardianId][`slot:${option.slotIndex}`] = option.next;
    replaceRunCardInstance(option.old, option.next);
    profile.metaRewrites = (profile.metaRewrites || 0) + 1;
    run.rewriteOptions = null;
    persist();
    pulseDeckCounter('gain');
    announceFeedback('upgrade', 'Deck de départ modifié', `${getCard(option.next).name} rejoint les futures runs.`, getCard(option.next));
    openCardChangeModal('BILLET ZÉRO', 'Un billet de départ a changé', `Un seul exemplaire de ${getCard(option.old).name} sera remplacé par ${getCard(option.next).name} dans les prochaines runs de ${GUARDIANS[run.guardianId].name}.`, getCard(option.old), getCard(option.next));
  }

  function resolveForge() {
    const groups = Object.values(ensureRunCardStates().filter(state => !state.dead).reduce((acc, state) => {
      const card = getCard(state.cardId);
      if (!card || card.rarity === 'unique' || card.tribe === 'signature') return acc;
      (acc[state.cardId] ||= []).push(state);
      return acc;
    }, {})).filter(group => group.length >= 2).slice(0, BALANCE.rewardChoices);
    if (!groups.length) {
      gainTeeth(2, 'atelier silencieux');
      announceFeedback('gain', '+2 éclats', 'Aucun doublon fusionnable : compensation reçue.');
      openRitualModal(`<span class="kicker">ATELIER SILENCIEUX</span><h2>Rien ne se ressemble assez</h2><p>L’artificière vous donne 2 éclats pour le dérangement.</p><div class="modal-actions"><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`);
      return persist();
    }
    run.forgeOptions = groups.map(group => ({ cardId:group[0].cardId, survivorUid:group[0].uid, consumedUid:group[1].uid }));
    const choices = run.forgeOptions.map((option, index) => {
      const survivor = run.cardStates.find(state => state.uid === option.survivorUid);
      const card = effectiveCard(runBattleRef(survivor)) || getCard(option.cardId);
      return `<button data-ritual-forge="${index}"><div>${ritualCardDisplayMarkup(card)}${ritualCardDisplayMarkup(card)}</div><b>→</b><strong>${esc(card.name)} · +1 Puissance · +2 Vie</strong><small>Consomme exactement ces deux exemplaires</small></button>`;
    }).join('');
    persist();
    openRitualModal(`<span class="kicker">ATELIER DES DOUBLONS</span><h2>Choisissez la paire à fusionner</h2><p>Un exemplaire sert de pièces. L’autre conserve ses réglages et gagne +1 Puissance et +2 Vie pour cette run.</p><div class="forge-choice-grid">${choices}</div><div class="modal-actions"><button class="text-button" data-action="ritual-complete-event">Ne rien fusionner</button></div>`, 'forge-modal');
  }

  function chooseForge(index) {
    const option = run?.forgeOptions?.[index];
    const survivor = run?.cardStates?.find(state => state.uid === option?.survivorUid && !state.dead);
    const consumed = run?.cardStates?.find(state => state.uid === option?.consumedUid && !state.dead);
    if (!option || !survivor || !consumed || survivor.cardId !== consumed.cardId) return ritualToast('Cette paire n’est plus fusionnable.');
    const ref = runBattleRef(survivor);
    const before = effectiveCard(ref) || getCard(survivor.cardId);
    run.cardInstanceMods ||= {};
    run.cardInstanceMods[survivor.uid] ||= {};
    run.cardInstanceMods[survivor.uid].attack = (run.cardInstanceMods[survivor.uid].attack || 0) + 1;
    run.cardInstanceMods[survivor.uid].health = (run.cardInstanceMods[survivor.uid].health || 0) + 2;
    if (survivor.hp !== null) survivor.hp += 2;
    if (run.cardInstanceMods) delete run.cardInstanceMods[consumed.uid];
    run.cardStates = run.cardStates.filter(state => state.uid !== consumed.uid);
    run.deck = run.cardStates.filter(state => !state.dead).map(state => state.cardId);
    run.forgeOptions = null;
    const after = effectiveCard(ref) || getCard(survivor.cardId);
    persist();
    pulseDeckCounter('loss');
    announceFeedback('merge', 'Deux exemplaires fusionnent', `${after.name} gagne +1 Puissance et +2 Vie.`, after);
    openRitualModal(`<span class="kicker">ATELIER DES DOUBLONS</span><h2>Deux exemplaires deviennent un</h2><p>Un seul exemplaire a été consommé. Le survivant garde ses réglages précédents et reçoit le renfort de la fusion.</p><div class="fusion-change-row"><div>${ritualCardDisplayMarkup(before)}${ritualCardDisplayMarkup(before)}</div><b>→</b><div>${ritualCardDisplayMarkup(after)}<strong>+1 PUISSANCE · +2 VIE</strong></div></div><div class="modal-actions"><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`, 'forge-modal fusion-result-modal');
  }

  function shopPrice(card) {
    const rarityBase = { common:2, uncommon:3, rare:5, secret:7, unique:8 }[card?.rarity] || 3;
    const statTax = Math.max(0, Math.floor((Number(card?.attack || 0) + Number(card?.health || 0) - 4) / 4));
    return rarityBase + statTax + Math.max(0, (card?.sigils?.length || 0) - 1);
  }

  function showRitualShop() {
    const offers = shuffle(rewardPool()).slice(0, BALANCE.rewardChoices);
    run.shopChoices = offers.map(card => card.id);
    openRitualModal(`<span class="kicker">MARCHANDE DE DENTS</span><h2>« Je n’accepte que ce qui a fait mal. »</h2><div class="ritual-shop-wallet">♢ ${run.teeth} éclats disponibles · prix selon rareté et puissance</div><div class="ritual-reward-grid">${offers.map(card => { const price = shopPrice(card); return `<div>${ritualCardDisplayMarkup(card)}<button data-ritual-buy="${card.id}" ${run.teeth < price ? 'disabled' : ''}>${price} éclats</button></div>`; }).join('')}</div><div class="modal-actions"><button class="text-button" data-action="ritual-complete-event">Partir</button></div>`, 'reward-modal');
  }

  function buyRitualCard(id) {
    const card = getCard(id), price = shopPrice(card);
    if (!run?.shopChoices?.includes(id) || run.teeth < price) return;
    run.teeth -= price; addRunCard(id); run.shopChoices = null;
    queueCardTypeTutorial(id);
    pulseElement('#hud-tickets', 'loss');
    pulseDeckCounter('gain');
    announceFeedback('gain', 'Carte achetée', `${card?.name || 'Carte'} rejoint le deck pour ${price} éclats.`, card);
    closeRitualModal(); completeNode();
  }

  function resolveSecretPath() {
    run.secretVisits++; profile.secretVisits++;
    run.switchChoices = SWITCH_CHOICES.map(choice => choice.id);
    const repeatText = run.secretVisits >= 2
      ? 'La deuxième visite peut allumer la voie blanche dans l’observatoire, mais seulement si vous choisissez de suivre le fil.'
      : 'Premier passage : l’aiguillage donne surtout une décision de trajectoire, pas un jackpot.';
    openRitualModal(`<span class="kicker">AIGUILLAGE IMPOSSIBLE</span><h2>Trois leviers, aucune voie sûre</h2><p>Cette halte est maintenant un vrai choix entre deux combats : information, ressources risquées ou manipulation de la prochaine carte de routes. ${esc(repeatText)}</p><div class="salvage-grid switch-grid">${SWITCH_CHOICES.map(choice => `<button data-ritual-switch="${choice.id}"><i>${choice.icon}</i><small>AIGUILLAGE · CHOIX</small><strong>${esc(choice.name)}</strong><span>${esc(choice.text)}</span>${choiceImpactMarkup(switchImpactTags(choice), 'mixed')}<b>Actionner ce levier →</b></button>`).join('')}</div>`, 'switch-modal story-modal');
    persist();
  }

  function chooseSecretSwitch(id) {
    if (!run?.switchChoices?.includes(id)) return;
    const choice = SWITCH_CHOICES.find(item => item.id === id);
    choice?.apply(run);
    run.switchChoices = null;
    const secretLine = id === 'white_thread' && run.secretVisits >= 2
      ? 'Une vérité de voie blanche vient de s’allumer. Ce n’est pas une carte gratuite : c’est une piste de méta-progression.'
      : id === 'silent_switch'
        ? 'La prochaine proposition de routes favorisera les haltes non-combat, si le contrôle céleste ne tombe pas immédiatement.'
        : 'Vous repartez avec un avantage clair et un prix lisible.';
    persist();
    announceFeedback('rule', 'Aiguillage actionné', choice?.text || secretLine);
    openRitualModal(`<span class="kicker">AIGUILLAGE ACTIONNÉ</span><h2>${esc(choice?.name || 'Levier tiré')}</h2><p>${esc(choice?.text || '')}</p><div class="malus-impact-card scout"><i>${choice?.icon || '?'}</i><strong>${esc(secretLine)}</strong><span>Indice plutôt que jackpot : cette route modifie la trajectoire, les ressources ou l’information, pas votre deck par magie.</span></div><div class="modal-actions"><button class="primary-button" data-action="ritual-complete-event">Reprendre les rails</button></div>`, 'switch-modal story-modal');
  }

  async function showRitualTravelAnimation(fromStep, toStep, options = {}) {
    const overlay = document.createElement('div');
    overlay.className = 'travel-overlay ritual-travel-overlay';
    const label = options.label || `Arrêt ${fromStep + 1} → ${toStep + 1}`;
    const text = options.text || 'La carte de route se recalcule pendant que le train change d’aiguillage.';
    overlay.innerHTML = `<div class="travel-card"><small>MOONRAIL EN MOUVEMENT</small><strong>${esc(label)}</strong><div class="travel-track"><span></span><i class="origin"></i><i class="passed"></i><i class="destination"></i><b>🚂</b></div><p>${esc(text)}</p></div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('visible'));
    await wait(850);
    overlay.classList.remove('visible');
    await wait(180);
    overlay.remove();
  }

  async function completeNode() {
    if (!run) return;
    const fromStep = run.step;
    run.daysLeft--; run.step++;
    advanceRouteGraph(); persist();
    await showRitualTravelAnimation(fromStep, run.step);
    showRitualMap();
  }

  function encounterForBattle(isHunter, isMiniboss = false) {
    if (isHunter) {
      const hunter = hunterForAct();
      return { id:hunter.id, name:hunter.name, deck:HUNTER_DECKS[hunter.id] || HUNTER_DECKS.controleur, pressure:2 + run.act, boss:true, rule:hunter.rule, ruleKey:hunter.ruleKey, startPursuit:hunter.startPursuit || 0 };
    }
    if (isMiniboss) {
      const candidates = MINIBOSS_ENCOUNTERS.filter(encounter => encounter.pressure <= run.act + 2);
      return { ...candidates[Math.floor(ritualRandom() * candidates.length)], miniboss:true };
    }
    const candidates = ENCOUNTERS.filter(encounter => encounter.pressure <= run.act + 1);
    return candidates[Math.floor(ritualRandom() * candidates.length)];
  }

  function instantiate(id, owner = 'player') {
    const ref = id;
    const cardId = cardIdOf(ref);
    const card = owner === 'player' ? (effectiveCard(ref) || getCard(ref)) : getCard(ref);
    if (!card) return null;
    if (card.rarity !== 'offering' && !profile.discoveredCards.includes(cardId)) profile.discoveredCards.push(cardId);
    let health = card.health;
    let attack = card.attack;
    const state = owner === 'player' ? runCardState(ref) : null;
    if (state && state.hp !== null) health = clamp(state.hp, 1, Math.max(1, card.health));
    if (owner === 'player' && run.guardianId === 'kaguya' && cardLumenCost(card, null) >= 3) attack++;
    if (owner === 'player' && card.sigils?.includes('hoard') && run?.battle?.hand?.length >= currentHandLimit() - 1) attack++;
    if (owner === 'enemy') {
      const depth = (run?.act || 0) * BALANCE.stopsPerControl + (run?.step || 0);
      const elite = run?.battle?.isMiniboss ? 1 : 0;
      const boss = run?.battle?.isHunter ? Math.floor((run?.act || 0) / 2) : 0;
      attack += Math.floor(depth / 8) + elite + boss;
      health += Math.floor(depth / 6) + elite + boss;
    }
    return { uid:`${owner}-${Date.now()}-${Math.random()}`, cardId, runUid:state?.uid || null, ref, hp:health, maxHp:owner === 'enemy' ? health : card.health, attack, sigils:[...(card.sigils || [])], owner };
  }


  function playerUnits() {
    return run?.battle?.playerBoard?.filter(Boolean) || [];
  }

  function activePlayerUnit(cardId) {
    return playerUnits().find(unit => unit.cardId === cardId) || null;
  }

  function activePlayerLane(cardId) {
    return run?.battle?.playerBoard?.findIndex(unit => unit?.cardId === cardId) ?? -1;
  }

  function triggerLastWordSecret(cardId, message) {
    const battle = run?.battle;
    if (!battle) return false;
    battle.secretLastWords ||= {};
    if (battle.secretLastWords[cardId]) return false;
    battle.secretLastWords[cardId] = true;
    battle.signatureBursts ||= [];
    battle.signatureBursts.push({ id:cardId, name:LAST_WORD_SECRET_NAMES[cardId], turn:battle.turn });
    pushCombatEvent('secret', LAST_WORD_SECRET_NAMES[cardId] || 'Secret éveillé', message || 'Un effet caché vient de se révéler.', activePlayerLane(cardId));
    if (message) ritualToast(message);
    return true;
  }

  function healUnit(unit, amount = 1, alsoMax = false) {
    if (!unit) return;
    if (alsoMax) unit.maxHp += amount;
    unit.hp = Math.min(unit.maxHp, unit.hp + amount);
    syncRunCardHealth(unit);
  }

  function healMostWoundedPlayer(amount = 1) {
    const wounded = playerUnits().filter(unit => unit.hp < unit.maxHp).sort((a, b) => (a.hp / a.maxHp) - (b.hp / b.maxHp))[0];
    healUnit(wounded, amount);
  }

  function damageEnemyInLane(lane, amount) {
    const battle = run?.battle;
    const target = battle?.enemyBoard?.[lane];
    if (!target) return false;
    target.hp -= amount;
    battle.fx = { side:'player', lane, text:`-${amount} sceau` };
    if (target.hp <= 0) killUnit(target, lane, 'enemy');
    return true;
  }

  function resolveZeroHealthArrival(unit, lane) {
    const battle = run?.battle;
    if (!battle || !unit || unit.owner !== 'player' || unit.hp > 0) return false;
    const target = battle.enemyBoard[lane];
    let changed = false;
    if (unit.attack > 0) {
      if (target) {
        target.hp -= unit.attack;
        battle.fx = { side:'player', lane, text:`-${unit.attack} éclat` };
        if (target.hp <= 0) killUnit(target, lane, 'enemy');
      } else {
        battle.progress += Math.min(2, unit.attack);
        battle.fx = { side:'player', lane, text:`+${Math.min(2, unit.attack)} passage` };
      }
      changed = true;
    }
    if (target?.hp > 0 && unit.sigils.includes('thorns')) {
      target.hp -= 1;
      battle.fx = { side:'player', lane, text:'verre -1' };
      if (target.hp <= 0) killUnit(target, lane, 'enemy');
      changed = true;
    }
    if (target?.hp > 0 && unit.sigils.includes('guardian')) {
      target.attack = Math.max(0, target.attack - 1);
      battle.fx = { side:'player', lane, text:'leurre -1' };
      changed = true;
    }
    if (changed) ritualToast(`${getCard(unit.cardId)?.name || 'Une carte fragile'} se brise en effet instantané.`);
    return changed;
  }

  function triggerBossRule(text, lane = 1) {
    const battle = run?.battle;
    if (!battle?.isHunter || !text) return;
    battle.bossRuleFx = { text, lane, at: Date.now() };
    battle.fx = { side:'enemy', lane:clamp(lane, 0, BALANCE.lanes - 1), text:'RÈGLE' };
    pushCombatEvent('rule', 'Règle boss', text, clamp(lane, 0, BALANCE.lanes - 1));
    ritualToast(`Règle boss · ${text}`);
  }

  function applySignatureOnSummon(unit, lane, cardId) {
    const battle = run?.battle;
    if (!battle || !unit || unit.owner !== 'player') return;
    const adjacent = [lane - 1, lane + 1].filter(index => index >= 0 && index < BALANCE.lanes);
    switch (cardId) {
      case 'spell_ayame_seal':
        adjacent.forEach(index => healUnit(battle.playerBoard[index], 1, true));
        battle.pursuit = Math.max(0, battle.pursuit - 1);
        battle.fx = { side:'player', lane, text:'Sceau -1' };
        break;
      case 'spell_ayame_boundary':
        playerUnits().forEach(ally => healUnit(ally, 1, true));
        battle.pursuit = Math.max(0, battle.pursuit - 2);
        battle.fx = { side:'player', lane, text:'Frontiere -2' };
        break;
      case 'spell_kohana_gearfox':
        drawOneRitualCard();
        if (battle.stokesThisBattle > 0) battle.lumen++;
        battle.fx = { side:'player', lane, text:'Rouage' };
        break;
      case 'spell_kohana_parade':
        for (let i = 0; i < 2 && battle.hand.length < currentHandLimit(); i++) drawOneRitualCard();
        battle.lumen++;
        battle.fx = { side:'player', lane, text:'+1 Lueur' };
        break;
      case 'spell_rinka_red_sun':
        battle.progress++;
        if (battle.enemyBoard[lane]) unit.attack++;
        battle.fx = { side:'player', lane, text:'+1 rail' };
        break;
      case 'spell_rinka_petals':
        battle.progress += 2;
        damageEnemyInLane(lane, 2);
        battle.fx = { side:'player', lane, text:'+2 rail' };
        break;
      case 'spell_eir_mist':
        battle.pursuit = Math.max(0, battle.pursuit - 1);
        healMostWoundedPlayer(1);
        battle.fx = { side:'player', lane, text:'Brume -1' };
        break;
      case 'spell_eir_night':
        battle.pursuit = Math.max(0, battle.pursuit - 2);
        playerUnits().forEach(ally => healUnit(ally, 1));
        battle.fx = { side:'player', lane, text:'Nuit -2' };
        break;
      case 'spell_kaguya_orbit': {
        const heavy = playerUnits().filter(ally => cardLumenCost(getCard(ally.cardId), null) >= 3).length;
        battle.progress += heavy;
        battle.fx = { side:'player', lane, text:`+${heavy} orbite` };
        break;
      }
      case 'spell_kaguya_palace': {
        const occupied = playerUnits();
        battle.progress += occupied.length;
        occupied.forEach(ally => healUnit(ally, 1, true));
        battle.fx = { side:'player', lane, text:`+${occupied.length} palais` };
        break;
      }
      case 'spell_vespera_red_moon': {
        const mirrors = battle.hand.filter(ref => cardIdOf(ref) === cardId).length + playerUnits().filter(ally => ally !== unit && ally.cardId === cardId).length;
        battle.pursuit++;
        unit.attack += Math.min(3, mirrors);
        battle.fx = { side:'player', lane, text:`+${Math.min(3, mirrors)} reflet` };
        break;
      }
      case 'spell_vespera_hundred':
        battle.pursuit++;
        unit.attack += 2;
        if (!battle.hand.some(ref => cardIdOf(ref) === cardId) && battle.hand.length < currentHandLimit()) battle.hand.push({ cardId, temporary:true });
        battle.fx = { side:'player', lane, text:'+2 lune' };
        break;
    }
  }

  function applyDepartureLastWordSecrets() {
    const battle = run?.battle;
    const palaceLane = activePlayerLane('spell_kaguya_palace');
    if (battle && palaceLane >= 0 && battle.playerBoard.every(Boolean) && triggerLastWordSecret('spell_kaguya_palace', 'Une porte sans poignée s’ouvre dans le Palais du Dragon.')) {
      battle.progress += 3;
      battle.fx = { side:'player', lane:palaceLane, text:'+3 secret' };
      return true;
    }
    return false;
  }

  function triggerKohanaParadeSecretOnReshuffle() {
    const battle = run?.battle;
    const lane = activePlayerLane('spell_kohana_parade');
    if (battle && lane >= 0 && triggerLastWordSecret('spell_kohana_parade', 'Un rouage absent remet la pioche en marche.')) {
      battle.lumen += 2;
      battle.fx = { side:'player', lane, text:'+2 secret' };
    }
  }

  function preventDefeatWithAyameSecret() {
    const battle = run?.battle;
    const lane = activePlayerLane('spell_ayame_boundary');
    const boundary = lane >= 0 ? battle.playerBoard[lane] : null;
    if (!battle || !boundary || battle.pursuit < BALANCE.progressGoal) return false;
    if (!triggerLastWordSecret('spell_ayame_boundary', 'La frontière refuse ce matin-là.')) return false;
    battle.pursuit = BALANCE.progressGoal - 1;
    boundary.hp = Math.max(1, boundary.hp - 2);
    syncRunCardHealth(boundary);
    battle.fx = { side:'player', lane, text:'refus secret' };
    return true;
  }

  function startBattle(isHunter, isMiniboss = false, isOpening = false) {
    const encounter = encounterForBattle(isHunter, isMiniboss);
    const battleDeck = shuffle(ensureRunCardStates().map(runBattleRef));
    run.battle = {
      encounter, isHunter, isMiniboss, isOpening, deck:battleDeck, discard:[], hand:[],
      playerBoard:Array(BALANCE.lanes).fill(null), enemyBoard:Array(BALANCE.lanes).fill(null), forecast:Array(BALANCE.lanes).fill(null),
      selectedHand:null, progress:0, pursuit:(encounter.startPursuit || 0) + (run.maluses || []).filter(malus => malus.id === 'watching_eye').reduce((sum, malus) => sum + malus.value, 0),
      lumen:baseLumenForRun(), ashes:0, casualties:[],
      turn:1, drawUsed:true, stokedThisTurn:false, stokesThisBattle:0, nextLumen:0, resolving:false, firstDeathReturned:false, firstCardPlayed:false,
      secretLastWords:{}, signatureBursts:[], bossRuleFx:null, weather:run.weather?.id || null, timeline:[], eventSeq:0
    };
    pushCombatEvent(isHunter ? 'rule' : isMiniboss ? 'rule' : 'start', isHunter ? 'Contrôle céleste' : isMiniboss ? 'Prévôt du Tribunal' : 'Incident de voie', encounter.name);
    drawRitualCards(BALANCE.openingHand);
    if (encounter.boss && encounter.startPursuit) run.battle.bossRuleFx = { text:`Départ sous pression : +${encounter.startPursuit} Poursuite.`, lane:1, at:Date.now() };
    seedEnemyBoard(); generateForecast(); persist(); showRitualBattle();
    if (isHunter) showBossIntroModal();
    else if (!profile.tutorialSeen) showRitualTutorial();
  }

  function dialogueShortName(entity, fallback = 'La conductrice') {
    const raw = entity?.name || entity?.id || fallback;
    return raw.split(',')[0] || fallback;
  }

  function loreUnlocked(id) {
    return !!id && (profile.truths.includes(id) || !!profile[`ready_${id}`]);
  }

  function fillDialogueTemplate(text, guardian, hunter) {
    const values = {
      player: dialogueShortName(guardian, 'La conductrice'),
      boss: dialogueShortName(hunter, 'Le contrôle céleste'),
      train: 'Moonrail'
    };
    return String(text || '').replace(/\{(player|boss|train)\}/g, (_, key) => values[key] || '');
  }

  function relationshipKey(firstId, secondId) {
    const order = Object.keys(GUARDIANS);
    return [firstId, secondId].sort((a, b) => order.indexOf(a) - order.indexOf(b)).join('|');
  }

  function relationshipRepriseDialogue(stage, playerId, bossId) {
    if (!dialoguePairComplete(dialoguePairId(playerId, bossId))) return null;
    const entry = RELATIONSHIP_REPRISES[relationshipKey(playerId, bossId)];
    const lines = entry?.[stage];
    if (!lines?.[playerId] || !lines?.[bossId]) return null;
    return [lines[playerId], lines[bossId]];
  }

  function dialogueVariantPriority(item) {
    return (item.memory ? 120 : 0)
      + (item.pair ? 70 : 0)
      + (item.player ? 35 : 0)
      + (item.boss ? 35 : 0)
      + (item.truth ? 20 : 0)
      + (item.minHunterWins ? Math.min(15, item.minHunterWins) : 0);
  }

  function conditionalBossDialogue(stage, hunter) {
    const guardian = GUARDIANS[run?.guardianId];
    const playerId = run?.guardianId;
    const bossId = hunter?.id;
    const variants = BOSS_DIALOGUE_VARIANTS.filter(item => {
      if (item.stage !== stage) return false;
      if (item.pair && !(item.pair.includes(playerId) && item.pair.includes(bossId))) return false;
      if (item.player && item.player !== playerId) return false;
      if (item.boss && item.boss !== bossId) return false;
      if (item.truth && !loreUnlocked(item.truth)) return false;
      if (item.memory && !profile.relationshipMemories.includes(item.memory)) return false;
      if (item.minHunterWins && (profile.hunterWins || 0) < item.minHunterWins) return false;
      return true;
    }).sort((a, b) => dialogueVariantPriority(b) - dialogueVariantPriority(a));
    const variant = variants[0];
    if (!variant) return null;
    const playerLine = variant.lines?.[playerId] || variant.playerLine;
    const bossLine = variant.lines?.[bossId] || variant.bossLine;
    return [fillDialogueTemplate(playerLine, guardian, hunter), fillDialogueTemplate(bossLine, guardian, hunter)];
  }

  function bossDialoguePair(stage, hunter) {
    const pair = BOSS_DIALOGUE_MATRIX[run?.guardianId]?.[hunter?.id];
    const secretVariant = conditionalBossDialogue(stage, hunter);
    if (secretVariant) return secretVariant;
    const reprise = relationshipRepriseDialogue(stage, run?.guardianId, hunter?.id);
    if (reprise) return reprise;
    if (pair?.[stage]) return pair[stage];
    return null;
  }

  function dialoguePairId(playerId = run?.guardianId, bossId = null) {
    return playerId && bossId ? `${playerId}:${bossId}` : '';
  }

  function recordBossDialogue(stage, hunter) {
    const pair = dialoguePairId(run?.guardianId, hunter?.id);
    if (!pair || !stage) return;
    const keys = [`${pair}:${stage}`];
    if (stage === 'after') keys.push(`${pair}:complete`);
    let changed = false;
    for (const key of keys) {
      if (!profile.dialogueArchive.includes(key)) {
        profile.dialogueArchive.push(key);
        changed = true;
      }
    }
    if (changed) persist();
  }

  function completedDialoguePairs() {
    return [...new Set((profile.dialogueArchive || [])
      .filter(key => key.endsWith(':complete'))
      .map(key => key.replace(/:complete$/, '')))];
  }

  function dialoguePairComplete(pair) {
    return !!pair && profile.dialogueArchive.includes(`${pair}:complete`);
  }

  function bossDialogueLine(stage, hunter) {
    const pairDialogue = bossDialoguePair(stage, hunter);
    if (pairDialogue) return pairDialogue;
    const guardian = GUARDIANS[run?.guardianId];
    const rival = BOSS_DIALOGUES[hunter?.id] || {};
    const playerBefore = {
      controleur:'Ayame garde une main sur la cloche. « Si mon propre sceau se dresse sur la voie, je saurai enfin ce qu’il protège. »',
      mecano:'Kohana tapote le tableau de bord. « Les dieux aiment les machines obéissantes. Dommage, j’ai retiré cette pièce. »',
      rinka:'Rinka sourit à la poursuite. « Qu’ils viennent. Un train lancé est juste un dojo avec plus de vitesse. »',
      eir:'Eir suit la buée du doigt. « Chaque contrôle laisse un symptôme. Je vais lire celui-ci. »',
      kaguya:'Kaguya serre le frein astral. « Si le ciel veut juger l’Étincelle, qu’il commence par descendre à ma hauteur. »',
      vespera:'Vespera regarde la lune absente. « On ne rend pas une couronne à ceux qui l’utilisent comme une cage. »'
    };
    const playerAfter = {
      controleur:'Ayame range son ofuda sans trembler. « Chaque victoire rend la prière moins simple. »',
      mecano:'Kohana note la règle cassée dans sa manche. « Très bien, Moonrail. Tu as encore une panne intéressante. »',
      rinka:'Rinka essuie la suie de sa lame. « La prochaine fois, je veux deux dieux à la fois. »',
      eir:'Eir écoute le silence après l’impact. « La maladie du matin a peur du mouvement. C’est déjà un diagnostic. »',
      kaguya:'Kaguya baisse les yeux vers la chaudière. « Les astres mentent moins quand on les oblige à courir. »',
      vespera:'Vespera rit doucement. « La nuit commence enfin à ressembler à une rébellion. »'
    };
    return stage === 'after'
      ? [playerAfter[run?.guardianId] || `${guardian?.name || 'La conductrice'} reprend le contrôle du convoi.`, rival.after || 'Le dieu vaincu recule, mais son regard reste accroché à la locomotive.']
      : [playerBefore[run?.guardianId] || `${guardian?.name || 'La conductrice'} serre les commandes du Moonrail.`, rival.before || 'Une silhouette céleste se place sur la voie et impose sa règle.'];
  }

  function bossDialogueMarkup(stage, hunter) {
    const guardian = GUARDIANS[run?.guardianId];
    const [playerLine, bossLine] = bossDialogueLine(stage, hunter);
    const rule = hunter?.rule || run?.battle?.encounter?.rule || '';
    return `<div class="boss-dialogue-grid">
      <article class="boss-dialogue-card player">${guardianPortraitMarkup(run.guardianId, 'dialogue-portrait')}<small>VOTRE CONDUCTRICE</small><strong>${esc(guardian?.name || 'Conductrice')}</strong><p>${esc(playerLine)}</p></article>
      <article class="boss-dialogue-card boss">${guardianPortraitMarkup(hunter?.id || 'controleur', 'dialogue-portrait')}<small>CONTRÔLE CÉLESTE</small><strong>${esc(hunter?.name || run?.battle?.encounter?.name || 'Boss')}</strong><p>${esc(bossLine)}</p></article>
      ${stage === 'before' ? `<aside class="boss-rule-spotlight"><b>RÈGLE SPÉCIALE</b><span>${esc(rule)}</span></aside>` : ''}
    </div>`;
  }

  function showBossIntroModal() {
    const battle = run?.battle;
    if (!battle?.isHunter) return;
    const hunter = hunterForAct();
    const dialogue = bossDialogueMarkup('before', hunter);
    recordBossDialogue('before', hunter);
    openRitualModal(`<span class="kicker">RENCONTRE DE CONDUCTRICES</span><h2>${esc(hunter.name)}</h2>${dialogue}<div class="modal-actions"><button class="primary-button large" data-action="ritual-modal-close">Entrer en duel</button></div>`, 'boss-dialogue-modal');
  }

  function showBossOutroDialogue(bossLoot) {
    const hunter = story?.hunters?.find(item => item.id === bossLoot?.replace('boss_', '').replace('_technique', '')) || hunterForAct();
    const dialogue = bossDialogueMarkup('after', hunter);
    recordBossDialogue('after', hunter);
    openRitualModal(`<span class="kicker">CONTRÔLE BRISÉ</span><h2>La voie s’ouvre une seconde</h2>${dialogue}<div class="modal-actions"><button class="primary-button large" data-action="ritual-boss-reward">Récupérer le butin du boss</button></div>`, 'boss-dialogue-modal');
  }

  function seedEnemyBoard() {
    const battle = run.battle, amount = battle.isHunter ? 2 : 1;
    for (let i = 0; i < amount; i++) {
      const lane = (i * 2 + Math.floor(ritualRandom() * 2)) % BALANCE.lanes;
      const id = battle.encounter.deck[Math.floor(ritualRandom() * battle.encounter.deck.length)];
      battle.enemyBoard[lane] = instantiate(id, 'enemy');
    }
  }

  function generateForecast() {
    const battle = run.battle;
    battle.forecast = Array(BALANCE.lanes).fill(null);
    const open = Array.from({ length:BALANCE.lanes }, (_, index) => index).filter(index => !battle.enemyBoard[index]);
    const snowSlow = battle.weather === 'glass_snow';
    const amount = Math.min(open.length, battle.isHunter && battle.turn > 1 && !snowSlow ? 2 : 1);
    shuffle(open).slice(0, amount).forEach(lane => {
      const id = battle.encounter.deck[Math.floor(ritualRandom() * battle.encounter.deck.length)];
      const unit = instantiate(id, 'enemy');
      if (snowSlow) { unit.hp++; unit.maxHp++; }
      if (battle.encounter.ruleKey === 'sky_drop' && unit.sigils.includes('airborne') && !battle.enemyBoard[lane]) {
        battle.enemyBoard[lane] = unit;
        triggerBossRule('Une unité aérienne saute la rangée annoncée.', lane);
      }
      else battle.forecast[lane] = unit;
    });
    if (battle.encounter.ruleKey === 'mirror_copy' && battle.turn === 2) {
      const strongest = battle.playerBoard.filter(Boolean).sort((a,b) => (b.attack + b.hp) - (a.attack + a.hp))[0];
      const lane = battle.forecast.findIndex((unit, index) => !unit && !battle.enemyBoard[index]);
      if (strongest && lane >= 0) {
        const reflection = instantiate(strongest.cardId, 'enemy');
        reflection.attack = strongest.attack; reflection.hp = strongest.maxHp; reflection.maxHp = strongest.maxHp;
        battle.forecast[lane] = reflection;
        triggerBossRule('Un reflet copie votre passager le plus fort.', lane);
      }
    }
    if (battle.encounter.ruleKey === 'gear_summon' && battle.turn > 1 && ritualRandom() < .42) {
      const lane = battle.forecast.findIndex((unit, index) => !unit && !battle.enemyBoard[index]);
      if (lane >= 0) {
        battle.forecast[lane] = instantiate('clock_harpy', 'enemy');
        triggerBossRule('Un automate supplémentaire entre dans l’horaire.', lane);
      }
    }
  }

  function showRitualBattle() {
    showRitualScreen('ritual-battle'); renderRitualBattle();
  }

  function renderRitualBattle() {
    const battle = run?.battle;
    if (!battle) return showRitualMap();
    $('#ritual-encounter-kicker').textContent = battle.isHunter ? `CONTRÔLE CÉLESTE · LIGNE ${run.act + 1}` : battle.isMiniboss ? `MINIBOSS · ARRÊT ${run.step + 1}` : `INCIDENT DE VOIE · ARRÊT ${run.step + 1}`;
    $('#ritual-enemy-name').textContent = battle.encounter.name;
    const guardian = GUARDIANS[run.guardianId];
    const badge = $('#battle-guardian-badge');
    if (badge && guardian) badge.innerHTML = `${guardianPortraitMarkup(run.guardianId, 'battle-guardian-portrait')}<span><small>CONDUCTRICE</small><b>${esc(guardian.name)}</b></span>`;
    $('#ritual-turn').textContent = battle.turn;
    $('#ritual-draw-count').textContent = battle.deck.length;
    $('#ritual-lumen').textContent = battle.lumen;
    $('#ritual-ashes') && ($('#ritual-ashes').textContent = battle.ashes || 0);
    const selected = battle.selectedHand === null ? null : effectiveCard(battle.hand[battle.selectedHand]) || getCard(battle.hand[battle.selectedHand]);
    const progressRatio = battle.progress / BALANCE.progressGoal * 100;
    const pursuitRatio = battle.pursuit / BALANCE.progressGoal * 100;
    const previousProgressRatio = battle.uiProgressRatio ?? progressRatio;
    const previousPursuitRatio = battle.uiPursuitRatio ?? pursuitRatio;
    const bossBanner = battle.isHunter ? `<div class="boss-rule-banner ${battle.bossRuleFx ? 'active' : ''}"><b>RÈGLE BOSS</b><span>${esc(battle.bossRuleFx?.text || battle.encounter.rule || 'Surveillez les activations de la conductrice adverse.')}</span></div>` : '';
    const weatherBanner = battle.weather ? `<div class="weather-rule-banner"><b>CLIMAT</b><span>${esc(WEATHER_CHOICES.find(item => item.id === battle.weather)?.name || 'Météo lunaire')}</span></div>` : '';
    $('#ritual-balance').innerHTML = `<div class="combat-life-bars"><div class="combat-life-bar player"><header><span>VOUS · MOONRAIL</span><b>${battle.progress}/${BALANCE.progressGoal}</b></header><div class="health-track"><i class="health-fill" style="--from:${clamp(previousProgressRatio, 0, 100)}%;--to:${clamp(progressRatio, 0, 100)}%;width:${clamp(progressRatio, 0, 100)}%"></i></div></div><div class="combat-life-vs">VS</div><div class="combat-life-bar enemy"><header><span>ADVERSAIRE · POURSUITE</span><b>${battle.pursuit}/${BALANCE.progressGoal}</b></header><div class="health-track"><i class="health-fill enemy" style="--from:${clamp(previousPursuitRatio, 0, 100)}%;--to:${clamp(pursuitRatio, 0, 100)}%;width:${clamp(pursuitRatio, 0, 100)}%"></i></div></div></div><div class="combat-rule-line">${bossBanner}${weatherBanner}</div>`;
    battle.uiProgressRatio = progressRatio;
    battle.uiPursuitRatio = pursuitRatio;
    $('#ritual-enemy-forecast').innerHTML = battle.forecast.map((unit, lane) => ritualSlotMarkup(unit, lane, 'forecast')).join('');
    const laneReadout = $('#ritual-lane-readout');
    if (laneReadout) laneReadout.innerHTML = laneReadoutMarkup(battle);
    $('#ritual-enemy-board').innerHTML = battle.enemyBoard.map((unit, lane) => ritualSlotMarkup(unit, lane, 'enemy')).join('');
    $('#ritual-player-board').innerHTML = battle.playerBoard.map((unit, lane) => ritualSlotMarkup(unit, lane, 'player')).join('');
    const feed = $('#ritual-combat-feed');
    if (feed) feed.innerHTML = combatFeedMarkup(battle);
    $('#ritual-hand').innerHTML = battle.hand.map((id, index) => ritualCardMarkup(effectiveCard(id) || getCard(id), `data-ritual-hand="${index}" draggable="true" aria-pressed="${battle.selectedHand === index}"`, null)).join('');
    document.querySelectorAll('[data-ritual-draw]').forEach(button => {
      button.disabled = true;
      const small = button.querySelector('small');
      if (small) small.textContent = `Défausse ${battle.discard.length}`;
    });
    $('#ritual-bell').disabled = battle.resolving;
    const stokeButton = document.querySelector('button[data-action="ritual-stoke"]');
    if (stokeButton) {
      stokeButton.disabled = battle.resolving || battle.selectedHand === null;
      stokeButton.querySelector('strong').textContent = battle.stokedThisTurn ? '0' : `+${BALANCE.stokeGain}`;
      stokeButton.querySelector('small').textContent = battle.stokedThisTurn ? 'Détruire' : 'Chauffer';
    }
    $('#ritual-hint').innerHTML = battleCoachMarkup(selected);
  }

  function selectedPlacementCard() {
    const battle = run?.battle;
    if (!battle || battle.resolving || battle.selectedHand === null) return null;
    const id = battle.hand[battle.selectedHand];
    const card = effectiveCard(id) || getCard(id);
    if (!card) return null;
    const resource = cardAffordable(card, battle);
    return { id, card, cost:resource.amount, resource, affordable:resource.affordable, missing:resource.missing };
  }

  function placementPreviewMarkup(lane, side, occupied = false) {
    const selected = selectedPlacementCard();
    if (side !== 'player' || !selected) return { className:'', html:'' };
    if (occupied) return {
      className:' placement-overwrite',
      html:`<em class="placement-preview overwrite"><b>Remplacer ?</b><span>La carte en place mourra pour la run</span></em>`
    };
    const state = selected.affordable ? 'ready' : 'blocked';
    const title = selected.affordable ? 'Poser ici' : `Manque ${selected.missing} ${selected.resource.label}${selected.missing > 1 ? 's' : ''}`;
    const stats = `${selected.card.attack} Puissance · ${selected.card.health} Vie`;
    return {
      className:` placement-${state}`,
      html:`<em class="placement-preview ${state}"><b>${esc(title)}</b><span>${selected.resource.icon}${selected.cost} · ${esc(stats)}</span></em>`
    };
  }

  function ritualUnitName(unit) {
    if (!unit) return 'Voie vide';
    const card = getCard(unit.cardId);
    return card?.name || unit.cardId || 'Entité inconnue';
  }

  function laneSignalFor(battle, lane) {
    const player = battle.playerBoard?.[lane];
    const enemy = battle.enemyBoard?.[lane];
    const forecast = battle.forecast?.[lane];
    if (player && enemy) {
      const diff = (player.attack || 0) - (enemy.attack || 0);
      return {
        state: diff >= 0 ? 'clash favorable' : 'clash risky',
        label: 'DUEL',
        title: diff >= 0 ? 'Duel favorable' : 'Duel dangereux',
        text: `${ritualUnitName(player)} ${player.attack || 0} → ${ritualUnitName(enemy)} ${enemy.attack || 0}`,
      };
    }
    if (enemy && !player) {
      return {
        state: 'danger',
        label: 'DANGER',
        title: 'Voie exposée',
        text: `+${enemy.attack || 0} Poursuite si rien ne bloque ${ritualUnitName(enemy)}`,
      };
    }
    if (player && !enemy) {
      return {
        state: forecast ? 'opportunity incoming' : 'opportunity',
        label: forecast ? 'OUVERTURE+' : 'OUVERTURE',
        title: forecast ? 'Avance, puis renfort' : 'Voie libre',
        text: `+${player.attack || 0} Moonrail${forecast ? `, puis ${ritualUnitName(forecast)} arrive` : ''}`,
      };
    }
    if (forecast) {
      return {
        state: 'incoming',
        label: 'RENFORT',
        title: 'Arrivée annoncée',
        text: `${ritualUnitName(forecast)} entrera après le départ`,
      };
    }
    return {
      state: 'open',
      label: 'CALME',
      title: 'Wagon libre',
      text: 'Bon emplacement pour préparer une pose.',
    };
  }

  function lanePlacementSignal(battle, lane, selected) {
    if (!selected || battle.resolving) return null;
    if (battle.playerBoard?.[lane]) {
      const occupant = battle.playerBoard[lane];
      const signature = isReturningSignature(occupant.cardId);
      return { state:'preview overwrite', label:'REMPLACER ?', title:signature ? 'Signature brisée' : 'Mort définitive', text:signature ? `${ritualUnitName(occupant)} reviendra au prochain combat.` : `${ritualUnitName(occupant)} quittera le deck de cette run.` };
    }
    if (!selected.affordable) {
      return {
        state: 'preview blocked',
        label: 'MANQUE',
        title: `${selected.missing} ${selected.resource.label}${selected.missing > 1 ? 's' : ''}`,
        text: `${selected.card.name} attend encore de l'énergie.`,
      };
    }
    const enemy = battle.enemyBoard?.[lane];
    const forecast = battle.forecast?.[lane];
    if (enemy) {
      return {
        state: 'preview clash',
        label: 'POSER ?',
        title: 'Bloquer le danger',
        text: `${selected.card.name} engage ${ritualUnitName(enemy)} : ${selected.card.attack}/${selected.card.health}`,
      };
    }
    return {
      state: forecast ? 'preview incoming' : 'preview opportunity',
      label: 'POSER ?',
      title: forecast ? 'Préparer le renfort' : 'Accélérer ici',
      text: `${selected.card.name} ajoute +${selected.card.attack || 0} Moonrail pour ${selected.resource.icon}${selected.cost}`,
    };
  }

  function laneReadoutMarkup(battle) {
    const selected = selectedPlacementCard();
    const lanes = Array.from({ length: BALANCE.lanes }, (_, lane) => lane);
    return `<section class="lane-readout" aria-label="Lecture tactique des wagons">
      ${lanes.map(lane => {
        const signal = lanePlacementSignal(battle, lane, selected) || laneSignalFor(battle, lane);
        return `<article class="lane-signal ${signal.state}" data-lane-signal="${signal.label}" style="--lane-delay:${lane * 70}ms">
          <small>WAGON ${lane + 1}</small>
          <b>${esc(signal.label)}</b>
          <strong>${esc(signal.title)}</strong>
          <span>${esc(signal.text)}</span>
        </article>`;
      }).join('')}
    </section>`;
  }

  function ritualSlotMarkup(unit, lane, side) {
    const attrs = side === 'player' ? `data-ritual-player-slot="${lane}"` : '';
    const fx = run?.battle?.fx;
    const targeted = fx?.targets?.includes(lane) && fx?.targetSide === side ? ' targeted-lane' : '';
    const placement = placementPreviewMarkup(lane, side, !!unit);
    if (!unit) return `<button class="ritual-slot empty ${side}${targeted}${placement.className}" ${attrs}><span>${side === 'player' && placement.html ? '' : side === 'player' ? 'PLACER' : side === 'forecast' ? '—' : 'VOIE VIDE'}</span>${placement.html}</button>`;
    const card = { ...getCard(unit.cardId), attack:unit.attack, health:unit.maxHp, sigils:unit.sigils };
    const active = fx?.lane === lane && fx?.side === side ? ' resolving-hit' : '';
    return `<div class="ritual-slot occupied ${side}${active}${targeted}${placement.className}">${ritualCardMarkup(card, attrs, unit)}${active ? `<em class="lane-fx">${esc(fx.text)}</em>` : ''}${placement.html}</div>`;
  }

  function battleHint(selected) {
    const battle = run.battle;
    if (battle.resolving) return 'Le convoi roule : les trois wagons résolvent leurs manœuvres de gauche à droite.';
    if (!selected) return battle.stokedThisTurn
      ? `Sélectionnez une carte ou glissez-la vers un wagon. À la fin du départ, la main restante partira en défausse puis ${BALANCE.turnDraw} cartes seront piochées.`
      : `Sélectionnez une carte ou glissez-la vers un wagon. La main non jouée sera défaussée au départ suivant ; chauffez une carte pour +${BALANCE.stokeGain} Lueurs.`;
    const resource = cardAffordable(selected, battle);
    if (!resource.affordable) return `Cette carte coûte ${resource.amount} ${resource.label}${resource.amount > 1 ? 's' : ''} : il en manque ${resource.missing}.`;
    return battle.stokedThisTurn
      ? `Cette carte coûte ${resource.icon}${resource.amount}. Les wagons affichent où la poser ou quelle carte elle remplacerait.`
      : `Cette carte coûte ${resource.icon}${resource.amount}. Chauffez une carte pour produire Lueur et Cendres si nécessaire.`;
  }

  function battleCoachMarkup(selected) {
    const battle = run?.battle;
    if (!battle) return '';
    const hint = battleHint(selected);
    const handInfo = `${battle.hand.length}/${currentHandLimit()} cartes en main`;
    const pileInfo = `${battle.deck.length} pioche · ${battle.discard.length} défausse`;
    if (battle.resolving) {
      return `<section class="battle-coach resolving" data-coach-state="resolving"><i>➤</i><div><b>Résolution en cours</b><span>${esc(hint)}</span></div><em>${esc(pileInfo)}</em></section>`;
    }
    if (!selected) {
      const action = battle.stokedThisTurn ? 'Posez une carte ou allégez la main.' : `Glissez vers un wagon ou chauffez pour +${BALANCE.stokeGain} Lueurs.`;
      return `<section class="battle-coach idle" data-coach-state="idle"><i>☾</i><div><b>Choisissez une carte</b><span>${esc(action)}</span></div><em>${esc(handInfo)} · ${esc(pileInfo)}</em></section>`;
    }
    const resource = cardAffordable(selected, battle);
    const cost = resource.amount;
    const affordable = resource.affordable;
    const occupiedLanes = battle.playerBoard.filter(Boolean).length;
    const sigilNames = (selected.sigils || []).slice(0, 2).map(id => SIGILS[id]?.[1] || id).join(' · ') || 'Aucun sigil';
    const state = affordable ? 'ready' : 'blocked';
    const title = affordable ? 'Carte prête à poser' : `Manque ${resource.missing} ${resource.label}${resource.missing > 1 ? 's' : ''}`;
    const action = affordable
      ? `${BALANCE.lanes - occupiedLanes} wagon${BALANCE.lanes - occupiedLanes > 1 ? 's' : ''} vide${BALANCE.lanes - occupiedLanes > 1 ? 's' : ''} · les wagons occupés peuvent être remplacés définitivement.`
      : `Produisez davantage de ${resource.label}${resource.missing > 1 ? 's' : ''} ou choisissez une option moins chère.`;
    return `<section class="battle-coach selected ${state}" data-coach-state="${state}">
      <i class="coach-card-art" style="${cardArtStyle(selected)}"></i>
      <div><b>${esc(title)}</b><strong>${esc(selected.name)}</strong><span class="coach-effect">${esc(selected.text)}</span><small class="coach-instruction">${esc(hint)}</small></div>
      <aside><small>${resource.icon}${cost} coût</small><small>⚔ ${selected.attack} · ♥ ${selected.health}</small><small>${esc(sigilNames)}</small><em>${esc(action)}</em></aside>
    </section>`;
  }

  function drawRitualCard(source) {
    const battle = run?.battle;
    if (!battle || battle.resolving) return;
    ritualToast(`La pioche est automatique : ${BALANCE.openingHand} cartes au premier tour, puis ${BALANCE.turnDraw} après chaque départ.`);
  }

  function onCardDrawn(id) {
    const battle = run?.battle, card = getCard(id);
    if (!battle || !card) return;
    if (battle.weather === 'moon_rain' && !battle.moonRainUsed) {
      battle.pursuit = Math.max(0, battle.pursuit - 1);
      battle.moonRainUsed = true;
      battle.fx = { side:'player', lane:1, text:'pluie -1' };
    }
    if (card.sigils?.includes('destiny')) {
      const effect = Math.floor(ritualRandom() * 3);
      if (effect === 0) { battle.lumen++; battle.fx = { side:'player', lane:1, text:'destin +1' }; }
      if (effect === 1) { battle.progress++; battle.fx = { side:'player', lane:1, text:'destin rail' }; }
      if (effect === 2) { battle.pursuit = Math.max(0, battle.pursuit - 1); battle.fx = { side:'player', lane:1, text:'destin œil' }; }
      ritualToast(`${card.name} révèle son Destin.`);
    }
  }

  function drawOneRitualCard() {
    const battle = run?.battle;
    if (!battle) return false;
    if (!battle.deck.length && battle.discard.length) {
      battle.deck = shuffle(battle.discard.splice(0));
      triggerKohanaParadeSecretOnReshuffle();
    }
    if (!battle.deck.length) return false;
    const id = battle.deck.pop();
    battle.hand.push(id);
    onCardDrawn(id);
    return true;
  }

  function drawRitualCards(amount) {
    let drawn = 0;
    for (let i = 0; i < amount; i++) {
      if (!drawOneRitualCard()) break;
      drawn++;
    }
    return drawn;
  }

  function discardHandForNewTurn() {
    const battle = run?.battle;
    if (!battle || !battle.hand.length) return 0;
    const discarded = battle.hand.splice(0);
    const echoCount = discarded.filter(id => getCard(id)?.sigils?.includes('echo')).length;
    if (echoCount) {
      battle.nextLumen = (battle.nextLumen || 0) + echoCount;
      battle.fx = { side:'player', lane:1, text:`écho +${echoCount}` };
    }
    battle.discard.push(...discarded);
    battle.selectedHand = null;
    pushCombatEvent('draw', 'Main défaussée', `${discarded.length} carte${discarded.length > 1 ? 's' : ''} recyclée${discarded.length > 1 ? 's' : ''}`);
    return discarded.length;
  }

  function enforceHandLimit() {
    const battle = run?.battle;
    if (!battle || battle.hand.length <= currentHandLimit()) return false;
    openRitualModal(`<span class='kicker'>MAIN TROP CHARGÉE</span><h2>Sacrifiez une carte</h2><p>Votre limite actuelle est de ${currentHandLimit()} cartes. Choisissez une carte à brûler : Brasier, Surplus et plusieurs cartes blessure jouent déjà avec cette contrainte.</p><div class='ritual-reward-grid sacrifice-grid'>${battle.hand.map((id, index) => ritualCardMarkup(effectiveCard(id) || getCard(id), `data-ritual-sacrifice-hand='${index}'`)).join('')}</div>`, 'sacrifice-modal');
    return true;
  }

  function sacrificeHandCard(index) {
    const battle = run?.battle;
    if (!battle || !battle.hand[index]) return;
    const id = battle.hand.splice(index, 1)[0];
    const card = getCard(id);
    markRunCardDead(id, 'sacrifiée pour alléger la main');
    battle.ashes = Number(battle.ashes || 0) + 1;
    if (card?.sigils?.includes('pyre')) battle.progress++;
    profile.lifetimeHandSacrifices++;
    closeRitualModal(); persist(); renderRitualBattle();
    ritualToast(isReturningSignature(id) ? `${getCard(id)?.name || 'La signature'} se reformera au prochain combat · +1 Cendre.` : `${getCard(id)?.name || 'Une carte'} quitte la run · +1 Cendre.`);
    enforceHandLimit();
  }

  function selectHand(index) {
    const battle = run?.battle;
    if (!battle || battle.resolving || !battle.hand[index]) return;
    battle.selectedHand = battle.selectedHand === index ? null : index;
    renderRitualBattle();
  }

  function interactPlayerLane(lane) {
    const battle = run?.battle;
    if (!battle || battle.resolving || battle.selectedHand === null) return;
    const selectedId = battle.hand[battle.selectedHand], card = getCard(selectedId);
    const occupant = battle.playerBoard[lane];
    if (occupant) {
      const incoming = effectiveCard(selectedId) || card;
      const outgoing = { ...getCard(occupant.cardId), attack:occupant.attack, health:occupant.maxHp, sigils:occupant.sigils };
      const signature = isReturningSignature(occupant.cardId);
      return openRitualModal(`<span class="kicker">${signature ? 'SIGNATURE BRISÉE' : 'REMPLACEMENT IRRÉVERSIBLE'}</span><h2>Écraser la carte du wagon ${lane + 1} ?</h2><p>${signature ? 'Cette Spell Card quittera le combat, puis se reformera à pleine Vie pour le prochain contrôle. Les autres cartes seraient perdues pour la run.' : 'La carte déjà posée comptera comme morte et quittera le deck pour le reste de cette run. Un renfort ne sera tiré qu’après le combat si le deck passe sous 10 cartes.'}</p><div class="card-change-row overwrite-confirm"><div><small>${signature ? 'REVIENDRA AU PROCHAIN COMBAT' : 'CARTE PERDUE'}</small>${ritualCardDisplayMarkup(outgoing)}</div><b>→</b><div><small>CARTE POSÉE</small>${ritualCardDisplayMarkup(incoming)}</div></div><div class="modal-actions"><button class="secondary-button" data-action="ritual-modal-close">Annuler</button><button class="primary-button" data-ritual-overwrite="${lane}">Confirmer ${signature ? 'le remplacement' : 'la perte'}</button></div>`, 'card-change-modal overwrite-modal');
    }
    summonSelected(lane, selectedId, card);
  }

  function confirmLaneOverwrite(lane) {
    const battle = run?.battle;
    if (!battle || battle.resolving || battle.selectedHand === null) return;
    const occupant = battle.playerBoard[lane];
    if (!occupant) { closeRitualModal(); return interactPlayerLane(lane); }
    const selectedId = battle.hand[battle.selectedHand];
    const card = getCard(selectedId);
    markRunCardDead(occupant.ref || { cardId:occupant.cardId, runUid:occupant.runUid }, 'écrasée par une autre carte');
    battle.ashes = Number(battle.ashes || 0) + 1;
    battle.playerBoard[lane] = null;
    closeRitualModal();
    summonSelected(lane, selectedId, card);
  }

  function applyTribeSetBonus() {
    const battle = run?.battle;
    const units = battle?.playerBoard?.filter(Boolean) || [];
    if (units.length < BALANCE.lanes) return;
    const tribes = units.map(unit => getCard(unit.cardId)?.tribe);
    if (!tribes[0] || !tribes.every(tribe => tribe === tribes[0])) return;
    const key = `${tribes[0]}:${battle.turn}`;
    battle.tribeBonuses ||= {};
    if (battle.tribeBonuses[key]) return;
    battle.tribeBonuses[key] = true;
    units.forEach(unit => { unit.attack++; unit.hp++; unit.maxHp++; syncRunCardHealth(unit); });
    battle.fx = { side:'player', lane:1, text:`tribu ${tribes[0]}` };
    ritualToast(`Bonus tribal ${tribes[0]} : +1 Puissance et +1 Vie aux trois wagons.`);
  }

  function summonSelected(lane, selectedId, card) {
    const battle = run.battle;
    const resource = cardAffordable(card, battle);
    if (!resource.affordable) return ritualToast(`Il manque ${resource.missing} ${resource.label}${resource.missing > 1 ? 's' : ''}.`);
    if (resource.type === 'ashes') battle.ashes -= resource.amount;
    else battle.lumen -= resource.amount;
    const unit = instantiate(selectedId, 'player');
    if (run.guardianId === 'controleur' && !battle.firstCardPlayed) { unit.hp++; unit.maxHp++; }
    if (battle.emberWindCharge) { unit.attack++; battle.emberWindCharge = false; }
    if (unit.sigils.includes('omen_break')) battle.pursuit = Math.max(0, battle.pursuit - 1);
    if (battle.encounter?.ruleKey === 'seal_tax' && !battle.firstCardPlayed) triggerBossRule('Premier passager taxé par un sceau : +1 Lueur.', lane);
    battle.firstCardPlayed = true;
    battle.playerBoard[lane] = unit.hp > 0 ? unit : null;
    if (unit.sigils.includes('fecund') && battle.hand.length < currentHandLimit()) battle.hand.push({ cardId:unit.cardId, temporary:true });
    battle.hand.splice(battle.selectedHand, 1);
    battle.selectedHand = null;
    pushCombatEvent('summon', card?.name || 'Passager affecté', `Wagon ${lane + 1} · -${resource.amount} ${resource.label}${resource.amount > 1 ? 's' : ''}`, lane);
    applySignatureOnSummon(unit, lane, unit.cardId);
    applyTribeSetBonus();
    if (!unit.hp) { resolveZeroHealthArrival(unit, lane); killUnit(unit, lane, 'player'); }
    persist(); renderRitualBattle(); checkBattleEnd();
  }

  function stokeSelectedCard() {
    const battle = run?.battle;
    if (!battle || battle.resolving || battle.selectedHand === null) return ritualToast('Sélectionnez une carte à envoyer dans la chaudière.');
    const id = battle.hand.splice(battle.selectedHand, 1)[0], card = getCard(id);
    const grantsLumen = !battle.stokedThisTurn;
    if (grantsLumen) {
      if (card?.sigils?.includes('many_lived')) battle.deck.unshift(id); else battle.discard.push(id);
      battle.lumen += BALANCE.stokeGain; battle.ashes = Number(battle.ashes || 0) + 1; battle.stokedThisTurn = true; battle.stokesThisBattle++; run.stokes++; profile.lifetimeStokes++;
      if (card?.sigils?.includes('pyre')) battle.progress++;
      if (run.guardianId === 'rinka' && battle.stokesThisBattle === 1) battle.progress++;
      if (battle.weather === 'ember_wind') battle.emberWindCharge = true;
      if (battle.encounter?.ruleKey === 'ember_duel') {
        const enemy = battle.enemyBoard.filter(Boolean).sort((a, b) => b.attack - a.attack)[0];
        if (enemy) enemy.attack++;
        else battle.pursuit++;
        const lane = activePlayerLane(id);
        triggerBossRule('La braise de Rinka répond à votre chaudière.', lane >= 0 ? lane : 1);
      }
      if (profile.lifetimeStokes >= 10) markTruthReady('boiler');
    } else {
      battle.burned ||= [];
      battle.burned.push(id);
      markRunCardDead(id, 'détruite dans la chaudière');
      battle.ashes = Number(battle.ashes || 0) + 1;
      profile.lifetimeHandSacrifices++;
    }
    const returnsNextCombat = !grantsLumen && isReturningSignature(id);
    pushCombatEvent(grantsLumen ? 'stoke' : 'burn', card?.name || 'Carte détruite', grantsLumen ? `Chaudière +${BALANCE.stokeGain} Lueurs · +1 Cendre` : returnsNextCombat ? 'Brisée pour ce combat · +1 Cendre' : 'Détruite pour la run · +1 Cendre');
    battle.selectedHand = null; persist(); renderRitualBattle();
    ritualToast(grantsLumen
      ? `${card?.name || 'La carte'} chauffe la chaudière : +${BALANCE.stokeGain} Lueurs et +1 Cendre.`
      : returnsNextCombat ? `${card?.name || 'La signature'} se reformera au prochain combat : +1 Cendre, aucune Lueur.` : `${card?.name || 'La carte'} est détruite pour la run : +1 Cendre, aucune Lueur.`);
  }

  async function resolveRitualTurn() {
    const battle = run?.battle;
    if (!battle || battle.resolving) return;
    pushCombatEvent('start', 'Départ du convoi', 'Résolution des trois wagons de gauche à droite.');
    battle.resolving = true; renderRitualBattle();
    await wait(260);
    if (applyDepartureLastWordSecrets()) { renderRitualBattle(); await wait(180); if (checkBattleEnd()) return; }
    for (let lane = 0; lane < BALANCE.lanes; lane++) {
      const unit = battle.playerBoard[lane];
      if (!unit) continue;
      attackFrom(unit, lane, 'player');
      renderRitualBattle(); await wait(220);
      if (checkBattleEnd()) return;
      battle.fx = null;
      renderRitualBattle(); await wait(55);
    }
    for (let lane = 0; lane < BALANCE.lanes; lane++) {
      const unit = battle.enemyBoard[lane];
      if (!unit) continue;
      attackFrom(unit, lane, 'enemy');
      renderRitualBattle(); await wait(220);
      if (checkBattleEnd()) return;
      battle.fx = null;
      renderRitualBattle(); await wait(55);
    }
    battle.fx = null;
    battle.nextLumen = battle.playerBoard.filter(unit => unit?.sigils.includes('bone_digger')).length;
    spawnForecast(); moveSprinters();
    const discarded = discardHandForNewTurn();
    battle.turn++; battle.drawUsed = true; battle.firstCardPlayed = false; battle.selectedHand = null; battle.stokedThisTurn = false;
    battle.lumen = baseLumenForRun() + battle.nextLumen;
    const drawn = drawRitualCards(BALANCE.turnDraw);
    battle.fx = { side:'player', lane:1, text:`${drawn}/${BALANCE.turnDraw} pioche` };
    pushCombatEvent('draw', 'Nouvelle main', `${drawn}/${BALANCE.turnDraw} cartes piochées · ${battle.lumen} Lueurs`);
    if (discarded) ritualToast(`${discarded} carte${discarded > 1 ? 's' : ''} non jouée${discarded > 1 ? 's' : ''} en défausse · ${drawn} piochée${drawn > 1 ? 's' : ''}.`);
    battle.resolving = false;
    generateForecast(); persist(); renderRitualBattle(); enforceHandLimit();
  }

  function attackFrom(unit, lane, side) {
    const battle = run.battle;
    const name = getCard(unit.cardId)?.name || (side === 'player' ? 'Un passager' : 'Un ennemi');
    const beforeProgress = battle.progress;
    const beforePursuit = battle.pursuit;
    const ownBoard = side === 'player' ? battle.playerBoard : battle.enemyBoard;
    const targetBoard = side === 'player' ? battle.enemyBoard : battle.playerBoard;
    const lanes = unit.sigils.includes('bifurcated') ? [lane - 1, lane + 1].filter(index => index >= 0 && index < BALANCE.lanes) : [lane];
    const targetSide = side === 'player' ? 'enemy' : 'player';
    battle.fx = { side, lane, targetSide, targets:lanes, text: side === 'player' ? `+${unit.attack} rail` : `+${unit.attack} poursuite` };
    let contacted = 0;
    for (const targetLane of lanes) {
      const target = targetBoard[targetLane];
      const fliesOver = unit.sigils.includes('airborne') && target && !target.sigils.includes('reach');
      if (!target || fliesOver) {
        if (side === 'player') battle.progress += unit.attack; else battle.pursuit += unit.attack;
      } else {
        contacted++;
        target.hp -= unit.attack;
        if (target.owner === 'player') syncRunCardHealth(target);
        if (target.sigils.includes('thorns')) unit.hp--;
        if (unit.owner === 'player') syncRunCardHealth(unit);
        if (target.hp <= 0) killUnit(target, targetLane, side === 'player' ? 'enemy' : 'player');
      }
      if (unit.hp <= 0) killUnit(unit, lane, side);
    }
    const progressDelta = battle.progress - beforeProgress;
    const pursuitDelta = battle.pursuit - beforePursuit;
    if (progressDelta > 0) pushCombatEvent('progress', name, `+${progressDelta} Progression Moonrail`, lane);
    else if (pursuitDelta > 0) pushCombatEvent('pursuit', name, `+${pursuitDelta} Poursuite adverse`, lane);
    else pushCombatEvent('attack', name, contacted ? `${contacted} cible${contacted > 1 ? 's' : ''} touchée${contacted > 1 ? 's' : ''}` : 'Aucune cible touchée', lane);
    if (unit.sigils.includes('brittle') && ownBoard[lane] === unit) killUnit(unit, lane, side);
  }

  function killUnit(unit, lane, side) {
    const battle = run.battle;
    const board = side === 'player' ? battle.playerBoard : battle.enemyBoard;
    const name = getCard(unit.cardId)?.name || (side === 'player' ? 'Passager' : 'Ennemi');
    if (side === 'player' && unit.cardId === 'spell_rinka_petals' && triggerLastWordSecret('spell_rinka_petals', 'Le centième pétale coupe encore après la chute.')) {
      battle.progress += Math.max(2, Math.ceil(unit.attack / 2));
      battle.fx = { side:'player', lane, text:'pétale secret' };
    }
    if (board[lane] === unit) board[lane] = null;
    pushCombatEvent('defeat', side === 'enemy' ? 'Ennemi brisé' : 'Passager perdu', name, lane);
    if (side === 'enemy') {
      if (battle.encounter?.ruleKey === 'mist_return' && !battle.enemyReturned) {
        const targetLane = battle.forecast.findIndex((future, index) => !future && !battle.enemyBoard[index]);
        if (targetLane >= 0) {
          const echo = instantiate(unit.cardId, 'enemy');
          echo.hp = Math.max(1, Math.ceil(echo.maxHp / 2));
          battle.forecast[targetLane] = echo;
          battle.enemyReturned = true;
          triggerBossRule('La première créature vaincue revient en brume.', targetLane);
        }
      }
      const vesperaLane = activePlayerLane('spell_vespera_hundred');
      if (vesperaLane >= 0 && battle.hand.length < currentHandLimit() && triggerLastWordSecret('spell_vespera_hundred', 'Une lune vole le nom de l’ennemi vaincu.')) {
        battle.hand.push({ cardId:unit.cardId, temporary:true });
        battle.fx = { side:'player', lane:vesperaLane, text:'vol secret' };
      }
      return;
    }
    if (side === 'player') {
      const ref = unit.ref || { cardId:unit.cardId, runUid:unit.runUid };
      let returned = false;
      if (unit.cardId !== 'spell_eir_night' && activePlayerUnit('spell_eir_night') && triggerLastWordSecret('spell_eir_night', 'La nuit garde un souffle qui aurait dû partir.')) {
        if (battle.hand.length < currentHandLimit()) battle.hand.push(ref); else battle.deck.push(ref);
        returned = true;
      }
      else if (unit.sigils.includes('deathless') && battle.hand.length < currentHandLimit()) { battle.hand.push(ref); returned = true; }
      else if (run.guardianId === 'eir' && !battle.firstDeathReturned) { battle.deck.push(ref); battle.firstDeathReturned = true; returned = true; }
      if (returned) {
        reviveRunCard(ref, 1);
        pushCombatEvent('secret', 'Mort évitée', `${name} revient avec 1 Vie.`, lane);
      } else {
        markRunCardDead(ref, 'vaincue sur un wagon');
        battle.ashes = Number(battle.ashes || 0) + 1;
        pushCombatEvent('burn', '+1 Cendre', isReturningSignature(ref) ? `${name} se reformera au prochain combat.` : `${name} ne reviendra pas pendant cette run.`, lane);
      }
    }
  }

  function spawnForecast() {
    const battle = run.battle;
    battle.forecast.forEach((unit, lane) => {
      if (!unit || battle.enemyBoard[lane]) return;
      battle.enemyBoard[lane] = unit;
      const opposite = battle.playerBoard[lane];
      if (opposite?.sigils.includes('guardian')) { opposite.hp++; opposite.maxHp++; syncRunCardHealth(opposite); }
    });
  }

  function moveSprinters() {
    for (const board of [run.battle.playerBoard, run.battle.enemyBoard]) {
      const moves = [];
      board.forEach((unit, lane) => { if (unit?.sigils.includes('sprinter')) moves.push([lane, board[(lane + 1) % BALANCE.lanes] ? (lane + 2) % BALANCE.lanes : (lane + 1) % BALANCE.lanes]); });
      moves.forEach(([from, to]) => { if (board[from] && !board[to]) { board[to] = board[from]; board[from] = null; } });
    }
  }

  function checkBattleEnd() {
    if (run.battle.progress >= BALANCE.progressGoal) { finishBattle(true); return true; }
    if (run.battle.pursuit >= BALANCE.progressGoal) {
      if (preventDefeatWithAyameSecret()) { persist(); renderRitualBattle(); return false; }
      finishBattle(false); return true;
    }
    return false;
  }

  function finalizeRunDeckAfterBattle(battle) {
    battle?.playerBoard?.filter(Boolean).forEach(syncRunCardHealth);
    const states = Array.isArray(run.cardStates) ? run.cardStates : ensureRunCardStates();
    const returned = states.filter(state => state.dead && (state.returnsNextCombat || isReturningSignature(state.cardId))).map(state => {
      const ref = runBattleRef(state);
      const maxHp = Math.max(1, effectiveCard(ref)?.health || getCard(state.cardId)?.health || 1);
      const reason = battle?.casualties?.find(item => item.uid === state.uid)?.reason || 'brisée en combat';
      state.dead = false;
      state.returnsNextCombat = false;
      state.hp = maxHp;
      return { uid:state.uid, cardId:state.cardId, reason, hp:maxHp };
    });
    const lost = states.filter(state => state.dead).map(state => ({ cardId:state.cardId, reason:battle?.casualties?.find(item => item.uid === state.uid)?.reason || 'perdue en combat' }));
    states.filter(state => state.dead).forEach(state => { if (run.cardInstanceMods) delete run.cardInstanceMods[state.uid]; });
    run.cardStates = states.filter(state => !state.dead);
    run.deck = run.cardStates.map(state => state.cardId);
    const replacements = [];
    const pool = (profile.unlockedCards || []).map(getCard).filter(card => card && card.rarity !== 'offering' && card.rarity !== 'unique' && card.tribe !== 'signature');
    while (run.deck.length < 10 && pool.length) {
      const card = pool[Math.floor(ritualRandom() * pool.length)];
      addRunCard(card.id);
      replacements.push({ cardId:card.id });
    }
    return { lost, returned, replacements };
  }

  function showRunCasualtyReport(report, continuation) {
    run.pendingCasualtyContinuation = continuation;
    run.pendingCasualtyReport = report;
    const lostMarkup = report.lost.map(item => `<div><small>MORTE POUR LA RUN · ${esc(item.reason)}</small>${ritualCardDisplayMarkup(getCard(item.cardId))}</div>`).join('');
    const returnedMarkup = (report.returned || []).map(item => `<div class="signature-return-card"><small>SIGNATURE REFORMÉE · ${item.hp}/${item.hp} VIE</small>${ritualCardDisplayMarkup(effectiveCard({ cardId:item.cardId, runUid:item.uid }) || getCard(item.cardId))}</div>`).join('');
    const replacementMarkup = report.replacements.map(item => `<div><small>RENFORT ALÉATOIRE · POOL DÉBLOQUÉ</small>${ritualCardDisplayMarkup(getCard(item.cardId))}</div>`).join('');
    const lossSection = report.lost.length ? `<section class="casualty-losses"><h3>Pertes définitives de la run</h3><div>${lostMarkup}</div></section>` : '';
    const returnSection = (report.returned || []).length ? `<section class="signature-returns"><h3>Spell Cards reformées</h3><p>Leur présence est personnelle : elles seules reviennent au prochain combat, à pleine Vie.</p><div>${returnedMarkup}</div></section>` : '';
    const replacementSection = report.replacements.length ? `<section class="casualty-replacements"><h3>Renforts · deck remonté à ${run.deck.length}</h3><div>${replacementMarkup}</div></section>` : '';
    const headline = report.lost.length
      ? `${report.lost.length} carte${report.lost.length > 1 ? 's ont' : ' a'} quitté le convoi`
      : `${report.returned.length} signature${report.returned.length > 1 ? 's se sont' : ' s’est'} reformée${report.returned.length > 1 ? 's' : ''}`;
    openRitualModal(`<span class="kicker">APRÈS LE COMBAT</span><h2>${headline}</h2><p>Les blessures ordinaires persistent. Les pertes quittent la run et sont remplacées sous 10 cartes ; les Spell Cards et Last Words constituent l’unique exception.</p><div class="casualty-ledger casualty-ledger-detailed">${lossSection}${returnSection}${replacementSection}</div><div class="modal-actions"><button class="primary-button large" data-action="ritual-casualty-continue">Continuer</button></div>`, 'casualty-modal');
  }

  function continueAfterRunCasualties() {
    if (!run) return;
    const continuation = run.pendingCasualtyContinuation;
    const bossLoot = run.pendingBossLoot;
    run.pendingCasualtyContinuation = null;
    run.pendingCasualtyReport = null;
    run.pendingBossLoot = null;
    persist();
    if (continuation === 'boss') return showBossOutroDialogue(bossLoot);
    return showCardReward(continuation === 'opening' ? 'opening' : 'complete', continuation === 'miniboss');
  }

  function finishBattle(won) {
    const battle = run.battle;
    battle.resolving = true;
    if (!won) return finishRitualRun(false);
    const overdrive = Math.max(0, battle.progress - BALANCE.progressGoal);
    const depth = run.act * BALANCE.stopsPerControl + run.step + 1;
    profile.maxRunDepth = Math.max(profile.maxRunDepth || 0, depth);
    gainTeeth((battle.isMiniboss ? 3 : 1) + overdrive, battle.isMiniboss ? 'prévôt du Tribunal vaincu' : overdrive ? `victoire avec ${overdrive} excès` : 'victoire de combat');
    run.omens++; run.streak++;
    profile.bestStreak = Math.max(profile.bestStreak, run.streak);
    if (battle.stokesThisBattle === 0) markTruthReady('no_blood');
    if (overdrive >= 3) markTruthReady('five_teeth');
    const wasHunter = battle.isHunter;
    const wasMiniboss = battle.isMiniboss;
    const wasOpening = battle.isOpening;
    const bossLoot = wasHunter ? `boss_${battle.encounter.id}_technique` : null;
    const casualtyReport = finalizeRunDeckAfterBattle(battle);
    run.battle = null;
    if (run.weather) {
      run.weather.value--;
      if (run.weather.value <= 0) run.weather = null;
    }
    decayCombatMaluses();
    if (wasHunter) {
      profile.hunterWins++;
      if (profile.hunterWins >= 1) markTruthReady('cage');
      if (getCard(bossLoot)) {
        if (!profile.unlockedCards.includes(bossLoot)) profile.unlockedCards.push(bossLoot);
        if (!run.deck.includes(bossLoot)) addRunCard(bossLoot);
        if (!profile.discoveredCards.includes(bossLoot)) profile.discoveredCards.push(bossLoot);
        queueCardTypeTutorial(bossLoot);
      }
    }
    run.pendingBossLoot = bossLoot;
    persist();
    if (casualtyReport.lost.length || casualtyReport.returned.length) return showRunCasualtyReport(casualtyReport, wasHunter ? 'boss' : wasOpening ? 'opening' : wasMiniboss ? 'miniboss' : 'combat');
    if (wasHunter) showBossOutroDialogue(bossLoot);
    else showCardReward(wasOpening ? 'opening' : 'complete', wasMiniboss);
  }

  function advanceAfterHunter() {
    run.act++;
    if (run.act >= availableHunters().length) return finishRitualRun(true);
    run.daysLeft = BALANCE.stopsPerControl; run.step++; createRouteGraph(); persist();
    const next = hunterForAct();
    openRitualModal(`<span class="kicker">UN DIEU EST TOMBÉ</span><h2>Mais la nuit ne bouge pas</h2><p>Une nouvelle silhouette apparaît derrière le train : <strong>${esc(next.name)}</strong>.</p><div class="modal-actions"><button class="primary-button" data-action="ritual-return-map">Continuer <b>→</b></button></div>`, 'story-modal');
  }

  function finishRitualRun(won) {
    if (won) return finishRitualVictory();
    run.endGachaTier = runGachaTier();
    run.endGachaTaken = false;
    run.endGachaChoices = null;
    persist();
    return showDeathReport();
  }

  function runGachaTier() {
    const depth = (run?.act || 0) * BALANCE.stopsPerControl + (run?.step || 0) + (run?.hunterWins || 0);
    const stellarBoost = Math.floor((run?.omens || 0) / 3) * 2;
    const score = depth + stellarBoost;
    return score >= 19 ? 'souverain' : score >= 12 ? 'stellaire' : score >= 6 ? 'lunaire' : 'crépusculaire';
  }

  function gachaTierConfig(tier) {
    return GACHA_TIERS[tier] || GACHA_TIERS.crépusculaire;
  }

  function gachaRatesMarkup(tier) {
    const config = gachaTierConfig(tier);
    return `<div class="gacha-rates ritual-gacha-rates">${GACHA_RARITY_ORDER.map(rarity => `<span><b>${config.rates[rarity] || 0}%</b>${esc(rarity)}</span>`).join('')}</div>`;
  }

  function rollGachaRarity(tier) {
    const config = gachaTierConfig(tier);
    const total = GACHA_RARITY_ORDER.reduce((sum, rarity) => sum + (config.rates[rarity] || 0), 0);
    let roll = ritualRandom() * total;
    for (const rarity of GACHA_RARITY_ORDER) {
      roll -= config.rates[rarity] || 0;
      if (roll <= 0) return rarity;
    }
    return 'common';
  }

  function makeCardGachaReward(card) {
    return card ? { id:`card:${card.id}`, kind:'card', target:card.id, card, rarity:card.rarity } : null;
  }

  function gachaRewardFromId(id) {
    const [kind, target] = String(id || '').split(':');
    if (kind === 'card') return makeCardGachaReward(getCard(target));
    if (kind === 'awakening') {
      const card = getCard(GUARDIAN_SIGNATURES[target]?.awakening);
      return card ? { id:`awakening:${target}`, kind:'awakening', target, guardian:target, card, rarity:'secret' } : null;
    }
    if (kind === 'guardian' && GUARDIANS[target]) return { id:`guardian:${target}`, kind:'guardian', target, guardian:target, rarity:'unique' };
    return null;
  }

  function gachaRewardAlreadyOwned(reward) {
    if (!reward) return true;
    if (reward.kind === 'card') return profile.unlockedCards.includes(reward.target);
    if (reward.kind === 'awakening') return profile.unlockedAwakenings.includes(reward.guardian);
    if (reward.kind === 'guardian') return profile.unlockedGuardians.includes(reward.guardian);
    return true;
  }

  function cardProgressUnlockedForGacha(card) {
    if (!card) return false;
    if (card.unlockArchive && !profile.dialogueRewards.includes(card.unlockArchive)) return false;
    if (card.unlockConstellation && !profile.constellations.includes(card.unlockConstellation)) return false;
    if (card.unlockThread && !profile.secretThreads.includes(card.unlockThread)) return false;
    if (card.unlockRouteSecret && !profile.routeSecrets.includes(card.unlockRouteSecret)) return false;
    if (card.unlockMemory && !profile.relationshipMemories.includes(card.unlockMemory)) return false;
    if (card.unlockVerdict && !profile.secretVerdicts.includes(card.unlockVerdict)) return false;
    return true;
  }

  function gachaCandidatesForRarity(rarity, tier) {
    const config = gachaTierConfig(tier);
    const rewards = [];
    if (['common','uncommon','rare','secret'].includes(rarity) && (rarity !== 'secret' || config.allowSecret)) {
      rewards.push(...cards
        .filter(card => card.rarity === rarity && card.rarity !== 'offering' && card.rarity !== 'unique' && card.tribe !== 'signature' && cardProgressUnlockedForGacha(card))
        .map(makeCardGachaReward)
        .filter(Boolean));
    }
    if (rarity === 'secret' && config.allowAwakening && profile.attempts >= 2) {
      rewards.push(...Object.entries(GUARDIAN_SIGNATURES)
        .filter(([guardian]) => profile.unlockedGuardians.includes(guardian) && profile.unlockedSpellCards.includes(guardian) && !profile.unlockedAwakenings.includes(guardian))
        .map(([guardian, signature]) => ({ id:`awakening:${guardian}`, kind:'awakening', target:guardian, guardian, rarity:'secret', card:getCard(signature.awakening) }))
        .filter(reward => reward.card));
    }
    if (rarity === 'unique' && config.allowGuardian && (profile.clears >= 1 || profile.attempts >= 5)) {
      rewards.push(...Object.keys(GUARDIANS)
        .filter(guardian => guardian === 'vespera' && !profile.unlockedGuardians.includes(guardian))
        .map(guardian => ({ id:`guardian:${guardian}`, kind:'guardian', target:guardian, guardian, rarity:'unique' })));
    }
    const fresh = rewards.filter(reward => !gachaRewardAlreadyOwned(reward));
    return fresh;
  }

  function rollRitualGacha(tier = runGachaTier(), forcedId = null) {
    if (forcedId) return gachaRewardFromId(forcedId);
    const config = gachaTierConfig(tier);
    const pity = Number(profile.ritualPity || 0);
    const rarity = pity >= config.pity ? 'rare' : rollGachaRarity(tier);
    const fallback = [rarity, 'rare', 'uncommon', 'common', 'secret', 'unique'].filter((value, index, list) => list.indexOf(value) === index);
    for (const candidateRarity of fallback) {
      const pool = gachaCandidatesForRarity(candidateRarity, tier);
      if (pool.length) return shuffle(pool)[0];
    }
    const finalPool = cards
      .filter(card => card.rarity !== 'offering' && card.rarity !== 'unique' && card.tribe !== 'signature' && !profile.unlockedCards.includes(card.id))
      .map(makeCardGachaReward)
      .filter(Boolean);
    return finalPool.length ? shuffle(finalPool)[0] : null;
  }

  async function showRitualGachaAnimation(tier, label = 'Prisme gacha') {
    const config = gachaTierConfig(tier);
    openRitualModal(`<span class="kicker">${esc(label)}</span><h2>Le prisme cherche une forme…</h2><p>${esc(config.desc)}</p><div class="gacha-suspense"><div class="capsule-stage"><div class="capsule-machine"></div><i></i><i></i><i></i></div>${gachaRatesMarkup(tier)}</div>`, 'gacha-suspense-modal');
    await nextPaint();
    await wait(1550);
  }

  function applyRitualGachaReward(reward, { addToRun = false, affectPity = true, source = 'run_end', forceUnlock = false } = {}) {
    if (!reward) return { alreadyOwned:true, title:'Rien', text:'Le prisme est resté vide.' };
    const alreadyOwned = gachaRewardAlreadyOwned(reward);
    const deckBefore = run?.deck?.length ?? 0;
    if (alreadyOwned && !forceUnlock) {
      persist();
      return {
        alreadyOwned:true,
        title:'Déjà possédé',
        text:'Le gacha ne crée plus de doublons : aucun nouvel exemplaire n’a été ajouté.'
      };
    }
    if (reward.kind === 'card') {
      if (!profile.unlockedCards.includes(reward.target)) profile.unlockedCards.push(reward.target);
      if (!profile.gachaUnlockedCards.includes(reward.target)) profile.gachaUnlockedCards.push(reward.target);
      if (!profile.discoveredCards.includes(reward.target)) profile.discoveredCards.push(reward.target);
      const canStackInRun = reward.card?.rarity !== 'unique' && reward.card?.tribe !== 'signature';
      if (addToRun && run && (canStackInRun || !run.deck.includes(reward.target))) addRunCard(reward.target);
      queueCardTypeTutorial(reward.card || reward.target);
    }
    if (reward.kind === 'awakening') {
      if (forceUnlock && !profile.unlockedGuardians.includes(reward.guardian)) profile.unlockedGuardians.push(reward.guardian);
      if (forceUnlock && !profile.unlockedSpellCards.includes(reward.guardian)) profile.unlockedSpellCards.push(reward.guardian);
      if (!profile.unlockedAwakenings.includes(reward.guardian)) profile.unlockedAwakenings.push(reward.guardian);
      const defaultSpell = GUARDIAN_SIGNATURES[reward.guardian]?.default;
      const spell = GUARDIAN_SIGNATURES[reward.guardian]?.awakening;
      if (defaultSpell && !profile.discoveredCards.includes(defaultSpell)) profile.discoveredCards.push(defaultSpell);
      if (spell && !profile.discoveredCards.includes(spell)) profile.discoveredCards.push(spell);
      if (addToRun && run?.guardianId === reward.guardian && spell && !run.deck.includes(spell)) addRunCard(spell);
      queueCardTypeTutorial(reward.card || spell);
    }
    if (reward.kind === 'guardian' && !profile.unlockedGuardians.includes(reward.guardian)) profile.unlockedGuardians.push(reward.guardian);
    if (affectPity) profile.ritualPity = ['rare','secret','unique'].includes(reward.rarity) ? 0 : Number(profile.ritualPity || 0) + 1;
    profile.ritualGachaHistory.unshift({ at:new Date().toISOString(), tier:run?.endGachaTier || runGachaTier(), reward:reward.id, rarity:reward.rarity, source });
    profile.ritualGachaHistory = profile.ritualGachaHistory.slice(0, 40);
    persist();
    const resultTitle = forceUnlock ? 'Scénario QA appliqué' : 'Nouveau gain archivé';
    const resultText = reward.kind === 'card'
      ? `${reward.card?.name || 'Carte'} ${addToRun && run ? 'rejoint aussi le deck courant.' : 'sera disponible dans les prochaines runs.'}`
      : reward.kind === 'awakening'
        ? `Le second nom de ${GUARDIANS[reward.guardian]?.name || 'cette conductrice'} est éveillé.`
        : `${GUARDIANS[reward.guardian]?.name || 'Une conductrice'} peut maintenant être jouée.`;
    if (run && run.deck.length !== deckBefore) pulseDeckCounter(run.deck.length > deckBefore ? 'gain' : 'loss');
    announceFeedback('gacha', resultTitle, resultText, reward.card || null);
    return {
      alreadyOwned:false,
      title: resultTitle,
      text: resultText
    };
  }

  function gachaRewardRevealMarkup(kindOrReward, target = null) {
    const reward = typeof kindOrReward === 'object' ? kindOrReward : gachaRewardFromId(`${kindOrReward}:${target}`);
    if (!reward) return `<span class="asset-placeholder gacha-guardian-reveal"><b>?</b><strong>PRISME VIDE</strong><small>aucune récompense valide</small></span>`;
    if (reward.kind === 'card') return ritualCardDisplayMarkup(reward.card);
    if (reward.kind === 'awakening') return ritualCardDisplayMarkup(reward.card);
    const guardian = GUARDIANS[reward.guardian];
    return `<article class="gacha-guardian-reveal has-portrait">${guardianPortraitMarkup(reward.guardian, 'gacha-guardian-art')}<small>PERSONNAGE JOUABLE</small><strong>${esc(guardian?.name || 'Conductrice')}</strong><span>${esc(guardian?.perk || 'Nouvelle jouable')}</span></article>`;
  }

  function ritualGachaRewardMarkup(reward, result = null) {
    const rarity = reward?.rarity || 'common';
    const label = reward?.kind === 'awakening' ? 'SIGNATURE SCELLÉE' : reward?.kind === 'guardian' ? 'PERSONNAGE JOUABLE' : `CARTE ${rarity}`;
    const name = reward?.kind === 'guardian' ? GUARDIANS[reward.guardian]?.name : reward?.card?.name;
    const text = result?.text || (reward?.card?.text || GUARDIANS[reward?.guardian]?.perk || '');
    return `<div class="gacha-final-reward rarity-${rarity}" data-rarity="${rarity}"><span class="rarity-badge">${esc(rarity)}</span><div class="gacha-reveal">${gachaRewardRevealMarkup(reward)}</div><div class="gacha-result-bonus"><b>${esc(label)}</b><strong>${esc(name || 'Récompense')}</strong><span>${esc(text)}</span></div></div>`;
  }

  function runMurmurReportMarkup() {
    const murmur = currentRunMurmur();
    const progress = runMurmurProgress();
    if (!run || !murmur || !progress) return '';
    const state = run.murmur.claimed ? 'claimed' : progress.complete ? 'ready' : 'lost';
    const title = run.murmur.claimed ? 'Murmure accompli' : progress.complete ? 'Murmure prêt' : 'Murmure inachevé';
    const status = run.murmur.claimed ? 'La piste est inscrite dans le dernier wagon.' : progress.complete ? 'La piste était complète, mais pas encore inscrite.' : `${progress.current}/${progress.goal} ${progress.label}`;
    return `<section class="run-murmur-report ${state}"><i>${esc(murmur.icon)}</i><div><small>${esc(title)}</small><strong>${esc(murmur.title)}</strong><span>${esc(status)}</span></div></section>`;
  }

  function progressionItemTitle(bucket, id) {
    if (bucket === 'unlockedGuardians') return GUARDIANS[id]?.name || id;
    if (bucket === 'unlockedSpellCards') return getCard(GUARDIAN_SIGNATURES[id]?.default)?.name || GUARDIANS[id]?.name || id;
    if (bucket === 'unlockedAwakenings') return getCard(GUARDIAN_SIGNATURES[id]?.awakening)?.name || GUARDIANS[id]?.name || id;
    if (bucket === 'milestones') return MILESTONES.find(item => item.id === id)?.name || id;
    if (bucket === 'resolvedMurmurs') return RUN_MURMURS.find(item => item.id === id)?.title || id;
    const storyPools = {
      truths:story?.truths,
      dialogueRewards:story?.dialogueArchives,
      relationshipMemories:story?.relationshipMemories,
      secretThreads:story?.secretThreads,
      routeSecrets:story?.routeSecrets,
      secretVerdicts:story?.secretVerdicts,
      constellations:story?.constellations
    };
    if (bucket === 'endings') return ENDINGS[id]?.title || id;
    return storyPools[bucket]?.find(item => item.id === id)?.title || id;
  }

  function progressionCardIds(diff) {
    const ids = [...(diff.unlockedCards || [])];
    for (const guardian of diff.unlockedSpellCards || []) ids.push(GUARDIAN_SIGNATURES[guardian]?.default);
    for (const guardian of diff.unlockedAwakenings || []) ids.push(GUARDIAN_SIGNATURES[guardian]?.awakening);
    return [...new Set(ids.filter(id => getCard(id)))];
  }

  function progressionItemExtraMarkup(item) {
    if (item.bucket !== 'milestones') return '';
    const milestone = MILESTONES.find(entry => entry.id === item.id);
    const reward = getCard(milestone?.reward);
    const rewardMarkup = reward
      ? `<button class="progression-card-link" data-ritual-album-card="${esc(reward.id)}">Carte débloquée · ${esc(reward.name)}</button>`
      : '';
    return `<div class="progression-news-extra"><span>Condition : ${esc(milestone?.text || 'défi accompli')}</span>${rewardMarkup}</div>`;
  }

  function progressionNewsMarkup(diff) {
    const config = {
      unlockedGuardians:['♙','Nouvelle conductrice'],
      unlockedSpellCards:['符','Spell Card personnelle'],
      unlockedAwakenings:['☾','Last Word éveillé'],
      truths:['◉','Vérité comprise'],
      endings:['☀','Fin découverte'],
      dialogueRewards:['「」','Archive de dialogue'],
      relationshipMemories:['∞','Souvenir relationnel'],
      secretThreads:['⌁','Fil contradictoire'],
      routeSecrets:['◇','Dossier vivant'],
      secretVerdicts:['⚖','Jugement secret'],
      constellations:['✧','Constellation'],
      resolvedMurmurs:['☷','Murmure résolu'],
      milestones:['♢','Défi accompli']
    };
    const items = Object.entries(config).flatMap(([bucket, [icon, label]]) => (diff[bucket] || []).map(id => ({ bucket, id, icon, label })));
    if (!items.length) return `<div class="run-recap-empty"><i>○</i><div><strong>Aucune autre archive durable</strong><span>Le prisme reste votre gain permanent de cette tentative.</span></div></div>`;
    return `<div class="run-recap-news">${items.map((item, index) => `<article style="--news-index:${index}"><i>${item.icon}</i><div><small>${esc(item.label)}</small><strong>${esc(progressionItemTitle(item.bucket, item.id))}</strong>${progressionItemExtraMarkup(item)}</div><b>NOUVEAU</b></article>`).join('')}</div>`;
  }

  function previewProgressionDiff() {
    const previewCards = cards.filter(card => card.rarity !== 'offering' && card.tribe !== 'signature' && (card.cost === 0 || card.rarity === 'rare')).slice(0, 3).map(card => card.id);
    return {
      ...Object.fromEntries(PROGRESSION_SNAPSHOT_BUCKETS.map(key => [key, []])),
      unlockedCards:previewCards,
      unlockedSpellCards:['controleur'],
      truths:[story?.truths?.[0]?.id].filter(Boolean),
      resolvedMurmurs:[RUN_MURMURS[0]?.id].filter(Boolean),
      milestones:[MILESTONES[0]?.id].filter(Boolean)
    };
  }

  function showRunProgressRecap(preview = false) {
    if (!preview && !run) return showRitualScreen('menu');
    clearFeedback();
    const baseline = run?.progressionBaseline || progressionSnapshot();
    const diff = preview ? previewProgressionDiff() : progressionDiff(baseline);
    const newCardIds = progressionCardIds(diff);
    const beforeCardIds = [...new Set([
      ...(baseline.unlockedCards || []),
      ...(baseline.unlockedSpellCards || []).map(id => GUARDIAN_SIGNATURES[id]?.default),
      ...(baseline.unlockedAwakenings || []).map(id => GUARDIAN_SIGNATURES[id]?.awakening)
    ].filter(id => getCard(id)))];
    const beforeCount = preview ? Math.max(0, (profile.unlockedCards?.length || 0) - newCardIds.length) : beforeCardIds.length;
    const afterCount = beforeCount + newCardIds.length;
    const collectionCards = newCardIds.length
      ? newCardIds.map((id, index) => `<article class="run-recap-new-card" style="--reveal-index:${index}"><small>NOUVELLE CARTE · ${esc(getCard(id).rarity)}</small>${ritualCardDisplayMarkup(getCard(id))}<strong>Ajoutée à la collection</strong></article>`).join('')
      : `<div class="run-recap-empty collection-empty"><i>◇</i><div><strong>Pas de nouvelle carte cette fois</strong><span>Les autres découvertes permanentes restent inscrites ci-dessous.</span></div></div>`;
    const depth = run ? Math.max(1, Number(run.act || 0) * BALANCE.stopsPerControl + Number(run.step || 0) + 1) : 12;
    const victory = preview ? true : !!run.victoryEnding;
    const totalNews = Object.values(diff).reduce((sum, values) => sum + (values?.length || 0), 0);
    const nextAction = preview ? 'test-gacha' : 'ritual-complete-run-recap';
    const nextLabel = preview ? 'Retour au centre de test' : victory ? 'Continuer vers la fin personnelle' : 'Sceller cette tentative';
    openRitualModal(`<span class="kicker">${preview ? 'PRÉVISUALISATION QA' : victory ? 'RUN ACCOMPLIE' : 'LA NUIT VOUS GARDE UNE TRACE'}</span><h2>${totalNews ? `${totalNews} nouveauté${totalNews > 1 ? 's' : ''} permanente${totalNews > 1 ? 's' : ''}` : 'Votre collection a été vérifiée'}</h2><p>Voici uniquement ce que cette tentative a réellement ajouté au profil. Les cartes de la run qui n’ont pas été débloquées durablement ne sont pas comptées.</p><div class="run-recap-stats"><span><small>PROFONDEUR</small><b>${depth}</b></span><span><small>ISSUE</small><b>${victory ? 'Aube atteinte' : 'Convoi rattrapé'}</b></span><span><small>COLLECTION</small><b>${beforeCount} → ${afterCount}</b></span><span><small>PRISME</small><b>${esc(gachaTierConfig(run?.endGachaTier || runGachaTier()).label)}</b></span></div><section class="run-collection-insertion"><header><div><small>ALBUM DE LA NUIT</small><h3>${newCardIds.length ? `${newCardIds.length} carte${newCardIds.length > 1 ? 's rejoignent' : ' rejoint'} la collection` : 'Collection inchangée'}</h3></div><b>${beforeCount}<i>→</i>${afterCount}</b></header><div class="collection-insertion-stage"><div class="collection-stack" aria-hidden="true"><i></i><i></i><i></i><span>${beforeCount} possédées avant la run</span></div><div class="collection-new-cards">${collectionCards}</div></div></section><section class="run-recap-discoveries"><h3>Autres progressions inscrites</h3>${progressionNewsMarkup(diff)}</section><div class="modal-actions"><button class="primary-button large" data-action="${nextAction}">${nextLabel} <b>→</b></button></div>`, 'run-progress-recap-modal');
  }

  function showDeathReport() {
    if (!run) return showRitualScreen('menu');
    resolveRunMurmurReward();
    const tier = run.endGachaTier || runGachaTier();
    const config = gachaTierConfig(tier);
    const victory = !!run.victoryEnding;
    openRitualModal(`<span class='kicker'>${victory ? 'L’AUBE EST ATTEINTE' : 'LE CONVOI A ÉTÉ RATTRAPÉ'}</span><h2>${victory ? 'Le dernier contrôle laisse tomber un prisme' : 'Un prisme tombe dans les cendres'}</h2><p>Chaque fin de run ouvre un vrai tirage aléatoire. La profondeur, les boss et vos Présages stellaires déterminent sa puissance ; aucun choix de carte supplémentaire ne remplace le gacha.</p>${runMurmurReportMarkup()}<section class='death-gacha'><h3>Prisme de fin de run · puissance ${esc(config.label)}</h3>${gachaRatesMarkup(tier)}<div class="modal-actions"><button class="primary-button large" data-action="ritual-open-run-gacha">Lancer le tirage</button></div></section><small class='memory-note'>${victory ? 'Après le reveal, votre fin personnelle et la Spell Card gagnée seront présentées.' : 'Le gain sera archivé pour les prochaines tentatives.'}</small>`, victory ? 'death-modal victory-gacha-modal' : 'death-modal');
  }

  async function openRunEndGacha() {
    if (!run || run.endGachaTaken) return;
    const tier = run.endGachaTier || runGachaTier();
    const reward = rollRitualGacha(tier);
    run.endGachaTaken = true;
    run.endGachaReward = reward ? { id:reward.id, kind:reward.kind, target:reward.target, guardian:reward.guardian, rarity:reward.rarity } : null;
    await showRitualGachaAnimation(tier, 'PRISME DE FIN DE RUN');
    const result = applyRitualGachaReward(reward, { addToRun:false, affectPity:true, source:'run_end' });
    unlockAfterAttempt();
    persist();
    openRitualModal(`<span class="kicker">PRISME OUVERT</span><h2>${esc(result.title)}</h2>${ritualGachaRewardMarkup(reward, result)}<p>Le gain est archivé. Le récapitulatif suivant le replacera parmi toutes les progressions durables de cette tentative.</p><div class="modal-actions"><button class="primary-button" data-action="ritual-finish-after-gacha">Voir tout ce qui a été débloqué</button></div>`, 'gacha-reveal-modal');
  }

  function finishAfterRunGacha() {
    showRunProgressRecap(false);
  }

  function completeRunAfterProgressRecap() {
    if (run?.victoryEnding) {
      const { guardianId, endingId } = run.victoryEnding;
      const ending = ENDINGS[endingId];
      const murmurReport = runMurmurReportMarkup();
      const endingHook = guardianEndingHook(guardianId, endingId);
      run = null;
      persist();
      openRitualModal(`<span class="kicker">${ending.title}</span><h2>Le train atteint le bord du matin</h2><p>${esc(ending.text)}</p><p>${esc(endingHook)}</p>${murmurReport}<div class="ending-progress"><span><b>${profile.clears}</b> aubes</span><span><b>${profile.truths.length}/${truthTotal()}</b> vérités</span><span><b>${profile.endings.length}/3</b> fins</span></div><p class="ending-hook">${endingId === 'true_dawn' ? 'Vous avez ouvert la dernière porte. Mais une cloche sonne encore sous le plancher.' : `Signature personnelle gravée : ${esc(GUARDIAN_SIGNATURES[guardianId]?.label || 'signature inconnue')}. Un second nom répond parfois aux prismes les plus rares.`}</p><div class="modal-actions"><button class="primary-button large" data-action="ritual-return-menu">Retourner à l’observatoire</button></div>`, 'ending-modal');
      return;
    }
    run = null;
    persist();
    closeRitualModal();
    showRitualScreen('menu');
    ritualToast('Gain de gacha archivé. Nouvelle tentative prête.');
  }

  function showRitualGachaLab() {
    if (!ritualReady) return;
    const cardsToTest = cards.filter(card => card.rarity !== 'offering' && card.tribe !== 'signature');
    const tierButtons = Object.entries(GACHA_TIERS).map(([tier, config]) => `<button class="banner-choice" data-ritual-lab-roll="${tier}"><small>${esc(config.label)}</small><strong>Tirage aléatoire</strong><span>${esc(config.desc)}</span>${gachaRatesMarkup(tier)}</button>`).join('');
    const progressButtons = [
      ...(story?.dialogueArchives || []).map(item => ({ kind:'archive', item, owned:profile.dialogueRewards.includes(item.id), label:'archive de dialogue' })),
      ...(story?.relationshipMemories || []).map(item => ({ kind:'memory', item, owned:profile.relationshipMemories.includes(item.id), label:'souvenir relationnel' })),
      ...(story?.secretThreads || []).map(item => ({ kind:'thread', item, owned:profile.secretThreads.includes(item.id), label:'fil contradictoire' })),
      ...(story?.routeSecrets || []).map(item => ({ kind:'route', item, owned:profile.routeSecrets.includes(item.id), label:'dossier vivant' })),
      ...(story?.secretVerdicts || []).map(item => ({ kind:'verdict', item, owned:profile.secretVerdicts.includes(item.id), label:'jugement secret' })),
      ...(story?.constellations || []).map(item => ({ kind:'constellation', item, owned:profile.constellations.includes(item.id), label:'constellation' }))
    ].map(({ kind, item, owned, label }) => {
      const reward = getCard(item.reward);
      return `<button data-ritual-lab-unlock='${kind}:${item.id}'>${reward ? ritualCardDisplayMarkup(reward) : `<span class="asset-placeholder"><b>?</b><strong>${esc(item.title)}</strong><small>${esc(label)}</small></span>`}<small>${owned ? 'déjà résolu · rejouer le reveal QA' : `forcer ${esc(label)} · ${esc(item.title)}`}</small></button>`;
    }).join('');
    const guardianButtons = Object.keys(GUARDIANS).map(id => {
      const guardian = GUARDIANS[id];
      const owned = profile.unlockedGuardians.includes(id);
      return `<button class="gacha-guardian-card" data-ritual-lab-unlock="guardian:${id}">${guardianPortraitMarkup(id, 'gacha-guardian-art')}<small>${owned ? 'DÉJÀ RECRUTÉE · REJOUER LE REVEAL' : 'FORCER LE DÉBLOCAGE QA'}</small><strong>${esc(guardian.name)}</strong><span>${esc(guardian.title)}</span></button>`;
    }).join('');
    const awakeningButtons = Object.entries(GUARDIAN_SIGNATURES).map(([id, sig]) => {
      return `<button data-ritual-lab-unlock='awakening:${id}'>${ritualCardDisplayMarkup(getCard(sig.awakening))}<small>${profile.unlockedAwakenings.includes(id) ? 'déjà débloqué · rejouer le reveal' : profile.unlockedSpellCards.includes(id) ? `second nom de ${esc(GUARDIANS[id].name)}` : 'QA : débloque aussi la signature requise'}</small></button>`;
    }).join('');
    const spellButtons = Object.entries(GUARDIAN_SIGNATURES).map(([id, sig]) => {
      return `<button data-ritual-lab-unlock='spell:${id}'>${ritualCardDisplayMarkup(getCard(sig.default))}<small>${profile.unlockedSpellCards.includes(id) ? 'déjà gravée · injecter dans le deck courant' : `forcer la Spell Card de ${esc(GUARDIANS[id].name)}`}</small></button>`;
    }).join('');
    const murmurButtons = RUN_MURMURS.map(murmur => {
      const selected = run?.murmur?.id === murmur.id || (!run && profile.nextRunMurmur === murmur.id);
      return `<button class="${selected ? 'selected' : ''}" data-ritual-lab-murmur="${esc(murmur.id)}"><b>${esc(murmur.icon)} ${esc(murmur.title)}</b><span>${run ? selected ? 'Actif sur la run en cours' : 'Forcer sur la run en cours' : selected ? 'Préparé pour la prochaine run' : 'Préparer la prochaine run'}</span></button>`;
    }).join('');
    openRitualModal(`<span class='kicker'>CENTRE DE TEST GACHA</span><h2>Tirages animés et gains réels</h2><p>Le bouton de test utilise la même animation que la fin de run. Les scénarios QA ignorent les conditions de progression, modifient vraiment le profil et injectent les cartes dans la run active.</p><section class='gacha-lab-section'><header><b>Tirage réel par palier</b><small>Aléatoire, avec pitié et verrous de progression normaux</small></header><div class='banner-selector ritual-gacha-tier-grid'>${tierButtons}</div></section><section class='gacha-lab-section'><header><b>Scénarios QA · cartes</b><small>Force n’importe quelle carte non-signature, même déjà possédée</small></header><div class='ritual-catalogue lab-cards'>${cardsToTest.map(card => `<button data-ritual-lab-unlock='card:${card.id}'>${ritualCardDisplayMarkup(card)}<small>${profile.unlockedCards.includes(card.id) ? 'déjà possédée · injecter/tester' : 'débloquer + ajouter au deck courant si une run existe'}</small></button>`).join('')}</div></section><section class='gacha-lab-section'><header><b>Spell Cards personnelles</b><small>Force les six signatures de base, même sans avoir terminé leur progression</small></header><div class='ritual-catalogue lab-cards'>${spellButtons}</div></section><section class='gacha-lab-section'><header><b>Last Words très rares</b><small>Force les six secondes Spell Cards et leur état d’éveil</small></header><div class='ritual-catalogue lab-cards'>${awakeningButtons}</div></section><section class='gacha-lab-section'><header><b>Scénarios QA · progression secrète</b><small>Force archives, fils contradictoires et constellations pour tester toute la chaîne de secrets</small></header><div class='ritual-catalogue lab-cards'>${progressButtons}</div></section><section class='gacha-lab-section'><header><b>Scénarios QA · murmures de run</b><small>Force l’objectif mystérieux actuel ou prépare celui de la prochaine tentative</small></header><div class='gacha-lab-chip-grid murmur-lab-grid'>${murmurButtons}</div></section><section class='gacha-lab-section'><header><b>Conductrices uniques</b><small>QA : tous les portraits et unlocks sont testables</small></header><div class='planned-roster-grid gacha-guardian-grid'>${guardianButtons}</div></section><section class='gacha-lab-section recap-lab-section'><header><b>Récapitulatif de fin de run</b><small>Prévisualise la vraie insertion dans la collection sans modifier le profil</small></header><button class='secondary-button large' data-action='ritual-lab-run-recap'>Prévisualiser le récapitulatif complet</button></section><div class='modal-actions gacha-lab-actions'><button class='secondary-button danger-button qa-reset-button' data-action='ritual-qa-reset'>Réinitialiser</button><button class='primary-button' data-action='ritual-modal-close'>Fermer</button></div>`, 'gacha-lab-dashboard');
  }

  function confirmQaProgressReset() {
    openRitualModal(`<span class="kicker">OUTIL QA</span><h2>Réinitialiser toute la progression ?</h2><p>Cette action remet le profil au tout début : run en cours, vérités, cartes découvertes, gacha, pity, conductrices débloquées, tutoriels vus et historiques de test seront effacés. Les deux conductrices de départ resteront disponibles comme dans une nouvelle installation.</p><div class="modal-actions qa-reset-confirm-actions"><button class="secondary-button" data-action="test-gacha">Annuler</button><button class="secondary-button danger-button" data-action="ritual-confirm-qa-reset">Oui, reprendre à zéro</button></div>`, 'qa-reset-modal');
  }

  function resetQaProgressToStart() {
    closeCardZoom();
    closeCodexPortraitZoom();
    clearFeedback();
    pendingGuardian = null;
    pendingCardZoomAction = null;
    ritualPointerDrag?.ghost?.remove();
    ritualPointerDrag = null;
    suppressNextClick = false;
    run = null;
    profile = normalizeProfile(structuredClone(DEFAULT_PROFILE));
    clearMoonrailStorage();
    persist();
    closeRitualModal();
    showRitualScreen('menu');
    ritualToast('Progression réinitialisée durablement : nouveau départ prêt.');
  }

  async function openRitualLabRoll(tier) {
    if (!ritualReady) return;
    const reward = rollRitualGacha(tier);
    await showRitualGachaAnimation(tier, 'TEST GACHA ALÉATOIRE');
    const result = applyRitualGachaReward(reward, { addToRun:true, affectPity:true, source:'lab_random' });
    openRitualModal(`<span class="kicker">TEST GACHA</span><h2>${esc(result.title)}</h2>${ritualGachaRewardMarkup(reward, result)}<div class="modal-actions"><button class="primary-button" data-action="test-gacha">Retour au labo</button></div>`, 'gacha-reveal-modal');
  }

  function forceRunMurmur(id) {
    const murmur = RUN_MURMURS.find(item => item.id === id);
    if (!murmur) return ritualToast('Murmure QA inconnu.');
    if (run) {
      run.murmur = { id:murmur.id, base:runMurmurSnapshot(), claimed:false };
      createRouteGraph();
      persist();
      ritualToast(`Murmure forcé : ${murmur.title}`);
      closeRitualModal();
      showRitualMap();
      return;
    }
    profile.nextRunMurmur = murmur.id;
    persist();
    ritualToast(`Prochaine run préparée : ${murmur.title}`);
    showRitualGachaLab();
  }

  async function applyRitualLabProgressUnlock(id) {
    const [kind, target] = String(id || '').split(':');
    const pools = {
      archive: { list:story?.dialogueArchives || [], bucket:profile.dialogueRewards, title:'Archive QA résolue' },
      memory: { list:story?.relationshipMemories || [], bucket:profile.relationshipMemories, title:'Souvenir relationnel QA réclamé' },
      thread: { list:story?.secretThreads || [], bucket:profile.secretThreads, title:'Fil QA résolu' },
      route: { list:story?.routeSecrets || [], bucket:profile.routeSecrets, title:'Dossier vivant QA croisé' },
      verdict: { list:story?.secretVerdicts || [], bucket:profile.secretVerdicts, title:'Jugement secret QA rendu' },
      constellation: { list:story?.constellations || [], bucket:profile.constellations, title:'Constellation QA résolue' }
    };
    const pool = pools[kind];
    const item = pool?.list?.find(entry => entry.id === target);
    if (!pool || !item) return false;
    if (!pool.bucket.includes(target)) pool.bucket.push(target);
    const reward = getCard(item.reward);
    if (reward) {
      if (!profile.unlockedCards.includes(reward.id)) profile.unlockedCards.push(reward.id);
      if (!profile.gachaUnlockedCards.includes(reward.id)) profile.gachaUnlockedCards.push(reward.id);
      if (!profile.discoveredCards.includes(reward.id)) profile.discoveredCards.push(reward.id);
      if (run?.deck && !run.deck.includes(reward.id)) addRunCard(reward.id);
      queueCardTypeTutorial(reward.id);
    }
    persist();
    const tier = reward?.rarity === 'unique' ? 'souverain' : reward?.rarity === 'secret' ? 'stellaire' : reward?.rarity === 'rare' ? 'lunaire' : 'crépusculaire';
    await showRitualGachaAnimation(tier, 'QA PROGRESSION SECRÈTE');
    openRitualModal(`<span class="kicker">TEST PROGRESSION FORCÉE</span><h2>${esc(pool.title)} · ${esc(item.title)}</h2><p>${esc(item.lore || item.hint || 'Progression appliquée au profil.')}</p>${reward ? `<div class="ritual-event-card">${ritualCardDisplayMarkup(reward)}</div><p class="memory-note">La carte est ajoutée au profil${run ? ' et au deck courant' : ''} pour test immédiat.</p>` : ''}<div class="modal-actions"><button class="secondary-button" data-action="ritual-observatory">Voir l’observatoire</button><button class="primary-button" data-action="test-gacha">Retour au labo</button></div>`, 'gacha-reveal-modal story-modal');
    return true;
  }

  async function applyRitualLabUnlock(id) {
    if (await applyRitualLabProgressUnlock(id)) return;
    const [kind, target] = String(id || '').split(':');
    if (kind === 'spell' && GUARDIAN_SIGNATURES[target]) {
      const spellId = GUARDIAN_SIGNATURES[target].default;
      const spell = getCard(spellId);
      if (!profile.unlockedGuardians.includes(target)) profile.unlockedGuardians.push(target);
      if (!profile.unlockedSpellCards.includes(target)) profile.unlockedSpellCards.push(target);
      if (spellId && !profile.discoveredCards.includes(spellId)) profile.discoveredCards.push(spellId);
      if (run?.guardianId === target && spellId && !run.deck.includes(spellId)) addRunCard(spellId);
      queueCardTypeTutorial(spell);
      persist();
      await showRitualGachaAnimation('stellaire', 'QA SPELL CARD PERSONNELLE');
      openRitualModal(`<span class="kicker">SIGNATURE QA GRAVÉE</span><h2>${esc(GUARDIANS[target].name)}</h2><div class="gacha-reveal">${ritualCardDisplayMarkup(spell)}</div><p>La Spell Card est débloquée${run?.guardianId === target ? ' et ajoutée au deck courant' : ''}. Son effet de combat peut maintenant être testé.</p><div class="modal-actions"><button class="primary-button" data-action="test-gacha">Retour au labo</button></div>`, 'gacha-reveal-modal');
      return;
    }
    const reward = rollRitualGacha(runGachaTier(), id);
    if (!reward) return ritualToast('Scénario de gacha invalide.');
    const tier = reward.rarity === 'unique' ? 'souverain' : reward.rarity === 'secret' ? 'stellaire' : reward.rarity === 'rare' ? 'lunaire' : 'crépusculaire';
    await showRitualGachaAnimation(tier, 'SCÉNARIO GACHA QA');
    const result = applyRitualGachaReward(reward, { addToRun:true, affectPity:false, source:'lab_forced', forceUnlock:true });
    openRitualModal(`<span class="kicker">TEST GACHA FORCÉ</span><h2>${esc(result.title)}</h2>${ritualGachaRewardMarkup(reward, result)}<div class="modal-actions"><button class="primary-button" data-action="test-gacha">Retour au labo</button></div>`, 'gacha-reveal-modal');
  }

  function unlockAfterAttempt() {
    refreshGuardianUnlocks();
  }

  function finishRitualVictory() {
    const guardianId = run?.guardianId;
    resolveRunMurmurReward();
    profile.clears++;
    if (guardianId) {
      profile.characterClears[guardianId] = (profile.characterClears[guardianId] || 0) + 1;
      if (!profile.unlockedSpellCards.includes(guardianId)) {
        profile.unlockedSpellCards.push(guardianId);
        queueCardTypeTutorial(GUARDIAN_SIGNATURES[guardianId]?.default);
      }
    }
    markTruthReady('false_dawn');
    if (profile.truths.length >= 6) markTruthReady('name');
    const endingId = profile.truths.length >= 18 && profile.clears >= 3 ? 'true_dawn' : profile.truths.length >= 8 ? 'revolt' : 'false_dawn';
    const ending = ENDINGS[endingId];
    if (!profile.endings.includes(endingId)) profile.endings.push(endingId);
    run.victoryEnding = { guardianId, endingId };
    run.endGachaTier = runGachaTier();
    run.endGachaTaken = false;
    persist();
    showDeathReport();
  }

  function guardianEndingHook(guardianId, endingId) {
    const arc = GUARDIAN_STORY_ARCS[guardianId];
    const sceneClues = {
      controleur:'Ayame scelle la porte du matin, mais laisse volontairement un interstice : elle veut savoir qui respire derrière l’aube.',
      mecano:'Kohana démonte une cloche tombée du ciel. À l’intérieur, le ressort porte son propre nom, gravé avant sa naissance.',
      rinka:'Rinka rit devant le Tribunal : si l’aube peut mentir, alors elle peut aussi être défiée en duel.',
      eir:'Eir écoute la brume derrière le soleil. Elle n’entend pas une victoire, mais un diagnostic qui recommence.',
      kaguya:'Kaguya reconnaît une constellation interdite dans les rails. Elle ne la nomme pas encore, par peur qu’elle réponde.',
      vespera:'Vespera regarde la lune manquante et sourit : certaines chutes ne demandent pas pardon.'
    };
    if (!arc) return endingId === 'true_dawn' ? 'La conductrice garde le silence. Le silence, lui, garde un secret.' : 'Une voix différente s’ajoute à l’histoire du Moonrail.';
    const evolution = endingId === 'true_dawn' ? arc.ending : endingId === 'revolt' ? arc.turn : arc.wound;
    const awakening = profile.unlockedAwakenings.includes(guardianId)
      ? ` Son Last Word, « ${getCard(GUARDIAN_SIGNATURES[guardianId]?.awakening)?.name || 'second nom'} », répond dans une vitre où personne ne se reflète.`
      : '';
    return `${evolution} ${sceneClues[guardianId] || ''}${awakening}`.trim();
  }

  function markTruthReady(id) {
    profile[`ready_${id}`] = true;
  }

  function truthAvailable(id) {
    const truth = story?.truths?.find(item => item.id === id);
    return profile[`ready_${id}`]
      || truthConditionMet(truth?.condition)
      || (id === 'mirror' && profile.attempts >= 1)
      || (id === 'clock' && profile.attempts >= 3)
      || (id === 'cage' && profile.hunterWins >= 1)
      || (id === 'boiler' && profile.lifetimeStokes >= 10)
      || (id === 'false_dawn' && profile.clears >= 1)
      || (id === 'name' && profile.clears >= 1 && profile.truths.length >= 6);
  }

  function truthConditionMet(condition) {
    if (!condition) return false;
    if (condition.kind === 'has_truth') return loreUnlocked(condition.value);
    if (condition.kind === 'all_truths') return Array.isArray(condition.value) && condition.value.every(loreUnlocked);
    if (condition.kind === 'has_archive') return profile.dialogueRewards.includes(condition.value);
    if (condition.kind === 'has_thread') return profile.secretThreads.includes(condition.value);
    if (condition.kind === 'has_route_secret') return profile.routeSecrets.includes(condition.value);
    if (condition.kind === 'has_memory') return profile.relationshipMemories.includes(condition.value);
    if (condition.kind === 'has_verdict') return profile.secretVerdicts.includes(condition.value);
    return truthProgress(condition.kind) >= condition.value;
  }

  function truthProgress(kind) {
    return ({
      attempts: profile.attempts,
      stokes: profile.lifetimeStokes,
      hunters: profile.hunterWins,
      clears: profile.clears,
      discovered: profile.discoveredCards.length,
      truths: profile.truths.length,
      dialogues: completedDialoguePairs().length,
      archives: profile.dialogueRewards.length,
      threads: profile.secretThreads.length,
      route_secrets: profile.routeSecrets.length,
      thread_hints: profile.secretThreadHints.length,
      relationship_memories: profile.relationshipMemories.length,
      secret_verdicts: profile.secretVerdicts.length,
      sacrifices: profile.lifetimeHandSacrifices
    })[kind] || 0;
  }

  function constellationProgress(constellation) {
    const required = constellation?.truths || [];
    const found = required.filter(id => profile.truths.includes(id));
    return { required, found, complete: required.length > 0 && found.length === required.length, ratio: required.length ? found.length / required.length : 0 };
  }

  function constellationMarkup() {
    return (story?.constellations || []).map((constellation, index) => {
      const progress = constellationProgress(constellation);
      const claimed = profile.constellations.includes(constellation.id);
      if (!claimed && !progress.complete) return '';
      const reward = getCard(constellation.reward);
      const state = claimed ? 'claimed' : progress.complete ? 'available' : 'locked';
      const missing = progress.required.filter(id => !profile.truths.includes(id)).length;
      const buttonState = claimed ? `data-ritual-observatory-entry="constellation:${esc(constellation.id)}"` : '';
      const status = claimed ? 'RÉCOMPENSE ARCHIVÉE' : progress.complete ? 'CONSTELLATION COMPLÈTE' : `${progress.found.length}/${progress.required.length} vérités reliées`;
      return `<button class="constellation-card ${state}" ${claimed ? buttonState : `data-ritual-constellation="${esc(constellation.id)}"`}>
        <i style="${truthRelicStyle(constellation.art ?? index)}"></i>
        <small>${esc(constellation.tier || 'constellation')}</small>
        <strong>${claimed || progress.complete ? esc(constellation.title) : '???'}</strong>
        <span>${claimed ? esc(constellation.lore) : progress.complete ? `Réclamer : ${esc(reward?.name || 'récompense')}` : `${esc(constellation.hint)} · ${missing} fragment${missing > 1 ? 's' : ''} manquant${missing > 1 ? 's' : ''}.`}</span>
        <b class="constellation-progress" style="--constellation-progress:${Math.round(progress.ratio * 100)}%"><em></em></b>
      </button>`;
    }).join('');
  }

  function claimConstellation(id) {
    const constellation = story?.constellations?.find(item => item.id === id);
    if (!constellation || profile.constellations.includes(id)) return;
    const progress = constellationProgress(constellation);
    if (!progress.complete) return;
    profile.constellations.push(id);
    const reward = getCard(constellation.reward);
    if (reward) {
      if (!profile.unlockedCards.includes(reward.id)) profile.unlockedCards.push(reward.id);
      if (!profile.gachaUnlockedCards.includes(reward.id)) profile.gachaUnlockedCards.push(reward.id);
      if (!profile.discoveredCards.includes(reward.id)) profile.discoveredCards.push(reward.id);
      queueCardTypeTutorial(reward.id);
    }
    persist();
    openRitualModal(`<span class="kicker">CONSTELLATION RÉSOLUE</span><h2>${esc(constellation.title)}</h2><p>${esc(constellation.lore)}</p>${reward ? `<div class="ritual-event-card">${ritualCardDisplayMarkup(reward)}</div>` : ''}<p class="memory-note">Cette récompense rejoint aussi les pools de gacha et peut être retestée en run.</p><div class="modal-actions"><button class="primary-button" data-action="ritual-observatory">Retour à l’observatoire</button></div>`, 'constellation-modal story-modal');
  }

  function dialogueArchiveProgress(archive) {
    if (archive?.minPairs) {
      const count = completedDialoguePairs().length;
      return { found:Math.min(count, archive.minPairs), required:archive.minPairs, complete:count >= archive.minPairs };
    }
    const pairs = archive?.pairs || [];
    const found = pairs.filter(dialoguePairComplete).length;
    return { found, required:pairs.length, complete:pairs.length > 0 && found === pairs.length };
  }

  function dialogueArchiveMarkup() {
    return (story?.dialogueArchives || []).map((archive, index) => {
      const progress = dialogueArchiveProgress(archive);
      const claimed = profile.dialogueRewards.includes(archive.id);
      if (!claimed && !progress.complete) return '';
      const reward = getCard(archive.reward);
      const state = claimed ? 'claimed' : progress.complete ? 'available' : 'locked';
      return `<button class="dialogue-archive-card ${state}" ${claimed ? `data-ritual-observatory-entry="archive:${esc(archive.id)}"` : `data-ritual-dialogue-archive="${esc(archive.id)}"`}>
        <i style="${dialogueArchiveStyle(archive.art ?? index)}"></i>
        <small>${esc(archive.tier || 'archive')}</small>
        <strong>${claimed || progress.complete ? esc(archive.title) : 'Archive scellée'}</strong>
        <span>${claimed ? esc(archive.lore) : progress.complete ? `Réclamer : ${esc(reward?.name || 'récompense')}` : `${esc(archive.hint)} · ${progress.found}/${progress.required}`}</span>
        <b class="dialogue-archive-progress" style="--dialogue-progress:${Math.round(progress.found / Math.max(1, progress.required) * 100)}%"><em></em></b>
      </button>`;
    }).join('');
  }

  function completedDialogueMarkup() {
    return completedDialoguePairs().map(pairId => {
      const [playerId, bossId] = pairId.split(':');
      const player = GUARDIANS[playerId];
      const boss = GUARDIANS[bossId];
      const dialogue = BOSS_DIALOGUE_MATRIX[playerId]?.[bossId];
      if (!player || !boss || !dialogue) return '';
      const artIndex = Object.keys(GUARDIANS).indexOf(playerId) * 6 + Object.keys(GUARDIANS).indexOf(bossId);
      return `<button class="dialogue-archive-card completed-dialogue-card claimed" data-ritual-observatory-dialogue="${esc(pairId)}">
        <i style="${dialogueArchiveStyle(artIndex)}"></i>
        <small>CONVERSATION VÉCUE</small>
        <strong>${esc(dialogueShortName(player))} face à ${esc(dialogueShortName(boss))}</strong>
        <span>Relire l’échange avant le contrôle et ses paroles après la victoire.</span>
      </button>`;
    }).join('');
  }

  function showCompletedDialogue(pairId) {
    if (!completedDialoguePairs().includes(pairId)) return;
    const [playerId, bossId] = pairId.split(':');
    const player = GUARDIANS[playerId];
    const boss = GUARDIANS[bossId];
    const dialogue = BOSS_DIALOGUE_MATRIX[playerId]?.[bossId];
    if (!player || !boss || !dialogue) return;
    const exchange = (stage, title) => `<section class="observatory-dialogue-stage"><small>${esc(title)}</small>${(dialogue[stage] || []).map((line, index) => `<blockquote><b>${esc(index === 0 ? dialogueShortName(player) : dialogueShortName(boss))}</b><p>${esc(line)}</p></blockquote>`).join('')}</section>`;
    openRitualModal(`<span class="kicker">DIALOGUE ARCHIVÉ</span><h2>${esc(dialogueShortName(player))} · ${esc(dialogueShortName(boss))}</h2><p>Cette conversation est visible parce que vous l’avez réellement menée en run. Des vérités et souvenirs relationnels peuvent encore en faire surgir des variantes.</p><div class="observatory-dialogue-replay">${exchange('before', 'AVANT LE CONTRÔLE')}${exchange('after', 'APRÈS LA VICTOIRE')}</div><div class="observatory-purpose"><b>À quoi cela sert</b><span>Chaque duo complété alimente les archives, les souvenirs relationnels et certains secrets. Rejouer ce duel après une découverte peut révéler un échange différent.</span></div><div class="modal-actions"><button class="primary-button" data-action="ritual-observatory">Retour à l’observatoire</button></div>`, 'story-modal observatory-dialogue-modal');
  }

  function claimDialogueArchive(id) {
    const archive = story?.dialogueArchives?.find(item => item.id === id);
    if (!archive || profile.dialogueRewards.includes(id)) return;
    if (!dialogueArchiveProgress(archive).complete) return;
    profile.dialogueRewards.push(id);
    const reward = getCard(archive.reward);
    if (reward) {
      if (!profile.unlockedCards.includes(reward.id)) profile.unlockedCards.push(reward.id);
      if (!profile.gachaUnlockedCards.includes(reward.id)) profile.gachaUnlockedCards.push(reward.id);
      if (!profile.discoveredCards.includes(reward.id)) profile.discoveredCards.push(reward.id);
      queueCardTypeTutorial(reward.id);
    }
    persist();
    openRitualModal(`<span class="kicker">ARCHIVE DE DIALOGUE</span><h2>${esc(archive.title)}</h2><p>${esc(archive.lore)}</p>${reward ? `<div class="ritual-event-card">${ritualCardDisplayMarkup(reward)}</div>` : ''}<p class="memory-note">Les dialogues vus deviennent une progression de collection : cette carte rejoint les récompenses permanentes.</p><div class="modal-actions"><button class="primary-button" data-action="ritual-observatory">Retour à l’observatoire</button></div>`, 'dialogue-archive-modal story-modal');
  }

  function routeSecretMarkup() {
    return (story?.routeSecrets || []).map((event, index) => {
      const claimed = profile.routeSecrets.includes(event.id);
      if (!claimed) return '';
      const linkedThread = story?.secretThreads?.find(item => item.id === event.thread);
      const threadDone = linkedThread && profile.secretThreads.includes(linkedThread.id);
      const reward = getCard(event.reward);
      return `<button class="route-secret-card claimed" data-ritual-observatory-entry="route:${esc(event.id)}">
        <i style="${routeSecretEventStyle(event.art ?? index)}"></i>
        <small>${esc(event.tier || 'dossier vivant')}</small>
        <strong>${claimed ? esc(event.title) : 'Dossier non croisé'}</strong>
        <span>${claimed ? esc(event.lore) : esc(event.hint)}</span>
        <b>${claimed ? `Carte : ${esc(reward?.name || 'preuve')}` : `Fil lié : ${esc(linkedThread?.title || '???')}`}</b>
        <em>${threadDone ? 'fil lié résolu' : claimed ? 'preuve de route acquise' : 'à trouver pendant une run'}</em>
      </button>`;
    }).join('');
  }

  function secretThreadRequirementStatus(requirement) {
    const kind = requirement?.kind;
    if (kind === 'pair') {
      return { complete:dialoguePairComplete(requirement.id), label:`Dialogue ${requirement.id || '???'}` };
    }
    if (kind === 'truth') {
      const truth = story?.truths?.find(item => item.id === requirement.id);
      return { complete:profile.truths.includes(requirement.id), label:truth?.title || requirement.id };
    }
    if (kind === 'archive') {
      const archive = story?.dialogueArchives?.find(item => item.id === requirement.id);
      return { complete:profile.dialogueRewards.includes(requirement.id), label:archive?.title || requirement.id };
    }
    if (kind === 'constellation') {
      const constellation = story?.constellations?.find(item => item.id === requirement.id);
      return { complete:profile.constellations.includes(requirement.id), label:constellation?.title || requirement.id };
    }
    if (kind === 'thread') {
      const thread = story?.secretThreads?.find(item => item.id === requirement.id);
      return { complete:profile.secretThreads.includes(requirement.id), label:thread?.title || requirement.id };
    }
    if (kind === 'route_secret') {
      const routeSecret = story?.routeSecrets?.find(item => item.id === requirement.id);
      return { complete:profile.routeSecrets.includes(requirement.id), label:routeSecret?.title || requirement.id };
    }
    if (kind === 'memory') {
      const memory = story?.relationshipMemories?.find(item => item.id === requirement.id);
      return { complete:profile.relationshipMemories.includes(requirement.id), label:memory?.title || requirement.id };
    }
    if (kind === 'verdict') {
      const verdict = story?.secretVerdicts?.find(item => item.id === requirement.id);
      return { complete:profile.secretVerdicts.includes(requirement.id), label:verdict?.title || requirement.id };
    }
    if (kind === 'dialogues') return { complete:completedDialoguePairs().length >= requirement.value, label:`${completedDialoguePairs().length}/${requirement.value} dialogues complets` };
    const current = truthProgress(kind);
    const labels = { clears:'aubes atteintes', attempts:'tentatives', hunters:'boss vaincus', truths:'vérités', discovered:'cartes vues', archives:'archives réclamées', threads:'fils résolus', relationship_memories:'souvenirs relationnels', secret_verdicts:'jugements secrets' };
    return { complete:current >= requirement.value, label:`${Math.min(current, requirement.value)}/${requirement.value} ${labels[kind] || kind}` };
  }

  function relationshipMemoryProgress(memory) {
    const requirements = memory?.requirements || [];
    const statuses = requirements.map(secretThreadRequirementStatus);
    const found = statuses.filter(item => item.complete).length;
    return { requirements, statuses, found, required:requirements.length, complete:requirements.length > 0 && found === requirements.length, ratio:requirements.length ? found / requirements.length : 0 };
  }

  function relationshipMemoryMarkup() {
    return (story?.relationshipMemories || []).map((memory, index) => {
      const progress = relationshipMemoryProgress(memory);
      const claimed = profile.relationshipMemories.includes(memory.id);
      if (!claimed && !progress.complete) return '';
      const reward = getCard(memory.reward);
      const state = claimed ? 'claimed' : progress.complete ? 'available' : 'locked';
      const requirements = progress.statuses.map(item => `<em class="${item.complete ? 'done' : ''}">${item.complete ? '✓' : '·'} ${esc(item.label)}</em>`).join('');
      return `<button class="relationship-memory-card ${state}" ${claimed ? `data-ritual-observatory-entry="memory:${esc(memory.id)}"` : `data-ritual-relationship-memory="${esc(memory.id)}"`}>
        <i style="${relationshipMemoryStyle(memory.art ?? index)}"></i>
        <small>${esc(memory.tier || 'souvenir')}</small>
        <strong>${claimed || progress.complete ? esc(memory.title) : 'Souvenir incomplet'}</strong>
        <span>${claimed ? esc(memory.lore) : progress.complete ? `Réclamer : ${esc(reward?.name || 'récompense')}` : esc(memory.hint)}</span>
        <b class="relationship-memory-progress" style="--relationship-memory-progress:${Math.round(progress.ratio * 100)}%"><i></i></b>
        <mark>${requirements}</mark>
      </button>`;
    }).join('');
  }

  function claimRelationshipMemory(id) {
    const memory = story?.relationshipMemories?.find(item => item.id === id);
    if (!memory || profile.relationshipMemories.includes(id)) return;
    const progress = relationshipMemoryProgress(memory);
    if (!progress.complete) return;
    profile.relationshipMemories.push(id);
    const reward = grantCardToProfile(memory.reward, false);
    persist();
    openRitualModal(`<span class="kicker">SOUVENIR RELATIONNEL</span><h2>${esc(memory.title)}</h2><p>${esc(memory.lore)}</p>${reward ? `<div class="ritual-event-card">${ritualCardDisplayMarkup(reward)}</div>` : ''}<p class="memory-note">Ce souvenir modifie aussi certaines répliques futures : les boss ne parlent plus tout à fait au même personnage.</p><div class="modal-actions"><button class="primary-button" data-action="ritual-observatory">Retour à l’observatoire</button></div>`, 'relationship-memory-modal story-modal');
  }

  function secretThreadProgress(thread) {
    const requirements = thread?.requirements || [];
    const statuses = requirements.map(secretThreadRequirementStatus);
    const found = statuses.filter(item => item.complete).length;
    return { requirements, statuses, found, required:requirements.length, complete:requirements.length > 0 && found === requirements.length, ratio:requirements.length ? found / requirements.length : 0 };
  }

  function secretThreadMarkup() {
    return (story?.secretThreads || []).map((thread, index) => {
      const progress = secretThreadProgress(thread);
      const claimed = profile.secretThreads.includes(thread.id);
      if (!claimed && !progress.complete) return '';
      const reward = getCard(thread.reward);
      const state = claimed ? 'claimed' : progress.complete ? 'available' : 'locked';
      const requirements = progress.statuses.map(item => `<em class="${item.complete ? 'done' : ''}">${item.complete ? '✓' : '·'} ${esc(item.label)}</em>`).join('');
      return `<button class="secret-thread-card ${state}" ${claimed ? `data-ritual-observatory-entry="thread:${esc(thread.id)}"` : `data-ritual-secret-thread="${esc(thread.id)}"`}>
        <i style="${secretThreadStyle(thread.art ?? index)}"></i>
        <small>${esc(thread.tier || 'fil secret')}</small>
        <strong>${claimed || progress.complete ? esc(thread.title) : 'Dossier contradictoire'}</strong>
        <span>${claimed ? esc(thread.lore) : progress.complete ? `Réclamer : ${esc(reward?.name || 'récompense')}` : esc(thread.hint)}</span>
        <b class="secret-thread-progress" style="--secret-thread-progress:${Math.round(progress.ratio * 100)}%"><i></i></b>
        <mark>${requirements}</mark>
      </button>`;
    }).join('');
  }

  function claimSecretThread(id) {
    const thread = story?.secretThreads?.find(item => item.id === id);
    if (!thread || profile.secretThreads.includes(id)) return;
    const progress = secretThreadProgress(thread);
    if (!progress.complete) return;
    profile.secretThreads.push(id);
    const reward = getCard(thread.reward);
    if (reward) {
      if (!profile.unlockedCards.includes(reward.id)) profile.unlockedCards.push(reward.id);
      if (!profile.gachaUnlockedCards.includes(reward.id)) profile.gachaUnlockedCards.push(reward.id);
      if (!profile.discoveredCards.includes(reward.id)) profile.discoveredCards.push(reward.id);
      queueCardTypeTutorial(reward.id);
    }
    persist();
    openRitualModal(`<span class="kicker">FIL CONTRADICTOIRE RÉSOLU</span><h2>${esc(thread.title)}</h2><p>${esc(thread.lore)}</p>${reward ? `<div class="ritual-event-card">${ritualCardDisplayMarkup(reward)}</div>` : ''}<p class="memory-note">Un dossier secret devient une progression durable : il peut ouvrir de nouvelles vérités et stabiliser une carte de collection.</p><div class="modal-actions"><button class="primary-button" data-action="ritual-observatory">Retour à l’observatoire</button></div>`, 'secret-thread-modal story-modal');
  }

  function secretVerdictProgress(verdict) {
    const requirements = verdict?.requirements || [];
    const statuses = requirements.map(secretThreadRequirementStatus);
    const found = statuses.filter(item => item.complete).length;
    return { requirements, statuses, found, required:requirements.length, complete:requirements.length > 0 && found === requirements.length, ratio:requirements.length ? found / requirements.length : 0 };
  }

  function murmurArchiveMarkup() {
    return RUN_MURMURS.map(murmur => {
      const found = profile.resolvedMurmurs.includes(murmur.id);
      if (!found) return '';
      return `<button class="murmur-archive-card found" data-ritual-observatory-entry="murmur:${esc(murmur.id)}">
        <i>${esc(murmur.icon)}</i>
        <small>${found ? 'MURMURE RÉSOLU' : 'MURMURE INCONNU'}</small>
        <strong>${found ? esc(murmur.title) : '???'}</strong>
        <span>${found ? esc(murmur.hint) : 'Résolvez ce type de murmure pendant une tentative pour l’archiver ici.'}</span>
      </button>`;
    }).join('');
  }

  function observatoryGuidanceItems() {
    const items = [];
    const push = item => items.push(item);
    (story?.truths || []).forEach(truth => {
      if (!profile.truths.includes(truth.id) && truthAvailable(truth.id)) {
        push({ priority:120, state:'ready', type:'Vérité prête', title:truth.title, detail:'Un objet de l’observatoire attend d’être examiné.', progress:'à lire maintenant' });
      }
    });
    (story?.constellations || []).forEach(constellation => {
      if (profile.constellations.includes(constellation.id)) return;
      const progress = constellationProgress(constellation);
      if (progress.complete) push({ priority:110, state:'ready', type:'Constellation', title:constellation.title, detail:`Récompense : ${getCard(constellation.reward)?.name || 'carte cachée'}`, progress:'complète' });
    });
    (story?.dialogueArchives || []).forEach(archive => {
      if (profile.dialogueRewards.includes(archive.id)) return;
      const progress = dialogueArchiveProgress(archive);
      if (progress.complete) push({ priority:105, state:'ready', type:'Archive', title:archive.title, detail:`Récompense : ${getCard(archive.reward)?.name || 'carte de dialogue'}`, progress:'à réclamer' });
    });
    (story?.relationshipMemories || []).forEach(memory => {
      if (profile.relationshipMemories.includes(memory.id)) return;
      const progress = relationshipMemoryProgress(memory);
      if (progress.complete) push({ priority:102, state:'ready', type:'Souvenir', title:memory.title, detail:`Récompense : ${getCard(memory.reward)?.name || 'carte relationnelle'}`, progress:'à réclamer' });
    });
    (story?.secretThreads || []).forEach(thread => {
      if (profile.secretThreads.includes(thread.id)) return;
      const progress = secretThreadProgress(thread);
      if (progress.complete) push({ priority:101, state:'ready', type:'Fil secret', title:thread.title, detail:`Récompense : ${getCard(thread.reward)?.name || 'carte secrète'}`, progress:'à réclamer' });
    });
    (story?.secretVerdicts || []).forEach(verdict => {
      if (profile.secretVerdicts.includes(verdict.id)) return;
      const progress = secretVerdictProgress(verdict);
      if (progress.complete) push({ priority:100, state:'ready', type:'Verdict', title:verdict.title, detail:`Récompense : ${getCard(verdict.reward)?.name || 'jugement'}`, progress:'à réclamer' });
    });
    return items.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }

  function observatoryGuidanceMarkup() {
    const items = observatoryGuidanceItems();
    if (!items.length) {
      return `<section class="observatory-guidance empty"><header><small>PISTES ACTIVES</small><h3>Le train refuse encore de parler clairement</h3></header><p>Relancez une run, affrontez un nouveau boss avec une autre conductrice, ou prenez une voie étrange : l’observatoire priorisera ici les premiers indices sérieux.</p></section>`;
    }
    return `<section class="observatory-guidance"><header><small>PISTES ACTIVES</small><h3>Ce que le joueur peut tenter maintenant</h3><b>${items.filter(item => item.state === 'ready').length} prêt(s)</b></header><div>${items.map(item => `<article class="${item.state}"><small>${esc(item.type)}</small><strong>${esc(item.title)}</strong><span>${esc(item.detail)}</span><em>${esc(item.progress)}</em></article>`).join('')}</div></section>`;
  }

  function secretVerdictMarkup() {
    return (story?.secretVerdicts || []).map((verdict, index) => {
      const progress = secretVerdictProgress(verdict);
      const claimed = profile.secretVerdicts.includes(verdict.id);
      if (!claimed && !progress.complete) return '';
      const reward = getCard(verdict.reward);
      const state = claimed ? 'claimed' : progress.complete ? 'available' : 'locked';
      const requirements = progress.statuses.map(item => `<em class="${item.complete ? 'done' : ''}">${item.complete ? '✓' : '·'} ${esc(item.label)}</em>`).join('');
      return `<button class="secret-verdict-card ${state}" ${claimed ? `data-ritual-observatory-entry="verdict:${esc(verdict.id)}"` : `data-ritual-secret-verdict="${esc(verdict.id)}"`}>
        <i style="${secretVerdictStyle(verdict.art ?? index)}"></i>
        <small>${esc(verdict.tier || 'jugement secret')}</small>
        <strong>${claimed || progress.complete ? esc(verdict.title) : 'Verdict scellé'}</strong>
        <span>${claimed ? esc(verdict.lore) : progress.complete ? `Réclamer : ${esc(reward?.name || 'récompense')}` : esc(verdict.hint)}</span>
        <b class="secret-verdict-progress" style="--secret-verdict-progress:${Math.round(progress.ratio * 100)}%"><i></i></b>
        <mark>${requirements}</mark>
      </button>`;
    }).join('');
  }

  function claimSecretVerdict(id) {
    const verdict = story?.secretVerdicts?.find(item => item.id === id);
    if (!verdict || profile.secretVerdicts.includes(id)) return;
    const progress = secretVerdictProgress(verdict);
    if (!progress.complete) return;
    profile.secretVerdicts.push(id);
    const reward = grantCardToProfile(verdict.reward, false);
    persist();
    openRitualModal(`<span class="kicker">JUGEMENT SECRET</span><h2>${esc(verdict.title)}</h2><p>${esc(verdict.lore)}</p>${reward ? `<div class="ritual-event-card">${ritualCardDisplayMarkup(reward)}</div>` : ''}<p class="memory-note">Ce verdict devient une preuve permanente : sa carte rejoint le profil, le gacha et le centre de test.</p><div class="modal-actions"><button class="primary-button" data-action="ritual-observatory">Retour à l’observatoire</button></div>`, 'secret-verdict-modal story-modal');
  }

  function collectionRaritySummaryMarkup(collectible = cards.filter(card => card.rarity !== 'offering')) {
    const order = ['common','uncommon','rare','secret','unique'];
    const seenCount = collectible.filter(card => profile.discoveredCards.includes(card.id)).length;
    const byRarity = order.map(rarity => {
      const total = collectible.filter(card => card.rarity === rarity).length;
      const seen = collectible.filter(card => card.rarity === rarity && profile.discoveredCards.includes(card.id)).length;
      return { rarity, total, seen, ratio:total ? seen / total : 0 };
    }).filter(item => item.total > 0 && (!['secret','unique'].includes(item.rarity) || item.seen > 0));
    return `<section class="collection-rarity-summary"><header><small>COMPLÉTION DES CARTES</small><h3>Où manque encore la nuit ?</h3></header><div>${byRarity.map(item => `<article data-rarity="${esc(item.rarity)}"><b>${esc(item.rarity)}</b><strong>${item.seen}/${item.total}</strong><i><em style="width:${Math.round(item.ratio * 100)}%"></em></i></article>`).join('')}</div><button class="night-album-entry" data-action="ritual-night-album"><span><small>ALBUM DE LA NUIT</small><strong>${seenCount}/${collectible.length} cartes aperçues</strong></span><b>◇</b></button></section>`;
  }

  function nightAlbumCatalogueMarkup(collectible = cards.filter(card => card.rarity !== 'offering')) {
    const order = ['common','uncommon','rare','secret','unique'];
    return order.map(rarity => {
      const group = collectible.filter(card => card.rarity === rarity);
      if (!group.length) return '';
      const seen = group.filter(card => profile.discoveredCards.includes(card.id)).length;
      if (['secret','unique'].includes(rarity) && !seen) return '';
      const entries = group.map(card => {
        const seen = profile.discoveredCards.includes(card.id);
        const body = `<i style="${seen ? cardArtStyle(card) : ''}"></i><div><small>${seen ? `${esc(card.tribe)} · ${esc(card.rarity)}` : 'Entrée scellée'}</small><strong>${seen ? esc(card.name) : 'Carte inconnue'}</strong><span>${seen ? esc(card.text) : 'Son image et son rôle apparaîtront après une rencontre.'}</span></div>`;
        return seen
          ? `<button class="catalogue-card night-album-card seen" data-rarity="${esc(card.rarity)}" data-ritual-album-card="${esc(card.id)}" aria-label="Lire ${esc(card.name)} en grand">${body}</button>`
          : `<article class="catalogue-card night-album-card unknown" data-rarity="${esc(card.rarity)}">${body}</article>`;
      }).join('');
      return `<section class="night-album-rarity" data-rarity="${esc(rarity)}"><header><small>${esc(rarity)}</small><b>${seen}/${group.length}</b></header><div class="night-album-grid">${entries}</div></section>`;
    }).join('');
  }

  function showAlbumCardZoom(id) {
    const card = getCard(id);
    if (!card || !profile.discoveredCards.includes(card.id)) return;
    const proxy = document.createElement('div');
    proxy.className = 'ritual-card';
    proxy.dataset.cardId = card.id;
    showCardZoom(proxy);
  }

  function showNightAlbum() {
    if (!ritualReady) return;
    const collectible = cards.filter(card => card.rarity !== 'offering');
    const seenCount = collectible.filter(card => profile.discoveredCards.includes(card.id)).length;
    openRitualModal(`<span class="kicker">ALBUM DE LA NUIT</span><div class="night-album-top-actions"><h2>${seenCount}/${collectible.length} cartes aperçues</h2><button class="secondary-button" data-action="ritual-observatory">Retour</button></div><div class="night-album-hero"><i>◇</i><div><strong>Le registre des rencontres</strong><span>Chaque entrée garde la trace de ce que vous avez vraiment croisé. Les inconnues restent muettes jusqu’à leur première apparition.</span></div></div>${nightAlbumCatalogueMarkup(collectible)}<div class="modal-actions"><button class="secondary-button" data-action="ritual-observatory">Retour à l’observatoire</button><button class="primary-button" data-action="ritual-modal-close">Refermer</button></div>`, 'observatory-modal night-album-modal');
  }

  function observatoryShelf(title, explanation, className, gridClass, content) {
    if (!String(content || '').trim()) return '';
    return `<section class="${className}"><h3>${esc(title)}</h3><p>${esc(explanation)}</p><div class="${gridClass}">${content}</div></section>`;
  }

  function showObservatoryEntry(ref) {
    const [kind, id] = String(ref || '').split(':');
    const pools = {
      constellation:story?.constellations || [], archive:story?.dialogueArchives || [],
      memory:story?.relationshipMemories || [], route:story?.routeSecrets || [],
      thread:story?.secretThreads || [], verdict:story?.secretVerdicts || [], murmur:RUN_MURMURS
    };
    const item = pools[kind]?.find(entry => entry.id === id);
    if (!item) return;
    const labels = { constellation:'CONSTELLATION ARCHIVÉE', archive:'ARCHIVE DE DIALOGUE', memory:'SOUVENIR RELATIONNEL', route:'DOSSIER VIVANT', thread:'FIL CONTRADICTOIRE', verdict:'JUGEMENT SECRET', murmur:'MURMURE RÉSOLU' };
    const purposes = {
      constellation:'Relie plusieurs vérités et ajoute sa carte au pool permanent.',
      archive:'Prouve que des relations précises ont été vécues et ouvre une récompense permanente.',
      memory:'Modifie certaines répliques futures entre les deux conductrices concernées.',
      route:'Sert de preuve à des fils contradictoires et peut ouvrir une vérité plus profonde.',
      thread:'Assemble plusieurs preuves incompatibles et débloque une carte secrète.',
      verdict:'Combine plusieurs systèmes de progression pour rendre un jugement durable.',
      murmur:'Trace un objectif accompli pendant une run et participe aux vérités liées aux tentatives.'
    };
    const reward = getCard(item.reward);
    openRitualModal(`<span class="kicker">${esc(labels[kind] || 'ARCHIVE')}</span><h2>${esc(item.title)}</h2><p>${esc(item.lore || item.hint || item.reward || 'Cette trace appartient désormais à votre observatoire.')}</p><div class="observatory-purpose"><b>À quoi cela sert</b><span>${esc(purposes[kind] || 'Cette découverte fait progresser durablement l’enquête.')}</span></div>${reward ? `<div class="ritual-event-card">${ritualCardDisplayMarkup(reward)}</div><p class="memory-note">Récompense liée : ${esc(reward.name)}.</p>` : ''}<div class="modal-actions"><button class="primary-button" data-action="ritual-observatory">Retour à l’observatoire</button></div>`, 'story-modal observatory-detail-modal');
  }

  function showObservatory() {
    if (!ritualReady) return;
    const visibleTruths = story.truths.filter(truth => profile.truths.includes(truth.id) || truthAvailable(truth.id));
    const objects = visibleTruths.map(truth => {
      const found = profile.truths.includes(truth.id), available = truthAvailable(truth.id);
      return `<button class="observatory-object ${found ? 'found' : 'available'}" data-ritual-truth="${truth.id}"><i>${found ? '✦' : '◉'}</i><small>${found ? 'VÉRITÉ DÉCOUVERTE · RELIRE' : 'NOUVEL OBJET À EXAMINER'}</small><strong>${found ? esc(truth.title) : 'Examiner la trace'}</strong><span>${found ? esc(truth.hint) : 'Une action de votre dernière run a rendu cette trace lisible.'}</span></button>`;
    }).join('');
    const collectible = cards.filter(card => card.rarity !== 'offering');
    const milestones = MILESTONES.map(item => {
      const done = profile.milestones.includes(item.id);
      const reward = getCard(item.reward);
      const rewardMarkup = done && reward
        ? `<button class="milestone-reward-card" data-ritual-album-card="${esc(reward.id)}">Carte débloquée · ${esc(reward.name)}</button>`
        : `<span>${done ? 'Débloqué' : 'À accomplir'}</span>`;
      return `<article class="milestone ${done ? 'done' : ''}"><i>${done ? '✓' : '○'}</i><div><strong>${esc(item.name)}</strong><small>Condition : ${esc(item.text)}</small></div>${rewardMarkup}</article>`;
    }).join('');
    const lessons = SALVAGE_LESSONS.filter(lesson => profile.lessons.includes(lesson.id));
    const guidance = observatoryGuidanceMarkup();
    const raritySummary = collectionRaritySummaryMarkup(collectible);
    const hasFirstTruth = profile.truths.length > 0;
    const truthSection = objects
      ? `<section class="truth-shelf"><h3>${hasFirstTruth ? 'Vérités découvertes' : 'Première trace lisible'}</h3><p>${hasFirstTruth ? 'Relisez une vérité pour comprendre ce qu’elle révèle et les systèmes qu’elle peut ouvrir.' : 'Une trace est devenue lisible. Examinez-la pour comprendre ce qu’elle ouvre.'}</p><div class="observatory-grid">${objects}</div></section>`
      : '';
    const unlockedShelves = hasFirstTruth ? [
      observatoryShelf('Murmures de run','Uniquement les murmures déjà accomplis. Cliquez pour relire leur rôle.','murmur-archive-shelf','murmur-archive-grid',murmurArchiveMarkup()),
      observatoryShelf('Dialogues vécus','Uniquement les face-à-face déjà terminés. Cliquez pour relire les deux temps de la conversation.','dialogue-history-shelf','dialogue-archive-grid',completedDialogueMarkup()),
      observatoryShelf('Archives de dialogues','Uniquement les archives réclamables ou déjà archivées.','dialogue-archive-shelf','dialogue-archive-grid',dialogueArchiveMarkup()),
      observatoryShelf('Souvenirs relationnels','Ces souvenirs modifient les dialogues futurs ; cliquez un souvenir acquis pour relire son effet.','relationship-memory-shelf','relationship-memory-grid',relationshipMemoryMarkup()),
      observatoryShelf('Dossiers vivants','Preuves croisées en run et déjà ramenées au dernier wagon.','route-secret-shelf','route-secret-collection-grid',routeSecretMarkup()),
      observatoryShelf('Fils contradictoires','Fils résolus ou immédiatement réclamables, sans révéler les dossiers futurs.','secret-thread-shelf','secret-thread-grid',secretThreadMarkup()),
      observatoryShelf('Jugements secrets du Tribunal','Jugements rendus ou prêts à l’être. Les autres restent entièrement cachés.','secret-verdict-shelf','secret-verdict-grid',secretVerdictMarkup()),
      observatoryShelf('Constellations de secrets','Constellations complètes ou archivées uniquement.','constellation-shelf','constellation-grid',constellationMarkup())
    ].join('') : '';
    const progress = hasFirstTruth ? `<div class="observatory-progress quiet" aria-label="Progression de l’observatoire"><span style="--truth-progress:${profile.truths.length / truthTotal() * 100}%"></span></div>` : '';
    openRitualModal(`<span class="kicker">ENTRE LES TENTATIVES</span><h2>L’observatoire du dernier wagon</h2>${progress}${raritySummary}${hasFirstTruth ? guidance : ''}${truthSection}${unlockedShelves}<section class="milestone-shelf"><h3>Défis de maîtrise</h3><div>${milestones}</div></section><section class="lesson-shelf"><h3>Plans sauvés des anciennes runs</h3>${lessons.length ? `<div>${lessons.map(lesson => `<article><i>⚙</i><div><strong>${esc(lesson.name)}</strong><small>${esc(lesson.text)}</small></div></article>`).join('')}</div>` : '<p>Le premier convoi rattrapé laissera un plan de reconstruction.</p>'}</section><div class="modal-actions"><button class="primary-button" data-action="ritual-modal-close">Refermer</button></div>`, 'observatory-modal');
  }

  function placeholderPanel(title, subtitle, detail) {
    return `<article><span class="asset-placeholder"><b>◇</b><strong>PLACEHOLDER</strong><small>asset à produire</small></span><div><small>${esc(subtitle)}</small><strong>${esc(title)}</strong><span>${esc(detail)}</span></div></article>`;
  }

  function implementedPanel(title, subtitle, detail) {
    return `<article><span class="mechanic-status"><b>✓</b><strong>JOUABLE</strong><small>fonction active</small></span><div><small>${esc(subtitle)}</small><strong>${esc(title)}</strong><span>${esc(detail)}</span></div></article>`;
  }

  function showCollectionHub() {
    if (!ritualReady) return;
    const collectible = cards.filter(card => card.rarity !== 'offering');
    const discovered = collectible.filter(card => profile.discoveredCards.includes(card.id));
    const currentGuardians = Object.entries(GUARDIANS).map(([id, guardian]) => {
      const unlocked = profile.unlockedGuardians.includes(id);
      const spellUnlocked = profile.unlockedSpellCards.includes(id);
      const awakened = profile.unlockedAwakenings.includes(id);
      return `<article class="${unlocked ? 'unlocked' : 'locked'}"><span class="asset-placeholder"><b>${unlocked ? '☾' : '?'}</b><strong>${unlocked ? 'JOUABLE' : 'VERROUILLÉE'}</strong><small>${awakened ? 'Second nom éveillé' : spellUnlocked ? 'Signature acquise' : 'Signature à graver'}</small></span><div><small>${esc(guardian.title)}</small><strong>${unlocked ? esc(guardian.name) : '???'}</strong><span>${unlocked ? `${esc(guardian.perk)} ${spellUnlocked ? '· Signature prête.' : '· Finissez sa progression pour graver sa signature.'}` : esc(GUARDIAN_UNLOCKS[id]?.hint || 'Indice caché dans le lore.')}</span></div></article>`;
    }).join('');
    const plannedGuardians = PLANNED_GUARDIANS.map(hero => placeholderPanel(hero.name, hero.species, `Archétype prévu : ${hero.archetype}`)).join('');
    const implementedMechanics = IMPLEMENTED_MECHANICS.map(item => implementedPanel(item.name, 'MÉCANIQUE JOUABLE', item.text)).join('');
    const ownedAwakenings = profile.unlockedAwakenings.length;
    openRitualModal(`<span class="kicker">COLLECTION & ÉQUIPE</span><h2>${discovered.length}/${collectible.length} cartes vues · ${profile.unlockedGuardians.length}/${Object.keys(GUARDIANS).length + PLANNED_GUARDIANS.length} conductrices planifiées</h2><p>Les éléments roses signalent seulement des assets définitifs à produire plus tard. Les mécaniques listées ci-dessous sont jouables dès maintenant.</p><div class="observatory-progress"><span style="--truth-progress:${discovered.length / Math.max(1, collectible.length) * 100}%"></span><b>${ownedAwakenings}/6 noms éveillés · ${profile.unlockedSpellCards.length}/6 signatures · ${profile.ritualGachaHistory.length} prismes archivés</b></div><section class="planned-roster"><h3>Conductrices jouables actuelles</h3><div class="planned-roster-grid">${currentGuardians}</div></section><section class="planned-roster"><h3>Roster futur placeholder d’assets</h3><p>Objectif business : donner envie de collectionner longtemps, sans créer les assets définitifs maintenant.</p><div class="planned-roster-grid">${plannedGuardians}</div></section><section class="planned-roster"><h3>Mécaniques déjà développées</h3><div class="planned-roster-grid">${implementedMechanics}</div></section><div class="modal-actions"><button class="secondary-button" data-action="ritual-observatory">Voir les secrets</button><button class="primary-button" data-action="ritual-modal-close">Fermer</button></div>`, 'observatory-modal collection-modal');
  }

  function discoverTruth(id) {
    const truth = story.truths.find(item => item.id === id);
    if (!truth || (!truthAvailable(id) && !profile.truths.includes(id))) return;
    if (!profile.truths.includes(id)) {
      profile.truths.push(id);
      const unlocks = {
        mirror:'dream_butterfly', clock:'grave_crow', cage:'moon_stag', boiler:'dawn_spark', white_route:'centipede_train',
        no_blood:'eir_mist', five_teeth:'rinka_ember', false_dawn:'kaguya_astral', name:'sunless_conductor',
        three_private_oaths:'white_thread_loom', moonrail_first_lie:'forgotten_driver_glove', tribunal_parenthesis:'court_keykeeper',
        player_seat:'rusted_orbit_key', dawn_refusal:'amahina_first_refusal',
        first_dialogue_echo:'whisper_archive_moth', six_dialogue_echoes:'rebuke_ink_tengu', twelve_dialogue_echoes:'sealed_laugh_kitsune',
        archive_room_unlocked:'half_confession_doll',
        first_false_thread:'ticket_stub_karakasa', three_false_threads:'borrowed_name_umbrella',
        red_thread_without_knot_truth:'red_thread_snail', fox_clock_parenthesis_truth:'fox_clock_inquisitor', black_ticket_manifest_truth:'black_manifest_conductor'
      };
      const card = unlocks[id]; if (card && !profile.unlockedCards.includes(card)) { profile.unlockedCards.push(card); queueCardTypeTutorial(card); }
      persist();
    }
    openRitualModal(`<span class="kicker">VÉRITÉ ${profile.truths.indexOf(id) + 1} / ${truthTotal()}</span><h2>${esc(truth.title)}</h2><p>${truthLore(id)}</p><div class="modal-actions"><button class="primary-button" data-action="ritual-observatory">Continuer à fouiller</button></div>`, 'story-modal');
  }

  function truthLore(id) {
    const customLore = story?.truths?.find(truth => truth.id === id)?.lore;
    if (customLore) return esc(customLore);
    return ({
      mirror:'Votre reflet ne conduit pas le même train. Il affirme avoir déjà atteint le matin onze fois.',
      clock:'L’horloge possède treize heures. La dernière ne mesure pas le temps : elle compte vos tentatives.',
      cage:'L’oiseau n’est pas enfermé. Il retient volontairement une minuscule lumière entre ses côtes.',
      boiler:'La chaudière murmure : « Je ne suis pas née dans le train. Le train est né autour de moi. »',
      white_route:'Une voie blanche traverse les marges de toutes les cartes. Elle mène derrière le ciel.',
      no_blood:'Le Moonrail atteint un portail sans brûler une seule carte. La chaudière peut donc avancer autrement.',
      five_teeth:'La vitesse excédentaire révèle des rails qui n’existent qu’entre deux secondes.',
      false_dawn:'Le premier soleil n’émet aucune chaleur. C’est un décor posé par le Tribunal.',
      name:`L’Étincelle se nomme Amahina. ${story.hidden_truth}`
    })[id] || 'Le bois craque comme si le wagon respirait.';
  }

  function showRitualDeck() {
    if (!run) return;
    const states = ensureRunCardStates();
    const alive = states.filter(state => !state.dead);
    const returning = states.filter(state => state.dead && (state.returnsNextCombat || isReturningSignature(state.cardId)));
    const wounded = alive.filter(state => state.hp !== null && state.hp < (effectiveCard(state.cardId)?.health || 0));
    const battle = run.battle;
    const cardsMarkup = states.map(state => {
      const ref = runBattleRef(state);
      const card = effectiveCard(ref) || getCard(state.cardId);
      const dead = !!state.dead;
      const currentHp = state.hp === null ? card.health : state.hp;
      const reforms = dead && (state.returnsNextCombat || isReturningSignature(state.cardId));
      const status = reforms ? 'BRISÉE · REVIENT AU PROCHAIN COMBAT' : dead ? 'MORTE POUR LA RUN' : currentHp < card.health ? `${currentHp}/${card.health} VIE · BLESSÉE` : `${card.health}/${card.health} VIE`;
      return `<div class="run-card-state ${reforms ? 'returning-signature' : dead ? 'dead' : currentHp < card.health ? 'wounded' : 'healthy'}">${ritualCardDisplayMarkup(card)}<b>${esc(status)}</b>${run.cardInstanceMods?.[state.uid]?.tuned ? '<small>RÉGLÉE</small>' : ''}</div>`;
    }).join('');
    const battleState = battle ? `<div class="deck-pile-summary"><span><b>${battle.deck.length}</b> à piocher</span><span><b>${battle.hand.length}</b> en main</span><span><b>${battle.discard.length}</b> en défausse</span><span><b>${battle.playerBoard.filter(Boolean).length}</b> posées</span></div>` : '';
    openRitualModal(`<span class="kicker">DECK DE LA NUIT</span><h2>${alive.length} cartes actives · ${wounded.length} blessée${wounded.length > 1 ? 's' : ''}${returning.length ? ` · ${returning.length} signature${returning.length > 1 ? 's' : ''} en reformation` : ''}</h2><p class="deck-modal-hint">La Vie affichée persiste entre les combats. Une carte morte est retirée puis remplacée sous 10 cartes. Seules les Spell Cards et Last Words se reforment à pleine Vie pour le combat suivant.</p>${battleState}<div class="ritual-deck-grid run-state-deck-grid">${cardsMarkup}</div><div class="modal-actions"><button class="primary-button" data-action="ritual-modal-close">Revenir</button></div>`, 'deck-modal run-deck-state-modal');
  }

  function showRitualTutorial() {
    openRitualModal(`<h2>Faites avancer le Moonrail avant d’être rattrapé</h2><div class="onboarding-objective"><div><small>VOTRE JAUGE</small><strong>MOONRAIL 0/10</strong><span>Une attaque sans obstacle fait avancer le train.</span></div><b>CONTRE</b><div><small>LA MENACE</small><strong>POURSUITE 0/10</strong><span>Une attaque ennemie sans défense rapproche le contrôle.</span></div></div><div class="ritual-tutorial"><div><b>1</b><strong>Main automatique</strong><span>Le jeu pioche pour vous. Au-delà de 4 cartes, un sacrifice définitif est demandé.</span></div><div><b>2</b><strong>Affectez un passager</strong><span>Les cartes ✦ coûtent de la Lueur ; les cartes ✹ utilisent les Cendres. Glissez-les ou cliquez.</span></div><div><b>3</b><strong>La mort persiste</strong><span>Une carte blessée garde sa Vie entre les combats. Une morte quitte la run et peut déclencher un renfort. Seules les signatures personnelles reviennent au combat suivant.</span></div><div><b>4</b><strong>Chauffez avec prudence</strong><span>La première carte donne +2 Lueurs et +1 Cendre. Les suivantes sont détruites pour la run et donnent seulement +1 Cendre.</span></div></div><div class="modal-actions"><button class="secondary-button" data-action="ritual-rulebook-from-tutorial">Voir les règles complètes</button><button class="primary-button large" data-action="ritual-close-tutorial">Jouer le premier départ</button></div>`, 'tutorial-modal');
  }

  function showRitualRulebook(fromTutorial = false) {
    const returnAction = fromTutorial ? 'ritual-return-opening-tutorial' : 'ritual-modal-close';
    const returnLabel = fromTutorial ? 'Revenir au premier départ' : 'Revenir au plateau';
    openRitualModal(`<span class="kicker">MANUEL DE CONDUITE</span><h2>Les règles du Moonrail</h2><div class="rulebook-grid"><section><b>①</b><h3>La course</h3><p>Atteignez 10 Progression avant 10 Poursuite. Une unité sans opposant ajoute sa Puissance à la jauge correspondante.</p></section><section><b>②</b><h3>Lueur et Cendres</h3><p>Les coûts ✦ utilisent la Lueur du tour. Les coûts ✹ utilisent les Cendres produites en chauffant, sacrifiant ou perdant des cartes.</p></section><section><b>③</b><h3>Jouer ou remplacer</h3><p>Glissez une carte vers un wagon. Une carte ordinaire écrasée meurt pour la run ; une signature brisée reviendra seulement au prochain combat.</p></section><section><b>④</b><h3>Blessures persistantes</h3><p>La Vie restante est conservée entre les combats. Une carte morte quitte la run et le deck est remonté à 10. Seules les Spell Cards et Last Words se reforment à pleine Vie.</p></section><section><b>⑤</b><h3>Main et chaudière</h3><p>La limite est de 4. La première chauffe donne +2 Lueurs et +1 Cendre sans perdre la carte ; les destructions suivantes donnent seulement +1 Cendre.</p></section><section><b>⑥</b><h3>Les manœuvres</h3><p>La rangée du haut annonce les ennemis à venir. Les règles de boss et les deux jauges restent visibles pendant leur activation.</p></section><section><b>⑦</b><h3>Choisir la ligne</h3><p>La carte montre les embranchements futurs, mais seules les étapes reliées au train sont cliquables. Vous choisissez à nouveau après chaque arrêt.</p></section><section><b>⑧</b><h3>Présages et gacha</h3><p>Tous les 3 Présages stellaires ajoutent 2 profondeurs virtuelles au prisme de fin de run. Une victoire ouvre aussi son gacha avant la fin personnelle.</p></section></div><div class="modal-actions"><button class="primary-button" data-action="${returnAction}">${returnLabel}</button></div>`, 'rulebook-modal');
  }

  function guardianStoryProgress(guardianId) {
    const pairs = completedDialoguePairs().filter(pair => pair.startsWith(`${guardianId}:`)).length;
    const clears = Number(profile.characterClears?.[guardianId] || 0);
    return {
      pairs,
      clears,
      wound:pairs >= 1 || clears >= 1,
      turn:profile.unlockedSpellCards.includes(guardianId) || clears >= 1,
      ending:clears >= 1,
      epilogue:profile.unlockedAwakenings.includes(guardianId)
    };
  }

  function guardianArcMarkup(guardianId) {
    const arc = GUARDIAN_STORY_ARCS[guardianId];
    const progress = guardianStoryProgress(guardianId);
    if (!arc) return '';
    const awakeningName = getCard(GUARDIAN_SIGNATURES[guardianId]?.awakening)?.name || 'Last Word éveillé';
    const epilogueText = `${GUARDIANS[guardianId]?.name || 'Cette conductrice'} porte maintenant son second nom : ${awakeningName}. Le Codex ne sait pas encore si c’est une délivrance ou une preuve supplémentaire.`;
    const steps = [
      ['DÉSIR', arc.want, true],
      ['FAUTE', arc.wound, progress.wound],
      ['BASCULE', arc.turn, progress.turn],
      ['FIN PERSONNELLE', arc.ending, progress.ending],
      ['ÉPILOGUE ÉVEILLÉ', epilogueText, progress.epilogue]
    ].filter(([, text, revealed]) => text && revealed);
    return `<div class="guardian-arc-progress">${steps.map(([label, text]) => `<article class="revealed"><small>${label}</small><p>${esc(text)}</p></article>`).join('')}</div>`;
  }

  function showCodexPortraitZoom(guardianId) {
    const guardian = GUARDIANS[guardianId];
    if (!guardian || document.querySelector('.portrait-zoom-layer')) return;
    const layer = document.createElement('div');
    layer.className = 'portrait-zoom-layer';
    layer.innerHTML = `<button class="portrait-zoom-backdrop" data-action="ritual-portrait-zoom-close" aria-label="Fermer l’artwork"></button><section class="portrait-zoom-panel"><button class="portrait-zoom-close" data-action="ritual-portrait-zoom-close">×</button><div class="portrait-zoom-art" style="${spriteSheetStyle('codex-daily-life-sheet-v1.png', 3, 2, guardian.portrait)}"></div><aside><span class="kicker">ARTWORK DU CODEX</span><h2>${esc(guardian.name)}</h2><p>${esc(guardian.title)}</p><small>Scène quotidienne conservée dans le Codex des Cent Lunes.</small></aside></section>`;
    document.body.appendChild(layer);
    requestAnimationFrame(() => layer.classList.add('visible'));
  }

  function closeCodexPortraitZoom() {
    document.querySelector('.portrait-zoom-layer')?.remove();
  }

  function showLoreCodex() {
    const entries = Object.entries(GUARDIANS).map(([id, guardian]) => {
      const spellUnlocked = profile.unlockedSpellCards.includes(id);
      const awakened = profile.unlockedAwakenings.includes(id);
      const progress = guardianStoryProgress(id);
      const signature = spellUnlocked ? ` Signature gravée : ${esc(GUARDIAN_SIGNATURES[id].label)}.` : '';
      const second = awakened ? ` Second nom éveillé : ${esc(getCard(GUARDIAN_SIGNATURES[id].awakening)?.name || 'révélé')}.` : '';
      return `<section class="codex-character-entry">${codexDailyPortraitMarkup(id)}<div class="codex-character-heading"><b>☾</b><small>${esc(guardian.title)} · SCÈNE QUOTIDIENNE</small><h3>${esc(guardian.name)}</h3><mark>${progress.pairs}/5 relations archivées · ${progress.clears} fin${progress.clears > 1 ? 's' : ''}</mark></div><p>${esc(guardian.voice)}${signature}${second}</p>${guardianArcMarkup(id)}</section>`;
    }).join('');
    openRitualModal(`<span class='kicker'>CODEX DES CENT LUNES</span><h2>Six versions de la même faute</h2><p class='codex-lead'>Le Festival des Cent Reflets n’a pas seulement perdu son aube : chaque conductrice a participé différemment au cycle qui l’effaçait. Les dialogues, fins et souvenirs relationnels révèlent progressivement leur responsabilité.</p><div class='rulebook-grid codex-lore-grid'>${entries}</div><div class='modal-actions'><button class='primary-button' data-action='ritual-modal-close'>Refermer</button></div>`, 'rulebook-modal codex-lore-modal');
  }

  function toggleSound() {
    profile.soundMuted = !profile.soundMuted;
    ritualToast(profile.soundMuted ? 'Sons coupés pour cette session.' : 'Sons réactivés.');
    persist();
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  }

  function abandonRitual() {
    openRitualModal(`<span class="kicker">QUITTER LA LIGNE</span><h2>Abandonner cette tentative ?</h2><p>Le convoi sera déclaré rattrapé et ouvrira directement un prisme de fin de run. Il n’y aura pas de choix de carte supplémentaire.</p><div class="modal-actions"><button class="text-button" data-action="ritual-modal-close">Continuer</button><button class="secondary-button" data-action="ritual-confirm-abandon">Abandonner</button></div>`);
  }

  function handleClick(event) {
    if (suppressNextClick) {
      suppressNextClick = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const button = event.target.closest('button');
    if (button) {
      if (button.dataset.ritualGuardian) return showGuardianDeckPreview(button.dataset.ritualGuardian);
      if (button.dataset.ritualRouteNode) return inspectRouteNode(button.dataset.ritualRouteNode);
      if (button.dataset.ritualPath) return choosePath(button.dataset.ritualPath);
      if (button.dataset.ritualDraw) return drawRitualCard(button.dataset.ritualDraw);
      if (button.dataset.ritualHand !== undefined) return selectHand(Number(button.dataset.ritualHand));
      if (button.dataset.ritualPlayerSlot !== undefined) return interactPlayerLane(Number(button.dataset.ritualPlayerSlot));
      if (button.dataset.ritualOverwrite !== undefined) return confirmLaneOverwrite(Number(button.dataset.ritualOverwrite));
      if (button.dataset.ritualReward) return takeReward(button.dataset.ritualReward);
      if (button.dataset.ritualUpgrade) return upgradeCard(button.dataset.ritualUpgrade);
      if (button.dataset.ritualUpgradePath) return chooseUpgradePath(button.dataset.ritualUpgradePath);
      if (button.dataset.ritualForge !== undefined) return chooseForge(Number(button.dataset.ritualForge));
      if (button.dataset.ritualBuy) return buyRitualCard(button.dataset.ritualBuy);
      if (button.dataset.ritualTransform !== undefined) return chooseTransform(Number(button.dataset.ritualTransform));
      if (button.dataset.ritualPact) return choosePact(button.dataset.ritualPact);
      if (button.dataset.ritualWeather) return chooseWeather(button.dataset.ritualWeather);
      if (button.dataset.ritualSwitch) return chooseSecretSwitch(button.dataset.ritualSwitch);
      if (button.dataset.ritualRouteSecretChoice) return chooseRouteSecret(button.dataset.ritualRouteSecretChoice);
      if (button.dataset.ritualRewrite !== undefined) return chooseStarterRewrite(Number(button.dataset.ritualRewrite));
      if (button.dataset.ritualSacrificeHand !== undefined) return sacrificeHandCard(Number(button.dataset.ritualSacrificeHand));
      if (button.dataset.ritualObservatoryDialogue) return showCompletedDialogue(button.dataset.ritualObservatoryDialogue);
      if (button.dataset.ritualObservatoryEntry) return showObservatoryEntry(button.dataset.ritualObservatoryEntry);
      if (button.dataset.ritualTruth) return discoverTruth(button.dataset.ritualTruth);
      if (button.dataset.ritualConstellation) return claimConstellation(button.dataset.ritualConstellation);
      if (button.dataset.ritualDialogueArchive) return claimDialogueArchive(button.dataset.ritualDialogueArchive);
      if (button.dataset.ritualRelationshipMemory) return claimRelationshipMemory(button.dataset.ritualRelationshipMemory);
      if (button.dataset.ritualSecretThread) return claimSecretThread(button.dataset.ritualSecretThread);
      if (button.dataset.ritualSecretVerdict) return claimSecretVerdict(button.dataset.ritualSecretVerdict);
      if (button.dataset.ritualAlbumCard) return showAlbumCardZoom(button.dataset.ritualAlbumCard);
      if (button.dataset.ritualCodexPortrait) return showCodexPortraitZoom(button.dataset.ritualCodexPortrait);
      if (button.dataset.ritualLabRoll) return openRitualLabRoll(button.dataset.ritualLabRoll);
      if (button.dataset.ritualLabUnlock) return applyRitualLabUnlock(button.dataset.ritualLabUnlock);
      if (button.dataset.ritualLabMurmur) return forceRunMurmur(button.dataset.ritualLabMurmur);
      const action = button.dataset.action;
      const handled = ({
        'home': () => showRitualScreen('menu'),
        'ritual-new': beginRitual,
        'ritual-observatory': showObservatory,
        'ritual-night-album': showNightAlbum,
        'ritual-choose-guardian': showGuardianChoice,
        'ritual-confirm-guardian': () => pendingGuardian && startRitual(pendingGuardian),
        'ritual-modal-close': closeRitualModal,
        'ritual-card-zoom-close': closeCardZoom,
        'ritual-portrait-zoom-close': closeCodexPortraitZoom,
        'ritual-card-zoom-confirm': confirmCardZoomAction,
        'ritual-card-type-tutorial-close': closeRitualModal,
        'ritual-end-turn': resolveRitualTurn,
        'ritual-stoke': stokeSelectedCard,
        'ritual-rulebook': () => showRitualRulebook(false),
        'ritual-rulebook-from-tutorial': () => showRitualRulebook(true),
        'ritual-return-opening-tutorial': showRitualTutorial,
        'ritual-run-murmur-detail': showRunMurmurDetail,
        'ritual-skip-reward': finishPendingReward,
        'ritual-boss-reward': () => showCardReward('boss'),
        'ritual-complete-event': () => { closeRitualModal(); completeNode(); },
        'ritual-return-map': () => { closeRitualModal(); showRitualMap(); },
        'ritual-return-menu': () => { closeRitualModal(); showRitualScreen('menu'); showObservatory(); },
        'ritual-death-report': showDeathReport,
        'ritual-open-run-gacha': openRunEndGacha,
        'ritual-finish-after-gacha': finishAfterRunGacha,
        'ritual-complete-run-recap': completeRunAfterProgressRecap,
        'ritual-lab-run-recap': () => showRunProgressRecap(true),
        'ritual-casualty-continue': continueAfterRunCasualties,
        'ritual-deck': showRitualDeck,
        'deck': showRitualDeck,
        'ritual-abandon': abandonRitual,
        'ritual-confirm-abandon': () => finishRitualRun(false),
        'ritual-close-tutorial': () => { profile.tutorialSeen = true; persist(); closeRitualModal(); },
        'test-gacha': showRitualGachaLab,
        'ritual-qa-reset': confirmQaProgressReset,
        'ritual-confirm-qa-reset': resetQaProgressToStart,
        'collection': showCollectionHub,
        'codex': showLoreCodex,
        'sound': toggleSound,
        'fullscreen': toggleFullscreen,
        'help': () => showRitualRulebook(false)
      })[action];
      if (handled) return handled();
    }
    const zoomCard = event.target.closest('.ritual-card');
    if (zoomCard && !event.target.closest('.card-zoom-layer')) {
      event.preventDefault();
      event.stopPropagation();
      return showCardZoom(zoomCard);
    }
  }

  function handleDragStart(event) {
    const card = event.target.closest('[data-ritual-hand]');
    if (!card || !run?.battle || run.battle.resolving) return;
    event.dataTransfer.setData('text/plain', card.dataset.ritualHand);
    event.dataTransfer.effectAllowed = 'move';
    run.battle.selectedHand = Number(card.dataset.ritualHand);
  }

  function handleDragOver(event) {
    const slot = event.target.closest('[data-ritual-player-slot]');
    if (!slot || !run?.battle || run.battle.resolving) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event) {
    const slot = event.target.closest('[data-ritual-player-slot]');
    if (!slot || !run?.battle || run.battle.resolving) return;
    event.preventDefault();
    const index = Number(event.dataTransfer.getData('text/plain'));
    if (Number.isInteger(index)) run.battle.selectedHand = index;
    interactPlayerLane(Number(slot.dataset.ritualPlayerSlot));
  }

  function handlePointerDown(event) {
    const card = event.target.closest('[data-ritual-hand]');
    if (!card || !run?.battle || run.battle.resolving || (event.button && event.button !== 0)) return;
    ritualPointerDrag = { index:Number(card.dataset.ritualHand), startX:event.clientX, startY:event.clientY, dragging:false, ghost:null };
  }

  function handlePointerMove(event) {
    if (!ritualPointerDrag || !run?.battle || run.battle.resolving) return;
    const dx = event.clientX - ritualPointerDrag.startX;
    const dy = event.clientY - ritualPointerDrag.startY;
    if (!ritualPointerDrag.dragging && Math.hypot(dx, dy) < 8) return;
    if (!ritualPointerDrag.dragging) {
      const source = document.querySelector(`[data-ritual-hand="${ritualPointerDrag.index}"]`);
      ritualPointerDrag.dragging = true;
      run.battle.selectedHand = ritualPointerDrag.index;
      source?.classList.add('pointer-drag-source');
      const ghost = source?.cloneNode(true);
      if (ghost) {
        ghost.classList.add('ritual-drag-ghost');
        ghost.removeAttribute('data-ritual-hand');
        document.body.appendChild(ghost);
        ritualPointerDrag.ghost = ghost;
      }
    }
    positionRitualDragGhost(event);
    event.preventDefault();
  }

  function positionRitualDragGhost(event) {
    const ghost = ritualPointerDrag?.ghost;
    if (!ghost) return;
    ghost.style.left = `${event.clientX}px`;
    ghost.style.top = `${event.clientY}px`;
  }

  function finishRitualPointerDrag(event, cancelled = false) {
    if (!ritualPointerDrag) return;
    const drag = ritualPointerDrag;
    document.querySelector(`[data-ritual-hand="${drag.index}"]`)?.classList.remove('pointer-drag-source');
    drag.ghost?.remove();
    ritualPointerDrag = null;
    if (!drag.dragging) return;
    suppressNextClick = true;
    setTimeout(() => { suppressNextClick = false; }, 140);
    event.preventDefault?.();
    event.stopPropagation?.();
    if (cancelled || !run?.battle || run.battle.resolving) return;
    const slot = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-ritual-player-slot]');
    run.battle.selectedHand = drag.index;
    if (slot) interactPlayerLane(Number(slot.dataset.ritualPlayerSlot));
    else renderRitualBattle();
  }

  function handleKey(event) {
    if (document.querySelector('.portrait-zoom-layer') && event.key === 'Escape') {
      event.preventDefault();
      return closeCodexPortraitZoom();
    }
    if (document.querySelector('.card-zoom-layer') && event.key === 'Escape') {
      event.preventDefault();
      return closeCardZoom();
    }
    if (document.querySelector('#modal-layer.open .night-album-modal') && event.key === 'Escape') {
      event.preventDefault();
      return closeRitualModal();
    }
    if (!run?.battle || $('#modal-layer')?.classList.contains('open')) return;
    if (event.key.toLowerCase() === 'q') drawRitualCard('deck');
    if (event.key.toLowerCase() === 'w') stokeSelectedCard();
    if (event.code === 'Space') { event.preventDefault(); resolveRitualTurn(); }
    if (/^[1-9]$/.test(event.key)) selectHand(Number(event.key) - 1);
    const lane = ({a:0,z:1,e:2})[event.key.toLowerCase()];
    if (lane !== undefined) interactPlayerLane(lane);
  }

  function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  function nextPaint() {
    if (typeof requestAnimationFrame !== 'function') return wait(50);
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }

  async function boot() {
    try {
      const [cardsResponse, storyResponse] = await Promise.all([fetch('../data/ritual_cards.json'), fetch('../data/ritual_story.json')]);
      cards = await cardsResponse.json(); story = await storyResponse.json();
      cardMap = Object.fromEntries(cards.map(card => [card.id, card]));
      if (run?.battle) migrateBattle(run.battle);
      if (run?.deck?.length) queueCurrentDeckTutorials(); else profile.pendingCardTypeTutorials = [];
      ritualReady = true; renderRitualProfile();
      document.addEventListener('click', handleClick);
      document.addEventListener('dragstart', handleDragStart);
      document.addEventListener('dragover', handleDragOver);
      document.addEventListener('drop', handleDrop);
      document.addEventListener('pointerdown', handlePointerDown);
      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', event => finishRitualPointerDrag(event));
      document.addEventListener('pointercancel', event => finishRitualPointerDrag(event, true));
      document.addEventListener('keydown', handleKey);
      window.addEventListener('resize', scheduleRouteViewportFocus);
      $('#ritual-route-viewport')?.addEventListener('keydown', handleRouteViewportKey);
      if (run?.deck?.length) setTimeout(() => showPendingCardTypeTutorial(), 320);
    } catch (error) {
      console.error('Ritual boot failed', error);
      ritualToast('La Centième Nuit n’a pas pu charger ses cartes.');
    }
  }

  boot();

  function migrateBattle(battle) {
    ensureRunCardStates();
    battle.playerBoard = (battle.playerBoard || []).slice(0, BALANCE.lanes); while (battle.playerBoard.length < BALANCE.lanes) battle.playerBoard.push(null);
    battle.enemyBoard = (battle.enemyBoard || []).slice(0, BALANCE.lanes); while (battle.enemyBoard.length < BALANCE.lanes) battle.enemyBoard.push(null);
    battle.forecast = (battle.forecast || []).slice(0, BALANCE.lanes); while (battle.forecast.length < BALANCE.lanes) battle.forecast.push(null);
    battle.progress ??= Math.max(0, battle.balance || 0);
    battle.pursuit ??= Math.max(0, -(battle.balance || 0));
    battle.lumen ??= run.guardianId === 'mecano' ? BALANCE.baseLumen + 1 : run.guardianId === 'vespera' ? BALANCE.baseLumen + 2 : BALANCE.baseLumen;
    battle.ashes ??= 0; battle.casualties ||= [];
    battle.discard ||= [];
    battle.stokedThisTurn ??= false; battle.stokesThisBattle ??= 0; battle.nextLumen ??= 0;
    battle.secretLastWords ||= {}; battle.signatureBursts ||= [];
    battle.timeline ||= []; battle.eventSeq ??= battle.timeline.length;
    battle.resolving = false;
    run.daysLeft = Math.max(run.daysLeft || 0, 1);
  }
})();

