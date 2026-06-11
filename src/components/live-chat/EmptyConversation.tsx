export default function EmptyConversation() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-surface px-6 text-center">
      <div>
        <p className="text-base font-semibold text-foreground">No conversation selected</p>
        <p className="mt-2 text-sm text-muted">
          Chats from the API will appear here when messages are available.
        </p>
      </div>
    </div>
  );
}
