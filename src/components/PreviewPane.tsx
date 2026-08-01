export function PreviewPane({ html }: { html: string }) {
  if (!html) return <div className="flex-1 grid place-items-center text-slate-500">预览区</div>
  return (
    <iframe
      title="preview"
      sandbox="allow-scripts"
      srcDoc={html}
      className="flex-1 w-full bg-white rounded-lg border border-slate-800"
    />
  )
}
