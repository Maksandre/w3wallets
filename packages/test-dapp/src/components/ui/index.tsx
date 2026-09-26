import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";

export function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

export function Card({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-6 shadow">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const buttonVariants = {
  primary: "bg-blue-500 text-white hover:bg-blue-600",
  success: "bg-green-500 text-white hover:bg-green-600",
  danger: "bg-red-500 text-white hover:bg-red-600",
  accent: "bg-purple-500 text-white hover:bg-purple-600",
  info: "bg-indigo-500 text-white hover:bg-indigo-600",
  neutral: "bg-gray-200 text-gray-800 hover:bg-gray-300",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
}) {
  return (
    <button
      type="button"
      className={`rounded px-4 py-2 disabled:cursor-not-allowed disabled:opacity-50 ${buttonVariants[variant]} ${className}`}
      {...props}
    />
  );
}

export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-gray-600">{label}</span>
      <input
        type="text"
        className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
        {...props}
      />
    </label>
  );
}

export function Muted({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <p className="text-gray-500" data-testid={testId}>
      {children}
    </p>
  );
}

export function Result({
  ok,
  testId,
  children,
}: {
  ok: boolean;
  testId: string;
  children: ReactNode;
}) {
  return (
    <p
      role="status"
      className={`text-sm ${ok ? "text-green-600" : "text-red-600"}`}
      data-testid={testId}
    >
      {children}
    </p>
  );
}
