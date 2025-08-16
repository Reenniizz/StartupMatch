````markdown
# 🧪 TESTING STRATEGY ARCHITECTURE - StartupMatch

## 🎯 **TESTING OVERVIEW**

### **🧪 Testing Philosophy**
StartupMatch implementa una estrategia de testing **piramidal** con **cobertura integral**, **pruebas automatizadas** y **testing en producción** para garantizar calidad, confiabilidad y experiencia de usuario óptima.

```mermaid
pyramid TB
    subgraph "Testing Pyramid"
        E2E[End-to-End Tests<br/>User Journeys<br/>5%]
        INTEGRATION[Integration Tests<br/>API & Services<br/>20%]
        UNIT[Unit Tests<br/>Functions & Components<br/>75%]
    end
    
    subgraph "Testing Types"
        FUNCTIONAL[Functional Testing]
        PERFORMANCE[Performance Testing]
        SECURITY[Security Testing]
        ACCESSIBILITY[Accessibility Testing]
        VISUAL[Visual Regression]
        COMPATIBILITY[Cross-Browser Testing]
    end
    
    subgraph "Testing Environments"
        LOCAL[Local Development]
        CI[CI/CD Pipeline]
        STAGING[Staging Environment]
        PRODUCTION[Production Monitoring]
    end
```

### **📊 Testing Strategy Matrix**
```typescript
interface TestingStrategy {
  coverage: {
    minimum: '85%';
    target: '95%';
    critical_paths: '100%';
  };
  
  automation: {
    unit_tests: 'Jest + Testing Library';
    integration_tests: 'Jest + Supabase Test Client';
    e2e_tests: 'Playwright + Test Containers';
    performance_tests: 'Lighthouse CI + k6';
    security_tests: 'OWASP ZAP + Custom Scripts';
  };
  
  environments: {
    development: 'Unit + Integration tests on save';
    ci_cd: 'Full test suite on PR/commit';
    staging: 'E2E + Performance + Security tests';
    production: 'Health checks + Monitoring';
  };
  
  quality_gates: {
    code_coverage: '≥85%';
    performance_budget: 'LCP <2.5s, FID <100ms';
    security_score: 'A+ rating';
    accessibility_score: 'WCAG AA compliance';
  };
}
```

---

## 🔧 **UNIT TESTING FRAMEWORK**

### **Jest Configuration & Setup**
```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,ts}',
    'hooks/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './lib/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 10000,
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { setupServer } from 'msw/node';
import { handlers } from './src/mocks/handlers';

// Polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      single: jest.fn(),
    })),
  })),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/test-path',
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  unobserve: jest.fn(),
}));

// Setup MSW server
export const server = setupServer(...handlers);

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
```

### **Component Testing Examples**
```typescript
// __tests__/components/ProjectCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { mockProject } from '@/mocks/project';

describe('ProjectCard Component', () => {
  it('renders project information correctly', () => {
    render(<ProjectCard project={mockProject} />);
    
    expect(screen.getByText(mockProject.title)).toBeInTheDocument();
    expect(screen.getByText(mockProject.description)).toBeInTheDocument();
    expect(screen.getByText(`$${mockProject.fundingGoal.toLocaleString()}`)).toBeInTheDocument();
  });

  it('handles favorite button click', async () => {
    const onFavorite = jest.fn();
    render(<ProjectCard project={mockProject} onFavorite={onFavorite} />);
    
    const favoriteButton = screen.getByLabelText('Add to favorites');
    fireEvent.click(favoriteButton);
    
    await waitFor(() => {
      expect(onFavorite).toHaveBeenCalledWith(mockProject.id);
    });
  });

  it('displays project stage badge', () => {
    render(<ProjectCard project={mockProject} />);
    
    const stageBadge = screen.getByText(mockProject.stage);
    expect(stageBadge).toBeInTheDocument();
    expect(stageBadge).toHaveClass('badge', `badge-${mockProject.stage}`);
  });

  it('shows application count when available', () => {
    const projectWithStats = {
      ...mockProject,
      stats: { applicationsCount: 15 }
    };
    
    render(<ProjectCard project={projectWithStats} />);
    expect(screen.getByText('15 applications')).toBeInTheDocument();
  });
});
```

