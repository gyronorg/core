declare module 'download-git-repo' {
  function download(
    repo: string,
    dest: string,
    opts: { clone: boolean },
    fn: (err: string | null) => void
  ): void
  function download(
    repo: string,
    dest: string,
    fn: (err: string | null) => void
  ): void
  export default download
}
