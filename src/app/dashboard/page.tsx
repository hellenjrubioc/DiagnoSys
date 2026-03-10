"use client";
import React from "react";
import { useSession } from "next-auth/react";

export default function Page() {
    const { data: session } = useSession();

  const steps = [
    {
      id: 1,
      step: "Zoom In",
      title: "Assess your organization",
      desc: "Analyze your strategic and hidden skills, capabilities, and assets.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 2,
      step: "Zoom Out",
      title: "Observe the environment",
      desc: "Identify trends, market forces, industry dynamics, and macroeconomic context.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 2v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 20v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4.9 4.9l1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.7 18.7l1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      id: 3,
      step: "Categorization",
      title: "Define impact",
      desc: "Classify findings as opportunities, needs, or problems.",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      ),
    },
    {
      id: 4,
      step: "Prioritization",
      title: "Plan actions",
      desc: "Rank initiatives according to growth horizons (H1, H2, H3).",
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 2v20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
  ];

  return (
    <main className="min-h-screen py-12 px-6 sm:px-12 lg:px-24">
      <section className="max-w-5xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">Strategic Diagnostic Platform for Digital Transformation</h1>
            <p className="text-sm text-gray-600 mt-1">DiagnoSys — understand, assess, and project your organization’s digital transformation with a guided, flexible, and strategic tool.</p>
          </div>
        </header>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {steps.map((s) => (
            <article
              key={s.id}
              className="group rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition transform hover:-translate-y-1 green-interactive"
              aria-labelledby={`step-${s.id}-title`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-none rounded-lg bg-green-200 p-3 text-primary">{s.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-primary uppercase">Step {s.id}</p>
                    <div className="text-xs text-gray-600">{s.step}</div>
                  </div>
                  <h3 id={`step-${s.id}-title`} className="mt-2 text-lg font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">Estimated duration: <strong>~3–6 min</strong></div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-10 border border-gray-100 rounded-2xl p-6 green-interactive">
          <h4 className="text-base font-semibold text-gray-900">Target Users</h4>
          <p className="mt-2 text-sm text-gray-600">
            Companies, undergraduate and graduate students, consultants, and individuals interested in accelerating or learning about digital transformation through technology intelligence-based methodologies.
          </p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-primary green-interactive">
              <p className="text-sm font-medium text-gray-800">Companies</p>
              <p className="text-xs text-gray-500 mt-1">Strategic diagnostics for transformation planning.</p>
            </div>
            <div className="p-4 rounded-lg border border-primary green-interactive">
              <p className="text-sm font-medium text-gray-800">Students</p>
              <p className="text-xs text-gray-500 mt-1">Practical tool for learning and academic projects.</p>
            </div>
            <div className="p-4 rounded-lg border border-primary green-interactive">
              <p className="text-sm font-medium text-gray-800">Consultants</p>
              <p className="text-xs text-gray-500 mt-1">Structured tool for client work and assessments.</p>
            </div>
          </div>
        </section>

        <footer className="mt-12 text-sm text-gray-600 border-t pt-6">
          <p><strong>Contact:</strong> <a href="mailto:proyectogestionti@gmail.com" className="text-indigo-600 hover:underline">proyectogestionti@gmail.com</a></p>
          <p className="mt-1"><strong>Credits:</strong> Jhon Fredy Hoyos Cárdenas, Daniel Ramírez Cárdenas, Hellen Jakeline Rubio</p>
          <p className="mt-1 text-gray-500 italic">This project is developed as part of the research initiative <strong>“Data Governance Framework for Universities.”</strong> PI: Gina Maestre.</p>
        </footer>
      </section>
    </main>
  );
}