import { setupServer } from 'msw/node';

import { handlers } from '@/test/msw/handlers';

/** Node request interception for tests. Lifecycle is managed in src/test/setup.ts. */
export const server = setupServer(...handlers);
