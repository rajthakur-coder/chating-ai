export const BounceLoader = ({ classname = "loader" }: { classname?: string }) => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className={classname} />
    </div>
  );
};
