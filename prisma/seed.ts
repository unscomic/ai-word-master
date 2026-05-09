import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"

const adapter = new PrismaLibSql({ url: "file:./dev.db" })
const prisma = new PrismaClient({ adapter })

// ========== 四级核心词汇（520词）==========
const CET4_WORDS = [
  "abandon","ability","aboard","abroad","absence","absolute","absorb","abstract","abundant","academic",
  "accelerate","accent","accept","access","accompany","accomplish","account","accumulate","accurate","accuse",
  "achieve","acknowledge","acquire","adapt","addition","adequate","adjust","administration","admire","admit",
  "adopt","advance","advantage","advertise","advice","affair","affect","afford","aggressive","agreement",
  "agriculture","alcohol","alert","alliance","allowance","alongside","alter","alternative","amaze","ambition",
  "amount","amuse","analyze","ancestor","anchor","ancient","anniversary","announce","annual","anxiety",
  "apart","apparent","appeal","appetite","appliance","application","apply","appoint","appreciate","approach",
  "appropriate","approve","arise","arouse","arrange","arrest","artificial","aspect","assemble","assess",
  "assign","assist","associate","assume","atmosphere","attach","attain","attempt","attend","attitude",
  "attract","attribute","audience","authority","automatic","available","avenue","average","avoid","award",
  "aware","awful","awkward","background","backward","bacteria","balance","ban","bankrupt","banner",
  "barely","bargain","barrel","barrier","battery","bay","beam","behalf","behave","belief",
  "beloved","beneath","benefit","besides","billion","bind","biology","blanket","blast","bleed",
  "blend","bless","block","bloom","boast","bold","bolt","bond","boom","boost",
  "border","bore","bounce","bound","boundary","brand","breadth","breed","breeze","brief",
  "brilliant","broadcast","brow","bubble","budget","bulk","bump","bunch","bundle","burden",
  "cabinet","cable","calculate","campaign","campus","cancel","candidate","capable","capacity","capture",
  "career","cargo","cast","casual","catalog","category","caution","cease","celebrate","cell",
  "cement","ceremony","certificate","challenge","champion","channel","chapter","character","charge","charity",
  "charm","chart","chase","cheat","cheerful","chemical","cherish","chief","childhood","chill",
  "chip","choke","circuit","circulate","circumstance","citizen","civil","civilization","claim","clarify",
  "clash","classic","classify","clause","click","client","cliff","climate","cling","clinic",
  "clip","clockwise","clone","clue","clumsy","coach","coarse","code","collapse","colleague",
  "collection","collision","colonial","column","combat","combine","comedy","command","comment","commerce",
  "commit","committee","communicate","community","companion","comparable","comparative","compass","compel","compensate",
  "compete","competent","competitive","complain","complex","complicated","component","compose","compound","comprehension",
  "comprehensive","compress","comprise","compromise","conceal","concentrate","concept","concern","concession","conclude",
  "concrete","condemn","condense","conduct","conference","confess","confidence","confine","confirm","conflict",
  "confront","confuse","congress","conjunction","connect","conquer","conscience","conscious","consequence","consequently",
  "conservation","conservative","considerable","considerate","consistent","constant","constitute","construct","consult","consume",
  "contact","contain","contemporary","contempt","content","contest","context","continual","contract","contradiction",
  "contrary","contrast","contribute","controversy","convenience","convention","conventional","conversely","convert","convey",
  "convince","cooperate","coordinate","cope","copper","copyright","core","corporate","correspond","corridor",
  "costly","council","counter","county","crack","craft","crash","create","credit","creep",
  "crew","criminal","crisis","criterion","critical","crucial","crude","cruise","crush","crystal",
  "cue","cultivate","culture","curiosity","current","curriculum","curse","curve","cushion","cute",
  "cycle","dairy","dam","damage","damp","dash","database","dawn","deadline","deadly",
  "deaf","debate","debt","decade","decay","deceive","decent","declaration","decline","decorate",
  "decrease","deduce","defeat","defect","defense","define","definite","delegate","delete","deliberate",
  "delicate","delivery","demand","democracy","demonstrate","dense","deny","depart","deposit","depress",
  "deputy","derive","descend","deserve","desirable","desperate","despite","destination","destruction","detail",
  "detect","determine","device","devise","devote","diagram","dialect","diet","differ","digest",
  "digital","dignity","dilemma","dimension","diplomatic","disaster","discard","discharge","discipline","discount",
  "disguise","disgust","disorder","display","dispose","dispute","dissolve","distinct","distinguish","distract",
  "distribute","diverse","division","divorce","document","domestic","dominant","donation","dose","draft",
  "drain","dramatic","drift","drip","durable","duration","dusk","dynamic","earthquake","echo",
  "economy","edition","efficient","elaborate","elastic","elect","elegant","element","eliminate","embarrass",
  "embrace","emerge","emergency","emotion","emphasis","employ","enable","enclose","encounter","encourage",
  "enforce","engage","engine","enhance","enlarge","enormous","enrich","ensure","enterprise","entertain",
  "enthusiasm","entitle","entry","environment","episode","equality","equation","equip","equivalent","era",
  "erect","essential","establish","estate","estimate","evaluate","evidence","evident","evil","evolution",
  "evolve","exaggerate","exceed","exception","excess","exchange","exclaim","exclude","execute","executive",
  "exert","exhibit","existence","expand","expel","expense","experimental","expert","explicit","exploit",
  "explore","export","expose","extend","extensive","extent","external","extraordinary","extreme","fabric",
  "facility","faculty","fade","failure","faint","faithful","fame","famine","fancy","fantastic",
  "farewell","fascinating","fashion","fatal","fatigue","feasible","feature","federal","feedback","female",
  "fertile","fiction","fierce","finance","flame","flash","flat","flavor","flee","flexible",
  "flock","flourish","fluent","focus","forbid","forecast","foreign","forge","formal","format",
  "formation","former","formula","fortune","foster","foundation","fraction","fragment","frame","framework",
  "freight","frequency","frontier","frown","fruitful","frustrate","fulfill","function","fundamental","furnish",
  "furthermore","fuss","gallery","gamble","gap","garbage","gaze","gear","gene","generate",
  "generous","genius","genuine","gesture","giant","glimpse","global","gloomy","glorious","glow",
  "govern","grab","grace","gradual","grain","grant","grasp","grateful","grave","gravity",
  "greedy","grind","grip","grocer","gross","growth","guarantee","guidance","guilty","gulf",
  "habitat","halt","handle","handy","harbor","hardship","hardware","harm","harmony","harness",
  "harsh","harvest","haste","hatred","hazard","heading","headline","headquarters","heal","heap",
  "heave","hedge","heel","heighten","helicopter","hence","heritage","heroic","hesitate","highlight",
  "highway","hinder","hint","historic","hollow","holy","hook","horizon","horror","hostile",
  "household","housing","humble","humor","hunt","hydrogen","ideal","identical","identify","identity",
  "idle","ignorance","illegal","illustrate","image","imagination","imitate","immense","immigrant","impact",
  "implement","implication","imply","import","impose","impress","impulse","incident","incline","income",
  "incredible","independence","index","indicate","individual","induce","industrial","inevitable","infant","inferior",
  "inflation","influence","inform","ingredient","inhabitant","inherit","initial","initiative","injection","injure",
  "innocent","input","inquire","insect","insert","insight","inspect","inspire","install","instance",
  "instinct","institute","instrument","insult","insurance","intact","integrate","intellectual","intelligence","intense",
  "intention","interact","interfere","interior","internal","interpret","interval","intimate","invade","invent",
  "invest","investigate","investment","invisible","involve","isolate","issue","item","jam","jealous",
  "joint","journal","jungle","junior","justice","justify","keen","kidnap","kindergarten","kit",
  "label","landscape","lane","lap","largely","laser","latter","launch","laundry","layout",
  "leader","leak","lean","leap","lease","legal","legend","legislation","leisure","lens",
  "lest","liable","liberal","liberty","license","lightning","likely","likewise","limitation","link",
  "literary","literature","liver","load","loan","lobby","local","locate","lodge","logic",
  "loosen","loyal","luggage","lump","luxury","machinery","magnetic","magnificent","maintain","manual",
  "manufacture","margin","marine","market","marvelous","massive","mate","mature","maximum","mayor",
  "mechanism","medium","melt","memorial","merchant","mercy","mere","merit","mild","military",
  "mill","mineral","minimum","ministry","minor","minority","miracle","miserable","mission","mist",
  "mixture","mobile","moderate","modest","modify","moist","monitor","monument","mood","moral",
  "moreover","motion","motivate","mount","multiple","multiply","muscle","mutual","mysterious","myth",
  "naked","namely","nationality","naval","navigation","nearby","necessarily","necessity","negative","neglect",
  "negotiate","neighborhood","nerve","network","neutral","nevertheless","nightmare","noble","normally","noticeable",
  "notify","notion","nourish","novel","nowhere","nuclear","numerous","nursery","nylon","objection",
  "objective","obligation","observe","obstacle","obtain","obvious","occasion","occupy","offend","offensive",
  "opponent","opportunity","oppose","option","orbit","orchestra","organ","organic","organization","orient",
  "original","ornament","outcome","outline","output","outstanding","overcome","overlook","overseas","overtake",
  "owing","ownership","oxygen","pace","pack","panel","panic","parade","parallel","parcel"
]

