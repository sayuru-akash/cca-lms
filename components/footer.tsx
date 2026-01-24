"use client";

import { Terminal, Github, Instagram, Facebook, Globe } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-terminal-green/20 bg-terminal-darker/50 backdrop-blur-sm mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-6 w-6 text-terminal-green" />
              <span className="font-mono text-lg font-bold text-terminal-green">
                CCA_LMS
              </span>
            </div>
            <p className="text-sm font-mono text-terminal-text-muted">
              Codezela Career Accelerator - Learning Management System
            </p>
          </div>

          {/* Connect */}
          <div className="flex flex-col items-start md:items-end">
            <h3 className="font-mono text-sm font-semibold text-terminal-green mb-3">
              Connect
            </h3>
            <div className="flex gap-2">
              <a
                href="https://github.com/codezelat/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
              >
                <Github className="h-4 w-4 text-terminal-green" />
              </a>
              <a
                href="https://facebook.com/codezelaca"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
              >
                <Facebook className="h-4 w-4 text-terminal-green" />
              </a>
              <a
                href="https://instagram.com/codezelaca"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
              >
                <Instagram className="h-4 w-4 text-terminal-green" />
              </a>
              <a
                href="https://codezela.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CodeZela Website"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
              >
                <Globe className="h-4 w-4 text-terminal-green" />
              </a>
              <a
                href="https://cca.it.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="CCA Website"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-terminal-green/20 bg-terminal-darker transition-all hover:border-terminal-green hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]"
              >
                <Globe className="h-4 w-4 text-terminal-green" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-terminal-green/20">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm font-mono text-terminal-text-muted">
              © {currentYear} Codezela Career Accelerator. All rights reserved.
            </p>
            <p className="text-sm font-mono text-terminal-text-muted">
              Developed with <span className="text-red-500">❤️</span> by{" "}
              <span className="text-terminal-green">Codezela Technologies</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
