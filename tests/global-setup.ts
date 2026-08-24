import { ensureApiUp } from './backend';

/**
 * Several specs kill the backend on purpose. They restore it themselves, but a
 * run that is interrupted (or a previous run that crashed) can leave it down,
 * and then the first specs in the suite fail for a reason that has nothing to
 * do with what they assert. Guarantee it is up before anything starts.
 */
export default async function globalSetup() {
  await ensureApiUp();
}
