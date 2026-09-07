import type { DemoUser, SeedData, Competency, Question, Student, Classroom, StudyMaterial, SavedQuestionSet } from '../types';

export const demoUsers: DemoUser[] = [
  { username: 'teacher.sunita', password: 'Teacher@123', name: 'Sunita Devi (Jha)', role: 'TEACHER', mobileNumber: '+91 98765 43210', teacherId: 'HV-SRW-0142' },
  { username: 'teacher.anita', password: 'Teacher@123', name: 'Anita Sharma', role: 'TEACHER', mobileNumber: '+91 98123 45678', teacherId: 'HV-BHR-0089' },
  { username: 'admin.aarav', password: 'Admin@123', name: 'Aarav Mehta', role: 'ADMIN', mobileNumber: '+91 99999 00000', teacherId: 'HV-ADM-0001' },
  { username: 'teacher.rekha', password: 'Teacher@123', name: 'Rekha Verma', role: 'TEACHER', mobileNumber: '+91 97654 32109', teacherId: 'HV-SRW-0215' },
];

export const levels = [
  { id: 'l1', code: 'L1', name: 'Non-Reader / Foundation', color: '#d95c59', icon: '●', threshold: 40 },
  { id: 'l2', code: 'L2', name: 'Letter Recognition / Emerging', color: '#d58a32', icon: '◐', threshold: 50 },
  { id: 'l3', code: 'L3', name: 'Word Reader / Developing', color: '#ad9b31', icon: '◒', threshold: 60 },
  { id: 'l4', code: 'L4', name: 'Sentence Reader / Proficient', color: '#2b927d', icon: '●', threshold: 70 },
  { id: 'l5', code: 'L5', name: 'Grade-Level Reader / Advanced', color: '#3777a8', icon: '★', threshold: 80 },
];

export const subjects = [
  { id: 'hin', code: 'HIN', name: 'Hindi / भाषा', color: '#8b5a9b' },
  { id: 'eng', code: 'ENG', name: 'English', color: '#3d79a5' },
  { id: 'mat', code: 'MAT', name: 'Mathematics / Numeracy', color: '#cf6d39' },
  { id: 'sci', code: 'SCI', name: 'Science', color: '#2b927d' },
  { id: 'bio', code: 'BIO', name: 'Biology', color: '#48bb78' },
  { id: 'che', code: 'CHE', name: 'Chemistry', color: '#ed8936' },
  { id: 'phy', code: 'PHY', name: 'Physics', color: '#4299e1' },
];

export const CLASS_SUBJECT_MAP: Record<string, string[]> = {
  'std-6':  ['hin', 'eng', 'mat', 'sci'],
  'std-7':  ['hin', 'eng', 'mat', 'sci'],
  'std-8':  ['hin', 'eng', 'mat', 'sci'],
  'std-9':  ['eng', 'mat', 'bio', 'che', 'phy'],
  'std-10': ['eng', 'mat', 'bio', 'che', 'phy'],
  'std-11': ['eng', 'mat', 'bio', 'che', 'phy'],
  'std-12': ['eng', 'mat', 'bio', 'che', 'phy'],
};

export const CLASS_LABELS: Record<string, string> = {
  'std-6': 'Grade 6',
  'std-7': 'Grade 7',
  'std-8': 'Grade 8',
  'std-9': 'Grade 9',
  'std-10': 'Grade 10',
  'std-11': 'Grade 11',
  'std-12': 'Grade 12',
};

export const MONTHS_LIST = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const YEARS_LIST = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];

// Reading-fluency level names (Non-Reader/Letter/Word/Sentence Reader) only make sense for literacy subjects.
const LITERACY_SUBJECTS = new Set(['hin', 'eng']);
const GENERIC_LEVEL_NAMES: Record<string, string> = {
  l1: 'Foundation',
  l2: 'Emerging',
  l3: 'Developing',
  l4: 'Proficient',
  l5: 'Advanced',
};
export function getLevelLabel(subjectId: string, levelId: string): string {
  const lvl = levels.find(l => l.id === levelId);
  if (!lvl) return levelId;
  return LITERACY_SUBJECTS.has(subjectId) ? lvl.name : (GENERIC_LEVEL_NAMES[levelId] || lvl.name);
}

// ── Multi-grade Classrooms ───────────────────────────────────────────────────
export const seedClassrooms: Classroom[] = [
  {
    id: 'class-6-a',
    name: 'Grade 6 · Section A',
    grades: ['Grade 6'],
    roomName: 'Section A',
    teacherName: 'Anita Sharma',
    studentCount: 30,
    academicYear: '2026–27',
  },
  {
    id: 'class-7-b',
    name: 'Grade 7 · Section B',
    grades: ['Grade 7'],
    roomName: 'Section B',
    teacherName: 'Anita Sharma',
    studentCount: 28,
    academicYear: '2026–27',
  },
  {
    id: 'class-8-a',
    name: 'Grade 8 · Section A',
    grades: ['Grade 8'],
    roomName: 'Section A',
    teacherName: 'Anita Sharma',
    studentCount: 32,
    academicYear: '2026–27',
  },
  {
    id: 'class-9-a',
    name: 'Grade 9 · Sec A (Sci/Maths)',
    grades: ['Grade 9'],
    roomName: 'Sec A',
    teacherName: 'Sunita Devi (Jha)',
    studentCount: 36,
    academicYear: '2026–27',
  },
  {
    id: 'class-10-a',
    name: 'Grade 10 · Sec A (Sci/Maths)',
    grades: ['Grade 10'],
    roomName: 'Sec A',
    teacherName: 'Sunita Devi (Jha)',
    studentCount: 34,
    academicYear: '2026–27',
  },
  {
    id: 'class-11-a',
    name: 'Grade 11 · Senior Science Stream',
    grades: ['Grade 11'],
    roomName: 'Lab 1',
    teacherName: 'Aarav Mehta',
    studentCount: 25,
    academicYear: '2026–27',
  },
  {
    id: 'class-12-a',
    name: 'Grade 12 · Senior Science Stream',
    grades: ['Grade 12'],
    roomName: 'Lab 2',
    teacherName: 'Aarav Mehta',
    studentCount: 24,
    academicYear: '2026–27',
  },
];

