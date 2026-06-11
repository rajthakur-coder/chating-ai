type AppLoadingProps = {
  label?: string;
};

export default function AppLoading({ label = "Loading..." }: AppLoadingProps) {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-8 p-8">
        

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            AlignChat
          </h1>
        </div>

        <div className="flex space-x-2">
          <div className="h-2 w-2 animate-bounce rounded-full bg-primary" />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="h-2 w-2 animate-bounce rounded-full bg-primary"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
        

        <p className="animate-pulse text-xs text-muted">{label}</p>
      </div>
    </div>
  );
}
