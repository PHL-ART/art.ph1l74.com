import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="bg-footer border-t border-hairline py-8 px-5 md:px-12">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Logo size={28} />
        <p className="font-nav uppercase tracking-widest text-[10px] text-caption">
          powered by PHL·ART © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  )
}