// ── Level Specific Study Materials for Clickable Level Flags ─────────────────
export const seedStudyMaterials: StudyMaterial[] = [
  {
    id: 'mat-l1',
    levelId: 'l1',
    levelCode: 'L1',
    levelName: 'Foundation / Non-Reader',
    subjectId: 'mat',
    subjectName: 'Mathematics',
    domain: 'Number System & Concrete Counting',
    title: 'Foundational Concrete Counting & Number Matching',
    summary: 'Concrete object pairing, bead strings, and tactile number line recognition.',
    teacherGuide: 'Begin with 10 physical pebbles, counters, or tamarind seeds. Model 1-to-1 correspondence by moving one object for each count aloud. Never skip tactile manipulatives at this stage.',
    concreteActivities: [
      'Seed / Pebble Counting: Count groups of 5 and 10 using egg trays or cup trays.',
      'Tactile Sand Numbers: Trace number shapes (1-9) in sand plates while chanting their names.',
      'Body Math: Jump forward on a drawn chalk floor line from 0 to 10.',
      'Object Pairing: Pair 4 pencils with 4 erasers to understand equivalence.'
    ],
    printableWorksheets: [
      {
        title: 'Sheet 1: Count and Match the Groups',
        description: 'Draw a line connecting the group of dots to the correct numeral.',
        content: ['●●● → (3)', '●●●●● → (5)', '●● → (2)', '●●●●●●● → (7)', '● → (1)']
      },
      {
        title: 'Sheet 2: Dot-to-Number Fill',
        description: 'Color in the exact number of boxes corresponding to the digit.',
        content: ['Box 4: [■][■][■][■][ ][ ]', 'Box 6: [■][■][■][■][■][■]', 'Box 2: [■][■][ ][ ][ ][ ]']
      }
    ],
    parentHomeActivity: 'Ask the child to count 5 spoons, onions, or matchsticks before dinner. Praise every accurate count.',
    suggestedDuration: '20 minutes daily'
  },
  {
    id: 'mat-l2',
    levelId: 'l2',
    levelCode: 'L2',
    levelName: 'Emerging / Letter & Number Recognition',
    subjectId: 'mat',
    subjectName: 'Mathematics',
    domain: 'Place Value & Simple Addition',
    title: 'Place Value Bundles (Tens & Ones) and Visual Addition',
    summary: 'Ten-frame boxes, matchstick bundles of 10, and single-digit addition without carryover.',
    teacherGuide: 'Use bundles of 10 matchsticks/straws tied with rubber bands. Show that 14 is 1 bundle of ten and 4 loose sticks. Bridge to pictorial diagrams before writing symbols.',
    concreteActivities: [
      'Matchstick Bundles: Form groups of 10 and count remaining loose sticks (10 + 3 = 13).',
      'Ten-Frame Bingo: Place counters in a 2x5 grid to visualize making 10.',
      'Dice Addition: Roll two dice, collect that many pebbles, and find the total.'
    ],
    printableWorksheets: [
      {
        title: 'Sheet 1: Bundle Breakdown (Tens & Ones)',
        description: 'Write the number of tens and ones.',
        content: ['17 = ___ Ten + ___ Ones (1 Ten + 7 Ones)', '23 = ___ Tens + ___ Ones (2 Tens + 3 Ones)', '10 + 5 = ___ (15)']
      },
      {
        title: 'Sheet 2: Single Digit Addition with Pictures',
        description: 'Add the items and write the total.',
        content: ['3 apples + 4 apples = ___ (7)', '5 stars + 2 stars = ___ (7)', '6 leaves + 3 leaves = ___ (9)']
      }
    ],
    parentHomeActivity: 'Ask the child to count currency coins (1-rupee, 2-rupee, 5-rupee) and tell the total value.',
    suggestedDuration: '25 minutes daily'
  },
  {
    id: 'mat-l3',
    levelId: 'l3',
    levelCode: 'L3',
    levelName: 'Developing / Word Reader',
    subjectId: 'mat',
    subjectName: 'Mathematics',
    domain: '2-Digit Addition/Subtraction & Equal Sharing',
    title: 'Two-Digit Operations, Regrouping & Basic Multiplication',
    summary: 'Column addition/subtraction with regrouping, and multiplication as repeated addition.',
    teacherGuide: 'Model borrowing and carrying using column place-value charts. Have students explain step-by-step why 1 ten turns into 10 ones when subtracting.',
    concreteActivities: [
      'Base-10 Blocks / Currency Notes: Trade 1 ten-rupee note for ten 1-rupee coins.',
      'Array Multiplication: Arrange 12 bottle caps in 3 rows of 4 caps.',
      'Word Problem Roleplay: Simulate a village grocery store with simulated change.'
    ],
    printableWorksheets: [
      {
        title: 'Sheet 1: 2-Digit Addition with Regrouping',
        description: 'Solve the column problems with carryover.',
        content: ['28 + 15 = ___ (43)', '37 + 26 = ___ (63)', '49 + 33 = ___ (82)']
      },
      {
        title: 'Sheet 2: Equal Sharing (Multiplication / Division)',
        description: 'Distribute equally among groups.',
        content: ['15 laddus shared equally among 3 children = ___ each (5)', '4 packets of 5 biscuits = ___ total (20)']
      }
    ],
    parentHomeActivity: 'Give the child small change and ask them to calculate the cost of buying 2 packets of biscuits.',
    suggestedDuration: '30 minutes daily'
  },
  {
    id: 'mat-l4',
    levelId: 'l4',
    levelCode: 'L4',
    levelName: 'Proficient / Sentence Reader',
    subjectId: 'mat',
    subjectName: 'Mathematics',
    domain: 'Multi-step Word Problems & Fractions',
    title: 'Fractions, Multi-step Story Problems & Measurement',
    summary: 'Fraction strips (half, quarter, third), perimeter/area visualisations, and two-step reasoning.',
    teacherGuide: 'Fold paper strips in half and fourths. Compare 1/2 vs 2/4 visually. Present word problems that require two distinct mathematical decisions before computing.',
    concreteActivities: [
      'Paper Strip Fraction Folding: Fold a paper strip into 2, 4, and 8 equal parts.',
      'Perimeter Measuring: Measure the classroom desk edges with a 30cm ruler.',
      'Two-Step Budgeting: "Raju has ₹50. He buys 2 notebooks at ₹15 each. How much is left?"'
    ],
    printableWorksheets: [
      {
        title: 'Sheet 1: Fraction Shading & Comparison',
        description: 'Color the fraction and circle the larger one.',
        content: ['Shade 3/4 of a circle.', 'Which is larger: 1/2 or 1/4? (1/2)', 'Add: 1/5 + 2/5 = ___ (3/5)']
      },
      {
        title: 'Sheet 2: Multi-step Word Problems',
        description: 'Read the story, write the equation, and solve.',
        content: ['A bus had 32 passengers. At the first stop, 10 got off and 6 got on. How many now? (28)']
      }
    ],
    parentHomeActivity: 'Ask the child to divide a chapati or fruit equally into 4 equal slices and identify 1/4 and 2/4.',
    suggestedDuration: '30 minutes daily'
  },
  {
    id: 'mat-l5',
    levelId: 'l5',
    levelCode: 'L5',
    levelName: 'Advanced / Grade-Level Master',
    subjectId: 'mat',
    subjectName: 'Mathematics',
    domain: 'Algebraic Thinking & Data Representation',
    title: 'Pattern Generalisation, Data Interpretation & Open Challenges',
    summary: 'Bar graph analysis, variable reasoning, and multi-concept math investigations.',
    teacherGuide: 'Provide open-ended mathematical investigations. Challenge learners to discover rules on their own and defend their logic before their peers.',
    concreteActivities: [
      'Classroom Survey & Bar Chart: Survey classmates on favorite sports and draw a scaled bar graph.',
      'Pattern Rule Finder: Write the algebraic expression for 3, 7, 11, 15... (4n - 1).',
      'Area & Perimeter Mystery: "Design two different rectangles that both have an area of 24 sq cm."'
    ],
    printableWorksheets: [
      {
        title: 'Sheet 1: Data Interpretation',
        description: 'Analyze the bar graph and answer high-order questions.',
        content: ['Which day had the highest attendance?', 'What is the average attendance across 5 days?', 'Find the range between highest and lowest.']
      },
      {
        title: 'Sheet 2: Investigation & Algebra',
        description: 'Solve the pattern challenge.',
        content: ['If 2x + 5 = 21, what is x? (8)', 'Find the missing number in: 2, 6, 12, 20, 30, ___ (42)']
      }
    ],
    parentHomeActivity: 'Encourage the child to explain how they solved a complex multi-step math problem at school.',
    suggestedDuration: '35 minutes daily'
  },
  // Hindi / Reading Language Materials
  {
    id: 'hin-l1',
    levelId: 'l1',
    levelCode: 'L1',
    levelName: 'Non-Reader (अक्षर ज्ञान पूर्व)',
    subjectId: 'hin',
    subjectName: 'Hindi / भाषा',
    domain: 'ध्वनि और अक्षर पहचान (Phonemic Awareness)',
    title: 'अक्षर पहचान, ध्वनि मिलान व चित्र पठन',
    summary: 'चित्रों के माध्यम से प्रथम ध्वनि पहचानना और बुनियादी वर्णों (क, म, न, र, ल) का अभ्यास।',
    teacherGuide: 'चित्र दिखाकर पूछें: "यह क्या है?" (कमल). पहली ध्वनि क्या है? (क). फिर वर्ण कार्ड पर "क" दिखाएं।',
    concreteActivities: [
      'अक्षर कार्ड खेल: शिक्षक ध्वनि बोलते हैं, छात्र सही वर्ण कार्ड उठाते हैं।',
      'रेत पर अंगुली से अक्षर बनाना: क, म, र, ल।',
      'कविता गायन व ताल मिलान।'
    ],
    printableWorksheets: [
      {
        title: 'अभ्यास पत्रक 1: चित्र को प्रथम अक्षर से मिलाओ',
        description: 'चित्र देखकर सही अक्षर से रेखा खींचो।',
        content: ['कमल → क', 'मछली → म', 'नल → न', 'रथ → र', 'लड्डू → ल']
      }
    ],
    parentHomeActivity: 'घर में रखी वस्तुओं (कटोरी, थाली, चम्मच) का नाम बुलवाएं और पहली ध्वनि पूछें।',
    suggestedDuration: '20 मिनट प्रतिदिन'
  },
  {
    id: 'hin-l2',
    levelId: 'l2',
    levelCode: 'L2',
    levelName: 'Letter Recognition (अक्षर ज्ञान)',
    subjectId: 'hin',
    subjectName: 'Hindi / भाषा',
    domain: 'दो व तीन अक्षरीय सरल शब्द निर्माण',
    title: 'अमात्रिक शब्द पठन व लेखन (घर, जल, कमल, मटर)',
    summary: 'दो और तीन वर्णों को जोड़कर बिना मात्रा वाले शब्द पढ़ना व लिखना।',
    teacherGuide: 'वर्ण ग्रिड बनाएं। छात्रों से वर्ण जोड़कर शब्द बुलवाएं: घ + र = घर, क + ल + म = कलम।',
    concreteActivities: [
      'अक्षर पासा: दो पासे फेंकें, दोनों वर्ण मिलाकर सार्थक शब्द बनाएं।',
      'शब्द सीढ़ी खेल: अंतिम अक्षर से नया शब्द बनाना।'
    ],
    printableWorksheets: [
      {
        title: 'अभ्यास पत्रक 1: वर्ण जोड़कर शब्द लिखो',
        description: 'वर्णों को जोड़कर शब्द बनाएं और पढ़ें।',
        content: ['घ + र = घर', 'ज + ल = जल', 'म + ग + र = मगर', 'स + ड़ + क = सड़क']
      }
    ],
    parentHomeActivity: 'अखबार या पोस्टर में से "क", "म", "र" ढूंढ़ने का खेल खेलें।',
    suggestedDuration: '20 मिनट प्रतिदिन'
  },
  {
    id: 'hin-l3',
    levelId: 'l3',
    levelCode: 'L3',
    levelName: 'Word Reader (सरल शब्द व मात्रा पठन)',
    subjectId: 'hin',
    subjectName: 'Hindi / भाषा',
    domain: 'मात्रा पहचान व छोटे वाक्य पठन',
    title: 'आ, इ, ई, उ, ऊ की मात्राएं व 3-4 शब्दों के सरल वाक्य',
    summary: 'मात्राओं के साथ शब्द पढ़ना: राजा, पानी, सूरज, किताब।',
    teacherGuide: 'मात्रा चार्ट की सहायता से वर्णों पर मात्रा का उच्चारण सिखाएं। छोटे-छोटे वाक्य पढ़वाएं।',
    concreteActivities: [
      'मात्रा खिड़की: वर्ण के आगे मात्रा स्लाइड करके पढ़ना।',
      'फ्लैशकार्ड वाक्य निर्माण: "अमन पानी ला।"'
    ],
    printableWorksheets: [
      {
        title: 'अभ्यास पत्रक: मात्रा लगाओ और वाक्य पढ़ो',
        description: 'सही मात्रा लगाकर शब्द पूरा करें।',
        content: ['र__ज__ (राजा)', 'प__न__ (पानी)', 'क__त__ब (किताब)']
      }
    ],
    parentHomeActivity: 'बाल कहानी की किताब से एक पंक्ति बच्चे से पढ़वाएं।',
    suggestedDuration: '25 मिनट प्रतिदिन'
  },
  {
    id: 'hin-l4',
    levelId: 'l4',
    levelCode: 'L4',
    levelName: 'Sentence Reader (वाक्य व अनुच्छेद पठन)',
    subjectId: 'hin',
    subjectName: 'Hindi / भाषा',
    domain: 'प्रवाहपूर्ण पठन व अर्थग्रहण (Comprehension)',
    title: '4-5 वाक्यों का गद्यांश पठन व प्रत्यक्ष प्रश्नों के उत्तर',
    summary: 'कहानियों को प्रवाह के साथ पढ़ना और मुख्य विचार समझना।',
    teacherGuide: 'छात्रों से मौन पठन और फिर सस्वर पठन कराएं। "कहानी में कौन था?" जैसे सीधे प्रश्न पूछें।',
    concreteActivities: [
      'नाट्य मंचन: कहानी के संवाद बोलना।',
      'वाक्य क्रम मिलान: उल्टे-पुल्टे वाक्यों को सही क्रम में लगाना।'
    ],
    printableWorksheets: [
      {
        title: 'अभ्यास पत्रक: गद्यांश पढ़कर उत्तर दो',
        description: 'कहानी पढ़ें और प्रश्नों के उत्तर लिखें।',
        content: ['सोनू के पास एक बिल्ली थी। उसका नाम मिनी था। मिनी को दूध पसंद था।', 'प्रश्न: बिल्ली का क्या नाम था? उत्तर: मिनी']
      }
    ],
    parentHomeActivity: 'बच्चे से पूछें कि आज स्कूल में कौन सी कहानी सीखी और अपनी भाषा में सुनाने कहें।',
    suggestedDuration: '30 मिनट प्रतिदिन'
  },
  {
    id: 'hin-l5',
    levelId: 'l5',
    levelCode: 'L5',
    levelName: 'Grade-Level Reader (कक्षा स्तर व अभिव्यक्ति)',
    subjectId: 'hin',
    subjectName: 'Hindi / भाषा',
    domain: 'स्वतंत्र लेखन व आलोचनात्मक चिंतन',
    title: 'अपने शब्दों में कहानी का अंत बदलना, निबंध व पत्र लेखन',
    summary: 'रचनात्मक अभिव्यक्ति, नए शब्दों का प्रयोग, और गद्यांश पर विचार विमर्श।',
    teacherGuide: 'छात्रों को स्थिति दें: "यदि आप पेड़ होते तो क्या कहते?" उन्हें 5-6 वाक्य स्वतंत्र रूप से लिखने दें।',
    concreteActivities: [
      'वाद-विवाद और चर्चा: "गांव अच्छा या शहर?"',
      'कक्षा की दीवार पत्रिका (Wall Magazine) में कविता या कहानी लिखना।'
    ],
    printableWorksheets: [
      {
        title: 'रचनात्मक पत्रक: अपने प्रिय त्योहार पर 5 वाक्य लिखो',
        description: 'अपने शब्दों में विवरण लिखें।',
        content: ['1. मेरा प्रिय त्योहार ___ है।', '2. इस दिन हम ___ करते हैं।']
      }
    ],
    parentHomeActivity: 'बच्चे को घर की किसी भी घटना पर अपनी डायरी में 3 वाक्य लिखने को कहें।',
    suggestedDuration: '30 मिनट प्रतिदिन'
  }
];

