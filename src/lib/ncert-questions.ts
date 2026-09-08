import type { Competency, Question, QuestionKind } from '../types';

/**
 * NCERT-aligned question bank, keyed by standard × subject × proficiency level.
 *
 * These replace the formulaic template questions as the preferred pool for
 * paper generation. Every entry is real curriculum content, so a generated
 * paper reads as five distinct questions rather than one sentence repeated
 * with the level name swapped.
 *
 * Level progression:
 *   L1 Foundation  — direct recall of a defined fact
 *   L2 Emerging    — one-step application
 *   L3 Developing  — multi-step reasoning
 *   L4 Proficient  — analysis, comparison, interpretation
 *   L5 Advanced    — synthesis across concepts
 *
 * Marks follow the seed convention: L1/L2 = 1, L3/L4 = 2, L5 = 3.
 */

/** [standardId, subjectId, levelId, text, options, correctIndex] */
type Row = [string, string, string, string, string[], number];

const MARKS: Record<string, number> = { l1: 1, l2: 1, l3: 2, l4: 2, l5: 3 };

const ROWS: Row[] = [
  // Mathematics — Knowing Our Numbers, Integers, Fractions, Mensuration, Algebra
  // Science — Food, Materials, Living World, Motion, Light
  // Hindi — व्याकरण एवं भाषा
  // English — Grammar, Vocabulary, Comprehension


  // ══════════════ CLASS 8 ══════════════
  ['std-8','mat','l1','What is the value of (−5) × (−4)?',['−20','20','−9','9'],1],
  ['std-8','mat','l2','Find the square root of 144.',['11','12','13','14'],1],
  ['std-8','mat','l3','Solve for x: 5x − 3 = 2x + 12.',['3','4','5','6'],2],
  ['std-8','mat','l4','The volume of a cube is 216 cm³. Find the length of one edge.',['4 cm','5 cm','6 cm','8 cm'],2],
  ['std-8','mat','l5','A sum of ₹5000 earns simple interest at 8% per annum. Find the interest after 3 years.',['₹1000','₹1200','₹1400','₹1600'],1],
  ['std-8','sci','l1','Which gas is essential for combustion?',['Nitrogen','Oxygen','Carbon dioxide','Hydrogen'],1],
  ['std-8','sci','l2','What is the chemical formula of common salt?',['NaCl','KCl','CaCl₂','NaOH'],0],
  ['std-8','sci','l3','Which of these is a non-renewable source of energy?',['Solar','Wind','Coal','Hydro'],2],
  ['std-8','sci','l4','Why do we see a delay between lightning and thunder?',['Light travels faster than sound','Sound travels faster than light','Thunder occurs after lightning','Clouds absorb the sound first'],0],
  ['std-8','sci','l5','Explain why crop rotation improves soil fertility.',['Different crops replenish different nutrients','It removes all soil bacteria','It increases soil temperature','It reduces the need for sunlight'],0],
  ['std-8','hin','l1','"सूर्य" शब्द का पर्यायवाची क्या है?',['भानु','चंद्र','तारा','मेघ'],0],
  ['std-8','hin','l2','"अ" उपसर्ग से बना शब्द चुनिए।',['असत्य','सत्यता','सत्यवादी','सत्यम'],0],
  ['std-8','hin','l3','"मोहन ने पत्र लिखा।" वाक्य में कौन सा कारक है?',['कर्ता कारक','कर्म कारक','करण कारक','संप्रदान कारक'],0],
  ['std-8','hin','l4','"अंधे की लाठी" मुहावरे का अर्थ क्या है?',['एकमात्र सहारा','व्यर्थ वस्तु','कठिन कार्य','अनुचित सहायता'],0],
  ['std-8','hin','l5','निम्नलिखित में से कौन सा वाक्य मिश्र वाक्य है?',['वह आया और चला गया','जो परिश्रम करता है, वह सफल होता है','राम पढ़ता है','सूरज निकला'],1],
  ['std-8','eng','l1','Choose the correct form: "She ___ to school every day."',['go','goes','going','gone'],1],
  ['std-8','eng','l2','Give the antonym of "ancient".',['old','modern','historic','aged'],1],
  ['std-8','eng','l3','Change to indirect speech: He said, "I am tired."',['He said that he is tired','He said that he was tired','He says he was tired','He told I am tired'],1],
  ['std-8','eng','l4','Identify the error: "Neither of the boys have finished their work."',['Neither','of the boys','have','their work'],2],
  ['std-8','eng','l5','"He kicked the bucket" is an example of which literary device?',['Simile','Idiom','Metaphor','Hyperbole'],1],

  // ══════════════ CLASS 9 ══════════════
  ['std-9','mat','l1','Which of these is an irrational number?',['4/5','√2','0.25','−7'],1],
  ['std-9','mat','l2','Find the degree of the polynomial 4x³ − 2x² + 7.',['1','2','3','4'],2],
  ['std-9','mat','l3','In a triangle, if two sides are 6 cm and 8 cm and the angle between them is 90°, find the third side.',['10 cm','12 cm','14 cm','9 cm'],0],
  ['std-9','mat','l4','The mean of 5 observations is 12. If four of them are 10, 14, 8 and 16, find the fifth.',['10','12','14','16'],1],
  ['std-9','mat','l5','Find the surface area of a sphere of radius 7 cm. (Take π = 22/7)',['308 cm²','462 cm²','616 cm²','1232 cm²'],2],
  ['std-9','phy','l1','What is the SI unit of force?',['Joule','Newton','Watt','Pascal'],1],
  ['std-9','phy','l2','A body moves 60 m in 12 s. Calculate its average speed.',['4 m/s','5 m/s','6 m/s','7 m/s'],1],
  ['std-9','phy','l3','State the relation between work, force and displacement.',['W = F/d','W = F × d','W = d/F','W = F + d'],1],
  ['std-9','phy','l4','Why does a passenger fall forward when a moving bus stops suddenly?',['Inertia of motion','Inertia of rest','Gravitational pull','Friction with the seat'],0],
  ['std-9','phy','l5','A 10 kg object is raised 5 m. Calculate the potential energy gained. (g = 10 m/s²)',['50 J','200 J','500 J','1000 J'],2],
  ['std-9','che','l1','What is the smallest particle of an element that retains its properties?',['Molecule','Atom','Ion','Electron'],1],
  ['std-9','che','l2','How many atoms are present in one molecule of water (H₂O)?',['2','3','4','1'],1],
  ['std-9','che','l3','Which subatomic particle carries a negative charge?',['Proton','Neutron','Electron','Nucleus'],2],
  ['std-9','che','l4','A solution of common salt in water is an example of which type of mixture?',['Heterogeneous mixture','Homogeneous mixture','Compound','Element'],1],
  ['std-9','che','l5','Calculate the molecular mass of CO₂. (C = 12, O = 16)',['28 u','40 u','44 u','48 u'],2],
  ['std-9','bio','l1','What is the basic structural unit of all living organisms?',['Tissue','Cell','Organ','Organism'],1],
  ['std-9','bio','l2','Which organelle is known as the powerhouse of the cell?',['Ribosome','Mitochondria','Nucleus','Golgi body'],1],
  ['std-9','bio','l3','Which tissue transports water in plants?',['Phloem','Xylem','Parenchyma','Cambium'],1],
  ['std-9','bio','l4','Why do plant cells have a cell wall but animal cells do not?',['To provide rigidity and shape','To store food','To carry out respiration','To allow movement'],0],
  ['std-9','bio','l5','Explain how the structure of a neuron supports its function.',['Long axon carries impulses over distance','Thick wall stores nutrients','Cilia move the neuron','Chloroplasts generate energy'],0],
  ['std-9','eng','l1','Choose the correct spelling.',['recieve','receive','receeve','receve'],1],
  ['std-9','eng','l2','Identify the tense: "She has been reading since morning."',['Simple present','Present perfect','Present perfect continuous','Past continuous'],2],
  ['std-9','eng','l3','Join using a relative pronoun: "This is the boy. He won the prize."',['This is the boy who won the prize','This is the boy which won the prize','This is the boy whom won the prize','This is the boy whose won the prize'],0],
  ['std-9','eng','l4','Which sentence is grammatically correct?',['One of my friend is coming','One of my friends are coming','One of my friends is coming','One of my friends were coming'],2],
  ['std-9','eng','l5','"The pen is mightier than the sword." What does this proverb mean?',['Writing is more powerful than violence','Pens are stronger than swords','Swords are useless','Writers are strong'],0],

  // ══════════════ CLASS 10 ══════════════
  ['std-10','mat','l1','What is the HCF of 12 and 18?',['2','3','6','9'],2],
  ['std-10','mat','l2','Find the discriminant of x² − 4x + 3 = 0.',['2','4','8','16'],1],
  ['std-10','mat','l3','Find the 10th term of the AP: 3, 7, 11, 15, …',['37','39','41','43'],1],
  ['std-10','mat','l4','If sin θ = 3/5, find cos θ for an acute angle θ.',['4/5','3/4','5/4','5/3'],0],
  ['std-10','mat','l5','A ladder 10 m long leans against a wall reaching 8 m up. How far is its foot from the wall?',['4 m','6 m','9 m','12 m'],1],
  ['std-10','phy','l1','What is the SI unit of electric current?',['Volt','Ampere','Ohm','Coulomb'],1],
  ['std-10','phy','l2','State Ohm\'s law.',['V = IR','V = I/R','V = R/I','V = I²R'],0],
  ['std-10','phy','l3','A resistor of 5 Ω carries a current of 2 A. Calculate the potential difference.',['2.5 V','7 V','10 V','20 V'],2],
  ['std-10','phy','l4','Why is the image formed by a plane mirror described as virtual?',['It cannot be caught on a screen','It is always inverted','It is smaller than the object','It forms in front of the mirror'],0],
  ['std-10','phy','l5','An object is placed 30 cm from a concave mirror of focal length 15 cm. Where is the image formed?',['At 15 cm','At 30 cm','At 45 cm','At infinity'],1],
  ['std-10','che','l1','What is the pH of a neutral solution at 25 °C?',['0','7','14','1'],1],
  ['std-10','che','l2','Which gas is released when a metal reacts with dilute acid?',['Oxygen','Hydrogen','Nitrogen','Carbon dioxide'],1],
  ['std-10','che','l3','Balance: Fe + H₂O → Fe₃O₄ + H₂. How many molecules of H₂O are needed?',['2','3','4','5'],2],
  ['std-10','che','l4','Why does copper not react with dilute hydrochloric acid?',['Copper is below hydrogen in the reactivity series','Copper is a non-metal','Copper dissolves instantly','The acid is too dilute'],0],
  ['std-10','che','l5','Identify the type of reaction: 2Mg + O₂ → 2MgO.',['Decomposition','Displacement','Combination','Double displacement'],2],
  ['std-10','bio','l1','Which pigment gives plants their green colour?',['Haemoglobin','Chlorophyll','Carotene','Melanin'],1],
  ['std-10','bio','l2','Name the process by which plants lose water as vapour.',['Respiration','Transpiration','Translocation','Photosynthesis'],1],
  ['std-10','bio','l3','Which part of the human brain controls balance and posture?',['Cerebrum','Cerebellum','Medulla','Hypothalamus'],1],
  ['std-10','bio','l4','In a monohybrid cross of Tt × Tt, what is the phenotypic ratio?',['1:1','2:1','3:1','9:3:3:1'],2],
  ['std-10','bio','l5','Explain why energy transfer between trophic levels is only about 10%.',['Most energy is lost as heat in respiration','Organisms do not eat enough','Producers absorb all energy','Decomposers block the transfer'],0],
  ['std-10','eng','l1','Choose the correct synonym of "brave".',['timid','courageous','weak','careless'],1],
  ['std-10','eng','l2','Fill in: "If it rains, we ___ cancel the match."',['will','would','shall have','had'],0],
  ['std-10','eng','l3','Rewrite in reported speech: She said, "I will come tomorrow."',['She said she will come tomorrow','She said she would come the next day','She says she would come tomorrow','She said I would come tomorrow'],1],
  ['std-10','eng','l4','Identify the figure of speech: "The wind whispered through the trees."',['Simile','Metaphor','Personification','Hyperbole'],2],
  ['std-10','eng','l5','Which sentence uses the subjunctive correctly?',['If I was rich, I would travel','If I were rich, I would travel','If I am rich, I would travel','If I be rich, I would travel'],1],

  // ══════════════ CLASS 11 ══════════════
  ['std-11','mat','l1','If A = {1,2,3} and B = {3,4}, find A ∩ B.',['{1,2}','{3}','{1,2,3,4}','{4}'],1],
  ['std-11','mat','l2','What is the value of sin 90° + cos 0°?',['0','1','2','−1'],2],
  ['std-11','mat','l3','Find the slope of the line passing through (2,3) and (4,7).',['1','2','3','4'],1],
  ['std-11','mat','l4','How many ways can 5 distinct books be arranged on a shelf?',['25','60','120','720'],2],
  ['std-11','mat','l5','Evaluate the limit of (x² − 4)/(x − 2) as x approaches 2.',['0','2','4','undefined'],2],
  ['std-11','phy','l1','What is the dimensional formula of velocity?',['[LT⁻¹]','[LT⁻²]','[MLT⁻²]','[ML²T⁻²]'],0],
  ['std-11','phy','l2','A body starts from rest with acceleration 2 m/s². Find its velocity after 5 s.',['5 m/s','10 m/s','15 m/s','20 m/s'],1],
  ['std-11','phy','l3','State the principle of conservation of linear momentum.',['Total momentum stays constant with no external force','Momentum always increases','Momentum equals kinetic energy','Momentum is lost in collisions'],0],
  ['std-11','phy','l4','Why does a projectile follow a parabolic path?',['Constant horizontal velocity with vertical acceleration','Air pushes it sideways','Gravity acts horizontally','Its speed stays constant'],0],
  ['std-11','phy','l5','Calculate the work done by a force of 20 N moving a body 5 m at 60° to the force.',['25 J','50 J','75 J','100 J'],1],
  ['std-11','che','l1','What is the atomic number of carbon?',['4','6','8','12'],1],
  ['std-11','che','l2','How many moles are in 44 g of CO₂? (Molar mass = 44 g/mol)',['0.5','1','2','4'],1],
  ['std-11','che','l3','Which quantum number describes the shape of an orbital?',['Principal (n)','Azimuthal (l)','Magnetic (m)','Spin (s)'],1],
  ['std-11','che','l4','Why does atomic radius decrease across a period?',['Increasing nuclear charge pulls electrons closer','New shells are added','Electrons are removed','Atomic mass decreases'],0],
  ['std-11','che','l5','Predict the hybridisation of carbon in ethene (C₂H₄).',['sp','sp²','sp³','sp³d'],1],
  ['std-11','bio','l1','Who proposed the binomial system of nomenclature?',['Charles Darwin','Carolus Linnaeus','Gregor Mendel','Robert Hooke'],1],
  ['std-11','bio','l2','Which tissue system forms the outermost protective layer in plants?',['Epidermal','Vascular','Ground','Meristematic'],0],
  ['std-11','bio','l3','Name the phase of mitosis in which chromosomes align at the equator.',['Prophase','Metaphase','Anaphase','Telophase'],1],
  ['std-11','bio','l4','Why is the human heart described as myogenic?',['The heartbeat originates in cardiac muscle itself','It is controlled only by the brain','It requires hormones to beat','It beats only during exercise'],0],
  ['std-11','bio','l5','Explain the role of stomata in regulating transpiration and gas exchange.',['Guard cells open and close the pore to control both','They store starch permanently','They absorb water from soil','They transport sugars to roots'],0],
  ['std-11','eng','l1','Identify the part of speech of "quickly".',['Adjective','Adverb','Noun','Verb'],1],
  ['std-11','eng','l2','Choose the correct usage of "its".',['Its raining outside','The dog wagged its tail','Its a fine day','The book lost its\' cover'],1],
  ['std-11','eng','l3','Which sentence is in the passive voice?',['They built the bridge','The bridge was built by them','They are building it','Build the bridge'],1],
  ['std-11','eng','l4','What is the tone of: "Oh, brilliant — another delayed train."',['Sincere praise','Sarcastic','Neutral','Formal'],1],
  ['std-11','eng','l5','In an argumentative essay, what is the primary purpose of a counter-argument?',['To acknowledge and refute an opposing view','To repeat the thesis','To add unrelated detail','To conclude the essay'],0],

  // ══════════════ CLASS 12 ══════════════
  ['std-12','mat','l1','What is the derivative of x³ with respect to x?',['3x','3x²','x²','x⁴/4'],1],
  ['std-12','mat','l2','Evaluate the integral of 2x dx.',['x²+ C','2x²+ C','x²/2 + C','2 + C'],0],
  ['std-12','mat','l3','If A is a 3×3 matrix with det(A) = 5, find det(2A).',['10','20','40','80'],2],
  ['std-12','mat','l4','Find the probability of getting exactly two heads in three fair coin tosses.',['1/8','2/8','3/8','4/8'],2],
  ['std-12','mat','l5','Find the angle between the vectors a = i + j and b = i − j.',['0°','45°','90°','180°'],2],
  ['std-12','phy','l1','What is the SI unit of capacitance?',['Ohm','Farad','Henry','Tesla'],1],
  ['std-12','phy','l2','State Coulomb\'s law for the force between two point charges.',['F ∝ q₁q₂/r²','F ∝ q₁q₂/r','F ∝ r²/q₁q₂','F ∝ q₁ + q₂'],0],
  ['std-12','phy','l3','A 2 μF capacitor is charged to 10 V. Calculate the energy stored.',['1 × 10⁻⁴ J','2 × 10⁻⁴ J','1 × 10⁻⁵ J','2 × 10⁻⁵ J'],0],
  ['std-12','phy','l4','Why does an ammeter need very low resistance?',['So it does not alter the circuit current','To increase the reading','To protect the battery','To measure voltage instead'],0],
  ['std-12','phy','l5','Explain how a step-up transformer increases voltage without violating energy conservation.',['Current decreases proportionally so power is conserved','Energy is created in the core','Frequency increases to compensate','Resistance supplies extra energy'],0],
  ['std-12','che','l1','What is the general formula of an alkane?',['CₙH₂ₙ','CₙH₂ₙ₊₂','CₙH₂ₙ₋₂','CₙHₙ'],1],
  ['std-12','che','l2','Which functional group is present in an aldehyde?',['−OH','−CHO','−COOH','−NH₂'],1],
  ['std-12','che','l3','What is the order of a reaction whose rate is independent of concentration?',['Zero order','First order','Second order','Third order'],0],
  ['std-12','che','l4','Why is benzene more stable than expected for a cyclic triene?',['Delocalisation of π electrons (resonance)','It has no double bonds','It is saturated','It contains only sigma bonds'],0],
  ['std-12','che','l5','Predict the product when ethanol is oxidised with acidified K₂Cr₂O₇.',['Methane','Ethanoic acid','Ethene','Ethyl chloride'],1],
  ['std-12','bio','l1','What is the human male gamete called?',['Ovum','Sperm','Zygote','Embryo'],1],
  ['std-12','bio','l2','Which molecule carries the genetic code from DNA to the ribosome?',['tRNA','mRNA','rRNA','DNA polymerase'],1],
  ['std-12','bio','l3','In a dihybrid cross of two heterozygotes, what is the phenotypic ratio?',['3:1','1:1','9:3:3:1','1:2:1'],2],
  ['std-12','bio','l4','Why are antibiotics ineffective against viral infections?',['Viruses lack the cell structures antibiotics target','Viruses are too large','Antibiotics dissolve in blood','Viruses reproduce too slowly'],0],
  ['std-12','bio','l5','Explain how natural selection leads to antibiotic resistance in bacteria.',['Resistant variants survive and reproduce, raising their frequency','Bacteria choose to mutate','Antibiotics create new genes','All bacteria become resistant at once'],0],
  ['std-12','eng','l1','Choose the correctly punctuated sentence.',['Its a long way home','It\'s a long way home','Its\' a long way home','It is\' a long way home'],1],
  ['std-12','eng','l2','Identify the mood: "Had I known, I would have helped."',['Indicative','Imperative','Subjunctive','Interrogative'],2],
  ['std-12','eng','l3','What is the function of a topic sentence in a paragraph?',['To state the main idea','To conclude the essay','To list references','To introduce dialogue'],0],
  ['std-12','eng','l4','Analyse: "The city never sleeps." Which device is used and what is its effect?',['Personification, giving the city human qualities','Simile, comparing two things','Onomatopoeia, imitating sound','Alliteration, repeating consonants'],0],
  ['std-12','eng','l5','In a formal report, which of these is the most appropriate register?',['Findings indicate a significant improvement','Stuff got way better','It was kinda good','Things looked alright I guess'],0],
];

