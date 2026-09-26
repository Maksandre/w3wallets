import {
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
  Outlet,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({ component: Outlet });

// Each page loads its own wallet stack (wagmi vs polkadot-api) on demand.
const routeTree = rootRoute.addChildren([
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: lazyRouteComponent(() => import("./pages/EthereumPage"), "EthereumPage"),
  }),
  createRoute({
    getParentRoute: () => rootRoute,
    path: "/polkadot",
    component: lazyRouteComponent(() => import("./pages/PolkadotPage"), "PolkadotPage"),
  }),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