// ── Realistic Indian Students Data with Parent Contacts & Monthwise Levels ──
export const seedStudents: Student[] = [
  {
    id: 'stu-1',
    name: 'Rekha Kumari',
    classId: 'class-6-a',
    admission: 'HV-26-001',
    rollNumber: 14,
    gender: 'Girl',
    gradeLevel: 'Grade 6',
    parentName: 'Rameshwar Kumar',
    parentPhone: '+91 98765 11001',
    parentEmail: 'rameshwar.k@gmail.com',
    trend: 'Improving',
    focus: 'Mathematics',
    level: 'Sentence Reader / Proficient',
    currentLevelId: 'l4',
    readingLevel: 'Sentence Reader (L4)',
    writingLevel: 'Paragraphs (L5)',
    numeracyLevel: 'Addition (L3)',
    monthwiseLevels: {
      'July 2026': 3,
      'August 2026': 4,
      'September 2026': 4,
    },
    notes: 'Rekha has mastered sentence reading and basic addition. Next focus is 2-digit subtraction and story comprehension.'
  },
  {
    id: 'stu-2',
    name: 'Anita Devi',
    classId: 'class-7-b',
    admission: 'HV-26-002',
    rollNumber: 1,
    gender: 'Girl',
    gradeLevel: 'Grade 7',
    parentName: 'Gopal Devi',
    parentPhone: '+91 98765 11002',
    parentEmail: '',
    trend: 'Improving',
    focus: 'Hindi / भाषा',
    level: 'Letter Recognition / Emerging',
    currentLevelId: 'l2',
    readingLevel: 'Letter Recognition (L2)',
    writingLevel: 'Letter Tracing (L2)',
    numeracyLevel: 'Concrete Counting (L1)',
    monthwiseLevels: {
      'July 2026': 1,
      'August 2026': 2,
      'September 2026': 2,
    },
    notes: 'Knows 12 basic Hindi consonants. Moving to simple two-letter word building.'
  },
  {
    id: 'stu-3',
    name: 'Sohan Lal',
    classId: 'class-8-a',
    admission: 'HV-26-003',
    rollNumber: 2,
    gender: 'Boy',
    gradeLevel: 'Grade 8',
    parentName: 'Babulal Lal',
    parentPhone: '+91 98765 11003',
    parentEmail: 'babulal.lal@outlook.com',
    trend: 'Stable',
    focus: 'Mathematics',
    level: 'Word Reader / Developing',
    currentLevelId: 'l3',
    readingLevel: 'Word Reader (L3)',
    writingLevel: 'Word Writing (L3)',
    numeracyLevel: 'Addition with Carry (L3)',
    monthwiseLevels: {
      'July 2026': 3,
      'August 2026': 3,
      'September 2026': 3,
    },
    notes: 'Confident with single-digit addition, needs practice with carryover.'
  },
  {
    id: 'stu-4',
    name: 'Pooja Kumari',
    classId: 'class-9-a',
    admission: 'HV-26-004',
    rollNumber: 3,
    gender: 'Girl',
    gradeLevel: 'Grade 9',
    parentName: 'Santosh Kumar',
    parentPhone: '+91 98765 11004',
    parentEmail: '',
    trend: 'Improving',
    focus: 'English',
    level: 'Sentence Reader / Proficient',
    currentLevelId: 'l4',
    readingLevel: 'Sentence Reader (L4)',
    writingLevel: 'Sentence Formation (L4)',
    numeracyLevel: 'Multiplication (L4)',
    monthwiseLevels: {
      'July 2026': 3,
      'August 2026': 4,
      'September 2026': 4,
    },
    notes: 'Reads English primers smoothly. Excellent participation in story circles.'
  },
  {
    id: 'stu-5',
    name: 'Amit Kumar',
    classId: 'class-10-a',
    admission: 'HV-26-005',
    rollNumber: 4,
    gender: 'Boy',
    gradeLevel: 'Grade 10',
    parentName: 'Shyam Sundar',
    parentPhone: '+91 98765 11005',
    parentEmail: 'shyam.sundar@yahoo.com',
    trend: 'Review required',
    focus: 'Physics',
    level: 'Non-Reader / Foundation',
    currentLevelId: 'l1',
    readingLevel: 'Non-Reader (L1)',
    writingLevel: 'Pre-writing Strokes (L1)',
    numeracyLevel: 'Object Counting (L1)',
    monthwiseLevels: {
      'July 2026': 1,
      'August 2026': 1,
      'September 2026': 1,
    },
    notes: 'Needs dedicated 10-minute practice every morning.'
  },
  {
    id: 'stu-6',
    name: 'Meera Joshi',
    classId: 'class-11-a',
    admission: 'HV-26-006',
    rollNumber: 5,
    gender: 'Girl',
    gradeLevel: 'Grade 11',
    parentName: 'Kailash Joshi',
    parentPhone: '+91 98765 11006',
    parentEmail: 'kailash.joshi@gmail.com',
    trend: 'Improving',
    focus: 'Chemistry',
    level: 'Grade-Level Reader / Advanced',
    currentLevelId: 'l5',
    readingLevel: 'Grade-Level (L5)',
    writingLevel: 'Story Writing (L5)',
    numeracyLevel: 'Fractions & Division (L5)',
    monthwiseLevels: {
      'July 2026': 4,
      'August 2026': 5,
      'September 2026': 5,
    },
    notes: 'Exemplary problem solver. Can assist peers during group activity rounds.'
  },
  {
    id: 'stu-7',
    name: 'Kabir Singh',
    classId: 'class-12-a',
    admission: 'HV-26-007',
    rollNumber: 6,
    gender: 'Boy',
    gradeLevel: 'Grade 12',
    parentName: 'Jaswant Singh',
    parentPhone: '+91 98765 11007',
    parentEmail: '',
    trend: 'Improving',
    focus: 'Biology',
    level: 'Word Reader / Developing',
    currentLevelId: 'l3',
    readingLevel: 'Word Reader (L3)',
    writingLevel: 'Words (L3)',
    numeracyLevel: '2-Digit Addition (L3)',
    monthwiseLevels: {
      'July 2026': 2,
      'August 2026': 3,
      'September 2026': 3,
    },
    notes: 'Jumped from L2 to L3 after regular practice.'
  },
  {
    id: 'stu-8',
    name: 'Priya Verma',
    classId: 'class-6-a',
    admission: 'HV-26-008',
    rollNumber: 7,
    gender: 'Girl',
    gradeLevel: 'Grade 6',
    parentName: 'Vijay Verma',
    parentPhone: '+91 98765 11008',
    parentEmail: 'vijay.verma26@gmail.com',
    trend: 'Stable',
    focus: 'Hindi',
    level: 'Letter Recognition / Emerging',
    currentLevelId: 'l2',
    readingLevel: 'Letter Recognition (L2)',
    writingLevel: 'Letters (L2)',
    numeracyLevel: 'Numbers 1-20 (L2)',
    monthwiseLevels: {
      'July 2026': 2,
      'August 2026': 2,
      'September 2026': 2,
    },
    notes: 'Understands vowel symbols. Moving toward two-letter word reading.'
  },
  {
    id: 'stu-9',
    name: 'Rohan Gupta',
    classId: 'class-6-a',
    admission: 'HV-26-009',
    rollNumber: 1,
    gender: 'Boy',
    gradeLevel: 'Grade 6',
    parentName: 'Mahesh Gupta',
    parentPhone: '+91 98765 22001',
    parentEmail: 'mahesh.gupta@gmail.com',
    trend: 'Improving',
    focus: 'Mathematics',
    level: 'Word Reader / Developing',
    currentLevelId: 'l3',
    readingLevel: 'Sentence Reader (L4)',
    writingLevel: 'Paragraphs (L4)',
    numeracyLevel: 'Fractions (L3)',
    monthwiseLevels: {
      'July 2026': 2,
      'August 2026': 3,
      'September 2026': 3,
    },
    notes: 'Needs concrete fraction strip work to grasp unlike denominators.'
  },
  {
    id: 'stu-10',
    name: 'Sneha Sharma',
    classId: 'class-6-a',
    admission: 'HV-26-010',
    rollNumber: 2,
    gender: 'Girl',
    gradeLevel: 'Grade 6',
    parentName: 'Rajendra Sharma',
    parentPhone: '+91 98765 22002',
    parentEmail: 'rajendra.sharma@yahoo.co.in',
    trend: 'Improving',
    focus: 'Science',
    level: 'Sentence Reader / Proficient',
    currentLevelId: 'l4',
    readingLevel: 'Grade-Level (L5)',
    writingLevel: 'Explanatory (L4)',
    numeracyLevel: 'Equations (L4)',
    monthwiseLevels: {
      'July 2026': 3,
      'August 2026': 4,
      'September 2026': 4,
    },
    notes: 'Strong analytical skills in plant biology and life systems.'
  },
  {
    id: 'stu-11',
    name: 'Vikram Nair',
    classId: 'class-6-a',
    admission: 'HV-26-011',
    rollNumber: 3,
    gender: 'Boy',
    gradeLevel: 'Grade 6',
    parentName: 'Narayanan Nair',
    parentPhone: '+91 98765 22003',
    parentEmail: 'n.nair@kerala.in',
    trend: 'Review required',
    focus: 'Mathematics',
    level: 'Non-Reader / Foundation',
    currentLevelId: 'l1',
    readingLevel: 'Emerging (L2)',
    writingLevel: 'Basic (L2)',
    numeracyLevel: 'Foundation (L1)',
    monthwiseLevels: {
      'July 2026': 1,
      'August 2026': 1,
      'September 2026': 1,
    },
    notes: 'Struggles with negative integers and fraction concepts. Requires peer tutoring.'
  },
  {
    id: 'stu-12',
    name: 'Aditi Rao',
    classId: 'class-6-a',
    admission: 'HV-26-012',
    rollNumber: 4,
    gender: 'Girl',
    gradeLevel: 'Grade 6',
    parentName: 'Prashant Rao',
    parentPhone: '+91 98765 22004',
    parentEmail: 'prashant.rao@gmail.com',
    trend: 'Improving',
    focus: 'Mathematics',
    level: 'Grade-Level Reader / Advanced',
    currentLevelId: 'l5',
    readingLevel: 'Mastery (L5)',
    writingLevel: 'Mastery (L5)',
    numeracyLevel: 'Mastery (L5)',
    monthwiseLevels: {
      'July 2026': 4,
      'August 2026': 5,
      'September 2026': 5,
    },
    notes: 'Demonstrates deep algebraic thinking and quick geometric proofs.'
  },
];

