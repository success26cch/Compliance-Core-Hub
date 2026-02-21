import type { IStorage } from "./storage";

export async function seedBrandNSwagCourses(storage: IStorage) {
  await seedWorkplaceSafetyOrientation(storage);
  await seedInjuryReporting(storage);
  await seedSlipsTrips(storage);
  await seedHazCom(storage);
  await seedPPE(storage);
  await seedDrugAlcoholAwareness(storage);
  console.log("BrandNSwag new hire safety courses seeded successfully");
}

async function seedWorkplaceSafetyOrientation(storage: IStorage) {
  const existing = await storage.getCourseByProductId("bns-workplace-safety-orientation");
  if (existing) {
    console.log("Workplace Safety Orientation already exists, skipping");
    return;
  }

  const course = await storage.createCourse({
    productId: "bns-workplace-safety-orientation",
    title: "Workplace Safety Orientation",
    description: "Your day-one safety foundation. Learn to recognize workplace hazards, understand emergency procedures, know your OSHA rights, and report unsafe conditions. Every new hire starts here.",
    category: "new_hire_safety",
    totalModules: 2,
    estimatedHours: 1,
    isActive: true,
  });

  const mod1 = await storage.createModule({
    courseId: course.id,
    title: "Module 1: Your Safety Rights & Responsibilities",
    description: "Understanding OSHA's role, your rights as an employee, and what your employer is required to provide.",
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "What Is OSHA and Why It Matters to You",
    content: `<div class="lesson-content">
<h2>What Is OSHA and Why It Matters to You</h2>

<p>The Occupational Safety and Health Administration (OSHA) was created in 1970 with a single mission: <strong>to ensure that every worker in America has a safe and healthful workplace.</strong> OSHA sets the rules that your employer must follow, and it gives you — the employee — specific rights to make sure those rules are enforced.</p>

<p>This isn't just a government program that exists on paper. OSHA's standards are the reason you have guardrails on elevated platforms, the reason your employer provides hearing protection in loud environments, and the reason hazardous chemicals are labeled so you know what you're handling.</p>

<h3>Your Rights Under OSHA</h3>
<p>Under the <strong>OSH Act of 1970</strong>, every employee has the right to:</p>
<ul>
<li><strong>A safe workplace</strong> — free from recognized hazards that could cause death or serious physical harm</li>
<li><strong>Training</strong> — in a language and vocabulary you understand — about the hazards you'll encounter on the job</li>
<li><strong>Access to safety records</strong> — including your employer's injury and illness logs (OSHA 300 Log)</li>
<li><strong>File a complaint</strong> — with OSHA if you believe conditions are unsafe, without fear of retaliation</li>
<li><strong>Refuse dangerous work</strong> — if you believe you're in imminent danger and your employer hasn't addressed it</li>
</ul>

<div class="highlight-box">
<h4>Key Point: Retaliation Is Illegal</h4>
<p>Your employer cannot fire you, demote you, transfer you, or punish you in any way for reporting a safety concern or filing an OSHA complaint. This is protected under <strong>Section 11(c) of the OSH Act</strong>. If you believe you've been retaliated against, you can file a whistleblower complaint with OSHA within 30 days.</p>
</div>

<h3>Your Responsibilities</h3>
<p>Safety is a two-way street. As an employee, you are expected to:</p>
<ul>
<li>Follow all safety rules and procedures established by your employer</li>
<li>Wear required Personal Protective Equipment (PPE)</li>
<li>Report hazards, unsafe conditions, and injuries to your supervisor immediately</li>
<li>Participate in required safety training</li>
<li>Never remove or bypass safety devices or guards on equipment</li>
</ul>

<p>Safety works when everyone — employer and employee — does their part. This course is your first step.</p>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "Recognizing Workplace Hazards",
    content: `<div class="lesson-content">
<h2>Recognizing Workplace Hazards</h2>

<p>A <strong>hazard</strong> is anything in the workplace that has the potential to cause harm — to you, your coworkers, or anyone in the area. Hazard recognition is the most important safety skill you can develop, because you can't protect yourself from something you don't see.</p>

<h3>The Four Categories of Workplace Hazards</h3>

<h4>1. Physical Hazards</h4>
<p>These are environmental conditions that can cause harm without direct contact with a chemical or biological agent:</p>
<ul>
<li>Noise levels above 85 decibels (requires hearing protection per OSHA 29 CFR 1910.95)</li>
<li>Extreme temperatures — heat stress and cold exposure</li>
<li>Slippery or uneven walking surfaces</li>
<li>Unguarded machinery, moving parts, or pinch points</li>
<li>Working at heights without fall protection</li>
<li>Poor lighting or obstructed visibility</li>
</ul>

<h4>2. Chemical Hazards</h4>
<p>Any substance that can cause harm through inhalation, skin contact, ingestion, or eye exposure:</p>
<ul>
<li>Cleaning solvents, degreasers, and industrial chemicals</li>
<li>Dusts, fumes, and vapors from manufacturing processes</li>
<li>Paints, coatings, and adhesives</li>
<li>Fuels and lubricants</li>
</ul>

<h4>3. Biological Hazards</h4>
<p>Living organisms or their byproducts that can cause illness:</p>
<ul>
<li>Bloodborne pathogens (healthcare, first responders)</li>
<li>Mold and fungi in damp environments</li>
<li>Bacteria from contaminated water or surfaces</li>
</ul>

<h4>4. Ergonomic Hazards</h4>
<p>Conditions that strain the body through repetitive motion, awkward posture, or overexertion:</p>
<ul>
<li>Repetitive lifting, bending, or twisting</li>
<li>Prolonged standing or sitting in one position</li>
<li>Using tools that vibrate or require excessive grip force</li>
<li>Workstations that aren't adjusted to the worker</li>
</ul>

<div class="highlight-box">
<h4>The 30-Second Hazard Scan</h4>
<p>Before starting any task, take 30 seconds to scan your work area. Ask yourself: <em>What could go wrong here? What could hurt me or someone else?</em> This simple habit prevents more injuries than any piece of equipment ever could.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createQuizQuestion({ moduleId: mod1.id, question: "Under OSHA, which of the following is a right that every employee has?", options: ["The right to choose which PPE to wear", "The right to file a complaint about unsafe conditions without fear of retaliation", "The right to skip safety training if they have prior experience", "The right to set their own safety rules"], correctIndex: 1, explanation: "Under Section 11(c) of the OSH Act, every employee has the right to file a safety complaint with OSHA without fear of retaliation. Employers cannot punish employees for reporting unsafe conditions.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "What are the four categories of workplace hazards?", options: ["Fire, Water, Air, Earth", "Physical, Chemical, Biological, Ergonomic", "Electrical, Mechanical, Structural, Environmental", "Acute, Chronic, Temporary, Permanent"], correctIndex: 1, explanation: "The four categories of workplace hazards are Physical (noise, temperature, falls), Chemical (solvents, dusts, fumes), Biological (bloodborne pathogens, mold), and Ergonomic (repetitive motion, awkward posture).", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "Before starting any task, what should you do to identify potential hazards?", options: ["Ask a coworker if it's safe", "Wait for your supervisor to inspect the area", "Perform a 30-second hazard scan of your work area", "Check the OSHA website for guidance"], correctIndex: 2, explanation: "A 30-second hazard scan before starting any task is a simple but highly effective safety habit. Look around your work area and ask: What could go wrong? What could hurt me or someone else?", orderIndex: 2 });

  const mod2 = await storage.createModule({
    courseId: course.id,
    title: "Module 2: Emergency Procedures & Reporting",
    description: "What to do in an emergency, how to report hazards, and understanding evacuation procedures.",
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "Emergency Action Plans & Evacuation",
    content: `<div class="lesson-content">
<h2>Emergency Action Plans & Evacuation</h2>

<p>OSHA requires employers to have an <strong>Emergency Action Plan (EAP)</strong> under <strong>29 CFR 1910.38</strong>. This plan tells you exactly what to do when an emergency happens — fire, chemical spill, severe weather, medical emergency, or any situation that requires immediate action.</p>

<h3>What You Need to Know on Day One</h3>
<ul>
<li><strong>Emergency exits:</strong> Know the location of every exit in your work area. There should always be at least two ways out.</li>
<li><strong>Assembly points:</strong> Know where to go after evacuating. Your employer designates specific meeting areas so they can account for every employee.</li>
<li><strong>Alarm signals:</strong> Know what the alarm sounds like and what it means. Some facilities have different alarms for fire, chemical release, and severe weather.</li>
<li><strong>Fire extinguisher locations:</strong> Know where they are, even if you're not trained to use them. OSHA standard 29 CFR 1910.157 covers fire extinguisher requirements.</li>
<li><strong>First aid kit locations:</strong> Know where first aid supplies are kept in your work area.</li>
</ul>

<h3>During an Emergency</h3>
<ol>
<li><strong>Stay calm</strong> — panic causes more injuries than the emergency itself</li>
<li><strong>Alert others</strong> — activate the alarm or notify your supervisor</li>
<li><strong>Evacuate</strong> — follow the posted evacuation routes, do not use elevators</li>
<li><strong>Report to your assembly point</strong> — your supervisor needs to account for you</li>
<li><strong>Do not re-enter</strong> — never go back inside until authorized personnel give the all-clear</li>
</ol>

<div class="highlight-box warning-box">
<h4>Critical Rule: Never Block Emergency Exits</h4>
<p>OSHA requires that all exit routes remain clear and unobstructed at all times (29 CFR 1910.37). This means no equipment, pallets, boxes, or materials in front of exit doors, in stairwells, or blocking access to emergency equipment. If you see a blocked exit, report it immediately.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "How to Report Hazards and Unsafe Conditions",
    content: `<div class="lesson-content">
<h2>How to Report Hazards and Unsafe Conditions</h2>

<p>Reporting hazards is not optional — it's one of the most important things you can do as an employee. Many serious workplace injuries could have been prevented if someone had reported the hazard before it caused harm.</p>

<h3>What to Report</h3>
<ul>
<li>Broken or damaged equipment</li>
<li>Missing machine guards or safety devices</li>
<li>Spills, leaks, or standing water on walking surfaces</li>
<li>Damaged or missing PPE</li>
<li>Frayed electrical cords or exposed wiring</li>
<li>Blocked exits or emergency equipment</li>
<li>Any condition that makes you feel unsafe</li>
</ul>

<h3>How to Report</h3>
<ol>
<li><strong>Tell your supervisor immediately</strong> — verbal reporting is the fastest way to address a hazard</li>
<li><strong>Document it</strong> — many companies have hazard reporting forms or digital reporting systems. Use them.</li>
<li><strong>Follow up</strong> — if the hazard hasn't been corrected within a reasonable time, ask about it. You have the right to follow up.</li>
</ol>

<h3>What Happens After You Report</h3>
<p>Your employer is required to investigate the hazard and take corrective action. Under OSHA's General Duty Clause (Section 5(a)(1)), employers must provide a workplace free from recognized hazards. Your report helps them fulfill that obligation.</p>

<div class="highlight-box">
<h4>Remember: No Report Is Too Small</h4>
<p>A loose handrail, a flickering light over a stairway, a missing wet floor sign — these may seem minor, but they're the conditions that cause real injuries every day. When in doubt, report it.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createQuizQuestion({ moduleId: mod2.id, question: "During an emergency evacuation, what should you do FIRST after hearing the alarm?", options: ["Gather your personal belongings", "Stay calm, alert others, and evacuate using posted routes", "Call 911 from your workstation", "Wait for your supervisor to give instructions before moving"], correctIndex: 1, explanation: "During an emergency, stay calm, alert others nearby, and evacuate using the posted evacuation routes. Do not stop to gather belongings or wait at your workstation.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "If you notice a blocked emergency exit, what should you do?", options: ["Move the obstruction yourself if you can", "Report it immediately to your supervisor", "Ignore it — maintenance will find it eventually", "Only report it if there's an actual emergency"], correctIndex: 1, explanation: "Blocked emergency exits violate OSHA 29 CFR 1910.37. Report it immediately to your supervisor so it can be corrected. Do not wait for an emergency to report the hazard.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "Under OSHA, what is the employer's obligation when an employee reports a workplace hazard?", options: ["They must fix it within 24 hours", "They must investigate the hazard and take corrective action", "They only have to address it if someone gets hurt", "They can decide whether it's a real hazard or not without investigation"], correctIndex: 1, explanation: "Under OSHA's General Duty Clause, employers must investigate reported hazards and take corrective action to maintain a workplace free from recognized hazards.", orderIndex: 2 });

  console.log("  - Workplace Safety Orientation seeded (2 modules, 4 lessons, 6 quiz questions)");
}

async function seedInjuryReporting(storage: IStorage) {
  const existing = await storage.getCourseByProductId("bns-injury-reporting");
  if (existing) {
    console.log("Injury Reporting & First Aid Awareness already exists, skipping");
    return;
  }

  const course = await storage.createCourse({
    productId: "bns-injury-reporting",
    title: "Injury Reporting & First Aid Awareness",
    description: "Know exactly what to do when someone gets hurt. Learn proper injury reporting, the difference between first aid and OSHA recordable injuries, and why accurate documentation protects everyone.",
    category: "new_hire_safety",
    totalModules: 2,
    estimatedHours: 1,
    isActive: true,
  });

  const mod1 = await storage.createModule({
    courseId: course.id,
    title: "Module 1: When Someone Gets Hurt — What to Do",
    description: "Immediate response steps, who to notify, and how to document a workplace injury.",
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "Immediate Response to a Workplace Injury",
    content: `<div class="lesson-content">
<h2>Immediate Response to a Workplace Injury</h2>

<p>When a coworker gets hurt — or when you get hurt yourself — the first few minutes matter. How you respond affects the injured person's outcome and your company's ability to properly document and manage the incident.</p>

<h3>Step-by-Step Response</h3>
<ol>
<li><strong>Ensure the scene is safe</strong> — before helping anyone, make sure the hazard that caused the injury won't hurt you or others. If a machine is still running, if there's a chemical spill, or if there's an electrical hazard, secure the area first.</li>
<li><strong>Get help</strong> — notify your supervisor immediately. If the injury is serious (unconsciousness, severe bleeding, difficulty breathing, suspected fractures), call 911 or your facility's emergency number.</li>
<li><strong>Provide basic first aid if trained</strong> — apply pressure to bleeding wounds, help the person stay still if a back or neck injury is suspected, keep them calm and comfortable.</li>
<li><strong>Do not move a seriously injured person</strong> — unless they are in immediate danger (fire, chemical exposure), leave them in position until medical professionals arrive.</li>
<li><strong>Preserve the scene</strong> — do not clean up, move equipment, or alter the area where the injury occurred. Your employer needs to investigate.</li>
</ol>

<div class="highlight-box warning-box">
<h4>Critical: Always Report — Even "Minor" Injuries</h4>
<p>A small cut today can become an infection tomorrow. A "tweak" in your back can become a herniated disc next week. Report every injury, no matter how minor it seems. OSHA requires employers to track injuries, and unreported injuries can create serious problems for both you and your employer if they worsen.</p>
</div>

<h3>What to Tell Your Supervisor</h3>
<ul>
<li>What happened (be specific — "I slipped on a wet floor near the loading dock")</li>
<li>When it happened (date and approximate time)</li>
<li>Where it happened (exact location)</li>
<li>What body part is affected</li>
<li>Names of any witnesses</li>
<li>Whether you need medical attention</li>
</ul>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "First Aid vs. Recordable Injuries",
    content: `<div class="lesson-content">
<h2>First Aid vs. Recordable Injuries — Why It Matters</h2>

<p>Under OSHA's recordkeeping standard (<strong>29 CFR 1904</strong>), employers must record certain workplace injuries and illnesses on their OSHA 300 Log. But not every injury is "recordable." Understanding the difference between <strong>first aid</strong> and a <strong>recordable injury</strong> helps you understand why accurate reporting matters.</p>

<h3>What Is First Aid?</h3>
<p>OSHA defines first aid as specific, limited treatments listed in <strong>29 CFR 1904.7(a)</strong>. If the treatment stays within this list, the injury is first-aid-only and does NOT go on the OSHA 300 Log:</p>
<ul>
<li>Using non-prescription medications at non-prescription strength</li>
<li>Cleaning, flushing, or soaking wounds on the surface of the skin</li>
<li>Using wound closure devices like butterfly bandages or Steri-Strips</li>
<li>Using bandages during any visit to a healthcare provider</li>
<li>Applying hot or cold therapy</li>
<li>Using non-rigid means of support (elastic bandages, wraps)</li>
<li>Using temporary immobilization devices while transporting an injured person</li>
<li>Drilling a fingernail or toenail to relieve pressure, or draining fluid from a blister</li>
<li>Removing foreign bodies from the eye using irrigation or a cotton swab</li>
<li>Using finger guards or splints</li>
<li>Administering oxygen or using eye patches</li>
<li>Using massages (physical therapy is NOT first aid)</li>
</ul>

<h3>What Makes an Injury OSHA Recordable?</h3>
<p>An injury becomes recordable when any of these occur:</p>
<ul>
<li><strong>Death</strong></li>
<li><strong>Days away from work</strong> — the employee misses one or more days</li>
<li><strong>Restricted work or job transfer</strong> — the employee can't perform all normal duties</li>
<li><strong>Medical treatment beyond first aid</strong> — stitches, prescription medications, physical therapy</li>
<li><strong>Loss of consciousness</strong></li>
<li><strong>Significant injury diagnosed by a physician</strong> — fractures, punctured eardrums, chronic conditions</li>
</ul>

<div class="highlight-box">
<h4>The Key Takeaway</h4>
<p>As a new hire, you don't need to determine recordability yourself — that's your employer's responsibility. But you DO need to report every injury accurately and completely. The more detail you provide, the better your employer can make the right classification and get you the right care.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createQuizQuestion({ moduleId: mod1.id, question: "When a coworker is injured, what should you do BEFORE providing first aid?", options: ["Move them to a more comfortable location", "Ensure the scene is safe so the hazard won't injure you or others", "Start cleaning up the area", "Call their emergency contact"], correctIndex: 1, explanation: "Always ensure the scene is safe before approaching an injured person. If the hazard that caused the injury is still present (running machinery, chemical spill, electrical hazard), you could become the next victim.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "Which of the following is considered first aid under OSHA 29 CFR 1904.7(a)?", options: ["Prescription-strength pain medication", "Stitches to close a wound", "Using butterfly bandages to close a wound", "Physical therapy sessions"], correctIndex: 2, explanation: "Butterfly bandages and Steri-Strips are specifically listed as first aid treatments under 29 CFR 1904.7(a). Stitches, prescriptions, and physical therapy go beyond first aid and make an injury OSHA recordable.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "Why should you report even minor workplace injuries?", options: ["Because OSHA will fine you personally if you don't", "Because minor injuries can worsen over time, and accurate documentation protects both you and your employer", "Because your employer wants to fire people who get hurt", "Because it's only required for injuries that need medical attention"], correctIndex: 1, explanation: "Minor injuries can develop into serious conditions. A small cut can become infected, a tweak in the back can become a herniated disc. Reporting every injury — no matter how minor — ensures you're protected and your employer can properly track workplace conditions.", orderIndex: 2 });

  const mod2 = await storage.createModule({
    courseId: course.id,
    title: "Module 2: Documentation & Your Role in Prevention",
    description: "How injuries are documented and how your reporting helps prevent future incidents.",
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "How Injuries Are Documented",
    content: `<div class="lesson-content">
<h2>How Injuries Are Documented</h2>

<p>When you report a workplace injury, your employer is required to document it. This documentation serves multiple purposes: it ensures you get proper medical care, it helps identify patterns that prevent future injuries, and it fulfills OSHA's recordkeeping requirements.</p>

<h3>The Documentation Process</h3>
<ol>
<li><strong>Incident Report</strong> — Your employer will ask you (or a witness) to fill out an incident report describing what happened, when, where, and how. Be as specific and honest as possible.</li>
<li><strong>OSHA 300 Log</strong> — If the injury meets OSHA's recordability criteria, your employer records it on the OSHA 300 Log. This log tracks all recordable injuries and illnesses for the calendar year.</li>
<li><strong>OSHA 301 Form</strong> — A more detailed incident report that captures the full story of the injury for OSHA's records.</li>
<li><strong>Investigation</strong> — Your employer should investigate the incident to find the root cause and prevent it from happening again. This isn't about blame — it's about learning.</li>
</ol>

<h3>Why Accurate Reporting Matters</h3>
<p>The information you provide directly affects:</p>
<ul>
<li><strong>Your medical care</strong> — accurate details help providers give the right treatment</li>
<li><strong>Workers' compensation</strong> — if you need to file a claim, your incident report is the foundation</li>
<li><strong>Prevention</strong> — your report helps your employer identify and fix the hazard so no one else gets hurt</li>
<li><strong>OSHA compliance</strong> — accurate records protect your employer from fines and demonstrate good faith effort</li>
</ul>

<div class="highlight-box">
<h4>Tip: Write It Down While It's Fresh</h4>
<p>Details fade quickly after an incident. As soon as you're able, write down everything you remember — what you were doing, what happened, what you saw, heard, or felt. Witnesses should do the same. These notes don't have to be formal — they just need to be accurate.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createQuizQuestion({ moduleId: mod2.id, question: "What is the purpose of an incident investigation after a workplace injury?", options: ["To determine which employee was at fault and discipline them", "To find the root cause and prevent the same injury from happening again", "To satisfy insurance requirements only", "To determine if the employee was following all safety rules perfectly"], correctIndex: 1, explanation: "Incident investigations are about finding the root cause and preventing recurrence — not assigning blame. The goal is to learn from the incident and fix the underlying hazard or process failure.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "Which OSHA form is used to log all recordable injuries and illnesses for the calendar year?", options: ["OSHA 200 Log", "OSHA 300 Log", "OSHA 301 Form", "OSHA Incident Report"], correctIndex: 1, explanation: "The OSHA 300 Log is the annual log where employers record all OSHA-recordable workplace injuries and illnesses. The OSHA 301 is the detailed incident report form for each individual case.", orderIndex: 1 });

  console.log("  - Injury Reporting & First Aid Awareness seeded (2 modules, 3 lessons, 5 quiz questions)");
}

async function seedSlipsTrips(storage: IStorage) {
  const existing = await storage.getCourseByProductId("bns-slips-trips-falls");
  if (existing) {
    console.log("Slips, Trips & Falls Prevention already exists, skipping");
    return;
  }

  const course = await storage.createCourse({
    productId: "bns-slips-trips-falls",
    title: "Slips, Trips & Falls Prevention",
    description: "The #1 cause of workplace injuries across every industry. Learn practical prevention techniques, proper housekeeping, ladder safety basics, and how to protect yourself on walking and working surfaces.",
    category: "new_hire_safety",
    totalModules: 2,
    estimatedHours: 1,
    isActive: true,
  });

  const mod1 = await storage.createModule({
    courseId: course.id,
    title: "Module 1: Understanding Slips, Trips & Falls",
    description: "Why these injuries happen, how common they are, and the OSHA standards that protect you.",
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "The #1 Cause of Workplace Injuries",
    content: `<div class="lesson-content">
<h2>The #1 Cause of Workplace Injuries</h2>

<p>Slips, trips, and falls are the <strong>leading cause of workplace injuries</strong> in the United States, accounting for nearly <strong>30% of all non-fatal injuries</strong> across every industry. They happen in offices, warehouses, construction sites, retail stores, hospitals — everywhere.</p>

<p>According to the Bureau of Labor Statistics, falls on the same level (not from heights) result in an average of <strong>12 days away from work</strong> per incident. Falls from heights are even more severe and are the <strong>leading cause of death in the construction industry</strong>.</p>

<h3>What Causes Slips?</h3>
<p>A slip occurs when your foot loses traction with the walking surface:</p>
<ul>
<li>Wet or oily floors</li>
<li>Freshly mopped or waxed surfaces without warning signs</li>
<li>Loose gravel, sand, or debris on smooth surfaces</li>
<li>Weather conditions — rain, snow, and ice near entrances</li>
<li>Worn-out shoe soles with no grip</li>
</ul>

<h3>What Causes Trips?</h3>
<p>A trip occurs when your foot strikes an object or obstruction:</p>
<ul>
<li>Cables, cords, or hoses across walkways</li>
<li>Uneven floor surfaces, loose tiles, or raised carpet edges</li>
<li>Clutter, tools, or materials left in walking paths</li>
<li>Open drawers or cabinet doors</li>
<li>Poor lighting that hides obstacles</li>
</ul>

<h3>What Causes Falls?</h3>
<p>Falls can happen on the same level (from a slip or trip) or from an elevated surface:</p>
<ul>
<li>Ladders used improperly or on unstable surfaces</li>
<li>Unguarded edges, holes, or openings in floors</li>
<li>Standing on chairs, desks, or boxes instead of proper equipment</li>
<li>Missing or damaged handrails on stairs</li>
</ul>

<div class="highlight-box">
<h4>OSHA Standard: Walking-Working Surfaces</h4>
<p><strong>29 CFR 1910 Subpart D</strong> covers general industry requirements for walking-working surfaces. This standard requires employers to keep floors clean and dry, provide guardrails and handrails where needed, cover or guard floor holes, and ensure proper lighting in all walking areas.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "Housekeeping — Your First Line of Defense",
    content: `<div class="lesson-content">
<h2>Housekeeping — Your First Line of Defense</h2>

<p>Good housekeeping is the simplest and most effective way to prevent slips, trips, and falls. It doesn't require special equipment or training — it requires awareness and discipline.</p>

<h3>Housekeeping Best Practices</h3>
<ul>
<li><strong>Clean up spills immediately</strong> — if you see a spill, clean it up or report it. Don't walk past it and assume someone else will handle it.</li>
<li><strong>Keep walkways clear</strong> — never leave tools, materials, cords, or equipment in walking paths</li>
<li><strong>Close drawers and cabinet doors</strong> — open drawers in an office are one of the most common trip hazards</li>
<li><strong>Secure cords and cables</strong> — use cord covers or route cables along walls, never across walkways</li>
<li><strong>Use wet floor signs</strong> — any time a floor is wet from mopping, spills, or weather, place warning signs</li>
<li><strong>Report damaged flooring</strong> — torn carpet, loose tiles, uneven concrete, or damaged floor grates should be reported immediately</li>
<li><strong>Maintain adequate lighting</strong> — if a light is out in a stairwell, hallway, or work area, report it. You can't avoid what you can't see.</li>
</ul>

<h3>Footwear Matters</h3>
<p>Your shoes are your primary slip protection. Depending on your work environment, your employer may require specific footwear:</p>
<ul>
<li><strong>Non-slip soles</strong> — required in environments where floors can be wet or oily</li>
<li><strong>Steel-toe or composite-toe boots</strong> — for environments with heavy materials or falling object hazards</li>
<li><strong>Proper fit</strong> — shoes that are too loose or too worn increase your fall risk</li>
</ul>

<div class="highlight-box">
<h4>The 5-Second Rule</h4>
<p>Before you walk through any area, take 5 seconds to look at the walking surface ahead of you. Is it wet? Is there clutter? Is there a cord across the path? Is the lighting adequate? This simple scan takes almost no time and can save you from a painful injury.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createQuizQuestion({ moduleId: mod1.id, question: "What percentage of all non-fatal workplace injuries are caused by slips, trips, and falls?", options: ["About 10%", "About 20%", "About 30%", "About 50%"], correctIndex: 2, explanation: "Slips, trips, and falls account for nearly 30% of all non-fatal workplace injuries across every industry, making them the leading cause of workplace injuries in the United States.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "Which OSHA standard covers walking-working surface requirements in general industry?", options: ["29 CFR 1910 Subpart D", "29 CFR 1926 Subpart M", "29 CFR 1910.95", "29 CFR 1904.7"], correctIndex: 0, explanation: "29 CFR 1910 Subpart D covers walking-working surfaces in general industry, requiring employers to keep floors clean and dry, provide guardrails, cover floor holes, and ensure proper lighting.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "You notice a spill on the warehouse floor. What should you do?", options: ["Walk around it carefully and continue working", "Clean it up immediately or report it — don't walk past it", "Place a box over it so no one steps in it", "Wait for the cleaning crew to find it"], correctIndex: 1, explanation: "Spills should be cleaned up immediately or reported right away. Walking past a spill and assuming someone else will handle it is one of the most common reasons slip injuries occur.", orderIndex: 2 });

  const mod2 = await storage.createModule({
    courseId: course.id,
    title: "Module 2: Ladder Safety & Fall Prevention",
    description: "Basic ladder safety rules and how to prevent falls from elevated surfaces.",
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "Ladder Safety Basics",
    content: `<div class="lesson-content">
<h2>Ladder Safety Basics</h2>

<p>Ladder-related injuries send over <strong>100 people to the emergency room every day</strong> in the United States. Most of these injuries are entirely preventable by following basic safety rules.</p>

<h3>Before You Climb</h3>
<ul>
<li><strong>Inspect the ladder</strong> — check for damaged rungs, loose hardware, cracked rails, or missing feet</li>
<li><strong>Choose the right ladder</strong> — use a ladder rated for your weight plus the weight of your tools and materials</li>
<li><strong>Set it on a firm, level surface</strong> — never place a ladder on boxes, barrels, or unstable surfaces</li>
<li><strong>Use the 4-to-1 rule for extension ladders</strong> — for every 4 feet of height, the base should be 1 foot away from the wall</li>
<li><strong>Lock it</strong> — ensure all locks on extension and step ladders are fully engaged before climbing</li>
</ul>

<h3>While Climbing</h3>
<ul>
<li><strong>Maintain three points of contact</strong> — two hands and one foot, or two feet and one hand at all times</li>
<li><strong>Face the ladder</strong> — never climb with your back to the ladder</li>
<li><strong>Keep your belt buckle between the side rails</strong> — this prevents overreaching, the most common cause of ladder falls</li>
<li><strong>Never stand on the top two rungs of a step ladder</strong> — or the top three rungs of an extension ladder</li>
<li><strong>Don't carry heavy or bulky items</strong> — use a tool belt or have someone hand items to you</li>
</ul>

<div class="highlight-box warning-box">
<h4>Never Use a Chair, Desk, or Box as a Ladder</h4>
<p>This is one of the most common — and most dangerous — shortcuts in any workplace. Office chairs roll. Desks aren't designed for standing. Boxes collapse. If you need to reach something overhead, get a proper step stool or ladder. The few seconds you save aren't worth the injury.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createQuizQuestion({ moduleId: mod2.id, question: "What is the '4-to-1 rule' for setting up an extension ladder?", options: ["For every 4 feet of ladder height, the base should be 1 foot from the wall", "The ladder should be 4 feet taller than the surface you're reaching", "You should climb 4 rungs for every 1 minute of work", "The ladder should weigh 4 pounds per 1 foot of length"], correctIndex: 0, explanation: "The 4-to-1 rule means for every 4 feet of height to the point of support, the base of the ladder should be 1 foot away from the wall or structure. This creates the proper angle for stability.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "How many points of contact should you maintain while climbing a ladder?", options: ["One — your dominant hand", "Two — both feet", "Three — two hands and one foot, or two feet and one hand", "Four — both hands and both feet at all times"], correctIndex: 2, explanation: "The three-point-of-contact rule means you should always have two hands and one foot, or two feet and one hand on the ladder while climbing. This provides maximum stability and prevents falls.", orderIndex: 1 });

  console.log("  - Slips, Trips & Falls Prevention seeded (2 modules, 3 lessons, 5 quiz questions)");
}

async function seedHazCom(storage: IStorage) {
  const existing = await storage.getCourseByProductId("bns-hazcom-right-to-know");
  if (existing) {
    console.log("Hazard Communication (Right to Know) already exists, skipping");
    return;
  }

  const course = await storage.createCourse({
    productId: "bns-hazcom-right-to-know",
    title: "Hazard Communication (Right to Know)",
    description: "Every employee has the right to know what chemicals are in their workplace. Learn to read GHS labels, find Safety Data Sheets, and protect yourself from chemical hazards. Required by OSHA for any workplace with hazardous chemicals.",
    category: "new_hire_safety",
    totalModules: 2,
    estimatedHours: 1,
    isActive: true,
  });

  const mod1 = await storage.createModule({
    courseId: course.id,
    title: "Module 1: Your Right to Know",
    description: "Understanding OSHA's Hazard Communication Standard and what it means for you.",
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "The Hazard Communication Standard (HazCom)",
    content: `<div class="lesson-content">
<h2>The Hazard Communication Standard (HazCom)</h2>

<p>OSHA's Hazard Communication Standard — <strong>29 CFR 1910.1200</strong>, commonly called "HazCom" or the "Right to Know" standard — is one of the most important workplace safety regulations in existence. It ensures that every employee who works with or around hazardous chemicals knows:</p>
<ul>
<li><strong>What chemicals</strong> are in their workplace</li>
<li><strong>What hazards</strong> those chemicals present</li>
<li><strong>How to protect themselves</strong> from those hazards</li>
</ul>

<p>This standard applies to <strong>every workplace that uses hazardous chemicals</strong> — and that includes more workplaces than you might think. Cleaning products, paints, solvents, adhesives, lubricants, fuels, even some office products fall under HazCom.</p>

<h3>The Three Pillars of HazCom</h3>

<h4>1. Labels</h4>
<p>Every container of hazardous chemical must have a label that tells you what's inside and what hazards it presents. Under the Globally Harmonized System (GHS), labels include standardized pictograms, signal words, and hazard statements.</p>

<h4>2. Safety Data Sheets (SDS)</h4>
<p>Every hazardous chemical in your workplace must have a Safety Data Sheet — a detailed document that covers everything from the chemical's properties to emergency first aid measures. Your employer must make SDSs accessible to you at all times.</p>

<h4>3. Training</h4>
<p>Your employer must train you on the hazards of the chemicals you work with, how to read labels and SDSs, and how to protect yourself. This course is part of that training.</p>

<div class="highlight-box">
<h4>Your Right: Access to SDS at Any Time</h4>
<p>You have the right to access the Safety Data Sheet for any chemical in your workplace at any time during your shift. If you ask for an SDS and your employer refuses or cannot provide it, that is a violation of OSHA's HazCom standard, and you can file a complaint.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "Reading GHS Labels",
    content: `<div class="lesson-content">
<h2>Reading GHS Labels</h2>

<p>The <strong>Globally Harmonized System (GHS)</strong> standardized chemical labels worldwide so that no matter where a product is manufactured, the label format is the same. Here's what every GHS label includes:</p>

<h3>Label Elements</h3>

<h4>Product Identifier</h4>
<p>The name of the chemical or product — this is how you'll find the matching Safety Data Sheet.</p>

<h4>Signal Word</h4>
<p>Tells you the severity of the hazard:</p>
<ul>
<li><strong>"DANGER"</strong> — severe hazard (more serious)</li>
<li><strong>"WARNING"</strong> — less severe hazard</li>
</ul>

<h4>Pictograms</h4>
<p>Red-bordered diamond symbols that visually communicate the type of hazard. The most common pictograms you'll encounter:</p>
<ul>
<li><strong>Flame</strong> — flammable materials</li>
<li><strong>Exclamation Mark</strong> — irritant, skin sensitizer, or less acute toxicity</li>
<li><strong>Corrosion</strong> — corrosive to skin or metals</li>
<li><strong>Skull and Crossbones</strong> — acute toxicity (can cause death or serious harm)</li>
<li><strong>Health Hazard</strong> — carcinogen, respiratory sensitizer, or organ toxicity</li>
<li><strong>Environment</strong> — hazardous to aquatic environment</li>
</ul>

<h4>Hazard Statements</h4>
<p>Describe the nature of the hazard: "Causes severe skin burns and eye damage" or "May cause respiratory irritation."</p>

<h4>Precautionary Statements</h4>
<p>Tell you how to handle the product safely: "Wear protective gloves," "Use only outdoors or in well-ventilated area," "IF IN EYES: Rinse cautiously with water."</p>

<div class="highlight-box warning-box">
<h4>Never Use an Unlabeled Container</h4>
<p>If you find a container without a label — or with a damaged, unreadable label — do NOT use it. Report it to your supervisor immediately. Using an unknown chemical can result in serious injury, and transferring chemicals to unlabeled containers is a violation of OSHA's HazCom standard.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createQuizQuestion({ moduleId: mod1.id, question: "What does the OSHA Hazard Communication Standard (29 CFR 1910.1200) require?", options: ["That all chemicals be removed from the workplace", "That employees know what chemicals are in their workplace, the hazards they present, and how to protect themselves", "That only supervisors handle hazardous chemicals", "That chemicals be used only on the first shift"], correctIndex: 1, explanation: "OSHA's HazCom standard requires employers to inform employees about hazardous chemicals in the workplace through labels, Safety Data Sheets, and training.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "On a GHS label, what does the signal word 'DANGER' indicate?", options: ["The product is expired", "The product has a severe hazard", "The product requires supervisor approval to use", "The product is banned by OSHA"], correctIndex: 1, explanation: "'DANGER' is the signal word used for more severe hazards. 'WARNING' is used for less severe hazards. Both indicate the product requires caution, but 'DANGER' means the risk is more serious.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "You find an unlabeled container of liquid in your work area. What should you do?", options: ["Smell it to try to identify the contents", "Use it if it looks like the product you normally use", "Do not use it — report it to your supervisor immediately", "Pour it down the drain to be safe"], correctIndex: 2, explanation: "Never use, smell, taste, or dispose of an unlabeled chemical. Report it to your supervisor immediately. Using unknown chemicals can cause serious injury, and all containers must be properly labeled.", orderIndex: 2 });

  const mod2 = await storage.createModule({
    courseId: course.id,
    title: "Module 2: Safety Data Sheets & Protecting Yourself",
    description: "How to find and read SDSs, and practical steps to protect yourself from chemical hazards.",
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "Understanding Safety Data Sheets (SDS)",
    content: `<div class="lesson-content">
<h2>Understanding Safety Data Sheets (SDS)</h2>

<p>A Safety Data Sheet is a 16-section document that tells you everything you need to know about a hazardous chemical. You don't need to memorize all 16 sections, but you should know where to find the information that matters most to your safety.</p>

<h3>The Sections You Need to Know</h3>

<h4>Section 1: Identification</h4>
<p>Product name, manufacturer, recommended use, and emergency phone number.</p>

<h4>Section 2: Hazard(s) Identification</h4>
<p>GHS classification, pictograms, signal word, and hazard statements. This tells you what can go wrong.</p>

<h4>Section 4: First-Aid Measures</h4>
<p>What to do if someone is exposed — eye contact, skin contact, inhalation, or ingestion. This is critical in an emergency.</p>

<h4>Section 5: Fire-Fighting Measures</h4>
<p>What type of fire extinguisher to use, and whether the chemical produces toxic fumes when burned.</p>

<h4>Section 7: Handling and Storage</h4>
<p>How to safely handle and store the chemical — ventilation requirements, temperature limits, and incompatible materials.</p>

<h4>Section 8: Exposure Controls / Personal Protection</h4>
<p>What PPE is required — gloves, goggles, respirators, protective clothing. This section tells you exactly how to protect yourself.</p>

<div class="highlight-box">
<h4>Where to Find SDSs in Your Workplace</h4>
<p>Your employer must keep SDSs for every hazardous chemical in the workplace and make them accessible to you during your shift. They may be kept in a binder, on a computer, or through an online SDS management system. Ask your supervisor where to find them on your first day.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createQuizQuestion({ moduleId: mod2.id, question: "Which section of a Safety Data Sheet tells you what PPE is required when handling the chemical?", options: ["Section 2: Hazard Identification", "Section 4: First-Aid Measures", "Section 8: Exposure Controls / Personal Protection", "Section 14: Transport Information"], correctIndex: 2, explanation: "Section 8 of the SDS — Exposure Controls / Personal Protection — specifies the PPE required (gloves, goggles, respirators, etc.) and any engineering controls needed when working with the chemical.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "When can you access Safety Data Sheets for chemicals in your workplace?", options: ["Only during scheduled safety meetings", "Only when your supervisor is present", "At any time during your work shift", "Only after an incident occurs"], correctIndex: 2, explanation: "Under OSHA's HazCom standard, you have the right to access the SDS for any chemical in your workplace at any time during your work shift. This access cannot be restricted.", orderIndex: 1 });

  console.log("  - Hazard Communication (Right to Know) seeded (2 modules, 3 lessons, 5 quiz questions)");
}

async function seedPPE(storage: IStorage) {
  const existing = await storage.getCourseByProductId("bns-ppe-essentials");
  if (existing) {
    console.log("PPE Essentials already exists, skipping");
    return;
  }

  const course = await storage.createCourse({
    productId: "bns-ppe-essentials",
    title: "Personal Protective Equipment (PPE) Essentials",
    description: "Understand what PPE is required for your job, when to wear it, how to inspect it, and how to report damaged equipment. Covers hard hats, safety glasses, gloves, hearing protection, and high-visibility gear.",
    category: "new_hire_safety",
    totalModules: 2,
    estimatedHours: 1,
    isActive: true,
  });

  const mod1 = await storage.createModule({
    courseId: course.id,
    title: "Module 1: Understanding PPE Requirements",
    description: "What PPE is, why it's required, and your employer's obligations under OSHA.",
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "OSHA's PPE Standard & Your Employer's Obligations",
    content: `<div class="lesson-content">
<h2>OSHA's PPE Standard & Your Employer's Obligations</h2>

<p>Personal Protective Equipment is your <strong>last line of defense</strong> against workplace hazards. OSHA's PPE standard — <strong>29 CFR 1910 Subpart I</strong> — establishes requirements for when PPE is required, what type must be provided, and who pays for it.</p>

<h3>Key OSHA Requirements</h3>
<ul>
<li><strong>Hazard Assessment:</strong> Your employer must assess the workplace to determine what hazards exist and what PPE is needed to protect against them (29 CFR 1910.132(d))</li>
<li><strong>PPE Provided at No Cost:</strong> Your employer must provide required PPE at no cost to you. You should never have to buy your own safety glasses, hard hat, or hearing protection if it's required for your job (29 CFR 1910.132(h))</li>
<li><strong>Proper Fit:</strong> PPE must fit properly. Ill-fitting PPE can be as dangerous as no PPE at all — loose gloves get caught in machinery, oversized safety glasses leave gaps</li>
<li><strong>Training:</strong> Your employer must train you on when PPE is necessary, what PPE is required, how to put it on and take it off properly, its limitations, and how to maintain it</li>
</ul>

<h3>Types of PPE by Hazard</h3>

<h4>Head Protection</h4>
<p><strong>Hard hats</strong> — required where there's a risk of falling objects or bumping your head against fixed objects. Must meet ANSI Z89.1 standards.</p>

<h4>Eye and Face Protection</h4>
<p><strong>Safety glasses, goggles, face shields</strong> — required where there's a risk of flying particles, chemical splashes, dust, or intense light (welding). Must meet ANSI Z87.1 standards.</p>

<h4>Hand Protection</h4>
<p><strong>Gloves</strong> — type depends on the hazard: chemical-resistant gloves for chemicals, cut-resistant gloves for sharp materials, insulated gloves for extreme temperatures, leather gloves for rough work.</p>

<h4>Hearing Protection</h4>
<p><strong>Earplugs or earmuffs</strong> — required when noise levels exceed 85 decibels over an 8-hour time-weighted average (29 CFR 1910.95). If you have to raise your voice to talk to someone 3 feet away, hearing protection is likely needed.</p>

<h4>Foot Protection</h4>
<p><strong>Safety-toe boots</strong> — required where there's risk of falling objects, puncture hazards, or electrical hazards. Must meet ASTM F2413 standards.</p>

<h4>High-Visibility Clothing</h4>
<p><strong>Hi-vis vests, shirts, jackets</strong> — required in areas where workers are near vehicle traffic or mobile equipment.</p>

<div class="highlight-box">
<h4>Remember: PPE Is the Last Resort</h4>
<p>PPE doesn't eliminate the hazard — it protects you IF you're exposed to it. OSHA's hierarchy of controls says employers should first try to eliminate the hazard, then engineer controls, then administrative controls. PPE comes last because it depends entirely on you wearing it correctly, every time.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "Inspecting and Maintaining Your PPE",
    content: `<div class="lesson-content">
<h2>Inspecting and Maintaining Your PPE</h2>

<p>PPE only protects you if it's in good condition. Damaged, worn-out, or improperly maintained PPE can give you a false sense of security — or even create new hazards.</p>

<h3>Before Every Use: The Quick Inspection</h3>
<ul>
<li><strong>Hard hats:</strong> Check for cracks, dents, or signs of impact. Check the suspension system inside — if the straps are frayed, cracked, or lose their elasticity, replace them. Hard hats should be replaced after any significant impact, even if no visible damage exists.</li>
<li><strong>Safety glasses/goggles:</strong> Check for scratches, cracks, or loose frames. Scratched lenses reduce visibility and can cause eye strain. Replace them when visibility is impaired.</li>
<li><strong>Gloves:</strong> Check for tears, holes, punctures, or chemical degradation (stiffness, swelling, discoloration). Chemical-resistant gloves have a limited service life — check with your supervisor.</li>
<li><strong>Hearing protection:</strong> Earplugs should be clean and pliable — not hardened or cracked. Earmuff cushions should be soft and create a complete seal. Replace if the seal is compromised.</li>
<li><strong>Safety boots:</strong> Check soles for excessive wear, ensure steel/composite toe is intact, check for sole separation.</li>
</ul>

<h3>When to Replace PPE</h3>
<ul>
<li>After any impact or exposure event (even if it looks fine)</li>
<li>When you see visible damage — cracks, tears, degradation</li>
<li>When it no longer fits properly</li>
<li>According to manufacturer replacement schedules</li>
<li>When your supervisor or safety manager directs replacement</li>
</ul>

<div class="highlight-box">
<h4>Damaged PPE? Report It Immediately</h4>
<p>If your PPE is damaged or defective, do not continue working in the hazard area. Report it to your supervisor immediately. Your employer is required to replace damaged PPE at no cost to you. Never modify, tape, glue, or improvise repairs on PPE — it compromises the protection.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createQuizQuestion({ moduleId: mod1.id, question: "Under OSHA, who is responsible for paying for required PPE?", options: ["The employee must buy their own PPE", "The employer must provide required PPE at no cost to the employee", "The cost is split 50/50 between employer and employee", "PPE costs are deducted from the employee's paycheck"], correctIndex: 1, explanation: "Under 29 CFR 1910.132(h), employers must provide required PPE at no cost to employees. You should never have to buy safety equipment that is required for your job.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "When should you replace a hard hat?", options: ["Only when it's more than 5 years old", "After any significant impact, even if no visible damage exists", "Only when your supervisor tells you to", "Only when you can see a crack"], correctIndex: 1, explanation: "Hard hats should be replaced after any significant impact because internal damage may not be visible. The impact can compromise the shell's structural integrity even without an obvious crack or dent.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "In OSHA's hierarchy of controls, where does PPE fall?", options: ["First — it's the most important control", "Second — after engineering controls", "Last — it's the last line of defense when other controls aren't feasible", "PPE is not part of the hierarchy of controls"], correctIndex: 2, explanation: "PPE is the last resort in OSHA's hierarchy of controls. The preferred order is: elimination, substitution, engineering controls, administrative controls, and finally PPE. PPE doesn't remove the hazard — it just protects the worker if they're exposed.", orderIndex: 2 });

  const mod2 = await storage.createModule({
    courseId: course.id,
    title: "Module 2: Wearing PPE Correctly",
    description: "How to properly wear, adjust, and care for your PPE.",
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "Proper Use and Common Mistakes",
    content: `<div class="lesson-content">
<h2>Proper Use and Common Mistakes</h2>

<p>Having PPE isn't enough — you have to wear it correctly. Improperly worn PPE is almost as bad as no PPE at all. Here are the most common mistakes and how to avoid them.</p>

<h3>Common PPE Mistakes</h3>

<h4>Safety Glasses</h4>
<ul>
<li><strong>Wrong:</strong> Wearing them on top of your head or pushed down on your nose</li>
<li><strong>Right:</strong> Snug against your face with no gaps on the sides or top. Side shields should be in place if required.</li>
</ul>

<h4>Hearing Protection</h4>
<ul>
<li><strong>Wrong:</strong> Inserting foam earplugs without rolling them first — they don't seal properly</li>
<li><strong>Right:</strong> Roll the earplug into a tight cylinder, pull your ear up and back to straighten the ear canal, insert the plug, and hold it until it expands fully. If you can hear normal conversation clearly, your earplugs aren't inserted correctly.</li>
</ul>

<h4>Gloves</h4>
<ul>
<li><strong>Wrong:</strong> Wearing gloves that are too big — loose gloves get caught in moving parts</li>
<li><strong>Right:</strong> Gloves should fit snugly without restricting movement. Different tasks require different glove types — check with your supervisor.</li>
</ul>

<h4>Hard Hats</h4>
<ul>
<li><strong>Wrong:</strong> Wearing it backwards (unless it's specifically designed to be reversible), removing the suspension system, or wearing it over a baseball cap</li>
<li><strong>Right:</strong> Suspension adjusted to sit level on your head, about 1-1.25 inches above your eyebrows. The suspension system absorbs impact — never remove it.</li>
</ul>

<h4>Respirators</h4>
<ul>
<li><strong>Wrong:</strong> Using a respirator without being fit-tested or medically cleared</li>
<li><strong>Right:</strong> Respirator use requires a medical evaluation AND a fit test per OSHA 29 CFR 1910.134. A dust mask and a respirator are NOT the same thing. If your job requires a respirator, your employer must provide medical clearance and fit testing.</li>
</ul>

<div class="highlight-box">
<h4>The Bottom Line</h4>
<p>PPE works when you wear it correctly, inspect it before each use, and replace it when it's damaged. It's the last barrier between you and a workplace hazard. Treat it like the safety equipment it is — not a suggestion.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createQuizQuestion({ moduleId: mod2.id, question: "What is the correct way to insert a foam earplug?", options: ["Just push it into your ear", "Roll it into a tight cylinder, pull your ear up and back, insert, and hold until it expands", "Cut it in half so it fits better", "Wet it first so it slides in easier"], correctIndex: 1, explanation: "Foam earplugs must be rolled into a tight cylinder, then inserted while pulling the ear up and back to straighten the ear canal. Hold the plug in place until it fully expands. If you can hear normal conversation clearly, it's not inserted correctly.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "What is required before an employee can use a respirator on the job?", options: ["Just watching a training video", "A medical evaluation AND a fit test per OSHA 29 CFR 1910.134", "Supervisor verbal approval only", "Nothing — any employee can use a respirator whenever they want"], correctIndex: 1, explanation: "OSHA 29 CFR 1910.134 requires a medical evaluation to ensure the employee can safely wear a respirator, AND a fit test to ensure the specific respirator model creates a proper seal on their face. Both are required before any respirator use.", orderIndex: 1 });

  console.log("  - PPE Essentials seeded (2 modules, 3 lessons, 5 quiz questions)");
}

async function seedDrugAlcoholAwareness(storage: IStorage) {
  const existing = await storage.getCourseByProductId("bns-drug-alcohol-awareness");
  if (existing) {
    console.log("Drug & Alcohol Awareness already exists, skipping");
    return;
  }

  const course = await storage.createCourse({
    productId: "bns-drug-alcohol-awareness",
    title: "Drug & Alcohol Awareness in the Workplace",
    description: "Understand your company's drug and alcohol policy, what to expect if your company conducts workplace testing, the substances typically screened, and why a drug-free workplace matters for everyone's safety.",
    category: "new_hire_safety",
    totalModules: 2,
    estimatedHours: 1,
    isActive: true,
  });

  const mod1 = await storage.createModule({
    courseId: course.id,
    title: "Module 1: Your Company's Drug & Alcohol Policy",
    description: "Understanding workplace drug and alcohol policies, why they exist, and what they mean for you as an employee.",
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "Why Companies Have Drug & Alcohol Policies",
    content: `<div class="lesson-content">
<h2>Why Companies Have Drug & Alcohol Policies</h2>

<p>Many employers maintain drug and alcohol policies as part of their commitment to workplace safety. These policies exist for one fundamental reason: <strong>impairment on the job puts everyone at risk.</strong></p>

<p>Whether your company operates heavy machinery, drives vehicles, handles chemicals, or works in an office environment — substance impairment affects judgment, reaction time, coordination, and decision-making. It's not about personal choices outside of work. It's about making sure everyone goes home safe at the end of the day.</p>

<h3>What a Typical Workplace Drug & Alcohol Policy Covers</h3>
<p>Company policies vary, but most drug and alcohol policies address the following:</p>
<ul>
<li><strong>Prohibited conduct:</strong> Being under the influence of drugs or alcohol during work hours, on company property, or while performing job duties</li>
<li><strong>Prescription medication disclosure:</strong> If you take prescription medication that could affect your ability to perform your job safely, most policies require you to notify your supervisor or HR — not the medication itself, but whether it could impair your ability to work safely</li>
<li><strong>Consequences of violations:</strong> What happens if an employee violates the policy — this could range from referral to an Employee Assistance Program (EAP) to termination, depending on the company and the circumstances</li>
</ul>

<div class="highlight-box">
<h4>Important: Every Company's Policy Is Different</h4>
<p>Not all companies conduct drug testing. Not all companies test for the same substances. Some companies have zero-tolerance policies; others offer assistance programs. <strong>It is your responsibility to read and understand your company's specific drug and alcohol policy.</strong> If you have questions about your company's policy, ask your HR department or supervisor.</p>
</div>

<h3>The Safety Connection</h3>
<p>According to the National Safety Council:</p>
<ul>
<li>Employees who use drugs are <strong>3.6 times more likely</strong> to be involved in a workplace accident</li>
<li>They are <strong>5 times more likely</strong> to file a workers' compensation claim</li>
<li>Substance use contributes to an estimated <strong>65% of on-the-job accidents</strong></li>
</ul>
<p>Drug and alcohol policies aren't punitive — they're protective. They protect you, your coworkers, and the public.</p>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "Types of Workplace Drug Testing",
    content: `<div class="lesson-content">
<h2>Types of Workplace Drug Testing</h2>

<p>If your company has a drug testing program, there are several types of tests you may encounter. Not every company uses all of these — it depends on your company's policy, your industry, and whether your position is safety-sensitive.</p>

<h3>Common Types of Workplace Drug Tests</h3>

<h4>Pre-Employment Testing</h4>
<p>Many companies require a drug test as a condition of employment. This test is typically conducted after a job offer has been made but before your start date. Refusing or failing a pre-employment drug test usually means the job offer is withdrawn.</p>

<h4>Reasonable Suspicion Testing</h4>
<p>If a trained supervisor observes behavior that suggests impairment — slurred speech, unsteady movement, the smell of alcohol, unusual behavior — they may direct you to take a drug or alcohol test. This is not random; it's based on documented, observable signs.</p>

<h4>Post-Accident Testing</h4>
<p>Some companies require drug and alcohol testing after a workplace accident or injury, particularly if the incident involved property damage, injury, or a near-miss. The purpose is to determine whether substance use was a contributing factor.</p>

<h4>Random Testing</h4>
<p>Some companies — particularly those in safety-sensitive industries — conduct random drug testing. If your company has a random testing program, employees are selected using a computer-generated random process. <strong>Being selected is not an accusation</strong> — it simply means your name was randomly chosen from the testing pool. If your company participates in random testing, your policy will state this clearly.</p>

<h4>Return-to-Duty and Follow-Up Testing</h4>
<p>If an employee has previously violated the drug and alcohol policy and has been allowed to return to work, they will typically be subject to return-to-duty testing and follow-up testing for a defined period.</p>

<div class="highlight-box">
<h4>Know Your Company's Testing Policy</h4>
<p>Whether your company tests and what they test for depends entirely on company policy. Some companies only do pre-employment testing. Others test randomly. Some don't test at all. Review your employee handbook or ask HR to understand what applies to you.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createQuizQuestion({ moduleId: mod1.id, question: "Why do companies have drug and alcohol policies?", options: ["To control employees' personal lives", "Because impairment on the job puts everyone at risk and policies protect all employees", "Because it's required by federal law for every company", "To reduce healthcare costs only"], correctIndex: 1, explanation: "Drug and alcohol policies exist because impairment affects judgment, coordination, and reaction time — putting the impaired employee, their coworkers, and the public at risk. These policies are protective, not punitive.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "If your company has a random drug testing program and your name is selected, what does it mean?", options: ["You are being accused of drug use", "Your supervisor suspects you of impairment", "Your name was randomly selected by a computer — it is not an accusation", "You failed a previous drug test"], correctIndex: 2, explanation: "Random selection is computer-generated and is not based on suspicion or accusation. It's a standard part of workplace testing programs, particularly in safety-sensitive industries.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "If you take prescription medication that could affect your ability to work safely, what should you do?", options: ["Keep it private — it's none of your employer's business", "Stop taking the medication while at work", "Notify your supervisor or HR as required by your company policy", "Only disclose it if you're involved in an accident"], correctIndex: 2, explanation: "Most company policies require employees to disclose if prescription medication could impair their ability to perform job duties safely. You don't have to share the medication name — just whether it could affect your work performance or safety.", orderIndex: 2 });

  const mod2 = await storage.createModule({
    courseId: course.id,
    title: "Module 2: Substances, Testing, and Resources",
    description: "What substances are typically screened, the testing process, and employee assistance resources.",
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "Common Substances Screened & The Testing Process",
    content: `<div class="lesson-content">
<h2>Common Substances Screened & The Testing Process</h2>

<p>If your company conducts drug testing, the specific substances screened depend on your company's policy. However, most workplace drug panels test for some or all of the following:</p>

<h3>Common Substances in Workplace Drug Panels</h3>
<ul>
<li><strong>Marijuana (THC)</strong> — regardless of state legalization, many employers still test for THC as part of their workplace policy. Your company's policy determines whether this applies to you.</li>
<li><strong>Cocaine</strong></li>
<li><strong>Opiates/Opioids</strong> — including heroin, codeine, morphine, and in expanded panels: oxycodone, hydrocodone</li>
<li><strong>Amphetamines</strong> — including methamphetamine</li>
<li><strong>Phencyclidine (PCP)</strong></li>
<li><strong>Alcohol</strong> — tested separately, usually via breath alcohol test</li>
</ul>

<p>Some companies use expanded panels that also test for benzodiazepines, barbiturates, and synthetic opioids.</p>

<h3>The Testing Process</h3>
<p>If you are selected for a drug test, here's what to expect:</p>
<ol>
<li><strong>Notification:</strong> You'll be notified by your supervisor or HR. Timing varies by test type — random tests usually require immediate reporting.</li>
<li><strong>Collection:</strong> You'll report to a designated collection site. The collector follows strict chain-of-custody procedures to ensure the integrity of your sample.</li>
<li><strong>Specimen:</strong> Most workplace tests use urine specimens. Some companies use hair, saliva, or blood testing depending on their policy.</li>
<li><strong>Results:</strong> Results are reviewed and reported to your employer per company policy. If you test positive and believe it's due to a legitimate prescription, you'll typically have an opportunity to provide documentation.</li>
</ol>

<div class="highlight-box">
<h4>A Note About State Marijuana Laws</h4>
<p>Even in states where marijuana is legal for recreational or medical use, <strong>employers can still prohibit its use under their workplace policy</strong>. State legalization does not override your company's drug and alcohol policy. If your company's policy prohibits marijuana, that prohibition applies regardless of state law. Check your company's specific policy for guidance.</p>
</div>

<h3>Employee Assistance Programs (EAP)</h3>
<p>Many companies offer Employee Assistance Programs that provide confidential support for employees dealing with substance use, mental health, family issues, or personal challenges. EAP services are typically <strong>free, confidential, and available to all employees</strong>. If your company offers an EAP, it's a resource — not a trap. Using it proactively demonstrates responsibility and is often protected from disciplinary action when accessed voluntarily.</p>
</div>`,
    orderIndex: 0,
  });

  await storage.createQuizQuestion({ moduleId: mod2.id, question: "If marijuana is legal in your state, can your employer still prohibit it under their workplace policy?", options: ["No — state law overrides company policy", "Yes — employers can prohibit marijuana under their workplace policy regardless of state law", "Only if you work for the federal government", "Only if you're in a safety-sensitive position"], correctIndex: 1, explanation: "State legalization of marijuana does not override an employer's right to maintain a drug-free workplace policy. If your company's policy prohibits marijuana use, that policy applies regardless of state law.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "What is an Employee Assistance Program (EAP)?", options: ["A disciplinary program for employees who fail drug tests", "A company insurance plan", "A confidential support program for substance use, mental health, and personal challenges — typically free to all employees", "A government reporting requirement"], correctIndex: 2, explanation: "EAPs are confidential, free resources that help employees with substance use, mental health, family issues, and personal challenges. They are a support tool, not a disciplinary measure, and voluntary use is often protected.", orderIndex: 1 });

  console.log("  - Drug & Alcohol Awareness seeded (2 modules, 3 lessons, 5 quiz questions)");
}
