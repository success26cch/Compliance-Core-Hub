import type { IStorage } from "./storage";

export async function seedDOTCourse(storage: IStorage) {
  const existing = await storage.getCourseByProductId("course-dot-medical");
  if (existing) {
    console.log("DOT Medical Certification course already exists, skipping seed");
    return existing;
  }

  const course = await storage.createCourse({
    productId: "course-dot-medical",
    title: "DOT Medical Certification (Physicals)",
    description: "Comprehensive course covering DOT physical requirements, disqualifying conditions, medical holds, the clearance process, and documentation standards. Based on FMCSA 49 CFR 391.41.",
    category: "occupational_health",
    totalModules: 6,
    estimatedHours: 4,
    isActive: true,
  });

  // ===== MODULE 1: The Mandate and Requirements =====
  const mod1 = await storage.createModule({
    courseId: course.id,
    title: "Chapter 1: The Mandate and Requirements",
    description: "Who needs a DOT physical, what the examination entails, and the core federal standards a driver must meet.",
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "1.1 Who Needs a DOT Physical (The Mandate)",
    content: `<div class="lesson-content">
<h2>Who Needs a DOT Physical?</h2>
<p>The Federal Motor Carrier Safety Administration (FMCSA) defines the criteria requiring a DOT medical examination under <strong>49 CFR 391.41</strong>.</p>

<h3>A DOT physical is required for any driver who operates:</h3>
<ul>
<li><strong>A Commercial Motor Vehicle (CMV)</strong> with a Gross Vehicle Weight Rating (GVWR) or Gross Combination Weight Rating (GCWR) of <strong>10,001 lbs or more</strong></li>
<li><strong>A vehicle transporting 16 or more passengers</strong> (including the driver)</li>
<li><strong>A vehicle hauling placarded Hazardous Materials</strong></li>
</ul>

<div class="highlight-box">
<h4>Examination Frequency</h4>
<p>DOT physicals must generally be renewed <strong>every 24 months (2 years)</strong>. However, certain medical conditions may result in shorter certification periods (e.g., 12 months for insulin-treated diabetes or staged hypertension).</p>
</div>

<h3>Key Takeaway</h3>
<p>If a driver operates any vehicle meeting the above criteria in interstate or intrastate commerce, they must hold a valid Medical Examiner's Certificate (MEC) at all times while driving. Failure to maintain a current MEC means the driver is <strong>immediately prohibited</strong> from operating a CMV.</p>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "1.2 The DOT Physical Components (The Long Form)",
    content: `<div class="lesson-content">
<h2>What Does the DOT Physical Examination Include?</h2>
<p>The DOT physical exam uses the <strong>Medical Examination Report (MER) Form MCSA-5875</strong>, commonly known as "The Long Form." This is the detailed document that captures every aspect of the examination.</p>

<h3>Examination Components</h3>

<h4>1. Medical History Review</h4>
<p>The driver must provide a complete and honest medical history, including all current medications, past surgeries, chronic conditions, and hospitalizations. <strong>Falsifying medical history is a federal violation.</strong></p>

<h4>2. Vision Test</h4>
<ul>
<li><strong>Acuity:</strong> Must achieve at least <strong>20/40</strong> in each eye (with or without corrective lenses)</li>
<li><strong>Peripheral Vision:</strong> Must have at least <strong>70 degrees</strong> of horizontal vision in each eye</li>
<li>Color vision is also assessed (ability to distinguish traffic signal colors)</li>
</ul>

<h4>3. Hearing Test</h4>
<ul>
<li>Must be able to perceive a <strong>forced whisper at 5 feet</strong> in the better ear (with or without hearing aid)</li>
<li>If the whisper test is failed, audiometric testing may be used as an alternative</li>
</ul>

<h4>4. Blood Pressure / Pulse Check</h4>
<ul>
<li>Blood pressure is measured and directly impacts certification duration</li>
<li>Must be <strong>≤ 140/90 mmHg</strong> for a full 2-year certification</li>
<li>Higher readings result in shorter certification periods or medical hold</li>
</ul>

<h4>5. Urinalysis</h4>
<ul>
<li>Tests for <strong>underlying medical conditions</strong> such as diabetes (glucose levels) and kidney disease (protein levels)</li>
<li><strong>Important:</strong> This is <strong>NOT</strong> a drug screen. The urinalysis at a DOT physical does not test for controlled substances.</li>
</ul>

<div class="highlight-box">
<h4>Common Misconception</h4>
<p>Many people confuse the DOT physical urinalysis with a drug test. They are completely separate. A DOT drug screen follows 49 CFR Part 40 and is a standalone test, typically performed at different times and under different protocols.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod1.id,
    title: "1.3 Role of the Certified Medical Examiner (CME)",
    content: `<div class="lesson-content">
<h2>The Certified Medical Examiner (CME)</h2>
<p>Not just any doctor can perform a DOT physical. The examination <strong>must</strong> be performed by a medical professional listed on the <strong>FMCSA National Registry of Certified Medical Examiners (NRCME)</strong>.</p>

<h3>What is the NRCME?</h3>
<p>The National Registry is a federal database of healthcare professionals who have completed specialized training and passed a certification test on FMCSA physical qualification standards. This includes:</p>
<ul>
<li>Medical Doctors (MDs)</li>
<li>Doctors of Osteopathy (DOs)</li>
<li>Physician Assistants (PAs)</li>
<li>Advanced Practice Registered Nurses (APRNs)</li>
<li>Chiropractors (DCs) — limited scope in some states</li>
</ul>

<h3>The CME's Authority</h3>
<p>The CME is the <strong>sole authority</strong> to determine fitness for duty. Key responsibilities include:</p>
<ul>
<li>Performing the complete medical examination using Form MCSA-5875</li>
<li>Making the final determination: <strong>Meets Standards</strong>, <strong>Does Not Meet Standards</strong>, or <strong>Determination Pending</strong> (Medical Hold)</li>
<li>Issuing the Medical Examiner's Certificate (MEC, Form MCSA-5876) — the "DOT Card"</li>
<li>Reporting examination results to the FMCSA</li>
</ul>

<div class="highlight-box">
<h4>Verify Your Examiner</h4>
<p>Employers should always verify that their occupational health clinic uses a CME listed on the National Registry. An examination performed by a non-registered provider is <strong>invalid</strong> and will not result in a valid MEC.</p>
<p>Search the registry at: <a href="https://nationalregistry.fmcsa.dot.gov" target="_blank">nationalregistry.fmcsa.dot.gov</a></p>
</div>
</div>`,
    orderIndex: 2,
  });

  // Module 1 Quiz
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "What is the minimum Gross Vehicle Weight Rating (GVWR) that requires a driver to have a DOT physical?", options: ["5,000 lbs", "8,000 lbs", "10,001 lbs", "15,000 lbs"], correctIndex: 2, explanation: "Under 49 CFR 391.41, a DOT physical is required for any CMV with a GVWR/GCWR of 10,001 lbs or more.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "How often must a DOT physical generally be renewed?", options: ["Every 12 months", "Every 24 months", "Every 36 months", "Every 5 years"], correctIndex: 1, explanation: "The standard DOT physical certification period is 24 months (2 years), though certain conditions may result in shorter periods.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "What does the urinalysis at a DOT physical test for?", options: ["Drug use", "Alcohol levels", "Underlying medical conditions like diabetes", "All of the above"], correctIndex: 2, explanation: "The DOT physical urinalysis tests for underlying medical conditions such as diabetes and kidney disease. It is NOT a drug screen.", orderIndex: 2 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "Who is authorized to perform a DOT physical examination?", options: ["Any licensed physician", "Only MDs and DOs", "A medical professional on the FMCSA National Registry (NRCME)", "Any nurse practitioner"], correctIndex: 2, explanation: "DOT physicals must be performed by a Certified Medical Examiner listed on the FMCSA National Registry of Certified Medical Examiners.", orderIndex: 3 });
  await storage.createQuizQuestion({ moduleId: mod1.id, question: "What is the minimum visual acuity required for a DOT physical?", options: ["20/20 in each eye", "20/40 in each eye", "20/50 in each eye", "20/30 in the better eye"], correctIndex: 1, explanation: "Drivers must achieve at least 20/40 acuity in each eye, with or without corrective lenses.", orderIndex: 4 });

  // ===== MODULE 2: Health Issues and Disqualifying Conditions =====
  const mod2 = await storage.createModule({
    courseId: course.id,
    title: "Chapter 2: Health Issues and Disqualifying Conditions",
    description: "Specific health concerns that must be managed prior to the physical and conditions that are automatically or potentially disqualifying.",
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "2.1 Pre-Physical Management: What to Address",
    content: `<div class="lesson-content">
<h2>Preparing for the DOT Physical</h2>
<p>Proper preparation is the single most important factor in preventing delays, Medical Holds, and unnecessary return visits. This section outlines the crucial steps a driver should take <strong>before</strong> the exam.</p>

<h3>What the Driver Must Bring</h3>

<h4>1. Complete Medication List</h4>
<p>Every medication the driver takes — prescription, over-the-counter, and supplements — must be documented with:</p>
<ul>
<li>Medication name</li>
<li>Dosage and frequency</li>
<li>Prescribing doctor's name and contact information</li>
</ul>

<h4>2. CPAP Compliance Data (If Applicable)</h4>
<p>Drivers diagnosed with Sleep Apnea who use a CPAP machine must bring a <strong>90-day compliance report</strong> showing:</p>
<ul>
<li>Usage of at least <strong>4 hours per night</strong></li>
<li>On at least <strong>70% of nights</strong></li>
</ul>

<h4>3. Blood Sugar Logs / Recent HbA1c (If Diabetic)</h4>
<p>Diabetic drivers should bring:</p>
<ul>
<li>Recent HbA1c results (within the last 6 months)</li>
<li>Blood sugar monitoring logs</li>
<li>For insulin-treated diabetes: the <strong>MCSA-5870</strong> form completed by the treating provider within 45 days of the exam</li>
</ul>

<h4>4. Clearance Letters</h4>
<p>Any driver with a history of cardiovascular issues, neurological conditions, or other specialist-managed conditions should obtain clearance letters in advance (see Section 2.3).</p>

<div class="highlight-box">
<h4>Employer Best Practice</h4>
<p>Send drivers a preparation checklist at least <strong>2 weeks before</strong> their scheduled DOT physical. This gives them time to obtain any needed documentation and prevents costly Medical Holds.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "2.2 Automatically Disqualifying Conditions",
    content: `<div class="lesson-content">
<h2>Automatically Disqualifying Conditions</h2>
<p>Certain medical conditions result in <strong>immediate disqualification</strong> from operating a CMV until an FMCSA exemption is obtained. These conditions present an unacceptable risk of sudden incapacitation while driving.</p>

<h3>Disqualifying Conditions</h3>

<h4>1. Epilepsy / Active Seizure Disorder</h4>
<p>Any driver with an active seizure disorder or a diagnosis of epilepsy is disqualified. An exemption may be available for drivers who have been seizure-free for a defined period and meet specific FMCSA criteria.</p>

<h4>2. Insulin-Treated Diabetes Mellitus (Without FMCSA Exemption)</h4>
<p>Drivers who require insulin to manage diabetes must obtain an <strong>FMCSA Insulin-Treated Diabetes Mellitus (ITDM) exemption</strong>. Without this exemption, insulin use is disqualifying. The exemption process requires:</p>
<ul>
<li>Completion of Form MCSA-5870 by the treating endocrinologist</li>
<li>No severe hypoglycemic episodes (loss of consciousness) in the past 12 months</li>
<li>Annual recertification</li>
</ul>

<h4>3. Meniere's Disease / Inner Ear Disorders</h4>
<p>Conditions causing recurring vertigo, dizziness, or balance disturbances — such as Meniere's Disease — are disqualifying due to the risk of sudden incapacitation.</p>

<h4>4. Current Diagnosis of Heart Disease with Chest Pain/Angina</h4>
<p>A driver currently experiencing chest pain or angina associated with heart disease is disqualified. Clearance from a cardiologist confirming the condition is stable and the driver is medically optimized is required before certification can proceed.</p>

<div class="highlight-box warning-box">
<h4>Important Note</h4>
<p>These conditions are <strong>not permanent career-enders</strong> in most cases. With proper treatment, documentation, and in some cases an FMCSA exemption, many drivers can return to service. The key is proactive medical management and compliance with the exemption process.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod2.id,
    title: "2.3 Common Disqualifying Concerns & Required Clearance",
    content: `<div class="lesson-content">
<h2>Conditions That Can Be Certified — With Documentation</h2>
<p>These conditions are <strong>not automatically disqualifying</strong> but require specific documentation and clearance from specialists before the CME can certify the driver.</p>

<h3>Hypertension (High Blood Pressure)</h3>
<table>
<tr><th>Blood Pressure Reading</th><th>Certification</th></tr>
<tr><td>≤ 140/90 mmHg</td><td>Full 2-year certification</td></tr>
<tr><td>Stage 1: 140-159 / 90-99</td><td>1-year certification</td></tr>
<tr><td>Stage 2: 160-179 / 100-109</td><td>Temporary, requires follow-up within 3 months</td></tr>
<tr><td>Stage 3: ≥ 180/110</td><td>Disqualified until controlled</td></tr>
</table>
<p><strong>Required:</strong> Current medication list and ideally a recent blood pressure log or clearance letter from the treating provider.</p>

<h3>Cardiovascular History</h3>
<p>Drivers with a history of heart attack, bypass surgery, stents, or pacemaker implantation must provide:</p>
<ul>
<li>A <strong>clearance letter from a cardiologist</strong> (dated within the last year) stating the driver is medically optimized and safe to drive a CMV</li>
<li>Recent <strong>EKG, stress test results, and/or echocardiogram</strong> results</li>
</ul>

<h3>Sleep Apnea (OSA)</h3>
<p>Untreated or poorly managed Obstructive Sleep Apnea is disqualifying due to the risk of excessive daytime sleepiness. Required documentation:</p>
<ul>
<li><strong>CPAP Compliance Report:</strong> At least 4 hours per night on 70% of nights over the last 90 days</li>
<li><strong>Clearance letter</strong> from the sleep specialist</li>
</ul>

<h3>Psychiatric Conditions</h3>
<p>Conditions such as severe depression, PTSD, and ADHD must be stable and medication must not cause excessive sedation or affect cognitive ability. Required:</p>
<ul>
<li>Clearance letter from the treating psychiatrist or therapist</li>
<li>Complete medication list</li>
</ul>

<h3>Neurological Issues</h3>
<p>Drivers with a history of stroke or head injuries require:</p>
<ul>
<li>Clearance letter from a neurologist</li>
<li>Documentation of the diagnosis, treatment, and stability</li>
<li>Confirmation of seizure-free status for the required time frame</li>
</ul>
</div>`,
    orderIndex: 2,
  });

  // Module 2 Quiz
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "Which of the following is an automatically disqualifying condition for a DOT physical?", options: ["Controlled hypertension at 138/88", "Sleep apnea with CPAP compliance", "Epilepsy / Active seizure disorder", "History of knee surgery"], correctIndex: 2, explanation: "Epilepsy/active seizure disorder is automatically disqualifying until an FMCSA exemption is obtained.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "What blood pressure reading qualifies for a full 2-year DOT certification?", options: ["≤ 120/80 mmHg", "≤ 140/90 mmHg", "≤ 160/100 mmHg", "≤ 150/95 mmHg"], correctIndex: 1, explanation: "Blood pressure must be ≤ 140/90 mmHg for a full 2-year certification.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "What CPAP compliance standard must a driver with sleep apnea meet?", options: ["2 hours per night on 50% of nights", "4 hours per night on 70% of nights over 90 days", "6 hours per night on 80% of nights", "8 hours per night every night"], correctIndex: 1, explanation: "The standard is at least 4 hours per night on 70% of nights over the last 90 days.", orderIndex: 2 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "A driver with insulin-treated diabetes needs which form completed by their treating provider?", options: ["MCSA-5875", "MCSA-5876", "MCSA-5870", "MCSA-5880"], correctIndex: 2, explanation: "Form MCSA-5870 (Insulin-Treated Diabetes Mellitus Assessment Form) must be completed by the treating provider within 45 days of the exam.", orderIndex: 3 });
  await storage.createQuizQuestion({ moduleId: mod2.id, question: "How far in advance should employers send drivers a DOT physical preparation checklist?", options: ["The day of the appointment", "1 week before", "At least 2 weeks before", "3 months before"], correctIndex: 2, explanation: "Employers should send a preparation checklist at least 2 weeks before the scheduled DOT physical to give drivers time to obtain needed documentation.", orderIndex: 4 });

  // ===== MODULE 3: Medical Hold and The Clearance Process =====
  const mod3 = await storage.createModule({
    courseId: course.id,
    title: "Chapter 3: Medical Hold & The Clearance Process",
    description: "The specific, time-sensitive process a driver and employer must follow when a medical issue prevents immediate certification.",
    orderIndex: 2,
  });

  await storage.createLesson({
    moduleId: mod3.id,
    title: "3.1 What is a Medical Hold?",
    content: `<div class="lesson-content">
<h2>Understanding Medical Hold</h2>
<p>A <strong>Medical Hold</strong> (officially called "Determination Pending") is a temporary status where the CME <strong>cannot issue</strong> the Medical Examiner's Certificate (MEC) because they lack the necessary information to make a final determination of fitness.</p>

<h3>Common Reasons for Medical Hold</h3>
<ul>
<li>Missing specialist clearance letter (e.g., cardiologist, neurologist)</li>
<li>Incomplete CPAP compliance data</li>
<li>Missing or outdated lab work (e.g., HbA1c for diabetic drivers)</li>
<li>Incomplete medication information</li>
<li>Elevated blood pressure requiring follow-up</li>
</ul>

<div class="highlight-box warning-box">
<h4>Critical: Medical Hold is NOT Disqualification</h4>
<p>A Medical Hold is a <strong>temporary, non-disqualifying status</strong>. It simply means the examiner needs more information before making a decision. However, during a Medical Hold, the driver is <strong>prohibited from operating a CMV</strong>.</p>
</div>

<h3>Impact on the Driver</h3>
<ul>
<li>The driver's current Medical Examiner's Certificate (if still valid) may expire</li>
<li>The driver <strong>cannot legally operate a CMV</strong> until the hold is resolved</li>
<li>The employer must remove the driver from safety-sensitive duties immediately</li>
<li>The driver is responsible for obtaining the missing documentation</li>
</ul>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod3.id,
    title: "3.2 Why Medical Hold is Necessary",
    content: `<div class="lesson-content">
<h2>The Purpose of Medical Hold</h2>
<p>Medical Hold exists to protect both public safety and the driver. Understanding why it's necessary helps employers and drivers approach it constructively rather than viewing it as a punitive action.</p>

<h3>Safety Rationale</h3>
<ul>
<li><strong>The CME must ensure the condition is stable and monitored.</strong> Without confirmation from a specialist, the CME cannot verify that the driver's condition won't cause sudden incapacitation behind the wheel.</li>
<li><strong>It protects public safety</strong> by requiring specialist review before allowing the driver back on the road.</li>
<li><strong>It protects the driver</strong> by ensuring any underlying condition is properly managed before they resume driving duties.</li>
</ul>

<h3>Legal Rationale</h3>
<p>The CME has a legal obligation under FMCSA regulations to make an informed determination. Certifying a driver without adequate medical documentation could expose the CME, the employer, and the driver to significant liability if an incident occurs.</p>

<div class="highlight-box">
<h4>Employer Perspective</h4>
<p>While a Medical Hold means a driver is temporarily off the road, it's far preferable to a driver experiencing a medical event while operating a CMV. Employers should view Medical Holds as a compliance safeguard, not an inconvenience.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod3.id,
    title: '3.3 The "Dear Doctor" Clearance Letter',
    content: `<div class="lesson-content">
<h2>The Clearance Letter Process</h2>
<p>When a Medical Hold is issued, the CME will provide the driver with a letter addressed to their Primary Care Physician (PCP) or specialist. This is commonly called the <strong>"Dear Doctor" letter</strong>.</p>

<h3>What the Letter Contains</h3>
<ul>
<li>The specific DOT medical standard that must be met</li>
<li>The condition requiring clearance (e.g., cardiovascular, sleep apnea, neurological)</li>
<li>What information the CME needs from the specialist</li>
<li>The format and detail expected in the response</li>
</ul>

<h3>The Process</h3>
<ol>
<li><strong>CME issues the Dear Doctor letter</strong> to the driver at the time of the exam</li>
<li><strong>Driver takes the letter to their specialist</strong> (cardiologist, neurologist, sleep doctor, etc.)</li>
<li><strong>Specialist reviews and provides a clearance letter</strong> addressing the specific DOT standards outlined</li>
<li><strong>Driver returns the clearance letter to the CME</strong> for final review</li>
</ol>

<h3>Driver's Responsibility</h3>
<p>The driver is <strong>100% responsible</strong> for:</p>
<ul>
<li>Scheduling the specialist appointment</li>
<li>Providing the Dear Doctor letter to the specialist</li>
<li>Obtaining the clearance letter</li>
<li>Returning the clearance letter to the CME</li>
</ul>

<div class="highlight-box">
<h4>Time is Critical</h4>
<p>Every day the driver spends on Medical Hold is a day they cannot drive. Employers should help drivers understand the urgency and, when possible, assist with scheduling specialist appointments promptly.</p>
</div>
</div>`,
    orderIndex: 2,
  });

  await storage.createLesson({
    moduleId: mod3.id,
    title: "3.4 Clearing the Hold and Certification",
    content: `<div class="lesson-content">
<h2>Resolving the Medical Hold</h2>
<p>Once the required documentation is provided and the CME is satisfied that the driver meets the FMCSA medical standards, the hold is resolved and the driver receives their certification.</p>

<h3>The Resolution Process</h3>
<ol>
<li>Driver provides the clearance letter and any requested documentation to the CME</li>
<li>CME reviews the documentation against FMCSA standards</li>
<li>If satisfied, the CME changes the determination to <strong>"Meets Standards"</strong></li>
<li>The Medical Examiner's Certificate (MEC / DOT Card) is issued</li>
</ol>

<h3>Important: Certification Date</h3>
<p>The certification date is based on the <strong>original exam date</strong>, not the date the hold was cleared. This means the 24-month clock starts from when the physical examination was actually performed.</p>

<h3>What If the Specialist Cannot Clear the Driver?</h3>
<p>If the specialist determines the driver's condition does not meet the required standard:</p>
<ul>
<li>The CME will issue a <strong>"Does Not Meet Standards"</strong> determination</li>
<li>The driver is disqualified from operating a CMV</li>
<li>The driver may pursue an FMCSA exemption if applicable</li>
<li>The driver can seek a second opinion from another qualified specialist</li>
</ul>

<div class="highlight-box">
<h4>Employer Action Items</h4>
<ul>
<li>Track Medical Hold status for all drivers</li>
<li>Follow up with drivers regularly on their clearance progress</li>
<li>Document all communication regarding Medical Holds in the Driver Qualification File (DQF)</li>
<li>Have a contingency plan for driver coverage during holds</li>
</ul>
</div>
</div>`,
    orderIndex: 3,
  });

  // Module 3 Quiz
  await storage.createQuizQuestion({ moduleId: mod3.id, question: "What is a Medical Hold (Determination Pending)?", options: ["A permanent disqualification", "A temporary status where the CME needs more information", "A driver's refusal to take the exam", "A failed drug test result"], correctIndex: 1, explanation: "Medical Hold is a temporary, non-disqualifying status where the CME needs additional information to make a fitness determination.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod3.id, question: "Can a driver operate a CMV while on Medical Hold?", options: ["Yes, for up to 30 days", "Yes, with employer permission", "No, they are prohibited from driving a CMV", "Yes, within their home state only"], correctIndex: 2, explanation: "During a Medical Hold, the driver is prohibited from operating a CMV until the hold is resolved.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod3.id, question: "Who is responsible for obtaining the specialist clearance letter?", options: ["The employer", "The CME", "The driver", "The insurance company"], correctIndex: 2, explanation: "The driver is 100% responsible for scheduling the specialist appointment, obtaining the clearance letter, and returning it to the CME.", orderIndex: 2 });
  await storage.createQuizQuestion({ moduleId: mod3.id, question: "When the hold is cleared, what date is the certification based on?", options: ["The date the hold was cleared", "The original exam date", "The date of the specialist visit", "The date the employer requested it"], correctIndex: 1, explanation: "The certification date is based on the original exam date, not the date the hold was resolved.", orderIndex: 3 });

  // ===== MODULE 4: Documentation and State Requirements =====
  const mod4 = await storage.createModule({
    courseId: course.id,
    title: "Chapter 4: Documentation and State Requirements",
    description: "Final paperwork, the difference between the Long Form and the Card, and specific state compliance duties.",
    orderIndex: 3,
  });

  await storage.createLesson({
    moduleId: mod4.id,
    title: "4.1 DOT Cards and Long Forms: The Difference",
    content: `<div class="lesson-content">
<h2>Understanding the Two Key Documents</h2>
<p>Two primary documents are produced from the DOT physical. Understanding the difference between them is critical for proper compliance management.</p>

<h3>The Long Form (MCSA-5875)</h3>
<p>The <strong>Medical Examination Report (MER)</strong> is the detailed, multi-page document that contains:</p>
<ul>
<li>The driver's complete medical history</li>
<li>All examination findings (vision, hearing, BP, urinalysis, etc.)</li>
<li>The CME's detailed notes and determinations</li>
<li>The CME's final certification decision</li>
</ul>
<p><strong>Who keeps it:</strong> The employer must keep the Long Form in the <strong>Driver Qualification File (DQF)</strong>.</p>

<h3>The DOT Card (MCSA-5876)</h3>
<p>The <strong>Medical Examiner's Certificate (MEC)</strong> — commonly called the "DOT Card" — is the small, laminated card that:</p>
<ul>
<li>Confirms the driver has passed the DOT physical</li>
<li>Shows the certification date and expiration date</li>
<li>Notes any restrictions or limitations (e.g., corrective lenses required)</li>
</ul>
<p><strong>Who keeps it:</strong> The driver must carry it while driving, and a copy goes to the employer's DQF.</p>

<div class="highlight-box">
<h4>Key Difference</h4>
<p>The <strong>Long Form</strong> is the detailed medical record. The <strong>DOT Card</strong> is the proof of certification. Both are required for compliance — the employer needs both in the DQF, and the driver needs the card on their person.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  await storage.createLesson({
    moduleId: mod4.id,
    title: "4.2 Employer and Employee Responsibilities",
    content: `<div class="lesson-content">
<h2>Compliance Responsibilities</h2>
<p>Both the employer and the driver have specific, legally mandated responsibilities regarding DOT physical documentation.</p>

<h3>Employee (Driver) Responsibilities</h3>
<ul>
<li><strong>Carry the MEC (DOT Card)</strong> while driving a CMV at all times</li>
<li><strong>Submit a copy of the MEC</strong> to their State Driver's Licensing Agency (SDLA)</li>
<li><strong>Notify the employer</strong> of any changes in medical condition that could affect safe driving</li>
<li><strong>Schedule and complete</strong> the DOT physical before the current MEC expires</li>
<li><strong>Provide honest and complete</strong> medical history during the examination</li>
</ul>

<h3>Employer Responsibilities</h3>
<ul>
<li><strong>Retain the Long Form (MCSA-5875)</strong> and a copy of the DOT Card (MCSA-5876) in the Driver Qualification File (DQF)</li>
<li><strong>Keep DQF records for three years</strong> after the driver leaves the company</li>
<li><strong>Monitor MEC expiration dates</strong> for all drivers</li>
<li><strong>Remove the driver from duty immediately</strong> upon MEC expiration — no grace period</li>
<li><strong>Verify CME registration</strong> on the FMCSA National Registry</li>
</ul>

<div class="highlight-box warning-box">
<h4>No Grace Period</h4>
<p>There is <strong>no grace period</strong> for an expired MEC. If a driver's Medical Examiner's Certificate expires at 11:59 PM on the expiration date, they cannot legally operate a CMV starting at 12:00 AM the next day. Employers who allow drivers with expired MECs to operate are in violation of FMCSA regulations.</p>
</div>
</div>`,
    orderIndex: 1,
  });

  await storage.createLesson({
    moduleId: mod4.id,
    title: "4.3 State Requirements for the DOT Card",
    content: `<div class="lesson-content">
<h2>State-Level Compliance Requirements</h2>
<p>In addition to federal requirements, CDL holders have specific state-level obligations. Requirements vary by state, but here is a general overview using Michigan as a key example.</p>

<h3>CDL Self-Certification</h3>
<p>CDL holders must <strong>Self-Certify</strong> their driving type with their state's Driver Licensing Agency. The categories include:</p>
<ul>
<li><strong>Interstate Non-Excepted:</strong> Operates in interstate commerce and is required to meet federal medical standards (most common)</li>
<li><strong>Interstate Excepted:</strong> Operates in interstate commerce but is exempt from federal medical requirements (rare)</li>
<li><strong>Intrastate Non-Excepted:</strong> Operates only within one state and must meet that state's medical requirements</li>
<li><strong>Intrastate Excepted:</strong> Operates only within one state and is exempt from medical requirements (rare)</li>
</ul>

<h3>Submitting the MEC to the State</h3>
<p>CDL holders must submit a copy of their valid Medical Examiner's Certificate to their State Driver's Licensing Agency (SDLA). This is a <strong>separate requirement</strong> from carrying the card while driving.</p>

<div class="highlight-box warning-box">
<h4>CDL Downgrade Warning</h4>
<p>If a CDL holder fails to submit a valid MEC to their SDLA, their Commercial Driver's License may be <strong>downgraded</strong> to a standard (non-commercial) license. Reinstating a downgraded CDL can be a time-consuming and costly process.</p>
</div>

<h3>Employer Action</h3>
<p>Employers should include state MEC submission as part of their onboarding and renewal process, reminding drivers that completing the DOT physical alone is not sufficient — the state must also have a copy on file.</p>
</div>`,
    orderIndex: 2,
  });

  // Module 4 Quiz
  await storage.createQuizQuestion({ moduleId: mod4.id, question: "What is the Long Form (MCSA-5875)?", options: ["The DOT Card the driver carries", "The detailed Medical Examination Report", "The drug test result form", "The CDL application"], correctIndex: 1, explanation: "The Long Form (MCSA-5875) is the detailed Medical Examination Report containing the full history and exam findings.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod4.id, question: "How long must an employer retain Driver Qualification File records?", options: ["1 year", "2 years", "3 years after the driver leaves", "5 years"], correctIndex: 2, explanation: "Employers must retain DQF records for three years after the driver leaves the company.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod4.id, question: "What happens if a CDL holder fails to submit their MEC to the state?", options: ["Nothing, it's optional", "They receive a warning letter", "Their CDL may be downgraded", "They lose their medical card"], correctIndex: 2, explanation: "If a CDL holder fails to submit a valid MEC to their SDLA, their CDL may be downgraded to a standard (non-commercial) license.", orderIndex: 2 });
  await storage.createQuizQuestion({ moduleId: mod4.id, question: "Is there a grace period after a driver's MEC expires?", options: ["Yes, 30 days", "Yes, 15 days", "Yes, until the next scheduled physical", "No, there is no grace period"], correctIndex: 3, explanation: "There is no grace period for an expired MEC. The driver is prohibited from operating a CMV the instant it expires.", orderIndex: 3 });

  // ===== MODULE 5: DOT Physical Preparation Checklist =====
  const mod5 = await storage.createModule({
    courseId: course.id,
    title: "DOT Physical Preparation Checklist",
    description: "Comprehensive preparation checklist for drivers to ensure they bring the correct documentation and avoid Medical Holds.",
    orderIndex: 4,
  });

  await storage.createLesson({
    moduleId: mod5.id,
    title: "Complete Driver Preparation Checklist",
    content: `<div class="lesson-content">
<h2>DOT Physical Preparation Checklist for Drivers</h2>
<p>Drivers with these conditions must bring the corresponding documents, or the CME will likely issue a Medical Hold until the information is provided.</p>

<table class="checklist-table">
<thead>
<tr><th>Medical Condition</th><th>DOT Standard / Requirement</th><th>Mandatory Documentation to Bring</th></tr>
</thead>
<tbody>
<tr>
<td><strong>High Blood Pressure</strong></td>
<td>Must be 140/90 mmHg or lower for a full 2-year card. Higher readings result in temporary, shorter certifications.</td>
<td>Current list of medications (name, dosage, frequency). Ideally, a recent blood pressure log or clearance letter from the treating provider.</td>
</tr>
<tr>
<td><strong>Insulin-Treated Diabetes</strong></td>
<td>Must be well-controlled. Generally requires certification every 12 months. No severe hypoglycemic episode in last 12 months.</td>
<td>Insulin-Treated Diabetes Mellitus Assessment Form (MCSA-5870) completed by the treating provider within 45 days. Recent HbA1c results (within 6 months).</td>
</tr>
<tr>
<td><strong>Sleep Apnea (OSA)</strong></td>
<td>Untreated, moderate-to-severe OSA is disqualifying due to risk of excessive daytime sleepiness.</td>
<td>CPAP Compliance Report showing usage of at least 4 hours/night on 70% of nights over 90 days. Clearance letter from sleep specialist.</td>
</tr>
<tr>
<td><strong>Cardiovascular History</strong></td>
<td>Driver must be medically optimized, stable, and have low risk of sudden incapacitation.</td>
<td>Clearance letter from cardiologist (within last year). Recent EKG, stress test, and/or echocardiogram results.</td>
</tr>
<tr>
<td><strong>Neurological Issues</strong></td>
<td>Active epilepsy is disqualifying. Strokes/head injuries require mandatory wait periods.</td>
<td>Clearance letter from neurologist with diagnosis, treatment, and stability confirmation.</td>
</tr>
<tr>
<td><strong>Psychiatric Conditions</strong></td>
<td>Must be stable; medication must not cause excessive sedation or cognitive impairment.</td>
<td>Clearance letter from treating psychiatrist/therapist. Complete medication list.</td>
</tr>
<tr>
<td><strong>Vision</strong></td>
<td>At least 20/40 acuity in each eye, 70° peripheral vision in each eye.</td>
<td>Corrective lenses (glasses/contacts) must be worn during exam if required.</td>
</tr>
<tr>
<td><strong>Hearing</strong></td>
<td>Must hear forced whisper in better ear from 5 feet, with or without hearing aid.</td>
<td>Hearing aid (if required). Recent audiometry results if whisper test is failed.</td>
</tr>
<tr>
<td><strong>Medication Use</strong></td>
<td>Must disclose all medications. Schedule I controlled substances (including marijuana) are disqualifying.</td>
<td>Complete, accurate list of all medications (name, dosage, frequency) and prescribing doctors.</td>
</tr>
</tbody>
</table>

<div class="highlight-box warning-box">
<h4>Consequences of Arriving Unprepared</h4>
<p>If a driver arrives without required documentation, the CME will place them on Medical Hold (Determination Pending). During a Medical Hold, the driver cannot legally operate a CMV until they provide the missing documentation and receive their new medical card.</p>
</div>
</div>`,
    orderIndex: 0,
  });

  // Module 5 Quiz
  await storage.createQuizQuestion({ moduleId: mod5.id, question: "A driver with sleep apnea arrives for their DOT physical without their CPAP compliance report. What will happen?", options: ["They will be certified with a restriction", "They will pass automatically", "The CME will issue a Medical Hold", "They will be permanently disqualified"], correctIndex: 2, explanation: "Without the CPAP compliance report, the CME cannot verify treatment compliance and will place the driver on Medical Hold.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod5.id, question: "Is marijuana use (even with a state medical prescription) allowed for DOT-regulated drivers?", options: ["Yes, with a doctor's note", "Yes, in states where it's legal", "No, Schedule I substances are disqualifying", "Yes, if used only on weekends"], correctIndex: 2, explanation: "Use of any Schedule I controlled substance, including marijuana (even if medically prescribed by a state), is disqualifying under federal DOT regulations.", orderIndex: 1 });
  await storage.createQuizQuestion({ moduleId: mod5.id, question: "Within what timeframe must the MCSA-5870 form be completed by the provider for insulin-treated diabetes?", options: ["Within 90 days of the exam", "Within 60 days of the exam", "Within 45 days of the exam", "Within 30 days of the exam"], correctIndex: 2, explanation: "The Insulin-Treated Diabetes Mellitus Assessment Form (MCSA-5870) must be completed by the treating provider within 45 days of the exam.", orderIndex: 2 });

  // ===== MODULE 6: Official References =====
  const mod6 = await storage.createModule({
    courseId: course.id,
    title: "Official Reference Websites & Resources",
    description: "Essential FMCSA resources and official reference websites for DOT medical compliance.",
    orderIndex: 5,
  });

  await storage.createLesson({
    moduleId: mod6.id,
    title: "Official FMCSA Reference Guide",
    content: `<div class="lesson-content">
<h2>Official Reference Websites for DOT Medical Compliance</h2>
<p>All official forms, regulations, and guidance on the DOT Physical requirements are maintained by the <strong>Federal Motor Carrier Safety Administration (FMCSA)</strong>, an agency of the U.S. Department of Transportation.</p>

<table>
<thead>
<tr><th>Reference Category</th><th>Description</th><th>Website</th></tr>
</thead>
<tbody>
<tr>
<td><strong>Medical Programs Homepage</strong></td>
<td>The main portal for all FMCSA regulations, standards, and guidance related to driver medical requirements and the medical certification process.</td>
<td><a href="https://www.fmcsa.dot.gov/medical/driver-medical-requirements" target="_blank">FMCSA Medical Requirements</a></td>
</tr>
<tr>
<td><strong>National Registry (NRCME)</strong></td>
<td>The official database to verify if a medical examiner is certified to perform DOT physicals and where employers/drivers can search for a CME.</td>
<td><a href="https://nationalregistry.fmcsa.dot.gov" target="_blank">FMCSA National Registry</a></td>
</tr>
<tr>
<td><strong>The Forms</strong></td>
<td>Official source for the required physical examination documents (MCSA-5875, MCSA-5876, MCSA-5870).</td>
<td><a href="https://www.fmcsa.dot.gov/medical/driver-medical-requirements/medical-applications-and-forms" target="_blank">FMCSA Medical Forms</a></td>
</tr>
<tr>
<td><strong>The Handbook</strong></td>
<td>The guidance document CMEs use to interpret the regulations and make certification decisions.</td>
<td><a href="https://www.fmcsa.dot.gov/medical/driver-medical-requirements/medical-examiners-handbook" target="_blank">Medical Examiner's Handbook</a></td>
</tr>
</tbody>
</table>

<div class="highlight-box warning-box">
<h4>Important Note to Employers</h4>
<p>It is crucial to use the official <strong>.gov sources</strong> listed above, as FMCSA regulations are frequently updated (e.g., changes to the Insulin-Treated Diabetes Mellitus standard and the Vision standard). Relying on outdated or third-party summaries can lead to costly compliance errors.</p>
</div>

<h3>Course Complete!</h3>
<p>Congratulations on completing all chapters of the DOT Medical Certification course. You should now have a thorough understanding of:</p>
<ul>
<li>Who needs a DOT physical and the FMCSA mandate</li>
<li>The components of the DOT physical examination</li>
<li>Disqualifying conditions and required clearance documentation</li>
<li>The Medical Hold process and how to resolve it</li>
<li>Documentation requirements for employers and drivers</li>
<li>State-level compliance obligations</li>
</ul>
<p>Complete all module quizzes with a passing score of 70% or higher to earn your <strong>CCH DOT Medical Certification Course Certificate</strong>.</p>
</div>`,
    orderIndex: 0,
  });

  // Module 6 Quiz
  await storage.createQuizQuestion({ moduleId: mod6.id, question: "Where can you verify that a medical examiner is certified to perform DOT physicals?", options: ["Your state's DMV website", "The FMCSA National Registry of Certified Medical Examiners", "The AMA physician directory", "Any hospital website"], correctIndex: 1, explanation: "The FMCSA National Registry (NRCME) is the official database to verify if a medical examiner is certified to perform DOT physicals.", orderIndex: 0 });
  await storage.createQuizQuestion({ moduleId: mod6.id, question: "Why is it important to use official .gov sources for FMCSA regulations?", options: ["They are cheaper to access", "FMCSA regulations are frequently updated; third-party sources may be outdated", "They are the only websites available", "Third-party sources are always wrong"], correctIndex: 1, explanation: "FMCSA regulations are frequently updated, and relying on outdated or third-party summaries can lead to costly compliance errors.", orderIndex: 1 });

  console.log(`DOT Medical Certification course seeded successfully with ID: ${course.id}`);
  return course;
}
