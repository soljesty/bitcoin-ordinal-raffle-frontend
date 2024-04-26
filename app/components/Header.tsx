"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { pages } from "../utils/_data";
import WalletConnectIcon from "./Icon/WalletConnectIcon";

import { Navbar, NavbarBrand, NavbarMenuToggle, NavbarMenuItem, NavbarMenu, NavbarContent, NavbarItem, Link, Button } from "@nextui-org/react";
import { AcmeLogo } from "./AcmeLogo";

import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";

import { useContext, useEffect, useState } from "react";
import { Input } from "@nextui-org/react";
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

import Checked from "@/app/assets/check.svg";
import Image from "next/image";
import WalletContext from "../contexts/WalletContext";
import { preCreateRaffle, createRaffle } from "../hooks/use-raffle";
import { WalletTypes } from "../utils/utils";

import { FiPlusCircle } from "react-icons/fi";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [pageIndex, setPageIndex] = React.useState(-1);
  const router = useRouter();
  const gotoPage = (route: string, index: number) => {
    console.log('pageIndex ==> ', index);
    setPageIndex(index);
    router.push(route);
  };

  const { isOpen, onOpen, onClose } = useDisclosure();

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

  return (
    <div className="p-3 flex gap-3">
      <Navbar
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
        maxWidth="full"
      >
        <NavbarContent className="sm:hidden" justify="start">
          <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
        </NavbarContent>

        <NavbarContent className="sm:hidden pr-3" justify="center">
          <NavbarBrand
            onClick={() => router.push('/')}
            className="cursor-pointer"
          >
            <AcmeLogo />
            <p className="font-bold text-inherit">Humanz</p>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarBrand
            onClick={() => router.push('/')}
            className="cursor-pointer"
          >
            <AcmeLogo />
            <p className="font-bold text-inherit">Humanz</p>
          </NavbarBrand>
          {pages.map((page, index) => (
            <NavbarItem key={`NavbarItem-${index}`}>
              <div
                onClick={() => gotoPage(page.route, index)}
                key={`div-${index}`}
                className={`cursor-pointer ${pageIndex === index ? 'text-red-500' : 'text-black'}`}
              >
                {page.label}
              </div>
            </NavbarItem>))}
        </NavbarContent>

        <NavbarContent justify="end" className="gap-10">
          <NavbarItem 
            className="flex flex-row gap-2 justify-center items-center cursor-pointer hover:text-gray-400"
            onClick={() => router.push('/pages/create-raffle')}
          >
            <FiPlusCircle />
            <p>Create Raffle</p>
          </NavbarItem>
          <NavbarItem>
            <Button
              color="warning"
              variant="flat"
              onPress={() => onOpen()}
              className="capitalize"
            >
              <WalletConnectIcon />
              {ordinalAddress ? <p className="truncate w-28">{ordinalAddress}</p> : 'Connect Wallet'}
            </Button>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu>
          {pages.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <div
                onClick={() => gotoPage(item.route, index)}
                key={`div-${index}`}
                className={`cursor-pointer ${pageIndex === index ? 'text-red-500' : 'text-black'}`}
              >
                {item.label}
              </div>
            </NavbarMenuItem>
          ))}
        </NavbarMenu>
      </Navbar>
      <Modal
        backdrop='blur'
        isOpen={isOpen}
        onClose={onClose}
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            }
          }
        }}
        classNames={{
          body: "py-6",
          backdrop: "bg-[#292f46]/50 backdrop-opacity-40",
          base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
          header: "border-b-[1px] border-[#292f46]",
          footer: "border-t-[1px] border-[#292f46]",
          closeButton: "hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-center">Connect Wallet</ModalHeader>
              <ModalBody>
                <div className="p-2 pb-10">
                  <div className="flex flex-col gap-5 justify-center items-center">
                    <Button onClick={() => handleConnectWallet()} color="primary" variant="bordered">
                      Unisat Wallet Connect
                    </Button>
                    <Button onClick={() => xverseConnectWallet()} color="primary" variant="bordered">
                      XVerse Wallet Connect
                    </Button>
                    <Button onClick={() => leaderConnectWallet()} color="primary" variant="bordered">
                      Leader Wallet Connect
                    </Button>
                  </div>
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div >
  );
};

export default Header;
