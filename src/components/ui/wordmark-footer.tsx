"use client"

import * as React from "react"
import { Plus } from "lucide-react"

import { cn } from "@/lib/utils"

// at least 44 px tall wherever a finger taps it
const tap =
  "max-md:inline-flex max-md:min-h-11 max-md:items-center pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"

export type FooterColumn = { title: string; links: { label: string; href: string }[] }

export interface WordmarkFooterProps extends React.HTMLAttributes<HTMLElement> {
  /** The product name: the wordmark top left and the large name at the bottom. */
  name: string
  /** The name in the © line. */
  legalName?: string
  year: number
  description?: string
  email?: string
  /** A short status line next to a green dot, such as "All systems normal". */
  status?: string
  /** What screen readers call the footer navigation. */
  navLabel?: string
  columns: FooterColumn[]
  /** A small link at the end of the bottom line. */
  credit?: { label: string; href: string }
}

/**
 * A footer with a short description, link columns that fold on phones, and the product name set large,
 * fading into the background.
 */
export function WordmarkFooter({
  name,
  legalName,
  year,
  description,
  email,
  status,
  navLabel = "Footer",
  columns,
  credit,
  className,
  ...props
}: WordmarkFooterProps) {
  return (
    <footer className={cn("relative overflow-hidden border-t border-sand bg-ivory text-ink", className)} {...props}>
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 pt-16 pb-10 max-md:gap-6 max-md:pt-12 max-md:pb-6 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <span className="block font-display text-[25px] leading-none tracking-[-0.02em]">{name}</span>
          {description && <p className="mt-4 max-w-[300px] text-[14px] leading-[22px] text-slate">{description}</p>}
          {status && (
            <p className="mt-6 inline-flex items-center gap-2 text-[13px] text-slate">
              <span className="size-2 rounded-full bg-sage" aria-hidden="true" />
              {status}
            </p>
          )}
        </div>
        <nav aria-label={navLabel} className="grid grid-cols-2 gap-8 max-md:hidden md:col-span-6 md:col-start-7 lg:grid-cols-3">
          {columns.map((col) => (
            <div key={col.title}>
              <p className="font-mono text-[11px] tracking-[0.14em] text-mist uppercase">{col.title}</p>
              <ul className="mt-4 grid gap-2.5 pointer-coarse:mt-2 pointer-coarse:gap-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className={cn("text-[14px] text-slate transition-colors hover:text-ink", tap)}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {/* phones: each column folds away; tap a heading to open it */}
        <nav aria-label={navLabel} className="-mx-4 grid gap-1 md:hidden">
          {columns.map((col) => (
            <details key={col.title} className="group rounded-2xl open:bg-ink/[0.03]">
              <summary className="flex h-14 cursor-pointer list-none items-center justify-between px-4 [&::-webkit-details-marker]:hidden">
                <span className="font-mono text-[12px] tracking-[0.14em] text-slate uppercase">{col.title}</span>
                <Plus
                  className="size-4 text-mist transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
              </summary>
              <ul className="px-4 pb-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} className="block py-3 text-[15px] text-slate">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </nav>
      </div>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-2 px-6 pb-6 text-[13px] text-mist sm:flex-row sm:items-center sm:gap-6 md:px-10">
        <p className="font-mono tabular-nums">
          © {year} {legalName ?? name}
        </p>
        {email && (
          <a href={`mailto:${email}`} className={cn("hover:text-ink", tap)}>
            {email}
          </a>
        )}
        {credit && (
          <a href={credit.href} className={cn("hover:text-ink sm:ml-auto", tap)}>
            {credit.label}
          </a>
        )}
      </div>
      {/* the name, set large and fading into the background */}
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.2em] select-none text-center text-[clamp(56px,13vw,208px)] leading-[0.9] tracking-[-0.04em] text-transparent [background-clip:text] [-webkit-background-clip:text]"
        style={{ backgroundImage: "linear-gradient(to bottom, rgb(var(--champagne) / 0.32), transparent 85%)" }}
      >
        {name}
      </p>
    </footer>
  )
}

export default WordmarkFooter
