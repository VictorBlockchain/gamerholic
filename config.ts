import {
    AlchemyAccountsUIConfig,
    cookieStorage,
    createConfig,
  } from "@account-kit/react";
  import { alchemy, sepolia } from "@account-kit/infra";
  import { QueryClient } from "@tanstack/react-query";
  
  const uiConfig: AlchemyAccountsUIConfig = {
    illustrationStyle: "outline",
    auth: {
      sections: [
        [{ type: "email" }],
        [
          { type: "passkey" },
          { type: "social", authProviderId: "google", mode: "popup" },
          { type: "social", authProviderId: "facebook", mode: "popup" },
        ],
        [
          {
            type: "external_wallets",
            walletConnect: { projectId: "9db245ba10b32040b3da01bbefc78b0f" },
          },
        ],
      ],
      addPasskeyOnSignup: false,
    },
  };
  
  export const config = createConfig(
    {
      transport: alchemy({ apiKey: "oeOSBvYsz7PavVN3cSrhVopbroLg12e" }), // TODO: add your Alchemy API key - https://dashboard.alchemy.com/accounts
      chain: sepolia,
      ssr: true, // more about ssr: https://accountkit.alchemy.com/react/ssr
      storage: cookieStorage, // more about persisting state with cookies: https://accountkit.alchemy.com/react/ssr#persisting-the-account-state
      enablePopupOauth: true, // must be set to "true" if you plan on using popup rather than redirect in the social login flow
    },
    uiConfig
  );
  
  export const queryClient = new QueryClient();
  