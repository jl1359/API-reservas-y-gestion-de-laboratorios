import webpush from 'web-push';

export const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY ||
  'BCF6_VDBU2hcitxIt6pTWowF8_p_mPGN9nS3-w6V6gwLSWeeSEobOG1sINWLa-K_cEMoBSVFHe5dfbCcD43dKaQ';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'yMZX_Pf16T0xbA3t2UylgxaGIlg3knahJKeRiekusGM';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || 'mailto:jl1533336@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

export default webpush;
