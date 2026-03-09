"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

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
