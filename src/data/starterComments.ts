// src/data/starterComments.ts
// ─────────────────────────────────────────────────────────────────────────────
// Content library for Quick Start and Build as You Go templates.
//
// RANDOM SELECTION: Every section has 6 statements per button.
// At build time, pick3() randomly selects 3 from the 6, so each template
// created is slightly different — giving variety across teachers.
// ─────────────────────────────────────────────────────────────────────────────

import { TemplateSection } from '../types';

const makeId = () => `qs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// Randomly pick n items from an array (no repeats)
function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

// Shorthand: pick 3 from a pool of 6
const p3 = (arr: string[]) => pickRandom(arr, 3);

// ─────────────────────────────────────────────────────────────────────────────
// ADDABLE BUTTON POOLS
// These are used in the section editor to show "+ Add" style buttons.
// Each section type has a universal pool and subject-specific pools.
// ─────────────────────────────────────────────────────────────────────────────

export interface AddableButton {
  name: string;
  statements: string[];
}

// ─── STRENGTHS ───────────────────────────────────────────────────────────────

export const STRENGTHS_DEFAULT_BUTTONS: string[] = [
  'Confident',
  'Works well with others',
  'Leadership',
  'Reliable',
  'Positive attitude',
];

export const STRENGTHS_ADDABLE_UNIVERSAL: AddableButton[] = [
  {
    name: 'Communication skills',
    statements: p3([
      '[Name] communicates ideas clearly and effectively both verbally and in writing.',
      '[Name] is an excellent communicator who expresses thoughts with confidence and clarity.',
      '[Name] demonstrates strong communication skills and engages articulately in all situations.',
      '[Name] communicates with peers and staff in a mature and respectful manner.',
      '[Name] is able to convey ideas clearly and listens carefully to the contributions of others.',
      '[Name] has excellent communication skills and uses them to great effect in group work.',
    ]),
  },
  {
    name: 'Contribution to class discussions',
    statements: p3([
      '[Name] makes a valuable contribution to class discussions and is always willing to share ideas.',
      '[Name] participates enthusiastically in discussions and enriches the learning of the whole class.',
      '[Name] is a confident contributor to class discussions and helps create a positive atmosphere.',
      '[Name] consistently offers thoughtful contributions to class discussions.',
      '[Name] engages actively in group discussions and encourages others to participate.',
      '[Name] brings great energy and insight to class discussions.',
    ]),
  },
  {
    name: 'Helping others',
    statements: p3([
      '[Name] is generous with their time and willingly supports classmates who need help.',
      '[Name] demonstrates real kindness by offering help to others without being asked.',
      '[Name] is a supportive presence in the classroom and always looks out for their peers.',
      '[Name] takes pride in helping others and does so with patience and care.',
      '[Name] is quick to offer assistance to classmates and does so with genuine warmth.',
      '[Name] shows impressive maturity by supporting others and contributing to a positive class environment.',
    ]),
  },
  {
    name: 'Resilience',
    statements: p3([
      '[Name] demonstrates great resilience and perseveres when faced with challenging tasks.',
      '[Name] responds positively to setbacks and shows determination to overcome difficulties.',
      '[Name] approaches challenges with a growth mindset and does not give up easily.',
      '[Name] shows impressive resilience and bounces back quickly when things are difficult.',
      '[Name] faces challenges head-on and demonstrates real mental toughness.',
      '[Name] shows that they understand that struggle is part of learning and embraces challenges confidently.',
    ]),
  },
  {
    name: 'Independence',
    statements: p3([
      '[Name] works with impressive independence and takes responsibility for their own learning.',
      '[Name] is a self-sufficient learner who manages their work effectively without prompting.',
      '[Name] shows great independence and is able to tackle challenging tasks with confidence.',
      '[Name] takes ownership of their learning and works independently to a high standard.',
      '[Name] demonstrates the ability to work without support and does so with real maturity.',
      '[Name] is a highly independent learner who consistently takes initiative.',
    ]),
  },
  {
    name: 'Creativity',
    statements: p3([
      '[Name] brings a creative approach to their work and consistently produces original ideas.',
      '[Name] demonstrates impressive creativity and is not afraid to think outside the box.',
      '[Name] approaches tasks with imagination and flair, producing work that stands out.',
      '[Name] is a creative thinker who adds originality and freshness to everything they do.',
      '[Name] consistently brings creative thinking to tasks and produces work of real distinction.',
      '[Name] has a natural creative ability that enhances the quality of their work considerably.',
    ]),
  },
  {
    name: 'Curiosity',
    statements: p3([
      '[Name] shows a genuine curiosity about learning and is always keen to find out more.',
      '[Name] asks perceptive questions that demonstrate a deep interest in the subject.',
      '[Name] is naturally curious and approaches new topics with real enthusiasm.',
      '[Name] demonstrates impressive intellectual curiosity and a love of learning.',
      '[Name] always wants to understand the "why" behind things — a sign of a real learner.',
      '[Name] brings infectious curiosity to the classroom that inspires others around them.',
    ]),
  },
  {
    name: 'Organisation',
    statements: p3([
      '[Name] is exceptionally well organised and always comes to lessons fully prepared.',
      '[Name] manages their time and materials effectively, demonstrating excellent organisational skills.',
      '[Name] is consistently organised and demonstrates strong self-management skills.',
      '[Name] keeps their work neat and well-ordered and always meets expectations in terms of preparation.',
      '[Name] plans their work carefully and demonstrates admirable organisational ability.',
      '[Name] is one of the most organised pupils in the class and sets a great example to others.',
    ]),
  },
  {
    name: 'Self-motivation',
    statements: p3([
      '[Name] is highly self-motivated and always gives their best regardless of the task.',
      '[Name] requires no prompting to work hard — their motivation comes entirely from within.',
      '[Name] demonstrates impressive self-motivation and a genuine desire to improve.',
      '[Name] is driven by a desire to do well and this shows clearly in the quality of their work.',
      '[Name] is an intrinsically motivated learner who takes real pride in their achievements.',
      '[Name] consistently demonstrates the self-motivation needed to succeed at the highest level.',
    ]),
  },
  {
    name: 'Adaptability',
    statements: p3([
      '[Name] adapts well to new situations and embraces change with a positive attitude.',
      '[Name] is flexible in their approach and handles new challenges with confidence.',
      '[Name] shows impressive adaptability and thrives when asked to work in different ways.',
      '[Name] copes well with change and always approaches new tasks with an open mind.',
      '[Name] is a versatile learner who adapts quickly to different tasks and environments.',
      '[Name] demonstrates real maturity in the way they adapt to different learning situations.',
    ]),
  },
];

export const STRENGTHS_ADDABLE_BY_SUBJECT: Record<string, AddableButton[]> = {
  'PE': [
    {
      name: 'Sportsmanship',
      statements: p3([
        '[Name] demonstrates excellent sportsmanship and always competes with fairness and integrity.',
        '[Name] shows great respect for opponents, officials and teammates at all times.',
        '[Name] is a fair and sporting competitor who leads by example.',
        '[Name] handles both success and disappointment with maturity and grace.',
        '[Name] embodies the spirit of fair play and is a role model for others.',
        '[Name] always puts the team and the game first — a true sportsperson.',
      ]),
    },
    {
      name: 'Competitive spirit',
      statements: p3([
        '[Name] has an impressive competitive spirit and always rises to a challenge.',
        '[Name] brings great determination and drive to competitive situations.',
        '[Name] thrives under pressure and performs at their best in competitive environments.',
        '[Name] has a healthy competitive streak that motivates them to give their very best.',
        '[Name] relishes competition and always pushes themselves to improve.',
        '[Name] shows impressive mental strength in competitive situations.',
      ]),
    },
    {
      name: 'Encourages teammates',
      statements: p3([
        '[Name] is an excellent team motivator who encourages and supports those around them.',
        '[Name] lifts the performance of the whole team through their positive encouragement.',
        '[Name] is always first to encourage a teammate and creates a great team spirit.',
        '[Name] leads through encouragement and brings the best out of those around them.',
        '[Name] consistently supports and motivates teammates in training and competition.',
        '[Name] has a natural ability to raise the confidence and performance of others.',
      ]),
    },
    {
      name: 'Physical determination',
      statements: p3([
        '[Name] shows great physical determination and always gives everything in activities.',
        '[Name] pushes themselves physically and never gives less than full effort.',
        '[Name] has impressive physical determination and a refusal to give up.',
        '[Name] demonstrates outstanding commitment and physical effort in all activities.',
        '[Name] always works to their physical limits and inspires others to do the same.',
        '[Name] shows real grit and determination in every physical challenge they face.',
      ]),
    },
  ],
  'English': [
    {
      name: 'Love of reading',
      statements: p3([
        '[Name] has a genuine love of reading that enriches their written and spoken language.',
        '[Name] is an enthusiastic reader whose passion for books enhances all areas of their English work.',
        '[Name] reads widely and this is reflected in the sophistication of their language use.',
        '[Name] demonstrates a real enthusiasm for reading that sets them apart.',
        '[Name] is an avid reader whose love of books informs and improves their own writing.',
        "[Name]'s love of reading is evident in the richness and variety of their language.",
      ]),
    },
    {
      name: 'Articulate speaker',
      statements: p3([
        '[Name] is a highly articulate speaker who expresses ideas with confidence and precision.',
        '[Name] communicates verbally with impressive clarity and maturity.',
        '[Name] is an excellent public speaker who engages and persuades audiences effectively.',
        '[Name] speaks with great confidence and chooses words carefully for maximum impact.',
        '[Name] is one of the most articulate pupils in the class and always expresses ideas clearly.',
        '[Name] demonstrates outstanding verbal communication skills that will serve them well.',
      ]),
    },
  ],
  'Science': [
    {
      name: 'Scientific curiosity',
      statements: p3([
        '[Name] approaches science with genuine curiosity and a desire to understand how things work.',
        '[Name] asks perceptive scientific questions that demonstrate a real love of the subject.',
        '[Name] is naturally curious about the world and this drives their engagement with science.',
        '[Name] demonstrates the kind of scientific curiosity that makes for a true scientist.',
        '[Name] is always asking "why?" and "how?" — the hallmarks of a great scientific mind.',
        '[Name] shows an infectious enthusiasm for scientific discovery.',
      ]),
    },
    {
      name: 'Analytical thinking',
      statements: p3([
        '[Name] demonstrates strong analytical thinking and approaches problems logically.',
        '[Name] analyses evidence carefully and draws well-reasoned conclusions.',
        '[Name] shows impressive analytical ability when interpreting data and experimental results.',
        '[Name] thinks analytically and applies this skill effectively across all areas of science.',
        '[Name] has a sharp analytical mind that allows them to interpret complex information with ease.',
        '[Name] consistently demonstrates high-level analytical thinking in their scientific work.',
      ]),
    },
  ],
  'Maths': [
    {
      name: 'Logical thinking',
      statements: p3([
        '[Name] approaches problems logically and works through solutions in a systematic way.',
        '[Name] demonstrates strong logical thinking and tackles unfamiliar problems with confidence.',
        '[Name] applies logical reasoning effectively when working through mathematical problems.',
        '[Name] has a naturally logical mind that serves them well in mathematical contexts.',
        '[Name] thinks through problems carefully and applies logical reasoning consistently.',
        '[Name] demonstrates impressive mathematical logic and an ability to work systematically.',
      ]),
    },
    {
      name: 'Number confidence',
      statements: p3([
        '[Name] is highly confident working with numbers and applies numerical skills accurately.',
        '[Name] demonstrates strong numerical confidence and works with figures with ease.',
        '[Name] has an impressive confidence with numbers that underpins their success in maths.',
        '[Name] is comfortable working with a wide range of numerical concepts.',
        '[Name] handles numerical tasks with real confidence and consistent accuracy.',
        '[Name] has excellent number sense and applies it effectively in a range of contexts.',
      ]),
    },
  ],
  'Art & Design': [
    {
      name: 'Eye for detail',
      statements: p3([
        '[Name] has a remarkable eye for detail that elevates the quality of their practical work.',
        '[Name] pays close attention to detail in all work, producing outcomes of great precision.',
        "[Name]'s attention to detail is outstanding and sets their work apart.",
        '[Name] notices things others miss and this attention to detail is a real strength.',
        '[Name] approaches work with great care and a meticulous eye for detail.',
        '[Name] has an enviable eye for detail that results in beautifully crafted work.',
      ]),
    },
    {
      name: 'Originality',
      statements: p3([
        '[Name] produces work of genuine originality that reflects a highly individual creative vision.',
        '[Name] is not afraid to take creative risks and this results in strikingly original work.',
        "[Name]'s work stands out for its originality and creative ambition.",
        '[Name] brings a truly original perspective to creative tasks.',
        '[Name] demonstrates creative originality that goes well beyond what is expected.',
        '[Name] has a distinctive creative voice that makes their work instantly recognisable.',
      ]),
    },
  ],
  'Music': [
    {
      name: 'Musical ear',
      statements: p3([
        '[Name] has an excellent musical ear and demonstrates impressive aural awareness.',
        '[Name] picks up musical patterns and nuances quickly, demonstrating a fine musical ear.',
        '[Name] has a natural musical ear that enhances their performance and compositional work.',
        '[Name] listens carefully and responds to music with real sensitivity and understanding.',
        '[Name] demonstrates outstanding aural skills that underpin all aspects of their musicianship.',
        "[Name]'s musical ear is one of their greatest strengths as a musician.",
      ]),
    },
    {
      name: 'Expressive performance',
      statements: p3([
        '[Name] performs with great expression and musicality, bringing pieces to life.',
        '[Name] is an expressive performer who communicates emotion through their playing effectively.',
        "[Name]'s performances are notable for their expressiveness and musical sensitivity.",
        '[Name] goes beyond the notes to deliver performances of real musical depth.',
        '[Name] performs with a maturity and expressiveness that is impressive.',
        '[Name] brings a special quality of expression to their performances that is genuinely moving.',
      ]),
    },
  ],
  'History': [
    {
      name: 'Historical thinking',
      statements: p3([
        '[Name] thinks historically with real sophistication, considering cause, consequence and context.',
        '[Name] demonstrates impressive historical thinking and applies it confidently across topics.',
        '[Name] understands historical concepts deeply and uses them to construct compelling arguments.',
        '[Name] shows the kind of historical thinking that marks out the most able historians.',
        '[Name] approaches history with genuine intellectual rigour and analytical depth.',
        '[Name] engages with historical questions thoughtfully and demonstrates mature historical awareness.',
      ]),
    },
  ],
  'Geography': [
    {
      name: 'Geographical awareness',
      statements: p3([
        '[Name] demonstrates impressive geographical awareness and links ideas across topics with ease.',
        '[Name] shows a broad and detailed geographical knowledge that enriches their work.',
        '[Name] has an excellent spatial and geographical awareness that enhances their understanding.',
        '[Name] makes perceptive geographical connections and demonstrates wide subject knowledge.',
        '[Name] applies geographical concepts confidently and shows real awareness of the wider world.',
        '[Name] demonstrates the kind of geographical awareness that comes from genuine engagement with the subject.',
      ]),
    },
  ],
  'Modern Languages': [
    {
      name: 'Willingness to speak',
      statements: p3([
        '[Name] shows great willingness to speak in the target language and does so with confidence.',
        '[Name] is always willing to attempt oral tasks and embraces speaking practice enthusiastically.',
        "[Name]'s willingness to speak without fear of mistakes is a real asset in language learning.",
        '[Name] volunteers to speak regularly and does so with impressive confidence.',
        '[Name] shows no hesitation when it comes to speaking and this attitude accelerates their progress.',
        '[Name] embraces speaking tasks with enthusiasm and a genuine desire to communicate.',
      ]),
    },
    {
      name: 'Cultural awareness',
      statements: p3([
        '[Name] demonstrates impressive cultural awareness and an appreciation of the wider world.',
        '[Name] shows genuine interest in the culture of the countries whose language they are learning.',
        '[Name] engages with cultural aspects of language learning with real curiosity and enthusiasm.',
        '[Name] understands that language learning goes beyond words and embraces the cultural dimension.',
        '[Name] demonstrates a mature cultural sensitivity that enriches their language learning.',
        '[Name] shows impressive awareness of cultural differences and embraces them with an open mind.',
      ]),
    },
  ],
};

// ─── NEXT STEPS ───────────────────────────────────────────────────────────────

export const NEXT_STEPS_DEFAULT_BUTTONS: string[] = [
  'Consolidate learning',
  'Improve consistency',
  'Independent study',
  'Ask for help',
];

export const NEXT_STEPS_ADDABLE_UNIVERSAL: AddableButton[] = [
  {
    name: 'Revisit key topics',
    statements: p3([
      '[Name] should revisit key topics covered this session to ensure a secure understanding.',
      'Spending time reviewing the main topics from this session will help [Name] consolidate their learning.',
      '[Name] is encouraged to go back over key areas to strengthen their understanding before moving on.',
      'Revisiting core material will help [Name] build a more secure foundation going forward.',
      '[Name] would benefit from spending time reviewing the key concepts from this session.',
      'Going back over the core topics will help [Name] address gaps in their understanding.',
    ]),
  },
  {
    name: 'Practise regularly',
    statements: p3([
      '[Name] should aim to practise regularly between lessons to consolidate their skills.',
      'Regular practice outside of class will help [Name] build the consistency they need to improve.',
      '[Name] is encouraged to set aside time for regular practice to develop their skills further.',
      'Short, regular practice sessions will help [Name] make the progress they are capable of.',
      '[Name] would benefit from building regular practice into their routine.',
      'Consistent practice between lessons will help [Name] reach the level they are capable of.',
    ]),
  },
  {
    name: 'Improve presentation',
    statements: p3([
      '[Name] should focus on improving the presentation of their work to reflect their true ability.',
      'Taking greater care with the presentation of written work will help [Name] make a better impression.',
      '[Name] is encouraged to take more time and care with how work is set out and presented.',
      'Improved presentation will allow [Name]\'s knowledge and ability to come across more clearly.',
      '[Name] should aim to produce work that is as neat and well-presented as possible.',
      'Greater attention to presentation will ensure that [Name]\'s work does justice to their ability.',
    ]),
  },
  {
    name: 'Focus in class',
    statements: p3([
      '[Name] should work on maintaining focus throughout lessons to make the most of learning time.',
      'Staying focused for the full lesson will help [Name] make the progress they are capable of.',
      '[Name] is encouraged to minimise distractions and channel energy into their learning.',
      'Greater focus during lessons will allow [Name] to make the most of every learning opportunity.',
      '[Name] would benefit from working on sustained concentration during tasks.',
      'Improving focus during lessons will make a significant difference to [Name]\'s progress.',
    ]),
  },
  {
    name: 'Meet deadlines',
    statements: p3([
      '[Name] should work on submitting work on time to ensure they do not fall behind.',
      'Meeting deadlines consistently will help [Name] stay on top of their workload.',
      '[Name] is encouraged to plan their time more carefully to ensure work is completed on time.',
      'Submitting work by the deadline is an important habit for [Name] to develop going forward.',
      '[Name] should prioritise meeting deadlines as this will have a positive impact on their progress.',
      'Managing time more effectively to meet deadlines is a key target for [Name] going forward.',
    ]),
  },
  {
    name: 'Take more risks',
    statements: p3([
      '[Name] should be encouraged to take more risks in their learning and back their own judgement.',
      'Taking creative and intellectual risks will help [Name] discover what they are truly capable of.',
      '[Name] is encouraged to step outside their comfort zone and embrace more challenging work.',
      'Being willing to take risks and make mistakes is an important part of learning for [Name].',
      '[Name] should trust themselves more and be willing to attempt more challenging tasks.',
      'Taking more academic risks will help [Name] grow in confidence and ability.',
    ]),
  },
  {
    name: 'Seek feedback',
    statements: p3([
      '[Name] should make use of feedback from teachers to identify areas for improvement.',
      'Acting on feedback promptly will help [Name] address weaknesses and improve quickly.',
      '[Name] is encouraged to seek out feedback and use it to drive their progress.',
      'Making the most of the feedback available will help [Name] continue to develop.',
      '[Name] should actively seek and respond to feedback as part of their approach to learning.',
      'Using feedback effectively is a key next step for [Name] in reaching their potential.',
    ]),
  },
  {
    name: 'Read more widely',
    statements: p3([
      '[Name] is encouraged to read more widely to broaden their knowledge and vocabulary.',
      'Reading beyond the classroom will help [Name] develop a richer understanding of the subject.',
      '[Name] should set aside time for wider reading to support and extend their classroom learning.',
      'Reading more widely will help [Name] develop the background knowledge that enriches their work.',
      '[Name] would benefit from exploring a wider range of reading material to support their studies.',
      'Wider reading will help [Name] develop the depth of knowledge needed to excel.',
    ]),
  },
  {
    name: 'Review notes',
    statements: p3([
      '[Name] should get into the habit of reviewing notes after lessons to consolidate learning.',
      'Regularly going back over notes will help [Name] retain key information more effectively.',
      '[Name] is encouraged to review their notes on a regular basis to keep learning fresh.',
      'Setting aside time to review and organise notes will support [Name]\'s progress considerably.',
      '[Name] should make reviewing their notes a regular part of their learning routine.',
      'Reviewing notes between lessons will help [Name] build a more secure understanding over time.',
    ]),
  },
];

export const NEXT_STEPS_ADDABLE_BY_SUBJECT: Record<string, AddableButton[]> = {
  'PE': [
    {
      name: 'Practise technique',
      statements: p3([
        '[Name] should focus on developing their technical skills through regular and deliberate practice.',
        'Spending time on technical practice will help [Name] become a more consistent and capable performer.',
        '[Name] is encouraged to work on the technical aspects of their performance to reach the next level.',
        'Dedicated technical practice will help [Name] consolidate the skills developed this session.',
        '[Name] should focus on refining their technique to improve the consistency of their performance.',
        'Further technical development will allow [Name] to perform at a higher level.',
      ]),
    },
    {
      name: 'Improve fitness',
      statements: p3([
        '[Name] should focus on developing their physical fitness levels to support performance.',
        'Working on fitness outside of school will help [Name] get more from their PE sessions.',
        '[Name] is encouraged to engage in physical activity regularly to build fitness and stamina.',
        'Improving fitness levels will help [Name] perform more effectively across a range of activities.',
        '[Name] should look to build their fitness levels to support their development as a performer.',
        'Greater physical fitness will allow [Name] to demonstrate their skills more consistently.',
      ]),
    },
    {
      name: 'Study tactics',
      statements: p3([
        '[Name] should develop a deeper understanding of tactics and strategy to improve performance.',
        'Studying the tactical aspects of activities will help [Name] make better decisions under pressure.',
        '[Name] is encouraged to think more carefully about tactics and how they can be applied in context.',
        'A greater understanding of tactical principles will help [Name] contribute more effectively to the team.',
        '[Name] should focus on developing their tactical awareness to reach the next level.',
        'Tactical development is the next step for [Name] in becoming a more complete performer.',
      ]),
    },
  ],
  'English': [
    {
      name: 'Read regularly',
      statements: p3([
        '[Name] should read regularly to develop vocabulary, comprehension and love of language.',
        'Building a regular reading habit will support [Name]\'s progress across all areas of English.',
        '[Name] is encouraged to read a wide variety of texts to broaden their literary experience.',
        'Regular reading is one of the most effective things [Name] can do to improve their English.',
        '[Name] should set aside time each day for reading to accelerate their progress.',
        'Reading more regularly will help [Name] develop the language skills needed to excel.',
      ]),
    },
    {
      name: 'Expand vocabulary',
      statements: p3([
        '[Name] should work on expanding their vocabulary to enhance the quality of their written work.',
        'Building a wider vocabulary will help [Name] express ideas with greater precision and impact.',
        '[Name] is encouraged to note and learn new vocabulary regularly to strengthen their language use.',
        'A wider vocabulary will help [Name] communicate ideas more effectively in both speech and writing.',
        '[Name] should make a conscious effort to learn and use new vocabulary on a regular basis.',
        'Expanding vocabulary is a key next step for [Name] in developing their English skills.',
      ]),
    },
  ],
  'Maths': [
    {
      name: 'Practise calculations',
      statements: p3([
        '[Name] should practise calculations regularly to build speed and accuracy.',
        'Regular calculation practice will help [Name] develop the fluency needed to succeed in maths.',
        '[Name] is encouraged to practise core calculations to build confidence and reduce errors.',
        'Building fluency through regular practice will help [Name] tackle more complex problems.',
        '[Name] should work on developing calculation speed and accuracy through regular practice.',
        'Consistent calculation practice will help [Name] build the foundation they need to progress.',
      ]),
    },
    {
      name: 'Show working clearly',
      statements: p3([
        '[Name] should focus on showing all working clearly to gain full credit for their method.',
        'Setting out working clearly will help [Name] avoid errors and demonstrate their understanding.',
        '[Name] is encouraged to show each step of their working methodically.',
        'Showing working clearly is an important habit for [Name] to develop going forward.',
        '[Name] should make sure all working is clearly shown so that the method is transparent.',
        'Taking care to show all working will help [Name] secure marks even when answers are incorrect.',
      ]),
    },
  ],
  'Science': [
    {
      name: 'Review key concepts',
      statements: p3([
        '[Name] should spend time reviewing the key scientific concepts from this session.',
        'Going back over core concepts will help [Name] consolidate their scientific understanding.',
        '[Name] is encouraged to review the main ideas from each topic to ensure secure understanding.',
        'Regular review of key scientific concepts will help [Name] build a strong knowledge base.',
        '[Name] should prioritise reviewing the fundamental concepts to support future learning.',
        'Revisiting core scientific ideas will help [Name] apply knowledge more confidently.',
      ]),
    },
    {
      name: 'Strengthen practical skills',
      statements: p3([
        '[Name] should focus on developing their practical skills to improve accuracy in the laboratory.',
        'Strengthening practical technique will help [Name] produce more reliable experimental results.',
        '[Name] is encouraged to approach practical work with greater care and attention to procedure.',
        'Further development of practical skills will help [Name] become a more confident scientist.',
        '[Name] should focus on following procedures carefully to improve the quality of practical work.',
        'Improving practical skills will allow [Name] to engage more fully with experimental science.',
      ]),
    },
  ],
};

// ─── AREAS FOR DEVELOPMENT ───────────────────────────────────────────────────

export const DEVELOPMENT_DEFAULT_BUTTONS: string[] = [
  'Attention in class',
  'Consistent effort',
  'Meeting deadlines',
  'Organisation',
];

export const DEVELOPMENT_ADDABLE_UNIVERSAL: AddableButton[] = [
  {
    name: 'Homework completion',
    statements: p3([
      '[Name] needs to improve their homework completion rate to support their progress.',
      'Completing homework consistently is an important target for [Name] going forward.',
      '[Name] should prioritise completing homework tasks to reinforce classroom learning.',
      'Homework completion has been inconsistent and this is an area [Name] needs to address.',
      '[Name] would benefit from developing a more reliable approach to completing homework.',
      'Improving homework completion will help [Name] consolidate learning outside the classroom.',
    ]),
  },
  {
    name: 'Focus during tasks',
    statements: p3([
      '[Name] needs to develop the ability to maintain focus throughout tasks.',
      'Sustaining concentration for the full duration of tasks is a key area of development for [Name].',
      '[Name] would benefit from working on maintaining focus when completing extended tasks.',
      'Developing greater focus during independent work is an important target for [Name].',
      '[Name] should work on avoiding distractions and maintaining focus throughout lessons.',
      'Improving focus and concentration during tasks will have a significant impact on [Name]\'s progress.',
    ]),
  },
  {
    name: 'Confidence',
    statements: p3([
      '[Name] should work on building confidence in their own ability.',
      'Developing greater self-belief will help [Name] take on more challenging work.',
      '[Name] has the ability to succeed and needs to develop confidence in their own skills.',
      'Building confidence is a key area of development that will help [Name] reach their potential.',
      '[Name] is capable of more than they currently believe and should trust themselves more.',
      'Developing confidence will allow [Name] to engage more fully with challenging tasks.',
    ]),
  },
  {
    name: 'Asking for help',
    statements: p3([
      '[Name] should feel more confident about asking for help when they find something difficult.',
      'Seeking support when needed is an important habit for [Name] to develop.',
      '[Name] is encouraged to ask for help rather than struggling in silence.',
      'Developing the confidence to ask for support will help [Name] address gaps more quickly.',
      '[Name] should make better use of the support available to them.',
      'Being willing to ask for help is an important part of learning that [Name] should embrace.',
    ]),
  },
  {
    name: 'Note taking',
    statements: p3([
      '[Name] should develop their note-taking skills to better support their learning.',
      'Improving the quality of notes taken in class will help [Name] review and revise more effectively.',
      '[Name] would benefit from developing a more systematic approach to taking notes.',
      'Better note-taking will help [Name] retain information and prepare more effectively for assessments.',
      '[Name] should work on capturing key information from lessons more consistently.',
      'Developing stronger note-taking habits will support [Name]\'s learning and revision.',
    ]),
  },
  {
    name: 'Exam technique',
    statements: p3([
      '[Name] should focus on developing their exam technique to ensure performance reflects ability.',
      'Improving exam technique is a key area of development that will help [Name] achieve their potential.',
      '[Name] would benefit from practising exam-style questions to develop confidence under pressure.',
      'Working on exam technique will help [Name] convert their knowledge into marks more effectively.',
      '[Name] should practise answering questions under timed conditions to improve exam performance.',
      'Developing stronger exam technique will help [Name] perform more consistently in assessments.',
    ]),
  },
  {
    name: 'Working independently',
    statements: p3([
      '[Name] should work on developing greater independence in their learning.',
      'Building independence is a key target for [Name] — they are capable of working with less support.',
      '[Name] should aim to attempt tasks independently before seeking help.',
      'Developing the confidence to work independently will help [Name] grow as a learner.',
      '[Name] is encouraged to take more initiative and work through challenges independently.',
      'Greater independence will help [Name] develop the self-reliance needed to succeed.',
    ]),
  },
  {
    name: 'Managing time',
    statements: p3([
      '[Name] should work on managing their time more effectively to stay on top of their workload.',
      'Better time management will help [Name] complete tasks to a higher standard.',
      '[Name] would benefit from planning their time more carefully, particularly when deadlines are approaching.',
      'Developing stronger time management skills is an important target for [Name].',
      '[Name] should work on prioritising tasks and managing time more effectively.',
      'Improving time management will help [Name] reduce pressure and produce better work.',
    ]),
  },
];

export const DEVELOPMENT_ADDABLE_BY_SUBJECT: Record<string, AddableButton[]> = {
  'PE': [
    {
      name: 'Physical fitness',
      statements: p3([
        '[Name] needs to develop their physical fitness levels to engage fully with all activities.',
        'Improving fitness is a key development area that will support [Name]\'s performance.',
        '[Name] should work on building fitness outside of school to improve their capability in PE.',
        'Greater physical fitness will allow [Name] to participate more fully and effectively.',
        '[Name]\'s physical fitness levels need attention in order to access more challenging activities.',
        'Improving physical fitness is a priority for [Name] in order to reach their potential in PE.',
      ]),
    },
    {
      name: 'Tactical awareness',
      statements: p3([
        '[Name] needs to develop their tactical awareness to make better decisions in competitive situations.',
        'Improving tactical understanding is an important development area for [Name].',
        '[Name] should work on understanding tactics and how to apply them in different contexts.',
        'Greater tactical awareness will help [Name] become a more effective team player.',
        '[Name] needs to develop the ability to read situations and make better tactical choices.',
        'Developing tactical awareness is a key next step for [Name] in PE.',
      ]),
    },
  ],
  'English': [
    {
      name: 'Written accuracy',
      statements: p3([
        '[Name] needs to focus on improving accuracy in written work, particularly spelling and punctuation.',
        'Reducing errors in written work is an important development area for [Name].',
        '[Name] should take more time to proofread written work to improve accuracy.',
        'Improving written accuracy will allow [Name]\'s ideas to come across more effectively.',
        '[Name] needs to develop greater care and precision in their written work.',
        'Addressing errors in written work is a key priority for [Name] going forward.',
      ]),
    },
  ],
  'Maths': [
    {
      name: 'Showing working',
      statements: p3([
        '[Name] needs to show working more clearly in order to gain full credit for their method.',
        'Setting out working methodically is an important development area for [Name].',
        '[Name] should focus on presenting solutions clearly with all steps shown.',
        'Showing working clearly is essential for [Name] to demonstrate their mathematical understanding.',
        '[Name] needs to develop the habit of setting out all working systematically.',
        'Clearer working will help [Name] secure more marks and communicate their thinking better.',
      ]),
    },
  ],
  'Science': [
    {
      name: 'Lab technique',
      statements: p3([
        '[Name] needs to develop greater care and precision in practical work.',
        'Improving laboratory technique is an important development area for [Name].',
        '[Name] should focus on following experimental procedures more carefully.',
        'Greater care in the laboratory will help [Name] produce more reliable and accurate results.',
        '[Name] needs to develop a more methodical approach to practical tasks.',
        'Improving practical technique will help [Name] engage more confidently with experimental work.',
      ]),
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// UNIVERSAL SECTIONS
// Core sections included in every template.
// Each button has 6 statements; p3() picks 3 randomly at build time.
// ─────────────────────────────────────────────────────────────────────────────

export function buildUniversalSections(): TemplateSection[] {
  return [
    // 1. Progress — rated-comment
    {
      id: makeId(),
      type: 'rated-comment',
      name: 'Progress',
      data: {
        comments: {
          excellent: p3([
            '[Name] has made excellent progress this session and is performing at a high level.',
            '[Name] has demonstrated outstanding progress and consistently exceeds expectations.',
            '[Name] has made remarkable progress this year and is to be commended for their achievements.',
            '[Name] has made exceptional progress and is working well above the expected level.',
            '[Name] has progressed tremendously this session and is producing work of the highest quality.',
            '[Name] has made superb progress and continues to set the standard for the rest of the class.',
          ]),
          good: p3([
            '[Name] has made good progress this session and is working well.',
            '[Name] has shown pleasing progress and continues to develop their skills effectively.',
            '[Name] has made solid progress throughout the year and is building on their strengths.',
            '[Name] has made good progress and is meeting the expected standard with confidence.',
            '[Name] is making good progress and demonstrates a solid understanding of the course.',
            '[Name] has progressed well this session and is developing into a capable and confident learner.',
          ]),
          satisfactory: p3([
            '[Name] has made satisfactory progress this session.',
            '[Name] has made reasonable progress, though there is room for further improvement.',
            '[Name] is making steady progress and with continued effort will continue to improve.',
            '[Name] has made adequate progress this session and is meeting the basic requirements of the course.',
            '[Name] is progressing at a satisfactory rate and is encouraged to push themselves further.',
            '[Name] has made reasonable progress, and with greater consistency could achieve more.',
          ]),
          needsImprovement: p3([
            '[Name] has made limited progress this session and needs to apply greater effort.',
            '[Name] has found aspects of the course challenging and progress has been slower than expected.',
            '[Name] has not yet made the progress expected and should focus on consistent effort going forward.',
            '[Name] has struggled to make the expected progress this session and needs additional support.',
            '[Name] needs to refocus their efforts in order to make the progress they are capable of.',
            '[Name] has made less progress than expected and should speak to their teacher for additional support.',
          ]),
        },
        addableButtons: [
          {
            name: 'Poor Attendance',
            statements: p3([
              '[Name]\'s attendance has had an impact on their progress this session and catching up on missed work will be important going forward.',
              'Attendance has been a concern this session and has affected [Name]\'s ability to consolidate their learning.',
              '[Name] has missed a significant amount of learning time this session and is encouraged to prioritise attendance in order to reach their potential.',
              'Irregular attendance has made it difficult for [Name] to make the expected progress this session.',
              '[Name]\'s progress has been hindered by attendance issues and improving this will be essential going forward.',
              'Due to absence, [Name] has found it difficult to keep up with the pace of the course and is encouraged to address this.',
            ]),
          },
        ],
      },
    },

    // 2. Effort & Application — rated-comment
    {
      id: makeId(),
      type: 'rated-comment',
      name: 'Effort & Application',
      data: {
        comments: {
          excellent: p3([
            '[Name] consistently applies excellent effort to all tasks and always gives their best.',
            '[Name] demonstrates a commendable work ethic and approaches every task with great enthusiasm.',
            '[Name] is a highly motivated pupil who consistently puts in excellent effort.',
            '[Name] brings outstanding effort and commitment to every aspect of their work.',
            '[Name] gives maximum effort in all tasks and this is reflected in the quality of their work.',
            '[Name] is one of the hardest-working pupils in the class and this is greatly appreciated.',
          ]),
          good: p3([
            '[Name] applies good effort to tasks and engages positively with learning.',
            '[Name] shows a willing attitude and generally applies themselves well to their work.',
            '[Name] works with good effort and maintains a positive approach to tasks.',
            '[Name] is a willing worker who puts in good effort and engages positively with the course.',
            '[Name] applies themselves well to tasks and produces work that reflects good effort.',
            '[Name] works hard and engages positively with the learning process.',
          ]),
          satisfactory: p3([
            '[Name] applies satisfactory effort to tasks, though greater consistency would be beneficial.',
            '[Name] shows reasonable effort but would benefit from applying themselves more consistently.',
            '[Name] puts in adequate effort, though more sustained application would help them reach their potential.',
            '[Name] applies satisfactory effort but has the ability to do more when they put their mind to it.',
            '[Name] makes reasonable effort but there are times when greater application is needed.',
            '[Name] shows adequate effort though greater consistency would significantly improve outcomes.',
          ]),
          needsImprovement: p3([
            '[Name] needs to apply greater effort to tasks in order to reach their potential.',
            '[Name] could achieve more by focusing on applying consistent effort to all areas of the course.',
            '[Name] would benefit from a more determined approach to their work.',
            '[Name] needs to demonstrate a more consistent level of effort and commitment.',
            '[Name] has the ability to do much better and needs to apply themselves with greater determination.',
            '[Name] needs to refocus and bring greater effort to their work going forward.',
          ]),
        },
      },
    },

    // 3. Behaviour & Attitude — qualities
    {
      id: makeId(),
      type: 'qualities',
      name: 'Behaviour & Attitude',
      data: {
        comments: {
          'Positive attitude': p3([
            '[Name] displays a positive attitude and is a pleasure to have in class.',
            '[Name] approaches learning with enthusiasm and contributes positively to the class.',
            '[Name] is a motivated and positive member of the class.',
            '[Name] consistently brings a positive and constructive attitude to all aspects of their work.',
            '[Name] is a pleasure to teach and always brings a positive energy to the classroom.',
            '[Name] approaches every lesson with enthusiasm and a willingness to engage.',
          ]),
          'Behaviour': p3([
            '[Name] demonstrates excellent behaviour and always conducts themselves appropriately.',
            '[Name] behaves impeccably and sets a fine example to their peers.',
            '[Name] is respectful and well-mannered at all times.',
            '[Name] is a model of good behaviour and a credit to the school.',
            '[Name] always behaves with maturity and consideration for others.',
            '[Name] consistently demonstrates the kind of behaviour that makes learning possible for everyone.',
          ]),
          'Contribution to class': p3([
            '[Name] makes a valuable contribution to class discussions and activities.',
            '[Name] actively participates in lessons and enriches the learning environment.',
            '[Name] is always willing to contribute and supports others in their learning.',
            '[Name] enriches the classroom through their enthusiasm and willingness to participate.',
            '[Name] brings energy and thoughtfulness to class activities and discussions.',
            '[Name] contributes meaningfully to lessons and helps create a positive learning environment.',
          ]),
        },
      },
    },

    // 4. Homework — qualities
    {
      id: makeId(),
      type: 'qualities',
      name: 'Homework',
      data: {
        comments: {
          'Completion': p3([
            '[Name] consistently completes homework tasks and submits them on time.',
            '[Name] reliably completes all homework set and demonstrates commitment outside the classroom.',
            '[Name] has an excellent homework record and always meets expectations.',
            '[Name] always completes homework to a high standard and submits it promptly.',
            '[Name] is diligent in completing homework and this dedication is reflected in their progress.',
            '[Name] has a perfect homework record and this commitment is greatly appreciated.',
          ]),
          'Quality': p3([
            '[Name] produces homework of a high standard that reflects considerable effort.',
            '[Name] consistently submits homework that is well-presented and carefully completed.',
            '[Name] takes care with homework tasks and the quality of work submitted is commendable.',
            '[Name] produces homework that genuinely reflects their ability and dedication.',
            '[Name]\'s homework is always of a high quality and demonstrates real effort outside the classroom.',
            '[Name] consistently submits homework that goes above and beyond what is expected.',
          ]),
          'Meets deadlines': p3([
            '[Name] always meets homework deadlines and manages their time effectively.',
            '[Name] is reliable in submitting homework on time and takes responsibility for their learning.',
            '[Name] consistently meets all deadlines and demonstrates excellent time management.',
            '[Name] never misses a deadline and this reliability is a real strength.',
            '[Name] is always punctual in submitting work and manages their time with great efficiency.',
            '[Name] demonstrates excellent time management by consistently meeting all homework deadlines.',
          ]),
        },
      },
    },

    // new-line
    { id: makeId(), type: 'new-line', name: '', data: {} },

    // 5. Strengths — qualities (uses default buttons from STRENGTHS_DEFAULT_BUTTONS)
    {
      id: makeId(),
      type: 'qualities',
      name: 'Strengths',
      data: {
        comments: buildStrengthsDefaultComments(),
      },
    },

    // new-line
    { id: makeId(), type: 'new-line', name: '', data: {} },

    // 6. Next Steps — next-steps (uses default buttons from NEXT_STEPS_DEFAULT_BUTTONS)
    {
      id: makeId(),
      type: 'next-steps',
      name: 'Next Steps',
      data: {
        focusAreas: buildNextStepsDefaultFocusAreas(),
      },
    },

    // 7. Optional additional comment
    {
      id: makeId(),
      type: 'optional-additional-comment',
      name: 'Additional Comments',
      data: {},
    },
  ];
}

// Build default Strengths comments from the universal pool
function buildStrengthsDefaultComments(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  const allButtons = [...STRENGTHS_ADDABLE_UNIVERSAL];
  for (const name of STRENGTHS_DEFAULT_BUTTONS) {
    const found = allButtons.find(b => b.name === name);
    if (found) {
      result[name] = found.statements;
    } else {
      // Generate inline for the default ones not in addable list
      result[name] = p3(getDefaultStrengthStatements(name));
    }
  }
  return result;
}

function getDefaultStrengthStatements(name: string): string[] {
  const map: Record<string, string[]> = {
    'Confident': [
      '[Name] approaches all tasks with great confidence and self-belief.',
      '[Name] is a confident learner who backs their own ability and inspires those around them.',
      '[Name] tackles challenges with confidence and never shies away from difficult tasks.',
      '[Name] demonstrates impressive confidence both in class activities and in their independent work.',
      '[Name] is a naturally confident pupil who engages with all aspects of the course assuredly.',
      '[Name]\'s confidence is one of their greatest strengths and serves them well in all areas.',
    ],
    'Works well with others': [
      '[Name] works exceptionally well with others and is a valued member of any group.',
      '[Name] collaborates effectively with classmates and always contributes positively to group work.',
      '[Name] is an excellent team player who brings out the best in those around them.',
      '[Name] works brilliantly with others and consistently puts the needs of the group first.',
      '[Name] thrives in collaborative settings and makes a genuine contribution to group tasks.',
      '[Name] is a wonderful collaborator who listens to others and shares ideas generously.',
    ],
    'Leadership': [
      '[Name] demonstrates natural leadership qualities and motivates others effectively.',
      '[Name] takes on a leadership role confidently and helps to organise and guide the group.',
      '[Name] is an inspiring leader who leads by example and brings out the best in others.',
      '[Name] shows impressive leadership ability and is looked up to by peers.',
      '[Name] has a natural authority that makes them an effective leader in group situations.',
      '[Name] leads with confidence and maturity, setting a great example for others to follow.',
    ],
    'Reliable': [
      '[Name] is an extremely reliable pupil who can always be counted on to deliver.',
      '[Name] is consistently reliable and always follows through on commitments.',
      '[Name] is dependable in all situations and this reliability is a real asset.',
      '[Name] can always be relied upon to do what is asked of them to the best of their ability.',
      '[Name] is one of the most reliable members of the class and sets a great example.',
      '[Name] demonstrates impressive reliability and consistency in everything they do.',
    ],
    'Positive attitude': [
      '[Name] consistently brings a positive attitude to all aspects of their learning.',
      '[Name] approaches every lesson with enthusiasm and a genuine desire to learn.',
      '[Name] has an infectious positive attitude that benefits everyone around them.',
      '[Name] is a pleasure to teach and always brings a positive energy to the classroom.',
      '[Name] maintains a positive outlook even when faced with challenges.',
      '[Name]\'s positive attitude makes a real difference to the atmosphere of the class.',
    ],
  };
  return map[name] || [
    `[Name] demonstrates impressive ${name.toLowerCase()} skills.`,
    `[Name]'s ${name.toLowerCase()} is a real asset to the class.`,
    `[Name] consistently demonstrates ${name.toLowerCase()} in all areas of their work.`,
    `[Name] shows excellent ${name.toLowerCase()} and this has a positive impact on their learning.`,
    `[Name]'s ${name.toLowerCase()} is one of their greatest strengths.`,
    `[Name] demonstrates admirable ${name.toLowerCase()} that sets a great example to others.`,
  ];
}

