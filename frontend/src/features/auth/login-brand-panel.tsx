import { BrandMark } from "@/components/shared/logo";

/** Brand-only presentation; no authentication state. */
export function LoginBrandPanel() {
  return (
    <aside
      className="relative isolate hidden min-h-dvh items-center justify-center
                 overflow-hidden bg-[#111116] px-12 py-16 text-white lg:flex"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "52px 52px",
          maskImage:
            "radial-gradient(ellipse at center, black, transparent 82%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-44 -left-52 size-[470px]
                   rounded-full bg-primary/15 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-48 -bottom-44 size-[500px]
                   rounded-full bg-primary/10 blur-[120px]"
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center text-center">
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute inset-0 scale-125 rounded-[30px] bg-primary/15 blur-2xl"
          />
          <div
            className="relative flex size-28 items-center justify-center
                       rounded-[28px] border border-primary/25 bg-primary/10
                       shadow-[0_20px_80px_-30px_rgba(254,104,7,0.45)]"
          >
            <BrandMark className="size-20 text-primary" />
          </div>
        </div>

        <div className="mt-10 space-y-3">
          <p className="text-4xl font-semibold tracking-tight xl:text-5xl">
            Optimus <span className="text-primary">Fox</span>
          </p>
          <p className="text-sm font-medium tracking-[0.16em] text-white/65 uppercase">
            Project Management System
          </p>
        </div>

        <div
          aria-hidden="true"
          className="my-9 h-px w-24 bg-gradient-to-r
                     from-transparent via-primary to-transparent"
        />

        <p className="max-w-sm text-xl font-medium leading-8 tracking-tight text-white/90">
          Bring your team's work into focus.
        </p>
        <p className="mt-4 max-w-sm text-sm leading-7 text-white/60">
          Keep priorities clear, projects moving, and everyone aligned in one
          workspace.
        </p>
      </div>
    </aside>
  );
}
