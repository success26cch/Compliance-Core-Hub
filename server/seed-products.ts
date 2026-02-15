import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();
  
  console.log('Creating CCH products and prices...');
  
  const cchSafetyStarter = await stripe.products.create({
    name: 'Safety Starter',
    description: 'CCH Occupational Health - 3 Questions/month for small teams',
    metadata: {
      category: 'cch',
      tier: 'free',
    },
  });
  
  await stripe.prices.create({
    product: cchSafetyStarter.id,
    unit_amount: 0,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Created: Safety Starter (Free)');
  
  const cchUnlimitedSafety = await stripe.products.create({
    name: 'Unlimited Safety',
    description: 'CCH Occupational Health - Unlimited Questions + Audit Prep Tools',
    metadata: {
      category: 'cch',
      tier: 'unlimited',
    },
  });
  
  await stripe.prices.create({
    product: cchUnlimitedSafety.id,
    unit_amount: 9900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Created: Unlimited Safety ($99/mo)');
  
  console.log('\nCreating ACSI ISO products and prices...');
  
  const isoEssentials = await stripe.products.create({
    name: 'ISO Essentials',
    description: 'ACSI ISO Manager - 5 Gap Analysis checks + Templates',
    metadata: {
      category: 'acsi',
      tier: 'essentials',
    },
  });
  
  await stripe.prices.create({
    product: isoEssentials.id,
    unit_amount: 4900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Created: ISO Essentials ($49/mo)');
  
  const isoProfessional = await stripe.products.create({
    name: 'ISO Professional',
    description: 'ACSI ISO Manager - Unlimited ISO AI + Audit Checklists + Write-Up Free tools',
    metadata: {
      category: 'acsi',
      tier: 'professional',
    },
  });
  
  await stripe.prices.create({
    product: isoProfessional.id,
    unit_amount: 14900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Created: ISO Professional ($149/mo)');
  
  const integratedEnterprise = await stripe.products.create({
    name: 'Integrated Enterprise',
    description: 'CCH + ACSI Combined - Full Health, Safety & ISO suite',
    metadata: {
      category: 'enterprise',
      tier: 'enterprise',
    },
  });
  
  await stripe.prices.create({
    product: integratedEnterprise.id,
    unit_amount: 29900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Created: Integrated Enterprise ($299/mo)');
  
  const humanExpertRetainer = await stripe.products.create({
    name: 'Human Expert Retainer',
    description: 'App + Professional Safety Director access for companies with 20-100 employees',
    metadata: {
      category: 'retainer',
      tier: 'expert',
    },
  });
  
  await stripe.prices.create({
    product: humanExpertRetainer.id,
    unit_amount: 49900,
    currency: 'usd',
    recurring: { interval: 'month' },
  });
  console.log('Created: Human Expert Retainer ($499/mo)');
  
  console.log('\nCreating Training Course products (one-time purchases)...');
  
  const dotMedical = await stripe.products.create({
    name: 'DOT Medical Certification Course',
    description: 'DOT physical requirements, disqualifying conditions, medical holds, clearance process',
    metadata: {
      category: 'training',
      type: 'course',
    },
  });
  
  await stripe.prices.create({
    product: dotMedical.id,
    unit_amount: 19900,
    currency: 'usd',
  });
  console.log('Created: DOT Medical Certification ($199)');
  
  const oshaMedical = await stripe.products.create({
    name: 'OSHA Medical Surveillance Course',
    description: 'Respirator physicals, asbestos exams, HAZWOPER, PFTs, fit testing',
    metadata: {
      category: 'training',
      type: 'course',
    },
  });
  
  await stripe.prices.create({
    product: oshaMedical.id,
    unit_amount: 24900,
    currency: 'usd',
  });
  console.log('Created: OSHA Medical Surveillance ($249)');
  
  const drugAlcohol = await stripe.products.create({
    name: 'Drug & Alcohol Testing Course',
    description: 'DOT vs Non-DOT testing, MRO roles, Clearinghouse, return-to-duty',
    metadata: {
      category: 'training',
      type: 'course',
    },
  });
  
  await stripe.prices.create({
    product: drugAlcohol.id,
    unit_amount: 19900,
    currency: 'usd',
  });
  console.log('Created: Drug & Alcohol Testing ($199)');
  
  const isoManagement = await stripe.products.create({
    name: 'ISO Management Systems Course',
    description: 'ISO 9001/14001/45001, HLS structure, gap analysis, internal auditing, CAPA',
    metadata: {
      category: 'training',
      type: 'course',
    },
  });
  
  await stripe.prices.create({
    product: isoManagement.id,
    unit_amount: 34900,
    currency: 'usd',
  });
  console.log('Created: ISO Management Systems ($349)');
  
  const oshaRecordkeeping = await stripe.products.create({
    name: 'OSHA Recordkeeping Master Course',
    description: 'OSHA 300 logs, TRIR/EMR reduction, internal audits',
    metadata: {
      category: 'training',
      type: 'course',
    },
  });
  
  await stripe.prices.create({
    product: oshaRecordkeeping.id,
    unit_amount: 29900,
    currency: 'usd',
  });
  console.log('Created: OSHA Recordkeeping Master ($299)');
  
  const completeBundle = await stripe.products.create({
    name: 'Complete Training Bundle',
    description: 'All 5 courses + Corporate License (Save $300+)',
    metadata: {
      category: 'training',
      type: 'bundle',
    },
  });
  
  await stripe.prices.create({
    product: completeBundle.id,
    unit_amount: 89900,
    currency: 'usd',
  });
  console.log('Created: Complete Training Bundle ($899)');
  
  console.log('\nAll products created successfully!');
}

createProducts().catch(console.error);
