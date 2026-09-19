import { User, Project, ProjectMembership, Sprint, DailyUpdate, SemanticBlocker } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-mgr-1',
    name: 'David Miller',
    email: 'david@sprintpulse.io',
    password: 'password123',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    title: 'VP of Engineering',
    department: 'Core Platform',
  },
  {
    id: 'usr-mgr-2',
    name: 'Sarah Chen',
    email: 'sarah@sprintpulse.io',
    password: 'password123',
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    title: 'Director of Product Engineering',
    department: 'Customer Growth',
  },
  {
    id: 'usr-dev-1',
    name: 'Tejasri Nair',
    email: 'tejasri@email.com',
    password: 'password123',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    title: 'Full Stack Engineer',
    department: 'Web Engineering',
  },
  {
    id: 'usr-dev-2',
    name: 'Rahul Sharma',
    email: 'rahul@email.com',
    password: 'password123',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    title: 'Senior Backend Engineer',
    department: 'Payments & Checkout',
  },
  {
    id: 'usr-dev-3',
    name: 'Ananya Rao',
    email: 'ananya@email.com',
    password: 'password123',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    title: 'Senior Frontend Engineer',
    department: 'Checkout Experience',
  },
  {
    id: 'usr-dev-4',
    name: 'Karthik Verma',
    email: 'karthik@email.com',
    password: 'password123',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    title: 'DevOps & Cloud Engineer',
    department: 'Infrastructure',
  },
  {
    id: 'usr-dev-5',
    name: 'Vikram Sen',
    email: 'vikram@email.com',
    password: 'password123',
    role: 'member',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    title: 'QA Automation Engineer',
    department: 'Quality Engineering',
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-1',
    name: 'E-Commerce Platform',
    description: 'Next-generation omni-channel checkout, inventory synchronization, and high-throughput order processing system.',
    startDate: '2026-09-01',
    endDate: '2026-11-30',
    inviteCode: 'ECP-7K42',
    managerId: 'usr-mgr-1',
    createdAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'prj-2',
    name: 'Mobile Customer App',
    description: 'Native mobile client application featuring real-time package tracking, biometrics, and push payment notifications.',
    startDate: '2026-09-05',
    endDate: '2026-12-15',
    inviteCode: 'MCA-3391',
    managerId: 'usr-mgr-1',
    createdAt: '2026-09-05T09:30:00Z',
  }
];

export const INITIAL_MEMBERSHIPS: ProjectMembership[] = [
  {
    id: 'mem-1',
    projectId: 'prj-1',
    userId: 'usr-mgr-1',
    role: 'manager',
    status: 'approved',
    requestedAt: '2026-09-01T08:00:00Z',
    approvedAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'mem-2',
    projectId: 'prj-1',
    userId: 'usr-dev-1', // Tejasri
    role: 'member',
    status: 'approved',
    requestedAt: '2026-09-02T09:15:00Z',
    approvedAt: '2026-09-02T10:00:00Z',
  },
  {
    id: 'mem-3',
    projectId: 'prj-1',
    userId: 'usr-dev-2', // Rahul
    role: 'member',
    status: 'approved',
    requestedAt: '2026-09-02T09:20:00Z',
    approvedAt: '2026-09-02T10:05:00Z',
  },
  {
    id: 'mem-4',
    projectId: 'prj-1',
    userId: 'usr-dev-3', // Ananya
    role: 'member',
    status: 'approved',
    requestedAt: '2026-09-02T09:40:00Z',
    approvedAt: '2026-09-02T10:10:00Z',
  },
  {
    id: 'mem-5',
    projectId: 'prj-1',
    userId: 'usr-dev-4', // Karthik
    role: 'member',
    status: 'approved',
    requestedAt: '2026-09-03T11:00:00Z',
    approvedAt: '2026-09-03T11:30:00Z',
  },
  // Pending request for demo
  {
    id: 'mem-6',
    projectId: 'prj-1',
    userId: 'usr-dev-5', // Vikram Sen
    role: 'member',
    status: 'pending',
    requestedAt: '2026-09-19T10:42:00Z',
  }
];

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 'sp-1',
    projectId: 'prj-1',
    name: 'Sprint 3',
    goal: 'Deliver unified payment gateway integration, cart optimization, and zero-downtime database failover migration.',
    startDate: '2026-09-10',
    endDate: '2026-09-24',
    status: 'active',
    totalWorkingDays: 10,
  },
  {
    id: 'sp-0',
    projectId: 'prj-1',
    name: 'Sprint 2',
    goal: 'Product catalog microservice refactoring and Redis caching implementation.',
    startDate: '2026-08-27',
    endDate: '2026-09-09',
    status: 'completed',
    totalWorkingDays: 10,
  }
];