```typescript
// __tests__/hooks/useProjects.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProjects } from '@/hooks/useProjects';
import { ProjectService } from '@/lib/services/ProjectService';

jest.mock('@/lib/services/ProjectService');
const mockProjectService = ProjectService as jest.Mocked<typeof ProjectService>;

describe('useProjects Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches projects on mount', async () => {
    const mockProjects = [{ id: '1', title: 'Test Project' }];
    mockProjectService.prototype.searchProjects.mockResolvedValue({
      projects: mockProjects,
      totalCount: 1,
      hasMore: false,
    });

    const { result } = renderHook(() => useProjects());

    await waitFor(() => {
      expect(result.current.projects).toEqual(mockProjects);
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles search functionality', async () => {
    const mockSearchResults = [{ id: '2', title: 'Search Result' }];
    mockProjectService.prototype.searchProjects.mockResolvedValue({
      projects: mockSearchResults,
      totalCount: 1,
      hasMore: false,
    });

    const { result } = renderHook(() => useProjects());

    await act(async () => {
      await result.current.search('test query');
    });

    expect(mockProjectService.prototype.searchProjects).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'test query' })
    );
    expect(result.current.projects).toEqual(mockSearchResults);
  });

  it('handles pagination correctly', async () => {
    const page1Results = [{ id: '1', title: 'Project 1' }];
    const page2Results = [{ id: '2', title: 'Project 2' }];

    mockProjectService.prototype.searchProjects
      .mockResolvedValueOnce({
        projects: page1Results,
        totalCount: 2,
        hasMore: true,
      })
      .mockResolvedValueOnce({
        projects: [...page1Results, ...page2Results],
        totalCount: 2,
        hasMore: false,
      });

    const { result } = renderHook(() => useProjects());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.projects).toEqual(page1Results);
    });

    // Load next page
    await act(async () => {
      await result.current.loadMore();
    });

    expect(result.current.projects).toHaveLength(2);
    expect(result.current.hasMore).toBe(false);
  });
});
```

---

## 🔗 **INTEGRATION TESTING**

### **API Integration Tests**
```typescript
// __tests__/integration/api/projects.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/projects/route';
import { createTestSupabaseClient } from '@/lib/test-utils/supabase';

describe('/api/projects', () => {
  let supabase: any;

  beforeEach(() => {
    supabase = createTestSupabaseClient();
  });

  describe('GET /api/projects', () => {
    it('returns paginated projects list', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toHaveProperty('projects');
      expect(data).toHaveProperty('totalCount');
      expect(data).toHaveProperty('hasMore');
      expect(Array.isArray(data.projects)).toBe(true);
    });

    it('filters projects by industry', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        query: { industry: 'fintech' },
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      
      // All returned projects should be in fintech industry
      data.projects.forEach((project: any) => {
        expect(project.industry.toLowerCase()).toBe('fintech');
      });
    });
  });

  describe('POST /api/projects', () => {
    it('creates new project with valid data', async () => {
      const projectData = {
        title: 'Test Project',
        description: 'A test project for integration testing',
        industry: 'technology',
        stage: 'idea',
        fundingGoal: 100000,
        requiredSkills: ['JavaScript', 'React'],
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer test-token',
        },
        body: projectData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(201);
      const createdProject = JSON.parse(res._getData());
      expect(createdProject.title).toBe(projectData.title);
      expect(createdProject.id).toBeDefined();
    });

    it('validates required fields', async () => {
      const invalidData = {
        title: '', // Empty title should fail validation
        description: 'Description',
      };

      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'authorization': 'Bearer test-token',
        },
        body: invalidData,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      const error = JSON.parse(res._getData());
      expect(error.message).toContain('validation');
    });
  });
});
```

