/**
 * Simple SHA-256 hashing using the Web Crypto API
 */
async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Pre-calculated hash for "senai"
const TARGET_USER = 'rafael';
const TARGET_HASH = '955e4e8992147f9872951717f25979854728d11c1d8c6d1d7350710631627993'; // SHA-256 of "senai"

export async function login(email: string, password: string) {
  // Simulating small delay
  await new Promise(resolve => setTimeout(resolve, 500));

  const hashedInput = await hashPassword(password);

  if (email === TARGET_USER || email === `${TARGET_USER}@example.com`) {
    if (hashedInput === TARGET_HASH) {
      const user = {
        id: 1,
        name: 'Rafael',
        email: `${TARGET_USER}@example.com`,
        avatar: `https://ui-avatars.com/api/?name=Rafael&background=random`
      };
      
      const token = 'mock-jwt-token-' + btoa(JSON.stringify(user));
      
      return { user, token };
    }
  }
  
  throw new Error('Invalid credentials');
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}
