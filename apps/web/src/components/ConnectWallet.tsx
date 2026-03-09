"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNetworkGuard } from "@/hooks/useNetworkGuard";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isWrongNetwork, isSwitching, switchToFuji, expectedChainName } =
    useNetworkGuard();

  if (isConnected && isWrongNetwork) {
    return (
      <Button
        size="sm"
        variant="destructive"
        onClick={switchToFuji}
        disabled={isSwitching}
        className="text-xs font-semibold"
      >
        {isSwitching ? (
          <>
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Switching...
          </>
        ) : (
          <>
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
            Switch to {expectedChainName}
          </>
        )}
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => disconnect()}
        className="font-mono text-xs"
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      className="btn-glow border-0 text-sm font-semibold text-primary-foreground"
      onClick={() => {
        const connector = connectors[0];
        if (connector) {
          connect({ connector });
        }
      }}
    >
      Connect Wallet
    </Button>
  );
}
