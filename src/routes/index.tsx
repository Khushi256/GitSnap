import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import AnoAI from "@/components/ui/animated-shader-background";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GitSnap" },
      {
        name: "description",
        content:
          "Enter any GitHub username and explore a rich visual dashboard: contribution heatmap, languages, top repos, work-style breakdown, and more.",
      },
      { property: "og:title", content: "GitSnap" },
      {
        property: "og:description",
        content:
          "A visually rich dashboard of any GitHub user's activity — built with custom SVG charts.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSearch = (username: string) => {
    setLoading(true);
    navigate({ to: "/$username", params: { username } });
  };

  return (
    <>
      <div className="fixed inset-0 z-0 overflow-hidden">
        <AnoAI />
      </div>
      <div className="relative z-1 min-h-screen overflow-x-hidden flex flex-col justify-center py-8 sm:py-16">
        {/* Logo in Top-Left Corner */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10 flex items-center gap-2 animate-fade-up">
          <img src="/gitsnap-logo.png" alt="GitSnap" className="h-7 w-7 sm:h-8 sm:w-8" />
          <span className="text-sm sm:text-base font-bold gradient-text">GitSnap</span>
        </div>

        <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Hero */}
          <header className="text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs tracking-wide text-zinc-300 backdrop-blur animate-fade-in-scale">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              Visual Git Analytics
            </div>
            <h1 className="mt-8 text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight drop-shadow-lg uppercase leading-tight lg:leading-none animate-fade-up animate-delay-100">
              Your Code As <br className="hidden sm:block" /> A Digital{" "}
              <span className="gradient-blue-grey">Legacy.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-sm sm:text-base text-white/70 leading-relaxed tracking-normal animate-fade-up animate-delay-200">
              Transform raw Git data into a curated gallery. Visualize
              <br /> contributions, identify trends, and showcase your
              <br /> engineering narrative.
            </p>
            <div className="mt-10 flex justify-center animate-fade-up animate-delay-300">
              <SearchBar initial="" onSubmit={handleSearch} loading={loading} />
            </div>
          </header>

          <div className="mx-auto mt-16 sm:mt-32 max-w-md text-center text-xs sm:text-sm text-white/50 animate-fade-in animate-delay-400">
            Enter a username above to begin exploring.
          </div>
        </div>
      </div>
    </>
  );
}