// ========== 六级核心词汇（510词）==========
const CET6_WORDS = [
  "abnormal","abolish","abortion","abrupt","absorbed","abstain","absurd","abundance","abuse","academician",
  "accessory","accommodate","accountability","accumulate","acquaint","activate","addict","adhere","adjacent","administer",
  "adolescent","adore","advent","adverse","advocate","aerial","aesthetic","affiliate","affirm","afflict",
  "aggravate","aggregate","agitation","agony","alien","alienate","allege","alleviate","allocate","alloy",
  "allure","ambiguous","amend","amid","ample","analogy","analytic","ancestral","angel","anguish",
  "anonymous","antique","apparatus","appease","appendix","applaud","appraisal","appreciable","apprehension","apt",
  "arc","arch","arena","armor","array","arrogant","articulate","artillery","ascend","ascertain",
  "ascribe","aspiration","assassination","assault","assert","assimilate","asteroid","astronomy","atlas","atrocity",
  "attendance","attorney","attribute","auction","authentic","authoritative","authorize","autonomous","autonomy","avail",
  "avert","aviation","awe","axis","bachelor","baffle","bald","ballet","ballot","banknote",
  "barren","barricade","basement","batch","bearing","beforehand","behavioral","belly","besiege","betray",
  "beverage","bewilder","bias","bibliography","bilateral","bilingual","biography","bizarre","blaze","bleak",
  "blessing","blink","bloc","blossom","blunder","blunt","blur","blush","bonus","booklet",
  "booth","bounce","boycott","brace","bracket","breach","breakdown","breakthrough","brew","briefcase",
  "brink","brisk","brittle","broaden","brochure","broker","bronze","brood","browse","bruise",
  "brutal","buck","buckle","bud","buffalo","buffer","bug","bulletin","bully","bureaucracy",
  "burial","bust","bustle","buzz","bypass","cafeteria","calcium","calorie","cane","cannon",
  "canvas","cape","capsule","caption","captive","cardinal","carve","casualty","catalyst","catastrophe",
  "cater","cathedral","Catholic","caution","cavity","cellar","cemetery","census","certainty","certify",
  "challenger","champagne","chant","chapel","cherish","cholesterol","chord","chorus","chronic","chunk",
  "circulation","circus","civic","civilian","clamp","clan","clarity","clash","clasp","classification",
  "clearance","clinch","cloak","clockwise","cluster","coalition","coastal","cocaine","cocktail","cognitive",
  "coherent","coincide","collaboration","collapse","collective","collide","colonial","comet","comic","commemorate",
  "commence","commend","commentary","commitment","commodity","commonplace","communal","commute","compact","compartment",
  "compatible","compensate","competence","compile","complement","complexion","complication","compliment","comply","composite",
  "compulsory","compute","concede","conceive","conception","concession","concise","concurrent","condemn","condense",
  "confer","confidential","configuration","confinement","conform","confrontation","Confucian","congregate","conqueror","conscientious",
  "consecutive","consensus","conserve","consolidate","conspicuous","constituent","constrain","consul","contemplate","contend",
  "contention","continuity","contradict","controversial","convene","converge","converse","conversion","convict","conviction",
  "cooperative","coral","cordial","cork","corporate","corps","correlate","corrode","corrupt","costume",
  "couch","counsel","counterpart","courtesy","coverage","coward","cozy","cradle","credential","credible",
  "cripple","crisp","criterion","crumble","cubic","culminate","cultivation","cumulative","curb","curfew",
  "currency","custody","customary","cute","cylinder","cynical","dart","database","dazzle","deadlock",
  "debris","debut","decay","deceit","decent","decisive","decree","dedicate","deduce","deduct",
  "deem","default","defendant","defiance","deficiency","deficit","defy","delegate","deliberate","democratic",
  "demolish","denial","denote","denounce","density","dental","depict","deport","deposition","depreciation",
  "depression","deprive","deputy","descendant","descent","designate","despise","destined","destiny","detach",
  "detain","detention","deteriorate","diagnose","differentiate","diffuse","dilemma","diligent","dilute","diminish",
  "dine","diploma","diplomat","directory","discern","disclose","discourse","discrepancy","discrete","discriminate",
  "disdain","dismay","dispatch","disperse","displace","disposition","disregard","disrupt","disseminate","dissent",
  "dissolve","distort","distract","disturbance","diversion","divert","dividend","divine","dock","doctrine",
  "dodge","dole","dolphin","domain","dome","donation","doom","doubtless","drainage","drastic",
  "drawback","dreadful","drought","dual","dub","dubious","duplicate","dwarf","dwell","Easter",
  "eccentric","eclipse","ecology","edible","ego","eject","elapse","elderly","electoral","eloquent",
  "embargo","embark","embed","embody","embryo","eminent","empathy","empirical","enclosure","endeavor",
  "endow","endurance","energetic","engagement","enlighten","enrich","enroll","ensue","entail","entity",
  "entrepreneur","envisage","envoy","epidemic","epoch","equator","equity","erase","erosion","err",
  "erupt","escort","essence","esteem","esthetic","eternal","evacuate","evaporate","evoke","excavate",
  "exceptional","execution","exempt","exile","exotic","expedition","expenditure","expire","explicit","exponent",
  "exquisite","extinguish","extract","extravagant","eyebrow","fabricate","fabulous","facilitate","faction","famine",
  "fascinate","feat","feminine","ferocious","ferry","fiery","fiscal","fixture","flank","flap",
  "flare","flatter","flaw","fling","flip","fluctuate","flush","flutter","foam","foil"
]