// Generate additional students to reach 80 total for realistic multi-class stats
const moreNames = [
  'Aarav Kumar', 'Divya Patel', 'Harsh Vardhan', 'Kavita Singh', 'Manish Yadav',
  'Pooja Rawat', 'Rahul Mishra', 'Ritu Chouhan', 'Sachin Tiwari', 'Tanvi Shah',
  'Utkarsh Pandey', 'Varun Joshi', 'Yash Meena', 'Ananya Gupta', 'Bhavna Sharma',
  'Chirag Soni', 'Deepak Chauhan', 'Ekta Sen', 'Farhan Ali', 'Geeta Pal'
];

for (let i = 13; i <= 60; i++) {
  const classId = seedClassrooms[i % seedClassrooms.length].id;
  const name = `${moreNames[i % moreNames.length]} ${String(i).padStart(2, '0')}`;
  const lvlNum = ((i % 5) + 1);
  const lvlObj = levels[lvlNum - 1];
  seedStudents.push({
    id: `stu-${i}`,
    name,
    classId,
    admission: `HV-26-${String(i).padStart(3, '0')}`,
    rollNumber: (i % 20) + 1,
    gender: i % 2 === 0 ? 'Girl' : 'Boy',
    gradeLevel: seedClassrooms[i % seedClassrooms.length].grades[0],
    parentName: `Parent of ${name.split(' ')[0]}`,
    parentPhone: `+91 98765 ${String(10000 + i)}`,
    parentEmail: i % 3 === 0 ? `parent.${i}@gmail.com` : '',
    trend: (['Improving', 'Stable', 'Review required', 'Newly assessed'] as const)[i % 4],
    focus: subjects[i % subjects.length].name,
    level: lvlObj.name,
    currentLevelId: lvlObj.id,
    monthwiseLevels: {
      'July 2026': Math.max(1, lvlNum - 1),
      'August 2026': lvlNum,
      'September 2026': lvlNum,
    },
    notes: `Regular monthly assessment tracked. Currently practicing ${lvlObj.name} activities.`
  });
}