// Build default Next Steps focus areas
function buildNextStepsDefaultFocusAreas(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const name of NEXT_STEPS_DEFAULT_BUTTONS) {
    const found = NEXT_STEPS_ADDABLE_UNIVERSAL.find(b => b.name === name);
    if (found) result[name] = found.statements;
  }
  return result;
}

// Build default Areas for Development focus areas
function buildDevelopmentDefaultFocusAreas(): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const name of DEVELOPMENT_DEFAULT_BUTTONS) {
    const found = DEVELOPMENT_ADDABLE_UNIVERSAL.find(b => b.name === name);
    if (found) result[name] = found.statements;
  }
  return result;
}

// ─── SUBJECT EXTRAS ───────────────────────────────────────────────────────────

export interface SubjectExtra {
  id: string;
  label: string;
  section: Omit<TemplateSection, 'id'>;
}

export const SUBJECT_EXTRAS: Record<string, SubjectExtra[]> = {

  'PE': [
    {
      id: 'pe_skills',
      label: 'Physical Skills',
      section: {
        type: 'rated-comment',
        name: 'Physical Skills',
        data: {
          comments: {
            excellent: p3(['[Name] demonstrates excellent technical skills and applies them with confidence and accuracy.', '[Name] has highly developed physical skills and performs with great precision and control.', '[Name] is technically outstanding and applies skills effectively in all contexts.', '[Name] performs physical skills at an excellent level and does so consistently.', '[Name] demonstrates superb technical ability across a range of activities.', '[Name] has mastered the technical skills of the course and applies them with real flair.']),
            good: p3(['[Name] demonstrates good technical skills and is able to apply them effectively in context.', '[Name] has developed sound physical skills and continues to refine their technique.', '[Name] performs skills well and is developing greater consistency.', '[Name] demonstrates good physical ability and applies skills effectively in most situations.', '[Name] has solid technical skills and uses them confidently.', '[Name] performs well technically and is developing greater precision.']),
            satisfactory: p3(['[Name] is developing their physical skills at a satisfactory rate.', '[Name] demonstrates adequate technical skills though continued practice will be beneficial.', '[Name] has a satisfactory level of physical skill and is working to improve consistency.', '[Name] performs at a satisfactory level technically and is encouraged to continue developing.', '[Name] is making satisfactory progress in developing the physical skills required.', '[Name] demonstrates reasonable technical ability that will improve with further practice.']),
            needsImprovement: p3(['[Name] needs to focus on developing their technical skills further through regular practice.', '[Name] would benefit from dedicating more time to practising the core skills of the course.', '[Name] needs to work on their physical skills to reach the required level.', '[Name] is struggling with some of the technical demands of the course and needs additional practice.', '[Name] needs to focus on the fundamentals of the physical skills required.', '[Name] would benefit from extra practice to develop the technical skills needed.']),
          },
        },
      },
    },
    {
      id: 'pe_fitness',
      label: 'Fitness & Physical Development',
      section: {
        type: 'rated-comment',
        name: 'Fitness & Physical Development',
        data: {
          comments: {
            excellent: p3(['[Name] demonstrates an excellent level of physical fitness and applies it effectively across activities.', '[Name] has a superb level of fitness and uses it to great advantage in all areas of PE.', '[Name] is physically outstanding and their fitness underpins their excellent performance.', '[Name] demonstrates exceptional fitness levels that allow them to perform at the highest level.', '[Name] has developed impressive physical fitness that enhances all aspects of their performance.', '[Name] is in excellent physical condition and this is clearly reflected in their performance.']),
            good: p3(['[Name] demonstrates a good level of physical fitness and engages fully with all activities.', '[Name] has a pleasing level of fitness and applies it well across a range of activities.', '[Name] is in good physical condition and this supports their performance effectively.', '[Name] demonstrates a good level of fitness that allows them to engage fully with all tasks.', '[Name] has a solid fitness base that enables them to perform well across activities.', '[Name]\'s fitness level is good and this contributes positively to their overall performance.']),
            satisfactory: p3(['[Name] demonstrates a satisfactory level of physical fitness.', '[Name] has an adequate level of fitness for the demands of the course.', '[Name]\'s fitness is at a satisfactory level for the activities undertaken.', '[Name] demonstrates an adequate level of fitness though improvement would enhance performance.', '[Name]\'s physical fitness is satisfactory and with further development could improve considerably.', '[Name] meets the basic fitness requirements but would benefit from further physical development.']),
            needsImprovement: p3(['[Name] would benefit from working on their physical fitness levels to support performance.', '[Name] should focus on developing their fitness in order to fully engage with all activities.', '[Name]\'s fitness levels need improvement to meet the demands of the course.', '[Name] needs to prioritise physical fitness development to support their performance.', '[Name] would benefit significantly from improving their fitness levels.', '[Name] needs to work on their physical fitness to access the full range of activities.']),
          },
        },
      },
    },
    {
      id: 'pe_teamwork',
      label: 'Team Contribution',
      section: {
        type: 'qualities',
        name: 'Team Contribution',
        data: {
          comments: {
            'Team player': p3(['[Name] is an excellent team player who supports and encourages those around them.', '[Name] contributes positively to group activities and works well with all members of the class.', '[Name] is a valued member of any team and consistently puts the group first.', '[Name] is an outstanding team player who brings out the best in those around them.', '[Name] thrives in team situations and makes a genuinely positive contribution to the group.', '[Name] is selfless in their approach to team activities and consistently puts others first.']),
            'Leadership': p3(['[Name] shows natural leadership qualities and motivates others effectively.', '[Name] takes on a leadership role confidently and helps to organise and guide the team.', '[Name] is an inspiring team leader who leads by example.', '[Name] demonstrates impressive leadership in team situations and earns the respect of peers.', '[Name] leads with confidence and maturity in team activities.', '[Name] has a natural ability to organise and motivate a team effectively.']),
          },
        },
      },
    },
  ],

  'English': [
    {
      id: 'eng_reading',
      label: 'Reading',
      section: {
        type: 'rated-comment',
        name: 'Reading',
        data: {
          comments: {
            excellent: p3(['[Name] is an excellent reader who engages critically and perceptively with texts.', '[Name] demonstrates outstanding reading comprehension and analyses texts with great insight.', '[Name] reads with exceptional understanding and engages with texts at the deepest level.', '[Name] is a superb reader whose analytical responses demonstrate impressive depth of understanding.', '[Name] approaches texts with remarkable insight and produces perceptive and well-argued responses.', '[Name] demonstrates outstanding reading ability and engages with texts in a highly sophisticated way.']),
            good: p3(['[Name] reads with good understanding and is able to draw valid conclusions from texts.', '[Name] demonstrates solid reading skills and engages thoughtfully with a range of texts.', '[Name] is a competent and engaged reader who produces well-considered responses.', '[Name] demonstrates good reading comprehension and engages effectively with a range of texts.', '[Name] reads with confidence and produces thoughtful, well-developed responses.', '[Name] shows good understanding of texts and is developing the ability to analyse them more deeply.']),
            satisfactory: p3(['[Name] demonstrates satisfactory reading ability and engages adequately with set texts.', '[Name] reads with reasonable understanding though deeper analysis would be beneficial.', '[Name] shows adequate reading comprehension and is developing their analytical skills.', '[Name] engages satisfactorily with reading tasks and is encouraged to develop greater depth of analysis.', '[Name] demonstrates reasonable reading ability and is developing confidence in responding to texts.', '[Name] reads with satisfactory understanding though there is room to develop more analytical responses.']),
            needsImprovement: p3(['[Name] would benefit from reading more widely in order to develop confidence and comprehension.', '[Name] needs to develop their ability to analyse and interpret texts more thoroughly.', '[Name] is finding reading comprehension challenging and would benefit from additional support.', '[Name] needs to develop greater confidence in engaging analytically with texts.', '[Name] would benefit from wider reading to develop the skills needed to respond to texts effectively.', '[Name] is working on developing the reading skills needed to engage more fully with the course.']),
          },
        },
      },
    },
    {
      id: 'eng_writing',
      label: 'Writing',
      section: {
        type: 'rated-comment',
        name: 'Writing',
        data: {
          comments: {
            excellent: p3(['[Name] produces writing of an excellent standard, demonstrating flair, accuracy and sophistication.', '[Name] is a highly skilled writer who crafts well-structured and engaging pieces.', '[Name] writes with exceptional quality, combining technical accuracy with real flair and originality.', '[Name] produces outstanding written work that demonstrates a highly developed writing style.', '[Name] is a talented writer who consistently produces work of the highest quality.', '[Name] writes with impressive sophistication and produces work that is a pleasure to read.']),
            good: p3(['[Name] produces well-structured written work and writes with good accuracy and expression.', '[Name] demonstrates good writing skills and communicates ideas clearly and effectively.', '[Name] writes competently and produces work that is well-organised and clearly expressed.', '[Name] demonstrates good writing ability and is developing a more confident personal style.', '[Name] produces good quality written work and engages positively with a range of writing tasks.', '[Name] writes with good accuracy and structure and is developing their skills further.']),
            satisfactory: p3(['[Name] produces written work of a satisfactory standard with reasonable accuracy.', '[Name] writes with adequate expression though further development of style would be beneficial.', '[Name] demonstrates satisfactory writing skills and is working to improve accuracy and expression.', '[Name] produces satisfactory written work and is encouraged to develop a more confident style.', '[Name] writes at a satisfactory level and is developing their technical accuracy.', '[Name] demonstrates adequate writing ability and is working towards greater fluency and accuracy.']),
            needsImprovement: p3(['[Name] needs to focus on developing accuracy and structure in written work.', '[Name] would benefit from practising different forms of writing to build confidence and skill.', '[Name] needs to develop greater accuracy and control in their written work.', '[Name] is working on developing the writing skills needed to meet the demands of the course.', '[Name] would benefit from focusing on technical accuracy to improve the quality of written work.', '[Name] needs to develop more consistent accuracy and better organisation in extended writing.']),
          },
        },
      },
    },
  ],

  'Maths': [
    {
      id: 'maths_numeracy',
      label: 'Numeracy Skills',
      section: {
        type: 'rated-comment',
        name: 'Numeracy Skills',
        data: {
          comments: {
            excellent: p3(['[Name] demonstrates excellent numeracy skills and works with numbers accurately and confidently.', '[Name] has a strong grasp of numeracy and applies mathematical skills with great precision.', '[Name] demonstrates outstanding numerical ability and handles complex calculations with ease.', '[Name] has exceptional numeracy skills and applies them confidently across all areas of the course.', '[Name] is highly numerate and demonstrates impressive accuracy and fluency with numbers.', '[Name] demonstrates excellent number sense and applies numerical skills with great confidence.']),
            good: p3(['[Name] demonstrates good numeracy skills and works with reasonable accuracy.', '[Name] has a sound grasp of number work and applies skills effectively.', '[Name] is confident with numbers and demonstrates good numerical fluency.', '[Name] demonstrates good numeracy and applies skills accurately in most situations.', '[Name] has solid numeracy skills that underpin their performance across the course.', '[Name] works with numbers competently and demonstrates good mathematical fluency.']),
            satisfactory: p3(['[Name] demonstrates satisfactory numeracy skills with some areas still developing.', '[Name] has an adequate understanding of number work though further practice would be beneficial.', '[Name] is developing their numeracy skills at a satisfactory rate.', '[Name] demonstrates adequate numerical ability and is working to build greater fluency.', '[Name]\'s numeracy is satisfactory and will improve with regular practice.', '[Name] meets the basic numeracy requirements but would benefit from additional practice.']),
            needsImprovement: p3(['[Name] needs to focus on developing core numeracy skills, particularly through regular practice.', '[Name] would benefit from spending time consolidating fundamental number skills.', '[Name] is finding some aspects of numeracy challenging and would benefit from further support.', '[Name] needs to work on developing the numerical fluency needed for the course.', '[Name] would benefit from regular practice to build confidence and accuracy with numbers.', '[Name] needs to address gaps in numeracy to access the more demanding aspects of the course.']),
          },
        },
      },
    },
  ],

  'Science': [
    {
      id: 'sci_practical',
      label: 'Practical Skills',
      section: {
        type: 'rated-comment',
        name: 'Practical Skills',
        data: {
          comments: {
            excellent: p3(['[Name] demonstrates excellent practical skills and conducts experiments with great care and precision.', '[Name] is highly skilled in the laboratory and approaches practical work with confidence and accuracy.', '[Name] demonstrates outstanding practical ability and handles equipment with great skill.', '[Name] conducts practical work to an excellent standard and produces reliable and accurate results.', '[Name] is an exceptional practical scientist who approaches experimental work with real precision.', '[Name] demonstrates superb practical skills and engages with laboratory work at the highest level.']),
            good: p3(['[Name] demonstrates good practical skills and engages positively with experimental work.', '[Name] works carefully in practical sessions and handles equipment with confidence.', '[Name] demonstrates good laboratory skills and follows procedures carefully.', '[Name] approaches practical work with care and produces work of a good standard.', '[Name] is a competent practical scientist who engages confidently with experimental tasks.', '[Name] demonstrates good practical ability and is developing their technique further.']),
            satisfactory: p3(['[Name] demonstrates satisfactory practical skills and is developing their laboratory technique.', '[Name] engages adequately with practical work, though greater care and precision would be beneficial.', '[Name] has satisfactory practical skills and is working to improve their technique.', '[Name] approaches practical work at a satisfactory level and is encouraged to take greater care.', '[Name] demonstrates adequate practical ability and is developing confidence in the laboratory.', '[Name] meets the basic practical requirements and is encouraged to develop greater precision.']),
            needsImprovement: p3(['[Name] needs to focus on developing their practical skills and taking greater care in the laboratory.', '[Name] would benefit from approaching experimental work with more precision and attention to procedure.', '[Name] needs to develop their laboratory technique to engage more effectively with practical work.', '[Name] is finding practical work challenging and would benefit from additional guidance.', '[Name] needs to take greater care with practical procedures to improve the reliability of results.', '[Name] would benefit from more careful attention to procedure and safety in practical sessions.']),
          },
        },
      },
    },
  ],

  'History': [
    {
      id: 'hist_writing',
      label: 'Extended Writing',
      section: {
        type: 'rated-comment',
        name: 'Extended Writing',
        data: {
          comments: {
            excellent: p3(['[Name] produces extended writing of an excellent standard, with well-structured arguments supported by detailed evidence.', '[Name] writes analytically and persuasively, demonstrating excellent command of historical knowledge.', '[Name] produces outstanding extended writing that combines analytical depth with sophisticated expression.', '[Name] constructs extended arguments of the highest quality, supported by precise and well-selected evidence.', '[Name] demonstrates exceptional extended writing ability and produces work of a very high standard.', '[Name] writes extended responses with impressive skill, clarity and analytical depth.']),
            good: p3(['[Name] produces well-structured extended writing and supports points with relevant evidence.', '[Name] writes with good analytical skill and develops arguments effectively.', '[Name] demonstrates good extended writing ability and constructs well-organised arguments.', '[Name] produces solid extended writing that is well-structured and supported by good evidence.', '[Name] writes extended responses competently and is developing greater analytical depth.', '[Name] demonstrates good ability in extended writing and is developing a more confident argumentative style.']),
            satisfactory: p3(['[Name] produces extended writing of a satisfactory standard with reasonable structure.', '[Name] is developing their ability to construct and sustain historical arguments in writing.', '[Name] writes at a satisfactory level in extended tasks and is encouraged to develop greater depth.', '[Name] demonstrates adequate extended writing ability and is working on developing stronger arguments.', '[Name] produces satisfactory extended writing and is developing their use of evidence.', '[Name] meets the basic requirements for extended writing and is encouraged to develop greater analytical skill.']),
            needsImprovement: p3(['[Name] needs to focus on structuring extended writing more effectively and supporting points with evidence.', '[Name] would benefit from practising analytical writing to develop confidence and skill.', '[Name] needs to develop the ability to construct and sustain extended arguments more effectively.', '[Name] is finding extended writing challenging and would benefit from additional support and practice.', '[Name] needs to work on using evidence more effectively to support their historical arguments.', '[Name] would benefit from focusing on essay structure and analytical technique in extended writing.']),
          },
        },
      },
    },
  ],

  'Geography': [
    {
      id: 'geog_case_studies',
      label: 'Case Study Knowledge',
      section: {
        type: 'rated-comment',
        name: 'Case Study Knowledge',
        data: {
          comments: {
            excellent: p3(['[Name] demonstrates an excellent knowledge of case studies and applies them with great confidence.', '[Name] uses case study evidence with skill and precision to support geographical arguments.', '[Name] has an outstanding knowledge of case studies and deploys them effectively in all contexts.', '[Name] demonstrates exceptional case study knowledge and uses it to support sophisticated arguments.', '[Name] applies case study knowledge with impressive precision and detail.', '[Name] has a superb command of case study material and uses it to great effect.']),
            good: p3(['[Name] demonstrates a good knowledge of case studies and references them effectively.', '[Name] uses case study evidence well to support and develop geographical points.', '[Name] has a sound knowledge of case studies and applies them competently.', '[Name] references case studies with good accuracy and uses them to support arguments effectively.', '[Name] demonstrates good case study knowledge and is developing the ability to apply it more precisely.', '[Name] uses case study material well and is developing greater precision in their application.']),
            satisfactory: p3(['[Name] demonstrates satisfactory knowledge of case studies though more detailed use would be beneficial.', '[Name] is developing their ability to apply case study knowledge to support geographical arguments.', '[Name] has a satisfactory knowledge of case studies and is working to develop more detailed application.', '[Name] uses case studies at a satisfactory level and is encouraged to develop greater precision.', '[Name] demonstrates adequate case study knowledge and is developing the ability to apply it more effectively.', '[Name] meets the basic case study requirements and is encouraged to develop greater depth of knowledge.']),
            needsImprovement: p3(['[Name] needs to spend more time consolidating case study knowledge for use in extended writing.', '[Name] would benefit from reviewing key case studies in order to use them more confidently.', '[Name] needs to develop their case study knowledge to support geographical arguments more effectively.', '[Name] is finding it difficult to apply case study knowledge and would benefit from additional revision.', '[Name] needs to work on learning and applying case study material more accurately.', '[Name] would benefit from spending more time learning the details of key case studies.']),
          },
        },
      },
    },
  ],

  'Modern Languages': [
    {
      id: 'ml_speaking',
      label: 'Speaking',
      section: {
        type: 'rated-comment',
        name: 'Speaking',
        data: {
          comments: {
            excellent: p3(['[Name] speaks with excellent fluency, accuracy and confidence in the target language.', '[Name] is an impressive speaker who communicates in the target language with great skill and natural expression.', '[Name] demonstrates outstanding oral ability and speaks with impressive fluency and accuracy.', '[Name] is a superb speaker of the target language and communicates with real confidence and precision.', '[Name] speaks the target language with exceptional fluency and expressive quality.', '[Name] demonstrates an outstanding ability to communicate orally in the target language.']),
            good: p3(['[Name] speaks with good confidence in the target language and communicates effectively.', '[Name] demonstrates solid speaking skills and engages willingly in oral activities.', '[Name] communicates effectively in the target language and is developing greater fluency.', '[Name] speaks with good confidence and is developing the fluency needed for more sophisticated communication.', '[Name] engages well with speaking tasks and demonstrates good oral ability.', '[Name] demonstrates good speaking skills and communicates clearly in the target language.']),
            satisfactory: p3(['[Name] demonstrates satisfactory speaking ability though greater confidence and accuracy would be beneficial.', '[Name] communicates adequately in the target language with some support.', '[Name] speaks at a satisfactory level and is developing confidence in oral tasks.', '[Name] demonstrates adequate speaking ability and is working on developing greater fluency.', '[Name] meets the basic speaking requirements and is encouraged to practise more regularly.', '[Name] communicates satisfactorily in the target language and is developing greater accuracy.']),
            needsImprovement: p3(['[Name] needs to develop greater confidence in speaking and should practise oral work regularly.', '[Name] would benefit from practising speaking the target language more frequently to build fluency.', '[Name] needs to develop confidence in speaking and is encouraged to practise regularly outside of class.', '[Name] is finding oral work challenging and would benefit from regular practice.', '[Name] needs to work on developing the confidence and accuracy needed for effective oral communication.', '[Name] would benefit from more frequent speaking practice to develop fluency and confidence.']),
          },
        },
      },
    },
  ],

  'Art & Design': [
    {
      id: 'art_creativity',
      label: 'Creativity & Ideas',
      section: {
        type: 'rated-comment',
        name: 'Creativity & Ideas',
        data: {
          comments: {
            excellent: p3(['[Name] demonstrates exceptional creativity and consistently produces original and imaginative work.', '[Name] generates ideas with great flair and develops them into impressive and innovative outcomes.', '[Name] produces creative work of the highest order — original, ambitious and beautifully realised.', '[Name] demonstrates outstanding creative ability and consistently produces work of real distinction.', '[Name] has an exceptional creative vision that results in work of remarkable originality.', '[Name] generates ideas with real flair and develops them with impressive skill and imagination.']),
            good: p3(['[Name] demonstrates good creative ability and develops ideas thoughtfully and with originality.', '[Name] generates interesting ideas and explores them with confidence and imagination.', '[Name] shows good creative ability and produces work that demonstrates original thinking.', '[Name] develops ideas well and produces creative work of a good standard.', '[Name] demonstrates good creativity and is developing the ability to take greater creative risks.', '[Name] generates good ideas and develops them with growing confidence and skill.']),
            satisfactory: p3(['[Name] demonstrates satisfactory creativity and is developing their ability to generate and explore ideas.', '[Name] produces work with adequate originality though further development of ideas would enhance outcomes.', '[Name] shows satisfactory creative ability and is encouraged to be more adventurous in their ideas.', '[Name] meets the basic creative requirements and is developing a more individual approach.', '[Name] demonstrates adequate creativity and is encouraged to take more risks with their ideas.', '[Name] produces satisfactory creative work and is developing greater originality.']),
            needsImprovement: p3(['[Name] needs to take more risks creatively and push their ideas further in order to produce more original work.', '[Name] would benefit from exploring a wider range of ideas and approaches in their creative work.', '[Name] needs to develop greater creative ambition and be willing to explore more unusual ideas.', '[Name] is finding it difficult to generate and develop original ideas and would benefit from additional support.', '[Name] needs to push themselves creatively and be more willing to experiment.', '[Name] would benefit from developing greater confidence in their creative ideas and taking more risks.']),
          },
        },
      },
    },
  ],

  'Music': [
    {
      id: 'music_performance',
      label: 'Performance',
      section: {
        type: 'rated-comment',
        name: 'Performance',
        data: {
          comments: {
            excellent: p3(['[Name] performs with excellent skill, musicality and confidence.', '[Name] is an outstanding performer who brings great expression and accuracy to their playing.', '[Name] delivers performances of the highest quality, combining technical excellence with real musical expression.', '[Name] is a superb performer who plays with impressive accuracy, musicality and confidence.', '[Name] demonstrates outstanding performance ability and delivers work of a very high standard.', '[Name] performs with exceptional skill and brings genuine musical depth to their work.']),
            good: p3(['[Name] performs with good skill and demonstrates developing musicality.', '[Name] is a confident performer who engages well with performance tasks.', '[Name] demonstrates good performance ability and is developing greater musical expression.', '[Name] performs well and is developing the confidence and accuracy needed for higher-level performance.', '[Name] shows good performance skills and is developing a more musical approach.', '[Name] performs competently and with good accuracy, and is developing further confidence.']),
            satisfactory: p3(['[Name] performs at a satisfactory level and is developing their performance skills.', '[Name] demonstrates adequate performance ability though further practice would be beneficial.', '[Name] meets the basic performance requirements and is encouraged to practise more regularly.', '[Name] performs satisfactorily and is developing the skills needed for more confident performance.', '[Name] demonstrates satisfactory performance ability and is working to improve consistency.', '[Name] performs at an adequate level and is encouraged to develop greater musical expression.']),
            needsImprovement: p3(['[Name] needs to dedicate more time to practice in order to develop performance confidence and accuracy.', '[Name] would benefit from regular practice to build the consistency needed for confident performance.', '[Name] needs to practise more regularly to develop the technical skills required for effective performance.', '[Name] is finding performance challenging and would benefit from more regular and focused practice.', '[Name] needs to work on developing the accuracy and confidence needed for effective performance.', '[Name] would benefit significantly from more frequent and focused practice sessions.']),
          },
        },
      },
    },
  ],

  'Generic': [
    {
      id: 'gen_resilience',
      label: 'Resilience & Independence',
      section: {
        type: 'qualities',
        name: 'Resilience & Independence',
        data: {
          comments: {
            'Resilience': p3(['[Name] demonstrates great resilience and perseveres when faced with challenging tasks.', '[Name] responds positively to difficulty and shows determination to overcome obstacles.', '[Name] does not give up easily and approaches challenging work with a positive mindset.', '[Name] shows impressive resilience and bounces back quickly from setbacks.', '[Name] faces challenges with real determination and refuses to be beaten by difficult tasks.', '[Name] demonstrates the kind of resilience that is essential for long-term success.']),
            'Independence': p3(['[Name] works with impressive independence and takes responsibility for their own progress.', '[Name] is a self-sufficient learner who manages their work effectively without prompting.', '[Name] demonstrates admirable independence and consistently takes initiative in their learning.', '[Name] works independently to a high standard and takes real ownership of their progress.', '[Name] is a highly independent learner who consistently shows initiative.', '[Name] demonstrates impressive self-reliance and manages their learning effectively.']),
          },
        },
      },
    },
  ],
};