// ========== 考研核心词汇（520词）==========
const POSTGRAD_WORDS = [
  "abandon","abdomen","abide","abnormal","aboard","abolish","abound","abreast","abrupt","absent",
  "absorb","abstract","absurd","abundance","abuse","academic","academy","accelerate","accent","access",
  "accessory","accidental","acclaim","accommodate","accompany","accomplish","accord","accountability","accumulate","accurate",
  "accuse","accustom","achieve","acid","acknowledge","acquaint","acquire","acquisition","activate","acute",
  "adapt","addict","adequate","adhere","adjacent","adjust","administer","admiration","admission","adolescent",
  "adopt","adore","advent","adverse","advocate","aerial","aesthetic","affection","affiliate","affirm",
  "affluent","agenda","aggravate","aggregate","aggressive","agitate","agony","agreeable","alien","alienate",
  "align","allege","alleviate","alliance","allocate","allot","allowance","alloy","ally","alongside",
  "alter","alternate","alternative","altitude","amateur","amaze","ambassador","ambiguity","ambiguous","ambition",
  "ambitious","ambulance","amend","amiable","amid","amuse","analogy","analysis","analytical","ancestor",
  "anchor","anecdote","anguish","anniversary","annoy","annual","anonymous","antecedent","antique","anxiety",
  "appalling","apparatus","appeal","appetite","applaud","appliance","applicable","appraisal","appreciate","apprehension",
  "approach","appropriate","approval","approximate","apt","arbitrary","archaeology","architecture","archive","ardent",
  "arena","arithmetic","arouse","array","arrogant","articulate","artificial","artistic","ascend","ascertain",
  "ascribe","aspiration","assassinate","assault","assemble","assert","assess","asset","assign","assimilate",
  "associate","assume","assurance","atmosphere","atrocity","attach","attain","attendance","attorney","attribute",
  "auction","audio","audit","authentic","authority","autobiography","automate","autonomous","autonomy","avail",
  "avenue","avert","aviation","award","aware","awe","awesome","axis","bachelor","backbone",
  "backward","bacon","bacteria","badge","baffle","bail","balcony","bald","balloon","ballot",
  "ban","bandwidth","banknote","bankrupt","banner","banquet","barbecue","bare","barely","bargain",
  "bark","barn","barrel","barren","barrier","basement","batch","beam","beard","bearing",
  "beforehand","behave","belly","beloved","benchmark","bend","beneath","beneficial","besides","betray",
  "beverage","bewilder","bias","bibliography","bid","bilateral","billion","bind","biography","biotechnology",
  "bizarre","blackmail","blade","blame","bland","blast","blaze","bleak","bleed","blend",
  "bless","bloc","bloom","blossom","blueprint","blunder","blunt","blur","blush","boast",
  "bold","bolt","boom","boost","booth","border","bore","bother","bounce","bound",
  "boundary","boycott","brace","bracket","breach","breadth","breakdown","breakthrough","breed","bribe",
  "brief","briefcase","brilliant","brink","brisk","brittle","broadcast","brochure","bronze","brood",
  "browse","bruise","brutal","bubble","buck","bud","budget","buffer","bulb","bulk",
  "bulletin","bully","bump","bunch","bundle","burden","bureau","bureaucracy","burial","burst",
  "bust","cabin","cabinet","cable","cafeteria","calcium","calculate","calorie","campaign","campus",
  "candidate","cane","cannon","canvas","capable","capacity","cape","capsule","caption","captive",
  "capture","cardinal","cargo","carriage","cartoon","carve","cashier","cassette","cast","casualty",
  "catalog","catastrophe","category","cater","cathedral","caution","cavity","cease","celebrity","cellar",
  "cemetery","censor","census","centigrade","ceramic","cereal","ceremony","certainty","certificate","certify",
  "challenge","chamber","champion","channel","chaos","chapel","characterize","charity","charm","charter",
  "chase","chemical","cherish","chess","chill","chip","choir","choke","cholesterol","chop",
  "chorus","chronic","chronicle","chunk","circuit","circulate","circus","cite","civilization","clamp",
  "clan","clarity","clash","classic","classification","classify","clause","clearance","click","clientele",
  "cliff","climate","climax","cling","clinic","clip","cloak","clockwise","clone","closet",
  "cluster","clutch","coalition","coarse","cocaine","cognitive","coherent","cohesive","coincide","coincidence",
  "collaborate","collapse","collective","collide","colonial","colony","column","combat","combine","comedy",
  "comet","comic","commemorate","commence","commend","commentary","commitment","commodity","commonplace","communal",
  "commute","compact","compartment","compass","compatible","compel","compensate","competence","compile","complement",
  "complexion","complication","compliment","comply","component","composite","composition","compound","comprehend","comprehensive",
  "compress","comprise","compromise","compulsory","compute","conceal","concede","conceive","conception","concise",
  "conclude","concrete","condemn","condense","confer","confidential","configuration","confine","confirm","conform",
  "confront","Confucian","congress","conjunction","conquer","conquest","conscience","conscientious","conscious","consecutive",
  "consensus","consent","consequence","consequently","conservation","conservative","conserve","considerable","considerate","consistency",
  "console","consolidate","conspicuous","conspiracy","constant","constituent","constitute","constrain","constraint","construct",
  "consult","consume","contact","contagious","container","contaminate","contemplate","contemporary","contempt","contend",
  "contention","continual","continuity","contradict","contradiction","contrary","contrast","contribute","contrive","controversial",
  "controversy","convene","convenience","convention","converge","conversion","convert","convey","convict","conviction",
  "convince","cooperate","cooperative","coordinate","cope","copyright","cordial","corporate","corps","correlate",
  "correspond","corridor","corrode","corrupt","cosmic","costume","council","counsel","counterpart","courtesy",
  "coverage","crack","cradle","craft","crash","credential","credibility","credible","credit","creep",
  "crew","criminal","cripple","crisis","crisp","criterion","critical","criticize","crumble","crush",
  "crystal","cubic","cue","culminate","cultivate","cumulative","cunning","curb","curfew","curiosity",
  "currency","current","curriculum","curse","curve","custody","customary","cylinder","cynical","dairy",
  "dam","damp","dart","dash","database","dazzle","deadline","deadlock","deadly","deaf",
  "dealer","debate","debris","debt","debut","decay","deceit","deceive","decent","decisive",
  "declaration","decline","decompose","decorate","decree","dedicate","deduce","deduct","deem","default",
  "defect","defendant","defer","deficiency","deficit","define","defy","degenerate","delegate","deliberate",
  "delicacy","demand","democracy","demonstrate","denial","denote","denounce","dense","dental","depart",
  "depict","deploy","deposit","depreciate","depress","deprive","deputy","derive","descend","descent",
  "designate","desirable","desolate","despair","despise","destiny","destruction","detach","detain","detection",
  "detention","deter","deteriorate","determination","devastate","deviate","device","devise","devote","diagnose",
  "diagram","dialect","diameter","dictate","diffuse","digest","digital","dignity","dilemma","diligent",
  "dilute","dimension","diminish","dine","diploma","diplomat","directory","disastrous","discard","discern",
  "discharge","discipline","disclose","discourse","discrepancy","discrete","discriminate","disdain","disgrace","disguise",
  "disgust","dismay","dispatch","disperse","displace","disposal","disposition","dispute","disregard","disrupt",
  "disseminate","dissipate","dissolve","distill","distinct","distort","distract","distress","distribute","disturbance",
  "diversion","divert","dividend","divine","dizzy","dock","doctrine","document","domain","dome",
  "domestic","dominant","donation","doom","dormitory","dose","doubtless","downgrade","draft","drainage",
  "dramatic","drastic","drawback","dread","drift","drought","dual","dub","dubious","dumb"
]

