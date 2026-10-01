// Publishing assignments on GitHub: one commit with the file `a/<id>.json` in the repository for assignments
// (Git Data API, so pictures may make the file larger than the 1 MB of the simple contents API). Students load it
// from raw.githubusercontent.com, which serves a new file at once. The token is kept on this device only.

export interface GithubSetup {
  /** Fine-grained token with "Contents: Read and write" for the assignments repository only. */
  token: string;
  /** "owner/name" of the repository for assignments. */
  repo: string;
}

export const DEFAULT_REPO = 'noledge5/baukasten-aufgaben';

export const assignmentPath = (id: string) => `a/${id}.json`;

/** Where students load an assignment from. */
export const assignmentSources = (repo: string, id: string) => {
  const [owner, name] = repo.split('/');
  return [`https://raw.githubusercontent.com/${repo}/main/${assignmentPath(id)}`, `https://${owner}.github.io/${name}/${assignmentPath(id)}`];
};

export class GithubError extends Error {}

async function call<T>(setup: GithubSetup, path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${setup.repo}${path}`, {
      ...init,
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${setup.token}`, 'X-GitHub-Api-Version': '2022-11-28', ...(init.body ? { 'Content-Type': 'application/json' } : {}) },
    });
  } catch {
    throw new GithubError('GitHub ist gerade nicht erreichbar. Besteht eine Internetverbindung?');
  }
  if (res.status === 401) throw new GithubError('Der GitHub-Schlüssel stimmt nicht oder ist abgelaufen. Bitte unter „Digital austeilen → Einrichten“ einen neuen eintragen.');
  if (res.status === 403) throw new GithubError(`Der GitHub-Schlüssel darf im Repository „${setup.repo}“ nicht schreiben (Berechtigung „Contents: Read and write“ fehlt).`);
  if (res.status === 404) throw new GithubError(`Das Repository „${setup.repo}“ gibt es nicht, oder der Schlüssel hat keinen Zugriff darauf.`);
  if (!res.ok) throw new GithubError(`GitHub hat mit Fehler ${res.status} geantwortet.`);
  return (await res.json()) as T;
}

/** Whether the token can reach the repository; returns its branch for publishing. */
export async function checkSetup(setup: GithubSetup): Promise<string> {
  const repo = await call<{ default_branch: string; permissions?: { push?: boolean } }>(setup, '');
  if (repo.permissions && !repo.permissions.push) throw new GithubError(`Der GitHub-Schlüssel darf im Repository „${setup.repo}“ nur lesen.`);
  return repo.default_branch || 'main';
}

const utf8Base64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
};

/** Puts files into the repository as one commit on its main branch. */
export async function publishFiles(setup: GithubSetup, files: Record<string, string>, message: string): Promise<void> {
  const branch = await checkSetup(setup);
  const ref = await call<{ object: { sha: string } }>(setup, `/git/ref/heads/${branch}`);
  const head = await call<{ tree: { sha: string } }>(setup, `/git/commits/${ref.object.sha}`);
  const tree = [];
  for (const [path, content] of Object.entries(files)) {
    const blob = await call<{ sha: string }>(setup, '/git/blobs', { method: 'POST', body: JSON.stringify({ content: utf8Base64(content), encoding: 'base64' }) });
    tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
  }
  const newTree = await call<{ sha: string }>(setup, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: head.tree.sha, tree }) });
  const commit = await call<{ sha: string }>(setup, '/git/commits', { method: 'POST', body: JSON.stringify({ message, tree: newTree.sha, parents: [ref.object.sha] }) });
  await call(setup, `/git/refs/heads/${branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha }) });
}
