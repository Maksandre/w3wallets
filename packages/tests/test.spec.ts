// import { test as base } from "@playwright/test";
// import { withWallets } from "../src/withWallets";

// const test = withWallets(base, { backpack: true });

// test("Can connect to Backpack", async ({ page, backpack }) => {
//   const privateKey =
//     "4wDJd9Ds5ueTdS95ReAZGSBVkjMcNKbgZk47xcmqzpUJjCt7VoB2Cs7hqwXWRnopzXqE4mCP6BEDHCYrFttEcBw2";

//   await backpack.onboard("Eclipse", privateKey);
//   await backpack.setRPC("Eclipse", "https://testnet.dev2.eclipsenetwork.xyz");

//   await page.goto("https://scope-secondary.wlbl-testnet.xyz");

//   await page.getByRole("button", { name: "Connect wallet" }).click();
//   await page.getByRole("button", { name: "Backpack" }).click();

//   await backpack.ignoreAndProceed();
//   await backpack.approve();
//   // await backpack.deny();

//   await page.getByRole("button", { name: "Bridge with Eclipse" }).click();
// });
