export function Stepper({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="stepper">
      {labels.map((label, index) => (
        <li className={index + 1 <= current ? "active" : ""} key={label}>
          <span>{index + 1}</span>
          <strong>{label}</strong>
        </li>
      ))}
    </ol>
  );
}
