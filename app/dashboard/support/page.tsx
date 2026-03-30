import { getOrCreateSupportConversation } from "./actions";

export default function SupportPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-[1.5rem] text-4xl mb-2 shadow-xl shadow-primary/10 rotate-3 hover:rotate-0 transition-transform">
          🛡️
        </div>
        <h1 className="text-4xl font-black text-secondary tracking-tight">
          ScienceDojo Support
        </h1>
        <p className="text-secondary/50 font-medium max-w-md mx-auto leading-relaxed">
          Have a question or need help? Send our admin team a direct message and we&apos;ll get back to you within 24 hours.
        </p>
      </div>

      {/* Support Form */}
      <section className="bg-white rounded-[2rem] p-10 border border-secondary/5 shadow-2xl shadow-secondary/5 relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-[6rem] -z-0 pointer-events-none" />

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-2xl font-black text-secondary mb-1">Message the Admin Team</h2>
            <p className="text-secondary/40 text-sm font-medium">
              Your message will open a secure, private conversation with our team.
            </p>
          </div>

          <form action={getOrCreateSupportConversation} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-secondary/40">
                What can we help you with?
              </label>
              <textarea
                name="message"
                rows={4}
                required
                placeholder="e.g. I'm having trouble with my booking, or I have a question about my account..."
                className="w-full p-4 rounded-2xl bg-slate-50 border border-secondary/10 text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-secondary/30 resize-none leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-primary text-white font-black rounded-2xl hover:bg-primary-hover transition-all shadow-xl shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-3 text-base"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Open Support Chat
            </button>
          </form>
        </div>
      </section>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: "⚡", title: "Fast Response", desc: "We aim to respond within 24 hours on weekdays." },
          { icon: "🔒", title: "Fully Secure", desc: "All messages are encrypted and private." },
          { icon: "🥋", title: "Expert Support", desc: "Our team knows ScienceDojo inside and out." },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-[1.5rem] p-6 border border-secondary/5 shadow-md text-center space-y-3 hover:shadow-xl transition-shadow group">
            <div className="text-3xl group-hover:scale-110 transition-transform inline-block">{card.icon}</div>
            <h3 className="font-black text-secondary text-sm">{card.title}</h3>
            <p className="text-xs text-secondary/50 font-medium leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