// Areas for Development section (added to section picker, unticked by default)
export function buildDevelopmentSection(): TemplateSection {
  return {
    id: makeId(),
    type: 'next-steps',
    name: 'Areas for Development',
    data: {
      focusAreas: buildDevelopmentDefaultFocusAreas(),
    },
  };
}

// ─── BUILD FUNCTIONS ──────────────────────────────────────────────────────────

export const SUBJECTS = [
  'PE', 'English', 'Maths', 'Science', 'History',
  'Geography', 'Modern Languages', 'Art & Design', 'Music', 'Generic',
];

// Build a full quick-start template
export function buildQuickStartTemplate(
  templateName: string,
  subject: string,
  selectedExtraIds: string[]
): { name: string; sections: TemplateSection[] } {
  const universalSections = buildUniversalSections();
  const subjectExtras = SUBJECT_EXTRAS[subject] || [];
  const extraSections: TemplateSection[] = subjectExtras
    .filter(e => selectedExtraIds.includes(e.id))
    .map(e => ({ id: makeId(), ...e.section }));

  const insertIdx = universalSections.findIndex(s => s.type === 'next-steps');
  const before = universalSections.slice(0, insertIdx);
  const after = universalSections.slice(insertIdx);

  const sections: TemplateSection[] = [
    ...before,
    ...(extraSections.length > 0 ? [{ id: makeId(), type: 'new-line' as const, name: '', data: {} }] : []),
    ...extraSections,
    ...after,
  ];

  return { name: templateName, sections };
}