export const INITIAL_UPDATES: DailyUpdate[] = [
  // Day 1: 2026-09-10
  {
    id: 'upd-01',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-1', // Tejasri
    date: '2026-09-10',
    yesterday: 'Finalized sprint planning story estimation and completed architecture review for the authentication service.',
    today: 'Setting up staging deployment pipelines and scaffolding token refresh routes.',
    blockers: 'Waiting for staging credentials and cluster secret store access.',
    hasBlocker: true,
    createdAt: '2026-09-10T09:30:00Z',
    updatedAt: '2026-09-10T09:30:00Z',
  },
  {
    id: 'upd-02',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-2', // Rahul
    date: '2026-09-10',
    yesterday: 'Drafted schema specification for the checkout transaction coordinator.',
    today: 'Implementing payment webhook signature verification.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-10T09:45:00Z',
    updatedAt: '2026-09-10T09:45:00Z',
  },
  {
    id: 'upd-03',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-3', // Ananya
    date: '2026-09-10',
    yesterday: 'Built interactive checkout payment method selector components.',
    today: 'Wiring checkout form validation and card input masking.',
    blockers: 'Design tokens for error banner states need final sign-off.',
    hasBlocker: true,
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
  },
  {
    id: 'upd-04',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-4', // Karthik
    date: '2026-09-10',
    yesterday: 'Configured Terraform state locks and provisioned staging Kubernetes ingress.',
    today: 'Rolling out Vault service accounts for dev team onboarding.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-10T10:15:00Z',
    updatedAt: '2026-09-10T10:15:00Z',
  },

  // Day 2: 2026-09-11
  {
    id: 'upd-05',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-1', // Tejasri
    date: '2026-09-11',
    yesterday: 'Drafted OAuth token refresh handler and mocked staging environment locally.',
    today: 'Attempting deployment to staging cluster.',
    blockers: 'Still cannot access staging environment. Waiting on IAM role permissions.',
    hasBlocker: true,
    createdAt: '2026-09-11T09:20:00Z',
    updatedAt: '2026-09-11T09:20:00Z',
  },
  {
    id: 'upd-06',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-2', // Rahul
    date: '2026-09-11',
    yesterday: 'Completed payment webhook handler unit tests with 94% coverage.',
    today: 'Testing end-to-end payment capture against sandbox gateway.',
    blockers: 'Payment service unavailable in sandbox. 502 Bad Gateway responses on sandbox endpoints.',
    hasBlocker: true,
    createdAt: '2026-09-11T09:40:00Z',
    updatedAt: '2026-09-11T09:40:00Z',
  },
  {
    id: 'upd-07',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-3', // Ananya
    date: '2026-09-11',
    yesterday: 'Integrated card input formatting and CVV security hints.',
    today: 'Connecting payment gateway iframe and handling token callbacks.',
    blockers: 'Waiting for staging credentials to test live sandbox iframe.',
    hasBlocker: true,
    createdAt: '2026-09-11T09:55:00Z',
    updatedAt: '2026-09-11T09:55:00Z',
  },
  {
    id: 'upd-08',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-4', // Karthik
    date: '2026-09-11',
    yesterday: 'Configured staging Vault namespaces and drafted IAM approval policies.',
    today: 'Reviewing security group ingress rules with SecOps.',
    blockers: 'SecOps approval queue is backlogged.',
    hasBlocker: true,
    createdAt: '2026-09-11T10:10:00Z',
    updatedAt: '2026-09-11T10:10:00Z',
  },

  // Day 3: 2026-09-12
  {
    id: 'upd-09',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-1', // Tejasri
    date: '2026-09-12',
    yesterday: 'Completed session revocation logic and refreshed test fixtures.',
    today: 'End-to-end integration testing.',
    blockers: 'Staging environment access unavailable. 3rd day blocked from deploying auth service.',
    hasBlocker: true,
    createdAt: '2026-09-12T09:15:00Z',
    updatedAt: '2026-09-12T09:15:00Z',
  },
  {
    id: 'upd-10',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-2', // Rahul
    date: '2026-09-12',
    yesterday: 'Built idempotency key middleware for payment submissions.',
    today: 'Implementing fallback retry strategy with exponential backoff.',
    blockers: 'Payment provider sandbox still intermittently down. Provider confirmed outage ticket #4829.',
    hasBlocker: true,
    createdAt: '2026-09-12T09:35:00Z',
    updatedAt: '2026-09-12T09:35:00Z',
  },
  {
    id: 'upd-11',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-3', // Ananya
    date: '2026-09-12',
    yesterday: 'Created responsive order summary breakdown with tax calculation.',
    today: 'Implementing coupon code verification and promo discount banners.',
    blockers: 'PR #142 waiting for code review from senior backend team.',
    hasBlocker: true,
    createdAt: '2026-09-12T10:05:00Z',
    updatedAt: '2026-09-12T10:05:00Z',
  },
  {
    id: 'upd-12',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-4', // Karthik
    date: '2026-09-12',
    yesterday: 'Provisioned dedicated staging secrets and unblocked IAM roles.',
    today: 'Deploying staging ingress controller and SSL certificates.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-12T10:30:00Z',
    updatedAt: '2026-09-12T10:30:00Z',
  },

  // Day 4: 2026-09-15
  {
    id: 'upd-13',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-1', // Tejasri
    date: '2026-09-15',
    yesterday: 'Credentials finally resolved by Karthik! Deployed auth service to staging.',
    today: 'Running load tests on JWT token generation and verifying Redis session blacklist.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-15T09:20:00Z',
    updatedAt: '2026-09-15T09:20:00Z',
  },
  {
    id: 'upd-14',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-2', // Rahul
    date: '2026-09-15',
    yesterday: 'Payment sandbox partially recovered. Completed webhook signature verification test suite.',
    today: 'Integrating Apple Pay and Google Pay server tokens.',
    blockers: 'Sandbox webhook timeout during high concurrency tests.',
    hasBlocker: true,
    createdAt: '2026-09-15T09:40:00Z',
    updatedAt: '2026-09-15T09:40:00Z',
  },
  {
    id: 'upd-15',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-3', // Ananya
    date: '2026-09-15',
    yesterday: 'Refactored cart dropdown animations and added micro-interactions.',
    today: 'Pairing with Rahul on payment checkout error boundary states.',
    blockers: 'PR #142 still blocked pending code review.',
    hasBlocker: true,
    createdAt: '2026-09-15T10:00:00Z',
    updatedAt: '2026-09-15T10:00:00Z',
  },
  {
    id: 'upd-16',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-4', // Karthik
    date: '2026-09-15',
    yesterday: 'Resolved staging IAM roles and unblocked Tejasri and Ananya.',
    today: 'Configuring Redis cluster auto-scaling and monitoring alerts.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-15T10:20:00Z',
    updatedAt: '2026-09-15T10:20:00Z',
  },

  // Day 5: 2026-09-16
  {
    id: 'upd-17',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-1', // Tejasri
    date: '2026-09-16',
    yesterday: 'Verified token renewal under 40ms p99 latency in staging cluster.',
    today: 'Implementing user role permissions matrix and dashboard route guards.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-16T09:15:00Z',
    updatedAt: '2026-09-16T09:15:00Z',
  },
  {
    id: 'upd-18',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-2', // Rahul
    date: '2026-09-16',
    yesterday: 'Implemented async webhook processing queue using RabbitMQ.',
    today: 'Validating zero duplicate payment records under network partition simulation.',
    blockers: 'Payment gateway callback failure when simulating 3D-Secure 2.0 challenge flow.',
    hasBlocker: true,
    createdAt: '2026-09-16T09:35:00Z',
    updatedAt: '2026-09-16T09:35:00Z',
  },
  {
    id: 'upd-19',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-3', // Ananya
    date: '2026-09-16',
    yesterday: 'Reviewed and merged PR #142 after Rahul approved! Completed checkout review screen.',
    today: 'Integrating 3D Secure modal trigger on frontend payment challenge.',
    blockers: 'Payment gateway challenge callback drops connection.',
    hasBlocker: true,
    createdAt: '2026-09-16T09:55:00Z',
    updatedAt: '2026-09-16T09:55:00Z',
  },
  {
    id: 'upd-20',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-4', // Karthik
    date: '2026-09-16',
    yesterday: 'Deployed Prometheus exporter for Redis memory and replication lag.',
    today: 'Simulating node eviction in staging to test Kubernetes PodDisruptionBudgets.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-16T10:15:00Z',
    updatedAt: '2026-09-16T10:15:00Z',
  },

  // Day 6: 2026-09-17
  {
    id: 'upd-21',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-1', // Tejasri
    date: '2026-09-17',
    yesterday: 'Completed role guards and audit log event emitter for all privilege escalations.',
    today: 'Adding automated integration test suite for cross-tenant isolation.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-17T09:10:00Z',
    updatedAt: '2026-09-17T09:10:00Z',
  },
  {
    id: 'upd-22',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-2', // Rahul
    date: '2026-09-17',
    yesterday: 'Patched 3D Secure return URL parsing in gateway callback listener.',
    today: 'Stress testing payment engine with 500 concurrent transactions.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-17T09:30:00Z',
    updatedAt: '2026-09-17T09:30:00Z',
  },
  {
    id: 'upd-23',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-3', // Ananya
    date: '2026-09-17',
    yesterday: 'Tested 3D Secure frictionless and challenge flows successfully.',
    today: 'Building order confirmation receipt view and PDF invoice generator trigger.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-17T09:50:00Z',
    updatedAt: '2026-09-17T09:50:00Z',
  },
  {
    id: 'upd-24',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-4', // Karthik
    date: '2026-09-17',
    yesterday: 'Validated zero downtime during master pod rescheduling.',
    today: 'Setting up production canary deployment manifests in ArgoCD.',
    blockers: 'Production cluster capacity limits need approval from finance.',
    hasBlocker: true,
    createdAt: '2026-09-17T10:10:00Z',
    updatedAt: '2026-09-17T10:10:00Z',
  },

  // Day 7: 2026-09-18
  {
    id: 'upd-25',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-1', // Tejasri
    date: '2026-09-18',
    yesterday: 'Completed 12 comprehensive integration tests for multi-role user workspaces.',
    today: 'Optimizing database index queries on user session lookup tables.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-18T09:15:00Z',
    updatedAt: '2026-09-18T09:15:00Z',
  },
  {
    id: 'upd-26',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-2', // Rahul
    date: '2026-09-18',
    yesterday: 'Finished 500 concurrent transaction load test; average latency was 142ms.',
    today: 'Implementing automated refund and chargeback webhook consumers.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-18T09:35:00Z',
    updatedAt: '2026-09-18T09:35:00Z',
  },
  {
    id: 'upd-27',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-3', // Ananya
    date: '2026-09-18',
    yesterday: 'Completed order confirmation page and customer order status tracker.',
    today: 'Conducting cross-browser rendering checks on Safari, Chrome, and Firefox mobile.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-18T09:55:00Z',
    updatedAt: '2026-09-18T09:55:00Z',
  },
  {
    id: 'upd-28',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-4', // Karthik
    date: '2026-09-18',
    yesterday: 'Finance budget cleared for production infrastructure scaling.',
    today: 'Configuring Cloudflare WAF rules and edge caching for static assets.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-18T10:15:00Z',
    updatedAt: '2026-09-18T10:15:00Z',
  },

  // Day 8: 2026-09-19 (Today)
  {
    id: 'upd-29',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-2', // Rahul
    date: '2026-09-19',
    yesterday: 'Completed chargeback handling and finalized payment gateway fallback mechanisms.',
    today: 'Pairing with Ananya on end-to-end user regression tests and release cut.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-19T09:25:00Z',
    updatedAt: '2026-09-19T09:25:00Z',
  },
  {
    id: 'upd-30',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-3', // Ananya
    date: '2026-09-19',
    yesterday: 'Fixed responsive layout glitches on mobile Safari viewport calculation.',
    today: 'Executing automated end-to-end checkout flow tests with Rahul.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-19T09:40:00Z',
    updatedAt: '2026-09-19T09:40:00Z',
  },
  {
    id: 'upd-31',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    userId: 'usr-dev-4', // Karthik
    date: '2026-09-19',
    yesterday: 'Verified Cloudflare SSL termination and zero-downtime origin rotation.',
    today: 'Preparing release candidate tag v3.0.0-rc1 in staging.',
    blockers: 'None',
    hasBlocker: false,
    createdAt: '2026-09-19T10:00:00Z',
    updatedAt: '2026-09-19T10:00:00Z',
  }
];

