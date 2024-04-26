import { NextRequest } from "next/server";
import qs from "qs";

export async function POST(request: NextRequest) {
  try {
    const {
      buyerPayPubkey,
      buyerOrdinalAddress,
      buyerOrdinalPubkey,
      ticketCounts,
      _id,
      walletType,
    } = await request.json();
    const axios = require("axios");

    let config = {
      method: "post",
      url: `${process.env.NEXT_PUBLIC_BACKEND}/api/raffle/buy-tickets`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      data: qs.stringify({
        buyerPayPubkey,
        buyerOrdinalAddress,
        buyerOrdinalPubkey,
        ticketCounts,
        _id,
        walletType,
      }),
    };

    const response = await axios.request(config);

    return Response.json(response.data);
  } catch (error) {
    console.error("Error creating user: ", error);
    return Response.json({ message: "Failed to create user" }, { status: 409 });
  }
}
