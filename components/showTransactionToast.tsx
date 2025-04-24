import { toast } from "sonner"

export function showTransactionToast(digest: string) {
  toast.success(
    <div>
      <p className="font-semibold mb-1">Transaction Submitted!</p>
      <a
        href={`https://suiexplorer.com/txblock/${digest}?network=testnet`}
        className="text-blue-600 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Sui Explorer
      </a>
    </div>,
    {
      duration: 30_000, // Toast stays for 30 seconds
    }
  )
}