export const INITIAL_SEMANTIC_BLOCKERS: SemanticBlocker[] = [
  {
    id: 'blk-1',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    title: 'Staging Environment Access',
    description: 'Dev team blocked from deploying auth and payment services due to IAM roles and missing Vault secret permissions.',
    severity: 'High',
    status: 'resolved',
    occurrencesCount: 4,
    affectedMemberIds: ['usr-dev-1', 'usr-dev-3', 'usr-dev-4'],
    firstDetectedDate: '2026-09-10',
    lastDetectedDate: '2026-09-12',
    relatedUpdateIds: ['upd-01', 'upd-05', 'upd-07', 'upd-09'],
    resolvedAt: '2026-09-15T09:00:00Z',
    resolutionNotes: 'Vault namespaces and IAM service accounts provisioned by DevOps team.'
  },
  {
    id: 'blk-2',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    title: 'Payment Gateway Sandbox Reliability',
    description: 'Upstream payment sandbox instability, intermittent 502 responses, and 3D Secure callback dropouts during high concurrency testing.',
    severity: 'Critical',
    status: 'resolved',
    occurrencesCount: 4,
    affectedMemberIds: ['usr-dev-2', 'usr-dev-3'],
    firstDetectedDate: '2026-09-11',
    lastDetectedDate: '2026-09-16',
    relatedUpdateIds: ['upd-06', 'upd-10', 'upd-14', 'upd-18', 'upd-19'],
    resolvedAt: '2026-09-17T11:00:00Z',
    resolutionNotes: 'Provider resolved gateway outage; implemented exponential retry and async webhook queue.'
  },
  {
    id: 'blk-3',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    title: 'Code Review Bottleneck (PR #142)',
    description: 'Frontend checkout refactor blocked waiting for senior peer review and architectural sign-off.',
    severity: 'Medium',
    status: 'resolved',
    occurrencesCount: 2,
    affectedMemberIds: ['usr-dev-3'],
    firstDetectedDate: '2026-09-12',
    lastDetectedDate: '2026-09-15',
    relatedUpdateIds: ['upd-11', 'upd-15'],
    resolvedAt: '2026-09-16T09:00:00Z',
    resolutionNotes: 'PR reviewed and merged following team sync.'
  },
  {
    id: 'blk-4',
    projectId: 'prj-1',
    sprintId: 'sp-1',
    title: 'Production Infrastructure Quota Clearance',
    description: 'Cloud compute capacity limits and budget approvals required before canary cluster rollout.',
    severity: 'Low',
    status: 'resolved',
    occurrencesCount: 1,
    affectedMemberIds: ['usr-dev-4'],
    firstDetectedDate: '2026-09-17',
    lastDetectedDate: '2026-09-17',
    relatedUpdateIds: ['upd-24'],
    resolvedAt: '2026-09-18T08:30:00Z',
    resolutionNotes: 'Budget approved by finance team.'
  }
];
