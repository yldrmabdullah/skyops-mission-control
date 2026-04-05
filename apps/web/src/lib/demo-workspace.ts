export const demoWorkspaceHintEnabled =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_LOGIN === 'true';

export const demoManagerEmail =
  import.meta.env.VITE_DEMO_EMAIL ?? 'ops@skyops.demo';

export const demoManagerPassword =
  import.meta.env.VITE_DEMO_PASSWORD ?? 'SkyOpsDemo1';