// ── Initial Seeded Saved Question Sets (stand_month_setno) ────────────────────
export const seedSavedSets: SavedQuestionSet[] = [
  {
    id: 'set-std6-aug26-01',
    setName: 'std6_aug2026_set01',
    standardId: 'std-6',
    standardName: 'Grade 6',
    month: 'August 2026',
    setNumber: '01',
    subjectId: 'mat',
    subjectName: 'Mathematics',
    targetLevelId: 'l3',
    createdAt: '2026-08-10T10:30:00.000Z',
    totalQuestions: 5,
    status: 'FINALIZED',
    levelDistribution: { l1: 1, l2: 1, l3: 1, l4: 1, l5: 1 },
    questions: [
      {
        id: 'q-s6-l1',
        standardId: 'std-6',
        subjectId: 'mat',
        competencyId: 'comp-mat-6-1',
        levelId: 'l1',
        text: 'What is the place value of digit 7 in 4,752?',
        options: ['7', '70', '700', '7000'],
        answer: '700',
        marks: 1,
        type: 'MCQ'
      },
      {
        id: 'q-s6-l2',
        standardId: 'std-6',
        subjectId: 'mat',
        competencyId: 'comp-mat-6-1',
        levelId: 'l2',
        text: 'Which is greater: 0.7 or 0.07?',
        options: ['0.7', '0.07', 'Both are equal', 'Cannot be determined'],
        answer: '0.7',
        marks: 1,
        type: 'MCQ'
      },
      {
        id: 'q-s6-l3',
        standardId: 'std-6',
        subjectId: 'mat',
        competencyId: 'comp-mat-6-2',
        levelId: 'l3',
        text: 'Solve: 3/4 + 1/2 = ?',
        options: ['4/6', '5/4', '1', '4/4'],
        answer: '5/4',
        marks: 2,
        type: 'MCQ'
      },
      {
        id: 'q-s6-l4',
        standardId: 'std-6',
        subjectId: 'mat',
        competencyId: 'comp-mat-6-3',
        levelId: 'l4',
        text: 'Find the perimeter of a rectangle with length 12 cm and width 8 cm.',
        options: ['20 cm', '40 cm', '96 sq cm', '24 cm'],
        answer: '40 cm',
        marks: 2,
        type: 'MCQ'
      },
      {
        id: 'q-s6-l5',
        standardId: 'std-6',
        subjectId: 'mat',
        competencyId: 'comp-mat-6-4',
        levelId: 'l5',
        text: 'If 3x + 7 = 28, find the value of 2x - 1.',
        options: ['11', '13', '14', '7'],
        answer: '13',
        marks: 3,
        type: 'MCQ'
      }
    ]
  },
  {
    id: 'set-std3-sep26-01',
    setName: 'std3_sep2026_set01',
    standardId: 'std-3',
    standardName: 'Grade 3',
    month: 'September 2026',
    setNumber: '01',
    subjectId: 'mat',
    subjectName: 'Mathematics',
    targetLevelId: 'l3',
    createdAt: '2026-09-02T09:15:00.000Z',
    totalQuestions: 5,
    status: 'FINALIZED',
    levelDistribution: { l1: 1, l2: 1, l3: 1, l4: 1, l5: 1 },
    questions: [
      {
        id: 'q-s3-l1',
        standardId: 'std-3',
        subjectId: 'mat',
        competencyId: 'comp-mat-3-1',
        levelId: 'l1',
        text: 'Count the total number of stars: ★ ★ ★ ★ ★ ★',
        options: ['4', '5', '6', '7'],
        answer: '6',
        marks: 1,
        type: 'MCQ'
      },
      {
        id: 'q-s3-l2',
        standardId: 'std-3',
        subjectId: 'mat',
        competencyId: 'comp-mat-3-1',
        levelId: 'l2',
        text: 'Write the number: 4 Tens and 3 Ones = ?',
        options: ['34', '43', '7', '403'],
        answer: '43',
        marks: 1,
        type: 'MCQ'
      },
      {
        id: 'q-s3-l3',
        standardId: 'std-3',
        subjectId: 'mat',
        competencyId: 'comp-mat-3-2',
        levelId: 'l3',
        text: 'Add: 36 + 25 = ?',
        options: ['51', '61', '59', '60'],
        answer: '61',
        marks: 2,
        type: 'MCQ'
      },
      {
        id: 'q-s3-l4',
        standardId: 'std-3',
        subjectId: 'mat',
        competencyId: 'comp-mat-3-3',
        levelId: 'l4',
        text: 'Raju has 24 pencils. He shares them equally among 4 friends. How many does each get?',
        options: ['4', '6', '8', '12'],
        answer: '6',
        marks: 2,
        type: 'MCQ'
      },
      {
        id: 'q-s3-l5',
        standardId: 'std-3',
        subjectId: 'mat',
        competencyId: 'comp-mat-3-4',
        levelId: 'l5',
        text: 'Complete the pattern: 5, 10, 15, 20, ___, ___',
        options: ['22, 24', '25, 30', '21, 26', '30, 35'],
        answer: '25, 30',
        marks: 2,
        type: 'MCQ'
      }
    ]
  },
  {
    id: 'set-std134-aug26-02',
    setName: 'std1_3_4_aug2026_set02',
    standardId: 'std-3',
    standardName: 'Grade 1, 3, 4 Room B',
    month: 'August 2026',
    setNumber: '02',
    subjectId: 'hin',
    subjectName: 'Hindi / भाषा',
    targetLevelId: 'l3',
    createdAt: '2026-08-15T11:00:00.000Z',
    totalQuestions: 5,
    status: 'FINALIZED',
    levelDistribution: { l1: 1, l2: 1, l3: 1, l4: 1, l5: 1 },
    questions: [
      {
        id: 'q-hin-l1',
        standardId: 'std-3',
        subjectId: 'hin',
        competencyId: 'comp-hin-1',
        levelId: 'l1',
        text: 'चित्र देखकर बताएं: [कमल] की पहली ध्वनि कौन सी है?',
        options: ['क', 'म', 'ल', 'न'],
        answer: 'क',
        marks: 1,
        type: 'MCQ'
      },
      {
        id: 'q-hin-l2',
        standardId: 'std-3',
        subjectId: 'hin',
        competencyId: 'comp-hin-2',
        levelId: 'l2',
        text: 'वर्ण जोड़कर शब्द बनाइए: घ + र = ?',
        options: ['घर', 'जल', 'कल', 'रथ'],
        answer: 'घर',
        marks: 1,
        type: 'MCQ'
      },
      {
        id: 'q-hin-l3',
        standardId: 'std-3',
        subjectId: 'hin',
        competencyId: 'comp-hin-3',
        levelId: 'l3',
        text: '"पानी" शब्द में कौन-कौन सी मात्राएं हैं?',
        options: ['आ और ई', 'इ और उ', 'ए और ऐ', 'अ और आ'],
        answer: 'आ और ई',
        marks: 2,
        type: 'MCQ'
      },
      {
        id: 'q-hin-l4',
        standardId: 'std-3',
        subjectId: 'hin',
        competencyId: 'comp-hin-4',
        levelId: 'l4',
        text: 'सही वाक्य चुनिए:',
        options: ['रोहन पानी पीता है।', 'रोहन पानी पीती है।', 'रोहन पानी खाता है।', 'रोहन पानी बहता है।'],
        answer: 'रोहन पानी पीता है।',
        marks: 2,
        type: 'MCQ'
      },
      {
        id: 'q-hin-l5',
        standardId: 'std-3',
        subjectId: 'hin',
        competencyId: 'comp-hin-5',
        levelId: 'l5',
        text: 'कहानी समझ: "पेड़ हमें फल और छाया देते हैं।" पेड़ से हमें क्या मिलता है?',
        options: ['फल और छाया', 'केवल खिलौने', 'गाड़ी', 'किताबें'],
        answer: 'फल और छाया',
        marks: 2,
        type: 'MCQ'
      }
    ]
  }
];

