/** Service worker registration timeout (per attempt) */
export const SERVICE_WORKER_TIMEOUT = 30_000;
/** Service worker poll interval */
export const SERVICE_WORKER_POLL_INTERVAL = 500;

/** MetaMask popup visibility check */
export const POPUP_VISIBILITY_TIMEOUT = 2_000;
/** MetaMask shield close button check */
export const SHIELD_CLOSE_TIMEOUT = 1_000;
/** MetaMask aria close button check */
export const ARIA_CLOSE_TIMEOUT = 500;
/** MetaMask popup hidden wait */
export const POPUP_HIDDEN_TIMEOUT = 3_000;

/** MetaMask post-unlock state race timeout */
export const POST_UNLOCK_TIMEOUT = 30_000;
/** MetaMask queued notification check timeout */
export const NOTIFICATION_CHECK_TIMEOUT = 5_000;
/** MetaMask post-click navigation wait */
export const POST_CLICK_TIMEOUT = 10_000;
/** MetaMask button/popup race timeout */
export const BUTTON_OR_POPUP_TIMEOUT = 30_000;
/** MetaMask last-resort click timeout */
export const LAST_RESORT_CLICK_TIMEOUT = 10_000;
/** MetaMask lock screen hidden timeout */
export const LOCK_SCREEN_TIMEOUT = 30_000;
/** MetaMask menu button visible timeout */
export const MENU_BUTTON_TIMEOUT = 30_000;
/** MetaMask onboard page visible timeout (fresh install needs longer) */
export const ONBOARD_VISIBLE_TIMEOUT = 30_000;
/** MetaMask confirmation route retry (per attempt) */
export const ROUTE_RETRY_TIMEOUT = 5_000;
/** MetaMask confirmation route max retry attempts */
export const MAX_ROUTE_ATTEMPTS = 5;

/** Delay between mnemonic word keypresses */
export const MNEMONIC_KEY_DELAY = 5;
/** Delay between mnemonic words for MM processing */
export const MNEMONIC_WORD_DELAY = 100;

/** Cache: storage stabilization total timeout */
export const STORAGE_STABILIZE_TIMEOUT = 120_000;
/** Cache: storage poll interval */
export const STORAGE_POLL_INTERVAL = 5_000;
/** Cache: consecutive stable checks required */
export const STORAGE_STABLE_CHECKS = 6;
/** Cache: helper page script execution timeout */
export const HELPER_PAGE_TIMEOUT = 10_000;
/** Cache: Chrome LevelDB flush wait */
export const LEVELDB_FLUSH_DELAY = 5_000;
