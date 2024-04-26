"use client";

import { useContext, useEffect, useState } from "react";
import { Button } from "@nextui-org/button";
import { Input, Textarea } from "@nextui-org/react";
import Notiflix from "notiflix";
import type { Capability, SignTransactionOptions } from "sats-connect";
import {
  AddressPurpose,
  BitcoinNetworkType,
  getAddress,
  getCapabilities,
  signTransaction,
} from "sats-connect";
import { type BtcAddress } from "@btckit/types";
import OrdinalCard from "@/app/components/OrdinalCard";
import { _raffleData } from "../../utils/_data";
import { fetchInscriptions } from "../../hooks/use-inscription";

import Checked from "@/app/assets/check.svg";
import Image from "next/image";
import WalletContext from "../../contexts/WalletContext";
import { preCreateRaffle, createRaffle } from "../../hooks/use-raffle";
import { WalletTypes } from "../../utils/utils";

export default function Page() {
  const [ticketPrice, setTicketPrice] = useState("");
  const [ticketAmount, setTicketAmount] = useState("");
  const [ticketDeadline, setTicketDeadline] = useState("");
  // const [sortRaffle, setFilterKey] = useState('all')
  const [raffles, setRaffles] = useState<any[]>([]);
  const [selectedRaffle, setSelectedRaffle] = useState<any>(null);

  const {
    walletType,
    ordinalAddress,
    paymentAddress,
    ordinalPublicKey,
    setWalletType,
    setOrdinalAddress,
    setPaymentAddress,
    setPaymentPublicKey,
    setOrdinalPublicKey,
  } = useContext(WalletContext);

  const isConnected = Boolean(ordinalAddress);

  const handleConnectWallet = async () => {
    const currentWindow: any = window;
    if (typeof currentWindow?.unisat !== "undefined") {
      const unisat: any = currentWindow?.unisat;
      try {
        let accounts: string[] = await unisat.requestAccounts();
        let pubkey = await unisat.getPublicKey();
        Notiflix.Notify.success("Connect succes!");
        setWalletType(WalletTypes.UNISAT);
        setOrdinalAddress(accounts[0] || "");
        setPaymentAddress(accounts[0] || "");
        setOrdinalPublicKey(pubkey);
        setPaymentPublicKey(pubkey);
      } catch (e) {
        Notiflix.Notify.failure("Connect failed!");
      }
    }
  };

  const xverseConnectWallet = async () => {
    await getAddress({
      payload: {
        purposes: [
          AddressPurpose.Ordinals,
          AddressPurpose.Payment,
          AddressPurpose.Stacks,
        ],
        message: "Ordinal Raffle Site",
        network: {
          type: BitcoinNetworkType.Testnet,
        },
      },
      onFinish: (response) => {
        setWalletType(WalletTypes.XVERSE);
        const paymentAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Payment
        );
        setPaymentAddress(paymentAddressItem?.address as string);
        setPaymentPublicKey(paymentAddressItem?.publicKey as string);

        const ordinalsAddressItem = response.addresses.find(
          (address) => address.purpose === AddressPurpose.Ordinals
        );
        setOrdinalAddress(ordinalsAddressItem?.address as string);
        setOrdinalPublicKey(ordinalsAddressItem?.publicKey as string);
      },
      onCancel: () => alert("Request canceled"),
    });
  };

  const leaderConnectWallet = async () => {
    try {
      const currentWindow: any = window;
      const addressesRes = await currentWindow.btc?.request("getAddresses", {});
      const { address, publicKey } = (
        addressesRes as any
      ).result.addresses.find((address: BtcAddress) => address.type === "p2tr");

      const { address: paymentAddress, publicKey: paymentPublickey } = (
        addressesRes as any
      ).result.addresses.find(
        (address: BtcAddress) => address.type === "p2wpkh"
      );

      setWalletType(WalletTypes.HIRO);
      console.log(paymentAddress, paymentPublickey, address, publicKey);
      setPaymentAddress(paymentAddress);
      setPaymentPublicKey(paymentPublickey);
      setOrdinalAddress(address);
      setOrdinalPublicKey(publicKey);
      alert("connected");
    } catch (err) {
      alert("cancelled");
    }
  };

  const handleCreate = async () => {
    if (selectedRaffle) {
      const resp = await preCreateRaffle(
        selectedRaffle?.inscriptionId,
        paymentAddress,
        ordinalPublicKey,
        walletType
      );
      let signedPSBT;
      switch (walletType) {
        case WalletTypes.UNISAT:
          const currentWindow: any = window;
          const unisat: any = currentWindow?.unisat;
          signedPSBT = await unisat.signPsbt(resp.psbtHex);
          break;
        case WalletTypes.XVERSE:
          const signPsbtOptions: SignTransactionOptions = {
            payload: {
              network: {
                type: BitcoinNetworkType.Testnet,
              },
              message: "Sign Transaction",
              psbtBase64: resp.psbtBase64,
              broadcast: false,
              inputsToSign: [
                {
                  address: ordinalAddress,
                  signingIndexes: [0],
                },
              ],
            },
            onFinish: (response: any) => {
              console.log(response);
              signedPSBT = response.psbtBase64;
            },
            onCancel: () => alert("Canceled"),
          };

          await signTransaction(signPsbtOptions);
          break;
        case WalletTypes.HIRO:
          const requestParams = {
            publicKey: ordinalPublicKey,
            hex: resp.psbtHex,
            network: "testnet",

            signAtIndex: [0],
          };
          const result = await window.btc?.request("signPsbt", requestParams);
          signedPSBT = (result as any).result.hex;
      }

      console.log("we are here", signedPSBT);

      const response = await createRaffle({
        ticketPrice: Number(ticketPrice),
        ticketAmounts: Number(ticketAmount),
        endTime: 60 * Number(ticketDeadline),
        ordinalInscription: selectedRaffle?.inscriptionId,
        creatorOrdinalAddress: ordinalAddress,
        creatorPaymentAddress: paymentAddress,
        psbt: resp.psbtHex,
        signedPSBT,
        walletType,
      });
      console.log(response);
      Notiflix.Notify.success("Raffle Created");
    } else {
      Notiflix.Notify.failure("Please Select Raffle");
    }
  };

  const getInscriptions = async () => {
    const inscriptions = await fetchInscriptions(ordinalAddress);
    const allInscriptions = inscriptions?.data?.inscription;
    if (allInscriptions) {
      setRaffles(allInscriptions.filter((item: any) => item.brc20 === null));
    }
  };

  useEffect(() => {
    ordinalAddress && getInscriptions();
  }, [ordinalAddress]);

  const handleClick = (raffle: any) => {
    if (selectedRaffle === raffle) {
      setSelectedRaffle(null);
    } else {
      setSelectedRaffle(raffle);
    }
  };

  return (
    <div className="p-2 px-10">
      {isConnected ? <></> : (
        <div className="flex flex-col gap-2 justify-center items-center">
          Plz connect wallet first
        </div>
      )}
      {isConnected && (

        <div>
          <p className="font-bold text-2xl mb-10 text-center">Create new NFT Raffle</p>
          <div className="flex flex-col gap-10  min-[1440px]:w-2/3 min-[1200px]:w-3/4 mx-auto">
            <div className="flex flex-col">
              <>
                <p className="font-bold mb-2">Select NFT from wallet <span className="text-red-500">*</span></p>
                <p className="py-2">NFT needs to be verified on MagicEden and will be transferred to a vault so it will be sent out after the raffle ends</p>
                <div className="flex flex-wrap justify-start gap-5 p-5 mx-10 rounded-xl border border-gray-200 h-[400px] overflow-auto">
                  {raffles.map((raffle: any, index: number) => {
                    const checked = selectedRaffle === raffle;
                    return (
                      <div
                        key={index}
                        onClick={() => handleClick(raffle)}
                        className={`relative rounded-lg w-32`}
                      >
                        {checked && (
                          <div className="absolute top-0 left-0 z-10 w-full h-full rounded-lg">
                            <div className="w-full h-full bg-slate-800 opacity-50 rounded-lg"></div>
                            <Image
                              className="absolute -top-2 -right-2"
                              src={Checked}
                              width={20}
                              height={20}
                              alt="raffle"
                            />
                          </div>
                        )}
                        <OrdinalCard ordinal={raffle} />
                      </div>
                    );
                  })}
                </div>
                <p className="">Select a NFT you want to raffle</p>
              </>
              <>
                <div className="flex flex-col gap-2 mt-5">
                  <p className="font-bold py-2">Tips for hosting raffles</p>
                  <div className="flex flex-row gap-2 rounded-xl bg-gray-200 p-4">
                    <p className="">💡</p>
                    <p className="">For best results, ideally pick an <b>NFT that's hyped</b> and <b>where an active community is behind</b> that can be engaged
                    </p>
                  </div>
                  <div className="flex flex-row gap-2 rounded-xl bg-gray-200 p-4">
                    <p className="">✌️</p>
                    <p className="">Set the <b>total ticket value to 108-119% of the NFT's floor price</b> for the best results. If your ask is too high, lots of people refuse to enter. Charging in the 108-119% range gives <b>raffle buyers great odds</b> and your raffle is <b>more likely to sell out.</b>
                    </p>
                  </div>
                  <div className="flex flex-row gap-2 rounded-xl bg-gray-200 p-4">
                    <p className="chakra-text css-13a2uhn">👐</p>
                    <p className="chakra-text css-bhhhcu">
                      Selecting communities can give you <b>additional reach 📢</b><br /><br />Your raffle will be
                      <br />1. featured on the raffle sites of selected communities and
                      <br />2. posted into the Discord of the community if they have it activated.
                      <br /><br />The selected community <b>will benefit by receiving a revenue share</b> of Monet's fees
                    </p>
                  </div>
                </div>
              </>
            </div>
            <div className="flex flex-col">
              <div className="flex flex-row gap-5">
                <div className="flex flex-col w-1/3">
                  <p className="font-bold pb-2 pl-2">Deadline ( mins )</p>
                  <Input
                    placeholder="100"
                    value={ticketDeadline}
                    onChange={(e) => setTicketDeadline(e.target.value)}
                  />
                </div>
                <div className="flex flex-col w-1/3">
                  <p className="font-bold pb-2 pl-2">Ticket Price</p>
                  <Input
                    placeholder="0.005"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                  />
                </div>
                <div className="flex flex-col w-1/3">
                  <p className="font-bold pb-2 pl-2">Ticket Amount</p>
                  <Input
                    placeholder="60"
                    value={ticketAmount}
                    onChange={(e) => setTicketAmount(e.target.value)}
                  />
                </div>
                <div className="mt-8">
                  <Button color="primary" onClick={() => handleCreate()} variant="ghost">Create</Button>
                </div>
              </div>
              <div className="flex flex-col gap-2 mt-10 ">
                <p className="font-bold">Description (optional)</p>
                <Textarea
                  isRequired
                  labelPlacement="outside"
                  placeholder="Enter your description"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
