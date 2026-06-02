export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong",
): string => {
  if (typeof error === "object" && error !== null) {
    const maybeError = error as {
      data?: { message?: string };
      response?: { data?: { message?: string } };
      message?: string;
    };

    return (
      maybeError.response?.data?.message ||
      maybeError.data?.message ||
      maybeError.message ||
      fallback
    );
  }

  return fallback;
};
