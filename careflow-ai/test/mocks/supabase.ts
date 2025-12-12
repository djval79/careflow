/**
 * Supabase Mock
 * 
 * Mock implementation of Supabase client for testing.
 */

import { vi } from 'vitest';

// Mock data
export const mockClients = [
  {
    id: 'client-1',
    name: 'John Doe',
    age: 75,
    address: '123 Care Street',
    care_level: 'Medium',
    status: 'Active',
    funding_source: 'Council',
    contract_id: 'CTR-001',
    budget_limit: 2000,
    emergency_contact_name: 'Jane Doe',
    emergency_contact_relation: 'Daughter',
    emergency_contact_phone: '07700 900000',
  },
  {
    id: 'client-2',
    name: 'Mary Smith',
    age: 82,
    address: '456 Health Lane',
    care_level: 'High',
    status: 'Active',
    funding_source: 'NHS',
    contract_id: 'CTR-002',
    budget_limit: 3500,
    emergency_contact_name: 'Tom Smith',
    emergency_contact_relation: 'Son',
    emergency_contact_phone: '07700 900001',
  },
];

export const mockStaff = [
  {
    id: 'staff-1',
    name: 'Sarah Wilson',
    email: 'sarah@careflow.com',
    phone: '07700 800000',
    role: 'Senior Carer',
    status: 'Active',
    created_at: '2023-01-15T00:00:00Z',
    skills: ['First Aid', 'Dementia Care'],
    training_records: [
      { id: 'tr-1', training_name: 'Safeguarding', expiry_date: '2024-12-31', status: 'Valid' },
    ],
  },
  {
    id: 'staff-2',
    name: 'James Brown',
    email: 'james@careflow.com',
    phone: '07700 800001',
    role: 'Carer',
    status: 'Active',
    created_at: '2023-06-01T00:00:00Z',
    skills: ['First Aid'],
    training_records: [],
  },
];

export const mockVisits = [
  {
    id: 'visit-1',
    client_id: 'client-1',
    employee_id: 'staff-1',
    visit_date: '2024-01-15',
    start_time: '09:00',
    end_time: '10:00',
    visit_type: 'Personal Care',
    status: 'Scheduled',
    clients: { name: 'John Doe' },
    employees: { name: 'Sarah Wilson' },
  },
];

export const mockIncidents = [
  {
    id: 'incident-1',
    client_id: 'client-1',
    reported_by: 'staff-1',
    incident_date: '2024-01-10',
    severity: 'Medium',
    status: 'Open',
    description: 'Minor fall in bathroom',
    clients: { name: 'John Doe' },
  },
];

// Query builder mock
function createQueryBuilder(data: unknown[]) {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: data[0], error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: data[0], error: null }),
    then: vi.fn((callback) => callback({ data, error: null })),
  };

  // Make it thenable
  Object.defineProperty(builder, 'then', {
    value: (resolve: (value: { data: unknown; error: null }) => void) => {
      resolve({ data, error: null });
      return Promise.resolve({ data, error: null });
    },
  });

  return builder;
}

// Mock Supabase client
export const mockSupabase = {
  from: vi.fn((table: string) => {
    switch (table) {
      case 'clients':
        return createQueryBuilder(mockClients);
      case 'employees':
        return createQueryBuilder(mockStaff);
      case 'visits':
        return createQueryBuilder(mockVisits);
      case 'incidents':
        return createQueryBuilder(mockIncidents);
      default:
        return createQueryBuilder([]);
    }
  }),
  rpc: vi.fn().mockResolvedValue({ data: [], error: null }),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
};

// Reset all mocks
export function resetSupabaseMocks() {
  vi.clearAllMocks();
}

export default mockSupabase;
