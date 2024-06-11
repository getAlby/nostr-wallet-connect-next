import { RouterProvider, createHashRouter } from "react-router-dom";

import { ThemeProvider } from "src/components/ui/theme-provider";
import { usePosthog } from "./hooks/usePosthog";

import AppLayout from "src/components/layouts/AppLayout";
import SettingsLayout from "src/components/layouts/SettingsLayout";
import { DefaultRedirect } from "src/components/redirects/DefaultRedirect";
import { HomeRedirect } from "src/components/redirects/HomeRedirect";
import { Toaster } from "src/components/ui/toaster";
import { BackupMnemonic } from "src/screens/BackupMnemonic";
import { BackupNode } from "src/screens/BackupNode";
import { Intro } from "src/screens/Intro";
import NotFound from "src/screens/NotFound";
import AppList from "src/screens/apps/AppList";
import NewApp from "src/screens/apps/NewApp";
import ShowApp from "src/screens/apps/ShowApp";
import AppStore from "src/screens/appstore/AppStore";
import Channels from "src/screens/channels/Channels";
import { CurrentChannelOrder } from "src/screens/channels/CurrentChannelOrder";
import NewChannel from "src/screens/channels/NewChannel";
import BuyBitcoin from "src/screens/onchain/BuyBitcoin";
import DepositBitcoin from "src/screens/onchain/DepositBitcoin";
import ConnectPeer from "src/screens/peers/ConnectPeer";
import Settings from "src/screens/settings/Settings";
import SignMessage from "src/screens/wallet/SignMessage";

import Peers from "src/screens/peers/Peers";
import { ChangeUnlockPassword } from "src/screens/settings/ChangeUnlockPassword";
import DebugTools from "src/screens/settings/DebugTools";
import Wallet from "src/screens/wallet";

function App() {
  usePosthog();

  const router = createHashRouter([
    {
      path: "/",
      element: <AppLayout />,
      handle: { crumb: () => "Home" },
      children: [
        {
          index: true,
          element: <HomeRedirect />
        },
        {
          path: "wallet",
          element: <DefaultRedirect />,
          handle: { crumb: () => "Wallet" },
          children: [
            {
              index: true,
              element: <Wallet />,
            },
            {
              path: "sign-message",
              element: <SignMessage />

            }
          ]
        },
        {
          path: "settings",
          element: <SettingsLayout />,
          children: [
            {
              index: true,
              element: <Settings />
            },
            {
              path: "change-unlock-password",
              element: <ChangeUnlockPassword />,
            },
            {
              path: "key-backup",
              element: <BackupMnemonic />,
            },
            {
              path: "node-backup",
              element: <BackupNode />,
            }
          ]
        },
        {
          path: "apps",
          element: <DefaultRedirect />,
          handle: { crumb: () => "Connections" },
          children: [
            {
              index: true,
              element: <AppList />
            },

            {
              path: ":pubkey",
              element: <ShowApp />
            },
            {
              path: "new",
              element: <NewApp />,
              handle: { crumb: () => "New App" }
            },
          ]
        },
        {
          path: "appstore",
          element: <DefaultRedirect />,
          handle: { crumb: () => "App Store" },
          children: [
            {
              index: true,
              element: <AppStore />,
              handle: { crumb: () => "App Store" },
            }
          ]
        },
        {
          path: "channels",
          element: <DefaultRedirect />,
          children: [
            {
              index: true,
              element: <Channels />
            },
            {
              path: "new",
              element: <NewChannel />
            },
            {
              path: "order",
              element: <CurrentChannelOrder />
            },
            {
              path: "onchain/buy-bitcoin",
              element: <BuyBitcoin />
            },
            {
              path: "onchain/deposit-bitcoin",
              element: <DepositBitcoin />
            }
          ]
        }, {
          path: "peers",
          element: <DefaultRedirect />,
          children: [
            {
              index: true,
              element: <Peers />
            },
            {
              path: "new",
              element: <ConnectPeer />
            }
          ]
        },
        {
          path: "debug-tools",
          element: <DefaultRedirect />,
          children: [
            {
              index: true,
              element: <DebugTools />
            }
          ]
        },
      ]
    },
    {
      path: "intro",
      element: <Intro />,
    },
    {
      path: "/*",
      element: <NotFound />
    }
  ]);

  return (
    <>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Toaster />
        <RouterProvider router={router} />
        {/* <Routes>
          <Route
            path="/node-backup-success"
            element={<BackupNodeSuccess />}
          />
          <Route element={<TwoColumnFullScreenLayout />}>
            <Route
              path="start"
              element={
                <StartRedirect>
                  <Start />
                </StartRedirect>
              }
            />
            <Route path="/alby/auth" element={<AlbyAuthRedirect />} />
            <Route path="unlock" element={<Unlock />} />
            <Route path="welcome" element={<Welcome />} />
            <Route path="setup" element={<SetupRedirect />}>
              <Route path="" element={<Navigate to="password" replace />} />
              <Route path="password" element={<SetupPassword />} />
              <Route path="node">
                <Route index element={<SetupNode />} />
                <Route path="breez" element={<BreezForm />} />
                <Route path="greenlight" element={<GreenlightForm />} />
                <Route path="ldk" element={<LDKForm />} />
                <Route path="preset" element={<PresetNodeForm />} />
                <Route path="lnd" element={<LNDForm />} />
                <Route path="cashu" element={<CashuForm />} />
                <Route path="phoenix" element={<PhoenixdForm />} />
              </Route>
              <Route path="advanced" element={<SetupAdvanced />} />
              <Route path="import-mnemonic" element={<ImportMnemonic />} />
              <Route path="node-restore" element={<RestoreNode />} />
              <Route path="finish" element={<SetupFinish />} />
            </Route>
            <Route path="onboarding" element={<OnboardingRedirect />}>
              <Route path="lightning">
                <Route path="migrate-alby" element={<MigrateAlbyFunds />} />
              </Route>
              <Route path="success" element={<Success />} />
            </Route>
          </Route>
        </Routes> 
      </HashRouter>*/}
      </ThemeProvider >
    </>
  );
}

export default App;
