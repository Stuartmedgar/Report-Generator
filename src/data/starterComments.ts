// src/data/starterComments.ts
// ─────────────────────────────────────────────────────────────────────────────
// Content library for Quick Start templates.
// Universal sections are added to every template.
// Subject extras are added when a subject is selected.
// ─────────────────────────────────────────────────────────────────────────────

import { TemplateSection } from '../types';

const makeId = () => `qs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ─── UNIVERSAL SECTIONS ───────────────────────────────────────────────────────
// These form the backbone of every Quick Start template.

export function buildUniversalSections(): TemplateSection[] {
  return [
    // 1. Progress — rated-comment
    {
      id: makeId(),
      type: 'rated-comment',
      name: 'Progress',
      data: {
        comments: {
          excellent: [
            '[Name] has made excellent progress this session and is performing at a high level.',
            '[Name] has demonstrated outstanding progress and consistently exceeds expectations.',
            '[Name] has made remarkable progress this year and is to be commended for their achievements.',
          ],
          good: [
            '[Name] has made good progress this session and is working well.',
            '[Name] has shown pleasing progress and continues to develop their skills effectively.',
            '[Name] has made solid progress throughout the year and is building on their strengths.',
          ],
          satisfactory: [
            '[Name] has made satisfactory progress this session.',
            '[Name] has made reasonable progress, though there is room for further improvement.',
            '[Name] is making steady progress and with continued effort will continue to improve.',
          ],
          needsImprovement: [
            '[Name] has made limited progress this session and needs to apply greater effort.',
            '[Name] has found aspects of the course challenging and progress has been slower than expected.',
            '[Name] has not yet made the progress expected and should focus on consistent effort going forward.',
          ],
        },
      },
    },

    // 2. Effort & Application — rated-comment
    {
      id: makeId(),
      type: 'rated-comment',
      name: 'Effort & Application',
      data: {
        comments: {
          excellent: [
            '[Name] consistently applies excellent effort to all tasks and always gives their best.',
            '[Name] demonstrates a commendable work ethic and approaches every task with great enthusiasm.',
            '[Name] is a highly motivated pupil who consistently puts in excellent effort.',
          ],
          good: [
            '[Name] applies good effort to tasks and engages positively with learning.',
            '[Name] shows a willing attitude and generally applies themselves well to their work.',
            '[Name] works with good effort and maintains a positive approach to tasks.',
          ],
          satisfactory: [
            '[Name] applies satisfactory effort to tasks, though greater consistency would be beneficial.',
            '[Name] shows reasonable effort but would benefit from applying themselves more consistently.',
            '[Name] puts in adequate effort, though more sustained application would help them reach their potential.',
          ],
          needsImprovement: [
            '[Name] needs to apply greater effort to tasks in order to reach their potential.',
            '[Name] could achieve more by focusing on applying consistent effort to all areas of the course.',
            '[Name] would benefit from a more determined approach to their work.',
          ],
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
          'Positive attitude': [
            '[Name] displays a positive attitude and is a pleasure to have in class.',
            '[Name] approaches learning with enthusiasm and contributes positively to the class.',
            '[Name] is a motivated and positive member of the class.',
          ],
          'Behaviour': [
            '[Name] demonstrates excellent behaviour and always conducts themselves appropriately.',
            '[Name] behaves impeccably and sets a fine example to their peers.',
            '[Name] is respectful and well-mannered at all times.',
          ],
          'Contribution to class': [
            '[Name] makes a valuable contribution to class discussions and activities.',
            '[Name] actively participates in lessons and enriches the learning environment.',
            '[Name] is always willing to contribute and supports others in their learning.',
          ],
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
          'Completion': [
            '[Name] consistently completes homework tasks and submits them on time.',
            '[Name] reliably completes all homework set and demonstrates commitment outside the classroom.',
            '[Name] has an excellent homework record and always meets expectations.',
          ],
          'Quality': [
            '[Name] produces homework of a high standard that reflects considerable effort.',
            '[Name] consistently submits homework that is well-presented and carefully completed.',
            '[Name] takes care with homework tasks and the quality of work submitted is commendable.',
          ],
          'Meets deadlines': [
            '[Name] always meets homework deadlines and manages their time effectively.',
            '[Name] is reliable in submitting homework on time and takes responsibility for their learning.',
          ],
        },
      },
    },

    // newline
    { id: makeId(), type: 'new-line', name: '', data: {} },

    // 5. Strengths — qualities
    {
      id: makeId(),
      type: 'qualities',
      name: 'Strengths',
      data: {
        comments: {
          'Subject knowledge': [
            '[Name] demonstrates a strong understanding of the subject and applies knowledge confidently.',
            '[Name] has an impressive grasp of the course content and builds on prior learning effectively.',
            '[Name] shows excellent subject knowledge and is able to apply concepts with confidence.',
          ],
          'Skills': [
            '[Name] has developed strong practical skills and applies them effectively.',
            '[Name] demonstrates well-developed skills and continues to refine their technique.',
            '[Name] applies their skills thoughtfully and produces work of a high standard.',
          ],
          'Independence': [
            '[Name] works with great independence and takes responsibility for their own learning.',
            '[Name] is a self-motivated learner who manages their work effectively without prompting.',
            '[Name] shows impressive independence and is able to tackle challenging tasks confidently.',
          ],
        },
      },
    },

    // newline
    { id: makeId(), type: 'new-line', name: '', data: {} },

    // 6. Next Steps — next-steps
    {
      id: makeId(),
      type: 'next-steps',
      name: 'Next Steps',
      data: {
        focusAreas: {
          'Consolidate learning': [
            'Continue to consolidate the skills and knowledge developed this session.',
            'Build on the strong foundations established this year by continuing to practise regularly.',
          ],
          'Improve consistency': [
            'Focus on applying consistent effort across all areas of the course.',
            'Work on maintaining the same high standard in all tasks, not just those they find interesting.',
          ],
          'Independent study': [
            'Set aside regular time for independent study and revision to reinforce classroom learning.',
            'Make use of available resources to support learning beyond the classroom.',
          ],
          'Ask for help': [
            'Do not hesitate to ask for support when finding topics challenging.',
            'Make use of any available support to address areas of difficulty.',
          ],
        },
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

// ─── SUBJECT EXTRAS ───────────────────────────────────────────────────────────
// Additional sections unlocked per subject. Teacher selects which to include.

export interface SubjectExtra {
  id: string;           // stable key for React
  label: string;        // display name shown to teacher
  section: Omit<TemplateSection, 'id'>;
}

export const SUBJECT_EXTRAS: Record<string, SubjectExtra[]> = {

  'PE': [
    {
      id: 'pe_sportsmanship',
      label: 'Sportsmanship',
      section: {
        type: 'qualities',
        name: 'Sportsmanship',
        data: {
          comments: {
            'Fair play': [
              '[Name] demonstrates excellent sportsmanship and always competes with fairness and integrity.',
              '[Name] shows great respect for opponents and officials at all times.',
              '[Name] is a fair and sporting competitor who leads by example.',
            ],
            'Resilience': [
              '[Name] shows great resilience and responds positively to setbacks.',
              '[Name] handles both success and disappointment in a mature and sporting manner.',
            ],
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
            'Team player': [
              '[Name] is an excellent team player who supports and encourages those around them.',
              '[Name] contributes positively to group activities and works well with all members of the class.',
              '[Name] is a valued member of any team and consistently puts the group first.',
            ],
            'Leadership': [
              '[Name] shows natural leadership qualities and motivates others effectively.',
              '[Name] takes on a leadership role confidently and helps to organise and guide the team.',
            ],
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
            excellent: [
              '[Name] demonstrates an excellent level of physical fitness and applies it effectively across activities.',
              '[Name] has a superb level of fitness and uses it to great advantage in all areas of PE.',
            ],
            good: [
              '[Name] demonstrates a good level of physical fitness and engages fully with all activities.',
              '[Name] has a pleasing level of fitness and applies it well across a range of activities.',
            ],
            satisfactory: [
              '[Name] demonstrates a satisfactory level of physical fitness.',
              '[Name] has an adequate level of fitness for the demands of the course.',
            ],
            needsImprovement: [
              '[Name] would benefit from working on their physical fitness levels to support performance.',
              '[Name] should focus on developing their fitness in order to fully engage with all activities.',
            ],
          },
        },
      },
    },
    {
      id: 'pe_skills',
      label: 'Physical Skills',
      section: {
        type: 'rated-comment',
        name: 'Physical Skills',
        data: {
          comments: {
            excellent: [
              '[Name] demonstrates excellent technical skills and applies them with confidence and accuracy.',
              '[Name] has highly developed physical skills and performs with great precision and control.',
            ],
            good: [
              '[Name] demonstrates good technical skills and is able to apply them effectively in context.',
              '[Name] has developed sound physical skills and continues to refine their technique.',
            ],
            satisfactory: [
              '[Name] is developing their physical skills at a satisfactory rate.',
              '[Name] demonstrates adequate technical skills though continued practice will be beneficial.',
            ],
            needsImprovement: [
              '[Name] needs to focus on developing their technical skills further through regular practice.',
              '[Name] would benefit from dedicating more time to practising the core skills of the course.',
            ],
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
            excellent: [
              '[Name] is an excellent reader who engages critically and perceptively with texts.',
              '[Name] demonstrates outstanding reading comprehension and analyses texts with great insight.',
            ],
            good: [
              '[Name] reads with good understanding and is able to draw valid conclusions from texts.',
              '[Name] demonstrates solid reading skills and engages thoughtfully with a range of texts.',
            ],
            satisfactory: [
              '[Name] demonstrates satisfactory reading ability and engages adequately with set texts.',
              '[Name] reads with reasonable understanding though deeper analysis would be beneficial.',
            ],
            needsImprovement: [
              '[Name] would benefit from reading more widely in order to develop confidence and comprehension.',
              '[Name] needs to develop their ability to analyse and interpret texts more thoroughly.',
            ],
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
            excellent: [
              '[Name] produces writing of an excellent standard, demonstrating flair, accuracy and sophistication.',
              '[Name] is a highly skilled writer who crafts well-structured and engaging pieces.',
            ],
            good: [
              '[Name] produces well-structured written work and writes with good accuracy and expression.',
              '[Name] demonstrates good writing skills and communicates ideas clearly and effectively.',
            ],
            satisfactory: [
              '[Name] produces written work of a satisfactory standard with reasonable accuracy.',
              '[Name] writes with adequate expression though further development of style would be beneficial.',
            ],
            needsImprovement: [
              '[Name] needs to focus on developing accuracy and structure in written work.',
              '[Name] would benefit from practising different forms of writing to build confidence and skill.',
            ],
          },
        },
      },
    },
    {
      id: 'eng_talking',
      label: 'Spoken Communication',
      section: {
        type: 'qualities',
        name: 'Spoken Communication',
        data: {
          comments: {
            'Oral contribution': [
              '[Name] contributes thoughtfully to class discussions and expresses ideas with confidence.',
              '[Name] communicates verbally with great clarity and engages well in group discussion.',
              '[Name] is an articulate and confident speaker who makes a valuable contribution to class.',
            ],
            'Listening': [
              '[Name] listens attentively and responds appropriately to the contributions of others.',
              '[Name] is an excellent listener and builds effectively on what others say.',
            ],
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
            excellent: [
              '[Name] demonstrates excellent numeracy skills and works with numbers accurately and confidently.',
              '[Name] has a strong grasp of numeracy and applies mathematical skills with great precision.',
            ],
            good: [
              '[Name] demonstrates good numeracy skills and works with reasonable accuracy.',
              '[Name] has a sound grasp of number work and applies skills effectively.',
            ],
            satisfactory: [
              '[Name] demonstrates satisfactory numeracy skills with some areas still developing.',
              '[Name] has an adequate understanding of number work though further practice would be beneficial.',
            ],
            needsImprovement: [
              '[Name] needs to focus on developing core numeracy skills, particularly through regular practice.',
              '[Name] would benefit from spending time consolidating fundamental number skills.',
            ],
          },
        },
      },
    },
    {
      id: 'maths_problem_solving',
      label: 'Problem Solving',
      section: {
        type: 'qualities',
        name: 'Problem Solving',
        data: {
          comments: {
            'Logical thinking': [
              '[Name] approaches problems logically and works through solutions in a systematic way.',
              '[Name] demonstrates strong analytical thinking and tackles unfamiliar problems with confidence.',
              '[Name] applies logical reasoning effectively when working through mathematical problems.',
            ],
            'Accuracy': [
              '[Name] works with great accuracy and consistently produces correct solutions.',
              '[Name] checks their work carefully and produces neat, accurate solutions.',
              '[Name] pays close attention to detail and maintains high standards of accuracy.',
            ],
          },
        },
      },
    },
  ],

  'Science': [
    {
      id: 'sci_practical',
      label: 'Practical & Lab Skills',
      section: {
        type: 'rated-comment',
        name: 'Practical Skills',
        data: {
          comments: {
            excellent: [
              '[Name] demonstrates excellent practical skills and conducts experiments with great care and precision.',
              '[Name] is highly skilled in the laboratory and approaches practical work with confidence and accuracy.',
            ],
            good: [
              '[Name] demonstrates good practical skills and engages positively with experimental work.',
              '[Name] works carefully in practical sessions and handles equipment with confidence.',
            ],
            satisfactory: [
              '[Name] demonstrates satisfactory practical skills and is developing their laboratory technique.',
              '[Name] engages adequately with practical work, though greater care and precision would be beneficial.',
            ],
            needsImprovement: [
              '[Name] needs to focus on developing their practical skills and taking greater care in the laboratory.',
              '[Name] would benefit from approaching experimental work with more precision and attention to procedure.',
            ],
          },
        },
      },
    },
    {
      id: 'sci_enquiry',
      label: 'Scientific Thinking',
      section: {
        type: 'qualities',
        name: 'Scientific Thinking',
        data: {
          comments: {
            'Enquiry': [
              '[Name] demonstrates a natural curiosity and approaches scientific questions with enthusiasm.',
              '[Name] shows excellent scientific thinking and is able to analyse evidence and draw valid conclusions.',
              '[Name] asks perceptive questions and shows a genuine interest in scientific investigation.',
            ],
            'Safety awareness': [
              '[Name] consistently demonstrates excellent awareness of safety procedures in the laboratory.',
              '[Name] follows all safety guidelines carefully and sets a good example to others.',
            ],
          },
        },
      },
    },
  ],

  'History': [
    {
      id: 'hist_research',
      label: 'Research Skills',
      section: {
        type: 'qualities',
        name: 'Research Skills',
        data: {
          comments: {
            'Source analysis': [
              '[Name] evaluates historical sources critically and draws well-supported conclusions.',
              '[Name] demonstrates strong skills in analysing and interpreting primary and secondary sources.',
              '[Name] handles source material with confidence and understands the importance of context.',
            ],
            'Independent research': [
              '[Name] takes initiative in researching topics independently and enriches their work as a result.',
              '[Name] demonstrates impressive research skills and incorporates a range of evidence into their work.',
            ],
          },
        },
      },
    },
    {
      id: 'hist_writing',
      label: 'Extended Writing',
      section: {
        type: 'rated-comment',
        name: 'Extended Writing',
        data: {
          comments: {
            excellent: [
              '[Name] produces extended writing of an excellent standard, with well-structured arguments supported by detailed evidence.',
              '[Name] writes analytically and persuasively, demonstrating excellent command of historical knowledge.',
            ],
            good: [
              '[Name] produces well-structured extended writing and supports points with relevant evidence.',
              '[Name] writes with good analytical skill and develops arguments effectively.',
            ],
            satisfactory: [
              '[Name] produces extended writing of a satisfactory standard with reasonable structure.',
              '[Name] is developing their ability to construct and sustain historical arguments in writing.',
            ],
            needsImprovement: [
              '[Name] needs to focus on structuring extended writing more effectively and supporting points with evidence.',
              '[Name] would benefit from practising analytical writing to develop confidence and skill.',
            ],
          },
        },
      },
    },
  ],

  'Geography': [
    {
      id: 'geog_fieldwork',
      label: 'Fieldwork & Investigation',
      section: {
        type: 'qualities',
        name: 'Fieldwork & Investigation',
        data: {
          comments: {
            'Data collection': [
              '[Name] collects and records fieldwork data accurately and with great care.',
              '[Name] approaches fieldwork tasks systematically and produces thorough and well-organised data.',
            ],
            'Analysis': [
              '[Name] analyses geographical data effectively and draws clear, well-supported conclusions.',
              '[Name] demonstrates strong analytical skills when interpreting fieldwork and investigative evidence.',
              '[Name] evaluates findings critically and relates them confidently to geographical concepts.',
            ],
          },
        },
      },
    },
    {
      id: 'geog_case_studies',
      label: 'Case Study Knowledge',
      section: {
        type: 'rated-comment',
        name: 'Case Study Knowledge',
        data: {
          comments: {
            excellent: [
              '[Name] demonstrates an excellent knowledge of case studies and applies them with great confidence.',
              '[Name] uses case study evidence with skill and precision to support geographical arguments.',
            ],
            good: [
              '[Name] demonstrates a good knowledge of case studies and references them effectively.',
              '[Name] uses case study evidence well to support and develop geographical points.',
            ],
            satisfactory: [
              '[Name] demonstrates satisfactory knowledge of case studies though more detailed use would be beneficial.',
              '[Name] is developing their ability to apply case study knowledge to support geographical arguments.',
            ],
            needsImprovement: [
              '[Name] needs to spend more time consolidating case study knowledge for use in extended writing.',
              '[Name] would benefit from reviewing key case studies in order to use them more confidently.',
            ],
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
            excellent: [
              '[Name] speaks with excellent fluency, accuracy and confidence in the target language.',
              '[Name] is an impressive speaker who communicates in the target language with great skill and natural expression.',
            ],
            good: [
              '[Name] speaks with good confidence in the target language and communicates effectively.',
              '[Name] demonstrates solid speaking skills and engages willingly in oral activities.',
            ],
            satisfactory: [
              '[Name] demonstrates satisfactory speaking ability though greater confidence and accuracy would be beneficial.',
              '[Name] communicates adequately in the target language with some support.',
            ],
            needsImprovement: [
              '[Name] needs to develop greater confidence in speaking and should practise oral work regularly.',
              '[Name] would benefit from practising speaking the target language more frequently to build fluency.',
            ],
          },
        },
      },
    },
    {
      id: 'ml_vocabulary',
      label: 'Vocabulary & Accuracy',
      section: {
        type: 'qualities',
        name: 'Vocabulary & Accuracy',
        data: {
          comments: {
            'Vocabulary': [
              '[Name] has an impressive vocabulary and uses a wide range of language with confidence.',
              '[Name] builds vocabulary effectively and incorporates new language into their work.',
              '[Name] has a broad and growing vocabulary which enhances the quality of their work.',
            ],
            'Accuracy': [
              '[Name] applies grammar rules accurately and produces work of a high standard.',
              '[Name] demonstrates good accuracy and pays close attention to grammatical correctness.',
              '[Name] works carefully to ensure accuracy and produces well-crafted responses.',
            ],
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
            excellent: [
              '[Name] demonstrates exceptional creativity and consistently produces original and imaginative work.',
              '[Name] generates ideas with great flair and develops them into impressive and innovative outcomes.',
            ],
            good: [
              '[Name] demonstrates good creative ability and develops ideas thoughtfully and with originality.',
              '[Name] generates interesting ideas and explores them with confidence and imagination.',
            ],
            satisfactory: [
              '[Name] demonstrates satisfactory creativity and is developing their ability to generate and explore ideas.',
              '[Name] produces work with adequate originality though further development of ideas would enhance outcomes.',
            ],
            needsImprovement: [
              '[Name] needs to take more risks creatively and push their ideas further in order to produce more original work.',
              '[Name] would benefit from exploring a wider range of ideas and approaches in their creative work.',
            ],
          },
        },
      },
    },
    {
      id: 'art_technique',
      label: 'Technique & Craft',
      section: {
        type: 'rated-comment',
        name: 'Technique & Craft',
        data: {
          comments: {
            excellent: [
              '[Name] demonstrates excellent technical skill and produces work of a very high standard.',
              '[Name] handles materials and tools with great skill and produces beautifully crafted outcomes.',
            ],
            good: [
              '[Name] demonstrates good technical ability and applies skills carefully and effectively.',
              '[Name] works with good skill and produces well-crafted work that reflects real effort.',
            ],
            satisfactory: [
              '[Name] demonstrates satisfactory technical ability and is developing their craft skills.',
              '[Name] applies techniques adequately and is progressing in their handling of materials.',
            ],
            needsImprovement: [
              '[Name] needs to spend more time practising core techniques in order to improve the standard of their practical work.',
              '[Name] would benefit from focusing on developing their technical skills more carefully.',
            ],
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
            excellent: [
              '[Name] performs with excellent skill, musicality and confidence.',
              '[Name] is an outstanding performer who brings great expression and accuracy to their playing.',
            ],
            good: [
              '[Name] performs with good skill and demonstrates developing musicality.',
              '[Name] is a confident performer who engages well with performance tasks.',
            ],
            satisfactory: [
              '[Name] performs at a satisfactory level and is developing their performance skills.',
              '[Name] demonstrates adequate performance ability though further practice would be beneficial.',
            ],
            needsImprovement: [
              '[Name] needs to dedicate more time to practice in order to develop performance confidence and accuracy.',
              '[Name] would benefit from regular practice to build the consistency needed for confident performance.',
            ],
          },
        },
      },
    },
    {
      id: 'music_theory',
      label: 'Music Theory & Literacy',
      section: {
        type: 'rated-comment',
        name: 'Music Theory & Literacy',
        data: {
          comments: {
            excellent: [
              '[Name] demonstrates excellent knowledge of music theory and applies it with great confidence.',
              '[Name] has a strong grasp of music literacy and uses theoretical knowledge to enhance their work.',
            ],
            good: [
              '[Name] demonstrates good theoretical knowledge and applies it effectively.',
              '[Name] has a sound understanding of music theory and engages well with literacy tasks.',
            ],
            satisfactory: [
              '[Name] demonstrates satisfactory knowledge of music theory and is developing their literacy skills.',
              '[Name] has an adequate grasp of theoretical concepts though further consolidation would be beneficial.',
            ],
            needsImprovement: [
              '[Name] needs to spend more time consolidating their understanding of music theory.',
              '[Name] would benefit from reviewing key theoretical concepts to strengthen their musical literacy.',
            ],
          },
        },
      },
    },
    {
      id: 'music_practice',
      label: 'Practice Commitment',
      section: {
        type: 'qualities',
        name: 'Practice Commitment',
        data: {
          comments: {
            'Regular practice': [
              '[Name] demonstrates a strong commitment to regular practice and this is reflected in their progress.',
              '[Name] practises diligently and the results of their dedication are clear to see.',
              '[Name] is committed to improvement through regular and focused practice.',
            ],
            'Self-discipline': [
              '[Name] shows impressive self-discipline in their approach to practice and preparation.',
              '[Name] takes personal responsibility for their development and manages practice time effectively.',
            ],
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
            'Resilience': [
              '[Name] demonstrates great resilience and perseveres when faced with challenging tasks.',
              '[Name] responds positively to difficulty and shows determination to overcome obstacles.',
              '[Name] does not give up easily and approaches challenging work with a positive mindset.',
            ],
            'Independence': [
              '[Name] works with impressive independence and takes responsibility for their own progress.',
              '[Name] is a self-sufficient learner who manages their work effectively without prompting.',
            ],
          },
        },
      },
    },
    {
      id: 'gen_organisation',
      label: 'Organisation',
      section: {
        type: 'qualities',
        name: 'Organisation',
        data: {
          comments: {
            'Prepared for learning': [
              '[Name] is always well prepared for lessons and arrives with the correct materials.',
              '[Name] is consistently organised and ensures they are ready to learn each lesson.',
              '[Name] demonstrates excellent organisation and manages their materials and time effectively.',
            ],
            'Time management': [
              '[Name] manages their time well and consistently meets deadlines.',
              '[Name] plans their work effectively and demonstrates strong time management skills.',
            ],
          },
        },
      },
    },
    {
      id: 'gen_collaboration',
      label: 'Collaboration',
      section: {
        type: 'qualities',
        name: 'Collaboration',
        data: {
          comments: {
            'Group work': [
              '[Name] works collaboratively with others and makes a positive contribution to group tasks.',
              '[Name] is an excellent collaborator who listens to others and shares ideas generously.',
              '[Name] thrives in group work situations and brings out the best in those around them.',
            ],
            'Peer support': [
              '[Name] is supportive of their peers and willingly offers help to others.',
              '[Name] demonstrates kindness and consideration towards classmates and is a valued member of the group.',
            ],
          },
        },
      },
    },
  ],
};

// List of subjects for the picker UI
export const SUBJECTS = [
  'PE',
  'English',
  'Maths',
  'Science',
  'History',
  'Geography',
  'Modern Languages',
  'Art & Design',
  'Music',
  'Generic',
];

// Build a full quick-start template: universal + chosen subject extras
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

  // Insert subject extras before the final Next Steps + Optional block
  // Find the last new-line before next-steps
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