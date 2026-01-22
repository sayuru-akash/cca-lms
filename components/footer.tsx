"use client";

import { Terminal, Github, Twitter, Mail } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-terminal-green/20 bg-terminal-darker/50 backdrop-blur-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-6 w-6 text-terminal-green" />
              <span className="font-mono text-lg font-bold text-terminal-green">
                CCA_LMS
              </span>
            </div>
            <p className="text-sm font-mono text-terminal-text-muted">
              Modern learning management system with terminal aesthetics.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-mono text-sm font-semibold text-terminal-green mb-3">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {["Dashboard", "Courses", "Students", "Analytics"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm font-mono text-terminal-text-muted hover:text-terminal-green transition-colors"
                  >
                    $ {item.toLowerCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-mono text-sm font-semibold text-terminal-green mb-3">
              Resources
            </h3>
            <ul className="space-y-2">
              {["Documentation", "API", "Support", "FAQ"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm font-mono text-terminal-text-muted hover:text-terminal-green transition-colors"
                  >
                    $ {item.toLowerCase()}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-mono text-sm font-semibold text-terminal-green mb-3">
              Connect
            </h3>
            <div className="flex gap-2">
              {[
                { icon: Github, label: "GitHub" },
                { icon: Twitter, label: "Twitter" },
                { icon: Mail, label: "Email" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href="#"
                    aria-label={item.label}
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                  >
                    <Icon className="h-4 w-4 text-terminal-green" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-terminal-green/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm font-mono text-terminal-text-muted">
              © {currentYear} CCA_LMS. All rights reserved.
            </p>
            <p className="text-xs font-mono text-terminal-text-muted">
              <span className="text-terminal-green">$</span> Built with Next.js,
              TypeScript & Prisma
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
