declare module 'download-git-repo' {
  export function download(
    repo: string,
    dest: string,
    opts: { clone: boolean },
    fn: (err: string | null) => void
  ): void
  export default function download(
    repo: string,
    dest: string,
    fn: (err: string | null) => void
  ): void
}
