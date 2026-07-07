export function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      <button type="button">{action}</button>
    </div>
  );
}