// ========== 雅思核心词汇（510词）==========
const IELTS_WORDS = [
  "abandon","abate","abbreviation","abide","abnormal","abolish","abound","abreast","abroad","abrupt",
  "absenteeism","absorb","abstract","absurd","abundance","abuse","academic","accelerate","accent","accessible",
  "accommodation","accompany","accomplish","accountable","accumulate","accustom","acknowledge","acquaint","acquisition","activate",
  "acute","adapt","addiction","adequate","adhere","adjacent","adjust","administer","adolescent","adopt",
  "advance","advantageous","advent","adverse","advocate","aesthetic","affection","affiliate","affirm","affluent",
  "agenda","aggravate","aggregate","aggressive","agitate","agriculture","alert","alienate","align","allege",
  "alleviate","allocate","allot","allowance","alter","alternative","altitude","amateur","ambiguous","ambitious",
  "amend","amenity","ample","analogy","analyse","ancestral","anecdote","annihilate","anonymous","antecedent",
  "anthropology","antibiotic","anticipate","antique","anxiety","apparatus","apparel","appease","appetite","appliance",
  "applicant","appraisal","appreciate","apprehension","approach","appropriate","approximate","apt","aquatic","arbitrary",
  "archaeology","architect","archive","ardent","arduous","argument","arid","arouse","array","arrogant",
  "articulate","artificial","ascend","ascribe","aspiration","assault","assemble","assert","assess","asset",
  "assign","assimilate","associate","assume","assurance","astound","astronomy","atlas","atmosphere","atrocity",
  "attach","attain","attendance","attribute","auction","audible","audit","authentic","authorise","authority",
  "automatic","autonomous","autonomy","auxiliary","avail","avenue","avert","avid","avoid","aware",
  "backdrop","backup","baffle","ballot","bankruptcy","barren","barricade","barrier","barter","baseline",
  "beam","bearing","beforehand","behalf","behaviour","benchmark","beneficiary","beverage","bewilder","bias",
  "bibliography","bilateral","bilingual","biodiversity","biography","bizarre","blade","blast","blaze","bleak",
  "blend","bless","blueprint","blunder","blunt","blur","bonus","booth","bounce","bound",
  "boycott","brace","breach","breakdown","breakthrough","breed","brew","brink","brisk","broaden",
  "brochure","broker","browse","bruise","brunt","bubble","buck","budget","buffer","bulb",
  "bulk","bulletin","bully","bump","bureaucracy","burgeon","burial","bustle","bypass","cabin",
  "cabinet","calamity","calcium","calibrate","camouflage","campaign","campus","candid","candidate","capacious",
  "capacity","capital","captive","cardinal","career","cargo","carve","cast","casualty","catalyst",
  "catastrophe","categorise","cater","caution","cavity","cease","celebrity","censor","census","centenary",
  "certify","chamber","champion","chaos","charity","charter","chronic","chunk","circuit","circulate",
  "circumscribe","circumstance","cite","civilian","clamp","clarify","clash","classify","clause","clearance",
  "clientele","climax","cling","clinical","clockwise","cluster","coalition","coarse","cognitive","coherent",
  "cohesive","coincide","collaborate","collapse","colleague","collide","colonial","combat","combine","commemorate",
  "commence","commend","commentary","commission","commitment","commodity","communal","commute","compact","comparable",
  "compassion","compatible","compel","compensate","competence","compile","complement","complex","compliance","complicated",
  "compliment","comply","component","compose","comprehensive","comprise","compromise","compulsory","conceal","concede",
  "conceive","conception","concise","conclude","concrete","condemn","condense","conducive","confer","confidential",
  "configuration","confine","confirm","conform","confront","congestion","conjunction","conscience","conscientious","conscious",
  "consecutive","consensus","consent","consequence","consequently","conservation","conservative","conserve","considerable","consistency",
  "console","consolidate","conspicuous","constant","constituent","constitute","constrain","construct","consult","consume",
  "contagious","contain","contaminate","contemplate","contemporary","contempt","contend","contention","context","continent",
  "contingency","continuity","contract","contradict","contrary","contrast","contribute","contrive","controversy","convene",
  "convenience","convention","converge","converse","conversion","convert","convey","convict","conviction","cooperate",
  "coordinate","copyright","cordial","core","corporate","correlate","correspond","corridor","corrode","corrupt",
  "cosmetic","costume","council","counsel","counterpart","courtesy","coverage","crash","credential","credibility",
  "credible","criterion","critical","crumble","cultivate","cumulative","curb","currency","curriculum","curtail",
  "custody","customary","cylinder","cynical","dampen","database","daunting","deadlock","debate","debris",
  "debut","decay","deceive","decent","decisive","declaration","decline","decree","dedicate","deem",
  "default","defect","defer","deficiency","deficit","define","deflect","deforestation","defy","degenerate",
  "degrade","delegate","deliberate","delicacy","delinquent","deluge","demand","demise","demographic","demolish",
  "demonstrate","demote","denote","denounce","dense","dent","depart","depict","deplete","deploy",
  "deposit","depreciate","depress","deprive","deputy","derive","descend","descendant","descent","designate",
  "desirable","desolate","despair","despatch","desperate","despise","destiny","destitute","detach","detain",
  "detect","deter","deteriorate","determine","detract","devastate","deviate","device","devoid","devote",
  "diagnose","diagram","dialect","dichotomy","dictate","diffuse","digest","dignify","dilapidated","dilemma",
  "diligent","dilute","dimension","diminish","din","diplomacy","disarray","discard","discern","discharge",
  "discipline","disclose","discourse","discrepancy","discrete","discriminate","disdain","disgrace","disguise","disgust",
  "disillusion","disintegrate","dismantle","dismay","dispatch","dispense","disperse","displace","disposal","dispute"
]

