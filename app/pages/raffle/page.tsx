"use client";

import { useState, useEffect } from "react";
import { RaffleProps } from "@/app/utils/_type";
import { _raffleData } from "@/app/utils/_data";
import RaffleCard from "@/app/components/RaffleCard";
import Link from "next/link";
import { fetchRaffles } from "@/app/hooks/use-raffle";

const Page = () => {
  const [raffles, setRaffles] = useState([]);

  const getRaffles = async () => {
    const resp = await fetchRaffles();
    setRaffles(resp.raffles);
  };

  useEffect(() => {
    getRaffles();
  }, []);

  return (
    <div className="grid gap-3 p-3">
      <div>Public Raffle</div>
      
      <div className="grid grid-cols-4 gap-3">
        {raffles.map((raffle: RaffleProps, index: number) => (
          <Link key={index} href={`/pages/raffle/${raffle.ordinalInscription}`}>
            <RaffleCard raffle={raffle} />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Page;