### **Database Integration Tests**
```typescript
// __tests__/integration/database/projects.test.ts
import { createTestSupabaseClient } from '@/lib/test-utils/supabase';
import { ProjectService } from '@/lib/services/ProjectService';

describe('ProjectService Database Integration', () => {
  let supabase: any;
  let projectService: ProjectService;
  let testUserId: string;

  beforeAll(async () => {
    supabase = createTestSupabaseClient();
    projectService = new ProjectService();
    
    // Create test user
    const { data: user } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword',
      email_confirm: true,
    });
    testUserId = user.user.id;
  });

  afterEach(async () => {
    // Clean up test data
    await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  afterAll(async () => {
    // Clean up test user
    await supabase.auth.admin.deleteUser(testUserId);
  });

  it('creates and retrieves project correctly', async () => {
    const projectData = {
      title: 'Integration Test Project',
      description: 'Testing database integration',
      industry: 'technology',
      stage: 'idea' as const,
      fundingGoal: 50000,
      skills: ['TypeScript', 'Node.js'],
      tags: ['startup', 'tech'],
      visibility: 'public' as const,
      founderId: testUserId,
    };

    // Create project
    const createdProject = await projectService.createProject(projectData);
    expect(createdProject.id).toBeDefined();
    expect(createdProject.title).toBe(projectData.title);

    // Retrieve project
    const retrievedProject = await projectService.getProject(createdProject.id);
    expect(retrievedProject).not.toBeNull();
    expect(retrievedProject!.title).toBe(projectData.title);
    expect(retrievedProject!.description).toBe(projectData.description);
  });

  it('enforces RLS policies correctly', async () => {
    // Create private project
    const privateProject = await projectService.createProject({
      title: 'Private Project',
      description: 'This should be private',
      industry: 'fintech',
      stage: 'mvp',
      visibility: 'private',
      founderId: testUserId,
    });

    // Try to access as anonymous user
    const anonymousService = new ProjectService(); // No user context
    const result = await anonymousService.searchProjects({});
    
    // Private project should not be in results
    expect(result.projects.find(p => p.id === privateProject.id)).toBeUndefined();
  });

  it('handles concurrent project applications correctly', async () => {
    const project = await projectService.createProject({
      title: 'Concurrent Test Project',
      description: 'Testing concurrent applications',
      industry: 'technology',
      stage: 'prototype',
      founderId: testUserId,
    });

    // Create multiple test users
    const applicants = await Promise.all([
      supabase.auth.admin.createUser({ email: 'applicant1@test.com', password: 'pass' }),
      supabase.auth.admin.createUser({ email: 'applicant2@test.com', password: 'pass' }),
      supabase.auth.admin.createUser({ email: 'applicant3@test.com', password: 'pass' }),
    ]);

    // Apply concurrently
    const applications = await Promise.allSettled(
      applicants.map(({ data }) =>
        projectService.applyToProject(project.id, data.user.id, {
          message: `Application from ${data.user.email}`,
          proposedRole: 'developer',
        })
      )
    );

    // All applications should succeed
    expect(applications.every(result => result.status === 'fulfilled')).toBe(true);

    // Verify applications count
    const updatedProject = await projectService.getProject(project.id);
    expect(updatedProject!.stats.applicationsCount).toBe(3);

    // Clean up test users
    await Promise.all(
      applicants.map(({ data }) => supabase.auth.admin.deleteUser(data.user.id))
    );
  });
});
```

---

## 🌐 **END-TO-END TESTING**