// ========== 托福核心词汇（510词）==========
const TOEFL_WORDS = [
  "abandon","abate","abbreviate","abdicate","aberration","abet","abhor","abide","abject","abjure",
  "ablaze","abolish","abominate","abound","abrasive","abreast","abridge","abrogate","abrupt","abscond",
  "absolute","absolve","absorb","abstain","abstemious","abstinence","abstract","abstruse","absurd","abundance",
  "abusive","abut","abysmal","academic","accede","accelerate","accentuate","accessible","accessory","acclaim",
  "acclimate","accolade","accommodate","accompany","accomplish","accord","accost","accountable","accredit","accumulate",
  "accuse","accustom","acerbic","achieve","acknowledge","acme","acquaint","acquiesce","acquire","acquisition",
  "acquit","acrid","acrimonious","activate","actualize","acumen","acute","adapt","addendum","adept",
  "adequate","adhere","adjacent","adjudicate","adjunct","administer","admirable","admonish","adolescent","adopt",
  "adore","adorn","adroit","adulate","advance","advantageous","advent","adventitious","adversary","adverse",
  "advocate","aerial","aesthetic","affable","affectation","affiliate","affinity","affirm","affix","afflict",
  "affluence","agenda","aggravate","aggregate","aghast","agile","agitate","agonize","agrarian","alacrity",
  "alchemy","alert","alienate","align","allay","allege","allegiance","alleviate","alliance","allocate",
  "allude","allure","allusion","aloft","aloof","alter","altercation","alternative","altruism","amalgamate",
  "amass","ambience","ambiguous","ambitious","ambivalent","ameliorate","amenable","amend","amenity","amicable",
  "amid","ammunition","amorphous","ample","amplify","amuse","analogous","analyse","anarchist","anatomy",
  "anecdote","anguish","animate","annex","annihilate","annotate","anonymous","antecedent","anthology","anthropocentric",
  "anticipate","antipathy","antiquated","antithesis","anxiety","apathetic","aperture","apex","apparel","appease",
  "appellation","append","applaud","appliance","applicable","appoint","apportion","appraisal","appreciate","apprehend",
  "apprehension","apprentice","approach","appropriate","approximate","apt","aquatic","arbitrary","arbitrate","arcane",
  "archaeology","archaic","ardent","arduous","argument","arid","aristocrat","armament","armistice","aromatic",
  "arouse","array","arrogant","articulate","artifact","artifice","artisan","ascend","ascertain","ascribe",
  "aspect","aspersion","aspire","assail","assassinate","assault","assemble","assert","assess","asset",
  "assiduous","assign","assimilate","associate","assuage","assume","assurance","asteroid","astound","astute",
  "asylum","atone","atrocious","atrophy","attach","attain","attempt","attendance","attenuate","attest",
  "attribute","attrition","audible","audit","augment","auspicious","austere","authentic","authoritarian","authoritative",
  "autocrat","automate","autonomous","autopsy","auxiliary","avail","avalanche","avant-garde","avarice","avenge",
  "aver","averse","avert","avid","avocation","avoid","avow","awaken","awe","awkward",
  "axiom","backdrop","backfire","backlash","baffle","balk","ballot","balmy","banal","band",
  "bane","banish","bankrupt","banner","banter","barbarous","barrage","barren","barricade","barter",
  "bask","bastion","batch","bawdy","bearing","beatific","beckon","befuddle","beget","begrudge",
  "beguile","behalf","behaviour","behold","belie","belittle","bellicose","belligerent","bemoan","benchmark",
  "benevolent","benign","bequeath","berate","bereave","beseech","besiege","bestow","betray","beverage",
  "bewilder","bias","bibliography","bifurcate","bilateral","bilingual","billowing","biodegradable","biodiversity","bizarre",
  "bland","blasphemy","blatant","blaze","bleak","blemish","bless","blight","bliss","blithe",
  "blizzard","blockade","blossom","blueprint","blunder","blunt","blur","bluster","boast","bolster",
  "bombard","bona fide","bondage","bonanza","boon","boorish","boost","boycott","brackish","brandish",
  "brash","breach","brevity","bribe","brink","brisk","bristle","brittle","broaden","brochure",
  "browbeat","browse","bruise","brusque","brutal","bubble","bucolic","budge","buffer","buffoon",
  "bulge","bulk","bulletin","bully","bumptious","buoyant","bureaucracy","burgeon","burly","burnish",
  "buttress","bypass","cabal","cache","cacophony","cajole","calamity","calcium","calibrate","callous",
  "camaraderie","camouflage","candid","candidate","canny","canvass","capacious","capitulate","capricious","capsize",
  "captivate","cardinal","careen","caricature","carnage","carp","cartographer","cascade","castigate","catalyst",
  "catastrophe","categorical","caustic","cavalier","cease","cede","celebrated","censor","censure","cerebral",
  "certitude","chagrin","champion","chaos","charade","charisma","charlatan","chasm","chastise","cherish",
  "chicanery","chimera","chivalrous","choatic","chronic","chronicle","circuitous","circumlocution","circumscribe","circumspect",
  "circumvent","citadel","civil","clairvoyant","clamor","clandestine","clarify","clemency","clergy","coalesce",
  "coalition","coerce","cogent","cognitive","coherent","collaborate","colloquial","collusion","colossal","combustible",
  "commemorate","commend","commensurate","commiserate","commodious","communal","commute","compassion","compatible","compendium",
  "complacent","complement","compliant","composure","compromise","concede","conceive","conciliatory","concise","concomitant",
  "concord","concur","condone","conducive","confiscate","conflagration","conflate","confound","congenial","congregate"
]

