import { Avatar } from './Avatar';

type UserChipProps = {
  name: string;
  meta?: string;
};

export function UserChip({ name, meta }: UserChipProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-2.5 pr-1.5">
      <div className="leading-tight text-right">
        <div className="text-[13px] font-medium text-text">{name}</div>
        {meta && <div className="font-mono text-[11px] text-text-3">{meta}</div>}
      </div>
      <Avatar name={name} />
    </div>
  );
}
