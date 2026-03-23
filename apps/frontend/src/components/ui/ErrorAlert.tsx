interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  return (
    <div role="alert" className="alert alert-error">
      <span>⚠</span>
      <span>{message}</span>
    </div>
  );
}
