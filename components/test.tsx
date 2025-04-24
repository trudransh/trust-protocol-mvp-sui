'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useCreateProfile } from '@/hooks/use-protocol';

export default function Home() {
  const currentAccount = useCurrentAccount();
  const createProfile = useCreateProfile();

  const handleTestTransaction = async () => {
    // Check if wallet is connected first
    if (!currentAccount) {
      alert('Please connect your wallet first to send a transaction');
      return;
    }

    try {
      // Hardcoded profile name
      await createProfile.mutateAsync('TestUser');
      alert('Transaction successfully sent!');
    } catch (error) {
      console.error('Transaction error:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Trust Protocol Demo</h1>
      
      <div className="text-center py-10">
        <h2 className="text-xl mb-6">Test Wallet Transaction</h2>
        
        <button
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-lg shadow-md"
          onClick={handleTestTransaction}
          disabled={createProfile.isPending}
        >
          {createProfile.isPending ? 'Processing...' : 'Send Test Transaction'}
        </button>
        
        {currentAccount && (
          <p className="mt-2 text-sm text-gray-600">
            Connected: {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
          </p>
        )}
        
        {createProfile.isError && (
          <p className="text-red-500 mt-4">
            Error: {createProfile.error instanceof Error ? createProfile.error.message : 'Unknown error'}
          </p>
        )}
      </div>
    </main>
  );
}