import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Code from '@/components/Address/Code';
import ABIComp from '@/components/Address/ABIComp';
import ReadAll from '@/components/Read/ReadAll';
import WriteAll from '@/components/Write/WriteAll';
import AddressComp from '@/components/Address/Address';
import Details from '@/components/Address/Details';
import {
  readContractSimilar,
  readContractDifferent,
  readChainRecord,
} from '../../polybase/queries';
import Loader from '@/components/Loader/Loader';
import TransactionAll from '@/components/Transaction/TransactionAll';
import { useWalletClient } from 'wagmi';
import {
  optimisticVerificationContract,
  optimisticVerificationABI,
} from '@/constants';
import Multichains from '@/components/Address/Multichains';
import { BsInfo, BsInfoCircle } from 'react-icons/bs';
import { getContract } from 'wagmi/actions';

const Address = () => {
  const router = useRouter();
  const { address } = router.query;

  // const [showCode, setShowCode] = useState(true);
  // const [showWrite, setShowWrite] = useState(false);
  // const [showRead, setShowRead] = useState(false);
  // const [showAbi, setShowAbi] = useState(false);

  const [showCode, setShowCode] = useState(true);
  const [showWrite, setShowWrite] = useState(false);
  const [showRead, setShowRead] = useState(false);
  const [showAbi, setShowAbi] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);
  const [showTransaction, setShowTransaction] = useState(false);
  const [contractData, setContractData] = useState([]);
  const [alternateContracts, setAlternateContract] = useState([]);
  const [contractInformation, setContractInformation] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { data: signer } = useWalletClient();
  // const contract = getContract({
  //   address: optimisticVerificationContract,
  //   abi: optimisticVerificationABI,
  //   walletClient: signer,
  // });
  const [isSettled, setIsSettled] = useState(null);
  const [differentAddress, setDifferentAddress] = useState(false);

  const { chain } = router.query;

  const getData = async () => {
    try {
      //get the data of the current address first
      const contractRecord = await readContractSimilar(address);
      console.log('record', contractRecord);

      const check = new RegExp(router.query.chain, 'gi');
      const data = [
        {
          title: 'Name',
          value: contractRecord?.data?.name,
        },
        {
          title: 'Description',
          value: contractRecord?.data?.description,
        },
        {
          title: 'Owner',
          value: contractRecord?.data?.owner,
        },
        {
          title: 'Current Chain',
          value: chain.toUpperCase(),
        },
        {
          title: 'Balance',
          value: '$102.34',
        },
      ];
      const alternate = [];
      for (let chain of contractRecord.data.chains) {
        if (check.test(chain)) {
          setIsDeployed(true);
        }
        let obj = {
          title: chain,
          value: contractRecord.data.id,
        };

        alternate.push(obj);
      }
      setContractData(data);
      setAlternateContract(alternate);
      setContractInformation(contractRecord);
      setIsLoading(false);
    } catch (err) {
      if (err == 'Error: record/not-found error') {
        try {
          const contractData = await readChainRecord(address);

          const contractId = contractData.data.contractId;

          const contractRecord = await readContractDifferent(contractId);

          const data = [
            {
              title: 'Name',
              value: contractRecord?.data?.name,
            },
            {
              title: 'Description',
              value: contractRecord?.data?.description,
            },
            {
              title: 'Owner',
              value: contractRecord?.data?.owner,
            },
            {
              title: 'Current Chain',
              value: contractData?.data?.name,
            },
            {
              title: 'Balance',
              value: '$102.34',
            },
          ];

          let otherChains = [];
          if (contractRecord) {
            //then get data of each contract from their reference
            for (let otherChain of contractRecord?.data?.chains) {
              let singleChainData = await readChainRecord(otherChain?.id);
              otherChains.push({
                title: singleChainData?.data?.name,
                value: singleChainData?.data?.address,
              });
            }
          }
          const check = new RegExp(router.query.chain, 'gi');
          otherChains.map((singleChain) => {
            if (check.test(singleChain.title)) {
              setIsDeployed(true);
            }
          });

          if (
            contractRecord?.data?.isUMA === true &&
            contractRecord?.data?.isSettled === false
          ) {
            console.log('here');
            setIsSettled(false);
          } else {
            setIsSettled(true);
          }
          setDifferentAddress(true);
          setContractData(data);
          setAlternateContract(otherChains);
          setContractInformation(contractRecord);
          setIsLoading(false);
        } catch (err) {}
      }
    }
  };

  //useEffect will fetch the contract from polybase using the contract address
  useEffect(() => {
    if (address) {
      (async function () {
        setIsLoading(false);
        await getData();
      })();
    }
  }, [address, chain]);

  const showUmaAddresses = () => {};

  const showReadHandler = () => {
    setShowCode(false);
    setShowWrite(false);
    setShowAbi(false);
    setShowTransaction(false);

    setShowRead(true);
  };

  const showWriteHandler = () => {
    setShowCode(false);
    setShowAbi(false);
    setShowRead(false);
    setShowTransaction(false);

    setShowWrite(true);
  };

  const showCodeHandler = () => {
    setShowRead(false);
    setShowAbi(false);
    setShowWrite(false);
    setShowTransaction(false);

    setShowCode(true);
  };

  const showAbiHandler = () => {
    setShowCode(false);
    setShowRead(false);
    setShowWrite(false);
    setShowTransaction(false);

    setShowAbi(true);
  };

  const showTransactionHandler = () => {
    setShowCode(false);
    setShowRead(false);
    setShowWrite(false);
    setShowAbi(false);
    setShowTransaction(true);
  };

  return (
    <section className='bg-[#111111] min-h-screen py-4'>
      {!isDeployed || isLoading ? (
        <Loader />
      ) : (
        <>
          <AddressComp address={address} />

          <div className='flex mx-8 gap-3 mt-4'>
            {contractData.length > 0 && (
              <Details
                data={contractData}
                heading='Contract details'
              />
            )}

            {/* {show if UMA boolean is true} */}
            {alternateContracts.length > 0 && differentAddress === true && (
              <div className='flex-[0.5] '>
                <Details
                  data={alternateContracts}
                  address={address}
                  heading='Deployed on other chains'
                  isAddress={true}
                />
                {!isSettled && (
                  <div className='flex justify-between items-center'>
                    <p className='text-yellow-400 flex items-center gap-3 ml-2 '>
                      <BsInfoCircle /> The contract is not verified yet!
                    </p>

                    <button
                      onClick={() => {
                        // settle logic here
                      }}
                      className='py-1 px-4 rounded-md bg-yellow-600 text-white'>
                      Settle
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* {show if uma Boolean is false} */}
            {alternateContracts.length > 0 &&
              differentAddress === false &&
              isSettled === null && (
                <Multichains alternateContracts={alternateContracts} />
              )}
          </div>

          <div className='bg-[#171717] py-4 px-3 mx-8 mt-4 rounded-md'>
            {/* Buttons */}
            <div className='flex gap-4'>
              <p
                onClick={showTransactionHandler}
                className={`w-[120px] text-center py-2 rounded-md ${
                  showTransaction
                    ? 'bg-[#424242]'
                    : 'bg-[#242424] hover:bg-[#424242]'
                } text-white cursor-pointer`}>
                Transactions
              </p>
              <p
                onClick={showReadHandler}
                className={`w-[100px] text-center py-2 rounded-md ${
                  showRead ? 'bg-[#424242]' : 'bg-[#242424] hover:bg-[#424242]'
                }   text-white cursor-pointer`}>
                Read
              </p>
              <p
                onClick={showWriteHandler}
                className={`w-[100px] text-center py-2 rounded-md ${
                  showWrite ? 'bg-[#424242]' : 'bg-[#242424] hover:bg-[#424242]'
                } text-white cursor-pointer`}>
                Write
              </p>
              <p
                onClick={showCodeHandler}
                className={`w-[100px] text-center py-2 rounded-md ${
                  showCode ? 'bg-[#424242]' : 'bg-[#242424] hover:bg-[#424242]'
                } text-white cursor-pointer`}>
                Code
              </p>
              <p
                onClick={showAbiHandler}
                className={`w-[100px] text-center py-2 rounded-md ${
                  showAbi ? 'bg-[#424242]' : 'bg-[#242424] hover:bg-[#424242]'
                } text-white cursor-pointer`}>
                ABI
              </p>
            </div>

            {/* pass transactions arr */}
            {showTransaction && contractInformation && <TransactionAll />}

            {showCode && contractInformation && (
              <Code code={contractInformation?.data?.contractCode} />
            )}

            {showRead && contractInformation && (
              <ReadAll abi={contractInformation?.data?.abi} />
            )}

            {showWrite && contractInformation && (
              <WriteAll abi={contractInformation?.data?.abi} />
            )}

            {showAbi && contractInformation && (
              <ABIComp AbiToString={contractInformation?.data?.abi} />
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default Address;
