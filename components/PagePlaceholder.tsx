// components/PagePlaceholder.tsx
// Temporary placeholder body while learner pages are just navigation stubs.

export function PagePlaceholder({ name }: { name: string }) {
  return (
    <div className="flex flex-1 items-center justify-center p-10">
      <p className="text-2xl font-bold">{name} it work</p>
    </div>
  );
}