// ── Competencies & Questions for Knowledge Graph Engine ─────────────────────
export const competencies: Competency[] = [];
// Seed with hand-authored real questions first so the paper generator (which
// finds the first subject+level match) prefers real content over templates below.
const seenRealQuestionKeys = new Set<string>();
export const questions: Question[] = seedSavedSets
  .flatMap(set => set.questions)
  .filter(q => {
    const key = `${q.subjectId}|${q.levelId}`;
    if (seenRealQuestionKeys.has(key)) return false;
    seenRealQuestionKeys.add(key);
    return true;
  });

const domainsBySubject: Record<string, string[]> = {
  hin: ['ध्वनि व वर्ण पहचान', 'शब्द रचना', 'वाक्य व अर्थग्रहण', 'रचनात्मक अभिव्यक्ति'],
  eng: ['Reading and Language', 'Grammar', 'Vocabulary', 'Writing'],
  mat: ['Number System', 'Geometry', 'Algebra', 'Statistics'],
  sci: ['Living World', 'Forces and Motion', 'Cell Biology', 'Chemical Reactions'],
  bio: ['Genetics & Evolution', 'Cellular Biology', 'Human Physiology', 'Ecology & Environment'],
  che: ['Atomic Structure', 'Chemical Bonding', 'Organic Chemistry', 'Thermodynamics & Kinetics'],
  phy: ['Mechanics & Motion', 'Electromagnetism', 'Optics & Wave Physics', 'Modern Physics & Quantum'],
  soc: ['Civic Life', 'Our Environment', 'History & Heritage'],
  evs: ['Our Surroundings', 'Plants & Animals', 'Clean Water & Air'],
};

