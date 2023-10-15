import { addressShortner } from '@/utils/addressShortner';
import React from 'react';
import { ethers } from 'ethers';

const Transaction = ({ block, methodId, to, from, txHash, value }) => {
  return (
    
      <div className="flex gap-3 text-white text-center py-5 px-2 mt-2 bg-[#212121] font-light text-sm font-Poppins rounded-lg hover:bg-[#1e1e1e]">
        <p className="flex-[0.2] text-blue-400 cursor-pointer">
          {txHash.slice(0, 12)}...{txHash.slice(txHash.length - 6)}
        </p>

        <p className="flex-[0.2]">{block}</p>

        <p className="flex-[0.2]">{methodId}</p>

        <p className="flex-[0.2] cursor-pointer hover:text-green-400">
          {from.slice(0, 8)}...{from.slice(from.length - 6)}
        </p>

        <p className="flex-[0.2] cursor-pointer hover:text-yellow-400">
          {to.slice(0, 8)}...{to.slice(to.length - 6)}
        </p>

        <p className="flex-[0.2]  font-semibold">
          <span className="text-green-300">$ </span>
          {ethers.utils.formatEther(value)}{' '}
        </p>
      </div>
  );
};

export default Transaction;