async function main() {
  console.log("开始导入词库...\n")

  // 清理旧数据
  await prisma.wordbookWord.deleteMany()
  await prisma.wordProgress.deleteMany()
  await prisma.studyLog.deleteMany()
  await prisma.wordbook.deleteMany()
  await prisma.word.deleteMany()
  console.log("已清理旧数据\n")

  const wordbooks = [
    { name: "大学英语四级", description: "CET-4 核心词汇（950词），适合四级备考", words: CET4_WORDS },
    { name: "大学英语六级", description: "CET-6 核心词汇（510词），适合六级备考", words: CET6_WORDS },
    { name: "考研英语", description: "考研英语核心词汇（750词），适合考研备考", words: POSTGRAD_WORDS },
    { name: "雅思英语", description: "IELTS 核心词汇（510词），适合雅思备考", words: IELTS_WORDS },
    { name: "托福英语", description: "TOEFL 核心词汇（510词），适合托福备考", words: TOEFL_WORDS },
  ]

  let totalWords = 0
  const uniqueWords = new Set<string>()

  for (const wb of wordbooks) {
    // 创建词库
    const book = await prisma.wordbook.create({
      data: {
        name: wb.name,
        description: wb.description,
        isPreset: true,
      },
    })

    // 导入单词并关联词库
    let count = 0
    for (const w of wb.words) {
      const word = await prisma.word.upsert({
        where: { word: w },
        update: {},
        create: { word: w },
      })

      await prisma.wordbookWord.create({
        data: { wordbookId: book.id, wordId: word.id },
      })

      uniqueWords.add(w)
      count++
    }

    console.log(`✓ ${wb.name}: ${count} 词`)
    totalWords += count
  }

  console.log(`\n词库导入完成！`)
  console.log(`  词库数: ${wordbooks.length}`)
  console.log(`  总单词: ${totalWords}`)
  console.log(`  不重复: ${uniqueWords.size}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