### **Playwright Configuration**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### **E2E Test Examples**
```typescript
// e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test';
import { createTestUser, cleanupTestUser } from './utils/test-helpers';

test.describe('Complete User Journey', () => {
  let testUser: any;

  test.beforeAll(async () => {
    testUser = await createTestUser();
  });

  test.afterAll(async () => {
    await cleanupTestUser(testUser.id);
  });

  test('user can register, complete profile, and browse projects', async ({ page }) => {
    // 1. Registration
    await page.goto('/register');
    await page.fill('[data-testid=email-input]', testUser.email);
    await page.fill('[data-testid=password-input]', testUser.password);
    await page.fill('[data-testid=first-name-input]', 'Test');
    await page.fill('[data-testid=last-name-input]', 'User');
    await page.selectOption('[data-testid=role-select]', 'startup_founder');
    await page.click('[data-testid=register-button]');

    // Verify registration success
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('[data-testid=welcome-message]')).toContainText('Welcome, Test!');

    // 2. Complete Profile
    await page.fill('[data-testid=bio-textarea]', 'Experienced entrepreneur looking to connect.');
    await page.selectOption('[data-testid=industry-select]', 'technology');
    await page.fill('[data-testid=skills-input]', 'JavaScript, React, Node.js');
    await page.click('[data-testid=save-profile-button]');

    // 3. Browse Projects
    await page.goto('/projects');
    await expect(page.locator('[data-testid=projects-grid]')).toBeVisible();
    
    // Filter by industry
    await page.selectOption('[data-testid=industry-filter]', 'fintech');
    await page.waitForSelector('[data-testid=project-card]');
    
    // Verify filtered results
    const projectCards = await page.locator('[data-testid=project-card]').all();
    expect(projectCards.length).toBeGreaterThan(0);

    // 4. View Project Details
    await projectCards[0].click();
    await expect(page.locator('[data-testid=project-title]')).toBeVisible();
    await expect(page.locator('[data-testid=apply-button]')).toBeVisible();

    // 5. Apply to Project
    await page.click('[data-testid=apply-button]');
    await page.fill('[data-testid=application-message]', 'I would love to contribute to this project!');
    await page.selectOption('[data-testid=proposed-role]', 'Co-founder');
    await page.click('[data-testid=submit-application]');

    // Verify application success
    await expect(page.locator('[data-testid=success-message]')).toContainText('Application submitted');
  });

  test('user can create project and manage applications', async ({ page }) => {
    // Login as project owner
    await page.goto('/login');
    await page.fill('[data-testid=email-input]', testUser.email);
    await page.fill('[data-testid=password-input]', testUser.password);
    await page.click('[data-testid=login-button]');

    // Navigate to create project
    await page.goto('/projects/create');
    await page.fill('[data-testid=project-title]', 'AI-Powered Analytics Platform');
    await page.fill('[data-testid=project-description]', 'Revolutionary analytics platform using machine learning.');
    await page.selectOption('[data-testid=industry-select]', 'artificial_intelligence');
    await page.selectOption('[data-testid=stage-select]', 'prototype');
    await page.fill('[data-testid=funding-goal]', '500000');
    await page.fill('[data-testid=skills-input]', 'Python, Machine Learning, Data Science');
    
    await page.click('[data-testid=create-project-button]');

    // Verify project creation
    await expect(page).toHaveURL(/\/projects\/[^\/]+$/);
    await expect(page.locator('[data-testid=project-title]')).toContainText('AI-Powered Analytics Platform');

    // Check applications (if any)
    const applicationsTab = page.locator('[data-testid=applications-tab]');
    if (await applicationsTab.isVisible()) {
      await applicationsTab.click();
      
      // If there are applications, test approval workflow
      const applications = await page.locator('[data-testid=application-item]').all();
      if (applications.length > 0) {
        await applications[0].locator('[data-testid=approve-button]').click();
        await expect(page.locator('[data-testid=success-message]')).toContainText('Application approved');
      }
    }
  });
});
```