export const ncertQuestions: Question[] = ROWS.map(([standardId, subjectId, levelId, text, options, ans]) => ({
  id: `ncert-${standardId}-${subjectId}-${levelId}`,
  standardId,
  subjectId,
  competencyId: `comp-${standardId}-${subjectId}-ncert-${levelId}`,
  levelId,
  text,
  options,
  answer: options[ans],
  marks: MARKS[levelId] ?? 1,
  type: 'MCQ' as QuestionKind,
}));

const LEVEL_LABEL: Record<string, string> = {
  l1: 'Foundation', l2: 'Emerging', l3: 'Developing', l4: 'Proficient', l5: 'Advanced',
};

const ACTIVITY: Record<string, string> = {
  l1: 'Re-teach the prerequisite with concrete materials, then re-check the same idea tomorrow.',
  l2: 'Model one worked example, then pair learners for a guided practice round.',
  l3: 'Set two multi-step problems and ask learners to talk through their steps.',
  l4: 'Give a comparison task and ask learners to justify which answer is stronger.',
  l5: 'Offer an extension problem and ask the learner to explain the reasoning to a peer.',
};

/**
 * One competency per standard × subject × level, so every NCERT question has a
 * COMPETENCY node to hang from. buildEducationGraph links a question to its
 * competency by competencyId — without these the questions would be orphaned
 * and the graph traversal would never reach them.
 */
export const ncertCompetencies: Competency[] = Array.from(
  new Map(
    ncertQuestions.map(q => [
      q.competencyId,
      {
        id: q.competencyId,
        standardId: q.standardId,
        subjectId: q.subjectId,
        domain: 'NCERT Core',
        title: `NCERT Core · ${LEVEL_LABEL[q.levelId]} Competency`,
        outcome: `Applies NCERT curriculum content at ${LEVEL_LABEL[q.levelId]} standard.`,
        levelId: q.levelId,
        teachingActivity: ACTIVITY[q.levelId] ?? ACTIVITY.l3,
      } as Competency,
    ]),
  ).values(),
);
