import { ToasterUtils } from "@/components/ui/toast";
import { getApiErrorMessage } from "./apiError";

interface RunWithToastParams<T> {
  action: () => Promise<T>;
  successMessage?: string;
  errorMessage?: string;
  getSuccessMessage?: (result: T) => string | undefined;
}

export const runWithToast = async <T>({
  action,
  successMessage,
  errorMessage,
  getSuccessMessage,
}: RunWithToastParams<T>): Promise<T> => {
  try {
    const result = await action();
    const resolvedSuccess = getSuccessMessage?.(result) || successMessage;
    if (resolvedSuccess) {
      ToasterUtils.success(resolvedSuccess);
    }
    return result;
  } catch (error: unknown) {
    ToasterUtils.error(getApiErrorMessage(error, errorMessage));
    throw error;
  }
};
