export type CurrentUser = {
  id?: string;
  email?: string;
  name?: string;
};

export type SignInPayload = {
  email: string;
  password: string;
};

export type SignInResponse = {
  id?: string;
  email?: string;
  name?: string;
  verified?: boolean;
  onboarding_completed?: boolean;
  message?: string;
};