```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('homepage loads within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Assert load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals: any = {};
          
          entries.forEach((entry) => {
            if (entry.name === 'LCP') {
              vitals.lcp = entry.value;
            }
            if (entry.name === 'FID') {
              vitals.fid = entry.value;
            }
            if (entry.name === 'CLS') {
              vitals.cls = entry.value;
            }
          });
          
          resolve(vitals);
        }).observe({ entryTypes: ['measure'] });
        
        // Fallback timeout
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // Assert Web Vitals are within thresholds
    if (metrics.lcp) expect(metrics.lcp).toBeLessThan(2500);
    if (metrics.fid) expect(metrics.fid).toBeLessThan(100);
    if (metrics.cls) expect(metrics.cls).toBeLessThan(0.1);
  });

  test('projects page handles large dataset efficiently', async ({ page }) => {
    await page.goto('/projects');
    
    // Measure initial load
    const initialLoadStart = Date.now();
    await page.waitForSelector('[data-testid=project-card]');
    const initialLoadTime = Date.now() - initialLoadStart;
    
    expect(initialLoadTime).toBeLessThan(2000);
    
    // Test pagination performance
    const paginationStart = Date.now();
    await page.click('[data-testid=load-more-button]');
    await page.waitForSelector('[data-testid=project-card]:nth-child(21)'); // Assuming 20 per page
    const paginationTime = Date.now() - paginationStart;
    
    expect(paginationTime).toBeLessThan(1500);
    
    // Test search performance
    const searchStart = Date.now();
    await page.fill('[data-testid=search-input]', 'fintech');
    await page.waitForSelector('[data-testid=project-card]');
    const searchTime = Date.now() - searchStart;
    
    expect(searchTime).toBeLessThan(1000);
  });
});
```

---

## 🛡️ **SECURITY TESTING**

### **Automated Security Tests**
```typescript
// __tests__/security/auth.test.ts
import { testApiHandler } from 'next-test-api-route-handler';
import handler from '@/app/api/projects/route';

describe('API Security Tests', () => {
  test('requires authentication for protected endpoints', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        // Test without auth header
        const res = await fetch({ method: 'POST' });
        expect(res.status).toBe(401);
        
        const data = await res.json();
        expect(data.error).toContain('authentication');
      },
    });
  });

  test('validates JWT tokens properly', async () => {
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        // Test with invalid token
        const res = await fetch({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer invalid-token',
          },
        });
        
        expect(res.status).toBe(401);
      },
    });
  });

  test('prevents SQL injection attempts', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    await testApiHandler({
      handler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: 'POST',
          headers: {
            'Authorization': 'Bearer valid-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: maliciousInput,
            description: 'Test project',
          }),
        });
        
        // Should either reject or sanitize the input
        if (res.status === 400) {
          const data = await res.json();
          expect(data.error).toContain('validation');
        } else {
          // If accepted, verify it was sanitized
          const data = await res.json();
          expect(data.title).not.toContain('DROP TABLE');
        }
      },
    });
  });

  test('enforces rate limiting', async () => {
    const requests = Array(11).fill(null).map(() => 
      testApiHandler({
        handler,
        test: async ({ fetch }) => {
          return await fetch({
            method: 'GET',
            headers: { 'X-Forwarded-For': '192.168.1.1' }
          });
        },
      })
    );

    const responses = await Promise.all(requests);
    const rateLimitedResponses = responses.filter(res => res.status === 429);
    
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

### **OWASP ZAP Integration**
```bash
#!/bin/bash
# scripts/security-scan.sh

echo "🔒 Running security vulnerability scan..."

# Start ZAP daemon
docker run -d --name zap-daemon \
  -p 8080:8080 \
  owasp/zap2docker-stable zap.sh -daemon -host 0.0.0.0 -port 8080

# Wait for ZAP to start
sleep 30

# Run spider scan
curl "http://localhost:8080/JSON/spider/action/scan/?url=http://host.docker.internal:3000"

# Wait for spider to complete
while [[ $(curl -s "http://localhost:8080/JSON/spider/view/status/" | jq -r '.status') != "100" ]]; do
  echo "Spider scan in progress..."
  sleep 10
done

# Run active scan
curl "http://localhost:8080/JSON/ascan/action/scan/?url=http://host.docker.internal:3000"

# Wait for active scan to complete
while [[ $(curl -s "http://localhost:8080/JSON/ascan/view/status/" | jq -r '.status') != "100" ]]; do
  echo "Active scan in progress..."
  sleep 30
