import { User } from '../types';

const STORAGE_KEY = 'teatro_users_v1';

const DEFAULT_USERS: User[] = [
  {
    id: 'USR-001',
    email: 'admin@teatro.edu.co',
    password: 'admin123',
    fullName: 'Administrador General',
    role: 'admin',
    createdAt: '2026-01-10',
    active: true,
  },
  {
    id: 'USR-002',
    email: 'taquilla@teatro.edu.co',
    password: 'taquilla123',
    fullName: 'Taquillero Principal',
    role: 'taquillero',
    createdAt: '2026-01-15',
    active: true,
  },
  {
    id: 'USR-003',
    email: 'espectador@teatro.edu.co',
    password: 'espectador123',
    fullName: 'Público General',
    role: 'espectador',
    createdAt: '2026-02-01',
    active: true,
  },
];

export function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as User[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* ignore */
  }
  saveUsers(DEFAULT_USERS);
  return DEFAULT_USERS;
}

export function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function authenticateUser(
  email: string,
  password: string
): User | null {
  const users = loadUsers();
  const found = users.find(
    (u) => u.email === email && u.password === password && u.active
  );
  return found || null;
}

export function addUser(user: User): void {
  const users = loadUsers();
  users.push(user);
  saveUsers(users);
}

export function updateUser(id: string, updates: Partial<User>): void {
  const users = loadUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx !== -1) {
    users[idx] = { ...users[idx], ...updates };
    saveUsers(users);
  }
}

export function deleteUser(id: string): void {
  const users = loadUsers().filter((u) => u.id !== id);
  saveUsers(users);
}

export function generateUserId(): string {
  const users = loadUsers();
  const maxNum = users.reduce((max, u) => {
    const num = parseInt(u.id.replace('USR-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `USR-${String(maxNum + 1).padStart(3, '0')}`;
}