const standards = ['std-6', 'std-7', 'std-8', 'std-9', 'std-10', 'std-11', 'std-12'];

let compCounter = 1;
let questionCounter = 1;

for (const stdId of standards) {
  const subjectIds = CLASS_SUBJECT_MAP[stdId] || ['mat', 'eng', 'hin', 'sci'];
  for (const subId of subjectIds) {
    const domains = domainsBySubject[subId] || ['General Core', 'Applied Practice'];
    for (const domain of domains) {
      for (const level of levels) {
        const levelLabel = getLevelLabel(subId, level.id);
        const compId = `comp-${stdId}-${subId}-${compCounter++}`;
        const title = `${domain} · ${levelLabel} Competency (${CLASS_LABELS[stdId] || stdId})`;
        const outcome = `Demonstrates clear mastery and application in ${domain} at ${levelLabel} standard.`;
        const teachingActivity = `Next-day action for ${levelLabel}: Engage students with targeted ${domain.toLowerCase()} hands-on practice and guided feedback.`;

        competencies.push({
          id: compId,
          standardId: stdId,
          subjectId: subId,
          domain,
          title,
          outcome,
          levelId: level.id,
          teachingActivity,
        });

        // Add 2 questions per competency
        questions.push({
          id: `q-${questionCounter++}`,
          standardId: stdId,
          subjectId: subId,
          competencyId: compId,
          levelId: level.id,
          text: `[${CLASS_LABELS[stdId]} ${domain}] Identify the key concept of ${domain} for ${levelLabel}.`,
          options: ['Option A (Fundamental)', 'Option B (Key Principle - Correct)', 'Option C (Alternative)', 'Option D (Extended)'],
          answer: 'Option B (Key Principle - Correct)',
          marks: level.id === 'l1' || level.id === 'l2' ? 1 : level.id === 'l3' || level.id === 'l4' ? 2 : 3,
          type: 'MCQ',
        });

        questions.push({
          id: `q-${questionCounter++}`,
          standardId: stdId,
          subjectId: subId,
          competencyId: compId,
          levelId: level.id,
          text: `[${CLASS_LABELS[stdId]} ${domain}] Explain or compute the solution for ${domain} at ${level.code} level.`,
          options: [],
          answer: `Accurate application of ${domain} concepts with logical steps.`,
          marks: 2,
          type: 'DESCRIPTIVE',
        });
      }
    }
  }
}

export const seedData: SeedData = {
  years: [
    { id: 'AY2025_26', label: '2025–26', status: 'ARCHIVED' },
    { id: 'AY2026_27', label: '2026–27', status: 'ACTIVE' },
    { id: 'AY2027_28', label: '2027–28', status: 'PLANNED' },
  ],
  levels,
  subjects,
  competencies,
  questions,
  students: seedStudents,
  classrooms: seedClassrooms,
  studyMaterials: seedStudyMaterials,
  savedSets: seedSavedSets,
  stats: { schools: 2, teachers: 3, classes: 5, assessments: 24, sync: 4 },
};
