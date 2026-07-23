export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center font-display text-3xl text-ink">
          TradeJournal
        </div>
        {children}
      </div>
    </div>
  );
}
