const { createClient } = require('@sanity/client');
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Load .env.local manually (same pattern as seed-sanity.js)
const envPath = resolve(__dirname, '..', '.env.local');
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

let keyCounter = 0;
function key() { return `k${++keyCounter}`; }

function h2(text) {
  return { _type: 'block', _key: key(), style: 'h2', markDefs: [], children: [{ _type: 'span', _key: key(), text, marks: [] }] };
}

function p(text) {
  return { _type: 'block', _key: key(), style: 'normal', markDefs: [], children: [{ _type: 'span', _key: key(), text, marks: [] }] };
}

// Bold spans within a paragraph
function pBold(segments) {
  const markDefs = [];
  const children = segments.map(([text, bold]) => {
    const child = { _type: 'span', _key: key(), text, marks: bold ? ['strong'] : [] };
    return child;
  });
  return { _type: 'block', _key: key(), style: 'normal', markDefs, children };
}

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE 1
// ─────────────────────────────────────────────────────────────────────────────
const article1Body = [
  p('When a developer selects a project manager, they are not hiring a contractor. They are not engaging a service provider in the conventional sense. They are extending access \u2014 to their capital, their schedule, their risk exposure, and often to decisions that will shape the financial outcome of their most significant asset.'),
  p('That access is indistinguishable, in its intimacy and its consequences, from the access granted to a personal attorney, a certified public accountant, or a private wealth manager.'),

  h2('The Anatomy of a Fiduciary Relationship'),
  p('What defines a fiduciary relationship is not affection or tenure \u2014 it is structural dependency. The principal cannot effectively oversee every decision. The agent must exercise judgment on their behalf. And the cost of a misaligned agent is not inconvenience: it is material loss.'),
  p('A project manager who is managing a $20M mixed-use development has access to information that no other party in the project possesses in full. They know the actual contingency remaining. They know which subcontractors are underperforming. They know where the schedule has been compressed to protect a milestone that was already missed. They know the real risk exposure before the owner is told about it \u2014 and in many cases, they decide what the owner is told.'),
  p('That is not a vendor relationship. That is a trust relationship.'),

  h2('The Parallel to Legal and Financial Counsel'),
  p('Consider what an owner expects from their attorney. Not just technical competence \u2014 every licensed attorney has that. They expect candor when the news is bad. They expect loyalty that does not bend under pressure from the counterparty. They expect judgment that serves the owner\u2019s interests, not the path of least resistance.'),
  p('The same expectations apply, in full, to the project manager. When a general contractor presents a change order that is inflated by 40%, the project manager\u2019s job is not to approve it quickly to preserve a relationship. Their job is to push back, document the dispute, and protect the owner\u2019s position \u2014 even when that creates friction.'),
  p('When a design team delivers drawings that will result in permit delays, the project manager\u2019s job is not to forward the package and move on. Their job is to identify the issue before it costs the owner six weeks and $200,000 in carrying costs.'),

  h2('Why Owners Must Select for Trust, Not Resume'),
  p('The project management industry has developed a culture of credential accumulation. PMP certifications. Years of experience on large projects. Lists of completed square footage. These things matter, but they are not sufficient selection criteria for a fiduciary role.'),
  p('The question an owner must ask is not \u201Chow many projects have you delivered?\u201D The question is: \u201CWhen the situation was difficult, whose interests did you protect?\u201D'),
  p('A project manager who has never delivered bad news clearly, who has softened every cost overrun report, who has deferred to the GC when a confrontation was warranted \u2014 that project manager has a strong resume and an empty trust account.'),

  h2('The Practical Implications for Engagement Structure'),
  p('If the project manager relationship is a trust relationship, the engagement structure must reflect that:'),
  p('First, the project manager must be engaged before the team is assembled \u2014 not after. The moment a GC is selected without the project manager\u2019s input, the project manager\u2019s ability to act as an independent advisor is compromised.'),
  p('Second, the project manager must report directly to the principal \u2014 not through a development associate, not through a CFO. The information channel must be unmediated.'),
  p('Third, the project manager must have explicit authorization to escalate \u2014 including to stop a process when stopping is the right answer. A project manager who requires approval to raise a concern is not functioning as a trusted advisor.'),

  h2('The Standard We Hold Ourselves To'),
  p('At AMG, we do not evaluate our performance by milestone completion alone. We evaluate it by whether the owner had accurate information at every decision point, whether they were protected when protection was warranted, and whether our judgment served their interests when our interests might have diverged.'),
  p('That is the standard of a trusted advisor. It is the only standard that matters in this work.'),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE 2
// ─────────────────────────────────────────────────────────────────────────────
const article2Body = [
  p('The introduction of AI into construction project management has generated two opposite reactions: enthusiasm from those who see it as a productivity multiplier, and skepticism from those who have watched technology promises fail to survive contact with a real project. Both reactions are understandable. Neither is complete.'),
  p('The more useful question is not whether AI will transform project management \u2014 it already is \u2014 but how to deploy it in a way that actually accelerates projects rather than adding another layer of tools to manage.'),

  h2('What AI Does Well in Plan Review'),
  p('The tasks that consume the most project management time in plan review are not the tasks that require the most judgment. They are the tasks that require the most patience: cross-referencing dimensions across sheets, tracking revision clouds between document versions, checking that mechanical clearances are consistent with structural drawings, verifying that addenda have been incorporated into the current set.'),
  p('These tasks are time-consuming, error-prone when done manually under deadline pressure, and \u2014 critically \u2014 they delay the human judgment that actually matters.'),
  p('AI-powered document analysis tools can now perform these cross-checks at a speed and consistency that no human team can match. A coordination conflict that would take a project manager two hours to identify in a 400-sheet drawing set can be flagged in minutes. A revision comparison that requires pulling two document versions and manually scanning for changes can be automated entirely.'),
  p('The result is not that the project manager is replaced. The result is that the project manager arrives at the decision point faster, with better information, and with more time to apply judgment.'),

  h2('The Human in the Loop: What Cannot Be Delegated'),
  p('There is a category of project management judgment that AI does not perform and, in the current state of the technology, cannot perform: contextual risk assessment.'),
  p('A flagged coordination conflict between the HVAC routing and the structural beam is a data point. Whether that conflict is a critical path issue that must be resolved before the GC mobilizes, or a field accommodation that can be handled with an RFI during construction, is a judgment call that depends on factors the drawing set does not contain: the subcontractor\u2019s flexibility, the schedule buffer at that trade interface, the owner\u2019s tolerance for open items at permit submission.'),
  p('A project manager who delegates that judgment to an AI tool \u2014 or who treats every AI-flagged item as equally urgent \u2014 will produce more noise and less signal than a project manager who reviews no drawings at all.'),
  p('The human in the loop is not a regulatory requirement or a liability hedge. It is a performance requirement. The AI accelerates the finding. The project manager determines what the finding means.'),

  h2('Practical Deployment: What We\u2019ve Learned'),
  p('At AMG, we have integrated AI-assisted review into our document control process with one governing principle: the AI filters, the project manager decides.'),
  p('Specifically: AI tools run on every document submission to flag coordination conflicts, inconsistency between specifications and drawings, and missing information required for permit submission. All flagged items are triaged by the project manager before any communication goes to the design team or contractor. Items that are genuine conflicts become formal RFIs or design directives with schedule impact assessment attached. Items that are false positives or field-resolvable issues are logged but not escalated.'),
  p('The result is a significant reduction in review cycle time \u2014 and a significant improvement in the quality of the issues that reach the design team, because they have already been filtered for relevance and urgency.'),

  h2('The Schedule Impact'),
  p('The aggregate effect of faster plan review on project schedule is not incremental. On a project with multiple design submission cycles \u2014 schematic, design development, construction documents, permit, for-construction \u2014 compressing each review cycle by even three to five days produces a schedule acceleration of two to four weeks before the first shovel is in the ground.'),
  p('On a project with $500,000 per month in carrying costs, that is a direct financial return on the investment in AI-assisted review tools. The tools pay for themselves before the project breaks ground.'),

  h2('The Responsible Framing'),
  p('AI in project management is not a replacement for expertise. It is an amplifier of expertise. A project manager with strong judgment and AI-assisted review capacity is meaningfully more effective than the same project manager without those tools. A project manager with weak judgment and AI-assisted review capacity is not improved \u2014 they are faster at producing poorly-assessed conclusions.'),
  p('The technology raises the ceiling. The human determines whether the ceiling is reached.'),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE 3
// ─────────────────────────────────────────────────────────────────────────────
const article3Body = [
  p('Value engineering has a reputation problem. In many development projects, \u201Cvalue engineering\u201D has become a euphemism for cost-cutting \u2014 a process that begins with a budget shortfall and ends with a list of specification downgrades that the design team resents and the contractor delivers without enthusiasm.'),
  p('That is not value engineering. That is scope reduction with better branding.'),
  p('True value engineering is a structured analytical process that evaluates whether each element of a project \u2014 a material, a system, a construction method \u2014 is delivering value proportional to its cost. The goal is not to spend less. The goal is to eliminate spending that does not produce value, and preserve spending that does.'),
  p('The distinction matters enormously in practice.'),

  h2('The Three Categories of Value Engineering'),
  p('Every value engineering exercise produces recommendations that fall into one of three categories, and a skilled project manager must be able to distinguish between them in real time:'),
  pBold([['Category 1: True value improvements. ', true], ['Specification changes that reduce cost without reducing performance, durability, or user experience. Substituting a specified material for an equivalent one at lower cost. Redesigning a structural element to reduce material tonnage without reducing capacity. Changing a mechanical system configuration to reduce equipment count without reducing performance. These recommendations should be accepted without hesitation.', false]]),
  pBold([['Category 2: Cost reductions with acceptable trade-offs. ', true], ['Specification changes that reduce cost and do reduce performance or quality in ways that are acceptable given the project\u2019s market position and the owner\u2019s objectives. Downgrading finishes in back-of-house areas. Reducing landscaping scope in phases. Simplifying a fa\u00E7ade detail that has high cost and low visibility. These recommendations require owner judgment \u2014 the project manager\u2019s job is to present them with accurate disclosure of what is being traded away.', false]]),
  pBold([['Category 3: False economies. ', true], ['Specification changes that appear to reduce cost but create larger costs downstream \u2014 through maintenance, premature replacement, warranty claims, or tenant dissatisfaction. Reducing insulation to the code minimum in a market where energy performance drives lease rates. Specifying a lower-grade roofing system to save $80,000 on a building where a roof failure costs $400,000 to remediate. These recommendations must be rejected, and the project manager must be equipped to make that case with data.', false]]),
  p('The failure mode in most value engineering exercises is that Category 3 recommendations are accepted because the short-term budget savings are visible and the long-term costs are not yet real.'),

  h2('The Project Manager\u2019s Role'),
  p('The project manager\u2019s function in value engineering is not to generate cost savings. The contractor does that. The design team can contribute. The project manager\u2019s function is to ensure that the process produces Category 1 and 2 recommendations and filters out Category 3.'),
  p('This requires three capabilities that are not universally present in project management practice:'),
  pBold([['First, technical depth. ', true], ['A project manager who cannot evaluate whether a proposed material substitution is genuinely equivalent cannot protect the owner from a false economy. This is not about being a structural engineer or a mechanical engineer \u2014 it is about having sufficient building systems knowledge to ask the right questions and recognize an evasive answer.', false]]),
  pBold([['Second, market knowledge. ', true], ['Value engineering decisions in real estate development cannot be evaluated without reference to the market the asset will compete in. A finish level that is appropriate for a Class B industrial building is a false economy in a Class A mixed-use project. The project manager must know the market well enough to hold that line.', false]]),
  pBold([['Third, independence. ', true], ['The pressure to accept cost savings is always present in a development project. Budget overruns create urgency. The GC has an economic interest in substitutions that are easier to build. The project manager must be willing to reject savings that compromise the project \u2014 and willing to document that rejection clearly, so the owner understands what was protected and why.', false]]),

  h2('When to Initiate Value Engineering'),
  p('The most effective value engineering happens during design development \u2014 not during construction documents and certainly not after permit. The cost to redesign a structural system during design development is a few weeks of engineering time. The cost to redesign it after permit submission is measured in months and tens of thousands of dollars in fees.'),
  p('A project manager who waits for the contractor\u2019s bid to identify value engineering opportunities has already lost most of the value engineering potential. The process must begin when the design is still flexible enough to benefit from it.'),

  h2('What the Owner Needs to Understand'),
  p('The owner\u2019s role in value engineering is to make informed decisions, not to approve a list. The project manager\u2019s job is to ensure that every value engineering recommendation reaches the owner with accurate disclosure of what is being changed, what is being saved, and what risk is being accepted.'),
  p('An owner who approves a value engineering package without that disclosure has not made a decision \u2014 they have signed a document. Those are not the same thing.'),
];

// ─────────────────────────────────────────────────────────────────────────────
// ARTICLE 4
// ─────────────────────────────────────────────────────────────────────────────
const article4Body = [
  p('The title \u201COwner\u2019s Representative\u201D is used loosely in the development industry. It is applied to project managers, development consultants, construction managers, and, in some cases, to people whose primary qualification is proximity to the owner. This imprecision has consequences: owners who do not understand the role cannot evaluate whether the person filling it is performing it.'),
  p('This article defines the role with precision, describes what it demands in practice, and explains the principles that separate effective Owner\u2019s Representatives from well-credentialed ones.'),

  h2('What the Owner\u2019s Representative Actually Is'),
  p('The Owner\u2019s Representative is the developer\u2019s operational proxy on a project. In most development organizations \u2014 and especially in the ownership structures common in real estate, where equity is organized around individual assets \u2014 the principal is not present full-time on any single project. They are managing capital, managing investors, managing a pipeline. They cannot attend every OAC meeting, review every RFI response, or evaluate every change order in real time.'),
  p('The Owner\u2019s Representative exists to close that gap. They exercise the owner\u2019s judgment \u2014 on scope, on cost, on schedule, on contractor performance, on design decisions \u2014 in the spaces where the owner cannot be present. They do not substitute for the owner\u2019s authority; they extend it.'),
  p('This is the correct frame. Not \u201Cproject manager working for the owner.\u201D Not \u201Cconstruction observer.\u201D Owner\u2019s proxy. The distinction determines how every situation is approached.'),

  h2('The Four Core Functions'),
  p('An Owner\u2019s Representative who is executing the role correctly is performing four functions simultaneously:'),
  pBold([['1. Information Management', true]]),
  p('The owner must have accurate, timely information about the project\u2019s cost, schedule, and risk exposure at all times. This sounds obvious. It is not common. Information in a construction project is produced in abundance and filtered aggressively before it reaches the owner \u2014 by contractors who have an interest in managing the narrative, by design consultants who want to minimize perceived responsibility, and sometimes by project managers who want to protect a relationship.'),
  p('The Owner\u2019s Representative\u2019s job is to ensure that the information the owner receives is accurate, complete, and timely \u2014 not comfortable. This means maintaining independent cost tracking, not relying on the GC\u2019s schedule alone, and escalating unfavorable information without delay.'),
  pBold([['2. Decision Support', true]]),
  p('The owner makes decisions. The Owner\u2019s Representative provides the analysis and context that makes those decisions possible. On a typical development project, the owner will face dozens of decisions with material financial consequences \u2014 change order approvals, design modifications, contractor substitutions, schedule acceleration decisions. Each of those decisions requires context that the owner often does not have time to develop independently.'),
  p('The Owner\u2019s Representative must arrive at every owner decision point with a clear recommendation, the data that supports it, the alternatives that were considered, and an honest assessment of the risk being accepted. A project manager who presents a change order for approval without a recommendation is not performing the Owner\u2019s Representative function.'),
  pBold([['3. Team Accountability', true]]),
  p('The Owner\u2019s Representative is the only party on the project whose primary accountability is to the owner. The GC is accountable to their contract. The architect is accountable to their contract. The Owner\u2019s Representative is accountable to the owner\u2019s outcome.'),
  p('This means holding every party to their contractual obligations, documenting non-performance before it becomes a pattern, and escalating disputes early rather than allowing them to accumulate into claims. An Owner\u2019s Representative who avoids confrontation to preserve relationships is not protecting the owner \u2014 they are protecting themselves.'),
  pBold([['4. Risk Identification and Management', true]]),
  p('Projects fail at their risk exposure points \u2014 not at the things that go as planned, but at the things that do not. The Owner\u2019s Representative\u2019s job is to identify risk before it materializes, assess its potential impact, and ensure that the owner has made a deliberate decision about how to handle it.'),
  p('This requires a specific skill set: the ability to read a construction schedule and identify where the critical path is actually fragile, the ability to evaluate a subcontractor\u2019s performance trajectory before it becomes a delay, the ability to read a contract and identify where the owner\u2019s position is weaker than assumed.'),

  h2('What Effective Execution Looks Like'),
  p('In practice, an Owner\u2019s Representative who is executing the role correctly exhibits several consistent behaviors:'),
  p('They are present at every significant project event \u2014 not to supervise, but to have independent observation of what actually occurred. Written reports are useful. Direct observation is better.'),
  p('They maintain their own project records, independently of the contractor\u2019s records. When disputes arise about what was agreed, directed, or changed, the Owner\u2019s Representative\u2019s records are the owner\u2019s evidence.'),
  p('They communicate bad news immediately and completely. A cost overrun that is disclosed early can be managed. A cost overrun that is disclosed at substantial completion cannot be.'),
  p('They distinguish between what they know and what they believe. \u201CThe contractor is behind schedule\u201D and \u201CI believe the contractor will recover\u201D are different statements with different implications. An Owner\u2019s Representative who presents beliefs as facts is not serving the owner\u2019s decision-making needs.'),

  h2('How to Select an Owner\u2019s Representative'),
  p('The selection criteria for an Owner\u2019s Representative are different from the criteria for other professional services:'),
  p('Technical competence is table stakes. Every credible candidate has delivered projects. The differentiating questions are:'),
  p('How does the candidate handle conflict? Ask for specific examples of disputes they have escalated, and what happened. A candidate who cannot describe a situation where they confronted a contractor or a design team member has not been performing the advocacy function.'),
  p('Whose interests did they protect when their interests and the owner\u2019s interests diverged? This is the character question. It is also the hardest question to answer honestly in an interview, which is why references matter more in this selection than in most others.'),
  p('Do they understand the business of development, not just the process of construction? An Owner\u2019s Representative who understands how capital returns are calculated, how financing covenants work, and how schedule delays translate to yield compression will make fundamentally better recommendations than one who does not.'),

  h2('The Relationship Structure That Makes the Role Work'),
  p('The Owner\u2019s Representative relationship only functions correctly under specific structural conditions. The representative must report directly to the principal \u2014 not through a layer of internal staff. The representative must have explicit authority to reject contractor claims, direct design modifications within established parameters, and escalate to the owner without permission. And the owner must be committed to receiving honest information \u2014 including information that reflects poorly on decisions they have already made.'),
  p('An Owner\u2019s Representative who is structurally prevented from doing their job \u2014 by reporting chains, by approval requirements, by an owner who does not want to hear bad news \u2014 cannot protect the owner from a project that is going wrong.'),
  p('The role works when the relationship is honest. It fails when the relationship is comfortable.'),
  p('At AMG, Owner\u2019s Representation is not a service line we offer alongside other services. It is the foundation of everything we do. The standards described in this article are the standards we hold ourselves to on every project, for every client.'),
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED
// ─────────────────────────────────────────────────────────────────────────────
const articles = [
  {
    _id: 'article-q1-2025',
    _type: 'article',
    title: 'The Project Manager as a Trusted Advisor: A Relationship Built on Confidence',
    slug: { _type: 'slug', current: 'project-manager-trusted-advisor' },
    excerpt: 'The relationship between a project manager and a developer is not a vendor relationship \u2014 it is a fiduciary one. Like a personal attorney or a CPA, a project manager operates inside the owner\u2019s most sensitive decisions.',
    body: article1Body,
    category: 'Project Management',
    tags: ['owner representation', 'trust', 'project management', 'advisory'],
    authorName: 'Aron Miller',
    isDraft: false,
    isPublished: true,
    publishedAt: '2025-01-15T09:00:00Z',
    createdAt: '2025-01-15T09:00:00Z',
    updatedAt: '2025-01-15T09:00:00Z',
  },
  {
    _id: 'article-q2-2025',
    _type: 'article',
    title: 'AI-Assisted Plan Review: Accelerating the Project Without Removing the Human',
    slug: { _type: 'slug', current: 'ai-assisted-plan-review-human-in-the-loop' },
    excerpt: 'AI tools are changing how project managers review drawings, track revisions, and identify coordination conflicts. But the judgment that determines what matters \u2014 and what to do about it \u2014 remains irreducibly human.',
    body: article2Body,
    category: 'Technology',
    tags: ['AI', 'plan review', 'technology', 'project controls', 'construction'],
    authorName: 'Aron Miller',
    isDraft: false,
    isPublished: true,
    publishedAt: '2025-04-10T09:00:00Z',
    createdAt: '2025-04-10T09:00:00Z',
    updatedAt: '2025-04-10T09:00:00Z',
  },
  {
    _id: 'article-q3-2025',
    _type: 'article',
    title: 'Value Engineering in Real Estate Development: What It Is, What It Isn\u2019t, and Where the Project Manager Fits',
    slug: { _type: 'slug', current: 'value-engineering-real-estate-development' },
    excerpt: 'Value engineering is one of the most misused terms in real estate development. When applied correctly, it protects project value. When applied carelessly, it destroys it \u2014 and the project manager is the last line of defense.',
    body: article3Body,
    category: 'Cost Management',
    tags: ['value engineering', 'cost management', 'real estate', 'design', 'project management'],
    authorName: 'Aron Miller',
    isDraft: false,
    isPublished: true,
    publishedAt: '2025-07-08T09:00:00Z',
    createdAt: '2025-07-08T09:00:00Z',
    updatedAt: '2025-07-08T09:00:00Z',
  },
  {
    _id: 'article-q4-2025',
    _type: 'article',
    title: 'The Owner\u2019s Representative: What the Role Is, What It Demands, and How to Execute It Correctly',
    slug: { _type: 'slug', current: 'owners-representative-role-execution' },
    excerpt: 'The Owner\u2019s Representative is the developer\u2019s full-time presence on a project they cannot be fully present for. Understanding what that means \u2014 and what it demands \u2014 is essential to selecting the right person and getting the relationship right.',
    body: article4Body,
    category: 'Owner Representation',
    tags: ['owner representative', 'project management', 'real estate', 'development', 'advisory'],
    authorName: 'Aron Miller',
    isDraft: false,
    isPublished: true,
    publishedAt: '2025-10-14T09:00:00Z',
    createdAt: '2025-10-14T09:00:00Z',
    updatedAt: '2025-10-14T09:00:00Z',
  },
];

async function main() {
  console.log(`Project: ${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID} / ${process.env.NEXT_PUBLIC_SANITY_DATASET}\n`);

  for (const article of articles) {
    try {
      const res = await client.createOrReplace(article);
      console.log(`\u2713 Seeded: ${article.title} \u2192 ${res._id}`);
    } catch (e) {
      console.error(`\u2717 Failed: ${article.title} \u2192 ${e.message}`);
    }
  }

  console.log('\nDone.');
}

main();