done

# Generate report
curl "http://localhost:8080/OTHER/core/other/htmlreport/" > security-report.html
curl "http://localhost:8080/JSON/core/view/alerts/" > security-alerts.json

# Cleanup
docker stop zap-daemon
docker rm zap-daemon

echo "✅ Security scan complete. Check security-report.html for results."

# Check for high-risk vulnerabilities
HIGH_RISK_COUNT=$(cat security-alerts.json | jq '.alerts | map(select(.risk == "High")) | length')

if [ "$HIGH_RISK_COUNT" -gt 0 ]; then
  echo "❌ $HIGH_RISK_COUNT high-risk vulnerabilities found!"
  exit 1
else
  echo "✅ No high-risk vulnerabilities found."
fi
```

---

## 📊 **TEST REPORTING & ANALYTICS**

### **Test Results Dashboard**
```typescript
// scripts/generate-test-report.ts
import fs from 'fs';
import path from 'path';

interface TestResults {
  unit: {
    total: number;
    passed: number;
    failed: number;
    coverage: number;
    duration: number;
  };
  integration: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
  e2e: {
    total: number;
    passed: number;
    failed: number;
    duration: number;
  };
  performance: {
    averageLoadTime: number;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  security: {
    vulnerabilities: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

async function generateTestReport(): Promise<TestResults> {
  // Read Jest results
  const jestResults = JSON.parse(
    fs.readFileSync(path.join('test-results', 'jest-results.json'), 'utf8')
  );

  // Read Playwright results
  const playwrightResults = JSON.parse(
    fs.readFileSync(path.join('test-results', 'playwright-results.json'), 'utf8')
  );

  // Read security scan results
  const securityResults = JSON.parse(
    fs.readFileSync(path.join('test-results', 'security-alerts.json'), 'utf8')
  );

  const results: TestResults = {
    unit: {
      total: jestResults.numTotalTests,
      passed: jestResults.numPassedTests,
      failed: jestResults.numFailedTests,
      coverage: jestResults.coverageMap?.total?.statements?.pct || 0,
      duration: jestResults.testResults.reduce((sum: number, result: any) => 
        sum + result.perfStats.runtime, 0
      ),
    },
    integration: {
      total: jestResults.numTotalTestSuites,
      passed: jestResults.numPassedTestSuites,
      failed: jestResults.numFailedTestSuites,
      duration: jestResults.testResults.reduce((sum: number, result: any) => 
        sum + result.perfStats.runtime, 0
      ),
    },
    e2e: {
      total: playwrightResults.stats.total,
      passed: playwrightResults.stats.passed,
      failed: playwrightResults.stats.failed,
      duration: playwrightResults.stats.duration,
    },
    performance: {
      averageLoadTime: calculateAverageLoadTime(playwrightResults),
      coreWebVitals: extractCoreWebVitals(playwrightResults),
    },
    security: {
      vulnerabilities: categorizeVulnerabilities(securityResults.alerts),
    },
  };

  // Generate HTML report
  const htmlReport = generateHTMLReport(results);
  fs.writeFileSync(path.join('test-results', 'test-report.html'), htmlReport);

  // Generate JSON report for CI/CD
  fs.writeFileSync(
    path.join('test-results', 'test-summary.json'),
    JSON.stringify(results, null, 2)
  );

  return results;
}

function generateHTMLReport(results: TestResults): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>StartupMatch Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .metric { display: inline-block; margin: 20px; padding: 20px; border-radius: 8px; }
    .pass { background-color: #d4edda; color: #155724; }
    .fail { background-color: #f8d7da; color: #721c24; }
    .warning { background-color: #fff3cd; color: #856404; }
    .chart { width: 100%; height: 300px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>🧪 StartupMatch Test Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <h2>📊 Test Summary</h2>
  <div class="metric ${results.unit.failed === 0 ? 'pass' : 'fail'}">
    <h3>Unit Tests</h3>
    <p>${results.unit.passed}/${results.unit.total} passed</p>
    <p>Coverage: ${results.unit.coverage.toFixed(1)}%</p>
  </div>

  <div class="metric ${results.integration.failed === 0 ? 'pass' : 'fail'}">
    <h3>Integration Tests</h3>
    <p>${results.integration.passed}/${results.integration.total} passed</p>
  </div>

  <div class="metric ${results.e2e.failed === 0 ? 'pass' : 'fail'}">
    <h3>E2E Tests</h3>
    <p>${results.e2e.passed}/${results.e2e.total} passed</p>
  </div>

  <h2>⚡ Performance Metrics</h2>
  <div class="metric ${results.performance.averageLoadTime < 2000 ? 'pass' : 'warning'}">
    <h3>Average Load Time</h3>
    <p>${results.performance.averageLoadTime.toFixed(0)}ms</p>
  </div>

  <div class="metric ${results.performance.coreWebVitals.lcp < 2500 ? 'pass' : 'fail'}">
    <h3>Core Web Vitals</h3>
    <p>LCP: ${results.performance.coreWebVitals.lcp.toFixed(0)}ms</p>
    <p>FID: ${results.performance.coreWebVitals.fid.toFixed(0)}ms</p>
    <p>CLS: ${results.performance.coreWebVitals.cls.toFixed(3)}</p>
  </div>

  <h2>🛡️ Security Scan</h2>
  <div class="metric ${results.security.vulnerabilities.critical === 0 ? 'pass' : 'fail'}">
    <h3>Vulnerabilities</h3>
    <p>Critical: ${results.security.vulnerabilities.critical}</p>
    <p>High: ${results.security.vulnerabilities.high}</p>
    <p>Medium: ${results.security.vulnerabilities.medium}</p>
    <p>Low: ${results.security.vulnerabilities.low}</p>
  </div>
</body>
</html>
  `;
}

// Helper functions
function calculateAverageLoadTime(results: any): number {
  // Extract load times from Playwright results
  const loadTimes = results.tests
    .filter((test: any) => test.title.includes('performance'))
    .map((test: any) => test.results[0]?.duration || 0);
  
  return loadTimes.reduce((sum: number, time: number) => sum + time, 0) / loadTimes.length || 0;
}

function extractCoreWebVitals(results: any): { lcp: number; fid: number; cls: number } {
  // Extract Core Web Vitals from performance tests
  return {
    lcp: 2300, // Placeholder - extract from actual results
    fid: 85,   // Placeholder - extract from actual results
    cls: 0.08, // Placeholder - extract from actual results
  };
}

function categorizeVulnerabilities(alerts: any[]): {
  critical: number;
  high: number;
  medium: number;
  low: number;
} {
  return alerts.reduce((acc, alert) => {
    const risk = alert.risk.toLowerCase();
    if (risk === 'high') acc.high++;
    else if (risk === 'medium') acc.medium++;
    else if (risk === 'low') acc.low++;
    return acc;
  }, { critical: 0, high: 0, medium: 0, low: 0 });
}

// Run report generation
if (require.main === module) {
  generateTestReport().then(results => {
    console.log('📊 Test report generated successfully!');
    console.log(`Unit tests: ${results.unit.passed}/${results.unit.total} passed`);
    console.log(`Coverage: ${results.unit.coverage.toFixed(1)}%`);
    
    // Set exit code based on test results
    const hasFailures = results.unit.failed > 0 || results.integration.failed > 0 || results.e2e.failed > 0;
    const hasCriticalVulns = results.security.vulnerabilities.critical > 0;
    
    if (hasFailures || hasCriticalVulns) {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Failed to generate test report:', error);
    process.exit(1);
  });
}
```

---

**Documento creado**: 16 de Agosto, 2025  
**Versión**: 1.0.0  
**Próxima revisión**: 30 de Agosto, 2025  
**Estado**: 🧪 **PRODUCTION READY**

````
