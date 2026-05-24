type Props = {
  loading?: boolean;
  error?: string | null;
  label?: string;
};

export function Status({ loading, error, label = "Loading market intelligence" }: Props) {
  if (loading) {
    return <div className="state state-loading">{label}...</div>;
  }

  if (error) {
    return <div className="state state-error">{error}</div>;
  }

  return null;
}
