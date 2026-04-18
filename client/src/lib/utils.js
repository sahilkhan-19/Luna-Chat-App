/** Use for axios errors from protected routes — avoid noisy toasts when session is missing/expired. */
export function isUnauthorizedAxiosError(error) {
  const status = error?.response?.status;
  return status === 401 || status === 403;
}

export function axiosErrorToastMessage(error) {
  return error?.response?.data?.message ?? error?.message ?? 'Something went wrong';
}

export function formatMessageTime(date){
    return new Date(date).toLocaleTimeString("en-US",{
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    })
}