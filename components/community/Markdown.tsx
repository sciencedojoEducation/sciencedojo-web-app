import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Renders community post bodies from Markdown. No raw HTML is allowed (react-
// markdown ignores it by default), so user/editorial content cannot inject
// scripts. Headings start at h2 so a post never competes with the page h1.
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: (props) => <p className="mb-4 last:mb-0" {...props} />,
          ul: (props) => <ul className="mb-4 list-disc space-y-1 pl-6" {...props} />,
          ol: (props) => <ol className="mb-4 list-decimal space-y-1 pl-6" {...props} />,
          li: (props) => <li className="leading-7" {...props} />,
          h1: (props) => <h2 className="mb-3 mt-6 text-2xl font-black text-secondary" {...props} />,
          h2: (props) => <h2 className="mb-3 mt-6 text-xl font-black text-secondary" {...props} />,
          h3: (props) => <h3 className="mb-2 mt-5 text-lg font-black text-secondary" {...props} />,
          strong: (props) => <strong className="font-black text-secondary" {...props} />,
          em: (props) => <em className="italic" {...props} />,
          a: (props) => <a className="text-primary underline" target="_blank" rel="noopener noreferrer nofollow" {...props} />,
          blockquote: (props) => <blockquote className="my-4 border-l-4 border-primary/30 pl-4 italic text-secondary/60" {...props} />,
          code: (props) => <code className="rounded bg-secondary/5 px-1 py-0.5 text-[0.9em]" {...props} />,
          hr: () => <hr className="my-6 border-secondary/10" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
